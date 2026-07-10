# E2 failure-state taxonomy — derivation table (WO-2.0, canon v0.5.0)

**The rule this table enforces (WO-2.0 prime directive):** every state name,
reason family, and fault class in the v0.5.0 canon is DERIVED from spec text
in `/docs` — the governing sentence is quoted verbatim beside each name. A
name with no quote does not enter canon. This document is repo governance
(not part of the drift-checked canon distribution set — the manifest sweeps
`docs/` root only, by construction).

Citation form: `document § / line at v0.5.0 branch time`.

## 1. OrderStatus extension (three failure states — item 1)

| New enum member | Governing quote (verbatim) | Source |
|---|---|---|
| `payment_failed` | "each adversarial scenario in §6 (**reservation-held-after-payment-fail**, …) produces the defined recovery state + a reconciliation alert" · "**a reservation stays held after payment failure**" | Contract E2 exit (l.31) · Contract §6 "Alert when (minimum)" (l.116) |
| `cancelled` | "Every failed-delivery reason produces an explicit retry/return/**cancellation**/support/incident behavior." · "refund/**cancellation** consume reason + evidence" | Sera-Build-Spec SE-I10 (l.42) · Sera-Build-Spec SE6.x prose (l.121) |
| `refunded` | "mismatch/damage → rider refuses custody, **buyer refunded**, no round-trip" · "No seller-caused refund or logistics loss may delay **the buyer's refund**" | Boutik-Plus-Build-Spec B+7 (l.180) · B+I-13 (l.57) |

**Scope note:** the WO's parenthetical "cancellation/**release**" — release is the
RESERVATION-level state (the deployed reservation core's `released`, from the
"short reservation" expiry in SP6); at order level the specs name only
cancellation. No `released` order state is derivable; none is added. No
success-terminal (`delivered`) is in this WO's mandate; none is added.
Unknown states still refuse at parse (negative updated: a seventh string
`failed` refuses).

## 2. EscrowTxn.status enum (item 2 — promotion from bare string)

| Enum member | Governing quote (verbatim) | Source |
|---|---|---|
| `collect` / `hold` / `split` / `payout` | "**BCEAO-licensed aggregator** (**collect→hold→split→payout**; no app holds funds)" — the provider-side transaction's four flow stages, named identically in both specs | Boutik-Plus-Build-Spec §4 (l.78) · Shop-Plus-Build-Spec §4 (l.71) |
| `refunded` | leg vocabulary "status(**held\|captured\|refunded**)" + "No seller-caused **refund** … may delay the buyer's **refund**" | Boutik/Shop §5.6 EscrowTxn line (l.143/l.108) · B+I-13 (l.57) |

**⚠ Founder note:** the WO-2.0 text hints at a "'held'/'**released**'/'refunded'
family" — **no spec sentence names `released` for escrow or payment legs**
(the only "released" in the specs belongs to gated Cercle campaign/referral
shapes). Under DERIVE-NEVER-INVENT it does not enter canon; the derivable
escrow-status vocabulary is the aggregator flow above. Flagged for
ratification.

**Leg status (already canonical since WO-0):** `PaymentLegStatusSchema =
held | captured | refunded` — spec-enumerated verbatim: "paymentLegs[{…,
status(**held|captured|refunded**)}]" (Boutik l.143 / Shop l.108). No change;
negative added showing a `released` leg refuses at parse.

## 3. DeliveryOutcome (item 3 — new shape; bare `failed` unrepresentable)

| Element | Governing quote (verbatim) | Source |
|---|---|---|
| family `retry` / `reschedule` / `return` / `incident` | "**Structured reasons; retry/reschedule/return/incident; no generic failed terminal; fault-attributed.**" | Sera-Building-Plan SE6.1 (l.69) — the WO's cited authority |
| (spec-prose variant) | "dispatcher applies **retry/reschedule/return_required/incident**" | Sera-Build-Spec SE6.x prose (l.121). Plan + WO say `return`; spec prose says `return_required`. The WO dictates SE6.1 verbatim → `return`. **Divergence flagged for ratification.** |
| NO `failed` member | "**No generic failed terminal state.**" · "**no generic failed terminal; package never unowned**" | Sera-Build-Spec SE-I10 (l.42) · SE6.x prose (l.121). Gate: a `family:"failed"` fixture refuses at parse. |
| reasonCode `honest_absence` / `unusable_location` / `insufficient_balance` / `change_of_mind` / `repeated_abuse` / `fraud` | "Classify reason: `honest_absence \| unusable_location \| insufficient_balance \| change_of_mind \| repeated_abuse \| fraud`." | Shop-Plus-Build-Spec §6.4 (l.152) |
| reasonCode `provider_failure` | "**Honest absence / provider failure do NOT escalate** like change-of-mind/abuse." | Shop-Plus-Build-Spec §6.4 (l.152) |
| `faultClass` field | "Fault attributed on every claim" · SE6.1 "fault-attributed" · event "`delivery.refused.v1(reasonCode,**fault**)`" | Sera-Build-Spec l.121 · Sera-Building-Plan l.69 · Boutik §5.7 (l.157) |
| `reasonCode` + `humanReasonRef` (i18n key) | "**structured reason recorded**" · "`delivery.refused.v1(**reasonCode**,fault)`" · human text lives in the catalog per Ten-Laws-6/§10.5 ("Strings live in the i18n catalog with register tags — never inline") | Sera-Build-Spec l.118 · Boutik §5.7 l.157 · CLAUDE.md Law 6 / Contract §10.5 |
| attempt metadata `{ number, at, windowExpiresAt? }` | "**One retry window (~15 min; agent top-up allowed)** → then **buyer-fault refusal**" | Sera-Build-Spec SE5.x (l.118) |

## 4. FaultClass + claims (item 4 — verification, no extension needed)

| Member | Fund-routing quote (verbatim) | Source |
|---|---|---|
| `seller` | "**Seller-caused losses are absorbed by the Séra Fulfillment Protection Fund**; consequences are access-based." | B+I-12 (l.56) |
| `buyer` | "**buyer-fault refusal**: **delivery fee retained**, item re-sealed …, structured reason recorded, return flow" | Sera-Build-Spec l.118 (+ Shop §6.4 ladder l.152) |
| `sera` | "**Séra-caused product loss/damage = `CustodyLiabilityClaim`, not a fund payout.**" | Boutik §6 (l.169) · Sera-Build-Spec l.121 |
| `payment_provider` | "**Honest absence / provider failure do NOT escalate**" + the member enumerated in §5.6 | Shop §6.4 (l.152) · Boutik §5.6 (l.148) |
| `platform_system` / `unresolved` | enumerated verbatim in canon §5.6: "faultClass(**seller\|sera\|payment_provider\|buyer\|platform_system\|unresolved**)" | Boutik-Plus-Build-Spec §5.6 (l.148) |

`ProtectionClaimSchema` and `CustodyLiabilityClaimSchema` already carry
exactly the §5.6 fields (`{orderId, reason, amount, faultClass,
evidenceBundleId, state}` · `{orderId, cause(sera_loss|sera_damage), amount,
evidenceBundleId, state}` — Boutik l.148-150). The specs do not enumerate
claim `state` values → the fields stay spec-bare strings; **no extension is
derivable, none is made.**

## 5. Ops events (item 5)

| New event name | Governing quote (verbatim) | Source |
|---|---|---|
| `reconciliation.alert.v1` | "produces the defined recovery state + **a reconciliation alert**" · "**reconciliation alerts**" | Contract E2 exit (l.31) · Contract §6 Standards (l.115) |
| `saga.stuck.v1` | "**DLQ + stuck-saga detection** live" · "**DLQ + stuck-saga detection**" | Contract E2 exit (l.31) · Contract §6 Standards (l.115) |
| `dlq.parked.v1` | same two sentences (the DLQ half) | Contract E2 exit (l.31) · Contract §6 Standards (l.115) |

**Refund/reversal events:** the shop plan names the "**refund/earning-reversal
saga**" at **E3** (Shop-Plus-Building-Plan l.23), and NEITHER spec's §5.7
event list carries any refund/reversal event name. Per the WO ("add only what
a quoted flow lacks") and the prime directive, **no refund event names are
added at v0.5.0** — they enter with the E3 bump when the specs/founder name
them. Recorded as a deferral.

## 6. D20 (founder ruling 2026-07-10, recorded — item 6)

Dwell is **recorded and console-surfaced; no enforcement fields exist**.
Canonical dwell carrier: `InspectionPolicySchema.dwellTargetSec` (a TARGET
for recording/surfacing, not an enforcement threshold) — doc comments added
there and on `PickupVerificationSchema`; no schema change.
