import {
  computeWaterfall,
  type EventName,
  type PlatformEvent,
} from '@platform/contracts';
import {
  referenceEligibilityMock,
  referencePaymentProviderMock,
  referenceReadinessMock,
  referenceSupplyProjectionMock,
} from '../reference/adapters.js';
import type { ChainAdapters, ChainContext, ChainStepResult } from './steps.js';

/**
 * Reference ChainAdapters — "mock now, live at assembly". Composes the four
 * §3-certified reference mocks where their sequences fit the §2.3 steps and
 * mints deterministic ids. Everything derives from the seed; no randomness.
 */
function localEvent(ctx: ChainContext, step: number, n: number, name: EventName): PlatformEvent {
  return {
    name,
    envelope: {
      command_id: `cmd_chain_${ctx.seed}_s${step}_${n}`,
      correlation_id: ctx.correlationId,
      aggregateVersion: n,
      actor: 'harness:chain-runner',
      serverTime: new Date().toISOString(),
      version: 'v1',
    },
    payload: { step },
  };
}

async function mockEvents(
  mock: { emit(seed: string, c: object): Promise<{ delivered: { event: PlatformEvent }[] }> },
  ctx: ChainContext,
  pick: (name: string) => boolean,
): Promise<PlatformEvent[]> {
  const emission = await mock.emit(ctx.seed, {});
  return emission.delivered.map((d) => d.event).filter((e) => pick(e.name));
}

export function makeReferenceChainAdapters(): ChainAdapters {
  return {
    async createSupplier(ctx): Promise<ChainStepResult> {
      return {
        ids: { supplier_id: `sup_${ctx.seed}` },
        events: [localEvent(ctx, 1, 1, 'supplier.verification_approved.v1')],
      };
    },

    async createProductWithImageAndVariant(ctx): Promise<ChainStepResult> {
      return {
        ids: { product_version_id: `pv_${ctx.seed}`, variant_id: `var_${ctx.seed}` },
        events: [
          localEvent(ctx, 2, 1, 'media.derivative_approved.v1'), // premium-frame only — no cleanup
          localEvent(ctx, 2, 2, 'catalog.version_activated.v1'),
        ],
      };
    },

    async publishSupplyProjection(ctx): Promise<ChainStepResult> {
      const events = await mockEvents(referenceSupplyProjectionMock, ctx, (n) =>
        ['offer.published.v1', 'inventory.availability.changed.v1'].includes(n),
      );
      return { ids: { offer_version: `offer_${ctx.seed}@1` }, events };
    },

    async createResellerListing(ctx): Promise<ChainStepResult> {
      return {
        ids: { listing_id: `lst_${ctx.seed}` },
        events: [localEvent(ctx, 4, 1, 'listing.published.v1')],
      };
    },

    async openSignedBuyerLink(ctx): Promise<ChainStepResult> {
      return {
        ids: { attribution_token_id: `att_${ctx.seed}` },
        events: [
          localEvent(ctx, 5, 1, 'attribution.issued.v1'),
          localEvent(ctx, 5, 2, 'attribution.qualified.v1'),
        ],
      };
    },

    async createImmutableSandboxQuote(ctx): Promise<ChainStepResult> {
      const money = computeWaterfall({
        sellerBasePrice: 10_000,
        sellerFundedCommission: 1_000,
        resellerMarkup: 1_500,
        deliveryFee: 1_000,
        paymentMode: 'FULL_PREPAY',
      });
      const quote = {
        id: `quote_${ctx.seed}`,
        attributionResellerId: `rs_${ctx.seed}`,
        paymentMode: money.paymentMode,
        sellerBasePrice: money.sellerBasePrice,
        sellerFundedCommission: money.sellerFundedCommission,
        resellerMarkup: money.resellerMarkup,
        productSubtotal: money.productSubtotal,
        deliveryFee: money.deliveryFee,
        buyerTotal: money.buyerTotal,
        amountPaidAtCheckout: money.amountPaidAtCheckout,
        amountDueAtDelivery: money.amountDueAtDelivery,
        sellerPlatformFee: money.sellerPlatformFee,
        sellerNet: money.sellerNet,
        resellerGrossEarnings: money.resellerGrossEarnings,
        resellerPlatformFee: money.resellerPlatformFee,
        resellerNet: money.resellerNet,
        platformProductFeeRevenue: money.platformProductFeeRevenue,
        paymentProcessingFeeEstimate: 150,
        taxFields: {},
        policyVersions: { settlementPolicyVersion: 'sp_v1', inspectionPolicyVersion: 'ip_v1' },
        expiry: '2026-07-09T12:00:00Z',
      };
      return {
        ids: { quote_id: quote.id },
        events: [localEvent(ctx, 6, 1, 'checkout.quote_created.v1')],
        artifacts: { quote },
      };
    },

    async reserveOneUnit(ctx): Promise<ChainStepResult> {
      return {
        ids: { reservation_id: `rsv_${ctx.seed}` },
        events: [localEvent(ctx, 7, 1, 'inventory.availability.changed.v1')],
      };
    },

    async completeSandboxPaymentHold(ctx): Promise<ChainStepResult> {
      const paymentEvents = await mockEvents(referencePaymentProviderMock, ctx, (n) =>
        n === 'payment.checkout_leg_confirmed.v1',
      );
      const order = {
        id: `order_${ctx.seed}`,
        quoteId: ctx.ids['quote_id'] ?? `quote_${ctx.seed}`,
        productVersionId: ctx.ids['product_version_id'] ?? `pv_${ctx.seed}`,
        supplierId: ctx.ids['supplier_id'] ?? `sup_${ctx.seed}`,
        resellerId: `rs_${ctx.seed}`,
        buyerPhoneRef: `by_${ctx.seed}`,
        dropoff: {
          pin: { lat: 12.3714, lng: -1.5197 },
          zone: 'Ouaga 2000',
          landmark: 'En face de la pharmacie du Rond-point',
          directions: 'Portail vert, deuxième cour',
          maskedRelay: `relay_${ctx.seed}`,
        },
        reservationRef: ctx.ids['reservation_id'] ?? `rsv_${ctx.seed}`,
        escrowRef: `esc_${ctx.seed}`,
        paymentMode: 'FULL_PREPAY' as const,
        status: 'paid' as const, // five-state E1 enum — hold confirmed
        timestamps: { paidAt: new Date().toISOString() },
      };
      return {
        ids: { payment_attempt_id: `payatt_${ctx.seed}`, order_id: order.id },
        events: [...paymentEvents, localEvent(ctx, 8, 1, 'order.confirmed.v1')],
        artifacts: { order },
      };
    },

    async markPackageReady(ctx): Promise<ChainStepResult> {
      const events = await mockEvents(referenceReadinessMock, ctx, () => true);
      return { ids: { package_id: `pkg_${ctx.seed}` }, events };
    },

    async assignCourierManually(ctx): Promise<ChainStepResult> {
      return {
        ids: { delivery_task_id: `dtask_${ctx.seed}`, rider_id: `rider_${ctx.seed}` },
        events: [
          localEvent(ctx, 10, 1, 'logistics.task_ready.v1'),
          localEvent(ctx, 10, 2, 'pickup.assigned.v1'),
        ],
      };
    },

    async transferToCourierCustody(ctx): Promise<ChainStepResult> {
      return {
        ids: { custody_seal_id: `seal_${ctx.seed}` },
        events: [
          localEvent(ctx, 11, 1, 'pickup.verification_recorded.v1'),
          localEvent(ctx, 11, 2, 'pickup.custody_seal_registered.v1'),
          localEvent(ctx, 11, 3, 'custody.transferred_to_courier.v1'),
        ],
      };
    },

    async recordDeliveryConfirmation(ctx): Promise<ChainStepResult> {
      return {
        ids: {},
        events: [
          localEvent(ctx, 12, 1, 'delivery.evidence_submitted.v1'),
          localEvent(ctx, 12, 2, 'custody.transferred_to_customer.v1'), // buyer drop code entered last
        ],
      };
    },

    async produceValidatedSettlementEligibility(ctx): Promise<ChainStepResult> {
      const events = await mockEvents(referenceEligibilityMock, ctx, (n) =>
        ['delivery.validated.v1', 'settlement.supplier_payable.v1'].includes(n),
      );
      return { ids: { validation_id: `val_${ctx.seed}` }, events };
    },

    async createSettlementObligations(ctx): Promise<ChainStepResult> {
      return {
        ids: {
          settlement_obligation_id: `sob_supplier_${ctx.seed}`,
          reseller_settlement_obligation_id: `sob_reseller_${ctx.seed}`,
        },
        events: [localEvent(ctx, 14, 1, 'commission.earned.v1')],
      };
    },

    async reconcileSandboxProviderResponse(ctx): Promise<ChainStepResult> {
      const events = await mockEvents(referencePaymentProviderMock, ctx, (n) =>
        ['payout.submitted.v1', 'payout.paid.v1'].includes(n),
      );
      return { ids: { provider_payout_id: `payout_${ctx.seed}` }, events };
    },
  };
}

/** NEGATIVE-FIXTURE wrapper: drop one chain id from the step that mints it. */
export function dropChainLink(adapters: ChainAdapters, idName: string): ChainAdapters {
  const strip = (result: ChainStepResult): ChainStepResult => {
    const ids = { ...result.ids };
    delete ids[idName];
    return { ...result, ids };
  };
  const wrapped = { ...adapters };
  for (const key of Object.keys(adapters) as (keyof ChainAdapters)[]) {
    const original = adapters[key].bind(adapters);
    wrapped[key] = async (ctx: ChainContext) => strip(await original(ctx));
  }
  return wrapped;
}
