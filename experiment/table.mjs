// Summarise experiment/out/<case>/*/score.json as a markdown table (and results.md).
import fs from 'node:fs';
import path from 'node:path';
const root = path.resolve(path.dirname(new URL(import.meta.url).pathname));
const cases = process.argv[2] ? [process.argv[2]] : fs.readdirSync(path.join(root, 'out'));
const names = { a: 'implementer self-report', b: 'sighted reviewer (one pass)', c: 'pipeline, sighted extractor', d: 'pipeline, LLM tracer + adversary', e: 'pipeline, pairwise classifier', f: 'census × plan classifier (no extraction)' };
const L = ['# Trace-mode experiment: results', ''];
for (const c of cases) {
  L.push(`## ${c}`, '', '| Arm | Silent decisions: precision | recall | flagged | Negative-control false positives | Dropped: precision | recall | Cost |', '|---|---|---|---|---|---|---|---|');
  for (const arm of 'abcdef') {
    const p = path.join(root, 'out', c, arm, 'score.json');
    if (!fs.existsSync(p)) { L.push(`| ${arm}. ${names[arm]} | not run | | | | | | |`); continue; }
    const s = JSON.parse(fs.readFileSync(p, 'utf8'));
    L.push(`| ${arm}. ${names[arm]} | ${s.silent_decisions.precision} | ${s.silent_decisions.recall} | ${s.silent_decisions.flagged} | ${s.negative_controls.false_positives}/${s.negative_controls.total} | ${s.dropped_requirements.precision} | ${s.dropped_requirements.recall} | ${s.cost || ''} |`);
  }
  L.push('');
}
fs.writeFileSync(path.join(root, 'results.md'), L.join('\n'));
process.stdout.write(L.join('\n') + '\n');
