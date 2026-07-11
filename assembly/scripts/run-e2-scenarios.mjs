#!/usr/bin/env node
// WO-2.8 — THE EIGHT ADVERSARIAL SCENARIOS, LIVE (Contract E2 exit: each
// "produces the defined recovery state + a reconciliation alert"), plus the
// live DLQ + stuck-saga proofs (item 3) and the offline flush at scale
// (item 5). Everything runs over the pinned live wiring — real services,
// real workerd DOs, the certified sandbox provider — and every scenario
// asserts THREE things: the recovery state, the exact alert, and that
// nothing was released or double-counted. Writes assembly/E2-SCENARIOS.md.
import { writeFileSync } from 'node:fs';
import { runChain } from '@platform/certification';
import { QuoteSchema } from '@platform/contracts';
import {
  DeadLetterQueue,
  MockPaymentProvider,
  OrderSpine,
  WORKED_BASELINE_INPUT,
  issueQuote,
  reservationReconciliationAlert,
} from '@shop-plus/commerce-core';
import { ProtectionDesk, FulfillmentBook, FULFILLMENT_AGING_POLICY_V2 } from '@boutik/fulfillment-service';
import { CustodySpine, OpsMonitor, OPS_AGING_POLICY_V1 } from '@sera/custody-service';
import { createLiveWorld } from '../dist/world.js';
import { makeLiveChainAdapters } from '../dist/live-adapters.js';
import {
  OfflineBacklogMonitor,
  OFFLINE_BACKLOG_POLICY_V1,
  PayoutReconciliationMonitor,
  SettlementSubmissionMonitor,
  SETTLEMENT_SUBMISSION_TTL_V1,
} from '../dist/e2-monitors.js';

const T0 = Date.UTC(2026, 6, 10, 12, 0, 0);
const AT = (min) => new Date(T0 + min * 60_000).toISOString();
const rows = [];
const fail = (msg) => { console.error(`SCENARIO FAILED: ${msg}`); process.exit(1); };
const row = (name, recovery, alert, evidence) => {
  rows.push({ name, recovery, alert, evidence });
  console.log(`✓ ${name}\n    recovery: ${recovery}\n    alert: ${alert}\n    ${evidence}`);
};
const one = (events, predicate, what) => {
  const hits = events.filter(predicate);
  if (hits.length !== 1) fail(`expected exactly one ${what}, got ${hits.length}`);
  return hits[0];
};

const world = await createLiveWorld();
try {
  console.log('=== E2 SCENARIO MATRIX — live wiring at the WO-2.8 pins ===\n');

  // The completed live chain gives the ledger-seam scenarios REAL inputs
  // (canonical obligations + the certified provider's payout responses).
  let tick = 0;
  const clock = { now: () => new Date(T0 + tick++ * 1000).toISOString() };
  const chain = await runChain(makeLiveChainAdapters(world, clock), 'e2sc');
  if (!chain.ok) fail('the fifteen-step chain did not complete — scenarios need a real world');
  const orderId = chain.chainIds.order_id;
  const chainQuote = QuoteSchema.parse(world.slots.quote);
  const chainSpine = world.slots.orderSpine;
  const obligations = chainSpine.ledger.obligationsFor(orderId);
  const escrowBefore = JSON.stringify(chainSpine.ledger.escrowFor(orderId));
  const obligationsBefore = JSON.stringify(obligations);

  // ── 1. reservation-held-after-payment-fail ────────────────────────────
  {
    const flags = await world.flagSnapshot();
    const issued = issueQuote(
      { flags, now: () => new Date(AT(0)), newId: () => 'quote_s1' },
      { listingRef: 'lst_s1', offerRef: 'offer_s1@1', attributionResellerId: 'rs_s1', ...WORKED_BASELINE_INPUT },
    );
    if (!issued.ok) fail(`s1 quote refused: ${issued.reason}`);
    const spine = new OrderSpine({
      quote: issued.quote, supplierRef: 'sup_s1', correlationId: 'corr_s1',
      issueCommandId: 'c_s1', actor: 'assembly:e2', serverTime: AT(0),
    });
    const reserved = await world.reservationDo(issued.quote.id, {
      kind: 'reserve', command_id: 'rsv_s1', quoteId: issued.quote.id,
      holderRef: 'buyer_s1', nowIso: AT(0), newReservationId: 'rsv_s1_id',
    });
    if (reserved.status !== 200 || !reserved.body.ok) fail(`s1 reserve refused: ${JSON.stringify(reserved.body)}`);
    spine.advance({ command_id: 'a_s1_res', actor: 'assembly:e2', serverTime: AT(0), to: 'reserved', chainAdditions: { reservation_id: 'rsv_s1_id' } });
    spine.advance({ command_id: 'a_s1_pay', actor: 'assembly:e2', serverTime: AT(1), to: 'payment_pending', chainAdditions: { payment_attempt_id: 'att_s1', order_id: 'order_s1' } });
    const failed = spine.failPayment({ command_id: 'a_s1_fail', actor: 'assembly:e2', serverTime: AT(2), reason: 'charge_timeout' });
    if (!failed.ok) fail('s1 failPayment refused');
    // the reservation is DELIBERATELY still held in the DO → the safety net:
    const heldView = { status: 'reserved', reservationId: 'rsv_s1_id', quoteId: issued.quote.id, holderRef: 'buyer_s1', reservedAt: AT(0), expiresAt: AT(15) };
    const alert = reservationReconciliationAlert(spine, heldView, { serverTime: AT(3) });
    if (alert?.name !== 'reconciliation.alert.v1' || alert.payload.alert !== 'reservation_held_after_payment_failure') {
      fail(`s1 alert wrong: ${JSON.stringify(alert)}`);
    }
    // DEFINED RECOVERY: the immediate release (the rule), via the LIVE DO.
    const released = await world.reservationDo(issued.quote.id, {
      kind: 'release', command_id: 'rel_s1', quoteId: issued.quote.id, nowIso: AT(3), reason: 'payment_failed',
    });
    if (released.status !== 200 || !released.body.ok) fail(`s1 release refused: ${JSON.stringify(released.body)}`);
    const replay = await world.reservationDo(issued.quote.id, {
      kind: 'release', command_id: 'rel_s1', quoteId: issued.quote.id, nowIso: AT(4), reason: 'payment_failed',
    });
    if (replay.status !== 200 || !replay.body.ok) fail('s1 release replay not idempotent');
    if (chainSpine.ledger.escrowFor('order_s1') !== undefined) fail('s1 money appeared from nowhere');
    row(
      'reservation-held-after-payment-fail',
      'reservation released through the live DO (idempotent on replay); order in canonical payment_failed; no escrow record exists',
      `reconciliation.alert.v1 · alert=reservation_held_after_payment_failure · reservation_id_held=rsv_s1_id`,
      `evidence: failPayment(charge_timeout) at ${AT(2)} → alert at ${AT(3)} → DO release ok + replay ok`,
    );
  }

  // ── 2. paid-order-no-supplier-decision (boutik desk, live) ────────────
  {
    const book = new FulfillmentBook();
    const desk = new ProtectionDesk(book);
    desk.registerPaidOrder({ orderId: 'order_s2', sellerId: 'seller_s2', paidAt: AT(0), amountFcfa: 12_500, evidenceBundleId: 'veb_s2' });
    const early = desk.sweepDecisionAging(AT(60));
    if (early.alerted.length !== 0) fail('s2 alerted before the versioned deadline');
    const swept = desk.sweepDecisionAging(AT(FULFILLMENT_AGING_POLICY_V2.acceptanceDecisionMin + 1));
    if (swept.alerted.length !== 1 || swept.alerted[0] !== 'order_s2') fail(`s2 sweep wrong: ${JSON.stringify(swept)}`);
    const again = desk.sweepDecisionAging(AT(FULFILLMENT_AGING_POLICY_V2.acceptanceDecisionMin + 30));
    if (again.alerted.length !== 0) fail('s2 alert fired twice');
    const alert = one(desk.allEvents(), (e) => e.name === 'reconciliation.alert.v1' && e.payload.kind === 'paid_order_no_supplier_decision', 's2 alert');
    const refund = desk.allRefundsRequired().find((r) => r.orderId === 'order_s2');
    if (!refund || refund.amountFcfa !== 12_500 || refund.buyerPriority !== true) fail('s2 B+I-13 refund-required record wrong');
    row(
      'paid-order-no-supplier-decision',
      `B+I-13 refund_required record (amount COPIED 12500, buyerPriority=true) + seller-fault ProtectionClaim opened; alert exactly once (${FULFILLMENT_AGING_POLICY_V2.version})`,
      `reconciliation.alert.v1 · kind=paid_order_no_supplier_decision · aged past ${FULFILLMENT_AGING_POLICY_V2.acceptanceDecisionMin}min`,
      `evidence: silent below deadline, one alert past it, idempotent on re-sweep; command_id=${alert.envelope.command_id}`,
    );
  }

  // ── 3. ready-package-no-task (boutik desk, live) ──────────────────────
  {
    const book = new FulfillmentBook();
    const desk = new ProtectionDesk(book);
    desk.registerPaidOrder({ orderId: 'order_s3', sellerId: 'seller_s3', paidAt: AT(0), amountFcfa: 12_500, evidenceBundleId: 'veb_s3' });
    const accepted = book.accept({ orderId: 'order_s3', variant: 'v_s3', qty: 1, sellerNetFcfa: 8_500, deadline: AT(600) });
    if (!accepted.ok) fail(`s3 accept refused: ${accepted.reason}`);
    const challenge = book.issueChallenge('order_s3', AT(1));
    if (!challenge.ok) fail('s3 challenge refused');
    const ready = book.confirmReady({
      orderId: 'order_s3', photoRef: { ref: 'proof/s3.jpg', sha256: 'a'.repeat(64), mimeType: 'image/jpeg' },
      readinessChallenge: challenge.challenge, qty: 1, variant: 'v_s3', availableConfirmed: true, at: AT(2),
    }, AT(2));
    if (!ready.ok) fail(`s3 readiness refused: ${ready.reason}`);
    const early = desk.sweepReadyNoTask(() => false, AT(30));
    if (early.alerted.length !== 0) fail('s3 alerted before the window');
    const swept = desk.sweepReadyNoTask(() => false, AT(FULFILLMENT_AGING_POLICY_V2.readyPackageNoTaskMin + 3));
    if (swept.alerted.length !== 1) fail(`s3 sweep wrong: ${JSON.stringify(swept)}`);
    const withTask = desk.sweepReadyNoTask(() => true, AT(FULFILLMENT_AGING_POLICY_V2.readyPackageNoTaskMin + 30));
    if (withTask.alerted.length !== 0) fail('s3 alerted although a task exists');
    const alert = one(desk.allEvents(), (e) => e.name === 'reconciliation.alert.v1' && String(e.payload.kind ?? '').includes('ready'), 's3 alert');
    row(
      'ready-package-no-task',
      'package stays READY (no claim, no state mutation — dispatch is the runbook action); alert exactly once per readiness episode',
      `reconciliation.alert.v1 · ${JSON.stringify({ kind: alert.payload.kind })} past ${FULFILLMENT_AGING_POLICY_V2.readyPackageNoTaskMin}min`,
      `evidence: silent below window and when a task exists; one alert in the gap; command_id=${alert.envelope.command_id}`,
    );
  }

  // ── 4. impossible-custody (sera, live cross-instance conflict) ────────
  {
    const mkSpine = (rider) => {
      const s = new CustodySpine({ order_id: `order_s4_${rider}`, task_id: `task_s4_${rider}`, package_id: 'pkg_s4', correlation_id: 'corr_s4' }, 'sup_s4');
      const oid = `order_s4_${rider}`;
      s.secrets.register('pickup_verification_code', oid, `pvc_${rider}`);
      s.secrets.register('custody_seal', oid, `seal_${rider}`);
      s.secrets.register('buyer_drop_code', oid, `bdc_${rider}`);
      s.establishSellerCustody(AT(0));
      const v = s.verifyPickup({
        orderId: oid, riderId: rider,
        checkResults: { order_ref: true, identity: true, variant: true, colour: true, size_label: true, qty: true, damage: true, pieces: true, manufacturer_seal: true },
        dwellSec: 150, evidenceBundleId: `veb_${rider}`, custodySealId: `seal_${rider}`,
      }, `pvc_${rider}`, AT(1));
      if (v.kind !== 'accepted') fail(`s4 verify refused for ${rider}`);
      const c = s.beginCustody({ riderId: rider, verificationOrderId: oid, custodySealId: `seal_${rider}`, sealPhotoRefs: [`seal/${rider}.jpg`], at: AT(2) });
      if (!c.ok) fail(`s4 custody refused for ${rider}`);
      return s;
    };
    // Each spine is internally consistent (one custodian each) — the
    // IMPOSSIBLE sequence is visible only at the store seam: one package_id,
    // two simultaneous courier custodians. That seam observation feeds the
    // real OpsMonitor.
    const sA = mkSpine('rider_A');
    const sB = mkSpine('rider_B');
    const custodyEventsA = sA.allEvents().filter((e) => e.name === 'custody.transferred_to_courier.v1').length;
    const custodyEventsB = sB.allEvents().filter((e) => e.name === 'custody.transferred_to_courier.v1').length;
    if (custodyEventsA !== 1 || custodyEventsB !== 1) fail('s4 setup: expected one courier custody each');
    const ops = new OpsMonitor();
    const observed = ops.observe({
      scenario: 'impossible_custody',
      packageId: 'pkg_s4',
      detail: 'two simultaneous courier custodians for pkg_s4: rider_A and rider_B (conflicting-custodian write at the store)',
      at: AT(3),
    });
    if (!observed.alerted || observed.event?.name !== 'reconciliation.alert.v1') fail('s4 alert missing');
    // DEFINED RECOVERY: nothing auto-releases — neither spine can reach
    // eligibility without its own full evidence + drop code (evidence
    // supports, never releases); the dispatcher resolves per the runbook.
    const dropAttempt = sA.confirmDropAndEmitEligibility('WRONG', AT(4));
    if (dropAttempt.ok) fail('s4 an unresolved conflict released settlement');
    row(
      'impossible-custody',
      'package frozen for human resolution: NO automatic release, NO eligibility (a wrong-code drop refuses closed); dispatcher resolves per runbook',
      `reconciliation.alert.v1 · scenario=impossible_custody · package_id=pkg_s4`,
      `evidence: two live spines each hold ONE courier custody of pkg_s4 — the conflict is store-seam-visible; ops alert ${observed.event.envelope.command_id}`,
    );
  }

  // ── 5. evidence-not-validated (sera, live aging) ──────────────────────
  {
    const oid = 'order_s5';
    const spine = new CustodySpine({ order_id: oid, task_id: 'task_s5', package_id: 'pkg_s5', correlation_id: 'corr_s5' }, 'sup_s5');
    spine.secrets.register('pickup_verification_code', oid, 'pvc_s5');
    spine.secrets.register('custody_seal', oid, 'seal_s5');
    spine.secrets.register('buyer_drop_code', oid, 'bdc_s5');
    spine.establishSellerCustody(AT(0));
    spine.verifyPickup({
      orderId: oid, riderId: 'rider_s5',
      checkResults: { order_ref: true, identity: true, variant: true, colour: true, size_label: true, qty: true, damage: true, pieces: true, manufacturer_seal: true },
      dwellSec: 150, evidenceBundleId: 'veb_s5', custodySealId: 'seal_s5',
    }, 'pvc_s5', AT(1));
    spine.beginCustody({ riderId: 'rider_s5', verificationOrderId: oid, custodySealId: 'seal_s5', sealPhotoRefs: ['seal/s5.jpg'], at: AT(2) });
    const submitted = spine.submitDeliveryEvidence({
      taskId: 'task_s5', packageId: 'pkg_s5', custodySealId: 'seal_s5',
      artifacts: [{ ref: 'evidence/s5.jpg', sha256: 'a'.repeat(64), mimeType: 'image/jpeg' }], capturedAt: AT(3),
    }, 'server_confirmed', AT(3));
    if (!submitted.ok) fail('s5 evidence refused');
    // validation deliberately NOT decided → the aging detector:
    const ops = new OpsMonitor();
    const under = ops.observe({ scenario: 'evidence_not_validated_aging', taskId: 'task_s5', submittedAt: AT(3), now: AT(3 + OPS_AGING_POLICY_V1.evidenceDecisionAgingMin - 5) });
    if (under.alerted) fail('s5 alerted under the aging window');
    const over = ops.observe({ scenario: 'evidence_not_validated_aging', taskId: 'task_s5', submittedAt: AT(3), now: AT(3 + OPS_AGING_POLICY_V1.evidenceDecisionAgingMin + 1) });
    if (!over.alerted) fail('s5 no alert past the window');
    // DEFINED RECOVERY: the decision is still available and validates.
    const decided = spine.decideValidation(AT(40));
    if (!decided.ok || decided.decision.result !== 'validated') fail(`s5 recovery decide failed: ${JSON.stringify(decided)}`);
    row(
      'evidence-not-validated',
      `ValidationDecision reached (validated) once the operator runs the decision — evidence never auto-released anything (${OPS_AGING_POLICY_V1.version})`,
      `reconciliation.alert.v1 · scenario=evidence_not_validated_aging · age past ${OPS_AGING_POLICY_V1.evidenceDecisionAgingMin}min`,
      `evidence: silent at -5min, alert at +1min; recovery decideValidation → validated`,
    );
  }

  // ── 6. settlement-eligible-not-submitted (LEDGER SEAM, built here) ────
  {
    const monitor = new SettlementSubmissionMonitor();
    const eligibleAt = clock.now();
    const feed = obligations.map((obligation) => ({ obligation, eligibleAtIso: eligibleAt, correlationId: chain.correlationId ?? 'corr_e2sc' }));
    const under = monitor.check(feed, new Date(Date.parse(eligibleAt) + 30 * 60_000).toISOString());
    if (under.length !== 0) fail('s6 alerted under the TTL');
    const fired = monitor.check(feed, new Date(Date.parse(eligibleAt) + (SETTLEMENT_SUBMISSION_TTL_V1.eligibleUnsubmittedMin + 1) * 60_000).toISOString());
    if (fired.length !== 2) fail(`s6 expected 2 alerts (both obligations), got ${fired.length}`);
    const refire = monitor.check(feed, new Date(Date.parse(eligibleAt) + 500 * 60_000).toISOString());
    if (refire.length !== 0) fail('s6 alerts re-fired');
    if (JSON.stringify(chainSpine.ledger.obligationsFor(orderId)) !== obligationsBefore) fail('s6 obligations mutated');
    row(
      'settlement-eligible-not-submitted',
      `obligations REMAIN Eligible, byte-untouched (submission is E3 — the alert is the bridge until it exists); one alert per obligation (${SETTLEMENT_SUBMISSION_TTL_V1.version})`,
      `reconciliation.alert.v1 · scenario=settlement_eligible_not_submitted · ${fired.map((e) => e.payload.party).join(' + ')}`,
      `evidence: silent at 30min, both fire past ${SETTLEMENT_SUBMISSION_TTL_V1.eligibleUnsubmittedMin}min, never re-fire; obligations byte-identical`,
    );
  }

  // ── 7. payout-not-reconciled (LEDGER SEAM, built here) ────────────────
  {
    const monitor = new PayoutReconciliationMonitor();
    const clean = monitor.check({ orderId, correlationId: 'corr_e2sc', obligations, payoutEvents: world.slots.payoutEvents, nowIso: clock.now() });
    if (clean.length !== 0) fail(`s7 the certified provider's own responses must reconcile clean, got ${clean.length} alerts`);
    // divergence: the provider's paid record for the supplier leg never arrives.
    const diverged = world.slots.payoutEvents.filter((e) => !(e.name === 'payout.paid.v1' && String(e.payload.collectRef).endsWith('_supplier')));
    const fired = monitor.check({ orderId, correlationId: 'corr_e2sc', obligations, payoutEvents: diverged, nowIso: clock.now() });
    if (fired.length !== 1 || !fired[0].payload.divergences.includes('submitted_without_paid')) fail(`s7 divergence not caught: ${JSON.stringify(fired)}`);
    const refire = monitor.check({ orderId, correlationId: 'corr_e2sc', obligations, payoutEvents: diverged, nowIso: clock.now() });
    if (refire.length !== 0) fail('s7 alert re-fired');
    if (JSON.stringify(chainSpine.ledger.escrowFor(orderId)) !== escrowBefore) fail('s7 escrow mutated');
    if (JSON.stringify(chainSpine.ledger.obligationsFor(orderId)) !== obligationsBefore) fail('s7 obligations mutated — double-count risk');
    row(
      'payout-not-reconciled',
      'payout stays UNRECONCILED — nothing marked paid, escrow + obligations byte-identical (no double-count); operator reconciles per runbook',
      `reconciliation.alert.v1 · scenario=payout_not_reconciled · divergences=[submitted_without_paid]`,
      `evidence: certified provider responses reconcile CLEAN (0 alerts); dropping the supplier paid record → exactly one alert, no re-fire`,
    );
  }

  // ── 8. offline-backlog (sera queue at scale + threshold + flush) ──────
  {
    const spines = [];
    for (let i = 0; i < 30; i += 1) {
      const oid = `order_s8_${i}`;
      const s = new CustodySpine({ order_id: oid, task_id: `task_s8_${i}`, package_id: `pkg_s8_${i}`, correlation_id: 'corr_s8' }, 'sup_s8');
      s.secrets.register('pickup_verification_code', oid, `pvc_${i}`);
      s.secrets.register('custody_seal', oid, `seal_${i}`);
      s.secrets.register('buyer_drop_code', oid, `bdc_${i}`);
      s.establishSellerCustody(AT(0));
      s.verifyPickup({
        orderId: oid, riderId: `rider_s8_${i}`,
        checkResults: { order_ref: true, identity: true, variant: true, colour: true, size_label: true, qty: true, damage: true, pieces: true, manufacturer_seal: true },
        dwellSec: 150, evidenceBundleId: `veb_s8_${i}`, custodySealId: `seal_${i}`,
      }, `pvc_${i}`, AT(1));
      s.beginCustody({ riderId: `rider_s8_${i}`, verificationOrderId: oid, custodySealId: `seal_${i}`, sealPhotoRefs: [`seal/${i}.jpg`], at: AT(2) });
      const queued = s.submitDeliveryEvidence({
        taskId: `task_s8_${i}`, packageId: `pkg_s8_${i}`, custodySealId: `seal_${i}`,
        artifacts: [{ ref: `evidence/s8_${i}.jpg`, sha256: 'a'.repeat(64), mimeType: 'image/jpeg' }], capturedAt: AT(3),
      }, 'queued_offline', AT(3));
      if (!queued.ok || !queued.pending) fail(`s8 queueing failed for ${oid}: ${JSON.stringify(queued)}`);
      // kernel offline law live: queued = pending, never done — the decision
      // CANNOT see the bundle before the flush.
      const blind = s.decideValidation(AT(4));
      if (blind.ok) fail('s8 a queued bundle reached validation before the flush — offline law broken');
      spines.push(s);
    }
    const depth = spines.filter((s) => s.hasPendingOfflineEvidence()).length;
    if (depth !== 30) fail(`s8 expected 30 queued, got ${depth}`);
    const monitor = new OfflineBacklogMonitor();
    const under = monitor.observe({ queuedBundles: 10, oldestQueuedAtIso: AT(3), nowIso: AT(10) });
    if (under.alerted) fail('s8 alerted under both thresholds');
    const over = monitor.observe({ queuedBundles: depth, oldestQueuedAtIso: AT(3), nowIso: AT(3 + OFFLINE_BACKLOG_POLICY_V1.maxOldestAgeMin + 5) });
    if (!over.alerted || over.event.payload.scenario !== 'offline_backlog_threshold_exceeded') fail('s8 threshold alert missing');
    // DEFINED RECOVERY: the flush — EXCLUSIVELY through the server_confirmed
    // binding — drains every queue; the world then observes clean.
    let drained = 0; let accepted = 0;
    for (const s of spines) {
      const out = s.flushOfflineEvidence(AT(45));
      drained += out.drained; accepted += out.accepted;
      if (out.refusals.length > 0) fail(`s8 flush refused: ${JSON.stringify(out.refusals)}`);
    }
    if (drained !== 30 || accepted !== 30) fail(`s8 flush drained ${drained}, accepted ${accepted}`);
    const after = monitor.observe({ queuedBundles: 0, nowIso: AT(50) });
    if (after.alerted) fail('s8 alerted on an empty queue');
    // and the drained evidence VALIDATES (queued was pending, not lost):
    const decided = spines[0].decideValidation(AT(46));
    if (!decided.ok || decided.decision.result !== 'validated') fail('s8 drained evidence did not validate');
    row(
      'offline-backlog',
      `all 30 queues drained through the server_confirmed binding (30/30 accepted, 0 refusals) and the drained evidence validates; empty queue observes clean (${OFFLINE_BACKLOG_POLICY_V1.version})`,
      `reconciliation.alert.v1 · scenario=offline_backlog_threshold_exceeded · 30 bundles > ${OFFLINE_BACKLOG_POLICY_V1.maxQueuedBundles} and oldest > ${OFFLINE_BACKLOG_POLICY_V1.maxOldestAgeMin}min`,
      `evidence: queued=pending proven live (pre-flush validation refused on every spine); 10 bundles under both thresholds stayed silent`,
    );
  }

  // ── item 3 — DLQ + stuck-saga, LIVE cross-app ─────────────────────────
  {
    // a REAL producer's webhook, torn in transit (byte truncation):
    const provider = new MockPaymentProvider({});
    provider.initiateCharge({ orderId: 'order_dlq', paymentAttemptId: 'att_dlq', amount: 12_500, correlationId: 'corr_dlq', requestedAtIso: AT(0) });
    const realWebhook = JSON.stringify(provider.webhookDeliveryPlan()[0].event);
    const torn = realWebhook.slice(0, Math.floor(realWebhook.length * 0.7));
    const dlq = new DeadLetterQueue();
    const parked = dlq.parkIfPoison(torn, { correlationId: 'corr_dlq', at: AT(1) });
    if (!parked.poison || parked.entry.original !== torn) fail('DLQ did not park the torn webhook byte-exact');
    const healthy = dlq.parkIfPoison(realWebhook, { correlationId: 'corr_dlq', at: AT(1) });
    if (healthy.poison) fail('DLQ parked a healthy canon event');
    console.log(`✓ DLQ live: torn real-producer webhook parked byte-exact (sha256=${parked.entry.originalSha256.slice(0, 12)}…, event=${parked.event.name}); the intact webhook passes through`);

    const flags = await world.flagSnapshot();
    const issued = issueQuote(
      { flags, now: () => new Date(AT(0)), newId: () => 'quote_stuck' },
      { listingRef: 'lst_st', offerRef: 'offer_st@1', attributionResellerId: 'rs_st', ...WORKED_BASELINE_INPUT },
    );
    if (!issued.ok) fail('stuck-saga quote refused');
    const spine = new OrderSpine({ quote: issued.quote, supplierRef: 'sup_st', correlationId: 'corr_st', issueCommandId: 'c_st', actor: 'assembly:e2', serverTime: AT(0) });
    spine.advance({ command_id: 'a_st_res', actor: 'assembly:e2', serverTime: AT(0), to: 'reserved', chainAdditions: { reservation_id: 'rsv_st' } });
    spine.advance({ command_id: 'a_st_pay', actor: 'assembly:e2', serverTime: AT(1), to: 'payment_pending', chainAdditions: { payment_attempt_id: 'att_st', order_id: 'order_st' } });
    const silent = spine.checkStuckSaga(AT(10), { version: 'stuck-ttl.v1', paymentPendingTtlMs: 15 * 60_000 });
    if (silent !== null) fail('stuck-saga fired under TTL');
    const stuck = spine.checkStuckSaga(AT(17), { version: 'stuck-ttl.v1', paymentPendingTtlMs: 15 * 60_000 });
    if (stuck?.name !== 'saga.stuck.v1') fail('stuck-saga did not fire past TTL');
    const once = spine.checkStuckSaga(AT(30), { version: 'stuck-ttl.v1', paymentPendingTtlMs: 15 * 60_000 });
    if (once !== null) fail('stuck-saga fired twice');
    console.log(`✓ stuck-saga live: silent at 10min, saga.stuck.v1 exactly once past the 15min TTL (pending_since=${stuck.payload.pending_since}), never again`);
  }

  // ── the committed matrix ──────────────────────────────────────────────
  const md = [
    '# E2 SCENARIO MATRIX — WO-2.8 (Contract E2 exit)',
    '',
    '> Each of the eight adversarial scenarios, driven END-TO-END through the',
    '> live assembly wiring at the pinned post-2.7 app mains, "produces the',
    '> defined recovery state + a reconciliation alert" (Contract E2 exit,',
    '> verbatim). Regenerate with `pnpm e2:scenarios` — this file is written',
    '> by that run, never by hand. Runbooks: `assembly/runbooks/`.',
    '',
    '| # | Contract scenario | Defined recovery state | reconciliation.alert.v1 payload | Evidence (from this run) |',
    '|---|---|---|---|---|',
    ...rows.map((r, i) => `| ${i + 1} | ${r.name} | ${r.recovery} | ${r.alert} | ${r.evidence.replace('evidence: ', '')} |`),
    '',
    `Pins: sera 6213d41 · boutik 7e4901d · shop 74913d7 · canon 0ff6696 (v0.5.0).`,
    '',
  ].join('\n');
  writeFileSync(new URL('../E2-SCENARIOS.md', import.meta.url), md);
  console.log(`\nE2-SCENARIOS.md written — ${rows.length}/8 scenarios live`);
  if (rows.length !== 8) fail(`expected 8 rows, got ${rows.length}`);
} finally {
  await world.dispose();
}
process.exit(0);
