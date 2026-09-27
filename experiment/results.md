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
