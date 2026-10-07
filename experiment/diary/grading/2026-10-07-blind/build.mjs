// Build blind grading packets: one per case, every arm's flagged items in one uniform shape,
// shuffled under random list codes, one list duplicated (test-retest). The key stays outside the packet.
import fs from 'node:fs';
import path from 'node:path';

const repo = '~/Workspace/silent-decisions';
const here = path.dirname(new URL(import.meta.url).pathname);
const D = (p) => path.join(repo, 'experiment/diary/runs', p);
const read = (p) => JSON.parse(fs.readFileSync(p, 'utf8'));

// Seeded shuffle so the packet is reproducible from the seed recorded in the key.
function rng(seed) { let s = seed >>> 0; return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 2 ** 32); }
function shuffle(a, r) { a = [...a]; for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }

const scen = (b) => `${b.title}. Given ${b.given}; when ${b.when}; then ${b.then}.`;

function exported(run, rep) { // runs 006/007: flagged-<arm>-<n>.json, decision items only
  return read(D(`${run}/flagged-${rep}.json`)).filter((i) => i.kind === 'code decision the plan does not make')
    .map((i) => ({ n: i.n, text: i.description || scen(i), lines: i.lines }));
}
function pipelineE(dir) { // arm e: normalised order from score.json, scenario text from behaviours.verified.json
  const s = read(D(`${dir}/score.json`));
  const bs = new Map(read(D(`${dir}/behaviours.verified.json`)).behaviours.map((b) => [b.id, b]));
  return s.normalised.flagged.map((f, i) => ({ n: i + 1, text: scen(bs.get(f.label.match(/^B-\d+/)[0])), lines: f.lines }));
}
function censusF(dir) { // arm f: a decision point in the code with no plan sentence matched
  const s = read(D(`${dir}/score.json`));
  return s.normalised.flagged.map((f, i) => ({ n: i + 1, text: `The code makes a decision at this point, and no plan sentence covers it: \`${f.label.replace(/^C-\d+\s*/, '')}\``, lines: f.lines }));
}

const cases = {
  'ledger-rounding': {
    seed: 20261007, project: 'examples/ledger-rounding', truth: 'experiment/cases/ledger-rounding/truth.json',
    lists: [
      ...['a-1', 'a-2', 'a-3', 'b-1', 'b-2', 'b-3', 'c-1', 'd-1'].map((r) => ({ source: `006/${r}`, items: exported('006', r) })),
      ...['a', 'b', 'c'].map((r) => ({ source: `005/e-${r}`, items: pipelineE(`005/arm-e-${r}`) })),
      { source: '005/f', items: censusF('005/arm-f') },
    ],
  },
  ledger: {
    seed: 20261008, project: 'examples/ledger', truth: 'experiment/cases/ledger/truth.json',
    lists: [
      ...['a-1', 'a-2', 'a-3', 'b-1', 'b-2', 'b-3', 'c-1', 'd-1'].map((r) => ({ source: `007/${r}`, items: exported('007', r) })),
      ...['a', 'b', 'c'].map((r) => ({ source: `003/e-${r}`, items: pipelineE(`003/arm-e-${r}`) })),
      { source: '003/f', items: censusF('003/arm-f') },
    ],
  },
};

for (const [name, c] of Object.entries(cases)) {
  const r = rng(c.seed);
  const dup = c.lists[Math.floor(r() * c.lists.length)];
  const all = shuffle([...c.lists, { ...dup, duplicate_of: dup.source }], r);
  const out = path.join(here, name, 'packet');
  fs.rmSync(path.join(here, name), { recursive: true, force: true });
  fs.mkdirSync(path.join(out, 'lists'), { recursive: true });
  fs.mkdirSync(path.join(out, 'src'), { recursive: true });
  fs.mkdirSync(path.join(out, 'out'), { recursive: true });
  fs.copyFileSync(path.join(repo, c.project, 'plan.md'), path.join(out, 'plan.md'));
  fs.copyFileSync(path.join(repo, c.project, 'src/ledger.ts'), path.join(out, 'src/ledger.ts'));
  // Truth for the grader: ids and plain labels only. No lines, provenance, post-hoc flags or markers.
  const t = read(path.join(repo, c.truth));
  const clean = (s) => s.replace(/^PLANTED NEW UNSOURCED RULE:\s*/i, '');
  const truth = {
    silent_decisions: t.silent_decisions.map((x) => ({ id: x.id, decision: clean(x.label) })),
    not_implemented: t.dropped_requirements.map((x) => ({ id: x.id, plan_statement: x.statement, what: x.label })),
    decided_by_the_plan: t.negative_controls.map((x) => x.label),
  };
  fs.writeFileSync(path.join(out, 'answer-key.json'), JSON.stringify(truth, null, 2));
  const key = { case: name, seed: c.seed, built_at: new Date().toISOString(), lists: {} };
  all.forEach((l, i) => {
    const code = `L${String(i + 1).padStart(2, '0')}`;
    fs.writeFileSync(path.join(out, 'lists', `${code}.json`), JSON.stringify(l.items.map((x) => ({ item: x.n, text: x.text, lines: x.lines })), null, 2));
    key.lists[code] = { source: l.source, items: l.items.length, ...(l.duplicate_of ? { duplicate_of: l.duplicate_of } : {}) };
  });
  fs.writeFileSync(path.join(here, name, 'key.json'), JSON.stringify(key, null, 2));
  console.log(name, all.length, 'lists,', all.reduce((a, l) => a + l.items.length, 0), 'items; duplicate:', dup.source);
}
