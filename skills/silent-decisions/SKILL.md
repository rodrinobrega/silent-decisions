---
name: silent-decisions
description: Use after an agent (or a person) has implemented a plan, spec or ticket in TypeScript/JavaScript and before merge or deploy, to list the decisions the implementation made that the plan did not specify, and the requirements it dropped. Also use when asked to "check the code against the plan", "what did the agent decide on its own", "review the delta", or to record a reviewer's decision on a flagged behaviour.
---

# Silent decisions

Agents implement plans well. What goes wrong is semantic: the plan was ambiguous, the implementer settled it silently, and tests generated from the same plan agree with the code. This skill finds those **silent decisions** by working backwards from the code: describe what the code does without looking at the plan, prove the description by running it, then ask of each behaviour where the plan asked for it.

The human reviews only the delta: behaviours the plan does not source, and plan statements the code does not realise.

You are the orchestrator. You run scripts and hand work to up to four roles. You do not extract, trace or judge anything yourself, because you have probably read the plan and the code both, which is exactly the contamination this method exists to avoid.

## Two rules that make the result mean something

1. **The extractor must never see the plan, or anything written by something that has.** That includes you. You pass it one thing: the path of its room. You do not summarise the task for it, name the feature, mention what to look for, or relay anything from this conversation. If you cannot start it without writing it a message of your own, use strict mode or stop and say so.
2. **Do not repair model output by hand.** If a scenario fails, a quote is not found, or a control fails, that is a result. Report it. The scripts apply the rules; you do not overrule them.

## Setup

`SD` below means `node <this skill's directory>/scripts/sd.mjs`. In a Claude Code plugin install that is `node "${CLAUDE_PLUGIN_ROOT}/skills/silent-decisions/scripts/sd.mjs"`. Run it from the root of the project being checked. `SD help` lists commands; `SD status` shows where a run stands.

Needs: Node 18+, and `typescript` and `vitest` installed in the target project. v0.1 handles TypeScript and JavaScript only.

Ask the user only for what you cannot find: the plan file, and, for a change to existing code, the git ref the change started from.

## Pipeline

**0. Prepare.** `SD init --plan <plan.md> [--base <git-ref>] [--include "src/**/*.ts"]`

Segments the plan into numbered statements, builds the clean room (source with comments stripped, tests and docs left out), and takes the decision-point census. Use `--base` whenever the plan describes a change to existing code: only behaviour the change introduced is traced. Note `room_root` and `nonce` from the output. The nonce is a canary: it now exists in this conversation and nowhere in the room.

**1. Extract, blind.** Start the extractor in a context that has never contained the plan. Try in this order:

- *Forked skill (Claude Code with this plugin):* invoke the skill `sd-extract` (plugin name `silent-decisions:sd-extract`) with `room_root` as its only argument, and nothing else.
- *Strict mode (any setup with a headless CLI):* `SD extract-strict`. It copies the room outside the repository and runs a separate session there with a fixed prompt. Set `SD_EXTRACTOR_CMD` to use a CLI other than `claude`. Use strict mode for any run whose numbers will be published.
- *Manual:* ask the user to open a new session whose working directory is `room_root`, paste `references/extractor-prompt.md` with `$ARGUMENTS` replaced by that path, and tell you when `out/behaviours.json` exists.

Never fall back to a general-purpose subagent with a prompt you wrote.

**2. Verify by execution.** `SD run`, then `SD census`.

Each scenario runs twice: as written, and with its perturbed twin. `verified` means the main assertion passed and the twin failed. `vacuous` means both passed, so the test cannot tell outcomes apart. `refuted` means the code does not do what the extractor said. Only verified scenarios go forward.

If `SD census` reports uncovered items, run step 1 once more (it picks up `census.uncovered.json` by itself), then `SD run` and `SD census` again. Two passes at most; report what is still uncovered.

**3. Trace.** Two modes. Prefer the classifier when one is configured; it is stateless per pair and every decision it makes is recorded.

*Pairwise classifier mode* (`SD_CLASSIFIER_CMD` set, see `references/classifier-protocol.md`): run `SD trace-pairwise`, then `SD check-trace`. Each classifier call sees one plan statement and one scenario, and answers whether the statement requires what the code does, requires the extractor's contrary, or neither. No adversary is needed; the flip test is the question. Nothing to delegate.

*LLM tracer mode* (no classifier): start a fresh `sd-tracer` subagent. Give it these paths and nothing else: `<run_dir>/plan.md`, `<run_dir>/plan.statements.json`, `<run_dir>/behaviours.verified.json` (verified behaviour only; with `--base`, only what the change introduced), and the output path `<run_dir>/trace.json`. Then start a fresh `sd-adversary` subagent with `<run_dir>/behaviours.verified.json`, `<run_dir>/trace.json` and the output path `<run_dir>/adversary.json`. Then `SD check-trace`. Without subagents, run each role as a new session using `references/roles/<role>.md` as its instructions.

In both modes `SD check-trace` verifies every quote against the plan, applies the verdict rules, defaults to unsourced, and lists `candidate_unrealised` statements. If a card says the plan may require the *opposite* of what the code does, say so prominently; that is a contradiction, not a silent decision.

**4. Reverse probes.** If there are candidates, start a fresh `sd-probe-writer` subagent with `<run_dir>/plan.statements.json`, the candidate ids, the project source path, and the output path `<run_dir>/probes.json`. Then `SD run --probes`. A failing probe confirms a dropped requirement. A passing probe means the code does it and the extractor missed it, which is recorded as an extraction miss.

**5. Control the run.** `SD loo-prepare`, then repeat the trace on the redacted inputs: in classifier mode `SD trace-pairwise --loo`; in LLM mode start another **fresh** `sd-tracer` with the three redacted inputs it prints (`loo/plan.redacted.md`, `loo/plan.statements.redacted.json`, `loo/behaviours.subset.json`) and the output path `<run_dir>/loo/trace.json`, giving it neither the full plan nor the first trace, and not telling it this is a control. Then `SD loo-score` and `SD leak-check`.

Leave-one-out hides a few plan statements that were the sole source of some behaviour. Those behaviours must now come back unsourced. `passed`: they did. `review`: some were re-sourced from another passage, which is either redundancy in the plan or over-matching, and a person must look. `failed`: the tracer quoted text that was not in its copy. A failed control, or a leak check reporting `contaminated`, voids the run.

**6. Render and hand over.** `SD render` writes `<run_dir>/delta.md` and `metrics.json`. Show the user the delta file and give the headline numbers and the state of the controls in two or three sentences. If the delta is over the cap, say the plan is not ready and name the open areas; do not walk through the cards. Do not editorialise on individual items or suggest which option is right. The decision belongs to the person who owns the business rule.

**7. Record decisions.** When the user rules on an item:

- The code is right: `SD ledger --behaviour B-003 --decision approve --by "<name>"`. The scenario becomes a signed regression test under `.silent-decisions/signed/`, and future traces can quote the decision.
- The code is wrong: `SD ledger --behaviour B-003 --decision reject --expected "<what should happen>" --by "<name>"`. This writes an acceptance note under `.silent-decisions/acceptance/` for whoever fixes the code.

Never edit the plan's prose; earlier quotes depend on it. Never record a decision the user did not make.

## What to tell the user about limits

Say these when relevant, plainly:

- A clean delta with failed or missing controls means nothing.
- The method cannot see what both the plan and the code are silent about (no authorization anywhere, for example). `references/limits.md` has a short question bank to raise with the user.
- It checks meaning, not mechanics. Concurrency, atomicity and similar structural defects need other tests.
- Census coverage in v0.1 is what the extractor declared, confirmed only in that the covering scenario passed.

More detail: `references/pipeline.md` (artefacts and file formats), `references/limits.md`, `references/portability.md` (running outside Claude Code).
