import { setTimeout as sleep } from 'node:timers/promises';
import type { z } from 'zod';
import type { EventName, PlatformEvent } from '@platform/contracts';
import {
  MockTimeoutError,
  type CertifiableDomain,
  type EmissionControls,
  type EmissionResult,
  type MockAdapter,
  type ProjectionRead,
  type TransitionAttempt,
} from '../adapter.js';

/**
 * Deterministic reference-mock base: every §3 misbehavior implemented once,
 * per-domain adapters supply the event sequence, payloads, projection, and
 * their canonical invalid transition. No randomness — ids derive from the
 * scenario seed.
 */
export interface ReferenceDomainSpec {
  domain: CertifiableDomain;
  producerSchema: z.ZodType;
  /** the domain's canonical happy-path sequence for a seed (≥3 events). */
  sequence(seed: string): Array<{ name: EventName; payload: Record<string, unknown> }>;
  projectionValue(seed: string): Record<string, unknown>;
  invalidTransition: { from: string; to: string; reason: string };
}

export function makeReferenceAdapter(spec: ReferenceDomainSpec): MockAdapter {
  return {
    domain: spec.domain,
    producerSchema: spec.producerSchema,

    async emit(seed: string, controls: EmissionControls): Promise<EmissionResult> {
      if (controls.timeout) {
        await sleep(1);
        throw new MockTimeoutError(`${spec.domain}: simulated provider timeout for seed ${seed}`);
      }
      const sequence = spec.sequence(seed);
      let events: PlatformEvent[] = sequence.map((entry, index) => ({
        name: entry.name,
        envelope: {
          command_id: `cmd_${spec.domain}_${seed}_${index + 1}`,
          correlation_id: `corr_${seed}`,
          aggregateVersion: index + 1,
          actor: `mock:${spec.domain}`,
          serverTime: new Date().toISOString(),
          version: 'v1',
        },
        payload: entry.payload,
      }));

      if (controls.duplicate && events.length >= 2) {
        // deliver the second event twice — same command_id, as a real
        // at-least-once provider would.
        events = [...events.slice(0, 2), events[1]!, ...events.slice(2)];
      }
      if (controls.outOfOrder && events.length >= 3) {
        // swap the last two deliveries: aggregateVersion order breaks.
        events = [...events.slice(0, -2), events[events.length - 1]!, events[events.length - 2]!];
      }

      if (controls.delayMs !== undefined && controls.delayMs > 0) {
        await sleep(controls.delayMs);
      }

      if (controls.partialFailure && events.length >= 2) {
        const delivered = events.slice(0, 1).map((event) => ({ event, deliveredAt: Date.now() }));
        return {
          delivered,
          failure: { afterCount: 1, reason: `${spec.domain}: simulated mid-sequence failure` },
        };
      }

      return { delivered: events.map((event) => ({ event, deliveredAt: Date.now() })) };
    },

    async readProjection(seed: string, options: { stale: boolean }): Promise<ProjectionRead> {
      const freshVersion = 2;
      if (options.stale) {
        return {
          version: freshVersion - 1,
          asOf: '2026-07-09T00:00:00.000Z',
          value: { ...spec.projectionValue(seed), stale: true },
        };
      }
      return {
        version: freshVersion,
        asOf: new Date().toISOString(),
        value: spec.projectionValue(seed),
      };
    },

    attemptInvalidTransition(): TransitionAttempt {
      return {
        from: spec.invalidTransition.from,
        to: spec.invalidTransition.to,
        accepted: false,
        reason: spec.invalidTransition.reason,
      };
    },
  };
}
