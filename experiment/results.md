# Trace-mode experiment: results

## ledger

| Arm | Silent decisions: precision | recall | flagged | Negative-control false positives | Dropped: precision | recall | Cost |
|---|---|---|---|---|---|---|---|
| a. implementer self-report | not run | | | | | | |
| b. sighted reviewer (one pass) | not run | | | | | | |
| c. pipeline, sighted extractor | not run | | | | | | |
| d. pipeline, LLM tracer + adversary | not run | | | | | | |
| e. pipeline, pairwise classifier | 0.95 | 1 | 20 | 1/2 | null | 0 | 208s wall |
| f. census × plan classifier (no extraction) | 0.917 | 1 | 12 | 0/2 | 0.111 | 1 | 6s wall |
