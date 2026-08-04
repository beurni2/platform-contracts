import { z } from 'zod';
import { FcfaSchema, IdSchema, IsoTimestampSchema, TrimmedNonEmptyString } from './shapes/common.js';
import { PaymentModeSchema } from './enums.js';
import { ResellerAccessChangeSchema } from './shapes/commerce.js';

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

/** A platform event: envelope + registered name + payload. Payload schemas are
 *  app-repo/E1 work EXCEPT where a payload crosses repos — those are canon,
 *  defined below (`OrderConfirmedPayloadSchema` is the first). */
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
 * (the order's owner), at the moment its order reaches `confirmed`. PRECISELY
 * (verifier correction — the first draft said « exactly when the webhook
 * confirms », which is one hop short): the machine is `payment_pending → paid
 * → confirmed`; the PROVIDER'S WEBHOOK drives `paid`, and the confirm step
 * re-verifies the recorded provider leg before `confirmed`. So `confirmed` is
 * impossible without provider truth at BOTH hops (Ten Laws #2) — never
 * earlier, never on the buyer's word, never from her device — but it is the
 * CONFIRM transition, not the webhook receipt, that emits. Consumer: Boutik+
 * fulfillment intake, over an authenticated service wire, delivered AT-LEAST-ONCE and
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
    /**
     * Server time of the CONFIRMED transition — the emitting transition, one
     * named instant, not the webhook receipt and not the `paid` hop (the
     * machine is `payment_pending → paid → confirmed`; the two hops have two
     * times, and the consumer's FIRST-WINS decision clock must start from an
     * unambiguous one). The name is the founder-approved label; the meaning
     * is pinned here: the moment the preparation promise became
     * provider-backed.
     */
    paidAt: IsoTimestampSchema,
    /** Delivery destination zone — dispatch planning, not an address. */
    zoneTo: TrimmedNonEmptyString,
    /** B, verbatim from the frozen quote. The supplier's own number, nothing else's. */
    sellerBasePrice: FcfaSchema,
  })
  .strict();
export type OrderConfirmedPayload = z.infer<typeof OrderConfirmedPayloadSchema>;

/**
 * ═══ THE WIRE ARTIFACT ITSELF — the M1 closure (verifier MAJOR, accepted) ═══
 *
 * `OrderConfirmedPayloadSchema` alone is SCHEMA-LOCAL: nothing above stops a
 * careless producer from composing a `PlatformEvent` named
 * `order.confirmed.v1` whose `payload` is any record at all — generic
 * `PlatformEventSchema` would accept `buyerPhone` without blinking, and the
 * founder's privacy rules would hold only by discipline. This schema binds
 * the NAME to the PAYLOAD in one canonical artifact, so both ends of the
 * wire can parse the same thing: the producer parses BEFORE send, the
 * consumer parses ON receipt, and a payload carrying anything the founder
 * banned is refused at both ends by construction.
 *
 * ADDITIVE on purpose: `PlatformEventSchema` itself is untouched, because
 * tightening it retroactively would change behaviour for every existing
 * event composition in three repos — a MAJOR-bump decision nobody asked for.
 * Producer/consumer slices MUST use THIS schema for this event; that
 * requirement travels in their DoD and is pinned by the tests beside it.
 */
export const OrderConfirmedEventSchema = z
  .object({
    name: z.literal('order.confirmed.v1'),
    envelope: EventEnvelopeSchema,
    payload: OrderConfirmedPayloadSchema,
  })
  .strict();
export type OrderConfirmedEvent = z.infer<typeof OrderConfirmedEventSchema>;

/**
 * ═══════════════════════════════════════════════════════════════════════════
 * READINESS-RETURN-1 (canon v3.3.0) — THE RETURN LEG: fulfillment progress
 * travelling Boutik+ → Shop+, the FIRST event to cross in that direction.
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Founder-approved 2026-08-02 (« Yes build the return signal from Boutik+ that
 * would let her follow-up continue past payée »). Until now Shop+ could prove
 * only that a buyer's money was confirmed; preparation lived in Boutik+'s book
 * and no wire carried it back, so a reseller's follow-up truthfully stopped at
 * « payée ». These two events are that missing wire.
 *
 * A NAMING CORRECTION, recorded so the approval trail is honest, and it is the
 * SAME correction `order.confirmed.v1` needed above: the working label in the
 * conversation was « package.ready.v1 ». That name is wrong twice over — §5.7's
 * union ALREADY names both moments (`fulfillment.accepted.v1`,
 * `fulfillment.ready.v1`, listed in all three specs' §5.7), and `package.*` is
 * SÉRA'S namespace (`package.lost.v1`, `package.damaged.v1`), where a
 * Boutik+ preparation fact does not belong. The approved MEANING is untouched;
 * only the labels are the canon ones.
 *
 * WHAT THEY MEAN, exactly, and why there are two:
 *   · `fulfillment.accepted.v1` — the supplier took the order on. B+I-06's
 *     first half. On a reseller's screen this is « en préparation ».
 *   · `fulfillment.ready.v1` — the supplier confirmed PACKAGE-READY against a
 *     `sellerReadinessChallenge` (B6.2). B+I-06: « A Séra pickup MUST NOT be
 *     requested until fulfillment is accepted and the supplier has confirmed
 *     package-ready. » This is the LAST fact anyone can prove today.
 *
 * ═══ WHERE THIS WIRE STOPS, AND WHY THAT IS NOT A GAP TO BE FILLED ═══
 * « En route », « à la porte » and « livrée » are SÉRA's facts, and Séra does
 * not exist yet. No consumer of these events may render a delivery state from
 * them. Readiness is emphatically NOT delivery: B+I-06 makes readiness the
 * PRECONDITION for a pickup even being requested.
 *
 * ═══ WHAT IS DELIBERATELY ABSENT — made UNREPRESENTABLE by `.strict()` ═══
 *   · NO SUPPLIER ID, and this direction is the one that would be tempting.
 *     Supplier identity never rides a cross-app wire in EITHER direction (the
 *     rule `OrderConfirmedPayloadSchema` states above is not one-way). Shop+
 *     must never be able to name, rank, or reveal a supplier — a reseller
 *     surface that learned it could route around the platform entirely.
 *   · NO READINESS EVIDENCE — no `photoRef`, no `readinessChallenge`. The
 *     challenge is one of the four non-interchangeable secrets (§5.4) and
 *     belongs to the seller↔readiness pair alone; a copy on a second app's
 *     wire is a second place to leak it.
 *   · NO `buyerDropCode`, ever, under Ten Laws #3 — banned from everything
 *     seller-side, and readiness evidence is named explicitly in that ban.
 *   · NO MONEY of any kind. Shop+ already holds the frozen quote; a franc on
 *     this wire could only be a second, drifting copy (Law #2: no app
 *     computes — or restates — another domain's amounts).
 *   · NO qty/variant. Shop+ makes no decision from them, and the smallest
 *     wire that carries the fact is the one that cannot leak the next thing.
 */
export const FulfillmentProgressPayloadSchema = z
  .object({
    /** Shop+'s durable order id — the consumer's idempotency key, and the
     *  ONLY identifier on this wire. It is Shop+'s own id travelling home. */
    orderId: IdSchema,
    /**
     * Server time of the emitting transition, as Boutik+ observed it — the
     * acceptance instant or the package-ready instant. Boutik+'s own clock,
     * never a supplier device's claim, for the same reason `paidAt` above is
     * the confirming Worker's clock and not the provider's.
     */
    at: IsoTimestampSchema,
  })
  .strict();
export type FulfillmentProgressPayload = z.infer<typeof FulfillmentProgressPayloadSchema>;

/**
 * The two wire artifacts, each binding NAME to PAYLOAD — the M1 closure the
 * `order.confirmed.v1` verifier round established, applied from the first
 * line here rather than retrofitted. Producer parses BEFORE send, consumer
 * parses ON receipt; a payload carrying a supplier id, a challenge, a photo
 * or a franc is refused at both ends by construction, not by discipline.
 *
 * ONE payload schema serves both names because the two facts have identical
 * shape — the NAME is what differs, and the name is what the consumer
 * switches on. Two identical schemas would only be two things to drift.
 */
export const FulfillmentAcceptedEventSchema = z
  .object({
    name: z.literal('fulfillment.accepted.v1'),
    envelope: EventEnvelopeSchema,
    payload: FulfillmentProgressPayloadSchema,
  })
  .strict();
export type FulfillmentAcceptedEvent = z.infer<typeof FulfillmentAcceptedEventSchema>;

export const FulfillmentReadyEventSchema = z
  .object({
    name: z.literal('fulfillment.ready.v1'),
    envelope: EventEnvelopeSchema,
    payload: FulfillmentProgressPayloadSchema,
  })
  .strict();
export type FulfillmentReadyEvent = z.infer<typeof FulfillmentReadyEventSchema>;

/**
 * RESELLER-ACCOUNTS-1 (canon v3.8.0) — `reseller.access_changed.v1`, name
 * bound to payload exactly as `order.confirmed.v1` is, for the same reason:
 * both ends parse the same artifact, and a payload carrying anything beyond
 * the four approved fields is refused at both ends by construction.
 */
export const ResellerAccessChangedEventSchema = z
  .object({
    name: z.literal('reseller.access_changed.v1'),
    envelope: EventEnvelopeSchema,
    payload: ResellerAccessChangeSchema,
  })
  .strict();
export type ResellerAccessChangedEvent = z.infer<typeof ResellerAccessChangedEventSchema>;
