import { EventEnvelopeSchema, PlatformEventSchema, type PlatformEvent } from '@platform/contracts';

/**
 * Envelope conformance (Contract §3): every emitted event must parse via the
 * pinned PlatformEventSchema and carry the full versioned envelope —
 * {command_id, correlation_id, aggregateVersion, actor, serverTime, version}.
 */
export interface EnvelopeConformanceReport {
  ok: boolean;
  checkedEvents: number;
  problems: string[];
}

export function checkEnvelopeConformance(events: readonly unknown[]): EnvelopeConformanceReport {
  const problems: string[] = [];
  events.forEach((candidate, index) => {
    const parsed = PlatformEventSchema.safeParse(candidate);
    if (!parsed.success) {
      problems.push(
        `event[${index}] does not parse via the pinned PlatformEventSchema: ${parsed.error.issues
          .map((i) => `${i.path.join('.')} ${i.code}`)
          .join('; ')}`,
      );
      return;
    }
    const envelope = EventEnvelopeSchema.safeParse((candidate as PlatformEvent).envelope);
    if (!envelope.success) {
      problems.push(`event[${index}] envelope incomplete: ${envelope.error.message}`);
    }
  });
  return { ok: problems.length === 0, checkedEvents: events.length, problems };
}
