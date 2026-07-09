/**
 * NEGATIVE FIXTURE for the secret-separation gate (WO-0 §B7).
 * This file intentionally substitutes one secret for another WITHOUT
 * @ts-expect-error. It MUST fail to compile; `scripts/run-gates.sh` runs tsc
 * on it and requires a non-zero exit. It is excluded from every build and
 * typecheck tsconfig — it exists only to prove the gate can fail.
 */
import type { BuyerDropCode, SellerReadinessChallenge } from '../src/secrets.js';

declare const dropCode: BuyerDropCode;

// The forbidden substitution: the buyer's private drop code posing as the
// seller readiness challenge. If this line ever compiles, the four-secrets
// separation is broken.
export const leaked: SellerReadinessChallenge = dropCode;

declare const plain: string;
// A plain string posing as a drop code must not compile either.
export const forged: BuyerDropCode = plain;
