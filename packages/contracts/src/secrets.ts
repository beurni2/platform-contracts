import { z } from 'zod';

/**
 * The four distinct, non-interchangeable secrets (§5.6, all three specs):
 *
 *   sellerReadinessChallenge — short-TTL, in-app, seller↔readiness
 *   pickupVerificationCode   — rider↔pickup
 *   buyerDropCode            — buyer↔delivery, PRIVATE — never shown to the
 *                              seller or in readiness evidence
 *   HandoffAuthorization     — payment-confirmed handoff (the signed,
 *                              single-use credential; carried as the
 *                              `signature` of the HandoffAuthorization shape)
 *
 * Separation rule (CI-enforced): the four are never substitutable. Each is a
 * branded type; none is assignable to another, and none is aliasable to a
 * plain string in public APIs. See test-d/secret-separation.ts.
 */

declare const SellerReadinessChallengeBrand: unique symbol;
export type SellerReadinessChallenge = string & {
  readonly [SellerReadinessChallengeBrand]: 'SellerReadinessChallenge';
};

declare const PickupVerificationCodeBrand: unique symbol;
export type PickupVerificationCode = string & {
  readonly [PickupVerificationCodeBrand]: 'PickupVerificationCode';
};

declare const BuyerDropCodeBrand: unique symbol;
export type BuyerDropCode = string & {
  readonly [BuyerDropCodeBrand]: 'BuyerDropCode';
};

declare const HandoffAuthorizationSecretBrand: unique symbol;
export type HandoffAuthorizationSecret = string & {
  readonly [HandoffAuthorizationSecretBrand]: 'HandoffAuthorizationSecret';
};

export const SellerReadinessChallengeSchema = z
  .string()
  .min(1)
  .transform((v) => v as SellerReadinessChallenge);

export const PickupVerificationCodeSchema = z
  .string()
  .min(1)
  .transform((v) => v as PickupVerificationCode);

export const BuyerDropCodeSchema = z
  .string()
  .min(1)
  .transform((v) => v as BuyerDropCode);

export const HandoffAuthorizationSecretSchema = z
  .string()
  .min(1)
  .transform((v) => v as HandoffAuthorizationSecret);

export const SECRET_KINDS = [
  'sellerReadinessChallenge',
  'pickupVerificationCode',
  'buyerDropCode',
  'handoffAuthorization',
] as const;
export type SecretKind = (typeof SECRET_KINDS)[number];
