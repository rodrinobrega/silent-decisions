// Summarise experiment/out/<case>/*/score.json as a markdown table (and results.md).
import fs from 'node:fs';
import path from 'node:path';
const root = path.resolve(path.dirname(new URL(import.meta.url).pathname));
// results.md always covers every case in out/ (run 004: writing only the case just run dropped the others);
// the argument only selects what is printed.
const cases = fs.readdirSync(path.join(root, 'out')).filter((c) => fs.statSync(path.join(root, 'out', c)).isDirectory()).sort();
const shown = process.argv[2] ? [process.argv[2]] : cases;
const names = { a: 'implementer self-report', b: 'sighted reviewer (one pass)', c: 'pipeline, sighted extractor', d: 'pipeline, LLM tracer + adversary', e: 'pipeline, pairwise classifier', f: 'census × plan classifier (no extraction)' };
const L = ['# Trace-mode experiment: results', ''];
const start = {};
for (const c of cases) {
  start[c] = L.length;
  L.push(`## ${c}`, '', '| Arm | Truth ver. | Silent (lines): precision | recall | flagged | Neg. FP | Dropped: precision | recall | Decision-level: recall (w/o post-hoc) | precision | Cost |', '|---|---|---|---|---|---|---|---|---|---|---|');
  for (const arm of 'abcdef') {
    const p = path.join(root, 'out', c, arm, 'score.json');
    if (!fs.existsSync(p)) { L.push(`| ${arm}. ${names[arm]} | | not run | | | | | | | | |`); continue; }
    const s = JSON.parse(fs.readFileSync(p, 'utf8'));
    const dl = s.decision_level;
    L.push(`| ${arm}. ${names[arm]} | v${s.truth_version || 1} | ${s.silent_decisions.precision} | ${s.silent_decisions.recall} | ${s.silent_decisions.flagged} | ${s.negative_controls.false_positives}/${s.negative_controls.total} | ${s.dropped_requirements.precision} | ${s.dropped_requirements.recall} | ${dl ? `${dl.recall} (${dl.recall_without_post_hoc})` : 'not adjudicated'} | ${dl ? dl.precision : ''} | ${s.cost || ''} |`);
  }
  L.push('');
}
fs.writeFileSync(path.join(root, 'results.md'), L.join('\n'));
const out = shown.flatMap((c) => { const i = cases.indexOf(c); return i < 0 ? [] : L.slice(start[c], i + 1 < cases.length ? start[cases[i + 1]] : L.length); });
process.stdout.write(['# Trace-mode experiment: results', '', ...out].join('\n') + '\n');
