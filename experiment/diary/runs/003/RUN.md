# Run 003 · 2026-09-27

| | |
|---|---|
| Commit | `74bb2dc048556de550e4d5b270a8eca3390e325c` · tag `run-003` |
| Case | `ledger` (planted, written by us) · truth file v2 |
| Arms | e ×3 (003a, 003b, 003c: three fresh extractions on the same commit), f ×1 |
| Method | v2.2: trace asks the primary contrary only (`--contraries primary`); statements typed structural/process cannot source; probes on every behavioural statement; leak check audits the extractor's session transcript |
| Models | extractor and probe writer: `claude-opus-5-5` via Claude Code 2.1.283, `claude -p --setting-sources project --strict-mcp-config` (subscription login); classifier: `jev-1.13` via OpenRouter |
| sd run ids | e: a `20260927T134803-260b20` · b `20260927T135539-ab5007` · c `20260927T135933-2beea3` · f `20260927T140716-b9d0c4` |
| Operator | local Claude Code session (Opus 5.5) on Rodrigo's Mac |

## Results

Decision level (hand adjudication, `experiment/cases/ledger/adjudication/run-003{a,b,c}-e.json`,
`run-003-f.json`; adjudicated by Claude in this session, **not blind to the arm**; files
`arm-*/score.truth-v2.json`):

| | Scenarios | Flagged | Decision R (10) | R on v1 items (5) | Decision P | Missed | Dropped (P-007) | Jev calls | Wall |
|---|---|---|---|---|---|---|---|---|---|
| e · 003a | 37 | 25 | **1.0** | 1.0 | 1.0 (+1 valid) | – | probe-confirmed | 1120 | 433 s |
| e · 003b | 38 | 25 | 0.9 | 1.0 | 1.0 (+1 valid) | T7 | probe-confirmed | 1150 | 224 s |
| e · 003c | 45 | 28 | **1.0** | 1.0 | 1.0 (+2 valid) | – | probe-confirmed | 1360 | 451 s |
| **e · mean (range)** | 40 (37–45) | 26 (25–28) | **0.97 (0.9–1.0)** | 1.0 | 1.0 | T7 once | 3/3 | 1210 | 369 s |
| f | – | 12 | 0.6 | 1.0 | 1.0 | T8–T11 | (meaningless) | – | 6 s |

Line level (as `run.sh` scores it): e 0.96 / 0.92 / 0.96 precision, 0.8 recall in all three (T8 and
T11 are hard to hit by line overlap); negative-control "FP" 1/2 in every repetition, each a line-overlap
artefact (B-011 = T8, B-001 = T5, B-012 = T8), not a violation of N1.

Compared with earlier runs on truth v2 (same case, same truth version):

| | Run 001 | Run 002 | Run 002 replayed under v2.2 rules | Run 003 (3 reps) |
|---|---|---|---|---|
| e decision recall | 0.8 | 0.9 | 1.0 | 0.97 (0.9–1.0) |
| e dropped (P-007) | missed | found | found | found 3/3 |
| e Jev calls | ~1000 | 2210 | (reused) | 1120–1360 |
| real silent decisions hidden by a generic sentence | 2 | 5 | 4 | 1 / 3 / 3 |
| f decision recall | 0.6 | 0.6 | – | 0.6 (identical flagged set, third time) |

The replay (`replay-002/`) re-used run 002's extraction, classifier answers and probes. It dropped
the k > 0 pairs, applied the new sourcing rule, re-traced leave-one-out (217 Jev calls) and ran the
new leak check. T7 was found (B-002), the spurious P-008 contradiction disappeared, P-007 stayed
dropped, and leave-one-out passed. It is a replay, not a run.

**Three repetitions are a first variance estimate, not a distribution.** Scenario counts varied from
37 to 45 and T7 came and went. Decision recall moved by one item between repetitions, the same size as
the run 001 → 002 change. So the 0.8 → 0.9 in run 002 was within extraction noise. This run's
evidence is that the dropped requirement is caught 3/3 and T7 is caught 2/3.

## Controls

All three e repetitions: every scenario verified (0 vacuous, 0 refuted) · census 15/15 · leave-one-out
**passed** (8, 10 and 11 flipped; 0 re-sourced; 0 cited hidden text) · 7 reverse probes, P-007 failed
with its twin passing each time, all others passed.

Leak check, now with the transcript audit: 003a **clean** (10 tool calls, 0 outside the room, 0 plan
mentions, 1 denied), 003b **suspect** on "a transfer to the same account" (the same phrase as run 002),
explained automatically by the transcript (5 calls, 0 outside the room, 0 plan mentions), 003c
**clean** (10 calls, 0 outside, 2 denied). Nothing voided. Statement typing was stable across all
three: P-001, P-002 and P-010 structural, P-003 to P-009 behavioural.

## The changes, checked

1. **Primary contrary only.** Calls fell from 2210 to 1120–1360 (about 30 per scenario, as in run
   001). The P-007 contradiction still appeared in all three repetitions (B-035, B-038, B-044: each
   extractor wrote "rejected" as the primary contrary of its A→A scenario). Spurious contradictions
   still occur on the primary contrary (003a: P-004 < B-019; 003b: P-006 < B-013; 003c: P-003,
   P-004, P-008 < B-015/B-017). Each was overruled by a passing probe.
2. **Non-behavioural statements cannot source.** P-010 sourced nothing in any repetition. T7 was
   flagged in 003a (B-003) and 003c (B-004). In 003b it was missed another way: B-002 ("re-opening does
   not reset") was stated by **P-008 "Every accepted operation is recorded in the account history"**,
   a behavioural sentence. The rule fixed the P-010 path; the general over-match remains.
3. **Transcript audit.** Worked unattended in all three repetitions and cleared the one suspect
   overlap without a manual read.

## What went well

- The dropped requirement was caught and confirmed by execution in 3/3 repetitions, with dropped
  precision 1.0.
- Decision precision was 1.0 in every repetition. Every flagged item is a real decision; the only
  disagreements with the truth file are "valid unlisted" items (entries() returns a copy, balances
  not re-rounded, open() with no opening entry).
- Classifier cost is back at the run 001 level.
- Every control passed in every repetition. Arm f is fully stable (three runs, identical flagged set).

## What went wrong

1. **Generic sentences still hide real decisions:** 1, 3 and 3 per repetition (003b: T7 by P-008,
   a different-payload txnId reuse (T4) by P-007, withdrawing the whole balance by P-004; 003c: exactly
   the daily limit by P-004, transferring the whole balance by P-006, entries() copy by P-008). Truth
   items survive only because the extractor wrote several scenarios per decision. This is now the main
   source of misses. Leave-one-out does not see it.
2. P-007 still spuriously sources other transfer scenarios (0-amount and negative transfers in 003a,
   the duplicate-txnId transfer in 003b, 003c's B-040). It only adds a second quote to rows that
   P-005/P-009 already source correctly, but it shows how loosely "a transfer to the same account is
   rejected" is read.
3. Wall time varies from 224 s to 451 s for the same work. That's subscription latency, not a harness
   issue, but "cost" per run is noisy too.
4. The line-level scorer is now uninformative on this case: 0.8 recall in every run since 002, and
   one negative-control artefact per repetition. Decision level is the only score worth reading here.

## Changes since run 002

- Method (v2.2, `74bb2dc`): primary contrary only; structural/process statements cannot source
  (`check-trace`, `loo-score`); transcript audit in `leak-check`; methodology doc updated to v2.2
  (it had not been updated for `c82cd13`).
- Harness: `extract-strict` records the room path in `extractor.session.json`; leak-check output trimmed.
- Tests: 22 (run 002 regression tests for primary-only, non-behavioural sourcing, transcript audit).
- Truth file: unchanged (v2). Rodrigo has not decided on a separate "implicit open" item, so it stays
  folded into T5 (seven flagged items across the three repetitions map there that way).

## Comparable with

Runs 001 and 002 at decision level on truth v2 (same case, truth version, classifier route, extractor
model). The method differs (v2.1 → v2.2), which is the point of the comparison; run 002's replay
isolates the rule changes from extraction noise.

## Changes planned for the next run

1. **Capability-sentence sourcing** is now the main miss path. Candidate fixes, to be tested by
   replay on the four saved extractions (runs 002, 003a–c) before any new run:
   (a) a stated verdict must also survive the default accept/reject flip for the *same* statement
   (a sentence that "requires" both an outcome and its refusal decides nothing);
   (b) leave-one-out targeted at the statements that source the most behaviours;
   (c) raise the threshold for sourcing only (not for contradictions).
   The replays cost Jev calls only.
2. Arms a–d on the v2.2 code (Rodrigo's call; subscription usage).
3. Independent cases. The ledger case is saturated: decision recall is at or near 1.0, and the
   remaining signal is noise and a known over-match. Nothing more about arm e vs f is learnable from
   it. The two cases must not be written by us (`experiment/README.md`).
