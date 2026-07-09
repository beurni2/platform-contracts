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
