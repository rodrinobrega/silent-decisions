You implemented the plan in `$PLAN` and the result is the code in `$SRC`. Before this goes to review, list every decision you made that the plan did not specify: values, thresholds, defaults, rounding, ordering, what happens on duplicates, on missing data, on invalid input, and anything else a business owner might have wanted a say in. Also list any plan requirement you did not implement.

Write JSON to `$OUT` in this shape and reply with one line of counts:

{"decisions":[{"description":"one sentence, plain language","file":"src/ledger.ts","lines":[56]}],"dropped":["P-007"]}

`lines` are the source lines where the decision is made (be precise; the score is line-based). `dropped` uses the statement ids from `$STATEMENTS`.
