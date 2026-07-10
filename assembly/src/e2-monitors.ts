import { PlatformEventSchema, type PlatformEvent, type SettlementObligation } from '@platform/contracts';

/**
 * WO-2.8 — the E2 monitors that live at the LEDGER SEAM (assembly-owned):
 * the app slices built six of the Contract's eight adversarial scenarios;
 * these are the remaining two — settlement-eligible-not-submitted and
 * payout-not-reconciled — plus the offline-backlog THRESHOLD observation
 * (the queue itself is sera's; the fleet-wide backlog view is an ops
 * concern with no single-app home until real infra at E3/E4).
 *
 * Deterministic detectors over explicit observations — the callers feed
 * facts, the monitors emit canonical `reconciliation.alert.v1` events,
 * idempotently. They move NO money, mutate NO obligation, and never
 * "recover" anything themselves: detection is theirs, recovery is the
 * runbook's (assembly/runbooks/).
 *
 * ⏳ POLICY VALUES: no spec names these numbers — conservative defaults,
 * founder-tunable, versioned so every alert names the policy it fired under.
 */

export const SETTLEMENT_SUBMISSION_TTL_V1 = {
  version: 'settlement-submission-ttl.v1',
  /** An obligation Eligible for longer than this with no submission → alert.
   * ⏳ founder-tunable; submission itself is E3 (no submitter exists yet). */
  eligibleUnsubmittedMin: 60,
} as const;

export const OFFLINE_BACKLOG_POLICY_V1 = {
  version: 'offline-backlog-policy.v1',
  /** ⏳ founder-tunable: queued evidence bundles across the fleet. */
  maxQueuedBundles: 25,
  /** ⏳ founder-tunable: oldest queued bundle older than this → alert. */
  maxOldestAgeMin: 30,
} as const;

function alertEvent(
  commandId: string,
  correlationId: string,
  sequence: number,
  payload: Record<string, unknown>,
  at: string,
): PlatformEvent {
  return PlatformEventSchema.parse({
    name: 'reconciliation.alert.v1',
    envelope: {
      command_id: commandId,
      correlation_id: correlationId,
      aggregateVersion: sequence,
      actor: 'assembly:e2-ops',
      serverTime: at,
      version: '1',
    },
    payload,
  });
}

/**
 * Scenario 6 — "settlement is eligible but not submitted" (Contract §6).
 * Watches canonical SettlementObligation records (state Eligible, the time
 * they became eligible) against submission facts. At E2 NO submission path
 * exists (provider payout submission is E3), so every eligible obligation
 * ages toward this alert — exactly the Contract's point: the silence must
 * become noise before real money arrives.
 */
export class SettlementSubmissionMonitor {
  private readonly alerted = new Set<string>();
  private readonly submitted = new Set<string>();
  private sequence = 0;

  /** E3 will call this; at E2 it exists so the detector's negative arm is honest. */
  recordSubmission(orderId: string, party: string): void {
    this.submitted.add(`${orderId}:${party}`);
  }

  check(
    obligations: readonly { obligation: SettlementObligation; eligibleAtIso: string; correlationId: string }[],
    nowIso: string,
    policy = SETTLEMENT_SUBMISSION_TTL_V1,
  ): PlatformEvent[] {
    const fired: PlatformEvent[] = [];
    for (const { obligation, eligibleAtIso, correlationId } of obligations) {
      const key = `${obligation.orderId}:${obligation.party}`;
      if (obligation.state !== 'Eligible') continue;
      if (this.submitted.has(key) || this.alerted.has(key)) continue;
      const ageMin = (Date.parse(nowIso) - Date.parse(eligibleAtIso)) / 60_000;
      if (ageMin < policy.eligibleUnsubmittedMin) continue;
      this.alerted.add(key);
      this.sequence += 1;
      fired.push(alertEvent(`recon-settlement-${key}`, correlationId, this.sequence, {
        scenario: 'settlement_eligible_not_submitted',
        order_id: obligation.orderId,
        party: obligation.party,
        eligible_since: eligibleAtIso,
        age_min: Math.floor(ageMin),
        ttl_policy_version: policy.version,
      }, nowIso));
    }
    return fired;
  }
}

/**
 * Scenario 7 — "a provider payout is submitted but not reconciled"
 * (Contract §6). Compares payout events (the certified sandbox provider's
 * own responses) against the canonical obligations: every payout.submitted
 * must be matched by a payout.paid whose amount equals its obligation's
 * amount to the franc. A submitted payout with no reconciling paid record,
 * or a paid amount diverging from the obligation, alerts — and NOTHING here
 * marks anything paid, releases anything, or double-counts: obligations are
 * read, never written.
 */
export class PayoutReconciliationMonitor {
  private readonly alerted = new Set<string>();
  private sequence = 0;

  check(
    args: {
      orderId: string;
      correlationId: string;
      obligations: readonly SettlementObligation[];
      payoutEvents: readonly PlatformEvent[];
      nowIso: string;
    },
  ): PlatformEvent[] {
    const fired: PlatformEvent[] = [];
    const paidByRef = new Map<string, number>();
    for (const e of args.payoutEvents) {
      if (e.name !== 'payout.paid.v1') continue;
      const p = e.payload as { collectRef?: unknown; amount?: unknown };
      if (typeof p.collectRef === 'string' && typeof p.amount === 'number') {
        paidByRef.set(p.collectRef, p.amount);
      }
    }
    for (const e of args.payoutEvents) {
      if (e.name !== 'payout.submitted.v1') continue;
      const p = e.payload as { collectRef?: unknown; amount?: unknown };
      if (typeof p.collectRef !== 'string' || typeof p.amount !== 'number') continue;
      if (this.alerted.has(p.collectRef)) continue;
      const paidAmount = paidByRef.get(p.collectRef);
      const party = p.collectRef.endsWith('_supplier') ? 'supplier' : p.collectRef.endsWith('_reseller') ? 'reseller' : undefined;
      const obligation = party === undefined ? undefined : args.obligations.find((o) => o.party.startsWith(`${party}:`));
      const divergences: string[] = [];
      if (paidAmount === undefined) divergences.push('submitted_without_paid');
      else if (paidAmount !== p.amount) divergences.push(`paid_amount_${paidAmount}_diverges_from_submitted_${p.amount}`);
      if (obligation !== undefined && p.amount !== obligation.amount) {
        divergences.push(`submitted_${p.amount}_diverges_from_obligation_${obligation.amount}`);
      }
      if (divergences.length === 0) continue;
      this.alerted.add(p.collectRef);
      this.sequence += 1;
      fired.push(alertEvent(`recon-payout-${p.collectRef}`, args.correlationId, this.sequence, {
        scenario: 'payout_not_reconciled',
        order_id: args.orderId,
        collect_ref: p.collectRef,
        divergences,
      }, args.nowIso));
    }
    return fired;
  }
}

/**
 * Scenario 8 — "an offline queue exceeds its backlog threshold"
 * (Contract §6). The queue is REAL (sera's per-spine offline evidence
 * queue, drained exclusively through the server_confirmed binding); this
 * monitor observes the fleet-wide aggregate the caller measures from those
 * real queues, and alerts on depth or age. Flushing is the spine's job;
 * observing the flush emptied the world is this monitor's negative arm.
 */
export class OfflineBacklogMonitor {
  private sequence = 0;

  observe(
    args: { queuedBundles: number; oldestQueuedAtIso?: string; nowIso: string },
    policy = OFFLINE_BACKLOG_POLICY_V1,
  ): { alerted: boolean; event?: PlatformEvent } {
    const oldestAgeMin =
      args.oldestQueuedAtIso === undefined
        ? 0
        : (Date.parse(args.nowIso) - Date.parse(args.oldestQueuedAtIso)) / 60_000;
    const overDepth = args.queuedBundles > policy.maxQueuedBundles;
    const overAge = oldestAgeMin > policy.maxOldestAgeMin;
    if (!overDepth && !overAge) return { alerted: false };
    this.sequence += 1;
    return {
      alerted: true,
      event: alertEvent(`recon-offline-backlog-${this.sequence}`, `ops-offline-${this.sequence}`, this.sequence, {
        scenario: 'offline_backlog_threshold_exceeded',
        queued_bundles: args.queuedBundles,
        oldest_age_min: Math.floor(oldestAgeMin),
        over_depth: overDepth,
        over_age: overAge,
        policy_version: policy.version,
      }, args.nowIso),
    };
  }
}
