import {
  DOMAIN_PAYLOAD_SCHEMAS,
} from '../domain-schemas.js';
import { makeReferenceAdapter } from './base.js';
import type { MockAdapter } from '../adapter.js';

/**
 * Reference mock — payment provider (checkout leg confirm → payout submitted
 * → paid). Payloads carry the DEPLOYED provider-webhook shape (top-level
 * amount/status — what shop-plus OrderSpine parses; E1-assembly alignment,
 * see domain-schemas.ts).
 */
export const referencePaymentProviderMock: MockAdapter = makeReferenceAdapter({
  domain: 'payment-provider',
  producerSchema: DOMAIN_PAYLOAD_SCHEMAS['payment-provider'],
  sequence: (seed) => {
    const payload = (collectRef: string, amount: number, status: 'held' | 'captured') => ({
      provider: 'sandbox-provider',
      payment_attempt_id: `payatt_${seed}`,
      collectRef,
      amount,
      fee: 0,
      status,
      order_id: `order_${seed}`,
      redelivery: 0,
    });
    return [
      { name: 'payment.checkout_leg_confirmed.v1', payload: payload(`collect_${seed}`, 12_500, 'held') },
      { name: 'payout.submitted.v1', payload: payload(`payout_${seed}`, 12_500, 'held') },
      { name: 'payout.paid.v1', payload: payload(`payout_${seed}`, 12_500, 'captured') },
    ];
  },
  projectionValue: (seed) => ({ orderId: `order_${seed}`, escrowStatus: 'held', legs: 1 }),
  invalidTransition: {
    from: 'refunded',
    to: 'held',
    reason: 'a refunded payment leg can never re-enter held — provider truth is final',
  },
});

/**
 * Reference mock — eligibility. Payloads carry the LIVE producer's shape
 * (sera CustodySpine: amount-free SE-I09 signal; E1-assembly alignment, see
 * domain-schemas.ts). The sequence is the at-least-once world: the signal
 * for three seeded orders.
 */
export const referenceEligibilityMock: MockAdapter = makeReferenceAdapter({
  domain: 'eligibility',
  producerSchema: DOMAIN_PAYLOAD_SCHEMAS.eligibility,
  sequence: (seed) => {
    const payload = (n: number) => ({
      order_id: `order_${seed}_${n}`,
      task_id: `task_${seed}_${n}`,
      validation_id: `val_${seed}_${n}`,
      result: 'validated' as const,
      settlement_eligibility: true as const,
    });
    return [
      { name: 'delivery.validated.v1', payload: payload(1) },
      { name: 'delivery.validated.v1', payload: payload(2) },
      { name: 'delivery.validated.v1', payload: payload(3) },
    ];
  },
  projectionValue: (seed) => ({ orderId: `order_${seed}`, obligationState: 'Eligible' }),
  invalidTransition: {
    from: 'Paid',
    to: 'Eligible',
    reason: 'a paid settlement obligation can never regress to eligible',
  },
});

/** Reference mock — supply projection (offer published → availability changes). */
export const referenceSupplyProjectionMock: MockAdapter = makeReferenceAdapter({
  domain: 'supply-projection',
  producerSchema: DOMAIN_PAYLOAD_SCHEMAS['supply-projection'],
  sequence: (seed) => {
    const payload = (available: number) => ({
      productVersionId: `pv_${seed}`,
      offerVersion: `offer_${seed}@1`,
      basePrice: 10_000,
      resellerCommission: 1_000,
      available,
    });
    return [
      { name: 'offer.published.v1', payload: payload(5) },
      { name: 'inventory.availability.changed.v1', payload: payload(4) },
      { name: 'inventory.adjusted.v1', payload: payload(4) },
    ];
  },
  projectionValue: (seed) => ({ productVersionId: `pv_${seed}`, available: 4 }),
  invalidTransition: {
    from: 'expired',
    to: 'active',
    reason: 'an expired offer version never reactivates — a change is a new version (B+I-04)',
  },
});

/** Reference mock — readiness signal (accepted → challenge issued → ready). */
export const referenceReadinessMock: MockAdapter = makeReferenceAdapter({
  domain: 'readiness',
  producerSchema: DOMAIN_PAYLOAD_SCHEMAS.readiness,
  sequence: (seed) => {
    const payload = (readinessConfirmed: boolean) => ({
      orderId: `order_${seed}`,
      packageId: `pkg_${seed}`,
      readinessConfirmed,
      at: '2026-07-09T10:00:00.000Z',
    });
    return [
      { name: 'fulfillment.accepted.v1', payload: payload(false) },
      { name: 'seller.readiness_challenge_issued.v1', payload: payload(false) },
      { name: 'fulfillment.ready.v1', payload: payload(true) },
    ];
  },
  projectionValue: (seed) => ({ orderId: `order_${seed}`, ready: true }),
  invalidTransition: {
    from: 'dispatched',
    to: 'ready',
    reason: 'a dispatched package never returns to ready — custody rules govern from pickup',
  },
});

export const REFERENCE_ADAPTERS: readonly MockAdapter[] = [
  referencePaymentProviderMock,
  referenceEligibilityMock,
  referenceSupplyProjectionMock,
  referenceReadinessMock,
];
