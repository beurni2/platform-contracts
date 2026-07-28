#!/usr/bin/env bash
# WO-0 §B7 CI gates, run end-to-end with evidence. Every gate has a negative
# fixture and this script SHOWS each one failing once (output captured under
# _evidence/ when EVIDENCE_DIR is set, otherwise printed).
set -uo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
EVIDENCE_DIR="${EVIDENCE_DIR:-}"
FAILED=0

log() { printf '\n=== %s ===\n' "$1"; }
capture() {
  # capture <name> <expected: pass|fail> <command...>
  local name="$1" expected="$2"; shift 2
  local out rc
  out="$("$@" 2>&1)"; rc=$?
  if [ -n "$EVIDENCE_DIR" ]; then
    mkdir -p "$EVIDENCE_DIR"
    printf '$ %s\n%s\n(exit code: %d)\n' "$*" "$out" "$rc" > "$EVIDENCE_DIR/$name.txt"
  fi
  printf '%s\n(exit code: %d)\n' "$out" "$rc"
  if [ "$expected" = pass ] && [ $rc -ne 0 ]; then echo "GATE FAILED (expected pass): $name"; FAILED=1; fi
  # exit EXACTLY 1 (WO-2.8 item 8, echoing the app harnesses): a crashed or
  # misinvoked gate (exit 2+) must never pass for a working negative fixture.
  if [ "$expected" = fail ] && [ $rc -ne 1 ]; then echo "GATE FAILED (expected the negative fixture to fail with exit 1, got $rc): $name"; FAILED=1; fi
}

cd "$ROOT"

log "gate: typecheck (incl. secret-separation type tests)"
capture typecheck pass pnpm typecheck

log "gate: unit + property + shape tests (reconciliation, shape-freeze, secrets, no-gated-shapes)"
capture tests pass pnpm test

log "gate: copy-lint — seed catalog (must pass)"
capture copy-lint-positive pass node packages/i18n/dist/cli.js packages/i18n/catalog/catalog.json

log "gate: copy-lint — NEGATIVE FIXTURE (must fail: « Veuillez patienter », « séquestre », all four conditions)"
capture copy-lint-negative fail node packages/i18n/dist/cli.js packages/i18n/fixtures/negative-catalog.json

log "gate: drift-check — pristine consumer /docs copy (must pass)"
DRIFT_CONSUMER="$(mktemp -d)/docs"
mkdir -p "$DRIFT_CONSUMER"
cp docs/*.md "$DRIFT_CONSUMER/"
capture drift-check-positive pass node packages/contracts/dist/drift-check-cli.js "$DRIFT_CONSUMER" --manifest docs.manifest.json --pinned-version 2.1.0

log "gate: drift-check — TAMPERED consumer doc (must fail)"
printf '\nrogue edit — a consumer repo drifted from canon\n' >> "$DRIFT_CONSUMER/Shop-Plus-Build-Spec.md"
capture drift-check-negative fail node packages/contracts/dist/drift-check-cli.js "$DRIFT_CONSUMER" --manifest docs.manifest.json --pinned-version 2.1.0

log "gate: RN-safe root entries — scanner over each package's '.' graph (must pass)"
capture rn-safe-positive pass node scripts/scan-rn-safe-entry.mjs

log "gate: RN-safe root entries — NEGATIVE FIXTURE (planted node:fs import in hardlinked copy, must fail)"
capture rn-safe-negative fail bash scripts/show-rn-safe-negative.sh

log "gate: export maps — every subpath target exists, node-only tooling behind subpaths (must pass)"
capture export-maps pass node scripts/check-export-maps.mjs

log "gate: lockfile url-form — pnpm-lock.yaml carries zero SSH-form git URLs, cold-installable (must pass)"
capture lockfile-url-form-positive pass node scripts/check-lockfile-url-form.mjs

log "gate: lockfile url-form — NEGATIVE FIXTURE (a planted git@github.com: SSH URL must fail)"
capture lockfile-url-form-negative fail bash scripts/show-lockfile-url-form-negative.sh

log "gate: mint-path entropy — command_id mint paths draw from the OS CSPRNG, zero Math.random (must pass)"
capture mint-path-entropy-positive pass node scripts/check-mint-path-entropy.mjs

log "gate: mint-path entropy — NEGATIVE FIXTURE (a planted Math.random in a mint path must fail)"
capture mint-path-entropy-negative fail bash scripts/show-mint-path-entropy-negative.sh

log "gate: token-fidelity — built ui-tokens deep-equal docs/design/tokens.json, no ⏳ marker (must pass)"
capture token-fidelity-positive pass node scripts/check-token-fidelity.mjs

log "gate: token-fidelity — NEGATIVE FIXTURE (one designer value altered in a tmp copy must fail)"
capture token-fidelity-negative fail bash scripts/show-token-fidelity-negative.sh

log "gate: design-dimensions — 11 design-dimension tokens each equal their value AND warranted (doc-quote or computed) (must pass)"
capture design-dimensions-positive pass node scripts/check-design-dimensions.mjs

log "gate: design-dimensions — NEGATIVE FIXTURE (bad token value AND bad doc, both must be caught)"
capture design-dimensions-negative fail bash scripts/show-design-dimensions-negative.sh

log "gate: token-coverage — every ui-tokens export owned by exactly one gate (fidelity ∪ derived ∪ structural) (must pass)"
capture token-coverage-positive pass node scripts/check-token-coverage.mjs

log "gate: token-coverage — NEGATIVE FIXTURE (stray top-level export AND stray leaf, both must be caught)"
capture token-coverage-negative fail bash scripts/show-token-coverage-negative.sh

log "gate: icon-manifest — 26 icons match sha256, all currentColor, names == landmark.iconNames (must pass)"
capture icon-manifest pass node scripts/check-icon-manifest.mjs

log "gate: mock certification — the four reference adapters must certify 8/8 (§3, no partial passes)"
capture certification-positive pass node packages/certification/dist/run-self-certification.js

log "gate: mock certification — NEGATIVE FIXTURE (deficient mock, one behavior removed, must fail)"
capture certification-negative fail node packages/certification/dist/run-deficient-demo.js

log "gate: envelope conformance — NEGATIVE FIXTURE (missing correlation_id must fail)"
capture envelope-negative fail node packages/certification/dist/run-envelope-negative-demo.js

log "gate: 15-step chain runner — 15/15 with the nine-id chain + HTML dashboard seed (must pass)"
capture chain-positive pass node packages/certification/dist/run-chain.js --out "${EVIDENCE_DIR:-/tmp}/chain-report.html"

log "gate: 15-step chain runner — NEGATIVE FIXTURE (validation_id dropped, must fail)"
capture chain-negative fail node packages/certification/dist/run-broken-chain-demo.js

log "gate: order status — NEGATIVE FIXTURE (a sixth status string must refuse at parse)"
capture order-status-negative fail node scripts/show-order-status-negative.mjs

log "gate: supply projection — NEGATIVE FIXTURE (supplier identity/contact leak must refuse at parse)"
capture projection-negative fail node scripts/show-projection-negative.mjs

log "gate: delivery outcome — NEGATIVE FIXTURE (generic 'failed' must be unrepresentable — refuse at parse)"
capture delivery-outcome-negative fail node scripts/show-delivery-outcome-negative.mjs

log "gate: payment-leg status — NEGATIVE FIXTURE (a 'released' leg must refuse at parse)"
capture leg-status-negative fail node scripts/show-leg-status-negative.mjs

log "gate: fault class — NEGATIVE FIXTURE (a non-§5.6 faultClass must refuse at parse)"
capture fault-class-negative fail node scripts/show-fault-class-negative.mjs

log "gate: moderation decision — NEGATIVE FIXTURE (reasonless changes_requested + supplier actor + generic 'rejected' must refuse; valids parse)"
capture moderation-decision-negative fail node scripts/show-moderation-decision-negative.mjs

log "gate: payment operator — NEGATIVE FIXTURE (supplier + dispatcher + ops:moderation + empty-suffix authorizedBy must refuse; ops:payment:* issues)"
capture payment-operator-negative fail node scripts/show-payment-operator-negative.mjs

log "gate: trimmed strings — NEGATIVE FIXTURE (whitespace-only/untrimmed id/name/zone/category must refuse; a clean storefront parses)"
capture trimmed-string-negative fail node scripts/show-trimmed-string-negative.mjs

log "gate: reconciliation — NEGATIVE FIXTURE (independent-multiplication quote must not reconcile)"
capture reconciliation-negative fail node scripts/show-reconciliation-negative.mjs

log "gate: shape-freeze — NEGATIVE FIXTURE (tampered snapshot with kittingSealId on the Quote must fail)"
capture shape-freeze-negative fail node scripts/show-shape-freeze-negative.mjs

log "gate: secret-separation — NEGATIVE FIXTURE (substitution must not compile)"
capture secret-separation-negative fail node scripts/show-secret-separation-negative.mjs

if [ $FAILED -ne 0 ]; then
  echo ""
  echo "ONE OR MORE GATES DID NOT BEHAVE AS REQUIRED"
  exit 1
fi
echo ""
echo "ALL GATES GREEN (positive suites pass; every negative fixture demonstrably fails)"
