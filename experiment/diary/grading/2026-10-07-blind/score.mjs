// Map blind grades back to arms, write adjudication files, rescore every rep with sd score --adjudication.
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

const repo = '~/Workspace/silent-decisions';
const here = path.dirname(new URL(import.meta.url).pathname);
const keysDir = path.join(here, '..', 'grading-keys');
const read = (p) => JSON.parse(fs.readFileSync(p, 'utf8'));
const D = (p) => path.join(repo, 'experiment/diary/runs', p);
const keyOf = (f, i) => ((f.label || '').match(/^[BC]-\d+/) || [`#${i + 1}`])[0];

const cases = { 'ledger-rounding': { project: 'examples/ledger-rounding', truth: 'experiment/cases/ledger-rounding/truth.json' },
  ledger: { project: 'examples/ledger', truth: 'experiment/cases/ledger/truth.json' } };

// Where each source's normalised list and scoring inputs live.
function locate(source) {
  const [run, rep] = source.split('/');
  if (rep === 'f') return { run, rep, arm: 'f', dir: `${run}/arm-f` };
  if (rep.startsWith('e-')) return { run, rep, arm: 'e', dir: `${run}/arm-e-${rep.slice(2)}` };
  return { run, rep, arm: rep[0], dir: `${run}/arm-${rep}` };
}

const results = [];
for (const [name, c] of Object.entries(cases)) {
  const key = read(path.join(keysDir, `${name}.key.json`));
  const truth = read(path.join(repo, c.truth));
  const grades = {};
  for (const code of Object.keys(key.lists)) grades[code] = read(path.join(here, name, 'packet/out', `${code}.json`)).grades;
  // Test-retest on the duplicated list.
  const codes = Object.entries(key.lists);
  const dupCode = codes.find(([, v]) => v.duplicate_of)[0];
  const origCode = codes.find(([k, v]) => !v.duplicate_of && v.source === key.lists[dupCode].duplicate_of)[0];
  const agree = grades[dupCode].filter((g, i) => g.verdict === grades[origCode][i].verdict).length;
  results.push({ case: name, retest: { list: key.lists[dupCode].duplicate_of, items: grades[dupCode].length, same_verdict: agree,
    differing: grades[dupCode].map((g, i) => [g.item, grades[origCode][i].verdict, g.verdict]).filter(([, a, b]) => a !== b) } });

  for (const [code, info] of codes) {
    if (info.duplicate_of) continue;
    const loc = locate(info.source);
    const score = read(D(`${loc.dir}/score.json`));
    const flagged = score.normalised.flagged;
    if (flagged.length !== grades[code].length) throw new Error(`${info.source}: ${flagged.length} flagged vs ${grades[code].length} graded`);
    const items = {};
    grades[code].forEach((g, i) => { items[keyOf(flagged[i], i)] = g.verdict; });
    const adj = { case: name, truth_version: truth.version, run: loc.run, arm: loc.arm, rep: loc.rep,
      adjudicator: `Blind grader: a fresh claude -p session (claude-opus-5-5) given only the plan, the code, the answer key (labels, no lines) and anonymous shuffled lists; it was not told which method produced which list. Transcript audited: no access to the key or the repo. ${new Date().toISOString().slice(0, 10)}.`,
      blind: true, list_code: code, items, notes: grades[code].map((g) => `${keyOf(flagged[g.item - 1], g.item - 1)}: ${g.note || ''}`) };
    const adjPath = path.join(repo, 'experiment/cases', name, 'adjudication', `run-${loc.run}-${loc.arm}-${loc.rep.replace(/^e-/, '')}.blind.json`.replace(`-${loc.arm}-${loc.arm}`, `-${loc.arm}`));
    fs.writeFileSync(adjPath, JSON.stringify(adj, null, 2) + '\n');
    const args = ['score', '--arm', loc.arm, '--truth', path.join(repo, c.truth), '--adjudication', adjPath, '--out', D(`${loc.dir}/score.blind.json`)];
    if (fs.existsSync(D(`${loc.dir}/output.json`))) args.push('--input', D(`${loc.dir}/output.json`));
    else args.push('--run', score.run || fs.readFileSync(D(`${loc.dir}/sd-run-id`), 'utf8').trim());
    const r = spawnSync('node', [path.join(repo, 'skills/silent-decisions/scripts/sd.mjs'), ...args], { cwd: path.join(repo, c.project), encoding: 'utf8' });
    if (r.status !== 0) throw new Error(`${info.source}: ${r.stderr}`);
    const s = read(D(`${loc.dir}/score.blind.json`));
    results.push({ case: name, source: info.source, arm: loc.arm, flagged: flagged.length, ...s.decision_level, dropped: s.dropped_requirements, adjPath: path.relative(repo, adjPath) });
  }
}
fs.writeFileSync(path.join(here, 'results.json'), JSON.stringify(results, null, 2));
for (const r of results) {
  if (r.retest) { console.log(`${r.case} retest on ${r.retest.list}: ${r.retest.same_verdict}/${r.retest.items} same; differing ${JSON.stringify(r.retest.differing)}`); continue; }
  console.log([r.case.padEnd(16), r.source.padEnd(8), `fl ${r.flagged}`, `R ${r.recall} (orig ${r.recall_without_post_hoc})`, `P ${r.precision}`, `valid ${r.valid_unlisted.length}`, `fp ${r.false_positives.length}`, `misb ${r.misbucketed.length}`, `missed ${r.missed.join(',')}`, `dropR ${r.dropped.recall}`].join(' | '));
}
