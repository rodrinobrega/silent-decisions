#!/usr/bin/env node
// silent-decisions CLI. Everything deterministic lives here, so model judgement is
// confined to extraction, tracing, the adversary and probe writing.
import { parseArgs, fail } from './lib/util.mjs';

const HELP = `silent-decisions: find what the code decided that the plan did not.

  sd init --plan <plan.md> [--include <glob,..>] [--exclude <glob,..>] [--base <git-ref>] [--cap 25]
        Segment the plan, build the clean room, take the decision-point census.
  sd extract-strict [--dry-run]
        Run the blind extractor as a separate headless session (strict mode).
  sd run            Execute extracted scenarios, each with its perturbed twin (and against --base).
  sd census         Check that every census item is covered by a verified scenario or waived.
  sd trace-pairwise [--loo] [--threshold 0.7] [--source-threshold 0.86] [--contraries primary|all] [--dry-run]
        Trace with a decision-only classifier (SD_CLASSIFIER_CMD), one (statement, behaviour) pair per call,
        instead of the LLM tracer + adversary. Writes trace.json (or loo/trace.json with --loo).
  sd trace-census [--threshold 0.7]
        Baseline (experiment arm f): plan sentence x census item through the classifier. No extraction,
        no execution. Writes trace.census.json and census-delta.md; does not feed check-trace.
  sd check-trace    Verify quotes, apply the verdict rules and the adversary's flip-test findings.
  sd run --probes   Execute reverse probes (every behavioural statement by default).
  sd loo-prepare [--k 3]   Hide k sole-source plan statements for the leave-one-out control.
  sd loo-score      Score the tracer's second pass on the redacted plan.
  sd leak-check     Look for plan text and the run nonce in the extractor's output.
  sd render         Write delta.md and metrics.json.
  sd ledger --behaviour <id> --decision approve|reject --by <name> [--expected "..."]
  sd score --arm a..f --truth <truth.json> [--input <file>]
        Precision/recall of an arm's output against a case's ground truth (experiment).
  sd status         Show the current run and which artefacts exist.

Common options: --project <dir> (default: cwd), --run <run-id> (default: current).
`;

const args = parseArgs(process.argv.slice(2));
const cmd = args._[0];

const table = {
  init: async () => (await import('./lib/init.mjs')).init(args),
  'extract-strict': async () => (await import('./lib/strict.mjs')).extractStrict(args),
  run: async () => (await import('./lib/run.mjs')).run(args),
  census: async () => (await import('./lib/checks.mjs')).censusCoverage(args),
  'trace-pairwise': async () => (await import('./lib/pairwise.mjs')).tracePairwise(args),
  'trace-census': async () => (await import('./lib/census-trace.mjs')).traceCensus(args),
  'check-trace': async () => (await import('./lib/checks.mjs')).checkTrace(args),
  'loo-prepare': async () => (await import('./lib/checks.mjs')).looPrepare(args),
  'loo-score': async () => (await import('./lib/checks.mjs')).looScore(args),
  'leak-check': async () => (await import('./lib/checks.mjs')).leakCheck(args),
  render: async () => (await import('./lib/render.mjs')).render(args),
  ledger: async () => (await import('./lib/ledger.mjs')).ledger(args),
  score: async () => (await import('./lib/score.mjs')).score(args),
  status: async () => (await import('./lib/status.mjs')).status(args),
};

if (!cmd || cmd === 'help' || args.help) { process.stdout.write(HELP); process.exit(0); }
if (!table[cmd]) fail(`unknown command "${cmd}". Run \`sd help\`.`);
await table[cmd]();
