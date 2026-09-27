# Run 002 · 2026-09-27

| | |
|---|---|
| Commit | `15f26597a4d601bc84b78736f4f74c1be1be5e11` · tag `run-002` |
| Case | `ledger` (planted, written by us) · truth file v2 |
| Arms | e (blind extractor + pairwise Jev trace, now with several contraries per scenario and probes on every behavioural statement), f (census × plan through Jev) |
| Models | extractor and probe writer: `claude-opus-5-5` via Claude Code 2.1.283, `claude -p --setting-sources project --strict-mcp-config` (subscription login); classifier: `jev-1.13` via OpenRouter (same route as run 001) |
| Runs per arm | 1 (no variance measured) |
| sd run ids | e `20260927T130316-1614eb` · f `20260927T130801-7c4caf` |
| Operator | local Claude Code session (Opus 5.5) on Rodrigo's Mac |

## Results

Line level (as `run.sh` scores it, truth v2):

| Arm | Silent P | Silent R | Flagged | Neg. FP | Dropped P | Dropped R | Jev calls | Wall time |
|---|---|---|---|---|---|---|---|---|
| e | 0.958 | 0.8 (8/10) | 24 | 1/2 | **1.0** | **1.0 (1/1)** | 2210 | 285 s |
| f | 1.0 | 0.8 (8/10) | 12 | 0/2 | 0.11 | 1.0 (meaningless) | – | 6 s |

Decision level (hand adjudication, `experiment/cases/ledger/adjudication/run-002-{e,f}.json`,
adjudicated by Claude in this session, **not blind to the arm**; files `arm-*/score.truth-v2.json`):

| Arm | Decision recall (10 items) | Recall on v1 items only (5) | Decision precision | Missed |
|---|---|---|---|---|
| e | **0.9** | 1.0 | 1.0 (+2 valid unlisted: B-001 weak, B-040) | T7 |
| f | 0.6 | 1.0 | 1.0 | T8, T9, T10, T11 |

Compared with run 001 rescored on truth v2 (same case, same truth version):

| Arm | Run 001 decision R (v1 only) | Run 002 decision R (v1 only) | Run 001 dropped R | Run 002 dropped R |
|---|---|---|---|---|
| e | 0.8 (0.8) · missed T4, T7 | 0.9 (1.0) · missed T7 | 0/1 | **1/1, probe-confirmed** |
| f | 0.6 (1.0) | 0.6 (1.0), identical flagged set | 1/1 (meaningless) | same |

The line-level negative-control FP for arm e is B-013 (a sub-half-cent deposit accepted and recorded
as 0). That is T8, not a false positive; it touches line 39 like run 001's B-008.

**One run per arm, and the extractor is non-deterministic** (run 001: 33 scenarios, run 002: 40, with
different ids, wording and coverage). The difference between the runs is one truth item per direction
(T4 gained, P-007 moved to the right bucket), well within what re-extraction alone can change. This
entry shows the mechanisms working. It does not show that arm e is better than it was.

## Controls

Arm e: 40 scenarios extracted, 40 verified, 0 vacuous, 0 refuted · census 15/15 covered · leave-one-out
**passed** (P-004, P-005, P-006 hidden; 10 flipped, 0 re-sourced, 0 cited hidden text) · reverse probes
7 run (every behavioural statement), 1 dropped, 6 passed · 2210 Jev calls at threshold 0.7.

Leak check: **suspect**, reviewed and cleared. One 6-word shingle overlaps the plan: the extractor's
contrary for its A→A scenario (B-038) is "a transfer to the same account is rejected and no entries
are added", and the plan says "A transfer to the same account is rejected." No audit hook was
installed, so the extractor's tool calls were reconstructed from its Claude Code session transcript
(`arm-e/extractor-audit.txt`): it ran in a temp room outside the repo, read only
`cleanroom/src/ledger.ts` and `census.json`, never referenced `plan.md` (0 occurrences in the
session), and its one attempt to run `node` was denied. The phrase is what the new prompt instruction
produces ("if the action succeeds, one alternative must be that it is refused"), so the shingle check
will now fire on exactly the scenarios that matter. Not voided.

## The two method changes, checked

**1. Several contraries per scenario (90 contraries on 40 scenarios: 40 primary, 43 extractor
alternatives, 7 default flips).**

- P-007 is `status: "contradicted"`, by B-008, B-009 and B-038. B-038 is the real one (A→A transfer
  accepted, balance unchanged, two entries), at 0.98 confidence.
- **But the B-038 contradiction came from the primary contrary (k = 0), not from an extra one.** The
  extractor, following the new prompt, wrote "rejected" as its primary contrary. Given this
  extraction, the run 001 trace code would have found it too. The credit goes to the extractor prompt
  change, not the multi-contrary trace.
- The extra contraries produced three contradictions, all spurious or weak: B-008/P-007 and
  B-009/P-007 (duplicate-txnId scenarios read as same-account transfers, the same over-match as run 001)
  and B-001/P-008 (open() records no entry; arguable). All three statements were overruled by passing
  probes, so the only cost was wasted calls.
- Cost: 2210 Jev calls vs about 1000 in run 001 (55 vs 30 per scenario); wall time 285 s vs 208 s.
- Sourcing is by the primary contrary only. This is confirmed in the code (`pairwise.mjs`, `k === 0`) and in
  the pair data: no `stated` verdict rests on a k > 0 pair alone. **The extra alternatives did not
  source anything.** Generic sentences still sourced more silent decisions than in run 001, through the
  primary contrary: B-019 "a rejected withdrawal does not consume its txnId" (T11) and B-026 "daily
  limit per account" (T2) sourced by P-004 "Customers can withdraw funds"; B-033 "transferring the
  whole balance is allowed" by P-006 "Customers can transfer funds"; B-032 "transfer over balance
  rejected" (T1) by P-007; B-002 "re-opening keeps the balance" (T7) by P-010. Five scenarios were
  hidden this way, against two in run 001 (B-011 by P-010, B-013 by P-004). No truth item was lost
  except T7, because the others are also found through other scenarios. Possible cause: the prompt now
  pushes the primary contrary toward accept/reject flips, which "Customers can X" appears to decide.
  One run cannot tell this apart from extraction variance.

**2. Reverse probes on every behavioural statement.**

- All 7 behavioural statements were probed (P-003 to P-009; P-001, P-002 and P-010 were typed
  not-behavioural).
- **P-007's probe failed (main failed, twin passed): a confirmed dropped requirement**, reported in the
  delta's dropped section. This time P-007 was also a probe target under the old `candidates` scope,
  because it was contradicted. Without the contradiction, the reverse trace would have marked P-007
  realised by B-030 and B-032 (again over-matched), and only probe-all would have caught it. Probe-all
  is the change that catches this failure regardless of what the extractor writes.
- No probe failed on a statement the trace called realised (P-005, P-006 and P-009 all passed).
  P-003, P-004 and P-008 were contradicted and passed their probes, so those contradictions were
  overruled.

## What went well

- The dropped requirement from run 001 (P-007 / T6) is found and confirmed by execution, and the
  dropped bucket has precision 1.0.
- T4 was found for the first time: B-009 (txnId reused by another account) and B-021 (withdrawal
  reusing a deposit's txnId) are repeated ids with a different payload. This came from extraction
  variance, not from a method change.
- Every control passed. Arm f is stable across runs: the same 12 census items were flagged.
- Decision precision stayed at 1.0 with 24 flagged items.

## What went wrong

1. **T7 missed twice for the same reason:** P-010 ("Persistence, currencies, authentication.", the
   out-of-scope line) is typed `not_behavioural`, yet it still sources B-002 at 0.92 confidence. A
   not-behavioural statement should never be able to source a behaviour. This is a deterministic fix.
2. **Generic capability sentences hide silent decisions** (five scenarios, see above). Leave-one-out
   passes because hiding P-004 does flip B-019 and B-026 to unsourced. It measures dependence on a
   source, not whether that source actually decides the behaviour.
3. **The multi-contrary trace costs 2.2× the calls and found nothing true this run.** Every useful
   signal came from the extractor's primary contrary or from probe-all.
4. **The leak check now fires on design:** the rejection alternatives the prompt asks for naturally
   reuse the plan's wording for the same rule. Without an audit hook, the only evidence of blindness is
   a manual transcript review.
5. Harness and process issues found before the run:
   - `c82cd13` left `test/pipeline.test.mjs` red: the request count ignored the extra contraries.
     Fixed in `15f2659` (assertion updated with the arithmetic).
   - A smoke run of the new code (sd `20260927T125453-7a5fb4` / `125939-d365df`) had been made on
     `c82cd13` and tagged `run-002`, with no diary entry. Its outputs were left uncommitted in
     `experiment/out/`. The outputs were set aside (not committed) and, with Rodrigo's approval, the tag
     was moved to `15f2659`. That smoke run is not a diary run.
   - `examples/ledger/node_modules` had a Rollup platform mismatch. It was reinstalled on this Mac.
   - The extractor could issue read-only Bash calls inside its room. `--allowedTools` pre-approves
     tools but does not restrict them; confinement rests on the temp room.
   - `docs/methodology.md` is still v2.1. The method changes from `c82cd13` (methodology v2.2) were
     never written into it.

## Changes since run 001

- Method: several contraries per scenario in the pairwise trace (only the primary one sources); a
  `contradicted` reverse status that forces a probe; reverse probes on every behavioural statement
  (`--probe-scope all`); a failing probe overrules a `realised` verdict. The extractor prompt asks for
  `contrary_alternatives`, including a reject/accept flip. (All `c82cd13`.)
- Harness: CLAUDE.md is hidden from the roles during runs (`e8308bf`); the pipeline test count was fixed (`15f2659`).
- Scoring: truth v2, decision-level adjudication (`sd score --adjudication`).

## Comparable with

Run 001 rescored on truth v2: same case, same truth version, same classifier route, same extractor
model family. Run 001's original line-level scores (truth v1) are not comparable.

## Changes planned for the next run

1. Statements typed `not_behavioural` (or out-of-scope) cannot source a behaviour. This is deterministic,
   needs a regression test, and addresses T7.
2. Ablate the extra contraries. Rescoring this run's existing pairs with k = 0 only gives the same
   verdicts minus three spurious contradictions. If a second extraction agrees, drop the extra
   contraries from the trace (keep them in the prompt) and halve the classifier cost.
3. A check aimed at capability-sentence sourcing: sample leave-one-out from the statements that source
   the most behaviours (P-004, P-009 here), or require a stated verdict to survive the default flip too.
4. Record the extractor's tool calls automatically from its session transcript into `leak.json`
   (or install the audit hook), so a `suspect` leak check can be cleared without manual work.
5. Write methodology v2.2.
6. Candidate truth item (needs Rodrigo): operations on a never-opened account open it implicitly
   (B-004, B-037); currently folded into T5.
7. Measure variance: repeat arm e two or three times before comparing across runs; then arms a–d; then
   independent cases.
