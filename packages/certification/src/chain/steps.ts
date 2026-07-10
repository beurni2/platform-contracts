import type { PlatformEvent } from '@platform/contracts';

/**
 * Contract §2.3 — the fifteen steps of the E1 walking skeleton, as data.
 * Contract §6 — the nine-id correlation chain:
 *   quote_id → reservation_id → payment_attempt_id → order_id → package_id →
 *   delivery_task_id → validation_id → settlement_obligation_id → provider_payout_id
 */
export const NINE_CHAIN_IDS = [
  'quote_id',
  'reservation_id',
  'payment_attempt_id',
  'order_id',
  'package_id',
  'delivery_task_id',
  'validation_id',
  'settlement_obligation_id',
  'provider_payout_id',
] as const;
export type ChainIdName = (typeof NINE_CHAIN_IDS)[number];

export interface ChainStepResult {
  /** ids minted or carried by this step (chain ids + context ids). */
  ids: Record<string, string>;
  /** events emitted by this step — every one must share the chain's correlation_id. */
  events: PlatformEvent[];
  /** step artifacts the runner validates against canon schemas (quote, order). */
  artifacts?: Record<string, unknown>;
}

export interface ChainContext {
  correlationId: string;
  seed: string;
  /** all ids accumulated so far. */
  ids: Record<string, string>;
}

/** Pluggable per-step adapters — reference mocks now, live siblings at assembly. */
export interface ChainAdapters {
  createSupplier(ctx: ChainContext): Promise<ChainStepResult>;
  createProductWithImageAndVariant(ctx: ChainContext): Promise<ChainStepResult>;
  publishSupplyProjection(ctx: ChainContext): Promise<ChainStepResult>;
  createResellerListing(ctx: ChainContext): Promise<ChainStepResult>;
  openSignedBuyerLink(ctx: ChainContext): Promise<ChainStepResult>;
  createImmutableSandboxQuote(ctx: ChainContext): Promise<ChainStepResult>;
  reserveOneUnit(ctx: ChainContext): Promise<ChainStepResult>;
  completeSandboxPaymentHold(ctx: ChainContext): Promise<ChainStepResult>;
  markPackageReady(ctx: ChainContext): Promise<ChainStepResult>;
  assignCourierManually(ctx: ChainContext): Promise<ChainStepResult>;
  transferToCourierCustody(ctx: ChainContext): Promise<ChainStepResult>;
  recordDeliveryConfirmation(ctx: ChainContext): Promise<ChainStepResult>;
  produceValidatedSettlementEligibility(ctx: ChainContext): Promise<ChainStepResult>;
  createSettlementObligations(ctx: ChainContext): Promise<ChainStepResult>;
  reconcileSandboxProviderResponse(ctx: ChainContext): Promise<ChainStepResult>;
}

export interface ChainStepDefinition {
  index: number;
  /** Contract §2.3 wording, abbreviated to the step title. */
  title: string;
  run: keyof ChainAdapters;
  /** chain ids this step MUST mint (missing → chain break). */
  mints: readonly ChainIdName[];
}

export const CHAIN_STEPS: readonly ChainStepDefinition[] = [
  { index: 1, title: 'Create one supplier (manual)', run: 'createSupplier', mints: [] },
  { index: 2, title: 'Create one basic product, one image (premium-frame only — no cleanup), one variant', run: 'createProductWithImageAndVariant', mints: [] },
  { index: 3, title: 'Publish one supply projection', run: 'publishSupplyProjection', mints: [] },
  { index: 4, title: 'Create one reseller listing', run: 'createResellerListing', mints: [] },
  { index: 5, title: 'Open one signed buyer link', run: 'openSignedBuyerLink', mints: [] },
  { index: 6, title: 'Create one immutable sandbox Quote', run: 'createImmutableSandboxQuote', mints: ['quote_id'] },
  { index: 7, title: 'Reserve one unit (atomic)', run: 'reserveOneUnit', mints: ['reservation_id'] },
  { index: 8, title: 'Complete one sandbox payment (hold)', run: 'completeSandboxPaymentHold', mints: ['payment_attempt_id', 'order_id'] },
  { index: 9, title: 'Mark the supplier package ready (package/seal)', run: 'markPackageReady', mints: ['package_id'] },
  { index: 10, title: 'Assign one courier manually', run: 'assignCourierManually', mints: ['delivery_task_id'] },
  { index: 11, title: 'Transfer one package into courier custody (two-party, single-use code + seal)', run: 'transferToCourierCustody', mints: [] },
  { index: 12, title: 'Record one delivery confirmation (buyer drop code)', run: 'recordDeliveryConfirmation', mints: [] },
  { index: 13, title: 'Produce one validated settlement-eligibility event', run: 'produceValidatedSettlementEligibility', mints: ['validation_id'] },
  { index: 14, title: 'Create one supplier + reseller SettlementObligation', run: 'createSettlementObligations', mints: ['settlement_obligation_id'] },
  { index: 15, title: 'Reconcile the sandbox provider response', run: 'reconcileSandboxProviderResponse', mints: ['provider_payout_id'] },
];
