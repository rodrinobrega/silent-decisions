// sd score: precision and recall of an arm's output against a case's ground truth.
// Every arm is reduced to the same shape first: flagged items with source lines, and
// dropped statement ids. See experiment/README.md for the arm definitions.
import fs from 'node:fs';
import path from 'node:path';
import { readJson, writeJson, fail, loadRun, rel } from './util.mjs';

function linesOf(item) { return new Set((item.lines || []).map(Number)); }
function overlaps(a, b) { for (const x of a) if (b.has(x)) return true; return false; }

/** Reduce an arm's raw output to {flagged:[{label, lines}], dropped:[statement_id]}. */
export function normalise(arm, runDir, inputFile) {
  if (['a', 'b', 'c'].includes(arm)) {
    // Free-form arms produce {decisions:[{description, file, lines}], dropped:[ids]} (see experiment/prompts).
    const j = readJson(inputFile);
    return {
      flagged: (j.decisions || []).map((d) => ({ label: d.description, lines: d.lines || [] })),
      dropped: j.dropped || [],
    };
  }
  const census = readJson(path.join(runDir, 'census.json'));
  const censusLines = new Map(census.map((c) => [c.id, c.line]));
  if (arm === 'f') {
    const t = readJson(path.join(runDir, 'trace.census.json'));
    return {
      flagged: t.items.filter((i) => i.verdict === 'undecided').map((i) => ({ label: `${i.census_id} ${i.code}`, lines: [i.line] })),
      dropped: t.reverse.filter((r) => r.status === 'untouched').map((r) => r.statement_id),
    };
  }
  // d and e: behaviour-level. Lines come from the census items each behaviour declared it covers.
  const checked = readJson(path.join(runDir, 'trace.checked.json'));
  const beh = new Map(readJson(path.join(runDir, 'behaviours.json')).behaviours.map((b) => [b.id, b]));
  const probes = fs.existsSync(path.join(runDir, 'probes.results.json')) ? readJson(path.join(runDir, 'probes.results.json')).results : [];
  return {
    flagged: checked.forward.filter((f) => f.verdict === 'unsourced').map((f) => {
      const b = beh.get(f.behaviour_id) || {};
      return { label: `${f.behaviour_id} ${b.title || ''}`, lines: (b.covers || []).map((c) => censusLines.get(c)).filter(Boolean) };
    }),
    dropped: probes.filter((p) => p.outcome === 'dropped').map((p) => p.statement_id),
  };
}

export function scoreAgainst(truth, norm) {
  const flagged = norm.flagged.map((f) => ({ ...f, set: linesOf(f) }));
  const found = truth.silent_decisions.map((t) => ({ id: t.id, label: t.label, hits: flagged.filter((f) => overlaps(f.set, linesOf(t))).map((f) => f.label) }));
  const negHits = truth.negative_controls.map((n) => ({ id: n.id, label: n.label, hits: flagged.filter((f) => overlaps(f.set, linesOf(n))).map((f) => f.label) }));
  const truthSets = truth.silent_decisions.map(linesOf);
  const tp = flagged.filter((f) => truthSets.some((t) => overlaps(f.set, t))).length;
  const noLines = flagged.filter((f) => f.set.size === 0).length;
  const droppedTruth = new Set(truth.dropped_requirements.map((d) => d.statement));
  const droppedFound = norm.dropped.filter((d) => droppedTruth.has(d));
  const r = (n, d) => (d ? Number((n / d).toFixed(3)) : null);
  return {
    silent_decisions: {
      truth: truth.silent_decisions.length, found: found.filter((f) => f.hits.length).length,
      flagged: flagged.length, flagged_without_lines: noLines,
      precision: r(tp, flagged.length), recall: r(found.filter((f) => f.hits.length).length, truth.silent_decisions.length),
      per_item: found,
    },
    negative_controls: { total: negHits.length, false_positives: negHits.filter((n) => n.hits.length).length, per_item: negHits },
    dropped_requirements: {
      truth: droppedTruth.size, found: droppedFound.length, flagged: norm.dropped.length,
      precision: r(droppedFound.length, norm.dropped.length), recall: r(droppedFound.length, droppedTruth.size),
    },
  };
}

export function score(args) {
  const arm = args.arm && String(args.arm);
  if (!arm || !/^[a-f]$/.test(arm)) fail('usage: sd score --arm a|b|c|d|e|f --truth <truth.json> [--input <arm-output.json>] [--out <results.json>] [--cost "<free text>"]');
  const truth = readJson(path.resolve(String(args.truth)));
  const { proj, runDir } = loadRun(args);
  const norm = normalise(arm, runDir, args.input && path.resolve(String(args.input)));
  const result = { arm, case: truth.case, run: path.basename(runDir), scored_at: new Date().toISOString(), cost: args.cost || null, ...scoreAgainst(truth, norm), normalised: norm };
  const out = args.out ? path.resolve(String(args.out)) : path.join(runDir, `score.${arm}.json`);
  writeJson(out, result);
  const sd = result.silent_decisions, dr = result.dropped_requirements;
  process.stdout.write(JSON.stringify({ wrote: rel(proj, out), arm, silent: { precision: sd.precision, recall: sd.recall, flagged: sd.flagged, found: `${sd.found}/${sd.truth}` }, negative_false_positives: result.negative_controls.false_positives, dropped: { precision: dr.precision, recall: dr.recall } }, null, 2) + '\n');
}
