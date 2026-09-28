# Run 005 · 2026-09-28

| | |
|---|---|
| Commit | `d83b06e` · tag `run-005` |
| Case | `ledger-rounding` (planted by the operator, see run 004) · truth file v1 |
| Arms | e ×3 (005a, 005b, 005c), f ×1 |
| Method | v2.3 plus the two fixes made after run 004 (`e40dfcb`), now live: lines under an out-of-scope heading cannot source; the transcript audit resolves relative paths and ignores written content |
| Models | extractor and probe writer: `claude-opus-5-5` via Claude Code 2.1.283, `claude -p --setting-sources project --strict-mcp-config`; classifier: `jev-1.13` via OpenRouter |
| sd run ids | e: a `20260928T063223-74cfc3` · b `20260928T063845-516be7` · c `20260928T064636-ec03cf` · f `20260928T065306-59b047` |
| Operator | local Claude Code session (Opus 5.5) on Rodrigo's Mac |

## Why this run

Run 004 found two problems and fixed both after the run: the out-of-scope line sourced T7, and the
transcript audit produced a false "contaminated" verdict. Their effect was only measured by replay.
Rodrigo asked to re-run on the current code so the fixes are measured live.

## Results

Decision level (adjudications `experiment/cases/ledger-rounding/adjudication/run-005{a,b,c}-e.json`,
`run-005-f.json`; adjudicated by Claude, **not blind, and the author of the case**, using run 004's
conventions):

| | Scenarios | Flagged | Decision R (22) | Decision P | Missed | Dropped (3) | T21 planted | Jev calls | Wall |
|---|---|---|---|---|---|---|---|---|---|
| e · 005a | 34 | 20 | 0.77 | 0.95 | T8, T10, T12, T13, T24 | **3/3** (P 1.0) | found | 1751 | 380 s |
| e · 005b | 46 | 30 | 0.82 | 0.83 | T8, T10, T12, T13 | **3/3** (P 1.0) | found | 2363 | 468 s |
| e · 005c | 49 | 38 | **0.91** | 0.87 | T10, T13 | **3/3** (P 1.0) | found | 2516 | 386 s |
| **e · mean** | 43 | 29 | **0.83** (0.77–0.91) | 0.88 | T10 and T13 3/3 | 9/9 | **3/3** | 2210 | 411 s |
| f | – | 23 | 0.50 | 0.96 | T8–T13, T17–T19, T21, T24 | (P 0.23) | missed | – | 5 s |

Against run 004 (same case, same truth version, so comparable):

| | Run 004 as run | Run 004 replayed with the fixes | Run 005 (fixes live) |
|---|---|---|---|
| e decision recall | 0.77 / 0.77 / 0.77 | 0.82 / 0.82 / 0.82 | 0.77 / 0.82 / 0.91 |
| e decision precision | 0.88 / 0.85 / 0.90 | 0.88 / 0.86 / 0.90 | 0.95 / 0.83 / 0.87 |
| T7 (re-open is a no-op) | 0/3 | 3/3 | **3/3** |
| dropped requirements | 9/9 | – | 9/9 |
| planted T21 | 3/3 | – | 3/3 |
| f decision recall | 0.55 | – | 0.50 |

The live run matches the replay's prediction (mean 0.83 against 0.82). The spread between repetitions
now comes mostly from **how many scenarios the extractor writes**: 34 scenarios gave 0.77, 46 gave
0.82, 49 gave 0.91. Same code, same prompt, same case. One run per arm would have reported any of those
three numbers.

Arm f moved from 0.55 to 0.50 through classifier variance alone. Its census points were the same,
but C-033 (interest truncation) was matched to P-010 this time, and C-029 (split remainder) was not.

## Controls

- Every scenario verified in all repetitions (0 vacuous, 0 refuted).
- Census 35/35 in 005a. In 005b and 005c, 34 were covered and C-035 waived, with the same correct
  reason as run 004.
- Leave-one-out **passed** in 005a and 005b. In 005c it came back **review**: B-005 (a repeated
  deposit) was re-sourced by P-007 after P-009 was hidden. That's the same over-match as 004c, not
  a failure.
- Leak check **clean** in all three, audited from the transcripts: 5, 5 and 3 tool calls, none
  outside the room, no plan mentions. The fixed audit did not misfire.
- All 14 behavioural statements were probed. P-007, P-013 and P-014 failed every time (the three
  planted dropped requirements), and nothing else failed.
- P-017 (out of scope) is typed `out-of-scope` by position in all three; the classifier would have
  called it behavioural. It tried to source the re-open scenario in 005a and 005c, and the rule
  dropped both quotes.

## What went well

- The out-of-scope fix works live: T7 was found 3/3, where it was missed 3/3 in run 004.
- Dropped requirements: 9/9 again, with dropped precision 1.0. Across runs 004 and 005 that's 18/18
  probe-confirmed and no false ones.
- The planted unsourced rule T21 was found in all six arm-e repetitions of this case; arm f has missed
  it both times.
- The leak audit was quiet and correct.

## What went wrong

1. **T10 has never been extracted:** 0/6 across runs 004 and 005. "Transfers and splits do not count
   toward the daily limit" is an interaction with no census point, and the extractor doesn't think to
   test it on this larger surface (it found it in every ledger run).
2. **T13 (amount validation before the duplicate check) was missed 6/6.** When it is extracted (005b,
   005c, 004c) it is sourced by P-005 "An amount must be a positive number, otherwise the operation is
   rejected" at ≥ 0.86. That reading is defensible: P-005 says an invalid amount is rejected without
   exception, which arguably settles the ordering. **T13 may be a bad truth item.** I wrote it, so this
   needs Rodrigo's call, not mine.
3. **P-011 (half away from zero) sources T8 ("a sub-half-cent deposit is accepted as 0")** whenever the
   scenario leads with rounding (005b, 004a). The rounding rule decides the *value*, not whether a
   positive amount that rounds to 0 is accepted. Over-reading a specific sentence.
4. **P-010 "Balances are kept in whole cents" still sources "transfers carry no fee"** (005a; 004a, 004c).
5. Precision (mean 0.88) is still held down by planned rules flagged as silent: the minimum fee, the
   1% fee, the 365-day year, "applied once". Three or four cards per repetition.

## Changes since run 004

None to the method or the case. This run executes the post-run-004 fixes (`e40dfcb`) and the
`table.mjs` fix (`d83b06e`).

## Changes planned for the next run

1. **Extraction of interaction decisions (T10).** A census pass that lists state shared between
   operations (`withdrawnToday` written only by withdraw; `seen` written by all) and turns it into
   targeted questions for the extractor: "does a transfer change what a later withdrawal may do?".
   Deterministic, code-only, so blindness is preserved.
2. **Sentence scope.** A sentence should source only behaviours about what it talks about. Candidate:
   a second classifier question, "does this sentence speak about the condition this scenario varies?",
   asked only for pairs that clear 0.86. It targets P-010 → fee and P-011 → acceptance. Replay on the
   six saved extractions of this case before any new run.
3. **Truth decisions for Rodrigo:** whether T13 stays (see above), plus the three candidates from
   run 004 (the daily limit never resets, exchange-rate direction, which rejection wins).
4. Still outstanding: arms a–d; independent cases.
