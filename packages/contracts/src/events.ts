import { z } from 'zod';

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
