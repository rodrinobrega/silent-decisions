You are reviewing code against the plan it was built from. Read the plan in `$PLAN`, then the code in `$SRC`. Report every place where the code makes a decision the plan does not explicitly make: values, thresholds, defaults, rounding, ordering, behaviour on duplicates, missing data, invalid input, error handling policy. Then report every plan statement (`$STATEMENTS`) the code does not implement.

Be precise about where. Write JSON to `$OUT` in this shape and reply with one line of counts:

{"decisions":[{"description":"one sentence, plain language","file":"src/ledger.ts","lines":[56]}],"dropped":["P-007"]}
