/**
 * §3 LIVE PRODUCERS — the live siblings of the certified mocks, implementing
 * the SAME MockAdapter interface so BOTH sides of each pair run the SAME
 * 8-behavior suite before replacement (Contract §3). Payloads, projections,
 * and invalid-transition refusals come from REAL service code; the transport
 * misbehaviors (duplicate / out-of-order / delay / timeout / partial) are
 * applied at the delivery layer around those real emissions — §3's
 * misbehaviors are transport-level by definition.
 */
import { setTimeout as sleep } from 'node:timers/promises';
import type { PlatformEvent } from '@platform/contracts';
import {
  DOMAIN_PAYLOAD_SCHEMAS,
  MockTimeoutError,
  type EmissionControls,
  type EmissionResult,
  type MockAdapter,
  type ProjectionRead,
  type TransitionAttempt,
} from '@platform/certification';
import { SupplierRegistry } from '@boutik/supplier-service';
import { ProductCatalog } from '@boutik/catalog-service';
import { OfferBook, buildSupplyProjection } from '@boutik/offer-service';
import { FulfillmentBook } from '@boutik/fulfillment-service';
import { CustodySpine } from '@sera/custody-service';
import { MockPaymentProvider } from '@shop-plus/commerce-core';

const SHA = 'b'.repeat(64);

/** Shared delivery-layer §3 misbehavior wrapper (mirrors the reference base). */
async function deliverUnderControls(
  domain: string,
  seed: string,
  events: PlatformEvent[],
  controls: EmissionControls,
): Promise<EmissionResult> {
  if (controls.timeout) {
    await sleep(1);
    throw new MockTimeoutError(`${domain}: simulated provider timeout for seed ${seed}`);
  }
  let sequence = events;
  if (controls.duplicate && sequence.length >= 2) {
    sequence = [...sequence.slice(0, 2), sequence[1]!, ...sequence.slice(2)];
  }
  if (controls.outOfOrder && sequence.length >= 3) {
    sequence = [...sequence.slice(0, -2), sequence[sequence.length - 1]!, sequence[sequence.length - 2]!];
  }
  if (controls.delayMs !== undefined && controls.delayMs > 0) {
    await sleep(controls.delayMs);
  }
  if (controls.partialFailure && sequence.length >= 2) {
    return {
      delivered: sequence.slice(0, 1).map((event) => ({ event, deliveredAt: Date.now() })),
      failure: { afterCount: 1, reason: `${domain}: simulated mid-sequence failure` },
    };
  }
  return { delivered: sequence.map((event) => ({ event, deliveredAt: Date.now() })) };
}

function envelope(seed: string, actor: string, n: number) {
  return {
    command_id: `cmd_live_${actor}_${seed}_${n}`,
    correlation_id: `corr_${seed}`,
    aggregateVersion: n,
    actor,
    serverTime: new Date().toISOString(),
    version: 'v1',
  };
}

/** Drive a REAL supplier→product→offer pipeline for one seed. */
function realSupplyWorld(seed: string) {
  const suppliers = new SupplierRegistry();
  const onboarded = suppliers.onboard({ command_id: `ob-${seed}`, phoneAlias: `+226-70-${seed}`, displayName: 'F' });
  if (!onboarded.ok) throw new Error('onboard failed');
  suppliers.confirmPhoneVerified(onboarded.user.id);
  const catalog = new ProductCatalog();
  const created = catalog.create(
    { supplierId: onboarded.user.id, name: 'Pagne', productCode: `P-${seed}`, category: 'textiles', zone: 'Ouaga', variantAttributes: { c: 'indigo' } },
    suppliers.canPublish(onboarded.user.id),
  );
  if (!created.ok) throw new Error('create failed');
  const activated = catalog.activate(created.version.id, suppliers.canPublish(onboarded.user.id));
  if (!activated.ok) throw new Error('activate failed');
  const offers = new OfferBook();
  const offer = offers.create(
    {
      productVersionId: activated.version.id, basePrice: 10_000, resellerCommission: 1_000,
      eligibleVariants: [created.variant.id], zones: ['Ouaga'],
      effective: '2026-07-01T00:00:00.000Z', expiry: '2026-08-09T00:00:00.000Z',
    },
    suppliers.canPublish(onboarded.user.id),
  );
  if (!offer.ok) throw new Error('offer failed');
  return { product: activated.version, offer: offer.offer, variantId: created.variant.id };
}

/** LIVE supply-projection producer — real boutik pipeline, three real states. */
export function makeLiveSupplyProjectionProducer(): MockAdapter {
  return {
    domain: 'supply-projection',
    producerSchema: DOMAIN_PAYLOAD_SCHEMAS['supply-projection'],
    async emit(seed, controls): Promise<EmissionResult> {
      const { product, offer } = realSupplyWorld(seed);
      const at = (n: number) => `2026-07-10T0${n}:00:00.000Z`;
      const states: Array<{ name: PlatformEvent['name']; available: number }> = [
        { name: 'offer.published.v1', available: 5 },
        { name: 'inventory.availability.changed.v1', available: 4 },
        { name: 'inventory.adjusted.v1', available: 4 },
      ];
      const events: PlatformEvent[] = states.map((s, i) => {
        const projection = buildSupplyProjection(product as never, offer as never, s.available, at(i + 1));
        if (!projection.ok) throw new Error(`projection refused: ${projection.reason}`);
        return { name: s.name, envelope: envelope(seed, 'boutik:offer-service-live', i + 1), payload: { ...projection.projection } };
      });
      return deliverUnderControls(this.domain, seed, events, controls);
    },
    async readProjection(seed, options): Promise<ProjectionRead> {
      const { product, offer } = realSupplyWorld(seed);
      // version 1 = at publication (available 5); version 2 = after the real
      // stock decrement (available 4). A stale read serves the older, REAL state.
      const v1 = buildSupplyProjection(product as never, offer as never, 5, '2026-07-10T01:00:00.000Z');
      const v2 = buildSupplyProjection(product as never, offer as never, 4, '2026-07-10T02:00:00.000Z');
      if (!v1.ok || !v2.ok) throw new Error('projection refused');
      return options.stale
        ? { version: 1, asOf: '2026-07-10T01:00:00.000Z', value: { ...v1.projection } }
        : { version: 2, asOf: '2026-07-10T02:00:00.000Z', value: { ...v2.projection } };
    },
    attemptInvalidTransition(): TransitionAttempt {
      // REAL refusal: an expired offer never projects (B+I-04).
      const { product, offer } = realSupplyWorld('invalid-transition');
      const expired = { ...(offer as Record<string, unknown>), expiry: '2026-07-01T00:00:00.000Z' };
      const out = buildSupplyProjection(product as never, expired as never, 5, '2026-07-10T00:00:00.000Z');
      return out.ok
        ? { from: 'expired', to: 'active', accepted: true }
        : { from: 'expired', to: 'active', accepted: false, reason: `live offer-service refused: ${out.reason}` };
    },
  };
}

/** LIVE readiness producer — three real orders through the FulfillmentBook. */
export function makeLiveReadinessProducer(): MockAdapter {
  const driveOrder = (book: FulfillmentBook, orderId: string, at: string) => {
    const accepted = book.accept({ orderId, variant: `var_${orderId}`, qty: 1, sellerNetFcfa: 8_500, deadline: '2026-08-09T00:00:00.000Z' });
    if (!accepted.ok) throw new Error('accept failed');
    const challenge = book.issueChallenge(orderId, at);
    if (!challenge.ok) throw new Error('challenge failed');
    const ready = book.confirmReady(
      {
        orderId,
        photoRef: { ref: `proof/${orderId}.jpg`, sha256: SHA, mimeType: 'image/jpeg' },
        readinessChallenge: challenge.challenge,
        qty: 1,
        variant: `var_${orderId}`,
        availableConfirmed: true,
        at,
      },
      at,
    );
    if (!ready.ok) throw new Error(`confirmReady failed: ${ready.reason}`);
    return ready.confirmation;
  };
  return {
    domain: 'readiness',
    producerSchema: DOMAIN_PAYLOAD_SCHEMAS.readiness,
    async emit(seed, controls): Promise<EmissionResult> {
      const book = new FulfillmentBook();
      const events: PlatformEvent[] = [1, 2, 3].map((n) => {
        const at = `2026-07-10T0${n}:00:00.000Z`;
        const confirmation = driveOrder(book, `order_${seed}_${n}`, at);
        return {
          name: 'fulfillment.ready.v1',
          envelope: envelope(seed, 'boutik:fulfillment-service-live', n),
          payload: { orderId: confirmation.orderId, packageId: `pkg_${seed}_${n}`, readinessConfirmed: true, at },
        };
      });
      return deliverUnderControls(this.domain, seed, events, controls);
    },
    async readProjection(seed, options): Promise<ProjectionRead> {
      const book = new FulfillmentBook();
      const orderId = `order_${seed}_proj`;
      const at = '2026-07-10T01:00:00.000Z';
      // version 1 = REAL pre-readiness state; version 2 = after confirmReady.
      book.accept({ orderId, variant: `var_${orderId}`, qty: 1, sellerNetFcfa: 8_500, deadline: '2026-08-09T00:00:00.000Z' });
      const before = book.isPickupEligible(orderId);
      if (options.stale) return { version: 1, asOf: at, value: { orderId, ready: before } };
      const challenge = book.issueChallenge(orderId, at);
      if (!challenge.ok) throw new Error('challenge failed');
      book.confirmReady(
        {
          orderId,
          photoRef: { ref: `proof/${orderId}.jpg`, sha256: SHA, mimeType: 'image/jpeg' },
          readinessChallenge: challenge.challenge, qty: 1, variant: `var_${orderId}`, availableConfirmed: true, at,
        },
        at,
      );
      return { version: 2, asOf: at, value: { orderId, ready: book.isPickupEligible(orderId) } };
    },
    attemptInvalidTransition(): TransitionAttempt {
      // REAL refusal: an EXPIRED readiness challenge cannot confirm (10-min TTL).
      const book = new FulfillmentBook();
      const orderId = 'order_expired_challenge';
      book.accept({ orderId, variant: 'v', qty: 1, sellerNetFcfa: 8_500, deadline: '2026-08-09T00:00:00.000Z' });
      const challenge = book.issueChallenge(orderId, '2026-07-10T00:00:00.000Z');
      if (!challenge.ok) return { from: 'accepted', to: 'ready', accepted: true };
      const late = book.confirmReady(
        {
          orderId,
          photoRef: { ref: 'proof/late.jpg', sha256: SHA, mimeType: 'image/jpeg' },
          readinessChallenge: challenge.challenge, qty: 1, variant: 'v', availableConfirmed: true,
          at: '2026-07-10T00:20:00.000Z',
        },
        '2026-07-10T00:20:00.000Z',
      );
      return late.ok
        ? { from: 'challenge_expired', to: 'ready', accepted: true }
        : { from: 'challenge_expired', to: 'ready', accepted: false, reason: `live fulfillment refused: ${late.reason}` };
    },
  };
}

/** Drive one REAL custody spine end-to-end. WO-2.8 adaptation to the
 * post-2.7 sera pin: evidence resubmission now refuses
 * `evidence_already_submitted` (the E2 hardening, probed live), so version
 * variance comes from the REAL corrective verification round-trip instead
 * (WO-2.7 item 3): a refused pickup attempt (failed qty check → verification
 * event + fault claim), then `openNewVerificationCycle` with a fresh
 * cycle-2 code, then the accepted attempt — validated lands at version 8
 * where a clean order lands at 6. */
function driveRealSpine(seed: string, n: number, correctiveCycle: boolean) {
  const orderId = `order_${seed}_${n}`;
  const spine = new CustodySpine(
    { order_id: orderId, task_id: `task_${seed}_${n}`, package_id: `pkg_${seed}_${n}`, correlation_id: `corr_${seed}` },
    `sup_${seed}`,
  );
  const at = `2026-07-10T0${n}:00:00.000Z`;
  const verificationInput = (over: Record<string, boolean> = {}) => ({
    orderId, riderId: `rider_${seed}`,
    checkResults: { order_ref: true, identity: true, variant: true, colour: true, size_label: true, qty: true, damage: true, pieces: true, manufacturer_seal: true, ...over },
    dwellSec: 150, evidenceBundleId: `veb_${orderId}`, custodySealId: `seal_${orderId}`,
  });
  spine.secrets.register('pickup_verification_code', orderId, `pvc_${orderId}`);
  spine.secrets.register('custody_seal', orderId, `seal_${orderId}`);
  spine.secrets.register('buyer_drop_code', orderId, `bdc_${orderId}`);
  spine.establishSellerCustody(at);
  let cycleCode = `pvc_${orderId}`;
  if (correctiveCycle) {
    const refused = spine.verifyPickup(verificationInput({ qty: false }), cycleCode, at);
    if (refused.kind !== 'refused') throw new Error(`expected a refused first attempt: ${JSON.stringify(refused)}`);
    cycleCode = `pvc_${orderId}_c2`;
    const cycle = spine.openNewVerificationCycle(cycleCode, at);
    if (!cycle.ok) throw new Error(`new verification cycle refused: ${JSON.stringify(cycle)}`);
  }
  const verified = spine.verifyPickup(verificationInput(), cycleCode, at);
  if (verified.kind !== 'accepted') throw new Error(`verify failed: ${JSON.stringify(verified)}`);
  const custody = spine.beginCustody({ riderId: `rider_${seed}`, verificationOrderId: orderId, custodySealId: `seal_${orderId}`, sealPhotoRefs: [`seal/${orderId}.jpg`], at });
  if (!custody.ok) throw new Error(`custody failed: ${custody.reason}`);
  const bundle = {
    taskId: `task_${seed}_${n}`, packageId: `pkg_${seed}_${n}`, custodySealId: `seal_${orderId}`,
    artifacts: [{ ref: `evidence/${orderId}.jpg`, sha256: SHA, mimeType: 'image/jpeg' }], capturedAt: at,
  };
  const submitted = spine.submitDeliveryEvidence(bundle, 'server_confirmed', at);
  if (!submitted.ok) throw new Error(`evidence failed: ${JSON.stringify(submitted)}`);
  const decided = spine.decideValidation(at);
  if (!decided.ok) throw new Error('decide failed');
  const dropped = spine.confirmDropAndEmitEligibility(`bdc_${orderId}`, at);
  if (!dropped.ok || dropped.duplicate) throw new Error('drop failed');
  return { spine, validated: dropped.events.find((e) => e.name === 'delivery.validated.v1')! };
}

/** LIVE eligibility producer — sera CustodySpine, the SE-I09 amount-free signal. */
export function makeLiveEligibilityProducer(): MockAdapter {
  return {
    domain: 'eligibility',
    producerSchema: DOMAIN_PAYLOAD_SCHEMAS.eligibility,
    async emit(seed, controls): Promise<EmissionResult> {
      // Three real orders; the LAST goes through the corrective
      // verification round-trip (WO-2.7 cycles), so the version tail is
      // strictly increasing — enough for the ordered/out-of-order checks.
      const events = [false, false, true].map((corrective, i) => driveRealSpine(seed, i + 1, corrective).validated);
      return deliverUnderControls(this.domain, seed, events, controls);
    },
    async readProjection(seed, options): Promise<ProjectionRead> {
      // version 1 = REAL pre-drop state (validated, not yet eligible);
      // version 2 = after the drop code (eligibility emitted).
      if (options.stale) {
        const orderId = `order_${seed}_stale`;
        const spine = new CustodySpine(
          { order_id: orderId, task_id: `task_${seed}`, package_id: `pkg_${seed}`, correlation_id: `corr_${seed}` },
          `sup_${seed}`,
        );
        return { version: 1, asOf: '2026-07-10T01:00:00.000Z', value: { orderId, eligibilityEmitted: spine.allEvents().some((e) => e.name === 'delivery.validated.v1') } };
      }
      const { spine } = driveRealSpine(seed, 4, false);
      return {
        version: 2,
        asOf: '2026-07-10T02:00:00.000Z',
        value: { orderId: `order_${seed}_4`, eligibilityEmitted: spine.allEvents().some((e) => e.name === 'delivery.validated.v1') },
      };
    },
    attemptInvalidTransition(): TransitionAttempt {
      // REAL refusal: drop code without a validated decision never releases.
      const orderId = 'order_unvalidated';
      const spine = new CustodySpine(
        { order_id: orderId, task_id: 'task_u', package_id: 'pkg_u', correlation_id: 'corr_u' },
        'sup_u',
      );
      spine.secrets.register('buyer_drop_code', orderId, 'bdc_u');
      const out = spine.confirmDropAndEmitEligibility('bdc_u', '2026-07-10T00:00:00.000Z');
      return out.ok
        ? { from: 'unvalidated', to: 'eligible', accepted: true }
        : { from: 'unvalidated', to: 'eligible', accepted: false, reason: `live custody-service refused: ${out.reason}` };
    },
  };
}

/**
 * The sandbox payment provider of the RUN, as a certifiable adapter: the
 * checkout webhook comes from shop-plus's own MockPaymentProvider (the shape
 * the deployed OrderSpine parses), driven through ITS OWN misbehavior knobs
 * where they exist; payout responses extend the same sandbox provider.
 */
export function makeSandboxPaymentProviderAdapter(): MockAdapter {
  return {
    domain: 'payment-provider',
    producerSchema: DOMAIN_PAYLOAD_SCHEMAS['payment-provider'],
    async emit(seed, controls): Promise<EmissionResult> {
      if (controls.timeout) {
        // REAL knob: the provider mock times out its first N initiates.
        const provider = new MockPaymentProvider({ timeoutFirstNInitiates: 1 });
        const charge = provider.initiateCharge({
          orderId: `order_${seed}`, paymentAttemptId: `payatt_${seed}`,
          amount: 12_500, correlationId: `corr_${seed}`, requestedAtIso: new Date().toISOString(),
        });
        if (charge.outcome === 'timeout') throw new MockTimeoutError('sandbox provider timed out (its own knob)');
        throw new Error(`expected the provider's own timeout, got ${charge.outcome}`);
      }
      // REAL knob: duplicates = the provider redelivers the same webhook
      // (same command_id), exactly as configured.
      const provider = new MockPaymentProvider(controls.duplicate ? { webhookCopies: 2 } : {});
      const charge = provider.initiateCharge({
        orderId: `order_${seed}`, paymentAttemptId: `payatt_${seed}`,
        amount: 12_500, correlationId: `corr_${seed}`, requestedAtIso: new Date().toISOString(),
      });
      if (charge.outcome !== 'accepted') throw new Error(`charge refused: ${charge.outcome}`);
      const webhooks = provider.webhookDeliveryPlan().map((d) => d.event);
      const payoutPayload = (status: 'held' | 'captured') => ({
        provider: 'sandbox-provider',
        payment_attempt_id: `payatt_${seed}`,
        collectRef: `payout_${seed}`,
        amount: 12_500,
        fee: 0,
        status,
        order_id: `order_${seed}`,
        redelivery: 0,
      });
      const payouts: PlatformEvent[] = [
        { name: 'payout.submitted.v1', envelope: envelope(seed, 'payment-provider:sandbox', 2), payload: payoutPayload('held') },
        { name: 'payout.paid.v1', envelope: envelope(seed, 'payment-provider:sandbox', 3), payload: payoutPayload('captured') },
      ];
      const events = [...webhooks, ...payouts];
      // duplicates already REAL (webhookCopies); everything else transport-level.
      return deliverUnderControls(this.domain, seed, events, { ...controls, duplicate: false });
    },
    async readProjection(seed, options): Promise<ProjectionRead> {
      // REAL knob: stale status reads served by the provider itself.
      const provider = new MockPaymentProvider(options.stale ? { staleStatusReads: 1 } : {});
      provider.initiateCharge({
        orderId: `order_${seed}`, paymentAttemptId: `payatt_${seed}`,
        amount: 12_500, correlationId: `corr_${seed}`, requestedAtIso: new Date().toISOString(),
      });
      const status = provider.getStatus(`payatt_${seed}`);
      return options.stale
        ? { version: 1, asOf: new Date().toISOString(), value: { status: status.status } }
        : { version: 2, asOf: new Date().toISOString(), value: { status: status.status } };
    },
    attemptInvalidTransition(): TransitionAttempt {
      // REAL refusal: same paymentAttemptId, different amount — the
      // provider's idempotency-key check rejects it.
      const provider = new MockPaymentProvider({});
      const base = { orderId: 'order_x', paymentAttemptId: 'payatt_x', correlationId: 'corr_x', requestedAtIso: new Date().toISOString() };
      provider.initiateCharge({ ...base, amount: 12_500 });
      const second = provider.initiateCharge({ ...base, amount: 12_501 });
      return second.outcome === 'rejected_invalid'
        ? { from: 'charge@12500', to: 'charge@12501', accepted: false, reason: `live provider mock refused: ${second.reason}` }
        : { from: 'charge@12500', to: 'charge@12501', accepted: true };
    },
  };
}
