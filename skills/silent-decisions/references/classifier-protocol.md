# Classifier protocol (pairwise trace mode)

`sd trace-pairwise` replaces the LLM tracer and adversary with a decision-only classifier. The classifier never sees the whole plan, the list of behaviours, or any narrative: each call is one plan statement and one scenario, and the answer is one label from a fixed set plus a confidence.

## Why

The LLM tracer's failure mode is agreeableness: reading the plan as a story of intent and finding some passage that is "about" a behaviour. A stateless pairwise call has no story to be swayed by. It cannot fabricate a quote (the statement *is* the input), it cannot cite hidden text (leave-one-out just omits the statements), and the flip test is not a later check but the question itself. The contrary outcome comes from the blind extractor's twin, so no plan-aware model writes anything the classifier sees.

Cost is |statements| × |behaviours| × 3 calls. Exhaustive, which is better than trusting a tracer to have noticed the right passage, and cheap with a fast classifier.

## Transport

`SD_CLASSIFIER_CMD` is a shell command. It receives JSONL requests on stdin and must write JSONL answers on stdout, one per request, in any order. Unanswered ids count as "no answer" (unsourced). Exit non-zero on fatal errors only.

Adapters shipped in `scripts/classifiers/`:

| Adapter | Use |
|---|---|
| `jev.mjs` | Jev (TypeSafe AI) through its `systemone` API. `OPENROUTER_API_KEY` routes via `https://openrouter.ai/api/v1/systemone` (model `jev-1.13`); `TYPESAFE_API_KEY` goes direct (`jev-latest`). `decides`/`type` become `choice` questions, `realises`/`census` become `noul`. Handles 429/529 with backoff. |
| `http.mjs` | Generic template for any other provider; edit `toBody` / `fromResponse`. |
| `claude-headless.mjs` | `claude -p --bare` per request, forced to a one-line JSON answer. Slow; a reference implementation and a comparison arm. |
| `fixture.mjs` | Answers from a JSON file. Tests and demos only. |

All adapters phrase the question through `question.mjs`, so every backend is asked the same thing.

## Requests

```jsonl
{"id":"type|P-004","task":"type","statement":"Customers can withdraw funds from an account.","labels":["behavioural","structural","process"]}
{"id":"pair|B-002|P-004|ab","task":"decides","statement":"…","given":"an account with balance 100","when":"150 is withdrawn","outcome_a":"the withdrawal is rejected …","outcome_b":"the withdrawal is accepted and the balance becomes -50","labels":["a","b","neither"]}
{"id":"pair|B-002|P-004|ba","task":"decides", … outcome_a and outcome_b swapped …}
{"id":"realises|B-002|P-004","task":"realises","statement":"…","given":"…","when":"…","outcome":"the withdrawal is rejected …","labels":["yes","no"]}
```

- `decides`: does the statement, read literally, *require* outcome a, outcome b, or neither? Asked twice with the outcomes swapped. Only a pair of answers that names the same outcome in both orderings counts; the lower confidence must clear the threshold (`--threshold`, default 0.7). Position-dependent answers are discarded and listed in `trace.json` under `pairs`.
- `realises`: is this scenario an instance of what the statement describes? Feeds the reverse direction only. A statement that no behaviour realises becomes a candidate for a reverse probe, as before.
- `type`: statement typing for the reverse trace.
- `census` (used by `sd trace-census`, the no-extraction baseline): does the sentence explicitly decide this AST decision point? yes/no.

## Answers

```jsonl
{"id":"pair|B-002|P-004|ab","label":"neither","confidence":0.8}
```

## What the assembled trace looks like

The output is the same `trace.json` shape the LLM tracer writes, so `sd check-trace`, `sd loo-*` and `sd render` run unchanged. Differences: `quotes` are whole statements; there is no `entailed` verdict (a classifier sees one statement at a time); `contradicted_by` lists statements the classifier says require the *contrary* of what the code does, which is worth a look in its own right; and `pairs` keeps every raw decision with its confidence for audit.

## Choosing between the two trace modes

Nothing is measured yet. The pairwise mode removes two failure modes (fabricated quotes, narrative over-matching) and adds two (per-pair accuracy of a small model on subtle entailment; no multi-statement `entailed`). The experiment in the methodology runs both on the same runs and reports precision and recall on the unsourced bucket, plus cost. Until then, pairwise is the default for runs whose numbers will be published, because every decision it made is in `pairs` and can be re-checked by anyone.
