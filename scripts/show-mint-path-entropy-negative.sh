#!/usr/bin/env bash
# Negative fixture for the mint-path entropy gate (WO-5.9). A planted Math.random
# in a mint path must be REJECTED — and rejected BY CATCHING THE OFFENDER, not by
# some other exit-1 path (the WO-5.8 vacuous-proof lesson: assert the output names
# the offender AND the sed re-root actually changed the gate). Run under
# `capture ... fail`, so this EXITS 1 only when caught. Real repo untouched.
set -uo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
TMP="$(mktemp -d)"
mkdir -p "$TMP/packages"
cp -r "$ROOT/packages/contracts" "$TMP/packages/contracts"
# plant the forbidden entropy source in the mint module
MINT="$TMP/packages/contracts/src/command-id.ts"
printf '\nexport const __bad = () => Math.random().toString(36);\n' >> "$MINT"
# re-root the gate at the tampered tree
sed "s#join(dirname(fileURLToPath(import.meta.url)), '..')#'$TMP'#" \
  "$ROOT/scripts/check-mint-path-entropy.mjs" > "$TMP/check.mjs"

# (1) the sed re-root must have actually changed the gate's bytes:
if cmp -s "$ROOT/scripts/check-mint-path-entropy.mjs" "$TMP/check.mjs"; then
  echo "NEGATIVE FIXTURE MISBEHAVED — the sed re-root did not change the gate"
  exit 0
fi
# (2) the plant must be CAUGHT — exit 1 AND the failure names Math.random:
out="$(node "$TMP/check.mjs" 2>&1)"; code=$?
if [ "$code" -eq 1 ] && printf '%s' "$out" | grep -q 'Math.random'; then
  echo "mint-path-entropy negative OK: planted Math.random in command-id.ts CAUGHT (exit 1; output names Math.random)"
  exit 1   # the fixture failed as required — harness expects 'fail'
fi
echo "NEGATIVE FIXTURE MISBEHAVED — exit $code, output did not name Math.random: $out"
exit 0     # a pass here means the plant slipped through — harness alarms
