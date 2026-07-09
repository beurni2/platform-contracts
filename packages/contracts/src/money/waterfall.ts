import type { PaymentMode } from '../enums.js';
import {
  ROUNDING_LAW_VERSION,
  assertIntegerFcfa,
  resellerPlatformFee,
  sellerPlatformFee,
} from './rounding-law.js';

/**
 * Canonical money waterfall (§5.4/§5.5, identical across all three specs),
 * under RoundingLaw v1 (founder-confirmed 2026-07-09). Pure functions only —
 * no services, no state.
 */

export interface WaterfallInput {
  /** B — seller base price, integer FCFA */
  sellerBasePrice: number;
  /** C — seller-funded reseller commission, integer FCFA. NEVER added to the buyer price. */
  sellerFundedCommission: number;
  /** M — reseller markup, integer FCFA */
  resellerMarkup: number;
  /** D — delivery charge, integer FCFA. OUTSIDE both fee bases. */
  deliveryFee: number;
  paymentMode: PaymentMode;
}

/** Every derived Quote money field per §5.4/§5.5. All values integer FCFA. */
export interface WaterfallResult {
  sellerBasePrice: number;
  sellerFundedCommission: number;
  resellerMarkup: number;
  deliveryFee: number;
  paymentMode: PaymentMode;
  productSubtotal: number;
  buyerTotal: number;
  sellerPlatformFee: number;
  sellerNet: number;
  resellerGrossEarnings: number;
  resellerPlatformFee: number;
  resellerNet: number;
  platformProductFeeRevenue: number;
  amountPaidAtCheckout: number;
  amountDueAtDelivery: number;
  roundingLawVersion: typeof ROUNDING_LAW_VERSION;
}

export function computeWaterfall(input: WaterfallInput): WaterfallResult {
  const { sellerBasePrice: B, sellerFundedCommission: C, resellerMarkup: M, deliveryFee: D, paymentMode } = input;
  assertIntegerFcfa(B, 'sellerBasePrice (B)');
  assertIntegerFcfa(C, 'sellerFundedCommission (C)');
  assertIntegerFcfa(M, 'resellerMarkup (M)');
  assertIntegerFcfa(D, 'deliveryFee (D)');

  const productSubtotal = B + M; // commission is NEVER added to the buyer price
  const buyerTotal = B + M + D;

  const fSeller = sellerPlatformFee(B);
  const fReseller = resellerPlatformFee(C, M);

  // Nets by subtraction — never independent multiplications (RoundingLaw v1).
  const sellerNet = B - C - fSeller;
  const resellerGrossEarnings = C + M;
  const resellerNet = resellerGrossEarnings - fReseller;
  const platformProductFeeRevenue = fSeller + fReseller;

  const amountPaidAtCheckout = paymentMode === 'FULL_PREPAY' ? buyerTotal : D;
  const amountDueAtDelivery = paymentMode === 'FULL_PREPAY' ? 0 : productSubtotal;

  return {
    sellerBasePrice: B,
    sellerFundedCommission: C,
    resellerMarkup: M,
    deliveryFee: D,
    paymentMode,
    productSubtotal,
    buyerTotal,
    sellerPlatformFee: fSeller,
    sellerNet,
    resellerGrossEarnings,
    resellerPlatformFee: fReseller,
    resellerNet,
    platformProductFeeRevenue,
    amountPaidAtCheckout,
    amountDueAtDelivery,
    roundingLawVersion: ROUNDING_LAW_VERSION,
  };
}

/** The money fields a Quote must carry for reconciliation (§5.4/§5.5). */
export interface ReconcilableQuoteMoney {
  productSubtotal: number;
  deliveryFee: number;
  buyerTotal: number;
  sellerNet: number;
  resellerNet: number;
  platformProductFeeRevenue: number;
  amountPaidAtCheckout: number;
  amountDueAtDelivery: number;
}

export class QuoteReconciliationError extends Error {
  override readonly name = 'QuoteReconciliationError';
  constructor(
    readonly failures: readonly string[],
    readonly quote: ReconcilableQuoteMoney,
  ) {
    super(`Quote does not reconcile to the franc:\n  - ${failures.join('\n  - ')}`);
  }
}

/**
 * The two reconciliation identities (§5.4, CI):
 *   productSubtotal == sellerNet + resellerNet + platformProductFeeRevenue
 *   buyerTotal      == productSubtotal + deliveryFee
 * plus the §5.5 funded-legs identity for the quote's mode:
 *   amountPaidAtCheckout + amountDueAtDelivery == buyerTotal
 * Exact to the franc — a 1-FCFA divergence is a failure.
 */
export function assertQuoteReconciles(quote: ReconcilableQuoteMoney): void {
  const failures: string[] = [];
  const split = quote.sellerNet + quote.resellerNet + quote.platformProductFeeRevenue;
  if (split !== quote.productSubtotal) {
    failures.push(
      `productSubtotal (${quote.productSubtotal}) != sellerNet + resellerNet + platformProductFeeRevenue ` +
        `(${quote.sellerNet} + ${quote.resellerNet} + ${quote.platformProductFeeRevenue} = ${split})`,
    );
  }
  const total = quote.productSubtotal + quote.deliveryFee;
  if (total !== quote.buyerTotal) {
    failures.push(
      `buyerTotal (${quote.buyerTotal}) != productSubtotal + deliveryFee ` +
        `(${quote.productSubtotal} + ${quote.deliveryFee} = ${total})`,
    );
  }
  const legs = quote.amountPaidAtCheckout + quote.amountDueAtDelivery;
  if (legs !== quote.buyerTotal) {
    failures.push(
      `amountPaidAtCheckout + amountDueAtDelivery (${quote.amountPaidAtCheckout} + ${quote.amountDueAtDelivery} = ${legs}) != buyerTotal (${quote.buyerTotal})`,
    );
  }
  if (failures.length > 0) {
    throw new QuoteReconciliationError(failures, quote);
  }
}
