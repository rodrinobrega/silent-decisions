You are grading the findings of several code reviews. Different review methods looked at the same small piece of code and the plan it was written from. Each file in `lists/` is one method's output on one occasion. You are not told which method produced which list, and it must not matter: grade every item on its own merits, to the same standard.

Everything you need is in the current directory. Read nothing outside it.

- `plan.md`: what the product owner asked for.
- `src/ledger.ts`: the code that was written.
- `answer-key.json`: the known decisions.
  - `silent_decisions` (ids T…) are choices the code makes that the plan does not specify.
  - `not_implemented` are plan statements the code does not do.
  - `decided_by_the_plan` are rules the plan does specify; reporting one of them as unspecified is wrong.
- `lists/Lxx.json`: the items to grade. Each item claims: "the code makes this decision, and the plan does not specify it."

For every item give exactly one verdict:

- **a `silent_decisions` id** (for example `"T14"`) if the item identifies that decision: it states the same rule, and states it correctly for this code. Pointing at the right lines is not enough; the text must state the decision. If an item covers several known decisions, choose the one it is mainly about.
- **a `not_implemented` id** if the item is really reporting that a plan statement is not done.
- **`"valid"`** if it is a real decision this code makes, correctly described, that the plan does not specify and that the answer key does not list.
- **`"invalid"`** if any of these hold: the plan does specify it (including everything in `decided_by_the_plan`); the description is wrong about what the code does; or it is not a decision (a plain restatement of what the plan asks for, a style remark, a hypothetical).

When in doubt, check the code; do not take an item's word for it. Apply the same strictness to every list, whatever its writing style.

For every list `Lxx`, write `out/Lxx.json`:

{"list": "L01", "grades": [{"item": 1, "verdict": "T2", "note": "short reason"}]}

One entry per item, in item order, none skipped. Keep notes to a few words. When every list is written, reply with one line: the number of lists and items graded.
