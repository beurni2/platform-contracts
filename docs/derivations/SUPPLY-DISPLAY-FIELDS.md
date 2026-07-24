# Supply display fields — derivation record (SUPPLY-DISPLAY-FIELDS-1, canon v2.0.0)

**Founder ruling (§7 canon change):** carry buyer-display data (product name + images)
on the EXISTING boutik→shop supply wire (`SupplyProjectionSchema`) rather than
building a second display read-model. Reason accepted: neither wire is deployed
(both sides are consumer + certified mock; the transport/auth convention is unbuilt),
so proving one wire beats building two. A second read-model stays available later.

## 1. The two fields (both REQUIRED, `.strict()` preserved)

| field | schema | grounding |
|---|---|---|
| `productName` | `TrimmedNonEmptyString` | the WO-5.14 **name-class**, identical to `ProductVersionSchema.name` (`commerce.ts:38`) |
| `assetRefs` | `z.array(AssetRefSchema)` → infers `string[]` | matches `CustomerProductView.assetRefs` = `readonly string[]` (shop-plus `storefront-service/src/customer-projection.ts:23`) — **zero transformation** on the shop side |

**Required, not optional (item 2).** Optional display fields reproduce the exact
partial-state — economics without a name — that argued against the second wire.
Since nothing is deployed and shop's consumer is a certified mock, this is the
cheapest moment. `assetRefs` is a **required array that MAY be empty** (`[]`): a
product mid-capture has no images yet; the field is always present and typed, which
is not the partial-state problem (the value is a typed empty list, not a missing key).

## 2. `AssetRefSchema` — the item-4 rule, made first-class without inventing

`export const AssetRefSchema = z.string().min(1)` — a NAMED, api-surface-frozen
contract type, deliberately a **bare string**, not the rich `MediaRefSchema`
(`{ref, sha256, mimeType}`, kernel-types `media.ts:9`) used internally by
`ProductAssets` (`commerce.ts:64`). "No AssetRef shape exists in canon" (the WO) is
true for a *display* ref; `MediaRefSchema` is a different, integrity-bearing internal
descriptor and does not fit `readonly string[]`. So a distinct bare `AssetRefSchema`
is warranted — proposed, per the WO's "propose rather than invent."

**The rule, stated first-class:** an asset reference MUST NEVER encode supplier
identity — opaque, or `productVersionId`-keyed, only. This lives on the type
(name + contract doc), and is the canonical home of the rule.

**Why canon cannot VALUE-enforce it (reported gap, item 4).** The key-based
`sweepIdentityKeys` (boutik `offer-service/src/supply-endpoint.ts:79`) tests key
NAMES against the identity regex — a supplier id embedded in an assetRef *value*
(`https://media/suppliers/sup_123/cover.jpg`) sails straight past. Canon cannot
close that here: `SupplyProjection` deliberately never carries `supplierId`, and
`supplierId` is an unformatted `IdSchema` = `TrimmedNonEmptyString` (**no canon
supplier-id pattern to match**) — so a value refine on `AssetRefSchema` would have to
INVENT a pattern (§7). The enforcement must live where `supplierId` IS known: the
producer's out-guard (`assertServableValue` / `sweepIdentityKeys`, boutik
`supply-endpoint.ts`), which holds `ProductVersion.supplierId` and derives the refs
from `ProductAssets` `MediaRef.ref` storage keys. **Canon writes the rule; the
producer enforces it.** A test (`shapes.test.ts`) makes this boundary a visible fact:
a supplier-keyed URL PARSES against `AssetRefSchema` (not an endorsement — the
producer must reject it). **APPS action:** add a value-side URL check to the sweep.

## 3. Bump level — MAJOR (item 2)

Adding REQUIRED fields to a `.strict()` shape is **breaking**: a 1.2.0-era 5-field
payload now fails the 2.0.0 parse, and vice versa. Per this repo's demonstrated
convention (WO-FP-0's breaking palette change was 0.9.10 → **1.0.0** MAJOR) and
semver, and Execution Contract §2.2 ("frozen-enough = changes only by deliberate
version bump propagated to all consumers"), the bump is **MAJOR: 1.2.0 → 2.0.0**,
lockstep (six package.json + intra-deps + `run-gates --pinned-version` ×2 + both
`docs.manifest.json` packageVersion-only, 11 doc hashes stable + api-surface
packageVersion; lockfile re-resolved). **api-surface delta:** +1 export
`AssetRefSchema` (zod-schema) · +1 schema `AssetRefSchema` · `SupplyProjectionSchema`
CHANGED (+`productName`, +`assetRefs`; `required` 5 → 7) · 0 removed.

## 4. Migration plan (item 3 — not mine to perform; mine to specify)

`SupplyProjection` is **produced** by boutik `offer-service` and **consumed** by shop
`packages/supply-consumer` (5 src + 2 tests). The MAJOR bump must migrate both, or the
skew is named:

- **OZ1 / boutik `offer-service`:** on re-pin to 2.0.0, `buildSupplyProjection` must
  populate `productName` (from `ProductVersion.name`) and `assetRefs` (from
  `ProductAssets` display `MediaRef.ref` keys), AND add the value-side URL check to
  `sweepIdentityKeys` / `assertServableValue` (item 4).
- **APPS / shop `packages/supply-consumer`:** on re-pin to 2.0.0, pass `productName` +
  `assetRefs` through to `CustomerProductView` (zero transformation on `assetRefs`);
  update the two tests' fixtures to the 7-field shape.
- **Skew, named and time-boxed:** between the canon 2.0.0 merge and the two app
  re-pins, neither app is on 2.0.0 — they stay pinned to 1.2.0 until they migrate
  **together in one cycle**. No runtime skew exists (nothing deployed; both sides are
  consumer + certified mock), so this is a build-time pin coordination only. A boutik
  producer on 2.0.0 serving to a shop consumer on 1.2.0 (or vice-versa) would fail the
  strict parse — so the two re-pins land together, not staggered.
- **In-repo, not gated:** `assembly/` (the E1 harness, not a workspace package, imports
  `@boutik/offer-service`) constructs supply projections via `buildSupplyProjection`; it
  is not part of platform-contracts CI but will need the two fields when next run —
  noted for the assembly refresh.

## 5. Open decisions — JOURNALED, NOT resolved (item 5)

- **OD-SDF-1 (version rename / photo swap migration):** `ProductVersionSchema` carries
  an explicit `version` int, so a rename or photo swap mints a NEW product version;
  existing offers/listings keep pointing at the OLD version and nothing migrates them.
  **Do resellers who already listed the previous version stay on it deliberately, or is
  there a notify-and-migrate path?** Not blocking, does not gate this slice. Founder's.
- **OD-SDF-2 (product-version immutability):** the `version` int makes the intent
  unambiguous, but **nothing enforces that a given product version's fields never mutate
  in place.** A zod schema validates shape, not mutation-over-time, so this is a
  store/service invariant, not a schema one — canon cannot enforce it in
  `ProductVersionSchema`. **Recommendation:** state product-version immutability as a
  named invariant in the Boutik+ Build-Spec (B+I-*), enforced at the producer's write
  path. Founder's call whether to add it; flagged, not resolved.

## 6. Other gaps reported (not filled)

- **`category` still unsourced.** The WO named `CustomerProductView.productName`,
  `category`, and `assetRefs` as all lacking a source, but scoped this slice ("-1") to
  name + images. `category` remains unsourced on the supply wire after this slice — a
  deliberate remaining gap for a follow-up, not filled here.
- **`assetRefs` min-length.** Left as "required, may be empty" (no `.min(1)` on the
  array). If the buyer surface must never render a product with zero images, that is a
  product rule the WO did not state — flagged, not invented.
- **Two asset representations now coexist:** rich internal `MediaRefSchema` (integrity)
  vs bare display `AssetRefSchema`. Intended (display refs derive from `MediaRef.ref`);
  noted so it is a deliberate decision, not drift.
