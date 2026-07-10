import { describe, expect, it } from 'vitest';
import { checkEnvelopeConformance } from '../src/envelope-conformance.js';
import { referenceEligibilityMock } from '../src/reference/adapters.js';

describe('envelope conformance (§3: versioned envelopes with the full correlation fields)', () => {
  it('every reference-mock emission parses via the pinned PlatformEventSchema', async () => {
    const emission = await referenceEligibilityMock.emit('env-test', {});
    const report = checkEnvelopeConformance(emission.delivered.map((d) => d.event));
    expect(report.problems).toEqual([]);
    expect(report.ok).toBe(true);
    expect(report.checkedEvents).toBe(3);
  });

  it('NEGATIVE: a missing correlation_id fails conformance', () => {
    const report = checkEnvelopeConformance([
      {
        name: 'checkout.quote_created.v1',
        envelope: {
          command_id: 'cmd_1',
          aggregateVersion: 1,
          actor: 'mock:x',
          serverTime: '2026-07-09T10:00:00Z',
          version: 'v1',
        },
        payload: {},
      },
    ]);
    expect(report.ok).toBe(false);
    expect(report.problems.join('\n')).toContain('correlation_id');
  });

  it('NEGATIVE: an unregistered event name fails conformance', () => {
    const report = checkEnvelopeConformance([
      {
        name: 'packlab.pack_created.v1', // gated — not in the E1 registry
        envelope: {
          command_id: 'cmd_1',
          correlation_id: 'corr_1',
          aggregateVersion: 1,
          actor: 'mock:x',
          serverTime: '2026-07-09T10:00:00Z',
          version: 'v1',
        },
        payload: {},
      },
    ]);
    expect(report.ok).toBe(false);
  });
});
