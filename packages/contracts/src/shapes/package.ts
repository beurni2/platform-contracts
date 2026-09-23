import { z } from 'zod';
import { PACKAGE_ORDERS_MAX, PACKAGE_ORDERS_MIN } from '../money/package-fee.js';
import { IdSchema } from './common.js';

/**
 * ═══════════════════════════════════════════════════════════════════════════
 * COLIS-FOURNISSEUR-1 — ONE PACKAGE, SEVERAL ORDERS (founder ruling 2026-09-23)
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * a. A package holds the orders of ONE supplier, for ONE buyer, to ONE
 *    address — paid together in one grouped payment (Shop+ SP6). The rider
 *    still does one pickup and one drop: it is ONE job, not batching.
 * b. ONE delivery fee per package (`splitPackageDeliveryFee`).
 * c. At the door she may refuse one article and keep the rest.
 * d. Pay at the door: ONE door payment for the products she keeps.
 *
 * Every article STAYS ITS OWN ORDER — its own Quote, escrow, settlement,
 * refund and custody file. The package is the grouping those orders travel
 * under.
 */

/**
 * WHICH ARTICLES LEAVE TOGETHER — the question Shop+ asks Boutik+ for one
 * panier, before any quote is issued, so her screen can say « 1 livraison »
 * BEFORE she pays.
 *
 * ═══ THE PRIVACY RULE, KEPT ═══ Supplier identity still never crosses to
 * Shop+ (`OrderConfirmedPayloadSchema`'s rule). The answer names NO supplier:
 * it only says which of the asked products leave from the SAME one — groups
 * of product ids, for this panier, never who, never where. Every asked
 * product appears in exactly one group; a product Boutik+ does not know is a
 * group of its own (it simply travels alone).
 */
export const PackageGroupingRequestSchema = z
  .object({
    productVersionIds: z
      .array(IdSchema)
      .min(PACKAGE_ORDERS_MIN)
      .max(PACKAGE_ORDERS_MAX)
      .refine((ids) => new Set(ids).size === ids.length, 'a product is asked about once'),
  })
  .strict();
export type PackageGroupingRequest = z.infer<typeof PackageGroupingRequestSchema>;

export const PackageGroupingAnswerSchema = z
  .object({
    groups: z.array(z.array(IdSchema).min(1)).min(1),
  })
  .strict();
export type PackageGroupingAnswer = z.infer<typeof PackageGroupingAnswerSchema>;

/** The answer covers EXACTLY the asked products, each in one group — or it is not an answer. */
export function isGroupingOf(answer: PackageGroupingAnswer, request: PackageGroupingRequest): boolean {
  const asked = new Set(request.productVersionIds);
  const seen = new Set<string>();
  for (const group of answer.groups) {
    for (const id of group) {
      if (!asked.has(id) || seen.has(id)) return false;
      seen.add(id);
    }
  }
  return seen.size === asked.size;
}

/**
 * The package an order travels in, as the orders themselves carry it across
 * apps (on `order.confirmed.v1`, and on Séra's funding fact): the package's
 * id and EVERY order in it. Absent when the order travels alone.
 */
export const OrderPackageSchema = z
  .object({
    packageId: IdSchema,
    orderIds: z
      .array(IdSchema)
      .min(PACKAGE_ORDERS_MIN)
      .max(PACKAGE_ORDERS_MAX)
      .refine((ids) => new Set(ids).size === ids.length, 'an order is in a package once'),
  })
  .strict();
export type OrderPackage = z.infer<typeof OrderPackageSchema>;
