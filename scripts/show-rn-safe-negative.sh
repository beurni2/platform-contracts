#!/usr/bin/env bash
# NEGATIVE FIXTURE for the RN-safe root-entry gate (WO-0C): hardlink-copy the
# built contracts package, plant an fs import into a file on the "." graph,
# and require the scanner to fail (exit 1). The planted file is REMOVED from
# the copy before rewriting — never truncated in place — so the hardlinked
# original inode is untouched.
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT

if [ ! -d "$ROOT/packages/contracts/dist" ]; then
  # exit 0 = the gate FAILED to demonstrate anything (run-gates expects fail);
  # a missing dist must never count as the demonstrated failure.
  echo "BUG: packages/contracts/dist missing — build before running the fixture"
  exit 0
fi

cp -al "$ROOT/packages/contracts/dist" "$TMP/dist"
cp "$ROOT/packages/contracts/package.json" "$TMP/package.json"

TARGET="$TMP/dist/enums.js"
ORIGINAL_CONTENT="$(cat "$TARGET")"
rm "$TARGET" # break the hardlink before writing — protects the real dist
printf 'import { readFileSync } from "node:fs"; // PLANTED by negative fixture\n%s\n' "$ORIGINAL_CONTENT" > "$TARGET"

echo "planted 'node:fs' import into hardlinked copy at $TARGET"
echo "\$ node scripts/scan-rn-safe-entry.mjs --package-dir $TMP"
set +e
node "$ROOT/scripts/scan-rn-safe-entry.mjs" --package-dir "$TMP"
RC=$?
set -e
if [ "$RC" -eq 0 ]; then
  echo "BUG: scanner passed a graph with a planted fs import — the gate asserts nothing"
  exit 0 # exit 0 signals the gate FAILED to catch it (run-gates expects fail)
fi
echo "scanner exited non-zero as required (rc=$RC)"

# Scenario 2 (verifier finding): a node-only SIBLING SUBPATH pulled into the
# root graph must also fail — the scanner follows @platform/* subpaths
# through the sibling's exports map instead of mapping them to its root.
TMP2="$(mktemp -d)"
trap 'rm -rf "$TMP" "$TMP2"' EXIT
cp -al "$ROOT/packages/contracts/dist" "$TMP2/dist"
cp "$ROOT/packages/contracts/package.json" "$TMP2/package.json"
TARGET2="$TMP2/dist/enums.js"
ORIGINAL2="$(cat "$TARGET2")"
rm "$TARGET2"
printf 'import "@platform/i18n/data-loader"; // PLANTED node-only sibling subpath\n%s\n' "$ORIGINAL2" > "$TARGET2"
echo "planted '@platform/i18n/data-loader' import into hardlinked copy at $TARGET2"
echo "\$ node scripts/scan-rn-safe-entry.mjs --package-dir $TMP2"
set +e
node "$ROOT/scripts/scan-rn-safe-entry.mjs" --package-dir "$TMP2"
RC2=$?
set -e
if [ "$RC2" -eq 0 ]; then
  echo "BUG: scanner passed a root graph pulling in a node-only sibling subpath"
  exit 0
fi
echo "scanner exited non-zero as required (rc=$RC2)"

# sanity: the real dist must still be pristine (rm-before-write protected it)
if grep -q 'PLANTED' "$ROOT/packages/contracts/dist/enums.js"; then
  echo "BUG: the fixture leaked into the real dist"
  exit 0
fi
exit 1
