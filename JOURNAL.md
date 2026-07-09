# JOURNAL — platform-contracts
Continuity ledger per CTO charter §6/§6bis. Every entry is evidence-grounded.

Format per entry:
## <date> · <slice/WO id> · <status: in-progress | in-review | done | blocked-on-founder>
- What was done (with the tool result / test output that proves it)
- Decisions made · safest-defaults applied on open ⏳ (flagged) · founder overrides
- Pending / next

---

## 2026-07-09 · E0 bootstrap · done
- Arranged the founder-supplied kickoff set: `e0-kickoff/docs/` → `/docs` (7 canon documents), `CLAUDE.md`/`AGENTS.md`/`JOURNAL.md` → repo root, four work orders → `/WORK-ORDERS/`, `e0-kickoff/` (incl. its README) deleted. Commit `f72dba5` "chore(e0): bootstrap canon, charter, work orders", pushed to `main`.
- Canon completeness check: Execution Contract + 3 Build Specs + 3 Building Plans all present in `/docs`. North Stars + prototype not yet supplied — expected per WO-0 §B6 ("…when the founder supplies them"); the manifest covers the seven present documents.

## 2026-07-09 · Founder Decision — RoundingLaw v1 · CLOSED ✅
- **Ruling (founder, 2026-07-09):** RoundingLaw v1 CONFIRMED; the WO-0 §B2 ⏳ and its PENDING_FOUNDER_DECISION block are lifted. The law: `sellerPlatformFee = floor(0.05 × B)` · `resellerPlatformFee = floor(0.20 × (C + M))` · `sellerNet = B − C − sellerPlatformFee` · `resellerNet = (C + M) − resellerPlatformFee` · `platformProductFeeRevenue = sellerPlatformFee + resellerPlatformFee`. All Quote money fields integer FCFA; rounding exists ONLY on the two fees; nets are defined by subtraction, never independent multiplications.
- Applied as the single named module `packages/contracts/src/money/rounding-law.ts` (`ROUNDING_LAW_VERSION = 'v1'`) — no marker, no skipped tests. Fees computed in exact integer arithmetic (no floating-point money).
- Suite contains, all passing: the reconciliation property tests (fast-check, 2,000 runs each, both identities exact ∀ integer FCFA inputs in realistic ranges) · the §5.4 worked baseline asserted literally (10,000/1,000/1,500/1,000 → 11,500 · 12,500 · 8,500 · 2,000 · 1,000) · the founder's fixed non-divisible regression asserted exactly (B=10,001 · C=333 · M=778 · D=600 → fees 500 · 222, sellerNet 9,168, resellerNet 889, platform 722, productSubtotal 10,779, buyerTotal 11,379).

## 2026-07-09 · WO-0 · in-review (built + verified; tag/merge reserved to the founder's reviewer)
- **Built on branch `e0/wo-0`**, small conventional commits:
  - B1: pnpm + Turborepo + TypeScript-strict workspace; packages `@platform/contracts` · `@platform/kernel-types` · `@platform/i18n` · `@platform/ui-tokens`, all versioned 0.1.0.
  - B2: E1-critical §5.6 shapes as TS types + zod strict schemas (frozen Quote verbatim — `supplyMode`/`handlingClass`/`kittingSealId` are a tested parse failure on the Quote); four secrets as branded, non-assignable types; pure money functions (`computeWaterfall`, `assertQuoteReconciles`, RoundingLaw v1); byte-stable canonical JSON; event envelope + E1 event-name union with all `packlab.*`/`cercle.*`/`campaign.*`/`referral.*`/`review.*` names excluded.
  - B3: kernel types (phone-alias identity, no-address Location — rejects `streetAddress`, offline queued-=-pending semantics, media refs). Types + schemas only, no services.
  - B4: i18n catalog schema (`register` + `screenClass` on every entry), copy-lint CLI implementing exactly the four §10.5 failure conditions with token lists/budgets as maintained data files; seed catalog = the eight canonical Shop+ §6.1 checkout strings (register: money); negative fixture catalog.
  - B5: ui-tokens — color/type/spacing/radius/elevation/motion, one family DNA, three themes (`boutik-plus` supply-green · `shop-plus` warm commerce · `sera` road-and-custody), shared verified-badge color; tokens only, no components.
  - B6: `docs.manifest.json` (sha256 × 7 docs + packageVersion 0.1.0, root + package copy) + `drift-check` CLI shipped in `@platform/contracts`.
  - B7: CI workflow `.github/workflows/ci.yml` + `scripts/run-gates.sh`.
- **Evidence (tool outputs in this session; copies in `_review/WO-0-review.zip` → `logs/`):**
  - `pnpm build` 4/4 green · `pnpm typecheck` 5/5 green (incl. secret-separation type tests) · **60/60 tests passing** with assertions visible (verbose output captured).
  - Every gate shown failing once on its negative fixture: copy-lint fixture with « Veuillez patienter » + « séquestre » fails with all four conditions reported (exit 1) · tampered consumer doc fails drift-check (exit 1) · pristine copy passes · secret-substitution fixture fails tsc (TS2322 both ways) · independent-multiplication quote throws QuoteReconciliationError (10,778 ≠ 10,779) · tampered snapshot (kittingSealId on Quote) fails shape-freeze.
- **Safest defaults applied (maintained data, not canon):** copy-lint token lists (administrative-formal set beyond the canonical six; marketing/urgency; finance jargon; Mooré/Dioula) and reading-level budgets are data files seeded so the canonical §6.1 strings pass; screen-class list is a lint parameter. All tunable without code changes.
- **Canon nit surfaced to the founder (no action taken):** `EvidenceBundle` carries `coarseLocation` in the Séra spec §5.6 but not in Boutik+/Shop+ §5.6 — modeled as optional here; the specs should be reconciled at source.
- **Founder overrides recorded:** WO-0 §B8/DoD calls for the `v0.1.0` git tag, but the founder's session instruction reserves tagging and merging to his reviewer — versions are set to 0.1.0 and the tag is intentionally NOT created. Ecosystem-Engineering session ruling: RoundingLaw v1 confirmed (see Decision entry above), so the §B2 PENDING_FOUNDER_DECISION path was never entered.
- **Fresh-context verifier (mandatory for money/contracts paths, charter §6bis): VERDICT PASS, zero blocking findings.** The verifier — given only the SPEC AUTHORITY quotes, the founder RoundingLaw ruling, the full `main...e0/wo-0` diff, and the DoD — independently re-ran build/typecheck/tests/gates with caches bypassed (60/60 at the time, 0 skipped), read the actual assertions, confirmed the frozen Quote is field-exact §5.6 with gated fields a tested parse failure, confirmed no float money and no independent-multiplication nets anywhere in src, confirmed the event union carries zero gated names, and confirmed nothing OUT-OF-SCOPE was built. Findings: 1 NON-BLOCKING (a same-version snapshot regeneration would pass CI — freeze-with-version-bump was convention, not machine) + 7 NOTEs.
- **Fixes applied after the verdict (commit `5a5c191`), re-verified:** (1) new CI gate `scripts/check-snapshot-version-bump.sh` — a changed API-surface snapshot without a `@platform/contracts` version bump now fails CI (initial addition allowed); demonstrated failing once on a tampered snapshot (exit 1, output in evidence). (2) copy-lint condition (b) now scans `moore`/`dioula` variant texts, not only `fr` (+ regression test). (3) gate runner uses `mktemp` for the drift-consumer fixture (no fixed /tmp path). Post-fix full re-run: build green, gates ALL GREEN, **61/61 tests passing** (verbose output in evidence).
- **Pending / next:** founder's reviewer verdict on `e0/wo-0` (merge + tag `v0.1.0`); then WO-B0.1 / WO-SP0.1 / WO-SE0.1 pin the tag.
