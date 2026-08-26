import { describe, expect, it } from 'vitest';
import fc from 'fast-check';
import {
  QuoteReconciliationError,
  assertQuoteReconciles,
  computeWaterfall,
} from '../src/money/waterfall.js';
import {
  ROUNDING_LAW_VERSION,
  resellerPlatformFee,
  sellerPlatformFee,
  SELLER_PLATFORM_FEE,
  RESELLER_PLATFORM_FEE,
} from '../src/money/rounding-law.js';

describe('RoundingLaw v1 (founder-confirmed 2026-07-09)', () => {
  it('is version v1, the single named module', () => {
    expect(ROUNDING_LAW_VERSION).toBe('v1');
  });

  it('FRAIS-ZERO (founder order 2026-08-25): both rates are 0 — every fee is 0 F on every input', () => {
    // « For now remove all charging fees system everywhere. » The law and its
    // floor stay; the numerators are 0, so the whole amount stays with the
    // participant on EVERY input, divisible or not.
    expect(sellerPlatformFee(19)).toBe(0);
    expect(sellerPlatformFee(10_001)).toBe(0);
    expect(resellerPlatformFee(333, 778)).toBe(0);
    expect(sellerPlatformFee(10_000)).toBe(0);
    expect(resellerPlatformFee(1_000, 1_500)).toBe(0);
  });

  it('rejects non-integer and negative FCFA inputs', () => {
    expect(() => sellerPlatformFee(10.5)).toThrow(RangeError);
    expect(() => sellerPlatformFee(-1)).toThrow(RangeError);
    expect(() => resellerPlatformFee(0.2, 100)).toThrow(RangeError);
    expect(() =>
      computeWaterfall({
        sellerBasePrice: 100.01,
        sellerFundedCommission: 0,
        resellerMarkup: 0,
        deliveryFee: 0,
        paymentMode: 'FULL_PREPAY',
      }),
    ).toThrow(RangeError);
  });
});

describe('computeWaterfall — §5.4 worked baseline (asserted literally)', () => {
  it('B 10,000 · C 1,000 · M 1,500 · D 1,000 → 11,500 · 12,500 · 9,000 · 2,500 · 0 (FRAIS-ZERO)', () => {
    const q = computeWaterfall({
      sellerBasePrice: 10_000,
      sellerFundedCommission: 1_000,
      resellerMarkup: 1_500,
      deliveryFee: 1_000,
      paymentMode: 'FULL_PREPAY',
    });
    expect(q.productSubtotal).toBe(11_500);
    expect(q.buyerTotal).toBe(12_500);
    expect(q.sellerPlatformFee).toBe(0);
    expect(q.sellerNet).toBe(9_000);
    expect(q.resellerGrossEarnings).toBe(2_500);
    expect(q.resellerPlatformFee).toBe(0);
    expect(q.resellerNet).toBe(2_500);
    expect(q.platformProductFeeRevenue).toBe(0);
    // 9,000 + 2,500 + 0 = 11,500 ✓ (FRAIS-ZERO)
    expect(q.sellerNet + q.resellerNet + q.platformProductFeeRevenue).toBe(q.productSubtotal);
    // FULL_PREPAY legs (§5.5)
    expect(q.amountPaidAtCheckout).toBe(12_500);
    expect(q.amountDueAtDelivery).toBe(0);
    expect(() => assertQuoteReconciles(q)).not.toThrow();
  });
});

describe('computeWaterfall — founder non-divisible regression case (asserted exactly)', () => {
  it('B 10,001 · C 333 · M 778 · D 600 → fees 0 · 0, sellerNet 9,668, resellerNet 1,111, platform 0 (FRAIS-ZERO on the non-divisible case)', () => {
    const q = computeWaterfall({
      sellerBasePrice: 10_001,
      sellerFundedCommission: 333,
      resellerMarkup: 778,
      deliveryFee: 600,
      paymentMode: 'DELIVERY_FEE_PREPAID_PRODUCT_AT_DOOR',
    });
    expect(q.sellerPlatformFee).toBe(0);
    expect(q.resellerPlatformFee).toBe(0);
    expect(q.sellerNet).toBe(9_668);
    expect(q.resellerNet).toBe(1_111);
    expect(q.platformProductFeeRevenue).toBe(0);
    expect(q.productSubtotal).toBe(10_779);
    expect(q.buyerTotal).toBe(11_379);
    // Option B legs (§5.5): amountPaidAtCheckout = D, amountDueAtDelivery = productSubtotal.
    expect(q.amountPaidAtCheckout).toBe(600);
    expect(q.amountDueAtDelivery).toBe(10_779);
    expect(() => assertQuoteReconciles(q)).not.toThrow();
  });
});

describe('reconciliation property — ∀ integer FCFA inputs in realistic ranges, both identities hold exactly', () => {
  const realisticInputs = fc.record({
    sellerBasePrice: fc.integer({ min: 0, max: 5_000_000 }),
    sellerFundedCommission: fc.integer({ min: 0, max: 1_000_000 }),
    resellerMarkup: fc.integer({ min: 0, max: 1_000_000 }),
    deliveryFee: fc.integer({ min: 0, max: 100_000 }),
    paymentMode: fc.constantFrom('FULL_PREPAY' as const, 'DELIVERY_FEE_PREPAID_PRODUCT_AT_DOOR' as const),
  });

  it('identity 1: productSubtotal == sellerNet + resellerNet + platformProductFeeRevenue', () => {
    fc.assert(
      fc.property(realisticInputs, (input) => {
        const q = computeWaterfall(input);
        expect(q.sellerNet + q.resellerNet + q.platformProductFeeRevenue).toBe(q.productSubtotal);
      }),
      { numRuns: 2_000 },
    );
  });

  it('identity 2: buyerTotal == productSubtotal + deliveryFee (delivery OUTSIDE both fee bases)', () => {
    fc.assert(
      fc.property(realisticInputs, (input) => {
        const q = computeWaterfall(input);
        expect(q.productSubtotal + q.deliveryFee).toBe(q.buyerTotal);
        // Delivery outside fee bases: fees are unchanged when D changes.
        const qZeroD = computeWaterfall({ ...input, deliveryFee: 0 });
        expect(qZeroD.sellerPlatformFee).toBe(q.sellerPlatformFee);
        expect(qZeroD.resellerPlatformFee).toBe(q.resellerPlatformFee);
      }),
      { numRuns: 2_000 },
    );
  });

  it('funded legs per mode always sum to buyerTotal, and every money field is an integer', () => {
    fc.assert(
      fc.property(realisticInputs, (input) => {
        const q = computeWaterfall(input);
        expect(q.amountPaidAtCheckout + q.amountDueAtDelivery).toBe(q.buyerTotal);
        for (const [field, value] of Object.entries(q)) {
          if (typeof value === 'number') {
            expect(Number.isSafeInteger(value), `${field} must be integer FCFA`).toBe(true);
          }
        }
        expect(() => assertQuoteReconciles(q)).not.toThrow();
      }),
      { numRuns: 2_000 },
    );
  });

  it('floor law, rate-general: den·fee ≤ base·num < den·(fee+1) — at the FRAIS-ZERO rates every fee is exactly 0', () => {
    // The old form (20·sellerFee ≤ B, 5·resellerFee ≤ C+M) was the rate-5%/20%
    // specialisation; this is the same floor law written from the constants
    // themselves, so it holds at ANY future rate the founder sets — including
    // today's 0, where it degenerates to fee === 0 on every input.
    fc.assert(
      fc.property(realisticInputs, (input) => {
        const q = computeWaterfall(input);
        const sNum = SELLER_PLATFORM_FEE.numerator;
        const sDen = SELLER_PLATFORM_FEE.denominator;
        expect(sDen * q.sellerPlatformFee).toBeLessThanOrEqual(input.sellerBasePrice * sNum);
        expect(input.sellerBasePrice * sNum).toBeLessThan(sDen * (q.sellerPlatformFee + 1));
        const cm = input.sellerFundedCommission + input.resellerMarkup;
        const rNum = RESELLER_PLATFORM_FEE.numerator;
        const rDen = RESELLER_PLATFORM_FEE.denominator;
        expect(rDen * q.resellerPlatformFee).toBeLessThanOrEqual(cm * rNum);
        expect(cm * rNum).toBeLessThan(rDen * (q.resellerPlatformFee + 1));
        // FRAIS-ZERO (founder order 2026-08-25): both numerators are 0 today.
        expect(q.sellerPlatformFee).toBe(0);
        expect(q.resellerPlatformFee).toBe(0);
      }),
      { numRuns: 2_000 },
    );
  });
});

describe('assertQuoteReconciles — negative fixture (the gate must be able to fail)', () => {
  it('rejects a quote whose resellerNet was computed as an independent multiplication (the FORBIDDEN construction)', () => {
    // B=10,001 C=333 M=778: an independent floor(0.80 × 1,111) = 888 loses
    // 1 F — exactly the drift the subtraction construction prevents.
    const broken = {
      productSubtotal: 10_779,
      deliveryFee: 600,
      buyerTotal: 11_379,
      sellerNet: 9_168,
      resellerNet: Math.floor(0.8 * (333 + 778)), // 888 — WRONG by construction
      platformProductFeeRevenue: 722,
      amountPaidAtCheckout: 600,
      amountDueAtDelivery: 10_779,
    };
    expect(() => assertQuoteReconciles(broken)).toThrow(QuoteReconciliationError);
    try {
      assertQuoteReconciles(broken);
      expect.unreachable('broken quote must not reconcile');
    } catch (err) {
      const e = err as QuoteReconciliationError;
      expect(e.failures.length).toBeGreaterThan(0);
      expect(e.message).toContain('productSubtotal (10779) != sellerNet + resellerNet + platformProductFeeRevenue');
      expect(e.message).toContain('9168 + 888 + 722 = 10778');
    }
  });

  it('rejects a quote whose buyerTotal silently absorbed a fee into delivery', () => {
    const broken = {
      productSubtotal: 11_500,
      deliveryFee: 1_000,
      buyerTotal: 12_600, // 100 F invented
      sellerNet: 8_500,
      resellerNet: 2_000,
      platformProductFeeRevenue: 1_000,
      amountPaidAtCheckout: 12_600,
      amountDueAtDelivery: 0,
    };
    expect(() => assertQuoteReconciles(broken)).toThrow(/buyerTotal \(12600\) != productSubtotal \+ deliveryFee/);
  });
});
