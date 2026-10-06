import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const { scoreAgainst, normalise } = await import(path.join(root, 'skills/silent-decisions/scripts/lib/score.mjs'));
const { buildCensusRequests, assembleCensus } = await import(path.join(root, 'skills/silent-decisions/scripts/lib/census-trace.mjs'));

const truth = {
  silent_decisions: [{ id: 'T1', lines: [56, 72] }, { id: 'T2', lines: [10, 58] }],
  negative_controls: [{ id: 'N1', lines: [39] }],
  dropped_requirements: [{ statement: 'P-007' }],
};

test('score: line overlap, negative controls and dropped ids', () => {
  const s = scoreAgainst(truth, { flagged: [{ label: 'x', lines: [56] }, { label: 'y', lines: [39] }, { label: 'z', lines: [] }], dropped: ['P-007', 'P-004'] });
  assert.equal(s.silent_decisions.recall, 0.5);
  assert.equal(s.silent_decisions.precision, Number((1 / 3).toFixed(3)));
  assert.equal(s.silent_decisions.flagged_without_lines, 1);
  assert.equal(s.negative_controls.false_positives, 1);
  assert.equal(s.dropped_requirements.precision, 0.5);
  assert.equal(s.dropped_requirements.recall, 1);
});

test('census baseline: one noul question per (item, sentence); undecided means no yes above threshold', () => {
  const st = [{ id: 'P-1', text: 'a', source: 'plan' }, { id: 'P-2', text: 'b', source: 'plan' }];
  const census = [{ id: 'C-1', kind: 'constant', file: 'f', line: 1, text: 'X = 5' }, { id: 'C-2', kind: 'condition', file: 'f', line: 2, text: 'x < 0' }];
  assert.equal(buildCensusRequests(st, census).length, 4);
  const ans = new Map([['census|C-1|P-2', { label: 'yes', confidence: 0.9 }], ['census|C-2|P-1', { label: 'yes', confidence: 0.4 }]]);
  const t = assembleCensus(st, census, ans, 0.7);
  assert.equal(t.items[0].verdict, 'decided');
  assert.equal(t.items[1].verdict, 'undecided');
  assert.deepEqual(t.reverse.map((r) => r.status), ['untouched', 'touched']);
});

// Run 006 regression: run.sh runs arm c through the pipeline and calls `sd score` without --input,
// but normalise treated c as a free-form arm and crashed reading an undefined input file.
test('score: arm c is normalised from the pipeline run, like d and e', () => {
  const runDir = fs.mkdtempSync(path.join(os.tmpdir(), 'sd-score-c-'));
  const w = (f, j) => fs.writeFileSync(path.join(runDir, f), JSON.stringify(j));
  w('census.json', [{ id: 'C-1', line: 56 }, { id: 'C-2', line: 39 }]);
  w('behaviours.json', { behaviours: [{ id: 'B-001', title: 't1', covers: ['C-1'] }, { id: 'B-002', title: 't2', covers: ['C-2'] }] });
  w('trace.checked.json', { forward: [{ behaviour_id: 'B-001', verdict: 'unsourced' }, { behaviour_id: 'B-002', verdict: 'sourced' }] });
  w('probes.results.json', { results: [{ statement_id: 'P-007', outcome: 'dropped' }] });
  for (const arm of ['c', 'd', 'e']) {
    const n = normalise(arm, runDir, undefined);
    assert.deepEqual(n.flagged.map((f) => f.lines), [[56]]);
    assert.deepEqual(n.dropped, ['P-007']);
  }
});
