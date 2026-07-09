/**
 * RoundingLaw v1 — FOUNDER-CONFIRMED 2026-07-09 (closes the WO-0 §B2 ⏳).
 *
 * The law:
 *   sellerPlatformFee   = floor(0.05 × B)
 *   resellerPlatformFee = floor(0.20 × (C + M))
 *   sellerNet           = B − C − sellerPlatformFee
 *   resellerNet         = (C + M) − resellerPlatformFee
 *   platformProductFeeRevenue = sellerPlatformFee + resellerPlatformFee
 *
 * All Quote money fields are integer FCFA. Rounding exists ONLY on the two
 * fees; the nets are defined by subtraction, never as independent
 * multiplications. The reconciliation identity then holds algebraically for
 * every integer FCFA input:
 *   (B − C − f₁) + ((C + M) − f₂) + (f₁ + f₂) = B + M
 * `floor` means the fraction of a franc always stays with the participant,
 * never the platform.
 *
 * This is the single place a founder change to the rounding rule touches.
 */
export const ROUNDING_LAW_VERSION = 'v1' as const;

export const SELLER_PLATFORM_FEE = { numerator: 5, denominator: 100 } as const; // 5% of B
export const RESELLER_PLATFORM_FEE = { numerator: 20, denominator: 100 } as const; // 20% of (C + M)

export function assertIntegerFcfa(value: number, field: string): void {
  if (!Number.isSafeInteger(value)) {
    throw new RangeError(`${field} must be an integer FCFA amount, got ${value}`);
  }
  if (value < 0) {
    throw new RangeError(`${field} must be >= 0 FCFA, got ${value}`);
  }
}

/**
 * floor(base × numerator / denominator) in exact integer arithmetic —
 * floating-point multiplication of large FCFA amounts by 0.05/0.20 is not
 * trusted anywhere in the money path.
 */
function floorFraction(base: number, numerator: number, denominator: number): number {
  const scaled = base * numerator;
  if (!Number.isSafeInteger(scaled)) {
    throw new RangeError(`fee computation overflows safe integers for base ${base}`);
  }
  return Math.floor(scaled / denominator);
}

/** sellerPlatformFee = floor(0.05 × B) — RoundingLaw v1 */
export function sellerPlatformFee(sellerBasePrice: number): number {
  assertIntegerFcfa(sellerBasePrice, 'sellerBasePrice (B)');
  return floorFraction(sellerBasePrice, SELLER_PLATFORM_FEE.numerator, SELLER_PLATFORM_FEE.denominator);
}

/** resellerPlatformFee = floor(0.20 × (C + M)) — RoundingLaw v1 */
export function resellerPlatformFee(sellerFundedCommission: number, resellerMarkup: number): number {
  assertIntegerFcfa(sellerFundedCommission, 'sellerFundedCommission (C)');
  assertIntegerFcfa(resellerMarkup, 'resellerMarkup (M)');
  return floorFraction(
    sellerFundedCommission + resellerMarkup,
    RESELLER_PLATFORM_FEE.numerator,
    RESELLER_PLATFORM_FEE.denominator,
  );
}
