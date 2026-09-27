// sd ledger: record a human decision. Append-only; plan prose is never edited.
import fs from 'node:fs';
import path from 'node:path';
import { readJson, fail, loadRun, rel, normalizeWs } from './util.mjs';

export function ledger(args) {
  const { proj, state, runDir, meta } = loadRun(args);
  const id = args.behaviour && String(args.behaviour);
  const decision = args.decision && String(args.decision);
  const by = args.by && String(args.by);
  if (!id || !['approve', 'reject'].includes(decision) || !by) {
    fail('usage: sd ledger --behaviour B-003 --decision approve|reject --by <name> [--expected "<what should happen>"] [--note "..."]');
  }
  if (decision === 'reject' && !args.expected) fail('a rejection needs --expected "<what should happen instead>"');
  const beh = readJson(path.join(runDir, 'behaviours.json')).behaviours.find((b) => b.id === id);
  if (!beh) fail(`unknown behaviour ${id} in run ${meta.run_id}`);
  const result = readJson(path.join(runDir, 'results.json')).results.find((r) => r.id === id);
  if (!result || result.status !== 'verified') fail(`${id} is not a verified behaviour (${result ? result.status : 'no result'}); only verified behaviour can be signed`);

  const ledgerPath = path.join(state, 'decisions.md');
  let text = fs.existsSync(ledgerPath) ? fs.readFileSync(ledgerPath, 'utf8')
    : '# Decisions ledger\n\nAppend-only. Each entry is a behaviour a person looked at and ruled on. The tracer treats approved entries as part of the plan.\n';
  const next = Math.max(0, ...[...text.matchAll(/^##\s+D-(\d+)/gm)].map((m) => Number(m[1]))) + 1;
  const did = `D-${String(next).padStart(3, '0')}`;
  const date = new Date().toISOString().slice(0, 10);
  const scenario = normalizeWs(`Given ${beh.given} When ${beh.when} Then ${decision === 'approve' ? beh.then : String(args.expected)}`);

  const entry = [
    '', `## ${did} · ${decision === 'approve' ? 'approved' : 'rejected'} · ${date} · ${by}`, '',
    `- behaviour: ${id} (${normalizeWs(beh.title || '')}), run ${meta.run_id}, plan sha256 ${meta.plan_sha256.slice(0, 12)}`,
    `- scenario: ${scenario}`,
    `- decision: ${decision === 'approve' ? 'the code is right as built' : `the code is wrong; it currently does: ${normalizeWs(beh.then)}`}`,
    ...(args.note ? [`- note: ${normalizeWs(String(args.note))}`] : []), '',
  ].join('\n');
  fs.writeFileSync(ledgerPath, text.replace(/\n*$/, '\n') + entry);

  let artefact;
  if (decision === 'approve') {
    // Promote to a human-signed regression test: the only tests whose oracle a person has adjudicated.
    const dir = path.join(state, 'signed');
    fs.mkdirSync(dir, { recursive: true });
    const imports = String(beh.test.imports || '').replace(/(['"])@sut\//g, '$1../../');
    artefact = path.join(dir, `${did}.${id}.test.ts`);
    fs.writeFileSync(artefact, `// Signed scenario ${did}: approved by ${by} on ${date}.\n// ${scenario}\nimport { test, expect, vi } from 'vitest';\n${imports}\n\ntest(${JSON.stringify(`${did} ${beh.title || id}`)}, async () => {\n${beh.test.arrange_act}\n${beh.test.assert}\n});\n`);
  } else {
    // Hand the implementer a precise, human-decided requirement. Writing the failing test is the implementer's first step.
    const dir = path.join(state, 'acceptance');
    fs.mkdirSync(dir, { recursive: true });
    artefact = path.join(dir, `${did}.${id}.md`);
    fs.writeFileSync(artefact, `# ${did}: required behaviour\n\nDecided by ${by} on ${date}.\n\n> Given ${beh.given}\n> When ${beh.when}\n> Then ${args.expected}\n\nThe code currently does this instead: ${beh.then}\n\nFiles: ${(beh.files || []).join(', ')}\n\nFirst write a test for the required behaviour and watch it fail, then change the code.\n`);
  }
  process.stdout.write(JSON.stringify({ decision_id: did, ledger: rel(proj, ledgerPath), wrote: rel(proj, artefact) }, null, 2) + '\n');
}
