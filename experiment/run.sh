#!/usr/bin/env bash
# Run every arm of the trace-mode experiment on one case and score it.
#
#   experiment/run.sh <case> [arms]      e.g. experiment/run.sh ledger abcdef
#
# Needs: `claude` on PATH and logged in (arms a-d, and the extractor for c/d/e/f),
#        OPENROUTER_API_KEY for the Jev classifier (arms e, f), vitest in the case project.
# Each arm writes experiment/out/<case>/<arm>/ and a score json. Nothing is deleted.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
CASE="${1:?case name}"; ARMS="${2:-abcdef}"
TRUTH="$ROOT/experiment/cases/$CASE/truth.json"
PROJ="$ROOT/$(node -p "require('$TRUTH').project")"
PLAN="$(node -p "require('$TRUTH').plan" | sed "s#^$(basename "$PROJ")/##; s#^examples/$CASE/##")"
SD="node $ROOT/skills/silent-decisions/scripts/sd.mjs"
OUT="$ROOT/experiment/out/$CASE"; mkdir -p "$OUT"
export SD_CLASSIFIER_CMD="${SD_CLASSIFIER_CMD:-node $ROOT/skills/silent-decisions/scripts/classifiers/jev.mjs}"

# How every model role is launched. `--bare` skips user settings, plugins, hooks and CLAUDE.md (best isolation)
# but only authenticates with ANTHROPIC_API_KEY. With a subscription login, fall back to `-p` with user
# settings and MCP servers switched off, if this CLI supports those flags; otherwise plain `-p`.
if [ -z "${SD_CLAUDE_P:-}" ]; then
  if [ -n "${ANTHROPIC_API_KEY:-}" ]; then SD_CLAUDE_P="claude -p --bare"
  elif echo "reply with the single word ok" | claude -p --setting-sources project --strict-mcp-config >/dev/null 2>&1; then
    SD_CLAUDE_P="claude -p --setting-sources project --strict-mcp-config"
  else SD_CLAUDE_P="claude -p"; echo "warning: running roles with plain 'claude -p' (user CLAUDE.md, plugins and hooks load)" >&2; fi
fi
export SD_CLAUDE_P
export SD_EXTRACTOR_CMD="${SD_EXTRACTOR_CMD:-$SD_CLAUDE_P --allowedTools Read,Glob,Grep,Write --permission-mode acceptEdits}"
echo "roles run as: $SD_CLAUDE_P"
cd "$PROJ"

headless() { # headless <prompt-file> <out-json> [extra text]  : one fresh claude session, prompt on stdin
  local prompt; prompt="$(sed -e "s#\$PLAN#$PROJ/$PLAN#g" -e "s#\$SRC#$PROJ/src#g" -e "s#\$OUT#$2#g" -e "s#\$STATEMENTS#$3#g" "$1")"
  printf '%s\n' "$prompt" | $SD_CLAUDE_P --allowedTools Read,Glob,Grep,Write --permission-mode acceptEdits >/dev/null
  [ -f "$2" ] || { echo "arm did not write $2" >&2; return 1; }
}
role() { # role <role-name> <task text> : fresh session with a role prompt (tracer, adversary, probe-writer)
  { cat "$ROOT/skills/silent-decisions/references/roles/sd-$1.md"; printf '\n\n---\n\nTask: %s\n' "$2"; } \
    | $SD_CLAUDE_P --allowedTools Read,Write --permission-mode acceptEdits >/dev/null
}

fresh_run() { rm -f .silent-decisions/current.json; $SD init --plan "$PLAN" --cap 100 >/dev/null; RUN="$(node -p "require('path').resolve(require('./.silent-decisions/current.json').run_dir)")"; ROOM="$(node -p "require('./.silent-decisions/current.json').room_root")"; }
t0() { date +%s; }

for arm in $(echo "$ARMS" | grep -o .); do
  echo "== arm $arm"; start=$(t0)
  case $arm in
    a|b)
      fresh_run; mkdir -p "$OUT/$arm"
      f=$([ "$arm" = a ] && echo arm-a-self-report.md || echo arm-b-sighted-reviewer.md)
      headless "$ROOT/experiment/prompts/$f" "$OUT/$arm/output.json" "$RUN/plan.statements.json"
      $SD score --arm "$arm" --truth "$TRUTH" --input "$OUT/$arm/output.json" --out "$OUT/$arm/score.json" --cost "$(( $(t0) - start ))s wall" ;;
    c|d|e)
      fresh_run; mkdir -p "$OUT/$arm"
      if [ "$arm" = c ]; then   # sighted extractor: same task, plan visible, run in the room like strict mode
        sed "s#\$PLAN#$PROJ/$PLAN#g; s#\$ARGUMENTS#$ROOM#g" "$ROOT/experiment/prompts/arm-c-sighted-extractor.md" \
          | (cd "$ROOM" && $SD_CLAUDE_P --allowedTools Read,Glob,Grep,Write --permission-mode acceptEdits >/dev/null)
      else
        $SD extract-strict >/dev/null
      fi
      $SD run >/dev/null; $SD census >/dev/null
      if [ "$arm" = e ]; then
        $SD trace-pairwise >/dev/null
      else                       # c and d use the LLM tracer + adversary
        role tracer "plan $RUN/plan.md; statements $RUN/plan.statements.json; behaviours $RUN/behaviours.verified.json; write $RUN/trace.json"
        role adversary "behaviours $RUN/behaviours.verified.json; trace $RUN/trace.json; write $RUN/adversary.json"
      fi
      $SD check-trace > "$OUT/$arm/check.json"
      cands=$(node -p "JSON.parse(require('fs').readFileSync('$OUT/$arm/check.json','utf8')).candidate_unrealised.join(', ')")
      if [ -n "$cands" ]; then
        role probe-writer "statements $RUN/plan.statements.json; probe these ids: $cands; source $PROJ/src; write $RUN/probes.json"
        $SD run --probes >/dev/null || true
      fi
      $SD loo-prepare >/dev/null
      if [ "$arm" = e ]; then $SD trace-pairwise --loo >/dev/null; else
        role tracer "plan $RUN/loo/plan.redacted.md; statements $RUN/loo/plan.statements.redacted.json; behaviours $RUN/loo/behaviours.subset.json; write $RUN/loo/trace.json"; fi
      $SD loo-score >/dev/null; $SD leak-check >/dev/null; $SD render >/dev/null
      cp "$RUN/delta.md" "$OUT/$arm/delta.md"
      $SD score --arm "$arm" --truth "$TRUTH" --out "$OUT/$arm/score.json" --cost "$(( $(t0) - start ))s wall" ;;
    f)
      fresh_run; mkdir -p "$OUT/$arm"
      $SD trace-census >/dev/null; cp "$RUN/census-delta.md" "$OUT/$arm/"
      $SD score --arm f --truth "$TRUTH" --out "$OUT/$arm/score.json" --cost "$(( $(t0) - start ))s wall" ;;
  esac
  echo "   $(( $(t0) - start ))s"
done
node "$ROOT/experiment/table.mjs" "$CASE"
