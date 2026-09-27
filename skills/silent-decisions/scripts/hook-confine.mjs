#!/usr/bin/env node
// PreToolUse hook. Confines the blind extractor to its room and records every call it makes.
// Every other agent, and the main conversation, passes through untouched.
//
// Allowlist, not denylist: the extractor may read under <room_root> and write under
// <room_root>/out. Everything else is denied, whatever the tool.
import fs from 'node:fs';
import path from 'node:path';

const EXTRACTOR = /(^|:)sd-extractor$/;
const READ_TOOLS = { Read: 'file_path', Glob: 'path', Grep: 'path', LS: 'path', NotebookRead: 'notebook_path' };
const WRITE_TOOLS = { Write: 'file_path', Edit: 'file_path' };

function realpathSafe(p) {
  let cur = path.resolve(p);
  const tail = [];
  while (!fs.existsSync(cur)) {
    tail.unshift(path.basename(cur));
    const parent = path.dirname(cur);
    if (parent === cur) break;
    cur = parent;
  }
  try { cur = fs.realpathSync(cur); } catch { /* keep */ }
  return path.join(cur, ...tail);
}
const inside = (root, p) => { const r = path.relative(root, p); return r === '' || (!r.startsWith('..') && !path.isAbsolute(r)); };

function decide(input, room) {
  const tool = input.tool_name;
  const ti = input.tool_input || {};
  const field = READ_TOOLS[tool] || WRITE_TOOLS[tool];
  if (!field) return { decision: 'deny', target: null, reason: `${tool} is not available to the extractor. Use Read, Glob, Grep and Write only.` };
  const raw = ti[field];
  if (!raw) return { decision: 'deny', target: null, reason: `${tool} needs an explicit ${field} inside ${room}.` };
  // Relative paths resolve against the session cwd, which is the project, not the room.
  const target = realpathSafe(path.isAbsolute(raw) ? raw : path.resolve(input.cwd || process.cwd(), raw));
  const root = WRITE_TOOLS[tool] ? path.join(room, 'out') : room;
  if (!inside(root, target)) {
    return { decision: 'deny', target, reason: `Outside your working area. ${WRITE_TOOLS[tool] ? 'Write only under' : 'Read only under'} ${root}.` };
  }
  return { decision: 'allow', target };
}

let raw = '';
process.stdin.setEncoding('utf8');
process.stdin.on('data', (d) => { raw += d; });
process.stdin.on('end', () => {
  let input;
  try { input = JSON.parse(raw); } catch { process.exit(0); }
  if (!EXTRACTOR.test(String(input.agent_type || ''))) process.exit(0);

  const proj = process.env.CLAUDE_PROJECT_DIR || input.cwd || process.cwd();
  let cur;
  try { cur = JSON.parse(fs.readFileSync(path.join(proj, '.silent-decisions', 'current.json'), 'utf8')); } catch { cur = null; }

  let verdict;
  if (!cur) verdict = { decision: 'deny', target: null, reason: 'No active silent-decisions run; the extractor has no room to work in.' };
  else verdict = decide(input, realpathSafe(cur.room_root));

  if (cur) {
    try {
      fs.appendFileSync(path.join(cur.run_dir, 'audit.jsonl'), JSON.stringify({
        at: new Date().toISOString(), agent_id: input.agent_id || null, agent_type: input.agent_type,
        tool: input.tool_name, target: verdict.target, decision: verdict.decision,
      }) + '\n');
    } catch { /* logging must never break the run */ }
  }
  if (verdict.decision === 'deny') {
    process.stdout.write(JSON.stringify({ hookSpecificOutput: { hookEventName: 'PreToolUse', permissionDecision: 'deny', permissionDecisionReason: verdict.reason } }));
  }
  // On allow: say nothing, so the normal permission flow still applies.
  process.exit(0);
});
