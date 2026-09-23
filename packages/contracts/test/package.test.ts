import { describe, expect, it } from 'vitest';
import fc from 'fast-check';
import * as publicApi from '../src/index.js';

/**
 * COLIS-FOURNISSEUR-1 (founder ruling 2026-09-23) — one package, several
 * orders: the fee split, the grouping answer, and the package on the paid-order
 * wire.
 */
describe('splitPackageDeliveryFee — one fee, split evenly to the franc, leftover on the first order', () => {
  it('the ruling’s own examples', () => {
    expect(publicApi.splitPackageDeliveryFee(1_000, 2)).toEqual([500, 500]);
    expect(publicApi.splitPackageDeliveryFee(1_000, 3)).toEqual([334, 333, 333]);
    expect(publicApi.splitPackageDeliveryFee(1_000, 7)).toEqual([148, 142, 142, 142, 142, 142, 142]);
    expect(publicApi.splitPackageDeliveryFee(1_000, 1)).toEqual([1_000]);
    expect(publicApi.splitPackageDeliveryFee(0, 4)).toEqual([0, 0, 0, 0]);
  });

  it('the shares always add up to the package’s fee, and no share differs from another by more than the leftover', () => {
    fc.assert(
      fc.property(fc.integer({ min: 0, max: 5_000_000 }), fc.integer({ min: 1, max: 10 }), (fee, n) => {
        const shares = publicApi.splitPackageDeliveryFee(fee, n);
        expect(shares).toHaveLength(n);
        expect(shares.reduce((a, b) => a + b, 0)).toBe(fee);
        for (const s of shares.slice(1)) expect(s).toBe(Math.floor(fee / n));
        expect(shares[0]! - shares[1 % n]!).toBeLessThan(n === 1 ? fee + 1 : n);
      }),
    );
  });

  it('refuses what is not a package: no order, more than ten, a fraction of a franc, a negative fee', () => {
    expect(() => publicApi.splitPackageDeliveryFee(1_000, 0)).toThrow(RangeError);
    expect(() => publicApi.splitPackageDeliveryFee(1_000, 11)).toThrow(RangeError);
    expect(() => publicApi.splitPackageDeliveryFee(1_000.5, 2)).toThrow(RangeError);
    expect(() => publicApi.splitPackageDeliveryFee(-1, 2)).toThrow(RangeError);
    expect(() => publicApi.splitPackageDeliveryFee(1_000, 2.5)).toThrow(RangeError);
  });
});

describe('which articles leave together — groups of product ids, never who', () => {
  const ASK = { productVersionIds: ['pv-a', 'pv-b', 'pv-c'] };

  it('an answer covers exactly the asked products, each once', () => {
    expect(publicApi.isGroupingOf({ groups: [['pv-a', 'pv-c'], ['pv-b']] }, ASK)).toBe(true);
    expect(publicApi.isGroupingOf({ groups: [['pv-a'], ['pv-b'], ['pv-c']] }, ASK)).toBe(true);
    expect(publicApi.isGroupingOf({ groups: [['pv-a', 'pv-b']] }, ASK), 'one left out').toBe(false);
    expect(publicApi.isGroupingOf({ groups: [['pv-a', 'pv-b'], ['pv-b', 'pv-c']] }, ASK), 'one twice').toBe(false);
    expect(publicApi.isGroupingOf({ groups: [['pv-a', 'pv-b', 'pv-c', 'pv-z']] }, ASK), 'one not asked').toBe(false);
  });

  it('the answer carries NO supplier: any other field is refused', () => {
    expect(publicApi.PackageGroupingAnswerSchema.safeParse({ groups: [['pv-a']] }).success).toBe(true);
    expect(publicApi.PackageGroupingAnswerSchema.safeParse({ groups: [['pv-a']], supplierIds: ['sup-1'] }).success).toBe(false);
    expect(publicApi.PackageGroupingAnswerSchema.safeParse({ groups: [{ supplierId: 'sup-1', ids: ['pv-a'] }] }).success).toBe(false);
    expect(publicApi.PackageGroupingAnswerSchema.safeParse({ groups: [[]] }).success).toBe(false);
  });

  it('the question is 2 to 10 distinct products and nothing else', () => {
    expect(publicApi.PackageGroupingRequestSchema.safeParse(ASK).success).toBe(true);
    expect(publicApi.PackageGroupingRequestSchema.safeParse({ productVersionIds: ['pv-a'] }).success).toBe(false);
    expect(publicApi.PackageGroupingRequestSchema.safeParse({ productVersionIds: ['pv-a', 'pv-a'] }).success).toBe(false);
    expect(
      publicApi.PackageGroupingRequestSchema.safeParse({ productVersionIds: Array.from({ length: 11 }, (_, i) => `pv-${i}`) }).success,
    ).toBe(false);
    expect(publicApi.PackageGroupingRequestSchema.safeParse({ ...ASK, buyerPhone: '70' }).success).toBe(false);
  });
});

describe('order.confirmed.v1 — the package an order travels in', () => {
  const BASE = {
    orderId: 'ord-a',
    productVersionId: 'pv-a',
    offerVersion: 'ov-1',
    paymentMode: 'FULL_PREPAY',
    paidAt: '2026-09-23T10:00:00.000Z',
    zoneTo: 'Gounghin, Ouagadougou',
    sellerBasePrice: 8_000,
  };

  it('an order alone carries none; an order in a package carries the package and every order in it', () => {
    expect(publicApi.OrderConfirmedPayloadSchema.safeParse(BASE).success).toBe(true);
    const inPackage = { ...BASE, package: { packageId: 'col-1', orderIds: ['ord-a', 'ord-b'] } };
    expect(publicApi.OrderConfirmedPayloadSchema.safeParse(inPackage).success).toBe(true);
  });

  it('refuses a package that does not list this order, lists one twice, holds one order, or carries anything else', () => {
    const bad: unknown[] = [
      { packageId: 'col-1', orderIds: ['ord-b', 'ord-c'] },
      { packageId: 'col-1', orderIds: ['ord-a', 'ord-a'] },
      { packageId: 'col-1', orderIds: ['ord-a'] },
      { packageId: 'col-1', orderIds: ['ord-a', 'ord-b'], supplierId: 'sup-1' },
      { packageId: '', orderIds: ['ord-a', 'ord-b'] },
    ];
    for (const p of bad) {
      expect(publicApi.OrderConfirmedPayloadSchema.safeParse({ ...BASE, package: p }).success, JSON.stringify(p)).toBe(false);
    }
  });

  it('the event artifact binds it the same way', () => {
    const event = {
      name: 'order.confirmed.v1',
      envelope: { command_id: 'c', correlation_id: 'k', aggregateVersion: 1, actor: 'a', serverTime: 't', version: 'v1' },
      payload: { ...BASE, package: { packageId: 'col-1', orderIds: ['ord-b', 'ord-c'] } },
    };
    expect(publicApi.OrderConfirmedEventSchema.safeParse(event).success).toBe(false);
  });
});
