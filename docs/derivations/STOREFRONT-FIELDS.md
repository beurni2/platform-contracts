# Storefront fields — derivation record (WO-5.13, canon v0.9.9)

**The STOP that opened this (OZ, SP#001-A).** `StorefrontSchema` exists but lacks the
fields the Seller #001 aggregate requires: `name`, `zone`, `category`, `createdAt`,
`updatedAt`. This slice extends the shape **additively, by derivation** — nothing
existing moves; existing lines stay byte-identical; the new keys are appended.

## 1. The current shape, verbatim (read-before-write)
`packages/contracts/src/shapes/commerce.ts` before this slice:
```ts
/** §5.6 Storefront. */
export const StorefrontSchema = z
  .object({
    id: IdSchema,
    resellerId: IdSchema,
    slug: z.string().min(1),
    discoverable: z.boolean(),
    curatedItems: z.array(IdSchema),
  })
  .strict();
export type Storefront = z.infer<typeof StorefrontSchema>;
```
`.strict()`; five fields, all required. **`discoverable` is already present as a
required boolean** — the WO's "discoverable if absent (boolean)" is conditional, and
it is NOT absent, so it is **not touched** (no re-add).

**Ownership authority (§5.2, Shop-Plus-Build-Spec:80-81):** "Storefront&Attribution
(OWNED here) … Shop+ consumes read-only Catalog/Offer/Inventory; **owns Storefront &
Attribution**." Shop+ owns this shape — extending it here is in-domain.

## 2. The added fields (all derived; additive; required — see §3)

| field | schema | derivation / anchor (quoted) |
|---|---|---|
| `name` | `z.string().min(1).max(120)` | **SP0.2 (Shop-Plus-Building-Plan:34):** "reseller activation (**store name**/zone/category focus)". Non-empty; the `.max(120)` is a **boundary guard** (validate-at-boundary, CLAUDE §6bis), NOT a canon/product value — no spec bounds a store name and there is no `.max()` precedent in the codebase; **founder-overridable** (chosen generous enough for any real Ouaga store name, bounded against unbounded input). |
| `zone` | `z.string().min(1)` | **SP0.2:** "store name/**zone**/category focus". A free **display string** — demo precedent « **Rood Woko, Ouagadougou** » (`docs/design/copy.md:157`). **Anything richer than a string (a zone enum / gazetteer key) is a FOUNDER DECISION — NOT invented here** (STOP honored). |
| `category` | `z.string().min(1)` | **SP0.2:** "store name/zone/**category** focus". A **string**. The **category-floor structure is an OPEN founder decision** and does NOT enter this shape (STOP honored — no category enum, no taxonomy). |
| `createdAt` | `IsoTimestampSchema` | The Seller #001 aggregate requires creation/mutation timestamps; `IsoTimestampSchema` is canon's server-timestamp primitive (`shapes/common.ts:9`), used across every dated shape. |
| `updatedAt` | `IsoTimestampSchema` | Same primitive; the aggregate tracks last mutation. |

`discoverable` (already present) corroborated by **Build-Spec:35** "Ma vitrine
(Partager, **discoverable toggle**)". *(The WO cited Building-Plan:201 for the toggle;
that line is blank/out-of-range in the current Building-Plan — the substantive anchor
is Build-Spec:35. Non-load-bearing: the field already exists.)*

## 3. Why required, and why "additive · existing consumers unaffected" holds
The five added-or-present fields are **required** because the STOP states they are "the
fields the Seller #001 aggregate **requires**." Making them required is safe because
**nothing constructs a `Storefront` anywhere in this repo** (grep of `packages` for
`StorefrontSchema`/`Storefront` construction returns only a doc-comment in
`quote.ts:28` — no fixture, test, or reference-chain builds one). So no existing
producer breaks. The **only** consumer is OZ (shop-plus), who raised the STOP because
it needs these fields; OZ adopts the extended shape on its re-pin at SP#001-A's resume.
"Additive" here = existing keys/lines unchanged, new keys appended after `curatedItems`.

## 4. Storefront lifecycle events (WO item 3 — quote what exists)
**No per-event payload shapes exist anywhere in canon.** The event model is: the
`EVENT_NAMES` string union (`events.ts`) + the single `EventEnvelopeSchema` (envelope
only: `command_id, correlation_id, aggregateVersion, actor, serverTime, version`).
`storefront.created.v1` and `storefront.published.v1` exist as **names** (`events.ts`,
Shop+ block). **Introducing storefront-specific payload shapes would create the FIRST
per-event payload-schema pattern — a new architecture no other event has, beyond this
slice's additive scope and against "no unrequested tidying."** So, per the WO's "or
quote what exists": the events are name + envelope-conformant today; **no payload shape
is added.** If per-event payloads become canon, that is its own slice across all events,
not a storefront-only precedent.

## 5. Non-vacuous negatives (planted refusals)
`test/shapes.test.ts` asserts a valid extended Storefront parses AND: (a) an **empty
`name`** (`""`) refuses (min 1); (b) a **missing `createdAt`/`updatedAt`** refuses
(required); (c) a **stray field** refuses under `.strict()`. Both directions.

## 6. Out of scope (STOP-honored, recorded)
- **Zone enum / gazetteer** — founder decision; `zone` stays a display string.
- **Category floor / taxonomy** — open founder decision; `category` stays a string.
- **Per-event payload shapes** — no such pattern exists; not invented for storefront alone.
