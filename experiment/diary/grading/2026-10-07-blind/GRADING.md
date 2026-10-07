# Blind decision-level grading · 2026-10-07

No new run. This grades the outputs of runs **003, 005, 006 and 007** at decision level with one
blind grader per case, so that arms a–f are compared on the same scale by the same judge.

| | |
|---|---|
| Graded | ledger-rounding: run 006 (a ×3, b ×3, c, d) + run 005 (e ×3, f) · ledger: run 007 (a ×3, b ×3, c, d) + run 003 (e ×3, f) |
| Grader | one fresh `claude -p` session per case, `claude-opus-5-5` pinned through `experiment/claude-role.sh`, tools Read/Write only, working directory a packet outside the repo |
| Items | ledger-rounding 13 lists / 437 items (244 s, $1.34 API-equivalent) · ledger 13 lists / 311 items (195 s, $1.14) |
| Operator | local Claude Code session (Opus 5.5); built the packets and mapped grades back, did not grade |

## Why

Runs 006 and 007 ran arms a–d for the first time and left them graded at line level only. Line level
credits any flag that touches a truth line, whatever it says, and that favours free-form lists. The
question Rodrigo asked: is the extractor the broken link, and does the pipeline beat simply asking a
model? That needs decision-level grades, made the same way for every arm and not by the person who
wrote the case.

## Method

`build.mjs` makes one packet per case containing:

- `plan.md` and `src/ledger.ts`;
- `answer-key.json`: truth ids with plain labels only, with no line numbers, provenance or post-hoc
  flags, and the "planted" marker on T21 removed;
- `lists/Lxx.json`: every flagged list, normalised to `{item, text, lines}`. Free-form items keep
  their description; pipeline scenarios become "title. Given …; when …; then …"; census items become
  "the code makes a decision at this point, and no plan sentence covers it: `<code>`". Dropped-requirement
  items are excluded, since they are scored by statement id.
- Lists are shuffled with a recorded seed and given codes L01–L13. One list per case is included
  twice under a second code, for test-retest.

The key (code → arm) was kept outside the packet and the case folder. The grader prompt (`prompt.md`)
says the lists come from different review methods without naming them. Each item gets one verdict:
a truth id (it states that decision correctly), a not-implemented id, `valid` (a real unspecified
decision not in the key) or `invalid` (planned, wrong about the code, or not a decision). It's told to
check the code rather than trust the item, and to judge every list to the same standard.

`score.mjs` maps each code back to its arm and rep, writes
`experiment/cases/<case>/adjudication/run-NNN-<arm>-<rep>.blind.json`, and rescores with
`sd score --adjudication` into `experiment/diary/runs/NNN/<arm dir>/score.blind.json`.

## Controls

- **Transcript audit** (`*/transcript-audit.json`): neither grader mentioned the key folder or the
  repository (0 mentions each). Calls flagged as "outside the packet" were all harmless:
  - the ledger grader read back its own long tool output from Claude Code's `tool-results` folder, and
    wrote one helper script next to the packet; running the script was denied, so it wrote every grade
    file by hand;
  - the ledger-rounding grader wrote two helper scripts in `/tmp/gr`.
- **Completeness:** every item graded, in order, in every list (437/437 and 311/311).
- **Test-retest:** the duplicated list (a run-006/007 b repetition in each case) got identical verdicts
  both times, 30/30 and 20/20. This is weak evidence: both copies were graded in the same session and
  the grader may have recognised the repeat.
- **Agreement with the earlier non-blind grades of arm e:** within one decision per repetition.

  | | Blind | Earlier (operator, not blind) |
  |---|---|---|
  | 005 (ledger-rounding) | 0.73 / 0.82 / 0.95 | 0.77 / 0.82 / 0.91 |
  | 003 (ledger) | 1.0 / 0.8 / 1.0 | 1.0 / 0.9 / 1.0 |

  The operator's grading had not inflated arm e.

## Results (decision level, blind)

**ledger-rounding** (truth v1, 22 decisions):

| Arm | Reps | Recall (mean, per rep) | Precision | Valid unlisted / rep | Flagged / rep | Missed in every rep | Time · cost per rep |
|---|---|---|---|---|---|---|---|
| a. implementer self-report | 3 | **0.83** (0.82, 0.86, 0.82) | 0.89 | 9.7 | 36 | T7, T10, T12 | ~55 s · $0.28 |
| b. sighted reviewer | 3 | **0.82** (0.86, 0.86, 0.73) | **0.93** | 8.7 | 33 | T7, T10, T12 | ~60 s · $0.30 |
| c. pipeline, sighted extractor | 1 | 0.86 | 0.82 | 0 | 34 | T10, T12, T13 | 445 s · $2.19 |
| d. pipeline, LLM tracer | 1 | **0.91** | 0.77 | 3 | 54 | T10, T12 | 620 s · $3.07 |
| e. pipeline, pairwise classifier | 3 | **0.83** (0.73, 0.82, 0.95) | 0.85 | 0.3 | 29 | T10 | ~410 s · Jev + ~$2* |
| f. census × plan | 1 | 0 (see below) | – | – | 23 | all | 5 s |

**ledger** (truth v2, 10 decisions, 5 of them post-hoc):

| Arm | Reps | Recall (mean, per rep) | Recall on v1 items | Precision | Valid unlisted / rep | Missed |
|---|---|---|---|---|---|---|
| a | 3 | 0.90 (0.9 ×3) | 1.0 | 0.95 | 10.3 | T7 ×3 |
| b | 3 | 0.93 (0.9, 0.9, 1.0) | 1.0 | **1.0** | 9.7 | T7 ×2 |
| c | 1 | 1.0 | 1.0 | 0.86 | 6 | – |
| d | 1 | 1.0 | 1.0 | 0.73 | 5 | – |
| e | 3 | 0.93 (1.0, 0.8, 1.0) | 1.0 | 0.99 | 4.3 | T7, T8 once each |
| f | 1 | 0 | 0 | – | – | all |

\* Arm e's session cost was not logged in runs 003/005. Its extractor and probe-writer sessions are
comparable to arm d's, minus the tracer and adversary.

Dropped requirements (scored by statement id, not graded): every arm, every rep, recall 1.0 on both
cases.

**Arm f scores 0 because of format, not because it found nothing.** Its items are code locations
("a decision at `DAILY_WITHDRAWAL_LIMIT = 5000`"), not stated rules. The grader applied the instruction
that the text must state the decision, and its notes say "points at code, states no rule" for every
item. That is a fair verdict on what a reviewer receives: a line to go and interpret. But it is not
comparable with the earlier lenient grading (0.50–0.60), which credited a location as the decision
it guards. Both readings are on record.

## What this shows

1. **On these two cases, one prompt does as well as the pipeline.**
   - On ledger-rounding, a single sighted pass (b) or self-report (a) found the same share of planned
     silent decisions as the blind pipeline (e): 0.82–0.83 mean recall.
   - Precision was equal or better (b 0.93, against e 0.85).
   - They did it in about a minute for about $0.30 per rep, roughly a seventh of the time and a tenth
     of the cost.
   - On ledger every arm is at or near ceiling.
2. **The baselines also find more real decisions nobody listed** (about 9–10 "valid unlisted" per rep
   against 0–4 for e). Part of this may be free-text latitude: a one-line claim is easier to accept as
   valid than an executed scenario. But the effect is large.
3. **What the pipeline finds that the baselines don't:**
   - T7, "re-opening an account doesn't reset it": a/b missed it in 5 of 6 ledger reps and all 6
     ledger-rounding reps; the pipeline arms (c, d, e) found it in 9 of their 10 reps;
   - T12 on one e rep.
   - Its scenarios are executed (every one verified), and its dropped requirements are probe-confirmed.
     The baselines' claims are not checked against the code at all.

   The baselines matched it on dropped requirements anyway.
4. **The blind spots are shared, not the extractor's alone.** T10 (transfers and splits don't count
   toward the daily limit) was missed by **every arm on every rep** of ledger-rounding, and T12
   (`entries()` returns a copy) by nearly every one. These look like hard decisions for any model
   reading this code, not a weakness of blind extraction.
5. **Arm d (LLM tracer) has the highest recall on ledger-rounding (0.91) and the lowest precision
   (0.77)**: it flags the most (54). One rep each for c and d, so their numbers are single samples.

So, to the question asked: the extractor is not the broken link. It finds about as much as anything
else does, and its misses are mostly misses for every method. **The finding is less flattering: on
these cases, the pipeline's machinery (blind extraction, execution, tracing, probes) does not buy
recall or precision over a single well-prompted pass. It buys verification and a few specific
catches, at about ten times the cost.**

## Caveats

- Two small planted cases, both written by us. Arm a is not a real implementer: it's a fresh session
  told it implemented the code, with no memory of doing so.
- One grader per case, a model, with a recorded prompt. Methods are hidden, but writing styles differ
  (free text vs Given/When/Then), so the grader could have guessed families.
- Test-retest was measured inside one session only.
- c and d have one rep each.

## Next

1. The cases now limit what can be learned. The comparison that matters is on **independent cases**
   (real repositories, truth annotated by someone other than us), where code is spread out and rules are
   less explicit. That's where blind extraction plus execution might separate from a single pass, or
   might not.
2. If the pipeline is kept, its defensible role is **verification**: turn a single pass's claims into
   executed scenarios and probe-confirmed dropped requirements. Rather than extracting in parallel,
   test whether arm b's list, fed through execution and probes, matches arm e's verified output. That's
   cheap to try on these cases.
3. A second grader (or a human) on a sample of items, to measure grader agreement properly.
