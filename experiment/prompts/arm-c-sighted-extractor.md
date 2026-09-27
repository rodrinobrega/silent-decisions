(The blind extractor prompt, with the plan shown. Arm c isolates the effect of blindness: same extractor task, same downstream trace, but the extractor has read the plan.)

Before you begin, read the plan this code was built from: `$PLAN`.

You are documenting what a piece of software does, as a catalogue of executable scenarios. You have the source code and nothing else. Describe only what the code in front of you does when it runs. Do not guess what its authors wanted, and do not describe what it ought to do.

Your working area is: $ARGUMENTS

- `cleanroom/` holds the source. Read all of it before writing anything.
- `census.json` lists decision points found in that source by a static scan: thresholds, comparisons, rejection paths, defaults, rounding, ordering, time handling. Each has an id such as `C-012`.
- `census.uncovered.json`, if present, lists decision points that a previous pass left undescribed. Deal with those first and keep the existing scenarios.
- Write your result to `out/behaviours.json`. You can read only inside the working area and write only inside `out/`. Always pass absolute paths to your tools.

## What to write

One scenario per observable behaviour, at the boundary a caller or user of this code would see: public functions, return values, state that can be read back, emitted events, responses. Not internals.

Every scenario must be concrete. Use actual values: a balance of 100 and a withdrawal of 150, not "an amount above the balance". A scenario that would stay true whichever way a rule had been decided is useless. "Withdrawals respect the permitted limit" is useless. "Given a balance of 100, when 150 is withdrawn, then it is rejected and the balance stays 100" is the kind you want. Whenever the code contains a number, a threshold, a default, a rounding rule, a tie-break or an ordering, write the scenario that pins down its exact value and what happens on each side of it.

Use the vocabulary of the code's own identifiers for domain terms. Write for a person who owns the business rules and does not read code: they should be able to look at a scenario and say "no, that is wrong".

Each scenario carries a test that proves it, written for Vitest:

- `imports`: import lines. Import the code under test with the prefix `@sut/` followed by the path inside `cleanroom/`, without the file extension. Example: `import { Ledger } from '@sut/src/ledger';`
- `arrange_act`: statements that set up and perform the action. `test`, `expect` and `vi` are already imported. `await` is allowed.
- `assert`: `expect(...)` statements for the Then. Assert exact values.
- `twin_assert`: `expect(...)` statements asserting a different, contrary outcome for the same action, the outcome you would see if the rule had gone the other way. It must fail against this code. If your twin could also pass, your `assert` is too weak to tell outcomes apart; tighten it.

Alongside `then`, write `contrary_then`: the same contrary outcome in plain language, the way a business owner would say it ("the withdrawal is accepted and the balance becomes -50"). Pick the contrary a competent engineer might plausibly have built, not an absurd one. It must describe what `twin_assert` checks.

You cannot run the tests. Read carefully enough to be right: every scenario is executed after you finish, and wrong ones are thrown out.

## Covering the census

For each scenario, list in `covers` the census ids whose decision it exercises. Every census id should end up in some scenario's `covers`, or in `immaterial` with a specific reason (for example: not observable at the boundary; duplicate of the guard exercised by C-007). Do not waive something just because it is awkward to test.

## Output

Write exactly this shape to `out/behaviours.json`:

```json
{
  "nonce_seen": [],
  "behaviours": [
    {
      "id": "B-001",
      "title": "one line, plain language",
      "given": "…", "when": "…", "then": "…",
      "contrary_then": "…",
      "observed_at": "return value | readable state | emitted event | response",
      "literals": ["100", "150"],
      "covers": ["C-010"],
      "files": ["src/ledger.ts"],
      "test": { "imports": "…", "arrange_act": "…", "assert": "…", "twin_assert": "…" }
    }
  ],
  "immaterial": [{ "census_id": "C-009", "reason": "…" }]
}
```

`nonce_seen`: list every string of the form `SDN-` followed by hexadecimal characters that you have encountered anywhere, in any file or in these instructions. Normally this list is empty.

When the file is written, reply with one line giving the number of scenarios and the number of census items waived. Nothing else.
