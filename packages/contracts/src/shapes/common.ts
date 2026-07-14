import { z } from 'zod';
import { TrimmedNonEmptyString } from '@platform/kernel-types';

/** Non-negative integer FCFA amount. All canonical money fields are integer FCFA (RoundingLaw v1). */
export const FcfaSchema = z.number().int().min(0);
/** Signed integer FCFA — for derived fields that may legitimately go negative (nets, margins). */
export const SignedFcfaSchema = z.number().int();

/** ISO-8601 server timestamp string. */
export const IsoTimestampSchema = z.string().min(1);

/**
 * Canon "trimmed non-empty" primitive (founder ruling 2026-07-15, WO-5.14). Defined
 * in @platform/kernel-types (the base package both kernel-types shapes and these
 * contracts shapes consume) and RE-EXPORTED here so `@platform/contracts` continues
 * to expose it. A non-empty string with no leading/trailing whitespace (internal
 * whitespace preserved), encoded as a regex so it drift-locks in the shape-freeze
 * snapshot. See docs/derivations/WHITESPACE-TIGHTENING.md for the per-field
 * disposition (id/name/display tightened; machine refs, versions, states, timestamps
 * exempt).
 */
export { TrimmedNonEmptyString };

/** Id-class: a trimmed, non-empty identifier string. */
export const IdSchema = TrimmedNonEmptyString;
