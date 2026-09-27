# silent-decisions

**Find what the code decided that the plan did not.**

An agent implements your plan. The code is clean, the tests pass, and somewhere inside it the agent decided that withdrawals are capped at 5,000 a day, that amounts round half-up, and that a retried request with a different amount is silently ignored. None of that was in the plan. The tests agree with the code because they came from the same reading of the same plan.

`silent-decisions` works backwards from the code instead:

1. **Extract, blind.** An agent that has never seen the plan reads a stripped copy of the source and writes what the code does as concrete scenarios with real values.
2. **Verify by execution.** Every scenario is run. Each also runs with a *perturbed twin*, the opposite outcome, which must fail. What survives is a verified account of behaviour, not a claim about intent.
3. **Trace, both ways.** Two modes. With a decision-only classifier (a Jev-style model, or any fixed-label model behind `SD_CLASSIFIER_CMD`), every (plan statement, scenario) pair is asked one question in isolation: does this sentence require what the code does, require the contrary the blind extractor wrote, or neither? Asked twice with the outcomes swapped; answers that move with the position are discarded. The only model that reads the plan then never sees more than one sentence of it at a time, and can't write. Without a classifier, an LLM tracer must quote the plan verbatim and an adversary tries to show the opposite behaviour satisfies the quote. Either way, plan statements nothing realises get an executable probe.
4. **Control the run.** A few plan statements are hidden and the trace repeated; behaviours that depended on them must come back unsourced. A canary string and a phrase-overlap test check that the extractor really was blind.
5. **Review the delta.** You read only the silent decisions and the dropped requirements, each as a choice between what the code does and a concrete alternative.
6. **Record.** Approved behaviour becomes a human-signed regression test and part of what future runs can quote.

See [`examples/ledger/sample-delta.md`](examples/ledger/sample-delta.md) for what you get. This is explicitly an experiment: see [Status](#status). The method write-up, *Trace What Was Built*, is in [`docs/methodology.md`](docs/methodology.md).

## Try it without an agent

```bash
npm install                 # typescript, for the scripts
npm run example:install     # vitest + typescript for the example
./examples/ledger/demo.sh   # runs every script against recorded model outputs
npm test
```

## Use it in Claude Code

```bash
claude --plugin-dir /path/to/silent-decisions
```

Then, in a TypeScript or JavaScript project with `vitest` installed, after a plan has been implemented:

> Check the code against `docs/plan.md` for silent decisions. The change started from `main`.

The plugin ships the orchestrating skill, a forked `sd-extract` skill that runs the blind extractor in its own context, four agent definitions, and a `PreToolUse` hook that confines the extractor to its room (allowlist, not denylist) and logs every file it touches to `audit.jsonl`.

For numbers you intend to publish, use strict mode (`sd extract-strict`), which runs the extractor as a separate headless session in a directory outside the repository.

## Use it elsewhere

`skills/silent-decisions/` is self-contained (plain Node scripts, no build step). Copy it into your agent's skills folder. Each role is "a fresh session, a prompt file, some paths, one JSON file out"; see [`references/portability.md`](skills/silent-decisions/references/portability.md).

## Layout

```
.claude-plugin/plugin.json
skills/silent-decisions/        the portable core
  SKILL.md                      orchestrator instructions
  scripts/sd.mjs                CLI: init, run, census, check-trace, loo-*, leak-check, render, ledger
  scripts/hook-confine.mjs      extractor confinement + audit log
  scripts/classifiers/          classifier adapters: jev (OpenRouter or TypeSafe direct), http (template), claude-headless, fixture
experiment/                     six-arm trace-mode experiment: prompts, runner, scorer, ground truth
docs/                           methodology.md and the explainer page (silent-decisions.html)
  references/                   extractor prompt, role prompts, formats, limits, portability
skills/sd-extract/SKILL.md      generated: context: fork + the extractor prompt
agents/                         generated from references/roles/
hooks/hooks.json
schemas/                        JSON Schemas for the model-written files
examples/ledger/                plan, code with planted silent decisions, fixtures, demo
test/
```

`npm run sync` regenerates `skills/sd-extract/SKILL.md` and `agents/*.md` after you edit a prompt under `references/`. A test fails if they drift, and another fails if the extractor's prompt ever mentions a plan.

## Status

v0.1. What has and has not been exercised:

| | |
|---|---|
| Deterministic scripts (segmenting, clean room, census, twins, base/head, verdict rules, leave-one-out, leak check, render, ledger, hook logic) | Tested end to end in `test/` against the example |
| The four prompts | Written, **never run against a model** |
| `context: fork` + `agent:` invocation, `omitClaudeMd`, hook seeing `agent_type` for the forked subagent | Built from the Claude Code docs, **not yet verified in a live session** |
| Strict mode command line | Dry-run only |
| Pairwise classifier mode (`sd trace-pairwise`, `sd trace-census`, leave-one-out) | Scripts tested against a fixture classifier; **no real classifier has been called**. `classifiers/jev.mjs` is written to Jev's documented `systemone` API (`state` + `questions`, choice/noul), unexercised |
| `experiment/run.sh`, `sd score` | Scorer tested; runner unexecuted |
| Any claim that blind extraction beats a sighted reviewer or plain self-report | **Unmeasured.** That experiment is the point of the project |

### First run checklist

1. `claude --plugin-dir .` in `examples/ledger`, ask for a silent-decisions check of `plan.md`.
2. After extraction, open `.silent-decisions/runs/<id>/audit.jsonl`. If it does not exist, the hook did not see the extractor's `agent_type`; note what `agent_type` the hook did receive (add a temporary log line) and fix the pattern at the top of `hook-confine.mjs`.
3. Confirm `leak.json` says `clean` and `nonce_seen` is false. Then break it on purpose, twice. Paste the run's nonce into a comment in `src/ledger.ts` and re-run: comments are stripped, so it should stay `clean`. Put it in a string literal and re-run: it should come back `contaminated`.
4. Compare the real delta with `sample-delta.md`. The example has five planted silent decisions and one dropped requirement.

### The experiment

Six arms on the same plan and code, scored against line-level ground truth: (a) implementer self-report, (b) sighted reviewer, (c) pipeline with a sighted extractor, (d) pipeline with the LLM tracer, (e) pipeline with the pairwise classifier, (f) census × plan through the classifier with no extraction. See `experiment/README.md`. To run:

```bash
export OPENROUTER_API_KEY=...      # Jev, model typesafe/jev-1.13, via the systemone endpoint
experiment/run.sh ledger           # needs `claude` logged in for arms a-d and the extractor
```

The runner has not been executed end to end yet; expect to fix small things on the first pass.

### Not in v0.1

Behaviour a change *removed*; line-coverage confirmation of census links; languages other than TS/JS; divergence across several implementations; tracing the plan back to the original prompt; inducing invariants from signed scenarios.

## Prior work

The closest published neighbour is AssumptionMiner (Wu, 2026), which extracts implicit assumptions from LLM-generated code with the prompt in view and without executing anything. Sampling several implementations to expose ambiguity is established at function level (ClarifyGPT, SpecFix, BeSpec). Characterization tests (Feathers), specification mining (Daikon), requirements traceability, TiCoder, Clover and round-trip correctness are the older roots. What this project adds is the combination: blind extraction as a contamination control, execution-verified behaviour as the thing traced, the flip test, a per-run control on the tracer, and delta size as a measure of the plan.

## Licence

MIT
