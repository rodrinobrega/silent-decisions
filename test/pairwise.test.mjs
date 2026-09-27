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

test('run 001 regression (--contraries all): an accepted same-account transfer is caught by the default rejection contrary', async () => {
  const { contrariesOf, DEFAULT_REJECT } = await import(path.join(root, 'skills/silent-decisions/scripts/lib/pairwise.mjs'));
  const st = [
    { id: 'P-006', text: 'Customers can transfer funds between two accounts.', source: 'plan' },
    { id: 'P-007', text: 'A transfer to the same account is rejected.', source: 'plan' },
  ];
  const b = { id: 'B-033', given: "'A' has 100", when: "50 is transferred from 'A' to 'A'", then: 'ok; balance stays 100; two entries', contrary_then: 'the balance ends at 50' };
  const cs = contrariesOf(b);
  assert.deepEqual(cs.map((c) => c.text), ['the balance ends at 50', DEFAULT_REJECT]);
  assert.ok(buildRequests(st, [b], { contraries: 'all' }).some((r) => r.id === 'pair|B-033|P-007|c1|ab' && r.outcome_b === DEFAULT_REJECT));
  const ans = new Map(Object.entries({
    // P-007 is silent on the primary contrary but requires the rejection.
    'pair|B-033|P-007|c1|ab': { label: 'b', confidence: 0.95 },
    'pair|B-033|P-007|c1|ba': { label: 'a', confidence: 0.95 },
    // P-006 prefers "accepted" over "rejected": must NOT source the behaviour (extra contraries never source).
    'pair|B-033|P-006|c1|ab': { label: 'a', confidence: 0.95 },
    'pair|B-033|P-006|c1|ba': { label: 'b', confidence: 0.95 },
  }));
  const t = assemble(st, [b], ans, 0.7, { contraries: 'all' });
  const f = t.forward[0];
  assert.equal(f.verdict, 'unsourced');
  assert.deepEqual(f.contradicted_by, ['P-007']);
  assert.deepEqual(t.reverse.find((r) => r.statement_id === 'P-007').contradicted_by, ['B-033']);
});

test('a rejected outcome gets an acceptance contrary; an existing one is not duplicated', async () => {
  const { contrariesOf, DEFAULT_ACCEPT } = await import(path.join(root, 'skills/silent-decisions/scripts/lib/pairwise.mjs'));
  assert.deepEqual(contrariesOf({ then: 'the withdrawal is rejected', contrary_then: 'rejected with a different reason' }).map((c) => c.text), ['rejected with a different reason', DEFAULT_ACCEPT]);
  assert.equal(contrariesOf({ then: 'ok', contrary_then: 'x', contrary_alternatives: ['the transfer is rejected'] }).length, 2);
  assert.equal(contrariesOf({ then: 'ok' }).length, 0, 'no primary contrary, no pairs');
});

test('run 002 regression: by default the trace asks only the primary contrary', async () => {
  // Run 002: 90 contraries on 40 scenarios cost 2210 calls; the extra ones raised only spurious
  // contradictions. The default is now the primary contrary; the same-account case of run 001 is left
  // to the reverse probe of every behavioural statement, which fails whatever the extractor wrote.
  const st = [{ id: 'P-007', text: 'A transfer to the same account is rejected.', source: 'plan' }];
  const b = { id: 'B-038', given: "'A' has 100", when: "50 is transferred from 'A' to 'A'", then: 'ok; balance stays 100', contrary_then: 'the transfer is rejected', contrary_alternatives: ['the balance drops to 50'] };
  const reqs = buildRequests(st, [b]);
  assert.equal(reqs.filter((r) => r.task === 'decides').length, 2, 'one contrary, two orderings');
  assert.ok(!reqs.some((r) => /\|c1\|/.test(r.id)));
  assert.equal(buildRequests(st, [b], { contraries: 'all' }).filter((r) => r.task === 'decides').length, 4);
  const ans = new Map(Object.entries({
    'pair|B-038|P-007|ab': { label: 'b', confidence: 0.98 },
    'pair|B-038|P-007|ba': { label: 'a', confidence: 0.98 },
  }));
  const t = assemble(st, [b], ans, 0.7);
  assert.deepEqual(t.forward[0].contradicted_by, ['P-007'], 'a contradiction on the primary contrary is still reported');
  assert.equal(t.forward[0].contrary.alternatives, undefined);
});

test('runs 001-002 regression: a statement typed process or structural cannot source a behaviour', async () => {
  const { applyRules, nonSourcingStatements } = await import(path.join(root, 'skills/silent-decisions/scripts/lib/checks.mjs'));
  // Run 002: B-002 (re-opening an account keeps its balance) was "stated" by P-010, the out-of-scope
  // line, although the trace had typed P-010 as not behavioural. T7 was missed in both runs this way.
  const st = [
    { id: 'P-009', text: 'Each operation carries a client-supplied transaction id so that retries are safe.', source: 'plan' },
    { id: 'P-010', text: 'Persistence, currencies, authentication.', source: 'plan' },
  ];
  const index = st.map((s) => ({ id: s.id, text: s.text.toLowerCase() }));
  const trace = { statements: [{ id: 'P-009', type: 'behavioural' }, { id: 'P-010', type: 'process' }] };
  const non = nonSourcingStatements(trace);
  assert.deepEqual([...non.keys()], ['P-010']);
  const [b002] = applyRules([{ behaviour_id: 'B-002', verdict: 'stated', quotes: [{ statement_id: 'P-010', text: st[1].text }] }], index, [], non);
  assert.equal(b002.verdict, 'unsourced');
  assert.match(b002.notes.join(' '), /P-010 is typed process/);
  const [b008] = applyRules([{ behaviour_id: 'B-008', verdict: 'stated', quotes: [{ statement_id: 'P-009', text: st[0].text }] }], index, [], non);
  assert.equal(b008.verdict, 'stated', 'a behavioural statement still sources');
  assert.equal(nonSourcingStatements({ statements: [{ id: 'X', type: 'untyped' }] }).size, 0, 'untyped statements stay eligible');
});
