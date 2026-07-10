import { describe, expect, it } from 'vitest';
import { computeWaterfall } from '../src/money/waterfall.js';
import { QuoteSchema } from '../src/shapes/quote.js';
import { OrderSchema } from '../src/shapes/commerce.js';
import { DELIVERY_FAILURE_REASONS, DELIVERY_OUTCOME_FAMILIES, ORDER_STATUSES } from '../src/enums.js';
import { DeliveryOutcomeSchema } from '../src/shapes/custody.js';
import { EscrowTxnSchema, PaymentLegSchema } from '../src/shapes/settlement.js';
import { EventNameSchema } from '../src/events.js';
import {
  HandoffAuthorizationSchema,
  PackageReadinessConfirmationSchema,
} from '../src/shapes/custody.js';

function validQuote(): Record<string, unknown> {
  const money = computeWaterfall({
    sellerBasePrice: 10_000,
    sellerFundedCommission: 1_000,
    resellerMarkup: 1_500,
    deliveryFee: 1_000,
    paymentMode: 'FULL_PREPAY',
  });
  return {
    id: 'q_001',
    attributionResellerId: 'rs_001',
    paymentMode: money.paymentMode,
    sellerBasePrice: money.sellerBasePrice,
    sellerFundedCommission: money.sellerFundedCommission,
    resellerMarkup: money.resellerMarkup,
    productSubtotal: money.productSubtotal,
    deliveryFee: money.deliveryFee,
    buyerTotal: money.buyerTotal,
    amountPaidAtCheckout: money.amountPaidAtCheckout,
    amountDueAtDelivery: money.amountDueAtDelivery,
    sellerPlatformFee: money.sellerPlatformFee,
    sellerNet: money.sellerNet,
    resellerGrossEarnings: money.resellerGrossEarnings,
    resellerPlatformFee: money.resellerPlatformFee,
    resellerNet: money.resellerNet,
    platformProductFeeRevenue: money.platformProductFeeRevenue,
    paymentProcessingFeeEstimate: 150,
    taxFields: {},
    policyVersions: { settlementPolicyVersion: 'sp_v1', inspectionPolicyVersion: 'ip_v1' },
    expiry: '2026-07-09T12:00:00Z',
  };
}

describe('Quote — the frozen shape', () => {
  it('parses a reconciling canonical quote', () => {
    expect(QuoteSchema.safeParse(validQuote()).success).toBe(true);
  });

  it('accepts the optional Cercle reconciliation anchors (campaignId / campaignBenefit)', () => {
    const q = {
      ...validQuote(),
      campaignId: 'cmp_001',
      campaignBenefit: { type: 'delivery', customerShare: 400, campaignShare: 600 },
    };
    expect(QuoteSchema.safeParse(q).success).toBe(true);
  });

  it.each(['supplyMode', 'handlingClass', 'kittingSealId'])(
    'REJECTS %s on the Quote in any form (founder ruling 2026-07-08)',
    (forbiddenKey) => {
      const q = { ...validQuote(), [forbiddenKey]: 'ANYTHING' };
      const result = QuoteSchema.safeParse(q);
      expect(result.success).toBe(false);
      expect(JSON.stringify(result.error?.issues)).toContain('unrecognized_keys');
    },
  );

  it('rejects a quote missing a canonical money field', () => {
    const q = validQuote();
    delete q['platformProductFeeRevenue'];
    expect(QuoteSchema.safeParse(q).success).toBe(false);
  });

  it('rejects non-integer FCFA money fields', () => {
    const q = { ...validQuote(), buyerTotal: 12_500.5 };
    expect(QuoteSchema.safeParse(q).success).toBe(false);
  });
});

describe('Order — the eight-state status enum (five E1 at v0.3.0 + three derived E2 failure states at v0.5.0)', () => {
  const validOrder = {
    id: 'o_001',
    quoteId: 'q_001',
    productVersionId: 'pv_001',
    supplierId: 'sup_001',
    resellerId: 'rs_001',
    buyerPhoneRef: 'by_001',
    dropoff: {
      pin: { lat: 12.3714, lng: -1.5197 },
      zone: 'Ouaga 2000',
      landmark: 'En face de la pharmacie',
      directions: 'Portail vert',
      maskedRelay: 'relay_1',
    },
    reservationRef: 'rsv_001',
    escrowRef: 'esc_001',
    paymentMode: 'FULL_PREPAY',
    timestamps: { createdAt: '2026-07-09T10:00:00Z' },
  };

  it('accepts exactly the eight canon statuses (five E1 + three derived E2 failure states)', () => {
    expect(ORDER_STATUSES).toEqual([
      'quote_issued', 'reserved', 'payment_pending', 'paid', 'confirmed',
      'payment_failed', 'cancelled', 'refunded',
    ]);
    for (const status of ORDER_STATUSES) {
      expect(OrderSchema.safeParse({ ...validOrder, status }).success).toBe(true);
    }
  });

  it.each(['shipped', 'delivered', 'failed', 'returned', 'on_hold'])(
    'REFUSES a status outside the eight at parse: %s (incl. the SE-I10-banned generic failed)',
    (status) => {
      const result = OrderSchema.safeParse({ ...validOrder, status });
      expect(result.success).toBe(false);
      expect(JSON.stringify(result.error?.issues)).toContain('invalid_value');
    },
  );
});

describe('E2 failure-state taxonomy (canon at v0.5.0 — every name derived, E2-taxonomy.md)', () => {
  const validOutcome = {
    taskId: 'task_001',
    orderId: 'o_001',
    family: 'retry',
    reasonCode: 'honest_absence',
    humanReasonRef: 'delivery.reason.honest_absence',
    faultClass: 'buyer',
    attempt: { number: 1, at: '2026-07-10T10:00:00Z', windowExpiresAt: '2026-07-10T10:15:00Z' },
  };

  it('DeliveryOutcome parses for each SE6.1 family (retry/reschedule/return/incident)', () => {
    for (const family of ['retry', 'reschedule', 'return', 'incident']) {
      expect(DeliveryOutcomeSchema.safeParse({ ...validOutcome, family }).success).toBe(true);
    }
  });

  it('a GENERIC failed outcome is UNREPRESENTABLE (SE-I10): no member, parse refuses', () => {
    expect(DELIVERY_OUTCOME_FAMILIES).not.toContain('failed');
    const result = DeliveryOutcomeSchema.safeParse({ ...validOutcome, family: 'failed' });
    expect(result.success).toBe(false);
  });

  it('reason codes are exactly the §6.4 six plus provider_failure; unknown refuses', () => {
    expect(DELIVERY_FAILURE_REASONS).toEqual([
      'honest_absence', 'unusable_location', 'insufficient_balance',
      'change_of_mind', 'repeated_abuse', 'fraud', 'provider_failure',
    ]);
    expect(DeliveryOutcomeSchema.safeParse({ ...validOutcome, reasonCode: 'bad_luck' }).success).toBe(false);
  });

  it('EscrowTxn.status is the aggregator flow enum (collect→hold→split→payout + refunded); a bare string refuses', () => {
    const validEscrow = {
      orderId: 'o_001',
      provider: 'sandbox-provider',
      paymentLegs: [{ legType: 'checkout', collectRef: 'c_1', amount: 12500, fee: 0, status: 'held' }],
      splitBreakdown: {},
      payoutRefs: [],
    };
    for (const status of ['collect', 'hold', 'split', 'payout', 'refunded']) {
      expect(EscrowTxnSchema.safeParse({ ...validEscrow, status }).success).toBe(true);
    }
    expect(EscrowTxnSchema.safeParse({ ...validEscrow, status: 'released' }).success).toBe(false);
  });

  it("a payment-leg status outside held|captured|refunded refuses (incl. 'released' — no spec quote)", () => {
    const leg = { legType: 'checkout', collectRef: 'c_1', amount: 12500, fee: 0, status: 'released' };
    expect(PaymentLegSchema.safeParse(leg).success).toBe(false);
  });

  it('the three ops events are registered; a refund event name (not spec-listed) refuses', () => {
    for (const name of ['reconciliation.alert.v1', 'saga.stuck.v1', 'dlq.parked.v1']) {
      expect(EventNameSchema.safeParse(name).success).toBe(true);
    }
    expect(EventNameSchema.safeParse('refund.initiated.v1').success).toBe(false);
  });
});

describe('SupplyProjection — canonical single definition (promoted at v0.4.0)', () => {
  const valid = {
    productVersionId: 'pv_001',
    offerVersion: 'offer_001@1',
    basePrice: 10_000,
    resellerCommission: 1_000,
    available: 4,
  };

  it('parses the identity-free projection', async () => {
    const { SupplyProjectionSchema } = await import('../src/shapes/commerce.js');
    expect(SupplyProjectionSchema.safeParse(valid).success).toBe(true);
  });

  it.each(['supplierName', 'supplierPhone', 'pickupAddress', 'supplierContact'])(
    'REFUSES supplier identity/contact leak: %s (B4.2/SP-I03)',
    async (leak) => {
      const { SupplyProjectionSchema } = await import('../src/shapes/commerce.js');
      const result = SupplyProjectionSchema.safeParse({ ...valid, [leak]: 'x' });
      expect(result.success).toBe(false);
      expect(JSON.stringify(result.error?.issues)).toContain('unrecognized_keys');
    },
  );
});

describe('PackageReadinessConfirmation — readiness evidence carries only the readiness challenge', () => {
  const validReadiness = {
    orderId: 'o_001',
    photoRef: { ref: 'r2://evidence/photo1', sha256: 'a'.repeat(64), mimeType: 'image/jpeg' },
    readinessChallenge: 'RC-483920',
    qty: 1,
    variant: 'var_001',
    availableConfirmed: true,
    at: '2026-07-09T10:00:00Z',
  };

  it('parses valid readiness evidence', () => {
    expect(PackageReadinessConfirmationSchema.safeParse(validReadiness).success).toBe(true);
  });

  it('REJECTS buyerDropCode anywhere in readiness evidence (four-secrets separation)', () => {
    const poisoned = { ...validReadiness, buyerDropCode: '1234' };
    const result = PackageReadinessConfirmationSchema.safeParse(poisoned);
    expect(result.success).toBe(false);
    expect(JSON.stringify(result.error?.issues)).toContain('buyerDropCode');
  });
});

describe('HandoffAuthorization — payment-confirmed handoff', () => {
  const base = {
    orderId: 'o_001',
    riderId: 'rd_001',
    buyerRef: 'by_001',
    exactAmount: 10_779,
    providerTransactionReference: 'prov_tx_889',
    authorizedBy: 'op_001',
    authorizationExpiresAt: '2026-07-09T10:15:00Z',
    signature: 'sig_abc',
    state: 'issued',
  };

  it('accepts a provider_webhook authorization without a break-glass case', () => {
    const result = HandoffAuthorizationSchema.safeParse({
      ...base,
      authorizationSource: 'provider_webhook',
    });
    expect(result.success).toBe(true);
  });

  it('REJECTS break_glass without a breakGlassCaseId (mandatory incident review)', () => {
    const result = HandoffAuthorizationSchema.safeParse({
      ...base,
      authorizationSource: 'break_glass',
    });
    expect(result.success).toBe(false);
    expect(JSON.stringify(result.error?.issues)).toContain('breakGlassCaseId');
  });

  it('accepts break_glass with its case id', () => {
    const result = HandoffAuthorizationSchema.safeParse({
      ...base,
      authorizationSource: 'break_glass',
      breakGlassCaseId: 'bg_001',
      authorizationReason: 'dead zone — operator verified on provider interface',
    });
    expect(result.success).toBe(true);
  });
});
