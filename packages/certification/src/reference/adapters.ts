import {
  DOMAIN_PAYLOAD_SCHEMAS,
} from '../domain-schemas.js';
import { makeReferenceAdapter } from './base.js';
import type { MockAdapter } from '../adapter.js';

/** Reference mock — payment provider (checkout leg confirm → payout submitted → paid). */
export const referencePaymentProviderMock: MockAdapter = makeReferenceAdapter({
  domain: 'payment-provider',
  producerSchema: DOMAIN_PAYLOAD_SCHEMAS['payment-provider'],
  sequence: (seed) => {
    const payload = (status: 'held' | 'captured') => ({
      orderId: `order_${seed}`,
      paymentAttemptId: `payatt_${seed}`,
      leg: {
        legType: 'checkout' as const,
        collectRef: `collect_${seed}`,
        amount: 12_500,
        fee: 150,
        status,
      },
    });
    return [
      { name: 'payment.checkout_leg_confirmed.v1', payload: payload('held') },
      { name: 'payout.submitted.v1', payload: payload('held') },
      { name: 'payout.paid.v1', payload: payload('captured') },
    ];
  },
  projectionValue: (seed) => ({ orderId: `order_${seed}`, escrowStatus: 'held', legs: 1 }),
  invalidTransition: {
    from: 'refunded',
    to: 'held',
    reason: 'a refunded payment leg can never re-enter held — provider truth is final',
  },
});

/** Reference mock — eligibility (evidence → validated → supplier payable). */
export const referenceEligibilityMock: MockAdapter = makeReferenceAdapter({
  domain: 'eligibility',
  producerSchema: DOMAIN_PAYLOAD_SCHEMAS.eligibility,
  sequence: (seed) => {
    const payload = (state: 'Eligible' | 'Pending') => ({
      orderId: `order_${seed}`,
      validation: {
        taskId: `task_${seed}`,
        result: 'validated' as const,
        reasons: [],
      },
      obligation: {
        orderId: `order_${seed}`,
        party: 'supplier',
        amount: 8_500,
        state,
        holds: [],
      },
    });
    return [
      { name: 'delivery.evidence_submitted.v1', payload: payload('Pending') },
      { name: 'delivery.validated.v1', payload: payload('Pending') },
      { name: 'settlement.supplier_payable.v1', payload: payload('Eligible') },
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
