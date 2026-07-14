# The réputation law (S8) — derivation record (WO-5.15, canon docs; no shape change)

## The ruling
**Founder ruling (Beurni, 2026-07-15):** *La réputation d'une revendeuse est **LE NOMBRE
DE VENTES LIVRÉES**. An exact count — never a rank, never a score, never a comparison.
Source: delivery-validated events attributed to her storefront. Rendered verbatim
(« N ventes livrées »), shown from the first delivered sale (floor = 1,
founder-overridable), deterministic and explainable in that one sentence.*

This closes S8 — the last GP-CANON open item (canon carried **no** reputation-defining
sentence; the mechanic — "min review count before ratings" — was an open Cercle
question). The ruling supersedes the pre-ruling placeholder ("reputation with sample
size" / "Reputation (sampled)"); those doc references are reconciled to the count law in
the same commit (Shop-Plus-Build-Spec SP8, Shop-Plus-Building-Plan SP6.2,
ECOSYSTEM-MASTER-REFERENCE SP8).

**No invariant lost in the supersession (completeness):** the old SP6.2 one-liner also
carried "related-party exclusion." That protection is **not dropped** — it survives at
**SP6.3** (tiered related-party: identity/phone/wallet auto-void; device/household →
review), **SP-I17** (referral related-party tiers; confirmed fraud strips verified
status), and the **Risk/Moderation** domain — and it is structurally moot for the count
itself, since the count is over **delivery-VALIDATED** sales only (a self-deal that never
reaches a validated delivery is never a « vente livrée »; one exposed as fraud loses its
validated status under SP-I17). The réputation law does not restate related-party
mechanics because they are not the ruling's subject — it does not weaken them.

## Why this is deterministic-only-compliant (Ten Laws §5)
An exact count is the antithesis of a rank/score/ML-segmentation. It is **the ultimate
plain driver** — one integer, one sentence, no model, no comparison, reproducible from
the event log. It also satisfies the pre-existing "no black-box score" guardrail
(Shop-Plus-Building-Plan SP6.2) and the honest-states doctrine (shown from the first
delivered sale, never a fake count).

## DERIVE-OR-STOP — the event → resellerId linkage (verified in the bytes)
**Result: DERIVABLE from existing canonical shapes. No STOP. No payload invented.**

The delivered-sale signal and the reseller attribution are joined entirely through
fields that already exist on canonical shapes:

| hop | shape · field (verified) | note |
|---|---|---|
| 1 | event **`delivery.validated.v1`** (`packages/contracts/src/events.ts:61`) | the delivered-sale signal; the correct event name (verified — not `delivery.refused.v1`/`held_for_review.v1`) |
| 2 | **`ValidationDecisionSchema.taskId`** (`shapes/custody.ts:278-280`) | the validation the event announces is on a `taskId`; `result` is the SE-I06 validation outcome |
| 3 | **`DeliveryTaskSchema` → `logisticsTaskBase.orderId`** (`shapes/custody.ts:49-51, 69-71`) | the delivery task carries `orderId` |
| 4 | **`OrderSchema.resellerId`** (`shapes/commerce.ts:181`) — **LOCKED (SP-I01)** | "Every confirmed order MUST carry exactly one `reseller_id` **locked** from a qualified attribution or the storefront used for checkout" (Shop-Plus-Build-Spec §SP-I01) — immutable after confirmation, so the attribution is stable |
| 5 | **`StorefrontSchema.resellerId`** (`shapes/commerce.ts:134`) | the storefront belongs to the reseller |

So, for a reseller `R`:

> **réputation(R) = |{ Order : Order.resellerId = R ∧ the order's delivery task reached
> a `delivery.validated.v1` (validated `ValidationDecision`) }|**

Every join key (`taskId`, `orderId`, `resellerId`) is an existing canonical field. The
count is a deterministic aggregation over the Order projection, attributed by the
**immutable** `Order.resellerId`.

### Honest flag (a real observation, NOT a STOP, NO payload proposed)
The canonical **`EventEnvelopeSchema`** (`events.ts`) is generic —
`{command_id, correlation_id, aggregateVersion, actor, serverTime, version}` — it carries
**no subject/aggregate id and no typed per-event payload** (canon has no per-event
payload shapes; those live only in the certification harness). So a raw
`delivery.validated.v1` **envelope in isolation** does not name its `orderId`/`taskId`;
the consumer resolves the subject through the shape graph above (join by the existing
ids, and/or group by `correlation_id`). In the E1 reference world the concrete transport
is the harness's `EligibilityEventPayloadSchema { order_id, task_id, validation_id,
result:'validated', settlement_eligibility:true }` (`packages/certification/src/
domain-schemas.ts:48-56`) — a **harness** artifact, not canon.

**Determination:** the linkage is derivable from existing canonical **shapes**, so the
réputation counter derives from the Order/ValidationDecision projections — no new payload
field is required and none is invented. *If* a future consumer wants to count directly
off the raw event stream (not the Order projection), canon would need a documented
event-subject field — that is a separate founder/shape decision, explicitly **not** taken
here.

## Rendering (French Voice §10.5)
Rendered verbatim **« N ventes livrées »** (selling-register, warm, 6th-grade,
deterministic — the string lives in the i18n catalog with a `register` tag when a
consumer builds it, per Ten Laws §6). Shown from the **first delivered sale** — floor
**= 1**, founder-overridable. No zero-state fake count; before the first delivered sale
the honest empty state applies (the réputation line simply does not appear yet).

## Scope
Canon **docs** only — three manifest-tracked docs reconciled + this derivation record.
**No `contracts/` shape moved** (the linkage was already fully present), so the
api-surface snapshot is unchanged and there is **no package version bump**; only the
doc-hash manifest is re-synced. `docs/design/tokens.json` untouched.
