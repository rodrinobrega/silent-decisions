# Trace-mode experiment: results

## ledger

| Arm | Truth ver. | Silent (lines): precision | recall | flagged | Neg. FP | Dropped: precision | recall | Decision-level: recall (w/o post-hoc) | precision | Cost |
|---|---|---|---|---|---|---|---|---|---|---|
| a. implementer self-report | | not run | | | | | | | | |
| b. sighted reviewer (one pass) | | not run | | | | | | | | |
| c. pipeline, sighted extractor | | not run | | | | | | | | |
| d. pipeline, LLM tracer + adversary | | not run | | | | | | | | |
| e. pipeline, pairwise classifier | v1 | 0.95 | 1 | 20 | 1/2 | null | 0 | not adjudicated |  | 208s wall |
| f. census × plan classifier (no extraction) | v1 | 0.917 | 1 | 12 | 0/2 | 0.111 | 1 | not adjudicated |  | 6s wall |
