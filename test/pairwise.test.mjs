import { test } from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const { buildRequests, assemble } = await import(path.join(root, 'skills/silent-decisions/scripts/lib/pairwise.mjs'));

const statements = [
  { id: 'P-004', text: 'Customers can withdraw funds from an account.', source: 'plan' },
  { id: 'P-005', text: 'An amount must be a positive number, otherwise the operation is rejected.', source: 'plan' },
];
const behaviours = [
  { id: 'B-002', given: 'balance 100', when: '150 withdrawn', then: 'rejected', contrary_then: 'accepted, balance -50' },
  { id: 'B-006', given: 'any account', when: '0 withdrawn', then: 'rejected', contrary_then: 'accepted as no-op' },
  { id: 'B-009', given: 'x', when: 'y', then: 'z' },
];

test('three requests per pair plus one type request per plan statement', () => {
  const r = buildRequests(statements, behaviours);
  assert.equal(r.filter((x) => x.task === 'type').length, 2);
  assert.equal(r.filter((x) => x.task === 'decides').length, 2 * 2 * 2, 'B-009 has no contrary and forms no pairs');
  assert.equal(r.filter((x) => x.task === 'realises').length, 4);
  const ab = r.find((x) => x.id === 'pair|B-002|P-004|ab'), ba = r.find((x) => x.id === 'pair|B-002|P-004|ba');
  assert.equal(ab.outcome_a, ba.outcome_b);
});

test('position-dependent, low-confidence and missing answers all default to unsourced; consistent ones are stated', () => {
  const ans = new Map(Object.entries({
    'pair|B-006|P-005|ab': { label: 'a', confidence: 0.9 },
    'pair|B-006|P-005|ba': { label: 'b', confidence: 0.9 },         // consistent: names the code's outcome both times
    'pair|B-002|P-004|ab': { label: 'a', confidence: 0.9 },
    'pair|B-002|P-004|ba': { label: 'a', confidence: 0.9 },         // moves with position
    'pair|B-002|P-005|ab': { label: 'a', confidence: 0.4 },
    'pair|B-002|P-005|ba': { label: 'b', confidence: 0.4 },         // consistent but weak
    'realises|B-002|P-004': { label: 'yes', confidence: 0.9 },
    'type|P-004': { label: 'behavioural', confidence: 1 },
  }));
  const t = assemble(statements, behaviours, ans, 0.7);
  const f = (id) => t.forward.find((x) => x.behaviour_id === id);
  assert.equal(f('B-006').verdict, 'stated');
  assert.deepEqual(f('B-006').quotes.map((q) => q.statement_id), ['P-005']);
  assert.equal(f('B-002').verdict, 'unsourced');
  assert.equal(f('B-009').verdict, 'unsourced');
  assert.ok(t.pairs.some((p) => p.behaviour_id === 'B-002' && p.statement_id === 'P-004' && /position/.test(p.note)));
  assert.ok(t.pairs.some((p) => p.behaviour_id === 'B-002' && p.statement_id === 'P-005' && /threshold/.test(p.note)));
  // Realisation is independent of the flip test.
  assert.deepEqual(t.reverse.find((r) => r.statement_id === 'P-004').realised_by, ['B-002']);
});

test('a statement that requires the contrary is reported', () => {
  const ans = new Map(Object.entries({
    'pair|B-002|P-004|ab': { label: 'b', confidence: 0.95 },
    'pair|B-002|P-004|ba': { label: 'a', confidence: 0.95 },
  }));
  const t = assemble(statements, behaviours, ans, 0.7);
  assert.deepEqual(t.forward.find((x) => x.behaviour_id === 'B-002').contradicted_by, ['P-004']);
});
