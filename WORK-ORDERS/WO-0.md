> Part of the E0 work-order set (master: E0-Work-Orders.md). Sequence: WO-0 first; the three app WOs pin its v0.1.0 tag. Canon: /docs in this repo (Annex A already applied). Nothing gated; sandbox only.

## WORK ORDER — WO-0 · `platform-contracts` v0.1.0 (founder-directed E0 slice; precedes all app slices)

### SPEC AUTHORITY (quoted)
- **Execution Contract E0, repo topology (founder decision, locked):** *"three separate app repos — `boutik-plus`, `shop-plus`, `sera` — each a per-app workspace and its own deployable, plus a fourth shared repo `platform-contracts` holding `contracts/` (shapes + events), `kernel` types, the i18n string catalog + French Voice copy-lint, and the `ui` design tokens. The apps consume `platform-contracts` as a pinned, versioned package; '§5 identical across all three specs' is thereby enforced by construction, with a CI drift-check in every app repo that fails on any divergence from the pinned canon version. Canonical `/docs` live in `platform-contracts`; each app repo carries a CI-drift-checked copy."*
- **Execution Contract §3:** *"Canonical shapes live only in `contracts/`; no app redefines them (CI-enforced). Events carry versioned envelopes (`command_id`, `correlation_id`, aggregate version, actor, server time)."*
- **Execution Contract §2.2:** *"'frozen-enough' = changes only by deliberate version bump propagated to all consumers; 'stable (thin)' = the minimal fields E1 needs are fixed, richer fields may still be added by version bump."*
- **Founder ruling (2026-07-08, recorded):** canonical Quote = the Boutik+/Shop+ §5.6 shape, keeping `campaignId?`/`campaignBenefit?`; **`supplyMode`/`handlingClass`/`kittingSealId` never appear on the Quote** (kitting seal cannot exist at quote time — canon defect, corrected at source in Séra spec L69 + §6.7); those fields enter `contracts/` only by deliberate version bump behind the B+9 gate.
- **Boutik+/Shop+ Spec §5.4 (identical):** the waterfall — `productSubtotal = B + M` · `buyerTotal = B + M + D` · `sellerPlatformFee = 0.05 × B` · `sellerNet = B − C − sellerPlatformFee` · `resellerGrossEarnings = C + M` · `resellerPlatformFee = 0.20 × (C + M)` · `resellerNet = 0.80 × (C + M)` · `platformProductFeeRevenue = 0.05B + 0.20(C+M)`. **Reconciliation invariant (CI):** *"`productSubtotal == sellerNet + resellerNet + platformProductFeeRevenue` AND `buyerTotal == productSubtotal + D`. Delivery is OUTSIDE both fee bases."* Worked baseline: B 10,000 · C 1,000 · M 1,500 · D 1,000 → subtotal 11,500 · buyerTotal 12,500 · sellerNet 8,500 · resellerNet 2,000 · platform 1,000.
- **Canonical Quote (Boutik+ Spec §5.6, verbatim — the frozen shape):**
  ```
  Quote { id, attributionResellerId(LOCKED), paymentMode, sellerBasePrice, sellerFundedCommission, resellerMarkup,
          productSubtotal, deliveryFee, buyerTotal, amountPaidAtCheckout, amountDueAtDelivery,
          sellerPlatformFee, sellerNet, resellerGrossEarnings, resellerPlatformFee, resellerNet,
          platformProductFeeRevenue, paymentProcessingFeeEstimate, taxFields,
          campaignId?, campaignBenefit?{ type, customerShare, campaignShare },
          policyVersions{settlementPolicyVersion, inspectionPolicyVersion}, expiry }        // IMMUTABLE, reconciles
  ```
- **Four secrets (§5.6, all specs):** *"`sellerReadinessChallenge` (short-TTL, in-app, seller↔readiness) · `pickupVerificationCode` (rider↔pickup) · `buyerDropCode` (buyer↔delivery, private — never shown to the seller or in readiness evidence) · `HandoffAuthorization` (payment-confirmed handoff)"* — CI-enforced separation.
- **Execution Contract §10.5 (CI-checkable form):** copy-lint over the i18n catalog fails the build on: *(a)* banned-register tokens in customer copy (`séquestre`, `escrow`, `veuillez`, `nonobstant`, `ci-après`, `susmentionné`, + maintained administrative-formal list); *(b)* register-mismatch (money-tagged string containing marketing/urgency tokens; selling-tagged string containing ledger/finance jargon); *(c)* reading-level budget exceeded (max sentence length / syllable heuristic per screen class); *(d)* a Mooré/Dioula token in a `register: money` or `class: instruction` string. Every entry carries `register (money|selling|neutral)` + a screen class.
- **CTO charter §5:** design tokens — *"color, type scale, spacing, radius, elevation, motion"* — three app themes on one family DNA: Boutik+ grounded supply-green confidence · Shop+ warm commerce energy · Séra road-and-custody clarity.

### READ FIRST
The full canon set in `/docs` (this repo hosts it — commit it in this slice from the founder-supplied set). Before writing any code, the agent states back in its own words: the two reconciliation identities · the exact canonical Quote field list · the four secrets and their separation rule · the four copy-lint failure conditions. A statement that misdescribes any of these is a rejected start.

### BUILD
**B1. Repo + workspace.** New repo `platform-contracts` (kebab-case slug, exactly). pnpm + Turborepo, TypeScript strict. Packages: `@platform/contracts` · `@platform/kernel-types` · `@platform/i18n` · `@platform/ui-tokens`.

**B2. `@platform/contracts` — shapes, money, secrets, events.**
- TypeScript types + zod runtime schemas for the **E1-critical §5.6 set**: `User`, `Location`, `Product/Version` (with `supplyMode(SELLER_HELD|PLATFORM_OWNED)` + `handlingClass?` exactly as the spec writes them — fields are canon; PLATFORM_OWNED *behavior* stays gated), `Variant`, `ProductAssets`, `SupplierOffer`, `CommissionAgreement`, `ResellerListing`, `Storefront`, `AttributionToken`, `Quote` (the frozen shape above — **no** `supplyMode`/`handlingClass`/`kittingSealId`), `Order`, `DeliveryFeeQuote`, `Package/Seal`, `PackageReadinessConfirmation`, `PickupTask`/`DeliveryTask`, `AssignmentLease`, `RouteManifest`, `PickupVerification`, `InspectionPolicy`, `InspectionSession`, `CustodyRecord`, `EvidenceBundle`, `HandoffAuthorization`, `ValidationDecision`, `SettlementObligation`, `EscrowTxn` (with `paymentLegs[]`), `ProtectionFund`, `ProtectionClaim`, `CustodyLiabilityClaim`, `SellerTrustState`, `PayAtDoorEligibility`, `DeliveryCost`.
- **Four secrets as distinct branded types** — not mutually assignable, not aliasable to plain string in public APIs.
- **Pure money functions (no services):** `computeWaterfall(B, C, M, D, paymentMode)` → every derived Quote money field per §5.4/§5.5 (FULL_PREPAY: `amountPaidAtCheckout = buyerTotal`, `amountDueAtDelivery = 0`; Option B: `amountPaidAtCheckout = D`, `amountDueAtDelivery = productSubtotal`); `assertQuoteReconciles(quote)` → both identities exact to the franc; byte-stable canonical JSON serialization for Quote/Order snapshots.
- **⏳ RoundingLaw v1 — BLOCKED ON FOUNDER, implement only after his ✅ (spec silence on money; §7 trigger, surfaced in the accompanying report).** Recommended construction: fees are the only rounded quantities — `sellerPlatformFee = floor(0.05 × B)`, `resellerPlatformFee = floor(0.20 × (C + M))` — and the nets are defined **by subtraction**: `sellerNet = B − C − sellerPlatformFee`, `resellerNet = (C + M) − resellerPlatformFee`. The reconciliation identity then holds **algebraically for every integer FCFA input**: `(B − C − f₁) + ((C+M) − f₂) + (f₁ + f₂) = B + M`. `floor` means the fraction of a franc always stays with the participant, never the platform. Encode as one named constant module (`RoundingLaw.v1`) so a founder change touches one place.
- **Event registry:** envelope type `{ command_id, correlation_id, aggregateVersion, actor, serverTime, version }` + the E1-relevant union of §5.7 event names from all three specs (supplier/seller/media/catalog/offer/inventory/checkout/payment/fulfillment/pickup/custody/handoff/delivery/settlement/payout/protection/goodwill + Séra courier/shift/vehicle/logistics/assignment/route/return/package/custody_liability/safety/incident + Shop+ reseller/storefront/commission_agreement/listing/attribution/marketing_asset/order/commission/reputation/buyer-eligibility). **Excluded (gated, version-bump only):** all `packlab.*`, `cercle.*`, `campaign.*`, `referral.*`, `review.*` names.

**B3. `@platform/kernel-types`.** `Location {pin, zone, landmark, directions, maskedRelay}` · phone-alias identity types (phone is an alias, never the key) · offline-queue status semantics (`queued = pending`, never done/final) · media reference types. Types only — no runtime services, no network code.

**B4. `@platform/i18n` — catalog + copy-lint.** Catalog entry schema: `{ key, fr, register: money|selling|neutral, screenClass, moore?, dioula?, audioScriptRef? }`. Copy-lint CLI implementing §10.5's four failure conditions exactly (token lists as maintained data files, not hardcoded regexes). **Seed the catalog** with the canonical checkout strings already written in Shop+ Spec §6.1 (« À payer maintenant : X F » / « À payer à la livraison : Y F », the Option A/B copy, the replay line « Vous payez X F maintenant et Y F à la livraison — d'accord ? », the non-refundable-fee warning), tagged `register: money` with correct screen classes.

**B5. `@platform/ui-tokens`.** Color, type scale, spacing, radius, elevation, motion — one family DNA, three themes (`boutik-plus`, `shop-plus`, `sera`) per CTO charter §5. **Tokens only at v0.1.0; no components.**

**B6. `/docs` + drift-check.** Commit the canon doc set (the eight documents + North Stars and prototype when the founder supplies them). Generate `docs.manifest.json` (sha256 per doc + package version). Ship a `drift-check` CLI: given a consumer repo's `/docs` copy + its pinned package version, exit non-zero on any divergence from the manifest. This CLI is what the three app repos call in CI.

**B7. CI (from the first PR of this repo).** typecheck · unit tests · **reconciliation property tests** (fast-check: ∀ integer FCFA `B, C, M, D` in realistic ranges, both identities hold exactly; the worked baseline asserted literally: 10,000/1,000/1,500/1,000 → 11,500/12,500/8,500/2,000/1,000) · **shape-freeze** (public API + schema snapshot; any change fails CI unless the snapshot is deliberately updated in the same PR as a version bump) · **copy-lint** on the seed catalog **plus a negative fixture** (a fixture catalog containing « Veuillez patienter » and « séquestre » in customer copy MUST fail the lint — commit the failing output as a test assertion) · **secret-separation test** (branded types not assignable to each other; enforced by a type-level test) · **no-gated-shapes check** (public API exports none of `PackProduct`, `PackComponent`, `KittingJob`, `PackLabCeilings`, `RestockDecision`, Cercle records, or gated event names).

**B8. Version + publish.** Semver, git tag `v0.1.0`. Consumers pin the tag (git-tag dependency; no registry account required — migration to a registry later, by Decision, non-blocking).

### OUT OF SCOPE (explicit)
Services, order state machines, Durable Objects, persistence, network code — this repo is shapes + pure functions + lint + tokens + docs. All gated objects/events. Any app code. UI components. Real provider anything.

### DoD (binary)
Repo builds clean · every B7 suite green with visible assertions · the negative lint fixture demonstrably fails (output attached) · shape snapshot committed · `v0.1.0` tag exists · `/docs` + manifest committed · `drift-check` demonstrated against a sample consumer fixture (one passing run, one tampered-doc failing run) · RoundingLaw: implemented only if founder-confirmed; otherwise the money-function module carries a compile-visible `PENDING_FOUNDER_DECISION` marker and the property tests for it are skipped-with-reason, never silently green.

### CI GATES THAT MUST STAY GREEN
Reconciliation property (incl. baseline) · shape-freeze · copy-lint (positive + negative fixture) · secret-type separation · no-gated-shapes · typecheck.

### EVIDENCE REQUIRED
Full test output with assertions visible (not just counts) · the negative-fixture lint failure output · the shape-snapshot file path · the tag ref · `tree` of the workspace · both drift-check runs (pass + tampered fail).

### FORBIDDEN (the nearest tempting shortcuts — by name)
- Implementing an order state machine, reservation logic, or any Durable Object "while we're here."
- Adding gated shapes/events "since they're in §5.6 anyway" — they enter by version bump behind their gates, per founder ruling.
- Putting `supplyMode`/`handlingClass`/`kittingSealId` on the Quote in any form.
- Defining `resellerNet`/`sellerNet` as independent multiplications (`0.80 × …`) instead of the subtraction construction — it breaks franc-exact reconciliation on non-divisible inputs.
- Implementing the RoundingLaw before the founder's ✅.
- A copy-lint that only checks "the string is French" — a lint without the register/reading-level/banned-token rules is a gate that asserts nothing.
- Inventing values for any open ⏳ Decision (aggregator, fund capital, ceilings, thresholds).
- Publishing to a public npm registry.
