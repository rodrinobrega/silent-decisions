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

\* arm f's dropped recall is meaningless: it lists every plan sentence without a matched census point (precision 0.11).
