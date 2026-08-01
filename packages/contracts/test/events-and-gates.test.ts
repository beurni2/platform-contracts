import { describe, expect, it } from 'vitest';
import * as publicApi from '../src/index.js';
import { EVENT_NAMES, EventEnvelopeSchema } from '../src/events.js';
import {
  GATED_EVENT_PREFIXES,
  checkNoGatedShapes,
} from '../src/gates/no-gated-shapes.js';

describe('event registry', () => {
  it('validates a versioned envelope with the full correlation fields', () => {
    const result = EventEnvelopeSchema.safeParse({
      command_id: 'cmd_1',
      correlation_id: 'corr_1',
      aggregateVersion: 3,
      actor: 'user:sup_1',
      serverTime: '2026-07-09T10:00:00Z',
      version: 'v1',
    });
    expect(result.success).toBe(true);
  });

  it('rejects an envelope missing correlation_id', () => {
    const result = EventEnvelopeSchema.safeParse({
      command_id: 'cmd_1',
      aggregateVersion: 3,
      actor: 'user:sup_1',
      serverTime: '2026-07-09T10:00:00Z',
      version: 'v1',
    });
    expect(result.success).toBe(false);
  });

  it('contains the E1-critical names from all three specs', () => {
    for (const required of [
      'checkout.quote_created.v1',
      'payment.checkout_leg_confirmed.v1',
      'payment.door_leg_confirmed.v1',
      'seller.readiness_challenge_issued.v1',
      'pickup.verification_recorded.v1',
      'pickup.custody_seal_registered.v1',
      'custody.transferred_to_courier.v1',
      'custody.transferred_to_customer.v1',
      'handoff.authorized.v1',
      'delivery.validated.v1',
      'settlement.supplier_payable.v1',
      'payout.paid.v1',
      'attribution.locked.v1',
      'logistics.task_ready.v1',
      'order.confirmed.v1',
    ]) {
      expect(EVENT_NAMES).toContain(required);
    }
  });

  it('carries NO gated event name (packlab/cercle/campaign/referral/review)', () => {
    for (const name of EVENT_NAMES) {
      for (const prefix of GATED_EVENT_PREFIXES) {
        expect(name.startsWith(prefix), `${name} must not be gated`).toBe(false);
      }
    }
  });
});

describe('no-gated-shapes gate', () => {
  it('the real public API exports no gated shape and no gated event name', () => {
    const report = checkNoGatedShapes(Object.keys(publicApi), EVENT_NAMES);
    expect(report.violations).toEqual([]);
    expect(report.ok).toBe(true);
  });

  it('NEGATIVE FIXTURE: a surface leaking PackLab/Cercle material fails the gate', () => {
    const report = checkNoGatedShapes(
      ['QuoteSchema', 'PackProduct', 'KittingJobSchema', 'CampaignLandingPage'],
      ['checkout.quote_created.v1', 'packlab.pack_created.v1', 'cercle.member_joined.v1'],
    );
    expect(report.ok).toBe(false);
    expect(report.violations).toEqual([
      'gated shape exported from public API: PackProduct',
      'gated shape exported from public API: KittingJobSchema',
      'gated shape exported from public API: CampaignLandingPage',
      'gated event name in registry: packlab.pack_created.v1',
      'gated event name in registry: cercle.member_joined.v1',
    ]);
  });
});

/**
 * ═══ ORDER-PAID-WIRE-1 (canon v3.2.0) — the order.confirmed.v1 payload ═══
 *
 * The founder-approved cross-app preparation signal. The absences below are
 * not style: each names a value the founder ruled MUST NOT cross this wire,
 * and each is asserted as a REFUSAL so that loosening `.strict()` — or
 * "helpfully" adding the field back — turns this suite red.
 */
describe('OrderConfirmedPayloadSchema — the paid-order wire, exactly seven fields', () => {
  const VALID = {
    orderId: 'order-quote-abc123',
    productVersionId: 'pv-bazin-0001',
    offerVersion: 'ov-1',
    paymentMode: 'FULL_PREPAY',
    paidAt: '2026-08-01T18:00:00.000Z',
    zoneTo: 'Gounghin, Ouagadougou',
    sellerBasePrice: 10_000,
  };

  it('parses the approved shape, in both payment modes', () => {
    expect(publicApi.OrderConfirmedPayloadSchema.safeParse(VALID).success).toBe(true);
    expect(
      publicApi.OrderConfirmedPayloadSchema.safeParse({
        ...VALID,
        paymentMode: 'DELIVERY_FEE_PREPAID_PRODUCT_AT_DOOR',
      }).success,
    ).toBe(true);
  });

  it("REFUSES every field the founder ruled off this wire — supplier identity, buyer identity, the drop code, everyone else's money", () => {
    const banned: Record<string, unknown>[] = [
      { supplierId: 'sup-001' }, // Boutik+ resolves the supplier internally
      { sellerId: 'sup-001' },
      { buyerPhone: '+226 70 00 00 00' }, // dispatch-surface data, never fulfillment
      { buyerName: 'Awa' },
      { buyerRef: 'buyer-1' },
      { buyerDropCode: '1234' }, // Ten Laws #3 — never seller-side
      { buyerTotal: 12_500 }, // Law #1 — nothing of M, C, D toward a seller surface
      { resellerCommission: 1_000 },
      { resellerMarkup: 1_500 },
      { deliveryFee: 1_000 },
    ];
    for (const extra of banned) {
      const result = publicApi.OrderConfirmedPayloadSchema.safeParse({ ...VALID, ...extra });
      expect(result.success, `${Object.keys(extra)[0]} must be UNREPRESENTABLE on this wire`).toBe(false);
    }
  });

  it('refuses a malformed core field — empty id, unknown mode, fractional or negative francs', () => {
    const bad: Record<string, unknown>[] = [
      { orderId: '' },
      { orderId: '  ord-1 ' }, // untrimmed fails the id-class primitive
      { productVersionId: '' },
      { paymentMode: 'CASH_ON_TRUST' },
      { sellerBasePrice: 10_000.5 },
      { sellerBasePrice: -1 },
      { zoneTo: '' },
    ];
    for (const over of bad) {
      const result = publicApi.OrderConfirmedPayloadSchema.safeParse({ ...VALID, ...over });
      expect(result.success, JSON.stringify(over)).toBe(false);
    }
  });

  it('hangs on the CANON name — order.confirmed.v1 is in the registry, and the composed PlatformEvent parses', () => {
    // The founder approved this under the label « order.paid.v1 »; §5.7 already
    // names the moment. Pin both facts: the canon name exists, the label that
    // would have duplicated it does not.
    expect(EVENT_NAMES).toContain('order.confirmed.v1');
    expect(EVENT_NAMES as readonly string[]).not.toContain('order.paid.v1');
    const event = publicApi.PlatformEventSchema.safeParse({
      name: 'order.confirmed.v1',
      envelope: {
        command_id: 'ord-confirm-order-quote-abc123',
        correlation_id: 'corr-order-quote-abc123',
        aggregateVersion: 1,
        actor: 'storefront-service:order',
        serverTime: '2026-08-01T18:00:00.000Z',
        version: 'v1',
      },
      payload: VALID,
    });
    expect(event.success).toBe(true);
  });
});
