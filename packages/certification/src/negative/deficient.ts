import { z } from 'zod';
import type { EmissionControls, EmissionResult, MockAdapter } from '../adapter.js';
import type { CertificationBehavior } from '../certify.js';

/**
 * NEGATIVE-FIXTURE factory: wraps a certified adapter and neutralizes exactly
 * one §3 behavior. Certification of the result MUST fail — a suite that
 * certifies a deficient mock asserts nothing.
 */
export function makeDeficient(adapter: MockAdapter, missing: CertificationBehavior): MockAdapter {
  const strippedControls = (controls: EmissionControls): EmissionControls => {
    const next = { ...controls };
    if (missing === 'emits_duplicates') delete next.duplicate;
    if (missing === 'delivers_out_of_order') delete next.outOfOrder;
    if (missing === 'delays_events') delete next.delayMs;
    if (missing === 'simulates_timeouts') delete next.timeout;
    if (missing === 'simulates_partial_failures') delete next.partialFailure;
    return next;
  };

  return {
    domain: adapter.domain,
    // Identity break for behavior 8: a structurally-similar but DIFFERENT
    // schema object — exactly the "hand-rolled shape instead of the contract
    // schema" failure §3 exists to catch.
    producerSchema:
      missing === 'generated_from_producer_contract_schema'
        ? z.record(z.string(), z.unknown())
        : adapter.producerSchema,

    async emit(seed, controls): Promise<EmissionResult> {
      return adapter.emit(seed, strippedControls(controls));
    },

    async readProjection(seed, options) {
      if (missing === 'returns_stale_projections') {
        return adapter.readProjection(seed, { stale: false }); // always fresh
      }
      return adapter.readProjection(seed, options);
    },

    attemptInvalidTransition() {
      if (missing === 'rejects_invalid_state_transitions') {
        const attempt = adapter.attemptInvalidTransition();
        return { ...attempt, accepted: true, reason: 'deficient mock accepts anything' };
      }
      return adapter.attemptInvalidTransition();
    },
  };
}
