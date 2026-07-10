import {
  OrderSchema,
  QuoteSchema,
  assertQuoteReconciles,
  type PlatformEvent,
} from '@platform/contracts';
import { checkEnvelopeConformance } from '../envelope-conformance.js';
import {
  CHAIN_STEPS,
  NINE_CHAIN_IDS,
  type ChainAdapters,
  type ChainContext,
  type ChainIdName,
} from './steps.js';

/**
 * The §2.3 fifteen-step chain runner. Validates ONE correlation chain across
 * all nine §6 ids; any missing link, duplicate id, or chain break fails.
 */
export interface StepReport {
  index: number;
  title: string;
  ok: boolean;
  mintedIds: Record<string, string>;
  eventNames: string[];
  problems: string[];
}

export interface ChainReport {
  ok: boolean;
  correlationId: string;
  steps: StepReport[];
  chainIds: Partial<Record<ChainIdName, string>>;
  problems: string[];
  totalEvents: number;
}

export async function runChain(adapters: ChainAdapters, seed: string): Promise<ChainReport> {
  const correlationId = `corr_${seed}`;
  const ctx: ChainContext = { correlationId, seed, ids: {} };
  const stepReports: StepReport[] = [];
  const chainProblems: string[] = [];
  const allEvents: PlatformEvent[] = [];

  for (const step of CHAIN_STEPS) {
    const problems: string[] = [];
    let mintedIds: Record<string, string> = {};
    let eventNames: string[] = [];
    try {
      const result = await adapters[step.run](ctx);
      mintedIds = result.ids;
      eventNames = result.events.map((e) => e.name);
      allEvents.push(...result.events);

      for (const required of step.mints) {
        if (!result.ids[required]) {
          problems.push(`missing link: step ${step.index} did not mint ${required}`);
        }
      }
      const envelopes = checkEnvelopeConformance(result.events);
      if (!envelopes.ok) problems.push(...envelopes.problems);
      for (const event of result.events) {
        if (event.envelope.correlation_id !== correlationId) {
          problems.push(
            `chain break: step ${step.index} event ${event.name} carries correlation_id ${event.envelope.correlation_id}, expected ${correlationId}`,
          );
        }
      }
      // canon validation of the money-path artifacts
      if (step.index === 6) {
        const quote = result.artifacts?.['quote'];
        const parsed = QuoteSchema.safeParse(quote);
        if (!parsed.success) {
          problems.push(`step 6 quote does not parse as the frozen canonical Quote: ${parsed.error.issues.length} issue(s)`);
        } else {
          try {
            assertQuoteReconciles(parsed.data);
          } catch (err) {
            problems.push(`step 6 quote does not reconcile: ${String(err)}`);
          }
        }
      }
      if (step.index === 8) {
        const order = result.artifacts?.['order'];
        const parsed = OrderSchema.safeParse(order);
        if (!parsed.success) {
          problems.push(`step 8 order does not parse as the canonical Order (five-state status): ${parsed.error.issues.length} issue(s)`);
        }
      }
      Object.assign(ctx.ids, result.ids);
    } catch (err) {
      problems.push(`step ${step.index} threw: ${String(err)}`);
    }
    stepReports.push({
      index: step.index,
      title: step.title,
      ok: problems.length === 0,
      mintedIds,
      eventNames,
      problems,
    });
  }

  // the nine-id chain: all present, all distinct
  const chainIds: Partial<Record<ChainIdName, string>> = {};
  for (const name of NINE_CHAIN_IDS) {
    const value = ctx.ids[name];
    if (!value) chainProblems.push(`missing link: ${name} absent from the completed chain`);
    else chainIds[name] = value;
  }
  const values = Object.values(chainIds);
  const distinct = new Set(values);
  if (distinct.size !== values.length) {
    const seen = new Set<string>();
    for (const [name, value] of Object.entries(chainIds)) {
      if (seen.has(value)) chainProblems.push(`duplicate id: ${name} reuses ${value}`);
      seen.add(value);
    }
  }

  const ok = stepReports.every((s) => s.ok) && chainProblems.length === 0;
  return {
    ok,
    correlationId,
    steps: stepReports,
    chainIds,
    problems: chainProblems,
    totalEvents: allEvents.length,
  };
}

export function formatChainReport(report: ChainReport): string {
  const lines = [
    `15-STEP CHAIN ${report.ok ? 'COMPLETE' : 'BROKEN'} — correlation ${report.correlationId} — ${report.totalEvents} events`,
  ];
  for (const step of report.steps) {
    const ids = Object.entries(step.mintedIds)
      .map(([k, v]) => `${k}=${v}`)
      .join(', ');
    lines.push(`  ${step.ok ? '✓' : '✗'} ${String(step.index).padStart(2)}. ${step.title}${ids ? ` → ${ids}` : ''}`);
    for (const p of step.problems) lines.push(`       ! ${p}`);
  }
  lines.push('  nine-id chain:');
  for (const name of NINE_CHAIN_IDS) {
    lines.push(`    ${report.chainIds[name] ? '✓' : '✗'} ${name} = ${report.chainIds[name] ?? 'MISSING'}`);
  }
  for (const p of report.problems) lines.push(`  ! ${p}`);
  return lines.join('\n');
}
