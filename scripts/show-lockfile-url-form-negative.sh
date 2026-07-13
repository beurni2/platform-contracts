#!/usr/bin/env bash
# Negative fixture for the lockfile URL-form gate (WO-5.8 Part F). A planted
# SSH-form git URL must be REJECTED — and rejected BY CATCHING THE PLANT, not by
# some other exit-1 path. Run under `capture ... fail`, so this EXITS 1 (exactly)
# only when the plant is caught. The real lockfile is never touched (tmp only).
set -uo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
TMP="$(mktemp -d)"
cp "$ROOT/pnpm-lock.yaml" "$TMP/pnpm-lock.yaml"
# plant the founder's headline case — an SSH-form dependency resolution
printf '\n  some-private-dep@git:\n    resolution: {type: git, repo: git@github.com:beurni2/private.git}\n' >> "$TMP/pnpm-lock.yaml"
# re-root the gate at the tampered tree
sed "s#join(dirname(fileURLToPath(import.meta.url)), '..')#'$TMP'#" \
  "$ROOT/scripts/check-lockfile-url-form.mjs" > "$TMP/check.mjs"

# CTO pre-merge hardening (WO-5.8) — close the vacuous-proof hole the verifier
# found: a silent sed miss (line 17 refactored) would leave the copy identical,
# resolve root to the mktemp parent, find no lockfile, and exit 1 via "not found"
# — a FALSE GREEN the harness cannot tell from a real catch.
#  (1) the re-root must have actually changed the gate's bytes:
if cmp -s "$ROOT/scripts/check-lockfile-url-form.mjs" "$TMP/check.mjs"; then
  echo "NEGATIVE FIXTURE MISBEHAVED — the sed re-root did not change the gate (line 17 refactored?)"
  exit 0
fi
#  (2) the plant must be CAUGHT — exit 1 AND the failure OUTPUT names the offender:
out="$(node "$TMP/check.mjs" 2>&1)"; code=$?
if [ "$code" -eq 1 ] && printf '%s' "$out" | grep -q 'SSH-form'; then
  echo "lockfile-url-form negative OK: planted 'git@github.com:' SSH URL CAUGHT (exit 1; output names 'SSH-form')"
  exit 1   # the fixture failed as required — harness expects 'fail'
fi
echo "NEGATIVE FIXTURE MISBEHAVED — exit $code, output did not name 'SSH-form': $out"
exit 0     # a pass here means the plant slipped through (or a false green) — harness alarms
