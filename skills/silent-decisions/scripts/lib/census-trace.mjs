// sd trace-census: the no-extraction baseline (experiment arm f).
// Plan sentence x census item (an AST decision point), through the same classifier, asking
// whether the sentence explicitly decides that point. No behaviour is extracted, nothing is
// executed, no contrary exists. It produces a census-level delta, comparable to the
// behaviour-level one only through the ground truth in an experiment.
import fs from 'node:fs';
import path from 'node:path';
import { readJson, writeJson, fail, loadRun, rel, normalizeWs } from './util.mjs';
import { callClassifier } from './pairwise.mjs';

export function buildCensusRequests(statements, census) {
  const reqs = [];
  for (const c of census) {
    for (const s of statements) {
      reqs.push({ id: `census|${c.id}|${s.id}`, task: 'census', statement: s.text, kind: c.kind, code: c.text, location: `${c.file}:${c.line}`, labels: ['yes', 'no'] });
    }
  }
  return reqs;
}

export function assembleCensus(statements, census, answers, threshold) {
  const byId = new Map(statements.map((s) => [s.id, s]));
  const items = census.map((c) => {
    const decided_by = [];
    for (const s of statements) {
      const a = answers.get(`census|${c.id}|${s.id}`);
      if (a && a.label === 'yes' && (Number(a.confidence) || 0) >= threshold) decided_by.push({ statement_id: s.id, confidence: Number(a.confidence) });
    }
    return { census_id: c.id, kind: c.kind, file: c.file, line: c.line, code: c.text, verdict: decided_by.length ? 'decided' : 'undecided', decided_by };
  });
  const realised = new Set(items.flatMap((i) => i.decided_by.map((d) => d.statement_id)));
  const reverse = statements.filter((s) => s.source === 'plan').map((s) => ({ statement_id: s.id, status: realised.has(s.id) ? 'touched' : 'untouched' }));
  return { mode: 'census-classifier', items, reverse };
}

export function traceCensus(args) {
  const { proj, runDir } = loadRun(args);
  const cmd = process.env.SD_CLASSIFIER_CMD || (args.classifier && String(args.classifier));
  if (!cmd) fail('no classifier. Set SD_CLASSIFIER_CMD.');
  const threshold = Number(args.threshold || process.env.SD_CLASSIFIER_THRESHOLD || 0.7);
  const statements = readJson(path.join(runDir, 'plan.statements.json'));
  const census = readJson(path.join(runDir, 'census.json'));
  const requests = buildCensusRequests(statements, census);
  if (args['dry-run']) { process.stdout.write(JSON.stringify({ classifier: cmd, requests: requests.length, sample: requests.slice(0, 1) }, null, 2) + '\n'); return; }
  const answers = callClassifier(cmd, requests, Number(args.timeout || 1800));
  const out = assembleCensus(statements, census, answers, threshold);
  out.classifier = { command: cmd, threshold, requests: requests.length, answered: answers.size };
  writeJson(path.join(runDir, 'trace.census.json'), out);

  const L = [`# Census delta (baseline, no extraction, no execution)`, '', `Run \`${path.basename(runDir)}\` · ${out.items.length} decision points · ${out.items.filter((i) => i.verdict === 'undecided').length} undecided by the plan`, '',
    '| Census | Kind | Where | Code | Decided by |', '|---|---|---|---|---|'];
  for (const i of out.items) L.push(`| ${i.census_id} | ${i.kind} | ${i.file}:${i.line} | \`${normalizeWs(i.code).replace(/\|/g, '\\|')}\` | ${i.decided_by.map((d) => `${d.statement_id} (${d.confidence.toFixed(2)})`).join(', ') || '**none**'} |`);
  L.push('', '## Plan sentences no decision point was matched to', '');
  out.reverse.filter((r) => r.status === 'untouched').forEach((r) => L.push(`- ${r.statement_id}: ${byIdText(statements, r.statement_id)}`));
  fs.writeFileSync(path.join(runDir, 'census-delta.md'), L.join('\n') + '\n');
  process.stdout.write(JSON.stringify({ wrote: rel(proj, path.join(runDir, 'census-delta.md')), requests: requests.length, answered: answers.size, decided: out.items.filter((i) => i.verdict === 'decided').length, undecided: out.items.filter((i) => i.verdict === 'undecided').length }, null, 2) + '\n');
}
function byIdText(statements, id) { const s = statements.find((x) => x.id === id); return s ? s.text : id; }
