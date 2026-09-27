// sd init: create a run, segment the plan, build the clean room, take the census.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { STATE_DIR, writeJson, sha256, fail, projectDir, rel, splitGlobs } from './util.mjs';
import { segmentPlan } from './segment.mjs';
import { buildCleanroom } from './cleanroom.mjs';
import { takeCensus } from './census.mjs';

export const DEFAULT_INCLUDE = 'src/**/*.{ts,tsx,mts,cts,js,jsx,mjs,cjs}';
export const DEFAULT_EXCLUDE = [
  '**/*.test.*', '**/*.spec.*', '**/__tests__/**', '**/__mocks__/**',
  '**/*.d.ts', '**/*.stories.*', '**/test/**', '**/tests/**',
];

export function init(args) {
  const proj = projectDir(args);
  if (!args.plan) fail('usage: sd init --plan <plan.md> [--include <glob>] [--exclude <glob,glob>] [--base <git-ref>]');
  const planPath = path.resolve(proj, String(args.plan));
  if (!fs.existsSync(planPath)) fail(`plan not found: ${planPath}`);

  const state = path.join(proj, STATE_DIR);
  const stamp = new Date().toISOString().replace(/[-:]/g, '').replace(/\..*/, '');
  const runId = `${stamp}-${crypto.randomBytes(3).toString('hex')}`;
  const runDir = path.join(state, 'runs', runId);
  const roomRoot = path.resolve(args['room-dir'] ? String(args['room-dir']) : path.join(state, 'room', runId));
  fs.mkdirSync(runDir, { recursive: true });
  fs.mkdirSync(path.join(roomRoot, 'out'), { recursive: true });

  // Keep runs and rooms out of version control; the ledger and signed tests stay tracked.
  const gi = path.join(state, '.gitignore');
  if (!fs.existsSync(gi)) fs.writeFileSync(gi, 'runs/\nroom/\ncurrent.json\n');

  const planText = fs.readFileSync(planPath, 'utf8');
  const ledgerPath = path.join(state, 'decisions.md');
  const ledgerText = fs.existsSync(ledgerPath) ? fs.readFileSync(ledgerPath, 'utf8') : '';

  const include = splitGlobs(args.include || DEFAULT_INCLUDE);
  const exclude = DEFAULT_EXCLUDE.concat(args.exclude ? splitGlobs(args.exclude) : []);

  const meta = {
    run_id: runId,
    created_at: new Date().toISOString(),
    project: proj,
    plan_path: rel(proj, planPath),
    plan_sha256: sha256(planText),
    ledger_sha256: ledgerText ? sha256(ledgerText) : null,
    include, exclude,
    base: args.base ? String(args.base) : null,
    room_root: roomRoot,
    // Self-test for context isolation: this string is known to the orchestrating
    // conversation and never placed in the clean room. If the extractor reports it, the run is contaminated.
    nonce: 'SDN-' + crypto.randomBytes(6).toString('hex'),
    cap: Number(args.cap || 25),
  };
  writeJson(path.join(runDir, 'run.json'), meta);
  // Frozen copy so later steps quote against exactly what was traced.
  fs.writeFileSync(path.join(runDir, 'plan.md'), planText);
  if (ledgerText) fs.writeFileSync(path.join(runDir, 'decisions.md'), ledgerText);

  const statements = segmentPlan(planText, ledgerText);
  writeJson(path.join(runDir, 'plan.statements.json'), statements);

  const room = buildCleanroom({ proj, roomRoot, include, exclude });
  writeJson(path.join(runDir, 'cleanroom.manifest.json'), room);

  const census = takeCensus({ proj, cleanroomDir: path.join(roomRoot, 'cleanroom'), files: room.files.map((f) => f.path) });
  writeJson(path.join(runDir, 'census.json'), census);
  writeJson(path.join(roomRoot, 'census.json'), census); // the extractor may see it: it is derived from code only

  writeJson(path.join(state, 'current.json'), { run_id: runId, run_dir: runDir, room_root: roomRoot });

  const summary = {
    run_id: runId,
    run_dir: rel(proj, runDir),
    room_root: roomRoot,
    plan_statements: statements.length,
    cleanroom_files: room.files.length,
    comments_stripped: room.comments_stripped,
    census_items: census.length,
    nonce: meta.nonce,
  };
  process.stdout.write(JSON.stringify(summary, null, 2) + '\n');
}
