# Limits

**Joint silence.** If neither the plan nor the code mentions something, nothing surfaces. Extraction describes what is there; tracing finds what one side has and the other lacks. Before accepting a clean delta, put the relevant questions below to the person who owns the rules. They come from neither the plan nor the code, which is the point.

- Money: can a balance go negative? What precision, and which rounding? One currency or several? Is there any limit per operation, per day, per account?
- Identity: who is allowed to do this? Is that checked here or somewhere else? What can a user see of another user's data?
- Repeats: what happens when the same request arrives twice? Twice with different contents?
- Time: which time zone defines "today"? What happens at month end, at daylight-saving changes, to records dated in the future?
- Absence: what happens for an unknown id, an empty list, a missing optional field, a deleted parent?
- Order: when two things tie, which comes first? Is that order stable?
- Removal: is deletion real or a flag? What happens to things that referred to it?
- Limits: maximum sizes, lengths, counts. What happens one past the limit?
- Failure: when a step halfway through fails, what is left behind? What does the caller see?
- Audit: should this be recorded? For how long?

**Extraction recall is bounded below, not guaranteed.** The census covers the syntactic shapes where decisions concentrate. Decisions spread across modules, or carried by data and configuration, can escape it. In v0.1 census coverage is declared by the extractor; line-coverage confirmation is not implemented.

**The control measures the tracer only.** Leave-one-out says nothing about what the extractor missed. It also cannot tell redundancy in the plan from over-matching; it reports `review` and a person looks.

**Same model, same priors.** The extractor has not read the plan, but it shares training with the implementer. It will find a default as unremarkable as the implementer did. Blindness controls contamination, not judgement.

**`stated` is provenance, not validity.** A behaviour can trace cleanly to a plan that is wrong.

**Meaning, not mechanics.** Which policy applies to a duplicate request is in scope. Whether that policy holds under concurrency is not. Concurrency, atomicity and crash recovery need property-based and concurrency testing.

**Behaviour the change removed is not reported in v0.1.** With `--base`, scenarios are extracted from the new code only, so a behaviour that existed before and is gone now is invisible unless the plan mentions it.

**Isolation is configured, then measured, never assumed.** The nonce and the audit log are the evidence. If the hook is not installed there is no audit log, and `delta.md` says so.
