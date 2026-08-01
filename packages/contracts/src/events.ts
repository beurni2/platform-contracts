import { z } from 'zod';
import { FcfaSchema, IdSchema, IsoTimestampSchema, TrimmedNonEmptyString } from './shapes/common.js';
import { PaymentModeSchema } from './enums.js';

/**
 * Versioned event envelope (Execution Contract §3): every event carries
 * `command_id`, `correlation_id`, aggregate version, actor, server time.
 * Field names follow WO-0 §B2 verbatim.
 */
export const EventEnvelopeSchema = z
  .object({
    command_id: z.string().min(1),
    correlation_id: z.string().min(1),
    aggregateVersion: z.number().int().min(0),
    actor: z.string().min(1),
    serverTime: z.string().min(1),
    version: z.string().min(1),
  })
  .strict();
export type EventEnvelope = z.infer<typeof EventEnvelopeSchema>;

/**
 * E1-relevant event-name union (§5.7 of all three specs).
 * EXCLUDED by founder ruling (gated; enter only by version bump behind their
 * gates): all `packlab.*`, `cercle.*`, `campaign.*`, `referral.*`, `review.*`.
 */
export const EVENT_NAMES = [
  // Boutik+ — supplier / seller / media / catalog / offer / inventory
  'supplier.verification_submitted.v1',
  'supplier.verification_approved.v1',
  'supplier.verification_restricted.v1',
  'seller.trust_state_changed.v1',
  'seller.readiness_challenge_issued.v1',
  'media.asset_captured.v1',
  'media.derivative_approved.v1',
  'media.asset_rejected.v1',
  'catalog.product_submitted.v1',
  'catalog.version_activated.v1',
  'catalog.blocked.v1',
  'offer.published.v1',
  'offer.version_created.v1',
  'offer.paused.v1',
  'inventory.adjusted.v1',
  'inventory.reconfirmation_due.v1',
  'inventory.availability.changed.v1',
  // Checkout / payment / fulfillment
  'checkout.quote_created.v1',
  'payment.checkout_leg_confirmed.v1',
  'payment.door_leg_confirmed.v1',
  'fulfillment.accepted.v1',
  'fulfillment.ready.v1',
  'fulfillment.rejected.v1',
  'fulfillment.timed_out.v1',
  // Pickup / custody / handoff / delivery
  'pickup.assigned.v1',
  'pickup.verification_recorded.v1',
  'pickup.custody_seal_registered.v1',
  'custody.transferred_to_courier.v1',
  'custody.transferred_to_customer.v1',
  'custody.returned_to_supplier.v1',
  'handoff.authorized.v1',
  'delivery.evidence_submitted.v1',
  'delivery.validated.v1',
  'delivery.held_for_review.v1',
  'delivery.refused.v1',
  // Settlement / payout / protection / goodwill
  'settlement.supplier_payable.v1',
  'payout.submitted.v1',
  'payout.paid.v1',
  'payout.failed.v1',
  'protection.capitalized.v1',
  'protection.solvency_changed.v1',
  'protection.claim_opened.v1',
  'goodwill.granted.v1',
  // Séra — courier / shift / vehicle / logistics / assignment / route
  'courier.certified.v1',
  'courier.restricted.v1',
  'shift.started.v1',
  'shift.closed.v1',
  'vehicle.checked_out.v1',
  'vehicle.maintenance_due.v1',
  'logistics.task_ready.v1',
  'assignment.declined.v1',
  'assignment.expired.v1',
  'route.assigned.v1',
  'route.accepted.v1',
  'route.stop_started.v1',
  'route.stop_completed.v1',
  'route.reordered.v1',
  // Séra — return / package / custody liability / safety / incident
  'return.logistics_requested.v1',
  'package.lost.v1',
  'package.damaged.v1',
  'custody_liability.claim_opened.v1',
  'safety.sos_created.v1',
  'safety.sos_acknowledged.v1',
  'incident.opened.v1',
  // Shop+ — reseller / storefront / commission agreement / listing / attribution
  'reseller.activated.v1',
  'storefront.created.v1',
  'storefront.published.v1',
  'commission_agreement.accepted.v1',
  'commission_agreement.expired.v1',
  'listing.published.v1',
  'listing.version_created.v1',
  'listing.auto_hidden.v1',
  'attribution.issued.v1',
  'attribution.qualified.v1',
  'attribution.locked.v1',
  'attribution.expired.v1',
  'attribution.revoked.v1',
  'marketing_asset.exported.v1',
  // Shop+ — order / commission / reputation / buyer eligibility
  'order.confirmed.v1',
  'order.status_projection_updated.v1',
  'commission.earned.v1',
  'reputation.updated.v1',
  'buyer.eligibility_changed.v1',
  // Ops (Contract E2 exit: "the defined recovery state + a reconciliation
  // alert"; §6 Standards: "DLQ + stuck-saga detection · reconciliation
  // alerts"). Added v0.5.0 — derivations: E2-taxonomy.md §5. The specs list
  // NO refund/reversal event names (the refund/earning-reversal saga is E3,
  // shop plan l.23) — none are invented here.
  'reconciliation.alert.v1',
  'saga.stuck.v1',
  'dlq.parked.v1',
] as const;

export const EventNameSchema = z.enum(EVENT_NAMES);
export type EventName = z.infer<typeof EventNameSchema>;

/** A platform event: envelope + registered name + payload (payload schemas are app-repo/E1 work). */
export const PlatformEventSchema = z
  .object({
    name: EventNameSchema,
    envelope: EventEnvelopeSchema,
    payload: z.record(z.string(), z.unknown()),
  })
  .strict();
export type PlatformEvent = z.infer<typeof PlatformEventSchema>;

/**
 * ═══════════════════════════════════════════════════════════════════════════
 * ORDER-PAID-WIRE-1 (canon v3.2.0) — the payload of `order.confirmed.v1`,
 * THE FIRST CANONICAL PAYLOAD SCHEMA, because this one crosses repos.
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Founder-approved 2026-08-01 (« both approved »): the cross-app signal that a
 * buyer's order is confirmed and PREPARATION SHOULD BEGIN. Producer: Shop+
 * (the order's owner), at the moment its order reaches `confirmed` — which
 * happens exactly when the PAYMENT PROVIDER'S WEBHOOK confirms the checkout
 * leg, the only payment truth there is (Ten Laws #2). Never earlier, never on
 * the buyer's word, never from her device. Consumer: Boutik+ fulfillment
 * intake, over an authenticated service wire, delivered AT-LEAST-ONCE and
 * absorbed idempotently on `orderId` (the intake is first-wins: a redelivery
 * can never reset the founder's preparation-decision clock).
 *
 * A NAMING CORRECTION, recorded so the approval trail is honest: the founder
 * approved this shape under the working label « order.paid.v1 ». §5.7's union
 * above ALREADY names this moment — `order.confirmed.v1` — and a second name
 * for one moment is precisely the vocabulary drift the union exists to
 * prevent. The approved payload is untouched; only the label it hangs on is
 * the canon one.
 *
 * ONE EVENT, BOTH PAYMENT MODES, and `paymentMode` says which promise it
 * carries:
 *   · FULL_PREPAY — everything is provider-confirmed; prepare and hand to
 *     Séra.
 *   · DELIVERY_FEE_PREPAID_PRODUCT_AT_DOOR — the DELIVERY leg is
 *     provider-confirmed and the product is due at the buyer's door;
 *     preparation begins the same, and custody law is untouched (the product
 *     still transfers only after every due leg is provider-confirmed, Ten
 *     Laws #3).
 *
 * ═══ WHAT IS DELIBERATELY ABSENT — the founder's privacy rules, made
 *     UNREPRESENTABLE by `.strict()` rather than merely omitted ═══
 *
 *   · NO SUPPLIER ID. Boutik+ owns the product→supplier mapping and resolves
 *     it INTERNALLY from `productVersionId`; supplier identity never rides a
 *     cross-app wire, in either direction (the same discipline B4.2 imposes
 *     on the supply projection).
 *   · NO BUYER IDENTITY OR CONTACT. A supplier prepares a product for an
 *     order reference; Séra collects. Buyer contact is DISPATCH-surface data
 *     (the founder's operator console), never fulfillment data.
 *   · NO `buyerDropCode`. Ten Laws #3 bans it from everything seller-side.
 *   · NO buyer total, commission, markup or delivery fee. `sellerBasePrice`
 *     is B — the supplier's OWN number, carried VERBATIM off the frozen
 *     quote, never recomputed (Law #1: commission never leaks toward a
 *     seller-facing surface; Law #2: no app computes another domain's
 *     amounts).
 */
export const OrderConfirmedPayloadSchema = z
  .object({
    /** Shop+'s durable order id — the consumer's idempotency key. */
    orderId: IdSchema,
    /** The product sold. Boutik+ resolves WHICH SUPPLIER from this, internally. */
    productVersionId: IdSchema,
    /** The offer version the listing froze against (same field as SupplyProjection). */
    offerVersion: z.string().min(1),
    paymentMode: PaymentModeSchema,
    /** Server time the order reached `confirmed` — starts the preparation-decision clock. */
    paidAt: IsoTimestampSchema,
    /** Delivery destination zone — dispatch planning, not an address. */
    zoneTo: TrimmedNonEmptyString,
    /** B, verbatim from the frozen quote. The supplier's own number, nothing else's. */
    sellerBasePrice: FcfaSchema,
  })
  .strict();
export type OrderConfirmedPayload = z.infer<typeof OrderConfirmedPayloadSchema>;
