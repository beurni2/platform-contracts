#!/usr/bin/env bash
# Negative fixture for the lockfile URL-form gate (WO-5.8 Part F). A planted
# SSH-form git URL must be REJECTED. Run under `capture ... fail`, so this EXITS
# 1 (exactly) when the plant is caught. The real lockfile is never touched (tmp
# copy only). If the gate MISSED the plant it exits 0 and the harness alarms.
set -uo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
TMP="$(mktemp -d)"
cp "$ROOT/pnpm-lock.yaml" "$TMP/pnpm-lock.yaml"
# plant the founder's headline case — an SSH-form dependency resolution
printf '\n  some-private-dep@git:\n    resolution: {type: git, repo: git@github.com:beurni2/private.git}\n' >> "$TMP/pnpm-lock.yaml"
# re-root the gate at the tampered tree
sed "s#join(dirname(fileURLToPath(import.meta.url)), '..')#'$TMP'#" \
  "$ROOT/scripts/check-lockfile-url-form.mjs" > "$TMP/check.mjs"
node "$TMP/check.mjs" >/dev/null 2>&1
code=$?
if [ "$code" -eq 1 ]; then
  echo "lockfile-url-form negative OK: planted 'git@github.com:' SSH URL rejected (exit 1)"
  exit 1   # the fixture failed as required — harness expects 'fail'
fi
echo "NEGATIVE FIXTURE MISBEHAVED — check exited $code (expected 1: caught)"
exit 0     # a pass here means the SSH URL slipped through — harness alarms
