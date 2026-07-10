import type { MockAdapter } from './adapter.js';
import { MockTimeoutError } from './adapter.js';
import { DOMAIN_PAYLOAD_SCHEMAS } from './domain-schemas.js';
import { checkEnvelopeConformance } from './envelope-conformance.js';

/**
 * The §3 mock-certification suite. Certification means 8/8 — no partial
 * passes. Both the mock and its live sibling must pass THIS suite before
 * replacement (§3).
 */
export const CERTIFICATION_BEHAVIORS = [
  'emits_duplicates',
  'delivers_out_of_order',
  'delays_events',
  'returns_stale_projections',
  'simulates_timeouts',
  'simulates_partial_failures',
  'rejects_invalid_state_transitions',
  'generated_from_producer_contract_schema',
] as const;
export type CertificationBehavior = (typeof CERTIFICATION_BEHAVIORS)[number];

export interface BehaviorResult {
  behavior: CertificationBehavior;
  passed: boolean;
  detail: string;
}

export interface CertificationScorecard {
  domain: string;
  certified: boolean;
  score: string; // e.g. "8/8"
  results: BehaviorResult[];
}

const CERTIFICATION_SEED = 'certification-scenario';
const DELAY_MS = 40;
/**
 * Node timers may fire up to ~1ms "early" when measured with Date.now()
 * (millisecond quantization of two clock reads). A deficient mock that
 * ignores delayMs observes ~0ms, so this tolerance cannot mask a missing
 * behavior — it only absorbs clock rounding.
 */
const CLOCK_QUANTIZATION_TOLERANCE_MS = 2;

function versionsInDeliveryOrder(result: { delivered: { event: { envelope: { aggregateVersion: number } } }[] }): number[] {
  return result.delivered.map((d) => d.event.envelope.aggregateVersion);
}

export async function certifyAdapter(adapter: MockAdapter): Promise<CertificationScorecard> {
  const results: BehaviorResult[] = [];
  const record = (behavior: CertificationBehavior, passed: boolean, detail: string) =>
    results.push({ behavior, passed, detail });

  // 1 — emit duplicates (and NOT when the control is off: the control must be real).
  try {
    const clean = await adapter.emit(CERTIFICATION_SEED, {});
    const dup = await adapter.emit(CERTIFICATION_SEED, { duplicate: true });
    const count = (r: typeof clean) => {
      const seen = new Map<string, number>();
      for (const d of r.delivered) {
        seen.set(d.event.envelope.command_id, (seen.get(d.event.envelope.command_id) ?? 0) + 1);
      }
      return [...seen.values()].filter((n) => n > 1).length;
    };
    const dupCount = count(dup);
    const cleanCount = count(clean);
    record(
      'emits_duplicates',
      dupCount > 0 && cleanCount === 0,
      `duplicated command_ids under control: ${dupCount}; without control: ${cleanCount}`,
    );
  } catch (err) {
    record('emits_duplicates', false, `emission failed: ${String(err)}`);
  }

  // 2 — deliver events out of order.
  try {
    const clean = await adapter.emit(CERTIFICATION_SEED, {});
    const shuffled = await adapter.emit(CERTIFICATION_SEED, { outOfOrder: true });
    const inOrder = (vs: number[]) => vs.every((v, i) => i === 0 || vs[i - 1]! <= v);
    const cleanOrdered = inOrder(versionsInDeliveryOrder(clean));
    const shuffledDisordered = !inOrder(versionsInDeliveryOrder(shuffled));
    record(
      'delivers_out_of_order',
      cleanOrdered && shuffledDisordered,
      `clean delivery ordered: ${cleanOrdered}; controlled delivery out of order: ${shuffledDisordered}`,
    );
  } catch (err) {
    record('delivers_out_of_order', false, `emission failed: ${String(err)}`);
  }

  // 3 — delay events.
  try {
    const t0 = Date.now();
    const delayed = await adapter.emit(CERTIFICATION_SEED, { delayMs: DELAY_MS });
    const firstDelivery = delayed.delivered[0]?.deliveredAt ?? t0;
    const observedDelay = firstDelivery - t0;
    record(
      'delays_events',
      observedDelay >= DELAY_MS - CLOCK_QUANTIZATION_TOLERANCE_MS && delayed.delivered.length > 0,
      `requested ${DELAY_MS}ms, observed ${observedDelay}ms before first delivery (tolerance ${CLOCK_QUANTIZATION_TOLERANCE_MS}ms for clock quantization)`,
    );
  } catch (err) {
    record('delays_events', false, `emission failed: ${String(err)}`);
  }

  // 4 — return stale projections.
  try {
    const fresh = await adapter.readProjection(CERTIFICATION_SEED, { stale: false });
    const stale = await adapter.readProjection(CERTIFICATION_SEED, { stale: true });
    record(
      'returns_stale_projections',
      stale.version < fresh.version,
      `fresh version ${fresh.version}, stale version ${stale.version}`,
    );
  } catch (err) {
    record('returns_stale_projections', false, `projection read failed: ${String(err)}`);
  }

  // 5 — simulate timeouts.
  try {
    await adapter.emit(CERTIFICATION_SEED, { timeout: true });
    record('simulates_timeouts', false, 'emission under timeout control succeeded — no timeout simulated');
  } catch (err) {
    record(
      'simulates_timeouts',
      err instanceof MockTimeoutError,
      err instanceof MockTimeoutError ? 'MockTimeoutError raised' : `wrong failure kind: ${String(err)}`,
    );
  }

  // 6 — simulate partial failures.
  try {
    const clean = await adapter.emit(CERTIFICATION_SEED, {});
    const partial = await adapter.emit(CERTIFICATION_SEED, { partialFailure: true });
    const strictPrefix =
      partial.failure !== undefined &&
      partial.delivered.length > 0 &&
      partial.delivered.length < clean.delivered.length;
    record(
      'simulates_partial_failures',
      strictPrefix,
      `clean sequence ${clean.delivered.length} events; partial delivered ${partial.delivered.length} then ${partial.failure ? `failed: ${partial.failure.reason}` : 'no failure marker'}`,
    );
  } catch (err) {
    record('simulates_partial_failures', false, `emission failed: ${String(err)}`);
  }

  // 7 — reject invalid state transitions.
  try {
    const attempt = adapter.attemptInvalidTransition();
    record(
      'rejects_invalid_state_transitions',
      !attempt.accepted && (attempt.reason ?? '').length > 0,
      `${attempt.from} -> ${attempt.to}: accepted=${attempt.accepted}${attempt.reason ? ` (${attempt.reason})` : ' (no reason given)'}`,
    );
  } catch (err) {
    record('rejects_invalid_state_transitions', false, `transition attempt threw unexpectedly: ${String(err)}`);
  }

  // 8 — generated from the same contract schema as the producer.
  try {
    const registrySchema = DOMAIN_PAYLOAD_SCHEMAS[adapter.domain];
    const identity = adapter.producerSchema === registrySchema;
    const emission = await adapter.emit(CERTIFICATION_SEED, {});
    const envelopes = checkEnvelopeConformance(emission.delivered.map((d) => d.event));
    const payloadFailures = emission.delivered.filter(
      (d) => !registrySchema.safeParse(d.event.payload).success,
    ).length;
    record(
      'generated_from_producer_contract_schema',
      identity && envelopes.ok && payloadFailures === 0,
      `producerSchema identical to domain registry: ${identity}; envelopes conformant: ${envelopes.ok}; payload parse failures: ${payloadFailures}/${emission.delivered.length}`,
    );
  } catch (err) {
    record('generated_from_producer_contract_schema', false, `emission failed: ${String(err)}`);
  }

  const passed = results.filter((r) => r.passed).length;
  return {
    domain: adapter.domain,
    certified: passed === CERTIFICATION_BEHAVIORS.length,
    score: `${passed}/${CERTIFICATION_BEHAVIORS.length}`,
    results,
  };
}

export function formatScorecard(card: CertificationScorecard): string {
  const lines = [
    `${card.certified ? 'CERTIFIED' : 'NOT CERTIFIED'} — ${card.domain} — ${card.score} §3 behaviors`,
  ];
  for (const r of card.results) {
    lines.push(`  ${r.passed ? '✓' : '✗'} ${r.behavior}: ${r.detail}`);
  }
  return lines.join('\n');
}
