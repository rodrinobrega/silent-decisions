# silent-decisions

**Find what AI-written code decided that the plan didn't.**

> **Status: research experiment, not a product.** It works end to end on two small test cases I
> built. It has **not** been shown to beat simpler methods on code I didn't write. Details in
> [What happened](#what-happened). The write-up is in the blog post (link coming).

## The problem

You write a plan. An AI agent implements it. The code is clean and the tests pass. Somewhere inside
it, the agent decided that withdrawals are capped at 5,000 a day, that amounts round half-up, and
that opening an account that already exists does nothing. None of that was in the plan.

These are **silent decisions**. Tests don't catch them, because the tests came from the same reading
of the same plan. Reviewers often miss them too, because a sensible rule read with the plan in mind
looks intended.

## The idea

Start from the code, not the plan. Describe what the code actually does, without ever showing the
plan to whoever describes it, run every description as a test, and only then ask, sentence by
sentence: *which of these behaviours does the plan actually ask for?* Whatever is left over is a
silent decision. Plan sentences the code doesn't satisfy are dropped requirements.

## How it works

```
 code ─▶ 1. Prepare ─▶ 2. Extract, blind ─▶ 3. Run ─▶ 4. Trace back ─▶ 5. Probe forwards ─▶ delta
                ╰────── the plan is never in context here ──────╯        ▲               ▲
                                                                         └──── plan ─────┘
```

1. **Prepare.** Copy the source into a clean room with comments, tests, docs and git history
   removed (agent code often carries the plan in its comments). An AST walk lists every decision
   point: literals, comparisons, rejection paths, rounding calls.
2. **Extract, blind.** A fresh agent that has never seen the plan writes what the code does as
   concrete Given/When/Then scenarios, each with a *contrary*: what a different reasonable
   implementation would do.
3. **Run everything.** Every scenario becomes a test. Each also runs with a perturbed twin that must
   fail.
4. **Trace back.** For each (plan sentence, scenario) pair, a small classifier answers one question:
   does this sentence require what the code does, the contrary, or neither? Asked twice with the
   options swapped; answers that move with position are discarded.
5. **Probe forwards.** Every behavioural plan sentence gets a probe test. A failing probe is a
   dropped requirement.
6. **Control the run.** Hide a few plan sentences and re-trace (dependent behaviours must come back
   unsourced). A canary string checks the extractor really was blind. A failed control voids the run.

The output is a short list of cards, each a choice between what the code does and an alternative.
See [`examples/ledger/sample-delta.md`](examples/ledger/sample-delta.md) (hand-written fixtures, for
the format). The full method is in [`docs/methodology.md`](docs/methodology.md).

## What happened

Two planted TypeScript cases (`ledger`: 10 silent decisions, `ledger-rounding`: 22), five runs.
Arm e is the full pipeline; arm f is a cheap baseline that matches AST decision points against plan
sentences with no extraction and no execution. Recall = share of planted silent decisions found.

| Run | Case | Pipeline (e) | Baseline (f) | Dropped requirements (e) |
|---|---|---|---|---|
| 001 | ledger | 0.80 | 0.60 | 0 / 1 |
| 002 | ledger | 0.90 | 0.60 | 1 / 1 |
| 003 | ledger | 0.97 (3 reps, 0.90–1.0) | 0.60 | 3 / 3 |
| 004 | ledger-rounding | 0.77 (3 reps) | 0.55 | 9 / 9 |
| 005 | ledger-rounding | 0.83 (3 reps, 0.77–0.91) | 0.50 | 9 / 9 |

All 461 extracted scenarios were verified by execution. The pipeline took ~400 s per run on the
larger case against ~5 s for the baseline.

**Why this is not evidence that the method works:**

- **The comparisons that matter never ran.** Arms a–d (ask the implementer what it decided; a
  sighted reviewer; a sighted extractor; an LLM tracer) are written in `experiment/` but were never
  executed. The pipeline beats a static scan; whether it beats *just asking* is unknown.
- **Self-made cases, non-blind grading.** Both cases and their answer keys were written on my side,
  with an AI agent, and graded by that agent knowing which arm produced what. On the original
  `ledger` key the baseline actually won (1.0 vs 0.8); the pipeline pulled ahead only after
  decisions found in its own output were added to the key.
- **Tuned on the test set.** Each run's misses were fixed and re-measured on the same case.
- **High variance.** Three repetitions of the same run scored 0.77, 0.82 and 0.91.
- **Known weaknesses:** planned rules flagged as silent (3–4 per run), general plan sentences
  "explaining" specific decisions, and some interaction decisions never extracted.

Every run is recorded, including what went wrong, in [`experiment/diary/`](experiment/diary/README.md).
Each run's code is tagged `run-001` … `run-005`.

## Try it

Without any model (runs every script against recorded fixtures):

```bash
npm install
npm run example:install
./examples/ledger/demo.sh
npm test
```

As a Claude Code plugin, in a TypeScript/JavaScript project with `vitest`:

```bash
claude --plugin-dir /path/to/silent-decisions
```

> Check the code against `docs/plan.md` for silent decisions. The change started from `main`.

The classifier step uses Jev (`typesafe/jev-1.13` via OpenRouter, `OPENROUTER_API_KEY`) or any
fixed-label model behind `SD_CLASSIFIER_CMD`. To rerun the experiment: `experiment/run.sh <case> [arms]`
(see [`experiment/README.md`](experiment/README.md)).

## Layout

```
skills/silent-decisions/   portable core: SKILL.md, scripts/sd.mjs (CLI), prompts, classifier adapters
agents/, hooks/            Claude Code plugin pieces (generated agents, extractor confinement hook)
experiment/                six-arm experiment: prompts, runner, scorer, cases + answer keys, run diary
examples/                  the two test cases (plan + code) and recorded fixtures
docs/                      methodology write-up and explainer page
schemas/, test/            JSON Schemas for model output; tests for the deterministic scripts
CLAUDE.md                  notes for the local Claude Code session that ran the experiments
```

## Related work

The closest published neighbour is [AssumptionMiner](https://arxiv.org/abs/2607.22898) (Wu, 2026),
which extracts implicit assumptions from LLM-generated code with the prompt in view and without
executing anything. Older roots: characterization tests (Feathers), specification mining (Daikon),
requirements traceability, TiCoder. What this project tried that I haven't seen elsewhere: blind
extraction as a contamination control, execution-verified behaviour as the thing traced, and a
per-run control on the tracer.

## Licence

MIT
