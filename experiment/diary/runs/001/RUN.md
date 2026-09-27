# Run 001 · 2026-09-27

| | |
|---|---|
| Commit | `9219a72b798f3a2d7464824f33aa68051fb272ee` · tag `run-001` |
| Case | `ledger` (planted, written by us) · truth file v1 |
| Arms | e (blind extractor + pairwise Jev trace), f (census × plan through Jev) |
| Models | extractor: Claude Code 2.1.283 via `claude -p --setting-sources project --strict-mcp-config` (subscription login); classifier: `typesafe/jev-1.13-20260917` via OpenRouter |
| Runs per arm | 1 (no variance measured) |
| sd run ids | e `20260927T123101-751c21` · f `20260927T122512-d2874e` |

## Results

| Arm | Silent P | Silent R | Flagged | Neg. FP | Dropped P | Dropped R | Wall time |
|---|---|---|---|---|---|---|---|
| e | 0.95 | 1.0 (5/5) | 20 | 1/2 | – | 0 (0/1) | 208 s |
| f | 0.92 | 1.0 (5/5) | 12 | 0/2 | 0.11 | 1.0 (meaningless, see below) | 6 s |

Arm e controls: 33 scenarios extracted, 33 verified, 0 vacuous (perturbed twins), 0 refuted ·
census 15/15 covered · leave-one-out **passed** (P-004, P-005, P-006 hidden; 8 flipped, 0 re-sourced) ·
leak check **clean** · ~1000 Jev calls at threshold 0.7 · audit hook not installed.

Artifacts: `arm-e/` and `arm-f/` next to this file.

## What went well

- First end-to-end run of the blind pipeline. Every control passed.
- The blind extractor found real silent decisions that were **not** in the truth file:
  `open()` on an existing account is a silent no-op (B-002, census C-004), and a sub-half-cent deposit
  passes `amount > 0`, rounds to 0 and is accepted (B-008).
- Arm e surfaced *interaction* decisions no census item can express: funds check before daily-limit
  check (B-024), transfers don't count toward the daily limit (B-026), a rejected withdrawal doesn't
  consume its txnId (B-019). This is the expected advantage of extraction over the census.
- Jev adapter works first time; cost negligible.

## What went wrong

1. **Dropped requirement missed (P-007, transfer to same account must be rejected).** The extractor
   *did* describe it (B-033: A→A transfer accepted, balance unchanged, two entries), but:
   - its single contrary was "the balance ends at 50", which P-007 neither requires nor forbids, so the
     flip test answered "neither". One contrary per scenario only catches a contradiction if it happens
     to be the alternative the plan speaks to.
   - the reverse "realises" question marked P-007 realised by B-005 and B-032 (duplicate-txnId
     scenarios; B-005 is a deposit). Plain over-match. Because P-007 counted as realised, no reverse
     probe was written, so nothing executed it.
   - leave-one-out did not catch it: it hid P-004..P-006 and only measures false *sourcing*, not false
     *realised*.
2. **Scoring is too coarse.** Line-overlap matching gives both arms recall 1.0, so the ledger case cannot
   separate arm e from arm f. B-008 was scored a negative-control false positive only because it touches
   line 39.
3. **Truth file incomplete** (see above: two real decisions missing).
4. Harness bugs fixed before this run (included in the commit): `--bare` needs an API key, so roles now
   use `--setting-sources project --strict-mcp-config` with a subscription login; `run_dir` was prefixed
   twice; the example's `node_modules` had been installed on Linux (Rollup binary).

## Rescored against truth v2 (decision level)

Same run, same outputs, rescored after the fixes below with truth file v2 and a hand adjudication
(`experiment/cases/ledger/adjudication/run-001-{e,f}.json`, adjudicated by Claude, **not blind to the arm**).
Files: `arm-e/score.truth-v2.json`, `arm-f/score.truth-v2.json`.

| Arm | Decision recall (10 items) | Recall on v1 items only (5) | Decision precision | Missed | Line-level recall v2 |
|---|---|---|---|---|---|
| e | 0.8 | 0.8 | 1.0 (+3 valid unlisted: B-009, B-012, B-018) | T4, T7 | 0.7 |
| f | 0.6 | **1.0** | 1.0 | T8, T9, T10, T11 | 0.8 |

**The uncomfortable finding: on the original answer key, the cheap census baseline beats the pipeline.**
Arm e's advantage exists only on the post-hoc items, and those were found by reading arm e's own output,
which biases v2 toward arm e. This case cannot settle the question; independent cases are required.

Why arm e missed:
- **T4** (repeated txnId with a *different* payload): the extractor only wrote same-payload retry
  scenarios (B-005, B-017, B-032), which P-009 correctly sources. The census counted the `seen.has`
  guard as covered by those scenarios, so **coverage was satisfied by the wrong scenario**.
- **T7** (`open()` on an existing account): B-011 was sourced by P-010, the *out-of-scope* sentence.
  Classifier over-match that leave-one-out did not sample.
- Also over-matched: B-005 and B-032 sourced by P-007 (same-account transfer) as well as P-009.

## Changes planned for run 002

- Several contraries per scenario, always including "the operation is rejected" for accepted operations;
  the pairwise trace asks each one. (Method change → methodology v2.2.)
- Reverse probes on **every** behavioural plan statement, not only candidates. (Method change.)
- Truth file v2 (done, see above) and decision-level scoring via `sd score --adjudication`.
- Not yet addressed, candidates for later runs: census coverage should require a scenario that varies
  the guarded input (T4); out-of-scope plan sentences should never source a behaviour (type them as
  `process`/excluded, T7); leave-one-out should sample statements the trace used as *realised* too.

## Not comparable with

Nothing yet: this is the baseline.
