#!/usr/bin/env bash
# Negative fixture for the design-dimensions gate — proven NON-VACUOUS BOTH WAYS
# (WO-5.6 verifier mandate). The gate must reject (A) a tampered token VALUE and
# (B) a tampered source DOC. The harness runs this under `capture ... fail`, so
# this script EXITS 1 (exactly) only when BOTH tampers are caught. The real repo
# is never touched (tmp copy only). If either tamper slipped through, it exits 0
# and the harness alarms.
set -uo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
TMP="$(mktemp -d)"
mkdir -p "$TMP/packages"
cp -r "$ROOT/packages/ui-tokens" "$TMP/packages/ui-tokens"
cp -r "$ROOT/docs" "$TMP/docs"
# a copy of the gate re-rooted at the tampered tree
sed "s#join(dirname(fileURLToPath(import.meta.url)), '..')#'$TMP'#" \
  "$ROOT/scripts/check-design-dimensions.mjs" > "$TMP/check.mjs"

run_gate() { node "$TMP/check.mjs" >/dev/null 2>&1; echo $?; }

# ── Tamper A: a BAD TOKEN VALUE in the built dist (haloPx 220 → 221) ──────────
sed -i 's/haloPx: 220/haloPx: 221/' "$TMP/packages/ui-tokens/dist/family.js"
codeA="$(run_gate)"
# restore the built value; leave the doc pristine
cp "$ROOT/packages/ui-tokens/dist/family.js" "$TMP/packages/ui-tokens/dist/family.js"

# ── Tamper B: a BAD DOC (motion.md 220px → 221px) — value now unstated ────────
sed -i 's/220px/221px/' "$TMP/docs/design/motion.md"
codeB="$(run_gate)"

if [ "$codeA" -eq 1 ] && [ "$codeB" -eq 1 ]; then
  echo "design-dimensions negative OK: bad VALUE (haloPx 220→221) rejected (exit $codeA); bad DOC (220px→221px) rejected (exit $codeB)"
  exit 1   # both tampers caught — the fixture failed as required (harness expects 'fail')
fi
echo "NEGATIVE FIXTURE MISBEHAVED — value-tamper exit $codeA, doc-tamper exit $codeB (expected 1 and 1)"
exit 0     # a pass here means a tamper slipped through — harness alarms
