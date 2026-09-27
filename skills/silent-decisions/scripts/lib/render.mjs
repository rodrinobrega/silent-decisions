// sd render: build delta.md, the only thing the human reviews.
import fs from 'node:fs';
import path from 'node:path';
import { readJson, writeJson, loadRun, rel } from './util.mjs';

const opt = (p) => (fs.existsSync(p) ? readJson(p) : null);

export function render(args) {
  const { proj, runDir, meta } = loadRun(args);
  const behaviours = new Map(readJson(path.join(runDir, 'behaviours.json')).behaviours.map((b) => [b.id, b]));
  const results = readJson(path.join(runDir, 'results.json')).results;
  const checked = readJson(path.join(runDir, 'trace.checked.json'));
  const statements = new Map(readJson(path.join(runDir, 'plan.statements.json')).map((s) => [s.id, s]));
  const coverage = opt(path.join(runDir, 'census.coverage.json'));
  const probes = opt(path.join(runDir, 'probes.results.json'));
  const loo = opt(path.join(runDir, 'loo', 'control.json'));
  const leak = opt(path.join(runDir, 'leak.json'));

  const silent = checked.forward.filter((f) => f.verdict === 'unsourced');
  const entailed = checked.forward.filter((f) => f.verdict === 'entailed');
  const probeBy = new Map((probes ? probes.results : []).map((p) => [p.statement_id, p]));
  // Candidates: statements the trace could not show realised, or that a verified behaviour contradicts.
  // A probe decides every statement it ran on, including ones the trace called realised.
  const candidates = checked.reverse.filter((r) => r.status === 'candidate_unrealised' || r.status === 'contradicted');
  const dropped = checked.reverse.filter((r) => (probeBy.get(r.statement_id) || {}).outcome === 'dropped');
  const unprobed = candidates.filter((r) => !probeBy.has(r.statement_id) || probeBy.get(r.statement_id).outcome === 'inconclusive');
  const missed = candidates.filter((r) => (probeBy.get(r.statement_id) || {}).outcome === 'realised_missed_by_extractor');

  const count = (s) => results.filter((r) => r.status === s).length;
  const deltaSize = silent.length + dropped.length;
  const overCap = deltaSize > meta.cap;

  // A run is only as good as its controls. Say so at the top.
  const problems = [];
  if (leak && leak.status !== 'clean') problems.push(`leak check: **${leak.status}**${leak.review ? ` (${leak.review})` : ''}`);
  if (!leak) problems.push('leak check not run');
  if (loo && loo.status === 'failed') problems.push('leave-one-out control **failed**: the tracer cited text that had been removed');
  if (loo && loo.status === 'review') problems.push(`leave-one-out: ${loo.resourced} behaviour(s) stayed sourced from another passage, check them below`);
  if (!loo) problems.push('leave-one-out control not run');
  if (coverage && coverage.uncovered > 0) problems.push(`${coverage.uncovered} census item(s) neither covered nor waived: the account of behaviour is incomplete`);
  if (unprobed.length) problems.push(`${unprobed.length} possibly dropped requirement(s) not confirmed by a probe`);
  const voided = (leak && leak.status === 'contaminated') || (loo && loo.status === 'failed');

  const L = [];
  L.push(`# Delta: ${meta.plan_path}`, '');
  L.push(`Run \`${meta.run_id}\` · plan sha256 \`${meta.plan_sha256.slice(0, 12)}\`${meta.base ? ` · base \`${meta.base}\`` : ''}`, '');
  if (voided) L.push('> **This run is void.** A control failed, so a clean result here means nothing. Fix the cause and re-run.', '');
  L.push(`**${silent.length} silent decision(s), ${dropped.length} dropped requirement(s).**`, '');
  if (overCap) {
    L.push(`> **Plan not ready.** The delta (${deltaSize}) is above the cap (${meta.cap}). Reviewing this many cards is not a useful review. Tighten the plan in the areas listed below, re-implement or re-run, and review what remains.`, '');
  }

  L.push('## Run health', '');
  L.push('| Check | Result |', '|---|---|');
  L.push(`| Scenarios | ${results.length} extracted · ${count('verified')} verified · ${count('vacuous')} vacuous · ${count('refuted')} refuted |`);
  if (meta.base) L.push(`| Against base | ${results.filter((r) => r.on_base === 'introduced').length} introduced by this change · ${results.filter((r) => r.on_base === 'preexisting').length} pre-existing (skipped) |`);
  if (coverage) L.push(`| Census (${coverage.basis}) | ${coverage.total} decision points · ${coverage.covered} covered · ${coverage.waived} waived · ${coverage.uncovered} uncovered |`);
  if (checked.mode) L.push(`| Trace mode | ${checked.mode}${checked.classifier ? ` · ${checked.classifier.requests} calls · threshold ${checked.classifier.threshold}` : ''} |`);
  L.push(`| Trace | ${checked.forward.filter((f) => f.verdict === 'stated').length} stated · ${entailed.length} entailed · ${silent.length} unsourced · ${checked.forward.filter((f) => f.tracer_verdict && f.tracer_verdict !== f.verdict).length} downgraded by rules |`);
  if (probes) L.push(`| Reverse probes | ${probes.results.length} run · ${dropped.length} dropped · ${missed.length} realised but missed by the extractor |`);
  L.push(`| Leave-one-out | ${loo ? `${loo.status}${loo.hidden ? ` (${loo.hidden.length} statement(s) hidden: ${loo.flipped ?? 0} flipped, ${loo.resourced ?? 0} re-sourced, ${loo.cited_hidden ?? 0} cited hidden text)` : ''}` : 'not run'} |`);
  const auditText = (a) => {
    if (!a) return ' · no audit log (hook not installed)';
    if (a.source !== 'transcript') return ` · extractor made ${a.calls} tool call(s), ${a.denied} denied`;
    if (!a.found) return ' · no audit log, transcript not found';
    return ` · transcript: ${a.calls} tool call(s), ${a.outside_room.length} outside the room, ${a.plan_mentions} plan mention(s), ${a.denied} denied`;
  };
  L.push(`| Leak check | ${leak ? `${leak.status}${auditText(leak.audit)}` : 'not run'} |`);
  L.push('');
  if (problems.length) { L.push('Open issues with this run:', ''); problems.forEach((p) => L.push(`- ${p}`)); L.push(''); }

  const clusters = new Map();
  for (const f of silent) {
    if (!clusters.has(f.cluster)) clusters.set(f.cluster, []);
    clusters.get(f.cluster).push(f);
  }

  if (overCap) {
    L.push('## Open areas', '');
    [...clusters].sort((a, b) => b[1].length - a[1].length).forEach(([name, list]) => L.push(`- **${name}**: ${list.length} decision(s)`));
    L.push('');
  }

  L.push('## Silent decisions', '');
  if (!silent.length) L.push('None found. Read the run health table before trusting that.', '');
  for (const [name, list] of clusters) {
    L.push(`### ${name}`, '');
    for (const f of list) {
      const b = behaviours.get(f.behaviour_id) || {};
      L.push(`#### ${f.behaviour_id} · ${b.title || ''}`, '');
      L.push(`> Given ${b.given}  `, `> When ${b.when}  `, `> Then ${b.then}`, '');
      L.push('| | |', '|---|---|');
      L.push(`| **A. What the code does** | ${b.then} |`);
      L.push(`| **B. The alternative** | ${f.contrary || '_(the adversary proposed none; state what you would expect instead)_'} |`);
      L.push('');
      if (f.contrary_argument) L.push(`Why the plan does not settle it: ${f.contrary_argument}`, '');
      if (f.quotes.length) L.push(`Nearest plan text: ${f.quotes.map((q) => `“${q.text}” (${q.statement_id})`).join('; ')}`, '');
      if (f.contradicted_by && f.contradicted_by.length) L.push(`**The plan may require the opposite:** ${f.contradicted_by.map((id) => `“${(statements.get(id) || {}).text}” (${id})`).join('; ')}`, '');
      if (f.notes.length) L.push(`Notes: ${f.notes.join('; ')}`, '');
      L.push(`Where: ${(b.files || []).join(', ') || 'n/a'} · observed at: ${b.observed_at || 'n/a'}`, '');
      L.push(`- [ ] A is right: \`sd ledger --behaviour ${f.behaviour_id} --decision approve --by <you>\``);
      L.push(`- [ ] B (or something else) is right: \`sd ledger --behaviour ${f.behaviour_id} --decision reject --expected "<what should happen>" --by <you>\``, '');
    }
  }

  L.push('## Dropped requirements', '');
  if (!dropped.length) L.push('None confirmed.', '');
  for (const r of dropped) {
    const s = statements.get(r.statement_id);
    const p = probeBy.get(r.statement_id);
    L.push(`#### ${r.statement_id}`, '', `> ${s.text}`, '', `Plan line ${s.line_start}. Probe \`${p.probe_id}\` fails against the code: ${(p.message || '').split('\n')[0] || 'assertion failed'}`, '');
    if (r.status === 'realised') L.push(`_The trace had marked this realised (by ${r.realised_by.join(', ') || 'a quote'}); the probe overrules it._`, '');
    if (r.contradicted_by) L.push(`Contradicting behaviour(s): ${r.contradicted_by.join(', ')}.`, '');
  }
  if (unprobed.length) {
    L.push('### Not confirmed', '', 'No behaviour was traced to these statements, and no probe settled it:', '');
    unprobed.forEach((r) => L.push(`- ${r.statement_id}: ${statements.get(r.statement_id).text}`));
    L.push('');
  }

  if (loo && loo.rows && loo.rows.some((r) => r.outcome === 'resourced')) {
    L.push('## Leave-one-out: check these', '', 'The cited statement was hidden and the tracer still found a source. Either the plan says it twice, or the tracer is over-matching.', '');
    for (const r of loo.rows.filter((x) => x.outcome === 'resourced')) {
      L.push(`- ${r.behaviour_id}: now cites ${r.quotes.map((q) => `“${q.text}” (${q.statement_id})`).join('; ')}`);
    }
    L.push('');
  }

  if (entailed.length) {
    L.push('## Entailed (sample these)', '', 'Matched by combining passages. This is where over-matching hides; spot-check a few.', '');
    for (const f of entailed) {
      const b = behaviours.get(f.behaviour_id) || {};
      L.push(`- **${f.behaviour_id}** ${b.title || ''}: ${f.quotes.map((q) => `“${q.text}” (${q.statement_id})`).join(' + ')}. ${f.reasoning}`);
    }
    L.push('');
  }

  if (missed.length) {
    L.push('## Extractor misses', '', 'The code does realise these statements, but blind extraction did not describe the behaviour. This is a measure of extraction recall, not a defect in the code.', '');
    missed.forEach((r) => L.push(`- ${r.statement_id}: ${statements.get(r.statement_id).text}`));
    L.push('');
  }

  const outPath = path.join(runDir, 'delta.md');
  fs.writeFileSync(outPath, L.join('\n'));
  const metrics = {
    run_id: meta.run_id, silent_decisions: silent.length, dropped_requirements: dropped.length, delta: deltaSize, cap: meta.cap, over_cap: overCap, voided,
    scenarios: { extracted: results.length, verified: count('verified'), vacuous: count('vacuous'), refuted: count('refuted') },
    census: coverage ? { total: coverage.total, covered: coverage.covered, waived: coverage.waived, uncovered: coverage.uncovered } : null,
    extraction_recall_misses: missed.length,
    loo: loo ? loo.status : null, leak: leak ? leak.status : null,
  };
  writeJson(path.join(runDir, 'metrics.json'), metrics);
  process.stdout.write(JSON.stringify({ wrote: rel(proj, outPath), ...metrics }, null, 2) + '\n');
}
