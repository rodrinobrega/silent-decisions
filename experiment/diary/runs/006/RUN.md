# Run 006 · 2026-10-06

| | |
|---|---|
| Commit | `e8824ae` · tag `run-006` |
| Case | `ledger-rounding` · truth file v1 |
| Arms | a ×3, b ×3, c ×1, d ×1 (first execution of arms a–d) |
| Method | as run 005 for the pipeline. New harness: every role goes through `experiment/claude-role.sh` (model pinned, cost logged), and arm c is scored from the pipeline (`e8824ae`) |
| Models | every role (arm a/b reviewer, c sighted extractor, d blind extractor, tracer, adversary, probe writer): `claude-opus-5-5`, pinned with `--model`, via **Claude Code 2.1.291** (run 005: 2.1.283), `claude -p --setting-sources project --strict-mcp-config`. Each arm's `run-env.json` records it, and every session's `cost.jsonl` line confirms the model. No Jev calls (c and d use the LLM tracer). |
| sd run ids | a: `20261006T060802-f14cc9` · `20261006T060901-ef7b93` · `20261006T061002-f6c75a`; b: `20261006T061054-73e587` · `20261006T061159-c88a40` · `20261006T061305-534dc6`; c: `20261006T061410-2d700c`; d: `20261006T062148-32eeef` |
| Operator | local Claude Code session (Opus 5.5) on Rodrigo's Mac |

## Why this run

Arms a–d had never been run. They are the comparison that matters most: does the pipeline find
anything that the implementer's self-report (a) or one sighted review pass (b) does not? Rodrigo
approved the subscription usage.

## Results

**Line-level only.** As Rodrigo asked, these arms were **not adjudicated** here. Every rep's flagged
items are exported for a separate, blind grading session to
`flagged-<arm>-<rep>.json`. Those files are plain lists with no arm name, no ids and no pipeline
vocabulary. For a/b each item has a description, file and lines; for c/d each has
title/given/when/then, files and lines. Item `n` corresponds to index `n-1` of `normalised.flagged` in
that rep's `score.json`; dropped statements follow the decisions. Decision-level numbers will come from
that grading.

| Arm · rep | Silent P / R (22) | Flagged | Neg. FP (8) | Dropped P / R (3) | Missed (line) | Wall | Cost† |
|---|---|---|---|---|---|---|---|
| a-1 | 0.735 / 0.909 | 34 | 6 | 1 / 1 | T7, T12 | 56 s | $0.30 |
| a-2 | 0.800 / **1.0** | 30 | 7 | 0.75 / 1 | – | 57 s | $0.28 |
| a-3 | 0.705 / 0.955 | 44 | 7 | 1 / 1 | T7 | 48 s | $0.25 |
| **a mean** | **0.747 / 0.955** | 36 | 6.7 | 0.92 / 1 | T7 2/3 | 54 s | $0.28 |
| b-1 | 0.800 / 0.955 | 35 | 6 | 1 / 1 | T7 | 62 s | $0.32 |
| b-2 | 0.771 / 0.955 | 35 | 7 | 1 / 1 | T7 | 60 s | $0.30 |
| b-3 | 0.767 / 0.955 | 30 | 6 | 1 / 1 | T7 | 55 s | $0.29 |
| **b mean** | **0.779 / 0.955** | 33 | 6.3 | 1 / 1 | T7 3/3 | 59 s | $0.30 |
| c-1 | 0.912 / 0.864 | 34 | 5 | 1 / 1 | T10, T11, T12 | 445 s | $2.19 (5 sessions) |
| d-1 | **0.963** / 0.864 | 54 | 6 | 1 / 1 | T10, T11, T12 | 620 s | $3.07 (5 sessions) |
| *e, run 005 (ref.)* | *0.90 / 0.85 (0.818–0.864)* | *29* | *5.3* | *1 / 1* | *T10–T12 3/3, T8 1/3* | *411 s* | *not logged* |

† Costs are API-equivalent figures as reported by `claude -p` (`total_cost_usd`). This run used the
subscription, so nothing was billed. Run 005 logged no cost.

Planted unsourced rule T21 (line 62) is hit at line level by every rep of every arm. In a and b it
is a description of the 0.005 minimum on foreign deposits. Whether those descriptions name the rule as
the plan's or as unplanned is a question for the blind grading.

The a-2 extra dropped item is P-008, flagged as not implemented.

## Controls

- c-1: 38/38 scenarios verified (0 vacuous, 0 refuted); census 34/35 covered, 1 waived;
  leave-one-out **passed** (P-009, P-011 hidden; 4 flipped, 0 re-sourced). Leak check **suspect**: 2 overlapping
  phrases and no transcript audit. That is expected: arm c's extractor reads the plan by design, and
  `run.sh` launches it directly rather than through `extract-strict`, so no session file is written.
  The leak check is not a control for arm c.
- d-1: 59/59 verified (0 vacuous, 0 refuted); census 34/35, 1 waived; leave-one-out **passed** (P-005, P-011 hidden; 5 flipped, 0 re-sourced).
  Leak check **suspect**, 1 overlapping phrase, reviewed by the transcript audit: "transcript shows no
  access outside the room and no mention of the plan: the overlap is phrasing, not a leak". Not
  contaminated.
- a and b have no pipeline controls. Every rep wrote valid JSON.
- No session errors (`is_error` false in every `cost.jsonl` line).

## Void attempt (pre-crash, commit `b401c0f`, not tagged)

The first attempt at this run ran on `b401c0f`, with the model-pinning wrapper outside the repo, and
crashed in arm c's scoring step. `sd score` treated c as a free-form arm and read an undefined
`--input`. The fix and regression test are in `e8824ae`. The attempt's outputs (a/b reps, arm c's
pipeline run dir `20261006T055518-054be6`, logs) are kept uncommitted in
`experiment/out/void-006-precrash/`. Its a and b reps are on record here because they add three more
repetitions of each baseline. Same model, same prompts, same case, and the scoring path for a/b did
not change:

| Void rep | Silent P / R | Flagged | Neg. FP | Dropped P | Missed | Wall | Cost |
|---|---|---|---|---|---|---|---|
| a-1 | 0.833 / 0.955 | 30 | 6 | 1 | T7 | 58 s | $0.31 |
| a-2 | 0.733 / 0.955 | 30 | 6 | 1 | T7 | 57 s | $0.29 |
| a-3 | 0.781 / 0.955 | 32 | 7 | 1 | T7 | 54 s | $0.29 |
| b-1 | 0.794 / 0.955 | 34 | 5 | 1 | T7 | 63 s | $0.31 |
| b-2 | 0.778 / 0.955 | 36 | 7 | 0.75 | T7 | 64 s | $0.31 |
| b-3 | 0.806 / 0.955 | 31 | 7 | 1 | T7 | 57 s | $0.30 |

Across the 6 a reps (void plus valid), line recall is 0.909–1.0 and precision 0.705–0.833. Across
the 6 b reps, recall is 0.955 every time and precision 0.767–0.806. The void arm c pipeline also
finished (LOO passed, leak clean, 5 sessions, $2.94) before the scorer crashed. It was not scored.

## What went well

- Arms a–d ran end to end on the second attempt. Every control that applies passed.
- The new harness logs model and cost for every session. All 16 sessions in this run were
  `claude-opus-5-5`.
- Dropped requirements: 3/3 in every rep of every arm. a and b have one false dropped item between
  them (a-2: P-008).

## What went wrong

1. **On line-level scoring, the cheap baselines match or beat the pipeline on recall.** a and b reach
   0.955 mean recall, against 0.864 for c and d and 0.85 for run 005's e. They do it in about a minute
   for about $0.30, roughly a tenth of the pipeline's time and cost. The pipeline's line precision is
   higher (c 0.91, d 0.96 against a 0.75, b 0.78). The pipeline's misses are the same three as e's:
   T10 and T11 (interaction decisions, never extracted) and T12 (`entries()` returns a copy). The
   baselines miss only T7, the re-open no-op.
   **This is not yet a verdict.** Line-level scoring credits any flag that touches a truth line,
   whatever it says. A free-form arm that cites the right lines with a wrong or planned description
   still scores. It also flags 6–7 of 8 negative controls (decisions the plan does make). Decision-level
   grading of the flagged files decides this.
2. The first attempt crashed (see Void attempt). The scorer had never been exercised for arm c.
3. Arm d flags 54 items against c's 34 and e's 20–38. More scenarios (59) and more flagged as
   unsourced by the LLM tracer.

## Changes since run 005

- `e8824ae`: arm c normalised from the pipeline run like d and e (regression test in
  `test/experiment.test.mjs`); `experiment/claude-role.sh` pins the model and logs cost; `run.sh`
  writes `run-env.json` per arm and puts wall time plus cost in `score.json`.
- Claude Code 2.1.283 → 2.1.291.
- No change to the method, prompts or case.

## Comparable with

Run 005 (same case, truth v1) for arms e and f at line level. Arms a–d have no earlier runs. The
model is the same as run 005, now pinned explicitly; the CLI version differs.

## Changes planned for the next run

1. Run 007: the same arms on the `ledger` case.
2. Blind decision-level grading of every `flagged-*.json` in runs 006 and 007 by a separate session,
   then rescore with `--adjudication`.
