# Run 007 · 2026-10-06

| | |
|---|---|
| Commit | `16bccb9` · tag `run-007` (code identical to `e8824ae`/`run-006`; only the run 006 diary was added) |
| Case | `ledger` · truth file v2 (10 silent decisions, T7–T11 post-hoc; 2 negative controls; 1 dropped requirement) |
| Arms | a ×3, b ×3, c ×1, d ×1 |
| Method | as run 006 |
| Models | every role: `claude-opus-5-5` pinned via `experiment/claude-role.sh`, Claude Code 2.1.291, `claude -p --setting-sources project --strict-mcp-config` (recorded in each arm's `run-env.json`; all 16 sessions confirm the model in `cost.jsonl`) |
| sd run ids | a: `20261006T063419-60dccf` · `20261006T063455-f4f556` · `20261006T063530-1a0b25`; b: `20261006T063606-15e730` · `20261006T063657-b1ad3e` · `20261006T063732-795d3b`; c: `20261006T063811-11a66f`; d: `20261006T064356-1007b8` |
| Operator | local Claude Code session (Opus 5.5) on Rodrigo's Mac |

## Why this run

This is the second case for arms a–d, after run 006. Rodrigo approved the usage.

## Results

**Line-level only. Not adjudicated.** As in run 006, every rep's flagged items are in
`flagged-<arm>-<rep>.json` for a blind grading session.

| Arm · rep | Silent P / R (10) | R, v1 items only (5) | Flagged | Neg. FP (2) | Dropped P / R (1) | Missed (line) | Wall | Cost† |
|---|---|---|---|---|---|---|---|---|
| a-1 | 0.619 / 0.9 | 5/5 | 21 | 2 | 1 / 1 | T7 | 33 s | $0.18 |
| a-2 | 0.500 / 0.9 | 5/5 | 20 | 2 | 1 / 1 | T7 | 31 s | $0.17 |
| a-3 | 0.500 / 0.9 | 5/5 | 24 | 2 | 1 / 1 | T7 | 33 s | $0.18 |
| **a mean** | **0.540 / 0.9** | 5/5 | 22 | 2 | 1 / 1 | T7 3/3 | 32 s | $0.18 |
| b-1 | 0.609 / 0.9 | 5/5 | 23 | 2 | 1 / 1 | T7 | 47 s | $0.24 |
| b-2 | 0.737 / 1.0 | 5/5 | 19 | 2 | 1 / 1 | – | 31 s | $0.18 |
| b-3 | 0.650 / 1.0 | 5/5 | 20 | 2 | 1 / 1 | – | 31 s | $0.17 |
| **b mean** | **0.665 / 0.967** | 5/5 | 21 | 2 | 1 / 1 | T7 1/3 | 36 s | $0.20 |
| c-1 | **0.857** / 0.8 | 5/5 | 35 | 1 | 1 / 1 | T8, T11 | 340 s | $1.92 (5 sessions) |
| d-1 | 0.821 / 0.8 | 5/5 | 39 | 1 | 1 / 1 | T8, T11 | 371 s | $1.92 (5 sessions) |
| *e, run 003 (ref.)* | *0.948 / 0.8* | *5/5* | *26* | *1* | *1 / 1* | *T8, T11 ×3* | *369 s* | *not logged* |

† API-equivalent, as reported by `claude -p`; run on the subscription, not billed.

Every arm finds all five original (v1) truth items. The differences are all in the post-hoc items
(T7–T11), and those were found by reading arm e's output (run 001), so they favour the pipeline's
way of describing behaviour. The baselines miss T7 (the re-open no-op), as they did on
ledger-rounding. The pipeline arms miss T8 and T11, as arm e did in all three reps of run 003. Every
arm catches the dropped requirement (P-007, same-account transfer), with no false dropped items.

## Controls

- c-1: 42/42 scenarios verified (0 vacuous, 0 refuted); census 15/15; leave-one-out **passed**
  (P-005 hidden, 7 flipped, 0 re-sourced). Leak check **suspect** (2 phrases, no transcript audit).
  That is expected for the sighted extractor and is not a control for arm c (see run 006).
- d-1: 39/39 verified; census 15/15; leak check **clean** (transcript audit: 6 tool calls, none outside
  the room). **Leave-one-out `not_applicable`: it did not run.** The LLM tracer marked 8 behaviours
  stated, and the adversary argued each one's contrary also satisfied the quoted plan text, so the
  rules downgraded all 8 (`downgraded_by_rules: 8`). That left all 39 behaviours unsourced, so no
  behaviour rests on a single statement and there is nothing to hide. This is not a failed control.
  But arm d's tracing on this case went unchecked, and its flagged list is the whole behaviour
  catalogue: no plan statement sources anything. The line precision (0.82) is high only because most
  behaviours touch a truth line. Decision-level grading will show what that costs.
- a and b: valid JSON in every rep; no session errors anywhere.

## What went well

- No crash and no harness change. The run 006 fix held on the second case.
- Every arm finds every original truth item and the dropped requirement.

## What went wrong

1. **The baselines flag both negative controls in every rep (6/6)**; the pipeline arms flag 1 of 2,
   as e did in run 003. Line precision for a (0.54) and b (0.67) is well below the pipeline's
   (0.82–0.86; e 0.95).
2. **Arm d's adversary removed every sourcing** (see Controls), so arm d did no tracing at all on this
   case and its leave-one-out could not run. On ledger-rounding (run 006) the same arm kept 5 of 59 behaviours
   sourced. It may mean the adversary is too strong against short, general plans. One rep is not
   enough to say.
3. On this small case, line-level recall separates nothing: 0.8–1.0 for every arm, with every
   difference in post-hoc items.

## Changes since run 006

None (diary only).

## Comparable with

Run 003 (ledger, truth v2) for arm e at line level. The model is the same, the CLI version differs
(see run 006).

## Changes planned for the next run

1. **Blind decision-level grading** of the 16 `flagged-*.json` files from runs 006 and 007, by a
   separate session that does not know the arms. Then rescore with `--adjudication` and update both
   entries.
2. Look at arm d's adversary on short plans: on `ledger`, 8/8 of the tracer's sourcings were knocked
   out. Run d again before reading anything into it.
3. Independent cases (still outstanding): two cases this project didn't write, before any number is
   published.
