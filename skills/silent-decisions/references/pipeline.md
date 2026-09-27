# Artefacts and formats

Everything lives under `.silent-decisions/` in the target project.

```
.silent-decisions/
  decisions.md            append-only ledger (commit this)
  signed/                 human-signed regression tests (commit this)
  acceptance/             notes for rejected behaviour (commit this)
  current.json            pointer to the active run (ignored)
  room/<run-id>/          the extractor's whole world (ignored)
    cleanroom/            stripped source, same relative paths as the project
    census.json           decision points, derived from code only
    census.uncovered.json gaps from the previous pass, if any
    out/behaviours.json   written by the extractor
  runs/<run-id>/          (ignored)
    run.json              plan hash, include globs, base ref, nonce, cap
    plan.md               frozen copy of the plan that was traced
    plan.statements.json  P-nnn from the plan, D-nnn from the ledger
    census.json, cleanroom.manifest.json
    behaviours.json       collected from the room by `sd run`
    tests/                generated Vitest files, one per behaviour, main + twin
    results.json          verified | vacuous | refuted (+ introduced | preexisting with --base)
    behaviours.verified.json   what the tracer and adversary are given
    census.coverage.json
    trace.json            tracer output (LLM tracer, or `sd trace-pairwise`; the latter also keeps `pairs`)
    adversary.json        adversary output (LLM mode only)
    trace.checked.json    after quote verification and verdict rules
    probes.json, probe-tests/, probes.results.json
    loo/                  plan.redacted.md, plan.statements.redacted.json, behaviours.subset.json, trace.json, control.json
    leak.json             shingle overlap, nonce, audit summary
    audit.jsonl           every tool call the extractor made (plugin hook)
    delta.md, metrics.json
```

## Who produces what

| File | Produced by | Sees the plan? |
|---|---|---|
| `plan.statements.json`, `census.json`, clean room | script | n/a |
| `behaviours.json` | extractor (model) | **never** |
| `results.json`, `census.coverage.json` | script + Vitest | n/a |
| `trace.json` | tracer (model), or a decision-only classifier one (statement, scenario) pair at a time | yes; never sees source code. The classifier never sees the plan as a whole |
| `adversary.json` | adversary (model), LLM mode only | only the quotes |
| `trace.checked.json` | script | n/a |
| `probes.json` | probe writer (model) | one statement at a time, plus source for call signatures |
| `loo/trace.json` | a second, fresh tracer (model) | redacted plan only |
| `delta.md` | script | n/a |

## Verdict rules applied by `sd check-trace`

1. A quote must appear verbatim (case and whitespace insensitive, at least three words) in a plan or ledger statement. Otherwise it is dropped.
2. `stated` needs one surviving quote. `entailed` needs surviving quotes from two different statements, and reasoning.
3. If the adversary reports `contrary_satisfies_quotes: true`, the verdict becomes `unsourced` (the flip test).
4. A verified behaviour with no tracer verdict is `unsourced`.
5. A behavioural statement is `realised` if any verified quote cites it, or the tracer linked it to a verified behaviour. Otherwise it is a candidate for a reverse probe.

## Schemas

JSON Schemas for the four model-written files are in `schemas/` at the repository root: `behaviours`, `trace`, `adversary` and `probes`. `sd run` validates the fields it depends on and refuses input it cannot execute.
