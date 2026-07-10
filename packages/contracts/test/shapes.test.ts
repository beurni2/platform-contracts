import { describe, expect, it } from 'vitest';
import { computeWaterfall } from '../src/money/waterfall.js';
import { QuoteSchema } from '../src/shapes/quote.js';
import { OrderSchema } from '../src/shapes/commerce.js';
import { ORDER_STATUSES } from '../src/enums.js';
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

describe('Order — the five-state E1 status enum (canon at v0.3.0)', () => {
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

  it('accepts exactly the five E1 statuses', () => {
    expect(ORDER_STATUSES).toEqual(['quote_issued', 'reserved', 'payment_pending', 'paid', 'confirmed']);
    for (const status of ORDER_STATUSES) {
      expect(OrderSchema.safeParse({ ...validOrder, status }).success).toBe(true);
    }
  });

  it.each(['shipped', 'delivered', 'failed', 'cancelled', 'refunded'])(
    'REFUSES a sixth status string at parse: %s (terminal/failure states are E2 work)',
    (status) => {
      const result = OrderSchema.safeParse({ ...validOrder, status });
      expect(result.success).toBe(false);
      expect(JSON.stringify(result.error?.issues)).toContain('invalid_value');
    },
  );
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
