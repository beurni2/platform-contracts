#!/usr/bin/env bash
# Negative fixture for the token-coverage meta-gate — proven NON-VACUOUS on BOTH
# branches (WO-5.7). The gate must reject (A) a stray TOP-LEVEL export owned by
# no gate, and (B) a stray LEAF added to an existing value group covered by no
# gate. Run under `capture ... fail`, so this EXITS 1 only when BOTH are caught.
# The real repo is never touched (tmp copy only).
set -uo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
TMP="$(mktemp -d)"
mkdir -p "$TMP/packages"
cp -r "$ROOT/packages/ui-tokens" "$TMP/packages/ui-tokens"
cp -r "$ROOT/docs" "$TMP/docs"
cp "$ROOT/scripts/token-surface.data.mjs" "$TMP/"           # shared lists the gate imports
sed "s#join(dirname(fileURLToPath(import.meta.url)), '..')#'$TMP'#" \
  "$ROOT/scripts/check-token-coverage.mjs" > "$TMP/check.mjs"

FAMILY="$TMP/packages/ui-tokens/dist/family.js"
run_gate() { node "$TMP/check.mjs" >/dev/null 2>&1; echo $?; }

# ── Tamper A: a STRAY TOP-LEVEL export owned by no gate (the designer's `icon`) ─
printf '\nexport const icon = { badge: { size: 12 } };\n' >> "$FAMILY"
codeA="$(run_gate)"
cp "$ROOT/packages/ui-tokens/dist/family.js" "$FAMILY"      # restore pristine

# ── Tamper B: a STRAY LEAF on an existing value group (spacing) ────────────────
printf '\nObject.assign(spacing, { strayLeaf: 99 });\n' >> "$FAMILY"
codeB="$(run_gate)"

if [ "$codeA" -eq 1 ] && [ "$codeB" -eq 1 ]; then
  echo "token-coverage negative OK: stray top-level export 'icon' rejected (exit $codeA); stray leaf 'spacing.strayLeaf' rejected (exit $codeB)"
  exit 1   # both caught — the fixture failed as required (harness expects 'fail')
fi
echo "NEGATIVE FIXTURE MISBEHAVED — stray-export exit $codeA, stray-leaf exit $codeB (expected 1 and 1)"
exit 0     # a pass here means a stray slipped through — harness alarms
