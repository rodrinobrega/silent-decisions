import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const { auditTranscript } = await import(path.join(root, 'skills/silent-decisions/scripts/lib/checks.mjs'));

// Run 002 regression: without the confinement hook, a "suspect" leak check (a phrase the prompt itself
// invites) could only be cleared by reading the extractor's session transcript by hand.
function session(events) {
  const projects = fs.mkdtempSync(path.join(os.tmpdir(), 'sd-transcripts-'));
  const cwd = '/private/var/folders/xx/T/sd-room-AbC123';
  const dir = path.join(projects, cwd.replace(/[^a-zA-Z0-9]/g, '-'));
  fs.mkdirSync(dir, { recursive: true });
  const lines = events.map(([type, body], i) => JSON.stringify({ timestamp: '2026-09-27T13:03:20Z', cwd, message: { content: [type === 'use' ? { type: 'tool_use', id: `t${i}`, ...body } : { type: 'tool_result', tool_use_id: `t${i - 1}`, content: body }] } }));
  fs.writeFileSync(path.join(dir, 's.jsonl'), lines.join('\n') + '\n');
  return auditTranscript({ cwd, cwd_as_created: '/var/folders/xx/T/sd-room-AbC123', started: '2026-09-27T13:03:17Z' }, { projectsDir: projects });
}

test('transcript audit: a session confined to its room is clean, and denied calls are counted', () => {
  const a = session([
    ['use', { name: 'Read', input: { file_path: '/private/var/folders/xx/T/sd-room-AbC123/cleanroom/src/ledger.ts' } }],
    ['res', 'export class Ledger {}'],
    ['use', { name: 'Bash', input: { command: 'cd /var/folders/xx/T/sd-room-AbC123; find . -type f' } }],
    ['res', './census.json'],
    ['use', { name: 'Bash', input: { command: 'node -e "1"' } }],
    ['res', 'This command requires approval'],
  ]);
  assert.equal(a.found, true);
  assert.equal(a.calls, 3);
  assert.equal(a.plan_mentions, 0);
  assert.deepEqual(a.outside_room, []);
  assert.equal(a.denied, 1);
});

test('transcript audit: reading the plan or leaving the room is caught', () => {
  const a = session([
    ['use', { name: 'Read', input: { file_path: '/Users/me/project/plan.md' } }],
    ['res', 'the plan'],
    ['use', { name: 'Bash', input: { command: 'cat ../../README.md' } }],
    ['res', 'readme'],
  ]);
  assert.ok(a.plan_mentions > 0);
  assert.equal(a.outside_room.length, 2);
});

test('transcript audit: a missing transcript is reported, not treated as clean', () => {
  const a = auditTranscript({ cwd: '/nowhere/sd-room-zz' }, { projectsDir: fs.mkdtempSync(path.join(os.tmpdir(), 'sd-empty-')) });
  assert.equal(a.found, false);
});

test('run 004 regression: relative paths that stay in the room, and file contents, are not escapes', () => {
  const room = '/private/var/folders/xx/T/sd-room-AbC123';
  const a = session([
    ['use', { name: 'Write', input: { file_path: `${room}/out/gen.js`, content: "const c = require('../census.json'); const p = '/Users/me/elsewhere';" } }],
    ['res', 'File created'],
    ['use', { name: 'Bash', input: { command: `cd ${room}/out && node -e "require('../census.json')"` } }],
    ['res', 'ok'],
    ['use', { name: 'Bash', input: { command: `cd ${room}/cleanroom/src && cat ../../census.json` } }],
    ['res', 'ok'],
  ]);
  assert.deepEqual(a.outside_room, []);
  const b = session([
    ['use', { name: 'Bash', input: { command: `cd ${room}/out && cat ../../../plan.md` } }],
    ['res', 'the plan'],
    ['use', { name: 'Bash', input: { command: 'cd /Users/me/project && ls' } }],
    ['res', 'plan.md'],
  ]);
  assert.equal(b.outside_room.length, 2, 'climbing out of the room, or cd elsewhere, is still caught');
});
