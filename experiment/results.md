# Trace-mode experiment: results

## ledger-rounding

| Arm | Truth ver. | Silent (lines): precision | recall | flagged | Neg. FP | Dropped: precision | recall | Decision-level: recall (w/o post-hoc) | precision | Cost |
|---|---|---|---|---|---|---|---|---|---|---|
| a. implementer self-report | | not run | | | | | | | | |
| b. sighted reviewer (one pass) | | not run | | | | | | | | |
| c. pipeline, sighted extractor | | not run | | | | | | | | |
| d. pipeline, LLM tracer + adversary | | not run | | | | | | | | |
| e. pipeline, pairwise classifier | v1 | 0.867 | 0.818 | 30 | 6/8 | 1 | 1 | 0.773 (0.773) | 0.897 | 393s wall |
| f. census × plan classifier (no extraction) | v1 | 0.913 | 0.682 | 23 | 2/8 | 0.182 | 0.667 | 0.545 (0.545) | 0.957 | 5s wall |
