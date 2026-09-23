import { assertIntegerFcfa } from './rounding-law.js';

/**
 * COLIS-FOURNISSEUR-1 — ONE DELIVERY FEE PER PACKAGE (founder ruling
 * 2026-09-23, decisions a–d: « Proceed with your recommendations », then
 * « build option 1 »).
 *
 * A package carries the orders of ONE supplier, for ONE buyer, to ONE address,
 * paid together; Séra prices it ONCE (D, its `DeliveryFeeQuote`). That one fee
 * is split EVENLY across the package's orders, to the franc, and any leftover
 * franc goes on the FIRST order — the orders taken in the order the package
 * lists them. Each order's Quote then carries its own share as its
 * `deliveryFee`, so every quote still reconciles on its own (§5.4 per order),
 * and the shares always add up to exactly the fee Séra stated.
 */

/** A package of one is a plain order; ten bounds a grouped payment (Shop+ SP6). */
export const PACKAGE_ORDERS_MIN = 2;
export const PACKAGE_ORDERS_MAX = 10;

export function splitPackageDeliveryFee(packageFee: number, orders: number): number[] {
  assertIntegerFcfa(packageFee, 'packageFee');
  if (!Number.isSafeInteger(orders) || orders < 1 || orders > PACKAGE_ORDERS_MAX) {
    throw new RangeError(`a package holds 1 to ${PACKAGE_ORDERS_MAX} orders, got ${orders}`);
  }
  const share = Math.floor(packageFee / orders);
  const leftover = packageFee - share * orders;
  return Array.from({ length: orders }, (_, i) => (i === 0 ? share + leftover : share));
}
