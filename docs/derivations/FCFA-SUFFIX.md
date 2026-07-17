# The money suffix is « FCFA » — derivation record (WO-FCFA, canon v1.0.1)

## The ruling
**Founder ruling (Beurni, 2026-07-15):** *the money suffix is « FCFA », not « F »:
everywhere across the ecosystem (boutik, sera, shop — every money figure).*

## Scope — every money figure in platform-contracts
"Every money figure" is taken literally: **every money-figure « F » suffix in
platform-contracts' rendered token, its shared strings, and its canon copy/spec
prose is now « FCFA ».** Two dev-facing illustration surfaces are deliberately
**excluded and listed below** (not silently skipped). A first pass changed only the
token + catalog and falsely claimed those were "the only two places"; the
fresh-context verifier caught it — this record supersedes that claim.

### CHANGED — the rendered suffix + shared strings
| file | what | note |
|---|---|---|
| `docs/design/tokens.grand-teint.json` · `money.currencySuffix` | `" F"` → `" FCFA"` | **U+202F narrow no-break space preserved**; only the letters change |
| `packages/ui-tokens/src/legacy/family.ts` · `money.currencySuffix` | `' F'` → `' FCFA'` (U+202F) | byte-mirror; fidelity gate deep-equals |
| `packages/i18n/catalog/catalog.json` — 4 §6.1 checkout strings | `{X}/{Y}/{D} F` → `FCFA` | canonical money strings (Ten Laws §6); regular space preserved |
| `docs/design/tokens.json` · `faso-premium.ts` — FP `type.$note` | `« 11 500 F »` → `« 11 500 FCFA »` | the money render-rule example |

### CHANGED — canon copy & spec prose (every money-figure « F » → « FCFA »)
Manifest-tracked canon docs (drift-mirrored to all three app repos), **re-synced**:
- `docs/Shop-Plus-Build-Spec.md` §6.1 — the four checkout strings (`X F`/`Y F`/`{D} F`)
  now match the catalog **exactly** (the verifier's blocking contradiction, resolved).
- `docs/ECOSYSTEM-MASTER-REFERENCE.md` — all money figures (quoted buyer/reseller/seller
  copy + eligibility thresholds + worked figures).
- `docs/Ecosystem-Engineering-Execution-Contract.md` — the §money-register example
  copy (« Vous payez X F … Y F » → FCFA).
- `docs/DESIGN-LANGUAGE.md`, `docs/GRAND-TEINT.md` — product-money prose figures.

**Five** manifest-tracked canon docs re-synced (the four above are the top-level
docs; the fifth is the copy deck's parents — Shop-Plus-Build-Spec, ECOSYSTEM-MASTER-
REFERENCE, Ecosystem-Engineering-Execution-Contract, DESIGN-LANGUAGE, GRAND-TEINT).

Design docs (not manifest-tracked) + the E1 exit report:
- `docs/design/copy.md` (the copy deck — money-format rule + every money CTA/line),
  `docs/design/components.md` (money-input **« FCFA » suffix** spec + the below-floor
  refusal string + seller hero), `docs/design/motion.md`, `docs/design/proposals.md`,
  `docs/design/flows.md`, `assembly/E1-EXIT.md`.

Diff is **71 money-swap insertions / 71 deletions** (docs + assembly, excluding this
derivation record) — balanced per-line swaps, every removed line carried a money-figure
`F`, every added line carries `FCFA`. No non-money `F` touched (grades, letters, hex,
section refs). *One collateral bug — `assembly/E1-EXIT.md` « 10 000 F CFA » → « FCFA CFA »
— was caught by the re-verifier and corrected to « 10 000 FCFA ».*

Tests updated to assert FCFA: `packages/ui-tokens/test/tokens.test.ts` (the token
suffix), and `packages/i18n/test/copy-lint.test.ts` — which now byte-asserts **all
four** changed §6.1 catalog money strings (`pay_now_line`, `pay_at_delivery_line`,
`option_b.body`, `replay_line`), not three; each guard fails on a « F » regression
(non-vacuous).

### EXCLUDED — deliberately, with reasoning (NOT a silent miss; CTO-overridable)
Two dev-facing surfaces keep « F »; they are illustration/record, not user-facing money:
1. **Code comments illustrating the reconciliation math** — `packages/contracts/test/
   money.test.ts` (3: « …19 F stays with the seller », « 1 F drift », « 100 F
   invented ») and `scripts/show-reconciliation-negative.mjs` (1: « …loses 1 F »).
   Developer-facing, same class as the `money/*` "integer FCFA" model comments the WO
   says to leave. Not a rendered figure.
2. **`docs/derivations/MASTER-REFERENCE-AUDIT.md`** — 11 figures inside a **historical
   audit-of-record** (WO-0F). Its quotes reflect what the MR said at audit time;
   rewriting them would falsify the record. A derivation doc, not canon, not
   manifest-tracked, not user-facing.

3. **Engineering-record class** — money « F » also survives in historical dev-facing
   records that are not product surfaces and whose past text should not be rewritten:
   `JOURNAL.md` (past WO entries), the `_review/WO-*/` archive copies, and
   `WORK-ORDERS/WO-0.md` (old §6.1 quotes). Same class as the audit record above.

If the founder means *literally every* occurrence (including code comments, the audit,
and these engineering records), say so and I sweep them all.

## DERIVE-OR-STOP — the formatters
platform-contracts has **no** `formatFcfa`/`renderAmount`/money-formatter (grep clean);
the suffix here is pure token/catalog/copy data — nothing to STOP on. The per-app money
formatters live in the app repos (`boutik-plus`, `shop-plus`, `sera`, the PWA cliente
surface) — out of this repo's scope. Each FP/GT app lane MUST, at its re-pin:
1. confirm its money formatter reads `money.currencySuffix` (not a hardcoded `' F'`);
2. note that **Faso Premium (the ui-tokens root) has NO `money` group** — FP-adopting
   apps resolve the suffix from `@platform/ui-tokens/legacy` (Grand Teint, now « FCFA »)
   or an app-local constant. A later slice may promote `money` into Faso Premium.

## Version & snapshot delta (named)
Token/catalog/copy **value** change, no API/shape/key move → **PATCH**, lockstep:
all six package.json + intra-deps + `run-gates --pinned-version` + `docs.manifest`
(both) + api-surface snapshot packageVersion → **1.0.1**; lockfile re-resolved.
- **api-surface snapshot:** `packageVersion 1.0.0 → 1.0.1` **ONLY** — `exports`+`schemas`
  byte-identical (no contracts shape moved).
- **docs.manifest:** packageVersion **and the five** re-synced canon-doc hashes
  (Shop-Plus-Build-Spec, ECOSYSTEM-MASTER-REFERENCE, Ecosystem-Engineering-Execution-
  Contract, DESIGN-LANGUAGE, GRAND-TEINT); the drift-check re-mirrors them to the app repos.
- **ui-tokens surface:** `money.currencySuffix` value + the FP `type.$note`; **no
  export/key added or removed**.
