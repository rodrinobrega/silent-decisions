# silent-decisions: operator notes

You are running the `silent-decisions` experiments on Rodrigo's Mac. You can run everything yourself:
tests, the experiment harness, git. Run commands, read their output, fix what breaks, run again.
Ask Rodrigo only for decisions that are his (see "Ask first").

## What this project is

A pre-deploy check for AI-written code: a **blind** extractor (never sees the plan) describes what the
code does as executable scenarios, each is run with a perturbed twin, and every verified behaviour is
traced back to the plan. What reaches a human is the delta: **silent decisions** (behaviour the plan
never decided) and **dropped requirements** (plan statements the code does not do).

- Method write-up: `docs/methodology.md` (the current draft also lives in the claude.ai project "invariant-review").
- Skill and scripts: `skills/silent-decisions/` (CLI: `node skills/silent-decisions/scripts/sd.mjs`).
- Experiment harness: `experiment/` (arms a–f, see `experiment/README.md`).
- Run diary: `experiment/diary/` — **read `experiment/diary/README.md` and the latest `runs/NNN/RUN.md` before starting any work.** It holds the results so far, the open problems, and what the next run should test.

## Environment

- macOS, Node 20. `claude` is logged in with a subscription; `ANTHROPIC_API_KEY` is **not** set, so
  `--bare` fails. `experiment/run.sh` picks the flags itself (`claude -p --setting-sources project --strict-mcp-config`)
  and prints `roles run as: …`. Arms a–d and the extractor spend Rodrigo's subscription usage.
- `OPENROUTER_API_KEY` must be set for the Jev classifier (arms e, f). If it is missing, stop and ask.
- Case projects under `examples/` need their own `node_modules` installed **on this Mac**
  (`cd examples/<case> && npm install`). A Rollup "Cannot find module @rollup/rollup-…" error means
  they were installed on another platform: delete `node_modules` and `package-lock.json` and reinstall.

## Commands

```bash
npm test                                  # all tests; must be green before a run
bash experiment/diagnose.sh               # environment check, then arms f and e on the ledger case
experiment/run.sh <case> [arms]           # e.g. experiment/run.sh ledger ef ; experiment/run.sh ledger abcd
node experiment/table.mjs <case>          # results table -> experiment/results.md
npm run sync                              # after editing the extractor prompt (regenerates skill/agent copies)
```

Rescore a finished run at decision level (from the case directory):

```bash
cd examples/<case>
node ../../skills/silent-decisions/scripts/sd.mjs score --arm e --run <sd run id> \
  --truth ../../experiment/cases/<case>/truth.json \
  --adjudication ../../experiment/cases/<case>/adjudication/run-NNN-e.json --out <file>
```

A run takes minutes (arm e ≈ 3.5 min on the ledger case). Run it in the foreground with a long enough
timeout, and send the output to a log as well: `experiment/run.sh ledger ef 2>&1 | tee experiment/out/run-NNN.log`.

## The run protocol (every run, no exceptions)

1. **Pre-flight.** `npm test` green. `git status` clean (commit first if needed). Record
   `git rev-parse HEAD`: this is the commit the run executes on. Pick `NNN` = last diary run + 1.
2. **Run** the arms. Do not commit or edit tracked files while a run is going: `run.sh` temporarily
   renames this file (see Blindness) and puts it back on exit.
3. **Check the controls** in each arm's `delta.md` / `metrics.json`: scenarios verified vs vacuous vs
   refuted, census coverage, leave-one-out, leak check. A failed leave-one-out or a `contaminated`
   leak check **voids** the arm, whatever its score. A harness crash is not a run: fix it and start
   again from step 1.
4. **Only after a successful run:**
   - Tag the commit from step 1: `git tag -a run-NNN <hash> -m "run NNN: <case>, arms <x>"`.
   - Snapshot artifacts into `experiment/diary/runs/NNN/arm-<x>/` (score.json, delta.md, metrics.json,
     trace.checked.json, behaviours.verified.json, loo control, leak.json; see run 001 for the set).
     `.silent-decisions/` is gitignored, so anything not copied is lost.
   - Adjudicate at decision level: copy the previous `experiment/cases/<case>/adjudication/run-NNN-<arm>.json`,
     map **every** flagged item to a truth id, `valid` (real decision, not in the truth file) or
     `invalid`. Record who adjudicated and whether they were blind to the arm. Rescore with
     `--adjudication` into `score.truth-vN.json`.
   - Write `experiment/diary/runs/NNN/RUN.md` with the same sections as run 001: header (commit, tag,
     case + truth version, arms, models, sd run ids), results, controls, what went well, what went wrong,
     changes since the previous run, and whether it is comparable with earlier runs.
   - Add a row to the index in `experiment/diary/README.md`.
   - Commit: `diary: run NNN (<case>, arms <x>)`.
5. Report to Rodrigo: the headline, the table, what got better or worse than the previous comparable
   run, and what you would change next. Report bad results as plainly as good ones.

## Blindness and honesty rules

- **Never put case-specific content in this file** (plan text, truth items, which decisions exist).
  `run.sh` hides this file during runs because `claude -p` loads every CLAUDE.md above its working
  directory, but anything outside a run is not guarded.
- Never start extractor, tracer, adversary or probe-writer sessions by hand from inside this repo.
  Always go through `experiment/run.sh` / `sd`.
- The extractor prompt (`skills/silent-decisions/references/extractor-prompt.md`) must never mention a
  plan, spec, requirement or ticket; a test enforces it.
- **Truth files:** never edit `experiment/cases/<case>/truth.json` silently. Every change bumps
  `version`, adds a `changelog` entry, keeps the previous version as `truth.vN.json`, and marks items
  found by reading a run's output `"post_hoc": true` with a `reason`. Items discovered through one
  arm's output favour that arm; always report recall with and without post-hoc items.
- Do not change a case's `plan.md` or source after it has been used in a run; make a new case instead.
- Do not delete or rewrite old diary entries. Corrections go in a new entry or a clearly dated note.

## Conventions

- Everything deterministic lives in scripts; model judgement is confined to extraction, tracing, the
  adversary and probe writing.
- Any change to the method (not just the harness) goes in the diary entry and in `docs/methodology.md`.
- Add a regression test for every bug a run exposes (see `test/pairwise.test.mjs`, run 001 regression).
- Commit messages end with a `Co-Authored-By:` line for the model that wrote the change.

## Ask first

- Anything that edits a truth file or an adjudication you did not make this session.
- Adding or choosing new cases (they must not be written by us; see `experiment/README.md`).
- `git push`, rewriting history, deleting tags, or deleting files outside `experiment/out/` and `.silent-decisions/`.
- Runs that would use a lot of subscription usage (e.g. repeating all six arms several times).

## Next up

Whatever the latest `RUN.md` lists under "Changes planned" / next steps. As of run 001: run 002 on the
ledger case with arms e, f (to test the multi-contrary trace and probe-all changes), then arms a–d; then
two independent cases before any number is published.
