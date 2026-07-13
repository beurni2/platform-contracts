#!/usr/bin/env bash
# Negative fixture for the token-fidelity gate: an altered designer value must
# be REJECTED. The harness runs this under `capture ... fail`, so this script
# EXITS 1 (exactly) when the tamper is correctly caught — the negative fixture
# failing as required. Real repo is never touched (tmp copy only). If the
# check ever MISSED the tamper it would exit 0 and the harness flags it.
set -uo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
TMP="$(mktemp -d)"
mkdir -p "$TMP/packages"
cp -r "$ROOT/packages/ui-tokens" "$TMP/packages/ui-tokens"
cp -r "$ROOT/docs" "$TMP/docs"
cp "$ROOT/scripts/token-surface.data.mjs" "$TMP/"   # WO-5.7: gate imports the shared lists
# tamper: one hex digit in the BUILT dist (#C2571B shop primary -> #C2571C)
sed -i 's/#C2571B/#C2571C/' "$TMP/packages/ui-tokens/dist/family.js"
# fidelity check rooted at the tampered tree
sed "s#join(dirname(fileURLToPath(import.meta.url)), '..')#'$TMP'#" \
  "$ROOT/scripts/check-token-fidelity.mjs" > "$TMP/check.mjs"
node "$TMP/check.mjs" >/dev/null 2>&1
code=$?
if [ "$code" -eq 1 ]; then
  echo "token-fidelity negative OK: altered #C2571B→#C2571C rejected (exit 1)"
  exit 1   # the fixture failed as required — harness expects 'fail'
fi
echo "NEGATIVE FIXTURE MISBEHAVED — check exited $code (expected 1: caught)"
exit 0     # a pass here means the tamper slipped through — harness alarms
