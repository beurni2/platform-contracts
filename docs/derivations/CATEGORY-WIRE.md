# CATEGORY-WIRE — `category` on `SupplyProjection` (canon v3.0.0)

**Status:** shipped, canon v3.0.0 (MAJOR).
**Founder authorisation:** 2026-08-01 — « Cannon field Approved build it ».
**Shape touched:** `SupplyProjectionSchema` (`packages/contracts/src/shapes/commerce.ts`).
**Consumers that must move with it:** boutik-plus (producer), shop-plus (consumer). sera does not read this wire.

This is the warrant for a canon change, in the place `StorefrontSchema`'s own
comment says canon-change reasoning lives. It exists because the reasoning was
otherwise only discoverable from boutik-plus's JOURNAL — not from shop-plus or
sera, the repos that have to build against it.

---

## 1. The problem, stated as it was found

`ProductVersionSchema.category` has been canon since the beginning. `SupplyProjection` — the only thing Shop+ ever receives about a product — dropped it. So **Shop+ had never seen a product's category**, and two things went wrong downstream:

- **§6.2 (at-door inspection matrix)** had no row to select, so every buyer saw the conservative fallback whatever she had actually bought.
- **§6.1's « category inspectable »** condition had nowhere to read a category *from*. The checkout wire therefore accepted one **from the caller** — the party that condition exists to constrain. Two other §6.1 inputs (`sellerTier`, the buyer's own eligibility record) arrive the same way.

The second point is why this is not a display-polish change.

## 2. Why a field on the supply projection, and not somewhere else

Three options were considered.

| Option | Verdict |
|---|---|
| `category` on `SupplyProjectionSchema` | **Chosen.** The supplier states what the product *is*; the projection is already the channel for exactly that class of fact. |
| `category` on `ResellerListingSchema` | Rejected. The reseller sets a **markup**, not what a product is, and the reseller is a party to the Option-B outcome the category helps gate. |
| A separate read-model | Rejected. `SUPPLY-WIRE-1` already recorded what a second consumer of the same wire costs: two clients drifted on route, envelope, freshness and validation. |

The precedent is the same object's own history: `productName` and `assetRefs`
were added to it at v2.0.0 (`SUPPLY-DISPLAY-FIELDS-1`, `2f0a83a`) because buyer
surfaces needed them. `category` is the third field of that class and the only
one that had been left behind.

## 3. Why REQUIRED

An optional category degrades **silently** in both consumers: §6.1 refuses
Option B, §6.2 renders the cautious row. Both are correct, and both are
invisible — so a producer that simply forgot would be indistinguishable from a
product that is genuinely uninspectable.

Required makes a stale producer fail **loudly**, at the schema, instead of
quietly at a buyer's door. That is also why the bump is MAJOR: it breaks every
existing producer, deliberately, which is the point.

## 4. Why MAJOR

`2f0a83a` added required fields to this same `.strict()` object and bumped
`1.2.0 → 2.0.0`. Same object, same required-ness ⇒ `2.6.0 → 3.0.0`.

## 5. What this does NOT decide — the open Decision is untouched

**No taxonomy is created here.** The type is the free `TrimmedNonEmptyString`
canon already uses for every category, on the rule stated at `StorefrontSchema`:

> `zone` and `category` are free DISPLAY STRINGS … a zone enum / gazetteer and
> **the category-floor taxonomy are FOUNDER DECISIONS and do NOT enter this shape**.

A test pins this: `shoes`, `electronics`, `mode` and `un-truc-tout-neuf` all
**parse**. Policy lives on the reading side — §6.1 uses an allowlist, §6.2 falls
back — so an unrecognised category fails closed without canon having to know
what any category means. The ⏳ category-floor Decision remains open.

## 6. The fail-closed contract consumers must honour

Both directions, or the field is worse than useless:

- **Absent or unrecognised ⇒ the conservative §6.2 row** (claims nothing category-specific).
- **Absent or unrecognised ⇒ Option B refused** (`category_not_inspectable`).

An absent category may only ever **withhold**, never **reveal** — the same law
`buyerDropCode` follows.

Two traps found while implementing this, both worth inheriting:

1. **Never look the category up directly in an object literal.** `INSPECTION[category]` resolves `__proto__`, `constructor`, `toString`, `valueOf` and `hasOwnProperty` on the prototype chain, so `?? fallback` never fires. In shop-plus this threw inside the at-door render and left the buyer's previous screen mounted — unable to accept, unable to report a problem. Use `Object.hasOwn`. The identical bug existed in the §6.1 seller-tier lookup, where it **bypassed the gate entirely**.
2. **A malformed category must not delete the product.** Rejecting it in a whole-record type guard drops the record, which empties a shop over one bad field. Strip the field at the boundary instead; a stripped category is an absent one.

## 7. Deploy order — not optional

The consumer parses this wire with the strict canon schema. A pre-v3 producer
emits eight-minus-one fields, the parse fails, the product becomes undescribable
and is **omitted from every buyer page**.

    canon → boutik-plus producer → DEPLOY offer-service → DEPLOY storefront-service → buyer PWA

Deploying the consumer first empties every shop.

## 8. Known limits, recorded rather than fixed

- **Value-side identity sweep.** The SP-I03 leak sweep tests key *names*. Two free-text fields now reach the buyer wire unswept — `productName` and `category`. (`assetRefs` is not among them: it already has `assertAssetRefsIdentityFree`.) A supplier who types their phone number into a category puts it on the wire. This is the accepted `productName` precedent, not a new hole, but the surface is one field wider.
- **§6.1 is still self-declared.** `category` can now be read from server truth; `sellerTier` cannot — canon's `SellerTrustState` is keyed by `sellerId`, and B4.2/SP-I03 keep supplier identity off this projection by design, so Shop+ structurally cannot look a tier up. The clean shape is Boutik+ answering the question on the projection as an identity-free boolean. **That is another canon field and therefore a founder decision.**

---

# SELLER-TIER-WIRE — `sellerTier` on `SupplyProjection` (canon v3.1.0)

**Status:** canon shipped, consumers pending. **Founder authorisation:** 2026-08-01, « option2 ».
Recorded here rather than in a new file because it closes the limit §8 of the document above left open.

## Why this exists

§6.1's first condition is « seller tier ≥ verified ». Shop+ could not evaluate it: canon keys
`SellerTrustState` by `sellerId`, and B4.2 keeps supplier identity off this projection, so Shop+ has
no key to look a tier up with. The live consequence was that the **checkout wire accepted the tier
from the buyer's own request**, and pay-at-door worked in production only because the client
asserted `verified`. **The condition was not merely unenforced — the claim was load-bearing.**

## Why OPTIONAL, where `category` is required

What absence costs differs. An absent category degrades two things, one buyer-visible: she sees a
plausible screen with no sign anything is wrong. An absent tier degrades one: Option B is not
offered — which is exactly what §6.1 already prescribes for an unprovable condition. So optional is
**strictly better than the status quo in every state**, and costs no coordinated deploy where a
wrong order empties every shop.

## Why ENUM, where `category` is a free string

Canon **fixes** the three tiers (§5.6 `SellerTrustState`); the category floor is an open founder
decision. A tier canon has never heard of is a defect; a category canon has never heard of is
normal. The enum also refuses `toString`/`__proto__` **upstream** — an unguarded object-literal
lookup treated exactly those as real tiers and bypassed the §6.1 gate in shop-plus (fixed
separately with `Object.hasOwn`; this is the second, independent line).

## ⏳ WHAT THIS DOES NOT DECIDE — and the blocker consumers will hit

**Boutik+ can only produce `provisional` today.** Every `SellerTrustState` there is created
`provisional` and there is **no promotion path to `verified`** — two non-test tier assignments in
the whole repo, both `provisional`. « Verification tiers evidence + progression thresholds » is an
**open ⏳ Decision** (`Boutik-Plus-Build-Spec.md:219`), so inventing criteria is out of bounds.

**Consequence for whoever wires the producer:** emitting the honest tier turns Option B **off
everywhere** until a supplier can become verified. The founder chose the interim — a **narrow,
explicitly-audited manual attestation** by which he states that a named pilot supplier is verified.
That records a human decision instead of guessing a threshold, and it does not close ⏳.

**Fail-closed stays the rule at every hop:** no attestation ⇒ `provisional` ⇒ §6.1 refuses.

---

## Consumer status — both halves are now wired (2026-08-01)

**Producer (boutik-plus).** `attested-suppliers.ts` turns the founder's `VERIFIED_SUPPLIERS`
attestation list into `sellerTier` on the projection; `buildSupplyProjection` emits it
conditionally and `category` verbatim. The attestation is a Worker **secret**, written by
`offer-deploy.yml` with the deploy, so the code that reads it and the value it reads cannot arrive
separately. **Unset is a legitimate state** and warns rather than failing the deploy: no
attestation ⇒ every projection is `provisional` ⇒ §6.1 refuses Option B everywhere, which is the
designed fail-closed behaviour while ⏳ stays open.

**Consumer (shop-plus).** `SELLER-TIER-WIRE-1`: `payAtDoorContext` on the checkout wire now carries
`eligibility` **and nothing else**. `sellerTier` and `category` are read from the supply projection
the Worker resolves for itself, and a caller that sends either is **refused**
(`400 unknown_field · payAtDoorContext.sellerTier`) rather than silently ignored — the same
allowlist law `policy` has always been held to.

Three properties worth naming, because they are what make this safe rather than merely different:

1. **Absence omits, it never fills.** No supply description — unconfigured binding, unreachable
   producer, stale projection, pre-v3.0.0 producer — omits the entire `payAtDoor` block, and the
   vault answers the named `context_missing`. There is no partial context that could accidentally
   satisfy a condition.
2. **A pre-v3.1.0 producer refuses.** A projection with no `sellerTier` reaches the vault as `''`,
   which is not a member of the tier table, so §6.1 answers `seller_tier_below_minimum`. An
   unprovable condition is a refused condition.
3. **Supply is read only for an Option-B request.** A supply outage costs the door mode and never
   ordinary FULL_PREPAY checkout, and the cross-Worker fetch is not charged to the majority of
   buyers who do not choose the door.

**Still caller-supplied, and still open:** `eligibility`. §6.4 assigns `PayAtDoorEligibility` to
Risk and no Risk service exists, so there is nowhere to read it from. The vault parses it strictly
against the canonical record, which bounds the SHAPE but not the CLAIM. **This is not closed by
SELLER-TIER-WIRE-1 and must not be read as closed.**

---

# ORDER-PAID-WIRE-1 — the preparation signal (canon v3.2.0)

**Status:** canon shipped; producer (Shop+) and consumer (Boutik+ fulfillment intake) pending.
**Founder authorisation:** 2026-08-01, « both approved » — the seven-field shape and the
buyer-contact checkout fields (phone + quartier + repère; the latter is a separate slice).
Recorded in this file because it is the same wire family: facts crossing repos on canon shapes.

## The naming correction, on the record

The founder approved this event under the working label « order.paid.v1 » — a label this CTO
drafted without having re-read §5.7 first. The union already names the moment:
`order.confirmed.v1`, and Shop+'s order state machine reaches `confirmed` exactly when the
provider webhook confirms the checkout leg. A second name for one moment is vocabulary drift;
the approved payload is unchanged and hangs on the canon name. The test suite pins both facts:
`order.confirmed.v1` present, `order.paid.v1` absent.

## The semantics, precisely

Emitted ONCE per order, by Shop+, when the order reaches `confirmed` — provider-webhook truth,
never the buyer's device (Ten Laws #2). Both payment modes emit: FULL_PREPAY means everything is
paid; DELIVERY_FEE_PREPAID_PRODUCT_AT_DOOR means the delivery leg is paid and the product is due
at the door. Preparation begins in both. Custody law untouched in both (Ten Laws #3).

Transport: Shop+ → Boutik+ over an authenticated service binding (the supply wire's discipline,
reversed direction). At-least-once; the consumer is idempotent on `orderId` and FIRST-WINS
(`FulfillmentBook.registerPaidOrder` — a redelivery can never reset the founder's
preparation-decision clock, already the tested behaviour).

## What is deliberately unrepresentable (founder privacy rules, enforced by `.strict()` + tests)

· **Supplier identity** — Boutik+ resolves supplier from `productVersionId` internally; supplier
  identity never crosses an app wire in either direction.
· **Buyer identity/contact and `buyerDropCode`** — dispatch-surface data (the founder's operator
  console) and Ten Laws #3 respectively. A supplier prepares against an order reference.
· **Everyone else's money** — only B (`sellerBasePrice`) rides, verbatim from the frozen quote.
  No buyerTotal, no C, no M, no D.

## What this does NOT decide

The operator console, the ops credential, buyer-contact capture, and the 10-minute
`acceptanceDecisionMin` re-tune (founder ruled 10; code ships 120 until the fulfillment slice
lands) are all consumer-side slices with their own reviews.
