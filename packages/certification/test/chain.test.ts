import { describe, expect, it } from 'vitest';
import { NINE_CHAIN_IDS } from '../src/chain/steps.js';
import { runChain } from '../src/chain/runner.js';
import { chainReportHtml } from '../src/chain/report-html.js';
import {
  dropChainLink,
  makeReferenceChainAdapters,
} from '../src/chain/reference-chain.js';

describe('the §2.3 fifteen-step chain runner', () => {
  it('completes 15/15 against the reference adapters with ONE correlation chain across all nine ids', async () => {
    const report = await runChain(makeReferenceChainAdapters(), 'test-seed');
    for (const step of report.steps) {
      expect(step.problems, `step ${step.index} ${step.title}`).toEqual([]);
    }
    expect(report.steps).toHaveLength(15);
    expect(report.problems).toEqual([]);
    expect(report.ok).toBe(true);
    expect(report.correlationId).toBe('corr_test-seed');
    // all nine §6 ids present and pairwise distinct
    for (const name of NINE_CHAIN_IDS) {
      expect(report.chainIds[name], name).toBeTruthy();
    }
    expect(new Set(Object.values(report.chainIds)).size).toBe(9);
    expect(report.totalEvents).toBeGreaterThanOrEqual(15);
  });

  it('NEGATIVE: a dropped id (validation_id) breaks the chain — exit path', async () => {
    const report = await runChain(dropChainLink(makeReferenceChainAdapters(), 'validation_id'), 'test-seed');
    expect(report.ok).toBe(false);
    const all = [...report.problems, ...report.steps.flatMap((s) => s.problems)].join('\n');
    expect(all).toContain('missing link');
    expect(all).toContain('validation_id');
  });

  it('NEGATIVE: a duplicated id is detected', async () => {
    const adapters = makeReferenceChainAdapters();
    const original = adapters.createSettlementObligations.bind(adapters);
    adapters.createSettlementObligations = async (ctx) => {
      const result = await original(ctx);
      return { ...result, ids: { ...result.ids, settlement_obligation_id: ctx.ids['order_id']! } };
    };
    const report = await runChain(adapters, 'test-seed');
    expect(report.ok).toBe(false);
    expect(report.problems.join('\n')).toContain('duplicate id');
  });

  it('NEGATIVE: a wrong correlation_id on one event is a chain break', async () => {
    const adapters = makeReferenceChainAdapters();
    const original = adapters.recordDeliveryConfirmation.bind(adapters);
    adapters.recordDeliveryConfirmation = async (ctx) => {
      const result = await original(ctx);
      result.events[0]!.envelope.correlation_id = 'corr_SOMEONE_ELSE';
      return result;
    };
    const report = await runChain(adapters, 'test-seed');
    expect(report.ok).toBe(false);
    expect(report.steps[11]!.problems.join('\n')).toContain('chain break');
  });

  it('the HTML dashboard seed renders the verdict, correlation id, and all nine ids', async () => {
    const report = await runChain(makeReferenceChainAdapters(), 'test-seed');
    const html = chainReportHtml(report);
    expect(html).toContain('CHAÎNE COMPLÈTE');
    expect(html).toContain('corr_test-seed');
    for (const name of NINE_CHAIN_IDS) {
      expect(html).toContain(name);
      expect(html).toContain(report.chainIds[name]!);
    }
  });
});
