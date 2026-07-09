import { z } from 'zod';

/** Non-negative integer FCFA amount. All canonical money fields are integer FCFA (RoundingLaw v1). */
export const FcfaSchema = z.number().int().min(0);
/** Signed integer FCFA — for derived fields that may legitimately go negative (nets, margins). */
export const SignedFcfaSchema = z.number().int();

/** ISO-8601 server timestamp string. */
export const IsoTimestampSchema = z.string().min(1);

export const IdSchema = z.string().min(1);
