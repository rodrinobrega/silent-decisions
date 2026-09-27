// End-to-end test of the deterministic scripts, using fixture outputs in place of the model stages.
// Requires the example's dev dependencies: (cd examples/ledger && npm install).
import { test, before } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SD = path.join(root, 'skills/silent-decisions/scripts/sd.mjs');
const HOOK = path.join(root, 'skills/silent-decisions/scripts/hook-confine.mjs');
const example = path.join(root, 'examples/ledger');
let proj;

const sd = (...args) => {
  const r = spawnSync('node', [SD, ...args], { cwd: proj, encoding: 'utf8' });
  return { code: r.status, out: r.stdout, err: r.stderr, json: (() => { try { return JSON.parse(r.stdout); } catch { return null; } })() };
};
const git = (...a) => spawnSync('git', ['-c', 'user.email=t@t', '-c', 'user.name=t', ...a], { cwd: proj, encoding: 'utf8' });
const cur = () => JSON.parse(fs.readFileSync(path.join(proj, '.silent-decisions/current.json'), 'utf8'));

before(() => {
  assert.ok(fs.existsSync(path.join(example, 'node_modules/.bin/vitest')), 'run `npm install` in examples/ledger first');
  proj = fs.mkdtempSync(path.join(os.tmpdir(), 'sd-test-'));
  fs.cpSync(path.join(example, 'src'), path.join(proj, 'src'), { recursive: true });
  fs.copyFileSync(path.join(example, 'plan.md'), path.join(proj, 'plan.md'));
  fs.copyFileSync(path.join(example, 'package.json'), path.join(proj, 'package.json'));
  fs.symlinkSync(path.join(example, 'node_modules'), path.join(proj, 'node_modules'), 'dir');
  fs.writeFileSync(path.join(proj, '.gitignore'), 'node_modules\n.silent-decisions\n');
  // Base commit: the ledger before the daily limit existed.
  const head = fs.readFileSync(path.join(proj, 'src/ledger.ts'), 'utf8');
  const base = head.replace(/^.*daily-limit.*\n/m, '');
  assert.notEqual(base, head);
  fs.writeFileSync(path.join(proj, 'src/ledger.ts'), base);
  git('init', '-q'); git('add', '.'); git('commit', '-qm', 'base');
  fs.writeFileSync(path.join(proj, 'src/ledger.ts'), head);
  git('commit', '-qam', 'head');
});

test('init: segments the plan, strips comments, excludes tests, takes the census', () => {
  const r = sd('init', '--plan', 'plan.md', '--base', 'HEAD~1');
  assert.equal(r.code, 0, r.err);
  assert.equal(r.json.plan_statements, 10);
  assert.equal(r.json.cleanroom_files, 1, 'ledger.test.ts must not reach the clean room');
  const room = path.join(cur().room_root, 'cleanroom/src/ledger.ts');
  const clean = fs.readFileSync(room, 'utf8');
  assert.ok(!/plan/i.test(clean), 'comments mentioning the plan must be gone');
  assert.equal(clean.split('\n').length, fs.readFileSync(path.join(proj, 'src/ledger.ts'), 'utf8').split('\n').length, 'line numbers preserved');
  const census = JSON.parse(fs.readFileSync(path.join(cur().run_dir, 'census.json'), 'utf8'));
  assert.ok(census.some((c) => c.kind === 'constant' && /5000/.test(c.text)));
  assert.ok(census.some((c) => c.kind === 'rounding'));
});

test('run: verified, vacuous and refuted are told apart; base run marks what the change introduced', () => {
  fs.copyFileSync(path.join(example, 'fixtures/behaviours.json'), path.join(cur().room_root, 'out/behaviours.json'));
  const r = sd('run');
  assert.equal(r.code, 0, r.err);
  assert.deepEqual([r.json.verified, r.json.vacuous, r.json.refuted], [8, 1, 1]);
  const res = JSON.parse(fs.readFileSync(path.join(cur().run_dir, 'results.json'), 'utf8')).results;
  assert.equal(res.find((x) => x.id === 'B-003').on_base, 'introduced', 'the daily limit is new in this change');
  assert.equal(res.find((x) => x.id === 'B-002').on_base, 'preexisting');
  assert.equal(git('worktree', 'list').stdout.trim().split('\n').length, 1, 'base worktree cleaned up');
});

test('census: refuted scenarios cover nothing; waivers need a reason', () => {
  const r = sd('census');
  assert.equal(r.code, 0, r.err);
  assert.equal(r.json.uncovered, 0);
});

test('check-trace: fabricated quotes and flip-test failures become unsourced', () => {
  for (const f of ['trace.json', 'adversary.json']) fs.copyFileSync(path.join(example, 'fixtures', f), path.join(cur().run_dir, f));
  const r = sd('check-trace');
  assert.equal(r.code, 0, r.err);
  const checked = JSON.parse(fs.readFileSync(path.join(cur().run_dir, 'trace.checked.json'), 'utf8'));
  // With --base only behaviour introduced by the change is traced.
  assert.deepEqual(checked.forward.map((f) => f.behaviour_id), ['B-003']);
  assert.equal(checked.forward[0].verdict, 'unsourced');
});

test('full pipeline without --base: rules, probes, leave-one-out, leak check, render, ledger', () => {
  assert.equal(sd('init', '--plan', 'plan.md').code, 0);
  fs.copyFileSync(path.join(example, 'fixtures/behaviours.json'), path.join(cur().room_root, 'out/behaviours.json'));
  assert.equal(sd('run').code, 0);
  assert.equal(sd('census').code, 0);
  for (const f of ['trace.json', 'adversary.json', 'probes.json']) fs.copyFileSync(path.join(example, 'fixtures', f), path.join(cur().run_dir, f));
  const ct = sd('check-trace');
  assert.equal(ct.json.unsourced, 5);
  assert.equal(ct.json.downgraded_by_rules, 3, 'B-002 and B-005 by flip test, B-008 by fabricated quote');
  assert.deepEqual(ct.json.candidate_unrealised, ['P-007']);
  const pr = sd('run', '--probes');
  assert.equal(pr.json.dropped, 1);

  const lp = sd('loo-prepare', '--k', '3');
  assert.equal(lp.json.status, 'prepared');
  const redacted = fs.readFileSync(path.join(cur().run_dir, 'loo/plan.redacted.md'), 'utf8');
  assert.ok(!redacted.includes('deposit funds'));
  fs.copyFileSync(path.join(example, 'fixtures/loo.trace.json'), path.join(cur().run_dir, 'loo/trace.json'));
  assert.equal(sd('loo-score').json.status, 'review');

  // A tracer that quotes hidden text fails the control.
  const bad = { forward: [{ behaviour_id: 'B-001', verdict: 'stated', quotes: [{ text: 'Customers can deposit funds into an account.' }] }] };
  fs.writeFileSync(path.join(cur().run_dir, 'loo/trace.json'), JSON.stringify(bad));
  sd('loo-prepare', '--k', '3');
  fs.writeFileSync(path.join(cur().run_dir, 'loo/trace.json'), JSON.stringify(bad));
  assert.equal(sd('loo-score').json.status, 'failed');

  assert.equal(sd('leak-check').json.status, 'clean');
  const rn = sd('render');
  assert.equal(rn.json.silent_decisions, 5);
  assert.equal(rn.json.dropped_requirements, 1);
  assert.equal(rn.json.voided, true, 'failed control voids the run');
  const delta = fs.readFileSync(path.join(cur().run_dir, 'delta.md'), 'utf8');
  assert.match(delta, /This run is void/);
  assert.match(delta, /overdraft policy/);

  assert.notEqual(sd('ledger', '--behaviour', 'B-010', '--decision', 'approve', '--by', 't').code, 0, 'refuted behaviour cannot be signed');
  assert.equal(sd('ledger', '--behaviour', 'B-004', '--decision', 'approve', '--by', 't').code, 0);
  // The next run can quote the ledger.
  const again = sd('init', '--plan', 'plan.md');
  const st = JSON.parse(fs.readFileSync(path.join(cur().run_dir, 'plan.statements.json'), 'utf8'));
  assert.equal(again.json.plan_statements, 11);
  assert.ok(st.some((s) => s.id === 'D-001' && s.source === 'ledger'));
});

test('pairwise classifier mode: same downstream artefacts, leave-one-out cannot cite hidden text', () => {
  assert.equal(sd('init', '--plan', 'plan.md').code, 0);
  fs.copyFileSync(path.join(example, 'fixtures/behaviours.json'), path.join(cur().room_root, 'out/behaviours.json'));
  assert.equal(sd('run').code, 0);
  const env = { SD_CLASSIFIER_CMD: `node ${path.join(root, 'skills/silent-decisions/scripts/classifiers/fixture.mjs')}`, SD_CLASSIFIER_FIXTURE: path.join(example, 'fixtures/classifier.json') };
  const sdEnv = (...a) => { const r = spawnSync('node', [SD, ...a], { cwd: proj, encoding: 'utf8', env: { ...process.env, ...env } }); return { code: r.status, json: (() => { try { return JSON.parse(r.stdout); } catch { return null; } })(), err: r.stderr }; };
  const tp = sdEnv('trace-pairwise');
  assert.equal(tp.code, 0, tp.err);
  // 10 plan statements + D-001 from the previous test's ledger = 11; 8 verified behaviours; 3 calls per pair + 10 type calls.
  assert.equal(tp.json.requests, 11 * 8 * 3 + 10);
  assert.equal(tp.json.discarded_position_dependent, 1, 'B-004/P-002 fixture is flaky');
  const ct = sd('check-trace');
  assert.equal(ct.json.stated, 3);
  assert.equal(ct.json.unsourced, 5);
  assert.deepEqual(ct.json.candidate_unrealised, ['P-007']);
  assert.equal(sd('loo-prepare', '--k', '3').json.status, 'prepared');
  const lp = sdEnv('trace-pairwise', '--loo');
  assert.equal(lp.code, 0, lp.err);
  assert.equal(sd('loo-score').json.status, 'passed');
  fs.copyFileSync(path.join(example, 'fixtures/probes.json'), path.join(cur().run_dir, 'probes.json'));
  sd('run', '--probes'); sd('leak-check');
  const rn = sd('render');
  assert.equal(rn.json.silent_decisions, 5);
  assert.equal(rn.json.dropped_requirements, 1);
  assert.match(fs.readFileSync(path.join(cur().run_dir, 'delta.md'), 'utf8'), /pairwise-classifier/);
});

test('leak check: plan phrasing or the nonce in extractor output is caught', () => {
  const run = cur();
  const beh = JSON.parse(fs.readFileSync(path.join(example, 'fixtures/behaviours.json'), 'utf8'));
  beh.behaviours[0].then = 'each operation carries a client-supplied transaction id so that retries are safe';
  fs.writeFileSync(path.join(run.run_dir, 'behaviours.json'), JSON.stringify(beh));
  assert.equal(sd('leak-check').json.status, 'suspect');
  const nonce = JSON.parse(fs.readFileSync(path.join(run.run_dir, 'run.json'), 'utf8')).nonce;
  beh.nonce_seen = [nonce];
  fs.writeFileSync(path.join(run.run_dir, 'behaviours.json'), JSON.stringify(beh));
  assert.equal(sd('leak-check').json.status, 'contaminated');
});

test('hook: confines only the extractor, by allowlist, and logs every call', () => {
  const run = cur();
  const hook = (input) => spawnSync('node', [HOOK], { input: JSON.stringify({ cwd: proj, ...input }), encoding: 'utf8', env: { ...process.env, CLAUDE_PROJECT_DIR: proj } }).stdout;
  const denied = (out) => out.includes('"permissionDecision":"deny"');
  const ex = { agent_type: 'silent-decisions:sd-extractor', agent_id: 'a1' };
  assert.equal(hook({ tool_name: 'Read', tool_input: { file_path: 'plan.md' } }), '', 'main conversation untouched');
  assert.equal(hook({ agent_type: 'sd-tracer', tool_name: 'Read', tool_input: { file_path: 'plan.md' } }), '', 'tracer untouched');
  assert.ok(denied(hook({ ...ex, tool_name: 'Read', tool_input: { file_path: path.join(proj, 'plan.md') } })));
  assert.ok(denied(hook({ ...ex, tool_name: 'Read', tool_input: { file_path: path.join(run.room_root, 'cleanroom/../../../../plan.md') } })));
  assert.ok(denied(hook({ ...ex, tool_name: 'Bash', tool_input: { command: 'cat plan.md' } })));
  assert.ok(denied(hook({ ...ex, tool_name: 'Grep', tool_input: { pattern: 'x' } })));
  assert.ok(denied(hook({ ...ex, tool_name: 'Write', tool_input: { file_path: path.join(run.room_root, 'cleanroom/x.ts') } })));
  assert.equal(hook({ ...ex, tool_name: 'Read', tool_input: { file_path: path.join(run.room_root, 'cleanroom/src/ledger.ts') } }), '');
  assert.equal(hook({ ...ex, tool_name: 'Write', tool_input: { file_path: path.join(run.room_root, 'out/behaviours.json') } }), '');
  fs.symlinkSync(path.join(proj, 'plan.md'), path.join(run.room_root, 'cleanroom/link.md'));
  assert.ok(denied(hook({ ...ex, tool_name: 'Read', tool_input: { file_path: path.join(run.room_root, 'cleanroom/link.md') } })), 'symlink out of the room');
  const log = fs.readFileSync(path.join(run.run_dir, 'audit.jsonl'), 'utf8').trim().split('\n');
  assert.equal(log.length, 8);
});
