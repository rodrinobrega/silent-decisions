# Trace-mode experiment: results

## ledger

| Arm | Truth ver. | Silent (lines): precision | recall | flagged | Neg. FP | Dropped: precision | recall | Decision-level: recall (w/o post-hoc) | precision | Cost |
|---|---|---|---|---|---|---|---|---|---|---|
| a. implementer self-report | | not run | | | | | | | | |
| b. sighted reviewer (one pass) | | not run | | | | | | | | |
| c. pipeline, sighted extractor | | not run | | | | | | | | |
| d. pipeline, LLM tracer + adversary | | not run | | | | | | | | |
| e. pipeline, pairwise classifier | v2 | 0.964 | 0.8 | 28 | 1/2 | 1 | 1 | 1 (1) | 1 | 451s wall |
| f. census × plan classifier (no extraction) | v2 | 1 | 0.8 | 12 | 0/2 | 0.111 | 1 | 0.6 (1) | 1 | 6s wall |

## ledger-rounding

| Arm | Truth ver. | Silent (lines): precision | recall | flagged | Neg. FP | Dropped: precision | recall | Decision-level: recall (w/o post-hoc) | precision | Cost |
|---|---|---|---|---|---|---|---|---|---|---|
| a. implementer self-report | v1 | 0.705 | 0.955 | 44 | 7/8 | 1 | 1 | not adjudicated |  | 48s wall, $0.25 (1 sessions) |
| b. sighted reviewer (one pass) | v1 | 0.767 | 0.955 | 30 | 6/8 | 1 | 1 | not adjudicated |  | 55s wall, $0.29 (1 sessions) |
| c. pipeline, sighted extractor | v1 | 0.912 | 0.864 | 34 | 5/8 | 1 | 1 | not adjudicated |  | 445s wall, $2.19 (5 sessions) |
| d. pipeline, LLM tracer + adversary | v1 | 0.963 | 0.864 | 54 | 6/8 | 1 | 1 | not adjudicated |  | 620s wall, $3.07 (5 sessions) |
| e. pipeline, pairwise classifier | v1 | 0.895 | 0.864 | 38 | 6/8 | 1 | 1 | 0.909 (0.909) | 0.865 | 386s wall |
| f. census × plan classifier (no extraction) | v1 | 0.913 | 0.682 | 23 | 2/8 | 0.231 | 1 | 0.5 (0.5) | 0.957 | 5s wall |

## void-006-precrash

| Arm | Truth ver. | Silent (lines): precision | recall | flagged | Neg. FP | Dropped: precision | recall | Decision-level: recall (w/o post-hoc) | precision | Cost |
|---|---|---|---|---|---|---|---|---|---|---|
| a. implementer self-report | | not run | | | | | | | | |
| b. sighted reviewer (one pass) | | not run | | | | | | | | |
| c. pipeline, sighted extractor | | not run | | | | | | | | |
| d. pipeline, LLM tracer + adversary | | not run | | | | | | | | |
| e. pipeline, pairwise classifier | | not run | | | | | | | | |
| f. census × plan classifier (no extraction) | | not run | | | | | | | | |
