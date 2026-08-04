import { describe, expect, it } from 'vitest';
import { computeWaterfall } from '../src/money/waterfall.js';
import { QuoteSchema } from '../src/shapes/quote.js';
import {
  OrderSchema,
  STOREFRONT_HEADER_STYLES,
  StorefrontHeaderStyleSchema,
  StorefrontPhotoFocusSchema,
  StorefrontSchema,
  UserSchema,
} from '../src/shapes/commerce.js';
import { DELIVERY_FAILURE_REASONS, DELIVERY_OUTCOME_FAMILIES, ORDER_STATUSES } from '../src/enums.js';
import { DeliveryOutcomeSchema } from '../src/shapes/custody.js';
import {
  EscrowTxnSchema,
  PaymentLegSchema,
  RelatedPartyDecisionSchema,
  RelatedPartySignalsSchema,
  SellerTrustStateSchema,
} from '../src/shapes/settlement.js';
import { EventNameSchema } from '../src/events.js';
import {
  HandoffAuthorizationSchema,
  PackageReadinessConfirmationSchema,
} from '../src/shapes/custody.js';
import { IdSchema, TrimmedNonEmptyString } from '../src/shapes/common.js';

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

  it('reason codes are the §6.4 six + provider_failure + conformity_mismatch (v0.9.0, A3/A4); unknown refuses', () => {
    expect(DELIVERY_FAILURE_REASONS).toEqual([
      'honest_absence', 'unusable_location', 'insufficient_balance',
      'change_of_mind', 'repeated_abuse', 'fraud', 'provider_failure', 'conformity_mismatch',
    ]);
    expect(DeliveryOutcomeSchema.safeParse({ ...validOutcome, reasonCode: 'conformity_mismatch' }).success).toBe(true);
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
    productName: 'Savon de karité', // display field (SUPPLY-DISPLAY-FIELDS-1)
    assetRefs: ['media/pv_001/hero.jpg', 'media/pv_001/detail-1.jpg'],
    category: 'sealed_beauty_cosmetics', // display field (CATEGORY-WIRE-1, v3.0.0)
  };

  it('parses the identity-free projection with its display fields', async () => {
    const { SupplyProjectionSchema } = await import('../src/shapes/commerce.js');
    const parsed = SupplyProjectionSchema.safeParse(valid);
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.productName).toBe('Savon de karité');
      expect(parsed.data.assetRefs).toEqual(['media/pv_001/hero.jpg', 'media/pv_001/detail-1.jpg']);
      expect(parsed.data.category).toBe('sealed_beauty_cosmetics');
    }
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

  it('display fields are REQUIRED, not optional (no economics without a name/images/category)', async () => {
    const { SupplyProjectionSchema } = await import('../src/shapes/commerce.js');
    const { productName: _n, ...noName } = valid;
    const { assetRefs: _a, ...noAssets } = valid;
    // CATEGORY-WIRE-1: required for the same reason as the other two, plus one
    // of its own — an OPTIONAL category degrades silently (Option B refuses and
    // the cautious §6.2 row renders, both invisible), so a producer that forgot
    // would be indistinguishable from a genuinely uninspectable product. This
    // assertion is what makes a stale producer fail loudly at the schema.
    const { category: _c, ...noCategory } = valid;
    expect(SupplyProjectionSchema.safeParse(noName).success).toBe(false);
    expect(SupplyProjectionSchema.safeParse(noAssets).success).toBe(false);
    expect(SupplyProjectionSchema.safeParse(noCategory).success).toBe(false);
  });

  it('SELLER-TIER-WIRE-1 — `sellerTier` is OPTIONAL (an older producer still parses) and ENUM-CLOSED', async () => {
    const { SupplyProjectionSchema } = await import('../src/shapes/commerce.js');
    // OPTIONAL is the whole point: a producer that predates v3.1.0 sends nothing
    // and must still parse, so this field costs no coordinated deploy. Absent
    // then means §6.1 cannot prove « tier >= verified » and refuses Option B —
    // which is what §6.1 already prescribes for any unprovable condition.
    expect(SupplyProjectionSchema.safeParse(valid).success).toBe(true);
    for (const tier of ['provisional', 'verified', 'trusted']) {
      expect(SupplyProjectionSchema.safeParse({ ...valid, sellerTier: tier }).success, tier).toBe(true);
    }
    // CLOSED, unlike `category` — and the asymmetry is deliberate. Canon FIXES
    // the three tiers (§5.6 SellerTrustState) while the category floor is an
    // open founder decision, so a tier canon has never heard of is a defect and
    // a category canon has never heard of is normal. Note `toString`: an
    // unguarded object-literal lookup treated exactly that as a real tier and
    // bypassed the §6.1 gate in shop-plus. The schema now refuses it upstream.
    for (const bad of ['toString', '__proto__', 'constructor', 'VERIFIED', 'pas-un-palier', '']) {
      expect(SupplyProjectionSchema.safeParse({ ...valid, sellerTier: bad }).success, `tier '${bad}'`).toBe(false);
    }
    expect(SupplyProjectionSchema.safeParse({ ...valid, sellerTier: null }).success).toBe(false);
  });

  it('category follows the display-string class and accepts ANY value — no taxonomy is encoded here', async () => {
    const { SupplyProjectionSchema } = await import('../src/shapes/commerce.js');
    // Trimmed-non-empty, exactly like ProductVersionSchema.category.
    expect(SupplyProjectionSchema.safeParse({ ...valid, category: '   ' }).success).toBe(false);
    expect(SupplyProjectionSchema.safeParse({ ...valid, category: '' }).success).toBe(false);
    expect(SupplyProjectionSchema.safeParse({ ...valid, category: 42 }).success).toBe(false);
    // AND THE POINT OF THE FIELD: canon holds no category floor (« the
    // category-floor taxonomy [is a] FOUNDER DECISION », StorefrontSchema), so a
    // category canon has never heard of must still PARSE. Consumers allowlist
    // and fail closed; the schema does not get to pre-empt the founder.
    for (const unknown of ['shoes', 'electronics', 'mode', 'un-truc-tout-neuf']) {
      expect(SupplyProjectionSchema.safeParse({ ...valid, category: unknown }).success).toBe(true);
    }
  });

  it('productName follows the name-class (trimmed non-empty) — whitespace-only refused', async () => {
    const { SupplyProjectionSchema } = await import('../src/shapes/commerce.js');
    expect(SupplyProjectionSchema.safeParse({ ...valid, productName: '   ' }).success).toBe(false);
    expect(SupplyProjectionSchema.safeParse({ ...valid, productName: '' }).success).toBe(false);
  });

  it('assetRefs is a required array that may be empty (a product mid-capture has no images yet), refuses non-array + empty-string ref', async () => {
    const { SupplyProjectionSchema, AssetRefSchema } = await import('../src/shapes/commerce.js');
    expect(SupplyProjectionSchema.safeParse({ ...valid, assetRefs: [] }).success).toBe(true); // required-but-may-be-empty
    expect(SupplyProjectionSchema.safeParse({ ...valid, assetRefs: 'x' }).success).toBe(false); // not an array
    expect(SupplyProjectionSchema.safeParse({ ...valid, assetRefs: [''] }).success).toBe(false); // AssetRef .min(1)
    expect(AssetRefSchema.safeParse('').success).toBe(false);
    expect(AssetRefSchema.safeParse('media/pv_001/hero.jpg').success).toBe(true);
  });

  it('DOCUMENTED GAP (SUPPLY-DISPLAY-FIELDS-1 item 4): canon cannot value-detect supplier identity in an assetRef — a supplier-keyed URL PARSES here; enforcement is the producer out-guard, which holds supplierId', async () => {
    const { AssetRefSchema } = await import('../src/shapes/commerce.js');
    // This is NOT an endorsement — it makes the enforcement boundary a visible test
    // fact. SupplyProjection never carries supplierId and supplierId has no canon
    // format, so a value refine here would invent a pattern (§7). The producer,
    // which holds ProductVersion.supplierId, must reject this before serving.
    expect(AssetRefSchema.safeParse('https://media/suppliers/sup_123/cover.jpg').success).toBe(true);
  });
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
    authorizedBy: 'ops:payment:op1', // WO-5.12: authorizedBy is now an ops:payment:* actor (was 'op_001')
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

  // WO-5.12 — authorizedBy is the ISSUER (« ÉMIS PAR — payment operator ») half:
  // only an ops:payment:* actor may issue. Allow-list, both directions.
  it('accepts a valid ops:payment:* issuer (the payment-operator half)', () => {
    const result = HandoffAuthorizationSchema.safeParse({
      ...base,
      authorizationSource: 'provider_webhook',
      authorizedBy: 'ops:payment:desk-1',
    });
    expect(result.success).toBe(true);
  });

  it.each([
    ['supplier:aicha', 'a supplier actor'],
    ['logistics-service:dispatch', "the dispatcher (sera's real literal — VÉRIFIÉ PAR half, may not issue)"],
    ['ops:moderation:x', 'a moderation operator (wrong domain)'],
    ['ops:payment:', 'an empty-suffix ops:payment: (no operator id)'],
  ])('REJECTS a non-ops:payment:* issuer: %s (%s)', (authorizedBy) => {
    const result = HandoffAuthorizationSchema.safeParse({
      ...base,
      authorizationSource: 'provider_webhook',
      authorizedBy,
    });
    expect(result.success).toBe(false);
    // the ONLY failing field is authorizedBy — the source/leg are valid
    expect(JSON.stringify(result.error?.issues)).toContain('authorizedBy');
    expect(JSON.stringify(result.error?.issues)).toContain('ops:payment:* actor');
  });
});

describe('probationLimits — closed to the spec-named limits at v0.7.0 (zero-deposit at the type boundary)', () => {
  const validTrustState = (probationLimits: Record<string, unknown>) => ({
    sellerId: 's_001',
    tier: 'provisional' as const,
    faultCount: 0,
    restrictions: ['fullPrepayOnly'],
    probationLimits,
  });

  it('accepts exactly the six spec-named limit keys (Boutik:31–35)', () => {
    const result = SellerTrustStateSchema.safeParse(
      validTrustState({
        maxActiveOrders: 1,
        maxOrderValueFcfa: 25_000,
        maxOrderQuantity: 3,
        approvedCategoriesOnly: true,
        fullPrepayOnly: true,
        everyPickupVerified: true,
      }),
    );
    expect(result.success).toBe(true);
  });

  it('accepts an empty limits record and any subset (limits vary by tier)', () => {
    expect(SellerTrustStateSchema.safeParse(validTrustState({})).success).toBe(true);
    expect(SellerTrustStateSchema.safeParse(validTrustState({ maxActiveOrders: 3 })).success).toBe(true);
  });

  it('REFUSES a deposit-class money key — B+I-12 zero-deposit enforced at parse', () => {
    for (const depositKey of ['requiredDeposit', 'reserve', 'caution', 'bond', 'sellerNet']) {
      const result = SellerTrustStateSchema.safeParse(validTrustState({ [depositKey]: 5_000 }));
      expect(result.success, `${depositKey} must refuse`).toBe(false);
      expect(JSON.stringify(result.error?.issues)).toContain(depositKey);
    }
  });

  it('REFUSES any unknown key (strict) and a wrong-typed named limit', () => {
    expect(SellerTrustStateSchema.safeParse(validTrustState({ someFutureLimit: true })).success).toBe(false);
    // maxOrderValueFcfa is a ceiling but still a proper FCFA integer ≥ 0
    expect(SellerTrustStateSchema.safeParse(validTrustState({ maxOrderValueFcfa: -1 })).success).toBe(false);
    expect(SellerTrustStateSchema.safeParse(validTrustState({ maxOrderValueFcfa: 25_000.5 })).success).toBe(false);
    expect(SellerTrustStateSchema.safeParse(validTrustState({ maxActiveOrders: 'one' })).success).toBe(false);
  });
});

describe('Storefront — Seller #001 aggregate fields (WO-5.13, additive)', () => {
  const valid = (): Record<string, unknown> => ({
    id: 'sf_001',
    resellerId: 'rs_001',
    slug: 'chez-aicha',
    discoverable: true,
    curatedItems: ['lst_001'],
    name: 'Chez Aïcha',
    zone: 'Rood Woko, Ouagadougou',
    category: 'Cosmétiques',
    createdAt: '2026-07-13T09:00:00Z',
    updatedAt: '2026-07-13T09:00:00Z',
  });

  it('accepts a fully-populated storefront (both directions: valid parses)', () => {
    expect(StorefrontSchema.safeParse(valid()).success).toBe(true);
  });

  it('REJECTS an empty name (min 1)', () => {
    const r = StorefrontSchema.safeParse({ ...valid(), name: '' });
    expect(r.success).toBe(false);
    expect(JSON.stringify(r.error?.issues)).toContain('name');
  });

  it('REJECTS a name past the boundary guard (max 120)', () => {
    const r = StorefrontSchema.safeParse({ ...valid(), name: 'x'.repeat(121) });
    expect(r.success).toBe(false);
    expect(JSON.stringify(r.error?.issues)).toContain('name');
  });

  it.each(['createdAt', 'updatedAt', 'zone', 'category'])('REJECTS a missing required field: %s', (field) => {
    const obj = valid();
    delete obj[field];
    const r = StorefrontSchema.safeParse(obj);
    expect(r.success).toBe(false);
    expect(JSON.stringify(r.error?.issues)).toContain(field);
  });

  it('REJECTS a stray field under .strict()', () => {
    const r = StorefrontSchema.safeParse({ ...valid(), reputationScore: 5 });
    expect(r.success).toBe(false);
  });

  it('leaves the pre-existing fields intact (additive — old required fields still enforced)', () => {
    // discoverable was already required; still is (not re-added, not loosened).
    const obj = valid();
    delete obj.discoverable;
    expect(StorefrontSchema.safeParse(obj).success).toBe(false);
  });
});

// WO-VITRINE — the storefront profile contract (Vitrine HANDOFF §3.1). Seven
// net-new fields, all additive + defaulted; every limit below is the §3.1 value
// verbatim. `name`/`zone` divergences are deliberate and recorded in
// docs/derivations/VITRINE-STOREFRONT.md — NOT retested here beyond WO-5.13.
describe('Storefront — profile fields (WO-VITRINE, §3.1, additive + defaulted)', () => {
  const valid = (): Record<string, unknown> => ({
    id: 'sf_001',
    resellerId: 'rs_001',
    slug: 'aicha-4821',
    discoverable: true,
    curatedItems: ['p1', 'p2', 'p3'],
    name: 'Chez Aïcha Mode',
    zone: 'Gounghin, Ouagadougou',
    category: 'Mode',
    createdAt: '2026-07-15T09:00:00Z',
    updatedAt: '2026-07-15T09:00:00Z',
  });

  it('a PRE-EXISTING storefront (no profile fields) still parses — §3.1 defaults applied', () => {
    const r = StorefrontSchema.safeParse(valid());
    expect(r.success).toBe(true);
    if (r.success) {
      expect(r.data.tagline).toBe(''); // défaut ""
      expect(r.data.bio).toBe(''); // défaut ""
      expect(r.data.cover).toEqual({ status: 'none' }); // défaut none
      expect(r.data.avatar).toEqual({ mode: 'monogram' }); // défaut monogram
      expect(r.data.theme).toBe('laterite'); // défaut 'laterite'
      expect(r.data.sections).toEqual([]); // défaut []
      expect(r.data.featuredItems).toEqual([]); // défaut []
    }
  });

  it('accepts a fully-personalised storefront (V2 shape: theme, cover live, 2 featured, sections)', () => {
    const r = StorefrontSchema.safeParse({
      ...valid(),
      tagline: 'Le wax et le cuir, choisis à la main',
      bio: 'Je choisis chaque pièce moi-même, pour vous.',
      cover: { status: 'live', url: 'https://cdn/x.jpg' },
      avatar: { mode: 'photo', url: 'https://cdn/a.jpg' },
      theme: 'indigo',
      sections: [
        { id: 's1', name: 'Mode & tissus', pids: ['p2', 'p7'] },
        { id: 's2', name: 'Sacs', pids: ['p4'] },
      ],
      featuredItems: ['p1', 'p5'],
    });
    expect(r.success).toBe(true);
  });

  it('tagline max 40 · bio max 160 (boundary accepted, boundary+1 refused)', () => {
    expect(StorefrontSchema.safeParse({ ...valid(), tagline: 'x'.repeat(40) }).success).toBe(true);
    expect(StorefrontSchema.safeParse({ ...valid(), tagline: 'x'.repeat(41) }).success).toBe(false);
    expect(StorefrontSchema.safeParse({ ...valid(), bio: 'x'.repeat(160) }).success).toBe(true);
    expect(StorefrontSchema.safeParse({ ...valid(), bio: 'x'.repeat(161) }).success).toBe(false);
  });

  it('theme is the CLOSED four-preset set — a fifth theme refuses (« aucun sélecteur libre »)', () => {
    for (const t of ['laterite', 'danfani', 'indigo', 'foret']) {
      expect(StorefrontSchema.safeParse({ ...valid(), theme: t }).success).toBe(true);
    }
    expect(StorefrontSchema.safeParse({ ...valid(), theme: 'bogolan' }).success).toBe(false);
    expect(StorefrontSchema.safeParse({ ...valid(), theme: '#FF0000' }).success).toBe(false);
  });

  it('cover carries the five C-K4 states and refuses a generic sixth', () => {
    for (const s of ['none', 'uploading', 'pending', 'live', 'error']) {
      expect(StorefrontSchema.safeParse({ ...valid(), cover: { status: s } }).success).toBe(true);
    }
    expect(StorefrontSchema.safeParse({ ...valid(), cover: { status: 'failed' } }).success).toBe(false);
    // .strict() inside the sub-object too
    expect(
      StorefrontSchema.safeParse({ ...valid(), cover: { status: 'live', url: 'https://cdn/x.jpg', width: 1206 } })
        .success,
    ).toBe(false);
  });

  it('avatar is monogram|photo, nothing else', () => {
    expect(StorefrontSchema.safeParse({ ...valid(), avatar: { mode: 'photo', url: 'https://cdn/a.jpg' } }).success).toBe(true);
    expect(StorefrontSchema.safeParse({ ...valid(), avatar: { mode: 'initials' } }).success).toBe(false);
  });

  it('featuredItems: the curatedItems primitive + the ≤2 cap (2 ok, 3 refused, order preserved)', () => {
    const two = StorefrontSchema.safeParse({ ...valid(), featuredItems: ['p5', 'p1'] });
    expect(two.success).toBe(true);
    if (two.success) expect(two.data.featuredItems).toEqual(['p5', 'p1']); // ordre = ordre d'épinglage
    expect(StorefrontSchema.safeParse({ ...valid(), featuredItems: ['a', 'b', 'c'] }).success).toBe(false);
    // same id primitive as curatedItems: whitespace-only id refused in both
    expect(StorefrontSchema.safeParse({ ...valid(), featuredItems: ['  '] }).success).toBe(false);
    expect(StorefrontSchema.safeParse({ ...valid(), curatedItems: ['  '] }).success).toBe(false);
  });

  it('sections: ≤4 (4 ok, 5 refused) · name 1–20 · empty pids legal (invisible buyer-side, §6)', () => {
    const four = [1, 2, 3, 4].map((i) => ({ id: `s${i}`, name: `Section ${i}`, pids: [] }));
    expect(StorefrontSchema.safeParse({ ...valid(), sections: four }).success).toBe(true);
    const five = [...four, { id: 's5', name: 'Section 5', pids: [] }];
    expect(StorefrontSchema.safeParse({ ...valid(), sections: five }).success).toBe(false);
    // boundary ACCEPTED too (verifier flag) — 20 ok, 21 refused
    expect(
      StorefrontSchema.safeParse({ ...valid(), sections: [{ id: 's1', name: 'x'.repeat(20), pids: [] }] }).success,
    ).toBe(true);
    expect(
      StorefrontSchema.safeParse({ ...valid(), sections: [{ id: 's1', name: 'x'.repeat(21), pids: [] }] }).success,
    ).toBe(false);
    expect(
      StorefrontSchema.safeParse({ ...valid(), sections: [{ id: 's1', name: '   ', pids: [] }] }).success,
    ).toBe(false);
  });

  it('« un pid vit dans ≤ 1 section » — a pid in two sections REFUSES, with the section path named', () => {
    const r = StorefrontSchema.safeParse({
      ...valid(),
      sections: [
        { id: 's1', name: 'Mode', pids: ['p1', 'p2'] },
        { id: 's2', name: 'Sacs', pids: ['p2'] },
      ],
    });
    expect(r.success).toBe(false);
    expect(JSON.stringify(r.error?.issues)).toContain('at most one section');
    // same pid twice in the SAME section is also a duplicate across the map — refused
    const same = StorefrontSchema.safeParse({
      ...valid(),
      sections: [{ id: 's1', name: 'Mode', pids: ['p1', 'p1'] }],
    });
    expect(same.success).toBe(false);
  });

  // ENTETES-B (founder-authorized 2026-07-28) — the header style, additive + defaulted.
  it('a PRE-EXISTING storefront (no headerStyle) still parses — défaut « classique »', () => {
    const r = StorefrontSchema.safeParse(valid());
    expect(r.success).toBe(true);
    if (r.success) expect(r.data.headerStyle).toBe('classique');
  });

  // ENTETES-H (founder-authorized 2026-07-31) — séries 2/3/5 append twenty
  // buyer-render styles AFTER the eleven. ORDER AND NAMES ARE PINNED: this
  // list is the wire contract three repos agree on, and an accidental
  // reordering would silently repoint every stored storefront's header.
  it('headerStyle is the CLOSED thirty-one-header set — each key accepted, an unknown one refuses (theme precedent)', () => {
    expect(STOREFRONT_HEADER_STYLES).toEqual([
      'classique',
      'royale',
      'heritage',
      'chaleureux',
      'cristal',
      'dynamique',
      'masque',
      'harmattan',
      'balafon',
      'seance',
      'cauris',
      'indigo',
      'couture',
      'safran',
      'grenat',
      'kraft',
      'audace',
      'fleurie',
      'prisme',
      'pop',
      'chrome',
      'neon',
      'perle',
      'artisan',
      'braise',
      'graffiti',
      'dunda',
      'karite',
      'bronze',
      'calebasse',
      'pagne',
      // ENTETES-L — série 8 « luxe » (2) + série 9 « éditions » (4)
      'fildor',
      'bazin',
      'couverture',
      'billet',
      'enseigne',
      'hologramme',
      // ENTETES-M — série 10 « féminines » + série 11 « jardins ».
      'dentelle',
      'bougain',
      'flamboyant',
      'hibiscus',
      'papillons',
      'guirlande',
    ]);
    // ADDITIVE, PROVEN: the eleven that already shipped keep their exact
    // positions, so a stored value can never come back as a different header.
    expect(STOREFRONT_HEADER_STYLES.slice(0, 11)).toEqual([
      'classique', 'royale', 'heritage', 'chaleureux', 'cristal', 'dynamique',
      'masque', 'harmattan', 'balafon', 'seance', 'cauris',
    ]);
    expect(new Set(STOREFRONT_HEADER_STYLES).size).toBe(43);
    // ASCII keys are canon — « karité » and « néon » must never reach the wire
    for (const k of STOREFRONT_HEADER_STYLES) expect(k).toMatch(/^[a-z]+$/);
    for (const h of STOREFRONT_HEADER_STYLES) {
      const r = StorefrontSchema.safeParse({ ...valid(), headerStyle: h });
      expect(r.success).toBe(true);
      if (r.success) expect(r.data.headerStyle).toBe(h);
    }
    expect(StorefrontSchema.safeParse({ ...valid(), headerStyle: 'baroque' }).success).toBe(false);
    expect(StorefrontSchema.safeParse({ ...valid(), headerStyle: '' }).success).toBe(false);
    expect(StorefrontSchema.safeParse({ ...valid(), headerStyle: 'CLASSIQUE' }).success).toBe(false);
    expect(StorefrontSchema.safeParse({ ...valid(), headerStyle: 'MASQUE' }).success).toBe(false);
    // ASCII keys are canon — the accented spelling is NOT a key.
    expect(StorefrontSchema.safeParse({ ...valid(), headerStyle: 'séance' }).success).toBe(false);
    expect(StorefrontHeaderStyleSchema.safeParse('royale').success).toBe(true);
    expect(StorefrontHeaderStyleSchema.safeParse('cauris').success).toBe(true);
    expect(StorefrontHeaderStyleSchema.safeParse('bogolan').success).toBe(false);
  });

  // ENTETES-C (founder-authorized 2026-07-28) — her framing, additive + optional.
  it('a photo WITHOUT focus still parses — no framing means the style default, absent stays absent', () => {
    const r = StorefrontSchema.safeParse({ ...valid(), cover: { status: 'live', url: 'https://cdn/x.jpg' } });
    expect(r.success).toBe(true);
    if (r.success) expect(r.data.cover.focus).toBeUndefined();
  });

  it('focus is a COMPLETE integer pair 0–100 on cover and avatar — bounds accepted, everything else refused', () => {
    for (const focus of [{ x: 0, y: 0 }, { x: 100, y: 100 }, { x: 42, y: 28 }]) {
      const cover = StorefrontSchema.safeParse({ ...valid(), cover: { status: 'live', url: 'https://cdn/x.jpg', focus } });
      expect(cover.success).toBe(true);
      if (cover.success) expect(cover.data.cover.focus).toEqual(focus);
      const avatar = StorefrontSchema.safeParse({ ...valid(), avatar: { mode: 'photo', url: 'https://cdn/a.jpg', focus } });
      expect(avatar.success).toBe(true);
      if (avatar.success) expect(avatar.data.avatar.focus).toEqual(focus);
    }
    const cov = (focus: unknown) =>
      StorefrontSchema.safeParse({ ...valid(), cover: { status: 'live', url: 'https://cdn/x.jpg', focus } }).success;
    expect(cov({ x: 50 })).toBe(false); // a lone axis is unrepresentable
    expect(cov({ y: 50 })).toBe(false);
    expect(cov({ x: -1, y: 50 })).toBe(false);
    expect(cov({ x: 50, y: 101 })).toBe(false);
    expect(cov({ x: 50.5, y: 50 })).toBe(false); // integers only — byte-stable wire
    expect(cov({ x: '50', y: '50' })).toBe(false);
    expect(cov({ x: 50, y: 50, z: 50 })).toBe(false); // .strict() inside the pair
    expect(StorefrontPhotoFocusSchema.safeParse({ x: 58, y: 30 }).success).toBe(true);
    expect(StorefrontPhotoFocusSchema.safeParse({}).success).toBe(false);
  });
});

// WO-5.14 — the whitespace tightening (founder ruling 2026-07-15). Id-class and
// name-class / display strings are trimmed non-empty: whitespace-only AND
// surrounding-whitespace values are refused; internal whitespace is preserved.
describe('WO-5.14 — trimmed-non-empty (IdSchema + name/zone/category)', () => {
  const REFUSE = ['', ' ', '  ', '\t', '\n', ' x', 'x ', ' Chez', 'Aïcha ', '\tx'];
  const ACCEPT = ['q_001', 'sf_001', 'Chez Aïcha', 'Rood Woko, Ouagadougou', 'Cosmétiques', 'a\nb'];

  it.each(ACCEPT)('IdSchema / TrimmedNonEmptyString ACCEPTS a clean value: %j', (v) => {
    expect(IdSchema.safeParse(v).success).toBe(true);
    expect(TrimmedNonEmptyString.safeParse(v).success).toBe(true);
  });

  it.each(REFUSE)('IdSchema / TrimmedNonEmptyString REFUSES a whitespace-only/untrimmed value: %j', (v) => {
    expect(IdSchema.safeParse(v).success).toBe(false);
    expect(TrimmedNonEmptyString.safeParse(v).success).toBe(false);
  });

  const validStorefront = () => ({
    id: 'sf_001',
    resellerId: 'rs_001',
    slug: 'chez-aicha',
    discoverable: true,
    curatedItems: ['lst_001'],
    name: 'Chez Aïcha',
    zone: 'Rood Woko, Ouagadougou',
    category: 'Cosmétiques',
    createdAt: '2026-07-15T09:00:00Z',
    updatedAt: '2026-07-15T09:00:00Z',
  });

  it('the tightening reaches real shape fields — a whitespace-only id / name / zone / category is refused ON that field', () => {
    for (const field of ['id', 'resellerId', 'name', 'zone', 'category'] as const) {
      for (const bad of [' ', '\t', '']) {
        const obj = { ...validStorefront(), [field]: bad };
        const r = StorefrontSchema.safeParse(obj);
        expect(r.success).toBe(false);
        expect(JSON.stringify(r.error?.issues)).toContain(field);
      }
    }
  });

  it('internal whitespace is preserved (a name/zone with internal spaces still parses)', () => {
    expect(StorefrontSchema.safeParse(validStorefront()).success).toBe(true);
  });

  // The tightening lives in @platform/kernel-types (UserId, PhoneAlias, Location.zone/
  // landmark) and must reach shapes typed by them: User.id, User.phoneAlias.alias,
  // Order.dropoff.zone/landmark. (UserId/PhoneAlias serialize opaquely in the snapshot
  // because of their brand `.transform`, so this behavioural test is their drift-lock.)
  const validUser = () => ({
    id: 'u_001',
    phoneAlias: { alias: '+22670000000', verified: true, unique: true as const },
    roles: { supplier: false, reseller: true, buyer: false },
    trustState: 'provisional',
  });
  const validOrder = () => ({
    id: 'o_001', quoteId: 'q_001', productVersionId: 'pv_001', supplierId: 'sup_001',
    resellerId: 'rs_001', buyerPhoneRef: 'by_001',
    dropoff: { pin: { lat: 12.3714, lng: -1.5197 }, zone: 'Ouaga 2000', landmark: 'En face de la pharmacie', directions: 'Portail vert', maskedRelay: 'relay_1' },
    reservationRef: 'rsv_001', escrowRef: 'esc_001', paymentMode: 'FULL_PREPAY', status: 'confirmed',
    timestamps: { createdAt: '2026-07-15T10:00:00Z' },
  });

  it('kernel-types id/identity tightening reaches User.id and User.phoneAlias.alias', () => {
    expect(UserSchema.safeParse(validUser()).success).toBe(true);
    for (const bad of [' ', '\t', '', ' u', 'u ']) {
      expect(UserSchema.safeParse({ ...validUser(), id: bad }).success).toBe(false);
      expect(UserSchema.safeParse({ ...validUser(), phoneAlias: { alias: bad, verified: true, unique: true } }).success).toBe(false);
    }
  });

  it('kernel-types display tightening reaches Order.dropoff.zone and .landmark (the delivery-route zone)', () => {
    expect(OrderSchema.safeParse(validOrder()).success).toBe(true);
    for (const field of ['zone', 'landmark'] as const) {
      for (const bad of [' ', '\t', '', ' x', 'x ']) {
        const obj = { ...validOrder(), dropoff: { ...validOrder().dropoff, [field]: bad } };
        expect(OrderSchema.safeParse(obj).success).toBe(false);
      }
    }
  });
});

describe('VIDEO-PRODUIT (v3.4.0) — one short product video, the founder’s own 6-second bound', () => {
  const mref = (ref: string) => ({ ref, sha256: 'a'.repeat(64), mimeType: 'image/jpeg' });
  const video = { ref: 'media/pv_001/video.mp4', sha256: 'b'.repeat(64), mimeType: 'video/mp4', durationSec: 6 };
  const assets = {
    masterRef: mref('private/device/abc'),
    heroSquare: mref('media/pv_001/hero-sq.jpg'),
    heroVertical: mref('media/pv_001/hero-v.jpg'),
    proof: mref('media/pv_001/proof.jpg'),
    detail: [mref('media/pv_001/detail-1.jpg')],
    hashes: ['a'.repeat(64)],
    processingVersion: 'premium-frame.v1',
  };

  it('the bound REFUSES at parse time, everywhere the shape travels — not in one screen’s goodwill', async () => {
    const { ProductVideoRefSchema } = await import('../src/shapes/commerce.js');
    expect(ProductVideoRefSchema.safeParse(video).success).toBe(true);
    expect(ProductVideoRefSchema.safeParse({ ...video, durationSec: 1 }).success).toBe(true);
    for (const bad of [7, 0, -1, 5.5, Number.NaN]) {
      expect(ProductVideoRefSchema.safeParse({ ...video, durationSec: bad }).success, `durationSec ${bad}`).toBe(false);
    }
    const { durationSec: _d, ...noDuration } = video;
    expect(ProductVideoRefSchema.safeParse(noDuration).success).toBe(false); // an unbounded video is unrepresentable
    expect(ProductVideoRefSchema.safeParse({ ...video, extra: 'x' }).success).toBe(false); // strict
  });

  it('ProductAssets: the video is OPTIONAL and additive — every pre-v3.4.0 product still parses', async () => {
    const { ProductAssetsSchema } = await import('../src/shapes/commerce.js');
    expect(ProductAssetsSchema.safeParse(assets).success).toBe(true); // yesterday’s shape, byte-for-byte
    const withVideo = ProductAssetsSchema.safeParse({ ...assets, video });
    expect(withVideo.success).toBe(true);
    if (withVideo.success) expect(withVideo.data.video?.durationSec).toBe(6);
    // …and the bound travels INSIDE the assets — a 7 s video cannot ride in.
    expect(ProductAssetsSchema.safeParse({ ...assets, video: { ...video, durationSec: 7 } }).success).toBe(false);
  });

  it('SupplyProjection: `videoRef` is an OPTIONAL bare display ref, same class as assetRefs', async () => {
    const { SupplyProjectionSchema } = await import('../src/shapes/commerce.js');
    const valid = {
      productVersionId: 'pv_001',
      offerVersion: 'offer_001@1',
      basePrice: 10_000,
      resellerCommission: 1_000,
      available: 4,
      productName: 'Savon de karité',
      assetRefs: ['media/pv_001/hero.jpg'],
      category: 'sealed_beauty_cosmetics',
    };
    expect(SupplyProjectionSchema.safeParse(valid).success).toBe(true); // an older producer still parses
    const withVideo = SupplyProjectionSchema.safeParse({ ...valid, videoRef: 'media/pv_001/video.mp4' });
    expect(withVideo.success).toBe(true);
    if (withVideo.success) expect(withVideo.data.videoRef).toBe('media/pv_001/video.mp4');
    expect(SupplyProjectionSchema.safeParse({ ...valid, videoRef: '' }).success).toBe(false); // a ref is never blank
  });
});

describe('VOIX-PRODUIT (v3.5.0) — her recorded note about one product', () => {
  const sf = (): Record<string, unknown> => ({
    id: 'sf_001',
    resellerId: 'rs_001',
    slug: 'chez-aicha',
    discoverable: true,
    curatedItems: ['lst_001'],
    name: 'Chez Aïcha',
    zone: 'Rood Woko, Ouagadougou',
    category: 'Cosmétiques',
    createdAt: '2026-07-13T09:00:00Z',
    updatedAt: '2026-07-13T09:00:00Z',
  });

  it('ADDITIVE AND DEFAULTED — every pre-v3.5.0 storefront parses unchanged, as « aucune note »', () => {
    // This is the whole safety claim of the field, so it is asserted on the
    // shape that existed BEFORE it: yesterday's bytes, today's schema.
    const r = StorefrontSchema.safeParse(sf());
    expect(r.success).toBe(true);
    if (r.success) expect(r.data.productNotes).toEqual({});
  });

  it('two wire states and no others — `recording`/`recorded` never leave the phone', async () => {
    const { StorefrontVoiceNoteSchema } = await import('../src/shapes/commerce.js');
    expect(StorefrontVoiceNoteSchema.safeParse({ status: 'pending', durationMs: 0 }).success).toBe(true);
    expect(
      StorefrontVoiceNoteSchema.safeParse({ status: 'ready', url: 'https://m/x.m4a', durationMs: 8_000 }).success,
    ).toBe(true);
    // The three phone-side states are UNREPRESENTABLE on the wire. A service
    // that stored `recording` would be claiming a take that does not exist.
    for (const bad of ['none', 'recording', 'recorded', 'live', '']) {
      expect(StorefrontVoiceNoteSchema.safeParse({ status: bad, durationMs: 0 }).success, `status ${bad}`).toBe(false);
    }
    expect(StorefrontVoiceNoteSchema.safeParse({ status: 'ready', durationMs: 0, extra: 1 }).success).toBe(false); // strict
  });

  it('a blank url is REFUSED, so « ready » can never mean « nothing to play »', async () => {
    const { StorefrontVoiceNoteSchema } = await import('../src/shapes/commerce.js');
    expect(StorefrontVoiceNoteSchema.safeParse({ status: 'ready', url: '', durationMs: 5 }).success).toBe(false);
    // durationMs is a non-negative integer — a negative or fractional
    // millisecond is a measurement error, not a note.
    for (const bad of [-1, 1.5, Number.NaN, '5']) {
      expect(StorefrontVoiceNoteSchema.safeParse({ status: 'pending', durationMs: bad }).success, `d ${bad}`).toBe(false);
    }
  });

  it('rides on the storefront keyed by pid, and a malformed note refuses THE WHOLE storefront', () => {
    const ok = StorefrontSchema.safeParse({
      ...sf(),
      productNotes: { pv_001: { status: 'ready', url: 'https://m/a.m4a', durationMs: 7_400 } },
    });
    expect(ok.success).toBe(true);
    if (ok.success) expect(ok.data.productNotes['pv_001']?.durationMs).toBe(7_400);
    // The point of putting it in the schema rather than in a screen: a bad note
    // cannot ride in beside good ones.
    expect(
      StorefrontSchema.safeParse({ ...sf(), productNotes: { pv_001: { status: 'ready', durationMs: -3 } } }).success,
    ).toBe(false);
    expect(StorefrontSchema.safeParse({ ...sf(), productNotes: { '': { status: 'pending', durationMs: 0 } } }).success).toBe(false);
  });
});

/* ═══════════ §6.5 RELATED-PARTY (canon v3.6.0) ═══════════ */

describe('§6.5 related-party (v3.6.0) — two families of signal, and the tier is unrepresentable to fake', () => {
  const T = '2026-08-04T09:00:00.000Z';
  const signals = (over: Record<string, unknown> = {}) => ({ identity: [], circumstantial: [], ...over });

  it('the IDENTITY family is exactly §6.5’s auto-void list', () => {
    // « same verified identity/phone/wallet, or reseller buying through their
    // own account » — four members, no more. A fifth added here without a spec
    // change would widen automatic voiding, which is the direction that hurts.
    for (const m of ['verified_identity', 'phone', 'wallet', 'own_account']) {
      expect(RelatedPartySignalsSchema.safeParse(signals({ identity: [m] })).success, m).toBe(true);
    }
    expect(RelatedPartySignalsSchema.safeParse(signals({ identity: ['household'] })).success).toBe(false);
  });

  it('the CIRCUMSTANTIAL family is exactly §6.5’s review list — « often legitimate in Burkina Faso »', () => {
    for (const m of ['device', 'household', 'landmark', 'shared_phone', 'network']) {
      expect(RelatedPartySignalsSchema.safeParse(signals({ circumstantial: [m] })).success, m).toBe(true);
    }
    // A circumstantial signal CANNOT be smuggled into the identity family, and
    // an identity signal cannot be demoted into the circumstantial one. The two
    // enums are disjoint, which is what makes the tier structural rather than a
    // convention some caller has to honour.
    expect(RelatedPartySignalsSchema.safeParse(signals({ circumstantial: ['wallet'] })).success).toBe(false);
  });

  it('the DECISION carries its own policy version and clock — related-party calls replay', () => {
    const d = RelatedPartyDecisionSchema.safeParse({
      orderId: 'ord_0001',
      outcome: 'held_for_review',
      signals: signals({ circumstantial: ['household'] }),
      policyVersion: 'related-party.v1',
      decidedAt: T,
    });
    expect(d.success).toBe(true);
  });

  it('the three outcomes are the spec’s, and « held » is NOT « void »', () => {
    // §6.5: « During investigation commission is **held**, not returned ». A
    // fourth outcome, or a merge of these two, would erase the appeal path.
    for (const outcome of ['clear', 'held_for_review', 'auto_void']) {
      expect(
        RelatedPartyDecisionSchema.safeParse({
          orderId: 'ord_0001', outcome, signals: signals(), policyVersion: 'v', decidedAt: T,
        }).success,
        outcome,
      ).toBe(true);
    }
    for (const outcome of ['voided', 'returned', 'paid', '']) {
      expect(
        RelatedPartyDecisionSchema.safeParse({
          orderId: 'ord_0001', outcome, signals: signals(), policyVersion: 'v', decidedAt: T,
        }).success,
        outcome,
      ).toBe(false);
    }
  });

  it('STRICT — an undeclared field is refused, on both shapes', () => {
    expect(RelatedPartySignalsSchema.safeParse({ ...signals(), severity: 'high' }).success).toBe(false);
    expect(
      RelatedPartyDecisionSchema.safeParse({
        orderId: 'ord_0001', outcome: 'clear', signals: signals(),
        policyVersion: 'v', decidedAt: T, commissionFcfa: 900,
      }).success,
    ).toBe(false);
  });
});
