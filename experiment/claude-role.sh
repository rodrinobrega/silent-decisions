#!/usr/bin/env bash
# Launches one model role for run.sh: `claude <args> --model $SD_MODEL --output-format json`.
# Pins the model (default claude-opus-5-5), appends one line of cost, model and usage per session to
# $SD_COST_LOG when set, and prints the session's text result on stdout like `--output-format text`.
# Costs are what `claude -p` reports (API-equivalent); with a subscription login they are not billed.
set -o pipefail
out="$(claude "$@" --model "${SD_MODEL:-claude-opus-5-5}" --output-format json)"; rc=$?
printf '%s' "$out" | node -e '
let s = ""; process.stdin.on("data", (d) => (s += d)).on("end", () => {
  let j; try { j = JSON.parse(s); } catch { process.stdout.write(s); return; }
  const log = process.env.SD_COST_LOG;
  if (log) require("fs").appendFileSync(log, JSON.stringify({ t: new Date().toISOString(), cwd: process.cwd(), cost_usd: j.total_cost_usd, duration_ms: j.duration_ms, turns: j.num_turns, is_error: j.is_error, models: Object.keys(j.modelUsage || {}), usage: j.usage }) + "\n");
  process.stdout.write((j.result ?? "") + "\n");
});'
exit $rc
