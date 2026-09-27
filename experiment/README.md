# Trace-mode experiment

The question: **does blind extraction plus execution find silent decisions that cheaper methods miss, and is a decision-only classifier as good a tracer as an LLM?** Six arms, same plan, same code, same ground truth, scored the same way.

| Arm | What runs | What it isolates |
|---|---|---|
| a | The implementer is asked to list its own unspecified decisions | The cheapest possible baseline |
| b | One sighted pass: read plan, read code, list decisions (AssumptionMiner-style) | A single reviewer |
| c | Full pipeline, but the extractor has read the plan | The value of blindness |
| d | Full pipeline, LLM tracer + adversary | The method as first designed |
| e | Full pipeline, pairwise classifier (Jev) | The method with a decision-only tracer |
| f | Census item × plan sentence through the classifier; no extraction, no execution | The value of extraction and execution |

## Scoring

`sd score` reduces every arm to flagged items with source lines, and dropped statement ids. Against `cases/<case>/truth.json`:

- A truth silent decision is **found** if any flagged item's lines overlap its lines. Recall = found / truth. Precision = flagged items overlapping some truth item / flagged.
- **Negative controls** are decisions the plan does make; flagging one is a false positive worth reporting separately, because an arm that flags everything scores perfect recall.
- Dropped requirements are scored by statement id.
- Cost is recorded per arm (wall time now; add tokens and dollars by hand from the CLI output).

Line-based matching is deliberately dumb so nobody can argue about it. Its weakness: an arm that flags the right decision but cites the wrong line scores a miss. Free-form arms (a, b) are told the score is line-based.

## Running

```bash
export OPENROUTER_API_KEY=...        # for Jev (arms e, f)
claude --version                     # arms a-d and the extractor; must be logged in
experiment/run.sh ledger             # all six arms
experiment/run.sh ledger ef          # just the classifier arms
```

Outputs land in `experiment/out/<case>/<arm>/` (delta.md, score.json) and `experiment/results.md`.

`run.sh` drives every model role through `claude -p --bare`, so the whole experiment is reproducible from a shell with no plugin installed. It has **not** been run end to end yet; expect to fix small things on the first pass (the `--bare` flag's authentication, prompt paths, JSON parsing of a role's output).

## Cases

| Case | Written by | Truth | Notes |
|---|---|---|---|
| `ledger` | us (planted) | v2, 10 silent · 1 dropped · 2 negative | saturated after run 003: decision recall at or near 1.0 |
| `ledger-rounding` | the operator (Claude), at Rodrigo's request, 2026-09-27 (planted) | v1, 22 silent · 3 dropped · 8 negative | ledger core plus rounding rules (fee, foreign currency, interest, split); one planted rule nobody would guess (T21). Not independent evidence. |

## Before you publish numbers

1. **One planted case is a demo, not evidence.** Add at least two cases you did not write the decisions for: take a real small repo, pick a merged feature, use its ticket or design doc as the plan, and have someone else (or a separate model session, blind to the pipeline) annotate the truth by reading the diff. `cases/<name>/truth.json` is all that is needed.
2. **Seed omissions properly.** For each case, also make a variant of the plan with two or three sentences deleted before the code was written (harder, fuzzy truth) or deleted only from the tracer's copy (exact truth, tests only the trace). Label which.
3. **Repeat runs.** Models are non-deterministic. Three runs per arm, report mean and range.
4. **Report every control** next to every accuracy number: extraction fidelity (verified / extracted), census coverage, leave-one-out status, leak status, and cost. An arm with a failed control is void, whatever its score.
5. **Publish the misses.** The per-item table in each `score.json` says which planted decision each arm missed. That is the interesting part.
