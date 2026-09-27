#!/usr/bin/env bash
# Runs the whole pipeline on the example with recorded model outputs (fixtures/),
# so you can see every script work without spending a token.
set -euo pipefail
cd "$(dirname "$0")"
SD="node ../../skills/silent-decisions/scripts/sd.mjs"
[ -d node_modules ] || npm install --no-audit --no-fund
rm -rf .silent-decisions
$SD init --plan plan.md
RUN=$(node -p "require('./.silent-decisions/current.json').run_dir")
ROOM=$(node -p "require('./.silent-decisions/current.json').room_root")
cp fixtures/behaviours.json "$ROOM/out/"          # stands in for the blind extractor
$SD run && $SD census
if [ "${1:-}" = "--pairwise" ]; then
  export SD_CLASSIFIER_CMD="node $PWD/../../skills/silent-decisions/scripts/classifiers/fixture.mjs"
  export SD_CLASSIFIER_FIXTURE="$PWD/fixtures/classifier.json"
  $SD trace-pairwise                              # stands in for a decision-only classifier
else
  cp fixtures/trace.json fixtures/adversary.json "$RUN/"   # tracer and adversary
fi
$SD check-trace
cp fixtures/probes.json "$RUN/"                   # probe writer
$SD run --probes
$SD loo-prepare --k 3
if [ "${1:-}" = "--pairwise" ]; then
  SD_CLASSIFIER_FIXTURE="$PWD/fixtures/classifier.loo.json" $SD trace-pairwise --loo
else
  cp fixtures/loo.trace.json "$RUN/loo/trace.json"  # second, fresh tracer on the redacted plan
fi
$SD loo-score && $SD leak-check && $SD render
echo; echo "Open $RUN/delta.md"
