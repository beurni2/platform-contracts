# The whitespace tightening — derivation record (WO-5.14, canon v0.9.10)

## The ruling
**Founder ruling (Beurni, 2026-07-15):** *"whitespace-only strings are invalid on
Id-class and name-class fields: canon enforces trimmed non-empty."*

This closes open question **Q1** (IdSchema whitespace, GP-CANON), which had gained a
second witness in the storefront `name` (WO-5.13 verifier note N1).

## The rule, and the reading I chose (flagged)
The canonical primitive is **`TrimmedNonEmptyString`**, defined in
**`@platform/kernel-types`** (`packages/kernel-types/src/strings.ts`) — the base
package that BOTH the kernel-types shapes and the `@platform/contracts` shapes consume
(contracts depends on kernel-types, never the reverse), so the primitive must live in
the base to be a single source of truth. `@platform/contracts` re-exports it from
`shapes/common.ts` (so `IdSchema = TrimmedNonEmptyString` and consumers keep importing
it from contracts):

```
const TRIMMED_NON_EMPTY = /^\S([\s\S]*\S)?$/;
export const TrimmedNonEmptyString = z.string().min(1).regex(TRIMMED_NON_EMPTY, { … });
// contracts/src/shapes/common.ts: import + re-export + `export const IdSchema = TrimmedNonEmptyString;`
```

**Reading:** "trimmed non-empty" is read as **the value must equal its trimmed form
and be non-empty** — i.e. no leading/trailing whitespace, at least one non-whitespace
char, internal whitespace preserved. So it refuses BOTH whitespace-only (`" "`, `"\t"`,
`""`) AND surrounding-whitespace-with-content (`" x"`, `"x "`). Internal whitespace is
kept (`"Rood Woko, Ouagadougou"`, `"Chez Aïcha"`, `"a\nb"` all pass).

**FLAG (§7 — the stricter of two readings, chosen and disclosed):** the ruling's
literal target is "whitespace-only." I encoded the stricter "trimmed" reading because
(a) "canon enforces **trimmed**" most naturally means the value carries no surrounding
whitespace, (b) for Id-class keys an untrimmed `" abc"` ≠ `"abc"` is a latent
correlation/idempotency bug, and (c) the breakage audit (below) proved **zero**
surrounding-whitespace values exist anywhere, so the stricter rule breaks nothing. If
the founder meant only whitespace-only invalid (accept `" x"`), relax the regex to
`/\S/` (contains-a-non-space). Recorded, not assumed.

**Encoding — regex, not `.refine`:** `z.toJSONSchema` drops a `.refine` (it is
JSON-Schema-unrepresentable), so a refine would tighten behavior but NOT drift-lock in
the shape-freeze snapshot. A `.regex()` maps to JSON-Schema `pattern` (as WO-5.12's
`ops:payment` rule did), so the trim rule is **drift-locked**: any future removal on
any id/name/display field fails shape-freeze.

## Breakage audit (done FIRST, per the WO) — PROVED ZERO, both directions
Grepped every consumer repo's fixtures/tests (`platform-contracts`, `boutik-plus`,
`shop-plus`, `sera`; excluding `node_modules`/`dist`/`.turbo`/lockfiles):
- **whitespace-only values** (`: " "`, `: '\t'`, escaped-whitespace literals): **0**.
- **surrounding-whitespace values** (a quoted value with a leading or trailing space):
  **0**.
- The existing fixtures use clean ids/names with only internal spaces
  (`"q_001"`, `"Chez Aïcha"`, `"Rood Woko, Ouagadougou"`, `"Ouaga 2000"`) — all pass.

No whitespace-only or untrimmed value exists on these fields in any repo → **no STOP
raised**; the tightening changes no existing fixture. (Confirmed live: the full
contracts suite stays green except the deliberately-regenerated shape-freeze snapshot;
105/106 before regen, 0 fixture breakage.)

## Per-field disposition (every `z.string().min(1)` string field — `@platform/contracts/src` AND `@platform/kernel-types/src`)

> **Audit scope note (WO-5.14 fix):** the first draft audited only `contracts/src` and
> silently skipped `kernel-types/src`, leaving `UserId`/`Location.zone`/`landmark`
> untightened while their `Storefront`/`ProductVersion` twins were tightened — a
> caught defect. The table below now covers **both** packages.

### TIGHTENED to `TrimmedNonEmptyString`
| Class | Field(s) | Why |
|---|---|---|
| **id-class (contracts)** | `IdSchema` (`common.ts`) → **every** `IdSchema`-typed field across all shapes (id, resellerId, supplierId, quoteId, taskId, orderId, curatedItems[], eligibleVariants[], refId, escrowRef, reservationRef, buyerPhoneRef, payoutInstrumentRef, …) | the ruling names Id-class; one edit to the base propagates |
| **id/identity-class (kernel-types)** | `UserIdSchema` (`identity.ts`, id-class) · `PhoneAliasSchema` (`identity.ts`, the identity handle — "phone is an alias") | the ruling names Id-class; these are the kernel identity strings. **NOTE:** both brand via `.transform`, so `z.toJSONSchema` projects them as `{}` (opaque) — they were already `{}`. The tightening is therefore **behaviour-locked by the negative fixture / unit tests** (User.id + phoneAlias.alias refuse `" "`/`" u"`), not by the snapshot pattern |
| **name-class** | `ProductVersion.name` (`commerce.ts:39`) · `Storefront.name` (`:139`, keeps `.max(120)`) | the ruling names name-class; storefront name is the WO's exemplar |
| **display strings** *(conscious ruling — see below)* | `ProductVersion.zone` (`:43`) · `ProductVersion.category` (`:42`) · `Storefront.zone` (`:140`) · `Storefront.category` (`:141`) · `DeliveryFeeQuote.zoneFrom` (`:213`) · `DeliveryFeeQuote.zoneTo` (`:214`) · `SupplierOffer.zones[]` (`:87`) · **`Location.zone` (`kernel-types/location.ts:11`) · `Location.landmark` (`:12`)** | a whitespace-only display label is meaningless in every one; `Location.zone` is the delivery-route zone (`Order.dropoff.zone`) this doc's ruling explicitly names |

**Conscious ruling on the display strings (not silent inclusion, per the WO):** `zone`
and `category` (and their siblings `zoneFrom`/`zoneTo`/`zones[]`) are free-text display
strings — the WO flagged them for an explicit decision. **Ruling: tighten them** to the
same trimmed-non-empty rule, because a `" "`/`"\t"` zone or category is invalid on a
storefront card, a product, or a delivery route just as a blank name is. This does NOT
add a zone enum or a category taxonomy — those remain founder decisions (WO-5.13); it
only forbids whitespace-only/untrimmed values. The founder can carve any of these back
to plain `z.string().min(1)` if surrounding whitespace should be allowed.

### EXEMPTED, with reason (NOT tightened)
| Class | Field(s) | Reason for exemption |
|---|---|---|
| **timestamps** | `IsoTimestampSchema` (`common.ts:9`) → all `createdAt`/`updatedAt`/`issued`/`expiry`/`effective`/`serverTime`/`capturedAt`/timestamps-map values | not Id/name-class; timestamps are a distinct class governed by the separate open question **N2** (ISO-8601 format validation). Out of this ruling's scope |
| **machine references / codes (contracts)** | `slug` · `productCode` · `stableSku` · `providerTransactionReference` · `collectRef` · `signature` · `nonce` · `humanReasonRef` | identifier-**adjacent** but not the `IdSchema` id-class; opaque machine tokens. A future ruling could extend the trim rule; not swept in silently |
| **machine references (kernel-types)** | `MediaRef.ref` (`media.ts:11`) · `MediaRef.mimeType` (`:13`, a MIME token like `image/jpeg`) · `Location.maskedRelay` (`location.ts:14`, `z.string()` — a relay ref, no `min(1)`) | opaque machine tokens, not id/name/display-label. `MediaRef.sha256` already carries a strict hex regex |
| **free-text (kernel-types)** | `Location.directions` (`location.ts:13`, `z.string()` — no `min(1)`) | free-text navigation prose; may legitimately be empty; not in the `min(1)` tightening scope |
| **policy / version strings** | `offerVersion` · `platformFeeVersion` · `processingVersion` · `settlementPolicyVersion` · `inspectionPolicyVersion` · `version` (attribution/custody/delivery) · `sealRule` | machine version identifiers, not id/name-class |
| **free-text states / reasons** | `status` (many) · `state` · `moderationState` · `trustState` · `buyerRiskState` · `handlingClass?` (`commerce.ts:47`, class token) · `reason` · `rejectionReason?` · `faultAssignment?` · `exception?` · `authorizationReason?` · `inspectionResult` · `inspectionCategory` · `check` · `party` · `provider` · `source` · `type` · `coarseLocation?` · array-of-string reasons/restrictions/holds/allowedActions/hashes | enum-like or human free-text; not id/name/display-label class |
| **event envelope** | `command_id` (its own open question **Q2**) · `correlation_id` · `actor` · `serverTime` · `version` | transport fields; `command_id` tightening is a separate named question |

## Non-vacuous evidence, both directions
- Unit (`shapes.test.ts`, WO-5.14 block): `IdSchema`/`TrimmedNonEmptyString` accept
  6 clean values and refuse 10 whitespace-only/untrimmed values; the tightening reaches
  real shape fields — `id`/`resellerId`/`name`/`zone`/`category` on `StorefrontSchema`,
  **`User.id`/`User.phoneAlias.alias`** (kernel-types identity), and
  **`Order.dropoff.zone`/`.landmark`** (kernel-types `Location` — the delivery-route
  zone) each refuse `" "`/`"\t"`/`""`/`" x"`/`"x "` **on that field**; internal
  whitespace preserved.
- Gate (`show-trimmed-string-negative.mjs`, wired in `run-gates.sh`): a clean storefront
  AND a clean order parse (non-vacuity); 25 plants across storefront `id/resellerId/
  name/zone/category` + 10 across `order.dropoff.zone/landmark` (proving the kernel-types
  `Location` tightening reaches a real shape) all refuse on their field. Exit 1.

## Snapshot delta
`packageVersion 0.9.9 → 0.9.10`; **+1 export** `TrimmedNonEmptyString` (re-exported from
kernel-types); **115 pure `pattern` additions** of exactly `^\S([\s\S]*\S)?$` on the
id/name/display fields (contracts id-class + name/zone/category + kernel-types
`Location.zone`/`landmark` everywhere `Location` is used); **0 non-additive changes**
(no existing `minLength`/`maxLength`/`enum`/`pattern` altered — `storefront.name` keeps
`maxLength:120`; timestamp fields keep no pattern; `Location.directions` keeps no
pattern). **`UserId`/`PhoneAlias` stay `{}` in the snapshot** (their brand `.transform`
makes the JSON-Schema projection opaque — they were already `{}`), so those two are
behaviour-locked by the tests/fixture, not the snapshot. `docs/design/tokens.json`
untouched.
