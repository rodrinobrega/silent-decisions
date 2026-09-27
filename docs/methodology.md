# Trace What Was Built

*A pre-deploy check for AI-generated code: review the delta between what was asked for and what was built.*

**Status:** working draft v2.1, 21 September 2026 (v2.1 adds the pairwise classifier trace). Experimental: nothing here has been measured yet, see [Evaluation](#evaluation). v1 (14 September) is archived at `methodology/archive/`. What changed and why is in `reviews/2026-09-21-trace-review-and-inputs.md`; IDs in brackets below point there. The diagram predates v2 and needs redrawing.

---

## Summary

An agent implements the plan. An extractor then reads the resulting code, with the plan deliberately withheld, and renders its behaviour as concrete scenarios in domain language. Each scenario is executed against the implementation, so what remains is a verified account of what the code does, not a claim about what was intended.

Each verified behaviour is then traced back to the plan, one plan sentence at a time, by a decision-only classifier that is asked a single question per pair: does this sentence require what the code does, require the contrary the extractor wrote alongside it, or neither? A behaviour is sourced only when a sentence requires it and would be violated by the contrary. The only model that reads the plan never sees more than one sentence of it, and cannot write. (An LLM tracer bound by verbatim quotes and an adversary is the fallback.) The same trace runs in reverse, and every plan statement that appears unrealised is probed by execution before it is reported.

Every run carries its own control: a few plan statements are hidden from the tracer, and the behaviours that depended on them must come back unsourced. If they do not, the run is void.

What reaches the human is only the delta: **silent decisions** the implementer made on its own, and requirements it dropped. Each is shown as a choice between what the code does and a concrete alternative. Approved decisions are recorded in a ledger and become human-signed regression tests. The size of the delta is itself a measurement of the plan.

![Pipeline (v1 diagram, to be redrawn)](./trace-what-was-built.png)

---

## The problem

Agents execute plans well. The failures that survive to production are usually not implementation defects. They are **semantic** ones: the plan was ambiguous, the agent resolved the ambiguity silently, and it resolved it the wrong way.

*Should the ledger allow negative balances?* An agent will produce entirely correct code for either answer. And because the tests are generated from the same plan, they encode the same interpretation: the suite is self-consistent and wrong. Everything downstream of the plan sits on the intention side of the gap, so nothing downstream of the plan can see across it.

Today that gap closes after deploy, when the semantic error surfaces as an incident.

## The move

**The checkable artifact must be derived from the code, not from the plan.**

A specification tells you what you intended. The problem is the distance between intention and what got built, so the artifact has to be extracted from the built thing. Fixing the plan raises the prior; extraction gives you the posterior. Only one of those is a pre-deploy check.

The question this lets you ask is "where did this come from?" rather than "what is missing?". The first is matching over two concrete lists. The second is recall over an unbounded space, and it is the step that methods deriving checks from requirements cannot make reliable.

## Vocabulary

- **Silent decision**: a behaviour observable at the system boundary that the plan neither states nor entails. The unit of review.
- **Dropped requirement**: a behavioural plan statement that the code does not realise, confirmed by a failing probe.
- **Delta**: silent decisions plus dropped requirements (plus unrequested regressions, on a change to existing code).
- **Signed scenario**: an executed scenario whose outcome a human has adjudicated.

## The pipeline

**0. Prepare (deterministic, no model).**

- *Segment the plan* into numbered statements and type each as behavioural, structural ("use Postgres"), or process. Only behavioural statements enter the reverse trace; structural ones go to ordinary deterministic checks. This fixes the denominator for everything reported later. [TR-09, TR-10]
- *Build the clean room*: a copy of the source with comments and docstrings stripped, and tests, docs, the plan, and version-control history excluded. Agent-written code carries the plan in its comments; an extractor that reads `// per spec: reject overdrafts` is not blind. [TR-05]
- *Take the decision-point census*: an AST walk of the domain module that enumerates the places silent decisions concentrate: numeric and string literals, comparisons on domain fields, every rejection path, default parameter values, enum members, sort comparators and tie-breaks, rounding calls, date and timezone handling, validation patterns. [IN-02]

**1. Implement.** The agent builds from the plan as normal. Nothing changes here.

**2. Extract, blind.** An extractor, in a context that has never contained the plan, reads the clean room and renders behaviour as concrete Given/When/Then scenarios in domain language.

> Given an account with balance 100
> When the customer withdraws 150
> Then the withdrawal is rejected and the balance remains 100

Withholding the plan is the central hypothesis of the method: an extractor that can see the plan will describe the code as conforming to it. It is a hypothesis until the ablation in Evaluation says otherwise.

Concreteness is load-bearing. An abstract property like *"an accepted debit cannot violate the permitted balance floor"* is true whether or not overdrafts are allowed: it absorbs the decision. A scenario cannot. You have to write a number, and the census turns that into a rule: **every domain literal in the code must appear in the plan or in the delta.**

The one sanctioned leak is a nouns-only glossary (terms, no rules, no numbers) so the extractor can write in domain language. [TR-06] Each scenario is a structured record that declares where it observes the system (`observed_at`: public API, persisted state, emitted event), not free prose.

Extraction loops against the census: every census item must be exercised by at least one surviving scenario or explicitly marked immaterial with a reason. Uncovered items go back to the extractor as targeted prompts. **Material** means a scenario at the declared boundary changes outcome. Items filtered as immaterial are logged and counted, never dropped. [TR-12]

**3. Verify by execution.**

- Run every scenario against the implementation. Survivors form the *verified account of behaviour*.
- Run each scenario's **perturbed twin**, the same scenario with its Then changed. If both pass, the test glue is vacuous and the scenario is void. [IN-04]
- On a change to existing code, run survivors against **base and head**. Passes on head only: behaviour this change introduced, goes to the tracer. Passes on both: pre-existing, skipped. Passed on base and fails on head: behaviour this change removed, reported as an **unrequested regression** unless the plan asked for it. [IN-06]
- Scenarios that fail are logged, not deleted. A scenario that independent blind extractors agree on and execution refutes means the code reads as doing one thing and does another. [TR-08]

Extraction claims are directly testable against the artifact they describe, which is what makes this cheap. Note what it proves: that the scenarios are true of the code. It does not prove the account is complete. The census and the reverse probes below are the two checks on completeness.

**4. Trace, both directions.** The verified account is compared against the plan plus the decisions ledger:

| Direction | Question | Interesting outcome |
|---|---|---|
| behaviour → plan | Where does the plan specify this? | **unsourced**: a silent decision |
| plan → behaviour | Where is this realised? | **unrealised**: a dropped requirement, once a probe confirms it |

The test that defines "sourced" is the **flip test**: behaviour B is `stated` by plan sentence S only if the contrary behaviour B′ (same Given and When, different Then) would *violate* S. *"Users can withdraw funds"* is not violated by *"withdrawals below zero succeed"*, so *"withdrawals below zero are rejected"* is unsourced, however relevant the sentence looks. The plan discriminates between B and B′ or it does not. [IN-03]

B′ comes from the blind extractor: every scenario ships with a **contrary outcome** in plain language, the same one its perturbed twin checks. So no model that has read the plan writes anything the trace consumes.

*Pairwise classifier trace (preferred).* A decision-only classifier, a model that emits one label from a fixed set and a confidence, is asked, for every (sentence, behaviour) pair in isolation: does S require B, require B′, or neither? The pair is asked twice with B and B′ swapped; answers that move with the position are discarded, and the lower of the two confidences must clear a threshold, defaulting to unsourced. A separate yes/no question per pair, "is this scenario an instance of what S describes?", feeds the reverse direction, because "customers can withdraw funds" does not decide the overdraft policy but a withdrawal scenario still realises it. Every raw decision is kept for audit.

What this removes: the tracer's narrative. An agent given the whole plan and the whole list of behaviours reads the plan as a story of intent and finds something "about" each behaviour; that is where over-matching comes from. A classifier that sees one sentence and one scenario has no story. It cannot fabricate a quote, since the sentence is the input; it cannot cite hidden text, since leave-one-out simply omits the sentence; and the flip test is not a later check but the question itself. Cost is |sentences| × |behaviours| × 3 small calls, which is exhaustive rather than trusting a tracer to have noticed the right passage. What it gives up: multi-sentence `entailed` verdicts (a classifier sees one sentence), a human-readable argument on each card, and, until measured, accuracy on subtle entailment.

*LLM tracer (fallback).* A fresh agent given the plan and the verified behaviours, under constraints that exist to stop it being agreeable: quote verbatim, mechanically checked (kills fabricated citations); three-valued verdict `stated` / `entailed` / `unsourced`, with `entailed` required to quote every passage it combines; default to unsourced; and an adversarial pass by a third agent that constructs B′ for each claimed citation and argues that it satisfies the quote.

In both modes, **reverse probes** settle candidate `unrealised` statements: for each, and only those, write a scenario *from the plan statement* and execute it. Pass: the code does realise it and the extractor missed it, a direct measurement of extraction recall. Fail: a confirmed dropped requirement, with an executable witness. This is the one place plan-derived tests are legitimate, because they run after blind extraction and only on the residual. [IN-05]

**5. Control the run.**

- **Leave-one-out.** Pick *k* plan statements that were the sole source for some behaviour. Remove them from a copy of the plan and re-trace those behaviours. Each must come back `unsourced`, or be sourced from a different passage that survives the flip test. The share that stays sourced is the false-sourced rate on this plan, this code, this run. A run whose control fails is void. With the pairwise classifier the control cannot fail by citation, only by re-sourcing, and re-sourcing is then a fact about the plan's redundancy or the classifier's judgement, both worth a look. [IN-01]
- **Leak check.** Overlap between the extractor's output and the plan's text, beyond glossary terms, flags a contaminated extraction.

Over-matching is the failure that would silently break this method, and in v1 a broken run looked identical to a clean one. These two checks are what make a clean result mean something.

**6. Review the delta.** The human reads silent decisions, dropped requirements, and unrequested regressions. Matched is a dead end by design, with one exception: `entailed` verdicts are sampled at a stated rate and the overturn rate is reported. [TR-04]

- Each item is a **two-option card**: what the code does, against B′. *"Rejects at zero"* / *"allows down to a limit: which?"* Not approve/reject. [IN-09]
- Items are clustered by root cause; one missing rule usually spawns several behaviours.
- **There is a cap** (starting value 25). Above it the verdict is *plan not ready*, and the output is the list of open areas, not the cards. [TR-15]

**7. Record.** Plan prose is never edited, since that would invalidate earlier quotes. Approved decisions are appended to a **decisions ledger** with an ID, the scenario, the approver, the date, and the plan hash. The approved scenario is promoted to a regression test tagged as human-signed. A rejected decision becomes its inverse, handed to the implementer as a failing acceptance test. [IN-07]

## What this buys

**The review surface is principled rather than arbitrary.** Not "review twelve properties" with no justification for twelve: review exactly the difference between what was asked and what was built. Its size is determined by the quality of the plan, which is the right thing for it to depend on.

**The review surface becomes a measurement.** The number of silent decisions a plan left to the implementer is known before anything deploys. A tight plan produces a small delta and a fast review; a vague one produces a large delta, and that is information, not a failure of the method.

**The reviewer's job is contradiction, not comprehension.** The test for a good item is whether the person who owns the business rule can look at it and say *"no, we allow that down to −500."* If they can only nod, it is either too vague or too technical. The two-option card exists to make nodding harder.

**The contract accretes.** Signed scenarios accumulate run over run into the small, human-approved verification surface that earlier versions of this project tried to derive from requirements up front. Nobody has to enumerate what must be true in advance; the set is built from adjudicated deltas. When several signed scenarios cluster, the invariant that generalises them can be proposed and expanded into property tests: invariants induced from adjudicated scenarios rather than deduced from requirements. (Future work.)

**For this check, the reviewer does not read the implementation or the generated tests.** Structural review is a separate problem, see Limits.

## Extensions

**Provenance chain.** The trace applies between any two adjacent artifacts: prompt or ticket → plan → code. Plans are increasingly agent-written and human-skimmed, so `stated` may trace to text no person decided. Running the trace one level up, plan against the human's original words, closes that. It is weaker there because a plan cannot be executed: flip test and quotes only. The thesis it supports: every behaviour in production either traces to words a human wrote or approved, or it is on a list. [IN-08]

**Divergence.** Underdetermination can also be found mechanically: generate several independent implementations from the same plan, extract a decision record from each, and diff them. What differs is what the plan failed to specify. At function level this is established technique (ClarifyGPT, SpecFix, BeSpec); the contribution here would be applying it at plan level with structured decision records. If you use it:

- Diff structured records (`negative_balance_allowed: false`, `rounding: HALF_UP`) or cross-execute scenarios against both branches. Never text-diff prose.
- Do not pre-generate a shared question set from the plan; that is the unbounded-recall step again. Extract each branch independently and align afterwards.
- Keep branches independent: same plan, fresh context each. Telling one to "do it differently" manufactures divergence. Using a different model for the second branch does not buy independence; see Limits.
- Anything both branches receive must come from a source that has seen neither implementation.
- It is a prioritiser, not the mechanism. It runs once per plan and amortises.

**Canary clause (experiment).** One arbitrary, harmless, checkable clause per plan. If it comes back dropped, the implementer was not reading closely. Whether that predicts anything else is untested. [IN-10]

## Limits

**Joint silence.** If neither the plan nor the code mentions authorization, rate limits, or audit, nothing surfaces. Extraction describes what is there; tracing finds what one side has and the other lacks. Absent from both is the residual omission problem. Partial defence: a per-domain question bank ("every ledger must answer: overdraft? rounding? currency? duplicate key with a different payload?") from a source that has seen neither plan nor code. [TR-11]

**Extraction recall is bounded below, not guaranteed.** The census covers the syntactic shapes where decisions concentrate; decisions encoded in control flow across modules can escape it. Reverse probes estimate recall only on the plan side.

**The control measures the trace, not the pipeline.** Leave-one-out says nothing about what the extractor missed.

**A classifier's judgement is per pair.** The pairwise trace trades narrative over-matching for per-pair accuracy on entailment that is often subtle. Published figures for decision-only models are unaudited and on other tasks; the trace-mode comparison in Evaluation is the only evidence that will count.

**Convergence is not clearance.** Divergence is strong evidence that the plan left something open. Agreement between branches is evidence of very little. Knight and Leveson showed in 1986 that independently written versions fail together; a 2026 rerun with coding agents found the same substantial common-mode failure across agent systems, models, and languages, with co-failures traced to where the specification was hard or ambiguous. The signal is asymmetric: it finds ambiguity, it never clears a decision.

**`stated` means provenance, not validity.** A behaviour can trace cleanly to the plan and the plan can still be wrong.

**Scope.** This addresses semantic defects: the plan meant something else. *Which policy* applies to a duplicate request is in scope. Whether that policy holds under concurrency is not; structural defects (concurrency, atomicity, idempotency mechanics) need property-based and concurrency testing.

**Cost.** With the classifier: one extractor session, thousands of small classifier calls, one probe writer. With the LLM tracer: five or six agent roles. Both unmeasured.

## Related work

The closest published neighbour is **AssumptionMiner** (Wu, July 2026), which extracts the implicit assumptions in LLM-generated code as structured records with alternatives for a developer to accept or revise. Its extractor is given the prompt and the code together, nothing is executed, it operates at function level, and there is no reverse direction; the paper reports decision-level extraction as far from solved. It is the sighted baseline this method has to beat. Shipping tools (Traycer's verification pass, Qodo's ticket compliance, Augment Intent's Verify persona) check code against a plan with the plan in view; they ask *does the code satisfy the plan*, where this method asks *what did the code decide that the plan did not*.

Older roots: characterization tests (Feathers) for extracting behaviour from code as executable examples; specification mining (Daikon), whose abstract invariants are what the concreteness argument above rejects; requirements-to-code traceability recovery; TiCoder, where users approve or reject concrete tests to pin down intent; Clover and round-trip correctness for consistency checks by reconstructing one artifact from another; mutation-guided test generation (Meta's ACH).

What we have not found elsewhere: blind extraction as a contamination control; execution-verified behaviour as the thing traced; a bidirectional trace with a flip test, run as isolated pairwise decisions with the contrary supplied by the blind side; a per-run control on the tracer; delta size as a pre-deploy metric of plan quality; adjudicated deltas accumulating into the contract. Full references are in the review.

## Evaluation

The method is falsifiable without planting bugs, and the result can come out against the thesis.

1. **Spike first.** Extractor recall at the domain boundary on three small repos not written for the purpose, census as denominator. Go/no-go.
2. **Five arms, same plans, same code:** (a) implementer self-report, "list the decisions you made that the plan did not specify"; (b) a sighted single-pass reviewer in the style of AssumptionMiner; (c) this pipeline with a sighted extractor; (d) this pipeline with the LLM tracer and adversary; (e) this pipeline with the pairwise classifier trace. Precision *and* recall on the unsourced bucket for each, and cost. If neither (d) nor (e) beats (a), a one-line prompt does the job, and that is the finding. Where (d) and (e) disagree, the pair-level record says why.
3. **Two kinds of seeded omission, labelled separately.** A clause deleted *before* implementation tests the whole pipeline, with fuzzy ground truth (you know where a decision must exist, not what it is). A clause deleted *after* implementation, from the tracer's copy only, gives exact ground truth but tests only the tracer.
4. **Negative controls.** Fully specified plans where the correct delta is near zero. A tracer that marks everything unsourced scores perfect recall.
5. **Ground truth we did not write.** AssumptionMiner's annotated benchmark; and SWE-bench patches that pass the tests but behave differently from the developer's patch (Wang, Pradel, Liu), with the issue as the plan: does the delta contain the decision on which they diverge?
6. **Report with every accuracy number:** extraction fidelity, census coverage, leave-one-out rate, `entailed` overturn rate, delta size per plan, tokens, wall-clock, and reviewer minutes per item. Ablate the expensive roles so readers can see what each buys.

---

*Diagram source: `trace-what-was-built.svg` (v1; redraw for the seven-step pipeline).*
