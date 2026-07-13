# Moderation decision shapes — canon (WO-5.10)

**Source:** Boutik **A1 ratified v1 set**, **founder-ratified 2026-07-13**. Consumed
today at boutik `catalog-service` (a local enum); this slice brings the set into
canon so **PLATFORM Desk 3** can issue decisions boutik consumes across the pin.

## What canon ships

- **`ModerationReasonCode`** (`MODERATION_REASON_CODES` + schema + type, in `enums.ts`) —
  the six ratified codes:
  `facts_incomplete` · `no_public_safe_proof` · `price_or_contact_in_image` ·
  `not_neutral_packaging` · `prohibited_or_unlaunched_category` · `authenticity_concern`.
- **`ModerationDecisionSchema`** (+ type, in `shapes/moderation.ts`) — a discriminated
  union with **exactly two** outcomes: `approved` | `changes_requested`.

## The three schema-enforced properties (not discipline)

1. **A silent rejection is unrepresentable.** There is no generic/"rejected" terminal —
   only `approved` or `changes_requested` — mirroring the no-generic-`failed`
   order-status law. A decision that refuses a product must SAY it is
   `changes_requested`.
2. **A reasonless rejection is unrepresentable.** `changes_requested` requires
   `reasons: min 1` of the enum. You cannot construct a rejection that names no reason.
3. **No self-moderation.** `decided_by` MUST match `ops:moderation:*`; a supplier
   actor never validates.

## Canon grounding (the codes are ratified, and they map to existing canon)

- `facts_incomplete`, `no_public_safe_proof` ← **B+I-01** ("approved facts, … an approved
  public-safe actual-item proof, and an approved moderation decision").
- `price_or_contact_in_image` ← the price-free canonical hero + no supplier contact.
- `not_neutral_packaging` ← **B+3** "neutral/platform packaging rule (no supplier
  branding/contact on the exterior)".
- `prohibited_or_unlaunched_category` ← category rules / the electronics-gate class of
  unlaunched categories.
- `authenticity_concern` ← "no unresolved moderation/authenticity concern".
- **Ops-only actor** ← Boutik-Plus-Build-Spec §Roles: "verification/moderation operator
  (Ops only)"; "no self-moderation".

## Enforcement + consumers

- `scripts/show-moderation-decision-negative.mjs` (wired in `run-gates.sh`) — proves the
  schema **non-vacuous**: two VALID decisions PARSE, while a reasonless
  `changes_requested`, a supplier-actor decision, and a generic `rejected` are all
  REFUSED. Unit tests in `packages/contracts/test/moderation.test.ts`.
- **Consumer note:** boutik **re-pins and swaps its local enum for canon's on its NEXT
  slice**; **PLATFORM consumes at OPS-1a**. This is the next consumer-visible pin.
