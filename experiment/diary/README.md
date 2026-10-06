# Run diary

One entry per successful experiment run, so progress can be checked against a baseline and any
run can be reproduced or rolled back to.

## Rules

1. After every successful run, add `runs/NNN/RUN.md` (copy the structure of run 001) and a row below.
2. Commit the code **before** the run, tag that commit `run-NNN`, and record the hash. To go back:
   `git checkout run-NNN` (inspect) or `git revert`/`git reset` to that hash (roll back).
3. Snapshot the artifacts that matter into `runs/NNN/arm-X/` (score, delta, metrics, trace, controls).
   `.silent-decisions/` is gitignored, so anything not copied here is lost to history.
4. Record what went well, what went wrong, and what changed since the previous run. Changes to the
   truth file are logged here with their reason, because an answer key edited after seeing results
   must be visible as such.
5. Adjudicate at decision level: copy the previous `experiment/cases/<case>/adjudication/run-NNN-<arm>.json`,
   map every flagged item to a truth id / `valid` / `invalid`, and score with `--adjudication`. Say who
   adjudicated and whether they were blind to the arm.
6. Compare against the previous run only when the case and truth-file version are the same;
   otherwise say so in the entry.

## Index

| Run | Date | Commit (tag) | Case · truth ver. | Arms | Silent P / R (line-level unless stated) | Neg. FP | Dropped R | Controls | Headline |
|---|---|---|---|---|---|---|---|---|---|
| [001](runs/001/RUN.md) | 2026-09-27 | `9219a72` (`run-001`) | ledger · v1 | e, f | e 0.95 / 1.0 · f 0.92 / 1.0 | e 1/2 · f 0/2 | e 0/1 · f 1/1* | e: all passed | First end-to-end run. Pipeline works; missed the one dropped requirement; truth file incomplete. |
| 001 rescored | 2026-09-27 | same | ledger · **v2** | e, f | decision-level: e 1.0 / 0.8 · f 1.0 / 0.6 (v1 items only: e 0.8, f 1.0) | | | | On the original key the census baseline wins; e's edge is only on post-hoc items (biased toward e). |
| [002](runs/002/RUN.md) | 2026-09-27 | `15f2659` (`run-002`) | ledger · v2 | e, f | line: e 0.96 / 0.8 · f 1.0 / 0.8 · decision-level: e 1.0 / **0.9** (v1 items 1.0) · f 1.0 / 0.6 (v1 1.0) | e 1/2 (B-013 = T8, line artefact) · f 0/2 | e **1/1** (probe-confirmed, P 1.0) · f 1/1* | e: all passed (leak suspect, cleared by transcript review) | Dropped requirement P-007 now caught, by the extractor's reject contrary and a failing probe. Extra trace contraries cost 2.2× calls and added only spurious contradictions. T7 missed again (out-of-scope line sources it). One run per arm. |
| [003](runs/003/RUN.md) | 2026-09-27 | `74bb2dc` (`run-003`) | ledger · v2 | e ×3, f | decision-level: e 1.0 / **0.97** (0.9–1.0; v1 items 1.0 in all 3) · f 1.0 / 0.6 | e 1/2 each (line artefacts: T8, T5, T8) · f 0/2 | e **3/3** probe-confirmed · f 1/1* | all passed ×3 (leak: 2 clean, 1 suspect explained by transcript audit) | Method v2.2: primary contrary only (calls back to ~1200), structural statements can't source (T7 found 2/3). First variance estimate: ±1 decision between reps. Remaining misses come from generic sentences sourcing real decisions. Ledger case saturated. |
| [004](runs/004/RUN.md) | 2026-09-27 | `af3e7d6` (`run-004`) | **ledger-rounding** (new, planted by the operator) · v1 | e ×3, f | decision-level: e 0.88 / **0.77** (0.77 ×3; 0.82 ×3 in the post-run out-of-scope replay) · f 0.96 / 0.55 | line-level artefacts; decision-level FPs 3–4/rep (planned rules flagged) | e **9/9** (3 planted × 3 reps, P 1.0) · f 2/3 (P 0.18) | pass, 004c LOO review; 004a leak false-positive from an audit bug, fixed in `e40dfcb` and re-evaluated | New case with rounding rules. Planted unsourced rule caught 3/3 by e, missed by f. Misses: T7 (out-of-scope line, fixed after the run), T10 and T13 (interaction decisions never extracted). Not comparable with ledger runs. |
| [005](runs/005/RUN.md) | 2026-09-28 | `d83b06e` (`run-005`) | ledger-rounding · v1 | e ×3, f | decision-level: e 0.88 / **0.83** (0.77 / 0.82 / 0.91) · f 0.96 / 0.50 | decision-level FPs 1–5/rep (planned rules flagged) | e **9/9** (P 1.0) · f (P 0.23) | all passed (005c LOO review); leak clean ×3 | Post-run-004 fixes live: T7 found 3/3 (0/3 in 004), matches the replay. Recall spread tracks scenario count (34→0.77, 49→0.91). T10 never extracted (0/6); T13 always sourced by P-005 (possibly a bad truth item). |
| [006](runs/006/RUN.md) | 2026-10-06 | `e8824ae` (`run-006`) | ledger-rounding · v1 | a ×3, b ×3, c, d | line: a 0.75 / 0.955 (0.909–1.0) · b 0.78 / 0.955 · c 0.91 / 0.864 · d 0.96 / 0.864 · decision-level: pending blind grading | a 6.7/8 · b 6.3/8 · c 5/8 · d 6/8 | 3/3 in every rep (a-2 P 0.75) | c, d: LOO passed; leak suspect (c: sighted by design; d: cleared by transcript audit) | First run of arms a–d (a void first attempt crashed in the c scorer, fixed in `e8824ae`). At line level the one-pass baselines out-recall the pipeline (0.955 vs 0.864) at ~1/10 the time and cost; the pipeline is more precise. Not a verdict until blind decision-level grading. |

\* arm f's dropped recall is meaningless: it lists every plan sentence without a matched census point (precision 0.11).
