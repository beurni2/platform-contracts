/**
 * LIVE ChainAdapters — the §2.3 fifteen steps over the real service code
 * (imports only; no app logic reimplemented). Where a service emits canon
 * PlatformEvents (sera AssignmentBook/CustodySpine, shop OrderSpine) those
 * events flow through VERBATIM. Where a service returns plain outcomes
 * (the boutik services), this adapter wraps the REAL outcome data in an
 * envelope — harness plumbing, not domain logic. The payment provider is
 * the CERTIFIED sandbox mock (no real provider at E1).
 */
import {
  QuoteSchema,
  ResellerListingSchema,
  type EventName,
  type PlatformEvent,
} from '@platform/contracts';
import type { ChainAdapters, ChainContext, ChainStepResult } from '@platform/certification';
import { buildPremiumFrameAssets } from '@boutik/media-service';
import { buildSupplyProjection, CATEGORY_FLOOR_FCFA } from '@boutik/offer-service';
import { OrderSpine, WORKED_BASELINE_INPUT, issueQuote, ImmutableQuoteStore } from '@shop-plus/commerce-core';
import { signAttributionToken, verifyAttributionToken } from '@shop-plus/attribution-service';
import { PRIVACY_NOTICE_VERSION } from '@sera/logistics-service';
import { CustodySpine } from '@sera/custody-service';
import { acceptSellerReadinessEvidence } from '@sera/evidence-service';
import type { LiveWorld } from './world.js';

/** Test-only signing key (real key custody is out of E1 scope, per shop WO-SP0.1). */
export const ATTRIBUTION_TEST_KEY = 'assembly-e1-test-key';
const SHA = 'a'.repeat(64);

export interface LiveClock {
  now(): string;
}

function harnessEvent(
  ctx: ChainContext,
  step: number,
  n: number,
  name: EventName,
  payload: Record<string, unknown>,
  at: string,
): PlatformEvent {
  return {
    name,
    envelope: {
      command_id: `cmd_live_${ctx.seed}_s${step}_${n}`,
      correlation_id: ctx.correlationId,
      aggregateVersion: n,
      actor: 'assembly:e1-live',
      serverTime: at,
      version: 'v1',
    },
    payload,
  };
}

export function makeLiveChainAdapters(world: LiveWorld, clock: LiveClock): ChainAdapters {
  const t = () => clock.now();

  return {
    async createSupplier(ctx): Promise<ChainStepResult> {
      const out = world.suppliers.onboard({
        command_id: `onboard-${ctx.seed}`,
        phoneAlias: `+226-70-${ctx.seed}`,
        displayName: 'Fournisseur E1',
      });
      if (!out.ok) throw new Error(`supplier onboarding refused: ${out.reason}`);
      if (!world.suppliers.confirmPhoneVerified(out.user.id)) throw new Error('phone verification failed');
      world.slots.supplierId = out.user.id;
      return {
        ids: { supplier_id: out.user.id },
        events: [harnessEvent(ctx, 1, 1, 'supplier.verification_approved.v1', { supplier_id: out.user.id }, t())],
      };
    },

    async createProductWithImageAndVariant(ctx): Promise<ChainStepResult> {
      const supplierId = world.slots.supplierId!;
      const assets = buildPremiumFrameAssets({
        captureRef: `capture/${ctx.seed}.jpg`,
        sha256: SHA,
        mimeType: 'image/jpeg',
        exif: { Model: 'Tecno Spark Go' },
      });
      if (!assets.ok) throw new Error(`premium-frame refused: ${assets.reason}`);
      const created = world.catalog.create(
        {
          supplierId,
          name: 'Pagne tissé main',
          productCode: `PGN-${ctx.seed}`,
          category: 'textiles',
          zone: 'Ouagadougou',
          variantAttributes: { couleur: 'indigo' },
        },
        world.suppliers.canPublish(supplierId),
      );
      if (!created.ok) throw new Error(`product creation refused: ${created.reason}`);
      const activated = world.catalog.activate(created.version.id, world.suppliers.canPublish(supplierId));
      if (!activated.ok) throw new Error(`product activation refused: ${activated.reason}`);
      world.slots.product = activated.version;
      world.slots.variantId = created.variant.id;
      return {
        ids: { product_version_id: created.version.id, variant_id: created.variant.id },
        events: [
          harnessEvent(ctx, 2, 1, 'media.derivative_approved.v1', { processingVersion: assets.assets.processingVersion }, t()),
          harnessEvent(ctx, 2, 2, 'catalog.version_activated.v1', { product_version_id: created.version.id }, t()),
        ],
      };
    },

    async publishSupplyProjection(ctx): Promise<ChainStepResult> {
      const supplierId = world.slots.supplierId!;
      const variantId = world.slots.variantId!;
      const now = t();
      const created = world.offers.create(
        {
          productVersionId: (world.slots.product as { id: string }).id,
          basePrice: WORKED_BASELINE_INPUT.sellerBasePrice,
          resellerCommission: WORKED_BASELINE_INPUT.sellerFundedCommission,
          eligibleVariants: [variantId],
          zones: ['Ouagadougou'],
          effective: now,
          expiry: '2026-08-09T00:00:00.000Z',
        },
        world.suppliers.canPublish(supplierId),
      );
      if (!created.ok) throw new Error(`offer refused: ${created.reason} (floor ${CATEGORY_FLOOR_FCFA})`);
      world.slots.offer = created.offer;

      const stock = await world.stockDo(variantId, {
        kind: 'set_stock',
        command_id: `stock-set-${ctx.seed}`,
        variantId,
        available: 5,
      });
      if (stock.status !== 200) throw new Error(`stock DO set_stock failed: ${JSON.stringify(stock.body)}`);

      const projection = buildSupplyProjection(
        world.slots.product as never,
        created.offer as never,
        5,
        now,
      );
      if (!projection.ok) throw new Error(`projection refused: ${projection.reason}`);
      world.slots.projection = projection.projection;
      return {
        ids: { offer_version: projection.projection.offerVersion },
        events: [
          harnessEvent(ctx, 3, 1, 'offer.published.v1', { ...projection.projection }, now),
          harnessEvent(ctx, 3, 2, 'inventory.availability.changed.v1', { ...projection.projection }, now),
        ],
      };
    },

    async createResellerListing(ctx): Promise<ChainStepResult> {
      // No listing CRUD service exists at E1 (the shape is canon-owned,
      // §2.2: ResellerListing definition lives in contracts) — compose the
      // canonical document and refuse anything non-canonical.
      const resellerId = `rs_${ctx.seed}`;
      const listing = ResellerListingSchema.parse({
        id: `lst_${ctx.seed}`,
        resellerId,
        productVersionId: (world.slots.product as { id: string }).id,
        offerVersion: (world.slots.projection as { offerVersion: string }).offerVersion,
        markup: WORKED_BASELINE_INPUT.resellerMarkup,
        version: 1,
        variants: [world.slots.variantId!],
        status: 'active',
      });
      world.slots.listingId = listing.id;
      world.slots.resellerId = resellerId;
      return {
        ids: { listing_id: listing.id },
        events: [harnessEvent(ctx, 4, 1, 'listing.published.v1', { listing_id: listing.id }, t())],
      };
    },

    async openSignedBuyerLink(ctx): Promise<ChainStepResult> {
      const now = t();
      const token = signAttributionToken(
        {
          id: `att_${ctx.seed}`,
          resellerId: world.slots.resellerId!,
          scope: { kind: 'listing', refId: world.slots.listingId! },
          issued: now,
          expiry: '2026-08-09T00:00:00.000Z',
          version: 'v1',
        },
        ATTRIBUTION_TEST_KEY,
      );
      const verdict = verifyAttributionToken(token, ATTRIBUTION_TEST_KEY, new Date(now));
      if (!verdict.ok) throw new Error(`signed link failed verification: ${verdict.reason}`);
      return {
        ids: { attribution_token_id: token.id },
        events: [
          harnessEvent(ctx, 5, 1, 'attribution.issued.v1', { attribution_token_id: token.id }, now),
          harnessEvent(ctx, 5, 2, 'attribution.qualified.v1', { reseller_id: verdict.resellerId }, now),
        ],
      };
    },

    async createImmutableSandboxQuote(ctx): Promise<ChainStepResult> {
      const now = t();
      // §7.2 LIVE: the snapshot comes from the flag service over HTTP —
      // issueQuote refuses closed while the checkout kill-switch is engaged.
      const flags = await world.flagSnapshot();
      const issued = issueQuote(
        { flags, now: () => new Date(now), newId: () => `quote_${ctx.seed}` },
        {
          listingRef: world.slots.listingId!,
          offerRef: (world.slots.projection as { offerVersion: string }).offerVersion,
          attributionResellerId: world.slots.resellerId!,
          ...WORKED_BASELINE_INPUT, // §5.4 worked baseline incl. paymentMode FULL_PREPAY
        },
      );
      if (!issued.ok) throw new Error(`quote refused: ${issued.reason}`);
      const store = new ImmutableQuoteStore();
      const putOutcome = store.put(issued.quote, issued.canonicalBytes);
      if (!putOutcome.ok) throw new Error(`quote store refused: ${putOutcome.reason}`);
      world.slots.quote = issued.quote;
      const spine = new OrderSpine({
        quote: issued.quote,
        supplierRef: world.slots.supplierId!,
        correlationId: ctx.correlationId,
        issueCommandId: `issue-${ctx.seed}`,
        actor: 'commerce-core:e1',
        serverTime: now,
      });
      world.slots.orderSpine = spine;
      return {
        ids: { quote_id: issued.quote.id },
        events: [...spine.journey.events],
        artifacts: { quote: issued.quote },
      };
    },

    async reserveOneUnit(ctx): Promise<ChainStepResult> {
      const now = t();
      const quote = QuoteSchema.parse(world.slots.quote);
      const spine = world.slots.orderSpine!;
      // Atomic on BOTH sides, each under workerd: shop's per-quote
      // reservation DO and boutik's per-variant stock DO.
      const reservation = await world.reservationDo(quote.id, {
        kind: 'reserve',
        command_id: `rsv-${ctx.seed}`,
        quoteId: quote.id,
        holderRef: `buyer_${ctx.seed}`,
        nowIso: now,
        newReservationId: `rsv_${ctx.seed}`,
      });
      const rBody = reservation.body as { ok: boolean; reservationId?: string; reason?: string };
      if (reservation.status !== 200 || !rBody.ok) throw new Error(`reservation DO refused: ${JSON.stringify(rBody)}`);
      const stock = await world.stockDo(world.slots.variantId!, {
        kind: 'reserve',
        command_id: `stock-rsv-${ctx.seed}`,
        variantId: world.slots.variantId!,
        qty: 1,
        newHoldId: `hold_${ctx.seed}`,
      });
      const sBody = stock.body as { ok: boolean; state?: { available: number }; reason?: string };
      if (stock.status !== 200 || !sBody.ok) throw new Error(`stock DO refused: ${JSON.stringify(sBody)}`);
      const eventsBefore = spine.journey.events.length;
      const adv = spine.advance({
        command_id: `reserved-${ctx.seed}`,
        actor: 'commerce-core:e1',
        serverTime: now,
        to: 'reserved',
        chainAdditions: { reservation_id: rBody.reservationId! },
      });
      if (!adv.ok) throw new Error(`journey advance refused: ${adv.reason}`);
      return {
        ids: { reservation_id: rBody.reservationId! },
        events: [
          ...spine.journey.events.slice(eventsBefore),
          harnessEvent(ctx, 7, 1, 'inventory.availability.changed.v1', {
            ...(world.slots.projection as Record<string, unknown>),
            available: sBody.state!.available,
          }, now),
        ],
      };
    },

    async completeSandboxPaymentHold(ctx): Promise<ChainStepResult> {
      const now = t();
      const quote = QuoteSchema.parse(world.slots.quote);
      const spine = world.slots.orderSpine!;
      const orderId = `order_${ctx.seed}`;
      const paymentAttemptId = `payatt_${ctx.seed}`;
      const eventsBefore = spine.journey.events.length;
      const adv = spine.advance({
        command_id: `payinit-${ctx.seed}`,
        actor: 'commerce-core:e1',
        serverTime: now,
        to: 'payment_pending',
        chainAdditions: { payment_attempt_id: paymentAttemptId, order_id: orderId },
      });
      if (!adv.ok) throw new Error(`journey advance refused: ${adv.reason}`);

      const charge = world.paymentProvider.initiateCharge({
        orderId,
        paymentAttemptId,
        amount: quote.amountPaidAtCheckout,
        correlationId: ctx.correlationId,
        requestedAtIso: now,
      });
      if (charge.outcome !== 'accepted') throw new Error(`charge refused: ${charge.outcome}`);
      const webhook = world.paymentProvider.webhookDeliveryPlan().at(-1)!.event;
      const paid = spine.onProviderPaymentEvent(webhook);
      if (!paid.applied) throw new Error(`payment webhook refused: ${paid.reason}`);

      const confirmRes = await world.reservationDo(quote.id, {
        kind: 'confirm',
        command_id: `rsv-confirm-${ctx.seed}`,
        quoteId: quote.id,
        nowIso: now,
      });
      const cBody = confirmRes.body as { ok: boolean; reason?: string };
      if (confirmRes.status !== 200 || !cBody.ok) throw new Error(`reservation confirm refused: ${JSON.stringify(cBody)}`);
      const confirmed = spine.confirmOrder({ command_id: `confirm-${ctx.seed}`, actor: 'commerce-core:e1', serverTime: now });
      if (!confirmed.applied) throw new Error(`order confirm refused: ${confirmed.reason}`);

      const escrow = spine.ledger.escrowFor(orderId)!;
      const order = {
        id: orderId,
        quoteId: quote.id,
        productVersionId: (world.slots.product as { id: string }).id,
        supplierId: world.slots.supplierId!,
        resellerId: world.slots.resellerId!,
        buyerPhoneRef: `by_${ctx.seed}`,
        dropoff: {
          pin: { lat: 12.3714, lng: -1.5197 },
          zone: 'Ouaga 2000',
          landmark: 'En face de la pharmacie du Rond-point',
          directions: 'Portail vert, deuxième cour',
          maskedRelay: `relay_${ctx.seed}`,
        },
        reservationRef: ctx.ids['reservation_id'] ?? `rsv_${ctx.seed}`,
        escrowRef: escrow.paymentLegs[0]!.collectRef,
        paymentMode: 'FULL_PREPAY' as const,
        status: spine.journey.state,
        timestamps: { paidAt: now },
      };
      return {
        ids: { payment_attempt_id: paymentAttemptId, order_id: orderId },
        events: [webhook, ...spine.journey.events.slice(eventsBefore)],
        artifacts: { order },
      };
    },

    async markPackageReady(ctx): Promise<ChainStepResult> {
      const now = t();
      const quote = QuoteSchema.parse(world.slots.quote);
      const orderId = ctx.ids['order_id']!;
      const accepted = world.fulfillment.accept({
        orderId,
        variant: world.slots.variantId!,
        qty: 1,
        sellerNetFcfa: quote.sellerNet, // COPIED from the Quote — never computed here
        deadline: '2026-08-09T00:00:00.000Z',
      });
      if (!accepted.ok) throw new Error(`fulfillment accept refused: ${accepted.reason}`);
      const challenge = world.fulfillment.issueChallenge(orderId, now);
      if (!challenge.ok) throw new Error(`challenge refused: ${challenge.reason}`);
      const confirmation = {
        orderId,
        photoRef: { ref: `proof/pkg_${ctx.seed}.jpg`, sha256: SHA, mimeType: 'image/jpeg' },
        readinessChallenge: challenge.challenge,
        qty: 1,
        variant: world.slots.variantId!,
        availableConfirmed: true,
        at: now,
      };
      const ready = world.fulfillment.confirmReady(confirmation, now);
      if (!ready.ok) throw new Error(`readiness refused: ${ready.reason}`);
      // Cross-repo consumer proof: Séra's evidence service strict-parses the
      // SAME confirmation (four-secrets gate — a buyerDropCode would refuse).
      const seraVerdict = acceptSellerReadinessEvidence(confirmation);
      if (!seraVerdict.ok) throw new Error(`sera refused readiness evidence: ${seraVerdict.reason}`);
      const packageId = `pkg_${ctx.seed}`;
      return {
        ids: { package_id: packageId },
        events: [
          harnessEvent(ctx, 9, 1, 'fulfillment.accepted.v1', { orderId, packageId, readinessConfirmed: false, at: now }, now),
          harnessEvent(ctx, 9, 2, 'seller.readiness_challenge_issued.v1', { orderId, packageId, readinessConfirmed: false, at: now }, now),
          harnessEvent(ctx, 9, 3, 'fulfillment.ready.v1', { orderId, packageId, readinessConfirmed: true, at: now }, now),
        ],
      };
    },

    async assignCourierManually(ctx): Promise<ChainStepResult> {
      const now = t();
      const orderId = ctx.ids['order_id']!;
      const riderId = `rider_${ctx.seed}`;
      world.riders.register({ riderId, displayName: 'Issa', phoneAlias: `+226-71-${ctx.seed}`, certified: true });
      world.riders.acknowledgePrivacyNotice(riderId, PRIVACY_NOTICE_VERSION, now);
      const shift = world.riders.startShift(riderId, now, 'server_confirmed');
      if (!shift.ok) throw new Error(`shift start refused: ${JSON.stringify(shift)}`);

      const taskId = `dtask_${ctx.seed}`;
      const intakeEvent = harnessEvent(ctx, 10, 1, 'logistics.task_ready.v1', {
        task: {
          id: taskId,
          orderId,
          location: {
            pin: { lat: 12.3714, lng: -1.5197 },
            zone: 'Ouaga 2000',
            landmark: 'En face de la pharmacie du Rond-point',
            directions: 'Portail vert, deuxième cour',
            maskedRelay: `relay_${ctx.seed}`,
          },
          window: { start: now, end: '2026-08-09T00:00:00.000Z' },
          status: 'ready',
          type: 'delivery',
        },
      }, now);
      const admitted = world.queue.onTaskReady(intakeEvent, now);
      if (!admitted.admitted) throw new Error(`task intake refused: ${admitted.reason}`);

      const assigned = world.assignments.assign({
        command_id: `assign-${ctx.seed}`,
        taskId,
        riderId,
        dispatcherId: `disp_${ctx.seed}`,
        at: now,
        newAssignmentId: `as_${ctx.seed}`,
      });
      if (!assigned.ok) throw new Error(`assignment refused: ${assigned.reason}`);
      const ack = world.assignments.acknowledge(assigned.assignment.assignmentId ?? `as_${ctx.seed}`, 'server_confirmed');
      return {
        ids: { delivery_task_id: taskId, rider_id: riderId },
        events: [intakeEvent, assigned.event, ...('event' in ack && ack.event ? [ack.event as PlatformEvent] : [])],
      };
    },

    async transferToCourierCustody(ctx): Promise<ChainStepResult> {
      const now = t();
      const orderId = ctx.ids['order_id']!;
      const secrets = { pickupCode: `pvc_${ctx.seed}`, sealId: `seal_${ctx.seed}`, dropCode: `bdc_${ctx.seed}` };
      world.slots.secrets = secrets;
      const spine = new CustodySpine(
        {
          order_id: orderId,
          task_id: ctx.ids['delivery_task_id']!,
          package_id: ctx.ids['package_id']!,
          correlation_id: ctx.correlationId,
        },
        world.slots.supplierId!,
      );
      world.slots.custody = spine;
      spine.secrets.register('pickup_verification_code', orderId, secrets.pickupCode);
      spine.secrets.register('custody_seal', orderId, secrets.sealId);
      spine.secrets.register('buyer_drop_code', orderId, secrets.dropCode);
      spine.establishSellerCustody(now);

      const verification = spine.verifyPickup(
        {
          orderId,
          riderId: ctx.ids['rider_id']!,
          checkResults: {
            order_ref: true, identity: true, variant: true, colour: true, size_label: true,
            qty: true, damage: true, pieces: true, manufacturer_seal: true,
          },
          dwellSec: 150,
          evidenceBundleId: `veb_${ctx.seed}`,
          custodySealId: secrets.sealId,
        },
        secrets.pickupCode,
        now,
      );
      if (verification.kind !== 'accepted') throw new Error(`pickup verification not accepted: ${JSON.stringify(verification)}`);

      const eventsBefore = spine.allEvents().length;
      const custody = spine.beginCustody({
        riderId: ctx.ids['rider_id']!,
        verificationOrderId: orderId,
        custodySealId: secrets.sealId,
        sealPhotoRefs: [`seal/${ctx.seed}-1.jpg`],
        at: now,
      });
      if (!custody.ok) throw new Error(`custody refused: ${custody.reason}`);
      return {
        ids: { custody_seal_id: secrets.sealId },
        events: [...spine.allEvents().slice(Math.max(0, eventsBefore - 1))],
      };
    },

    async recordDeliveryConfirmation(ctx): Promise<ChainStepResult> {
      const now = t();
      const spine = world.slots.custody!;
      const submitted = spine.submitDeliveryEvidence(
        {
          taskId: ctx.ids['delivery_task_id']!,
          packageId: ctx.ids['package_id']!,
          custodySealId: world.slots.secrets!.sealId,
          artifacts: [{ ref: `evidence/${ctx.seed}-door.jpg`, sha256: SHA, mimeType: 'image/jpeg' }],
          capturedAt: now,
        },
        'server_confirmed',
        now,
      );
      if (!submitted.ok || submitted.pending) throw new Error(`evidence refused or pending: ${JSON.stringify(submitted)}`);
      const decided = spine.decideValidation(now);
      if (!decided.ok || decided.decision.result !== 'validated') {
        throw new Error(`validation not validated: ${JSON.stringify(decided)}`);
      }
      const evidenceEvent = spine.allEvents().find((e) => e.name === 'delivery.evidence_submitted.v1')!;
      return { ids: {}, events: [evidenceEvent] };
    },

    async produceValidatedSettlementEligibility(ctx): Promise<ChainStepResult> {
      const now = t();
      const spine = world.slots.custody!;
      const orderSpine = world.slots.orderSpine!;
      // Drop code LAST — the single settlement-eligibility signal (SE-I09).
      const out = spine.confirmDropAndEmitEligibility(world.slots.secrets!.dropCode, now);
      if (!out.ok || out.duplicate) throw new Error(`eligibility refused: ${JSON.stringify(out)}`);
      const validated = out.events.find((e) => e.name === 'delivery.validated.v1')!;
      // Exactly-once, proven live: a replay absorbs with zero new events.
      const replay = spine.confirmDropAndEmitEligibility(world.slots.secrets!.dropCode, now);
      if (!replay.ok || !replay.duplicate || replay.events.length !== 0) {
        throw new Error(`exactly-once violated on replay: ${JSON.stringify(replay)}`);
      }
      // LIVE cross-surface consumption: shop's OrderSpine records obligations
      // from the SAME event Séra emitted; a duplicate injection absorbs.
      const applied = orderSpine.onEligibilityEvent(validated);
      if (!applied.applied) throw new Error(`orderSpine refused eligibility: ${JSON.stringify(applied)}`);
      const dupInjection = orderSpine.onEligibilityEvent(validated);
      if (!dupInjection.applied || !('duplicate' in dupInjection) || dupInjection.duplicate !== true) {
        throw new Error(`duplicate eligibility not absorbed: ${JSON.stringify(dupInjection)}`);
      }
      const validationId = (validated.payload as { validation_id: string }).validation_id;
      return { ids: { validation_id: validationId }, events: [...out.events] };
    },

    async createSettlementObligations(ctx): Promise<ChainStepResult> {
      const orderId = ctx.ids['order_id']!;
      const obligations = world.slots.orderSpine!.ledger.obligationsFor(orderId);
      if (obligations.length !== 2) throw new Error(`expected exactly two obligations, got ${obligations.length}`);
      return {
        ids: {
          settlement_obligation_id: `sob_supplier_${ctx.seed}`,
          reseller_settlement_obligation_id: `sob_reseller_${ctx.seed}`,
        },
        events: [harnessEvent(ctx, 14, 1, 'commission.earned.v1', { order_id: orderId, obligations: obligations.length }, t())],
      };
    },

    async reconcileSandboxProviderResponse(ctx): Promise<ChainStepResult> {
      const now = t();
      const orderId = ctx.ids['order_id']!;
      const quote = QuoteSchema.parse(world.slots.quote);
      const spine = world.slots.orderSpine!;
      const obligations = spine.ledger.obligationsFor(orderId);
      const escrow = spine.ledger.escrowFor(orderId)!;
      const checkoutLeg = escrow.paymentLegs.find((l) => l.legType === 'checkout')!;
      // Reconciliation to the franc, from PROVIDER TRUTH + copied amounts:
      const failures: string[] = [];
      if (checkoutLeg.amount !== quote.amountPaidAtCheckout) {
        failures.push(`escrow checkout leg ${checkoutLeg.amount} != quote.amountPaidAtCheckout ${quote.amountPaidAtCheckout}`);
      }
      const supplierOb = obligations.find((o) => o.party.startsWith('supplier:'))!;
      const resellerOb = obligations.find((o) => o.party.startsWith('reseller:'))!;
      if (supplierOb.amount !== quote.sellerNet) failures.push(`supplier obligation ${supplierOb.amount} != quote.sellerNet ${quote.sellerNet}`);
      if (resellerOb.amount !== quote.resellerNet) failures.push(`reseller obligation ${resellerOb.amount} != quote.resellerNet ${quote.resellerNet}`);

      // Certified sandbox provider payout response, one per obligation —
      // amounts COPIED from the obligations, echoed back by the provider.
      const payoutId = `payout_${ctx.seed}`;
      const payoutEvents: PlatformEvent[] = [];
      let n = 0;
      for (const ob of [supplierOb, resellerOb]) {
        for (const name of ['payout.submitted.v1', 'payout.paid.v1'] as const) {
          n += 1;
          payoutEvents.push(harnessEvent(ctx, 15, n, name, {
            provider: 'sandbox-provider',
            payment_attempt_id: `payatt_${ctx.seed}`,
            collectRef: `${payoutId}_${ob.party.split(':')[0]}`,
            amount: ob.amount,
            fee: 0,
            status: name === 'payout.paid.v1' ? 'captured' : 'held',
            order_id: orderId,
            redelivery: 0,
          }, now));
        }
      }
      const paidTotal = payoutEvents
        .filter((e) => e.name === 'payout.paid.v1')
        .reduce((sum, e) => sum + ((e.payload as { amount: number }).amount), 0);
      if (paidTotal !== quote.sellerNet + quote.resellerNet) {
        failures.push(`payouts ${paidTotal} != sellerNet+resellerNet ${quote.sellerNet + quote.resellerNet}`);
      }
      if (failures.length > 0) throw new Error(`step 15 reconciliation failed: ${failures.join(' · ')}`);
      world.slots.payoutEvents = payoutEvents;
      return { ids: { provider_payout_id: payoutId }, events: payoutEvents };
    },
  };
}
