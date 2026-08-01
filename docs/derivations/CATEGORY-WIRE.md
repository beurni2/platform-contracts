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
