import fs from 'node:fs';
import path from 'node:path';
import { loadRun, rel } from './util.mjs';

const STEPS = [
  ['plan.statements.json', 'plan segmented'],
  ['census.json', 'census taken'],
  ['behaviours.json', 'behaviours extracted and collected'],
  ['results.json', 'scenarios executed'],
  ['census.coverage.json', 'census coverage checked'],
  ['trace.json', 'tracer output'],
  ['adversary.json', 'adversary output'],
  ['trace.checked.json', 'trace checked'],
  ['probes.json', 'reverse probes written'],
  ['probes.results.json', 'reverse probes executed'],
  ['loo/control.json', 'leave-one-out'],
  ['leak.json', 'leak check'],
  ['delta.md', 'delta rendered'],
];

export function status(args) {
  const { proj, runDir, meta } = loadRun(args);
  const steps = STEPS.map(([f, label]) => ({ step: label, file: rel(proj, path.join(runDir, f)), done: fs.existsSync(path.join(runDir, f)) }));
  process.stdout.write(JSON.stringify({ run_id: meta.run_id, plan: meta.plan_path, base: meta.base, room_root: meta.room_root, nonce: meta.nonce, steps }, null, 2) + '\n');
}
