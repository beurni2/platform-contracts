/**
 * Secret-separation type test (WO-0 §B7): the four secrets are branded types
 * — not mutually assignable, not aliasable to plain string. This file is
 * checked by `tsc -p tsconfig.typetest.json`; if any of the @ts-expect-error
 * lines were to compile, the unused directive itself becomes a compile error
 * and the typecheck gate fails.
 */
import type {
  BuyerDropCode,
  HandoffAuthorizationSecret,
  PickupVerificationCode,
  SellerReadinessChallenge,
} from '../src/secrets.js';

declare const readinessChallenge: SellerReadinessChallenge;
declare const pickupCode: PickupVerificationCode;
declare const dropCode: BuyerDropCode;
declare const handoffSecret: HandoffAuthorizationSecret;
declare const plainString: string;

// --- No secret is assignable to another secret ---
// @ts-expect-error buyerDropCode never substitutes for the readiness challenge
const s1: SellerReadinessChallenge = dropCode;
// @ts-expect-error readiness challenge never substitutes for the pickup code
const s2: PickupVerificationCode = readinessChallenge;
// @ts-expect-error pickup code never substitutes for the drop code
const s3: BuyerDropCode = pickupCode;
// @ts-expect-error drop code never substitutes for the handoff authorization
const s4: HandoffAuthorizationSecret = dropCode;
// @ts-expect-error handoff authorization never substitutes for the pickup code
const s5: PickupVerificationCode = handoffSecret;
// @ts-expect-error readiness challenge never substitutes for the handoff authorization
const s6: HandoffAuthorizationSecret = readinessChallenge;

// --- A plain string is not accepted where a secret is required ---
// @ts-expect-error plain strings cannot pose as a readiness challenge
const p1: SellerReadinessChallenge = plainString;
// @ts-expect-error plain strings cannot pose as a pickup code
const p2: PickupVerificationCode = plainString;
// @ts-expect-error plain strings cannot pose as a drop code
const p3: BuyerDropCode = plainString;
// @ts-expect-error plain strings cannot pose as a handoff authorization
const p4: HandoffAuthorizationSecret = plainString;

// Widening to string for display/logging remains possible and intentional:
const widened: string = readinessChallenge;

export { s1, s2, s3, s4, s5, s6, p1, p2, p3, p4, widened };
