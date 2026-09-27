#!/usr/bin/env bash
# Checks that everything the experiment needs works, then runs arms e and f.
# Everything is logged to experiment/out/diagnose.log so it can be read back.
cd "$(dirname "$0")/.."
mkdir -p experiment/out; LOG=experiment/out/diagnose.log; : > "$LOG"
say() { printf '\n== %s\n' "$*" | tee -a "$LOG"; }
run() { printf '$ %s\n' "$*" | tee -a "$LOG"; "$@" 2>&1 | tee -a "$LOG"; echo "exit=${PIPESTATUS[0]}" | tee -a "$LOG"; }

say "versions"; run claude --version; run node -v
say "keys"; { [ -n "$OPENROUTER_API_KEY" ] && echo "OPENROUTER_API_KEY set" || echo "OPENROUTER_API_KEY NOT set"; [ -n "$ANTHROPIC_API_KEY" ] && echo "ANTHROPIC_API_KEY set" || echo "ANTHROPIC_API_KEY not set"; } | tee -a "$LOG"
say "claude -p plain"; echo "reply with the single word ok" | run claude -p
say "claude -p --bare"; echo "reply with the single word ok" | run claude -p --bare
say "claude -p with isolation flags (subscription login)"; echo "reply with the single word ok" | run claude -p --setting-sources project --strict-mcp-config --allowedTools Read,Glob,Grep,Write --permission-mode acceptEdits
say "jev via openrouter, one call"
printf '%s\n' '{"id":"t","task":"type","statement":"Customers can withdraw funds from an account.","labels":["behavioural","structural","process"]}' \
  | run node skills/silent-decisions/scripts/classifiers/jev.mjs
say "arm f (census x plan, Jev only)"; run experiment/run.sh ledger f
say "arm e (blind extractor + pairwise Jev)"; run experiment/run.sh ledger e
say "done"; echo "log: $LOG"
