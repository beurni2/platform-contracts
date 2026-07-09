#!/usr/bin/env bash
# Shape-freeze companion (WO-0 §B7): a change to the committed API-surface
# snapshot must arrive in the same PR as a version bump of
# @platform/contracts. Verifier finding: without this, a same-version
# snapshot regeneration would pass CI on convention alone.
set -euo pipefail

BASE_REF="${GITHUB_BASE_REF:+origin/${GITHUB_BASE_REF}}"
BASE_REF="${BASE_REF:-origin/main}"
SNAPSHOT="packages/contracts/snapshots/api-surface.snapshot.json"
PKG="packages/contracts/package.json"

if ! git rev-parse --verify --quiet "$BASE_REF" >/dev/null; then
  echo "check-snapshot-version-bump: base ref $BASE_REF not found — skipping (shallow or detached context)"
  exit 0
fi

merge_base="$(git merge-base HEAD "$BASE_REF")"

if ! git cat-file -e "${merge_base}:${SNAPSHOT}" 2>/dev/null; then
  echo "check-snapshot-version-bump: snapshot did not exist at merge-base — initial addition is allowed"
  exit 0
fi

if git diff --quiet "$merge_base" HEAD -- "$SNAPSHOT"; then
  echo "check-snapshot-version-bump: snapshot unchanged — OK"
  exit 0
fi

old_version="$(git show "${merge_base}:${PKG}" | node -e 'let d="";process.stdin.on("data",c=>d+=c).on("end",()=>console.log(JSON.parse(d).version))')"
new_version="$(node -e 'console.log(require("./packages/contracts/package.json").version)')"

if [ "$old_version" = "$new_version" ]; then
  echo "check-snapshot-version-bump: FAILED — $SNAPSHOT changed but @platform/contracts stays at $old_version."
  echo "A canonical-shape change requires a deliberate version bump in the same PR (Execution Contract §2.2)."
  exit 1
fi
echo "check-snapshot-version-bump: snapshot changed with version bump $old_version -> $new_version — OK"
