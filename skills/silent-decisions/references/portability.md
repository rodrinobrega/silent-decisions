# Running outside Claude Code

The skill folder is self-contained: `SKILL.md`, `scripts/` (plain Node, no build step), `references/`. Copy it to wherever your agent looks for skills (`.agents/skills/silent-decisions/`, `.claude/skills/silent-decisions/`, ...).

The portable contract is small: **each role is a fresh session, given a prompt file and some paths, that writes one JSON file.** Any agent that can start a new session can run the method.

| Role | Prompt | Must not see |
|---|---|---|
| extractor | `references/extractor-prompt.md` (replace `$ARGUMENTS` with the room path) | the plan, the repository, this conversation |
| tracer | `references/roles/sd-tracer.md` | source code |
| adversary | `references/roles/sd-adversary.md` | anything but behaviours and the trace |
| probe writer | `references/roles/sd-probe-writer.md` | nothing in particular |

## Strict mode

`sd extract-strict` copies the room to a temporary directory outside the repository and runs one headless session there, with the prompt on stdin. The default command is

```
claude -p --bare --allowedTools Read,Glob,Grep,Write --permission-mode acceptEdits
```

`--bare` skips CLAUDE.md, memory, skills, plugins, hooks and MCP servers. Depending on your setup, bare mode may need an API key rather than a subscription login; check `claude --help`. Override the command for another CLI:

```
SD_EXTRACTOR_CMD='codex exec -' sd extract-strict
```

The command runs with the room as its working directory and must leave `out/behaviours.json` there. `sd extract-strict --dry-run` prints what would run.

## What you lose without the plugin

The per-agent confinement hook and its audit log are Claude Code features. Elsewhere, isolation rests on strict mode (separate session, directory outside the repository, fixed prompt) and is checked by the nonce and the phrase-overlap test in `sd leak-check`.

## Not verified yet

Nobody has run this on Codex, Cursor or Gemini CLI. The forked-skill path on Claude Code is built from the documentation and has not been exercised either: see "First run checklist" in the README.
