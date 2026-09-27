// sd trace-pairwise: trace with a decision-only classifier instead of an LLM tracer.
//
// Each call sees exactly one (plan statement, behaviour) pair and answers one question:
// does this statement require outcome A (what the code does), outcome B (the contrary the
// blind extractor wrote as its twin), or neither? There is no narrative context to be swayed
// by, no quote to fabricate, and the flip test is the question itself. Every pair is asked
// twice with A and B swapped; an answer that moves with the position is discarded.
//
// The classifier is any command that reads JSONL requests on stdin and writes JSONL answers
// on stdout (see references/classifier-protocol.md). SD_CLASSIFIER_CMD selects it.
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { readJson, writeJson, fail, loadRun, rel, normalizeWs } from './util.mjs';

export const TYPE_LABELS = ['behavioural', 'structural', 'process'];

// A behaviour's contraries: the extractor's primary contrary_then (what its twin asserts), any
// contrary_alternatives it wrote, and a default flip of acceptance. One contrary per scenario only
// catches a plan contradiction if it happens to be the alternative the plan talks about: in run 001
// "transfer A to A is accepted" was only tested against "the balance ends at 50", which the plan
// sentence "a transfer to the same account is rejected" neither requires nor forbids.
const REJECTED = /\b(reject|refus|den(y|ied)|error|throws?|fails?|invalid|not allowed|forbidden)/i;
export const DEFAULT_REJECT = 'the operation is rejected and nothing changes';
export const DEFAULT_ACCEPT = 'the operation is accepted and takes effect';

export function contrariesOf(b) {
  const list = [];
  const add = (text, source) => {
    const t = normalizeWs(text || '');
    if (t && !list.some((c) => c.text.toLowerCase() === t.toLowerCase())) list.push({ text: t, source });
  };
  add(b.contrary_then, 'extractor');
  for (const alt of b.contrary_alternatives || []) add(alt, 'extractor-alternative');
  if (!list.length) return list;
  const thenRejected = REJECTED.test(b.then || '');
  const want = thenRejected ? (t) => !REJECTED.test(t) : (t) => REJECTED.test(t);
  if (!list.some((c) => want(c.text))) add(thenRejected ? DEFAULT_ACCEPT : DEFAULT_REJECT, 'default-flip');
  return list;
}

// Request id for a pair. Contrary 0 keeps the original id shape so older fixtures and traces still read.
export const pairId = (b, s, k, order) => (k === 0 ? `pair|${b}|${s}|${order}` : `pair|${b}|${s}|c${k}|${order}`);

export function buildRequests(statements, behaviours) {
  const reqs = [];
  for (const s of statements.filter((x) => x.source === 'plan')) {
    reqs.push({ id: `type|${s.id}`, task: 'type', statement: s.text, labels: TYPE_LABELS });
  }
  for (const b of behaviours) {
    const a = normalizeWs(b.then);
    const contraries = contrariesOf(b);
    if (!contraries.length) continue;
    for (const s of statements) {
      const base = { task: 'decides', statement: s.text, given: normalizeWs(b.given), when: normalizeWs(b.when), labels: ['a', 'b', 'neither'] };
      contraries.forEach((c, k) => {
        reqs.push({ id: pairId(b.id, s.id, k, 'ab'), ...base, outcome_a: a, outcome_b: c.text });
        reqs.push({ id: pairId(b.id, s.id, k, 'ba'), ...base, outcome_a: c.text, outcome_b: a });
      });
      // Realisation is a different question from decision: "customers can withdraw funds" does not
      // decide the overdraft policy, but a withdrawal scenario is still an instance of it.
      reqs.push({ id: `realises|${b.id}|${s.id}`, task: 'realises', statement: s.text, given: normalizeWs(b.given), when: normalizeWs(b.when), outcome: a, labels: ['yes', 'no'] });
    }
  }
  return reqs;
}

export function callClassifier(cmd, requests, timeoutSec) {
  const input = requests.map((r) => JSON.stringify(r)).join('\n') + '\n';
  const res = spawnSync(cmd, { shell: true, input, encoding: 'utf8', maxBuffer: 1 << 28, timeout: timeoutSec * 1000, env: process.env });
  if (res.status !== 0) fail(`classifier command exited with ${res.status}: ${cmd}\n${res.stderr || ''}`);
  const answers = new Map();
  for (const line of String(res.stdout).split('\n')) {
    if (!line.trim()) continue;
    let a;
    try { a = JSON.parse(line); } catch { continue; }
    if (a && a.id) answers.set(a.id, a);
  }
  return answers;
}

/**
 * Turn per-pair answers into the same trace.json shape the LLM tracer produces, so
 * `sd check-trace`, leave-one-out and render run unchanged.
 * A behaviour is sourced by statement S when both orderings agree that S requires the code's
 * outcome and the lower of the two confidences clears the threshold. Labels that move with
 * the position, or answers below threshold, count as "neither" (default to unsourced).
 */
export function assemble(statements, behaviours, answers, threshold) {
  const types = statements.filter((s) => s.source === 'plan').map((s) => {
    const a = answers.get(`type|${s.id}`);
    return { id: s.id, type: TYPE_LABELS.includes(a && a.label) ? a.label : 'behavioural' };
  });
  const byStatement = new Map(statements.map((s) => [s.id, s]));
  const forward = [];
  const reverse = new Map();
  const contradictions = new Map();
  const pairs = [];
  for (const b of behaviours) {
    const supporting = [];
    const contradicting = [];
    const contraries = contrariesOf(b);
    if (!contraries.length) {
      forward.push({ behaviour_id: b.id, verdict: 'unsourced', quotes: [], reasoning: 'no contrary outcome supplied by the extractor; pair could not be formed', contrary: { then: '' }, cluster: b.cluster || 'unclustered' });
      continue;
    }
    // Map each ordering's label back to "code" / "contrary" / "neither".
    const norm = (ans, swapped) => {
      if (!ans || !['a', 'b', 'neither'].includes(ans.label)) return null;
      if (ans.label === 'neither') return 'neither';
      return (ans.label === 'a') !== swapped ? 'code' : 'contrary';
    };
    for (const s of statements) {
      // Sourcing is the flip test against the primary contrary only (k = 0), exactly as before.
      // The extra contraries exist to catch contradictions, and must not source anything: against
      // "the operation is rejected", a generic sentence like "customers can transfer funds" would
      // appear to require every accepted transfer, and quietly empty the silent-decision bucket.
      // A contradiction is a lead, not a verdict: it forces a reverse probe of the statement, and the
      // probe decides. A contradiction outranks support for the same statement.
      let sOutcome = 'neither';
      contraries.forEach((c, k) => {
        const ab = answers.get(pairId(b.id, s.id, k, 'ab'));
        const ba = answers.get(pairId(b.id, s.id, k, 'ba'));
        const x = norm(ab, false), y = norm(ba, true);
        const conf = Math.min(Number(ab && ab.confidence) || 0, Number(ba && ba.confidence) || 0);
        let outcome = 'neither';
        let note = '';
        if (x === null || y === null) note = 'no answer';
        else if (x !== y) note = 'position-dependent answer, discarded';
        else if (x !== 'neither' && conf < threshold) note = `below threshold (${conf.toFixed(2)} < ${threshold})`;
        else outcome = x;
        pairs.push({ behaviour_id: b.id, statement_id: s.id, contrary: k, contrary_source: c.source, outcome, confidence: conf, ...(note ? { note } : {}) });
        if (outcome === 'contrary') sOutcome = 'contrary';
        else if (outcome === 'code' && k === 0 && sOutcome === 'neither') sOutcome = 'code';
      });
      if (sOutcome === 'code') supporting.push(s);
      if (sOutcome === 'contrary') contradicting.push(s);
    }
    const quotes = supporting.map((s) => ({ statement_id: s.id, text: s.text }));
    let reasoning = '';
    if (contradicting.length) reasoning = `plan text appears to require the contrary: ${contradicting.map((s) => s.id).join(', ')}`;
    forward.push({
      behaviour_id: b.id,
      verdict: quotes.length ? 'stated' : 'unsourced',
      quotes,
      reasoning,
      contrary: { then: contraries[0].text, ...(contraries.length > 1 ? { alternatives: contraries.slice(1).map((c) => c.text) } : {}) },
      cluster: b.cluster || 'unclustered',
      ...(contradicting.length ? { contradicted_by: contradicting.map((s) => s.id) } : {}),
    });
    for (const s of statements) {
      const r = answers.get(`realises|${b.id}|${s.id}`);
      const yes = r && r.label === 'yes' && (Number(r.confidence) || 0) >= threshold;
      if (yes || supporting.includes(s)) {
        if (!reverse.has(s.id)) reverse.set(s.id, []);
        reverse.get(s.id).push(b.id);
      }
      if (contradicting.includes(s)) {
        if (!contradictions.has(s.id)) contradictions.set(s.id, []);
        contradictions.get(s.id).push(b.id);
      }
    }
  }
  return {
    mode: 'pairwise-classifier',
    statements: types,
    forward,
    reverse: [...new Set([...reverse.keys(), ...contradictions.keys()])].map((statement_id) => ({
      statement_id,
      realised_by: reverse.get(statement_id) || [],
      ...(contradictions.has(statement_id) ? { contradicted_by: contradictions.get(statement_id) } : {}),
    })),
    pairs,
  };
}

export function tracePairwise(args) {
  const { proj, runDir } = loadRun(args);
  const cmd = process.env.SD_CLASSIFIER_CMD || (args.classifier && String(args.classifier));
  if (!cmd) fail('no classifier. Set SD_CLASSIFIER_CMD or pass --classifier "<command>". See references/classifier-protocol.md');
  const threshold = Number(args.threshold || process.env.SD_CLASSIFIER_THRESHOLD || 0.7);
  const loo = Boolean(args.loo);

  const stPath = loo ? path.join(runDir, 'loo', 'plan.statements.redacted.json') : path.join(runDir, 'plan.statements.json');
  const bhPath = loo ? path.join(runDir, 'loo', 'behaviours.subset.json') : path.join(runDir, 'behaviours.verified.json');
  for (const p of [stPath, bhPath]) if (!fs.existsSync(p)) fail(`missing ${rel(proj, p)}${loo ? ' (run sd loo-prepare first)' : ' (run sd run first)'}`);
  const statements = readJson(stPath);
  const behaviours = readJson(bhPath).behaviours || [];

  const requests = buildRequests(statements, behaviours);
  const maxPairs = Number(args['max-pairs'] || 20000);
  if (requests.length > maxPairs) fail(`${requests.length} classifier calls exceed --max-pairs ${maxPairs}. Narrow the plan, use --base, or raise the limit.`);
  if (args['dry-run']) {
    process.stdout.write(JSON.stringify({ classifier: cmd, requests: requests.length, threshold, sample: requests.slice(0, 2) }, null, 2) + '\n');
    return;
  }
  const answers = callClassifier(cmd, requests, Number(args.timeout || 1800));
  const trace = assemble(statements, behaviours, answers, threshold);
  trace.classifier = { command: cmd, threshold, requests: requests.length, answered: answers.size };
  const outPath = loo ? path.join(runDir, 'loo', 'trace.json') : path.join(runDir, 'trace.json');
  writeJson(outPath, trace);
  const n = (v) => trace.forward.filter((f) => f.verdict === v).length;
  process.stdout.write(JSON.stringify({
    wrote: rel(proj, outPath), mode: 'pairwise-classifier', requests: requests.length, answered: answers.size,
    stated: n('stated'), unsourced: n('unsourced'),
    contradicted: trace.forward.filter((f) => f.contradicted_by).length,
    discarded_position_dependent: trace.pairs.filter((p) => /position/.test(p.note || '')).length,
    unanswered: trace.pairs.filter((p) => p.note === 'no answer').length,
  }, null, 2) + '\n');
}
