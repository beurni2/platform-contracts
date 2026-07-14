import { z } from 'zod';
import { TrimmedNonEmptyString } from './strings.js';

/**
 * Phone-alias identity (spec §5.1, all apps): the phone number is an alias,
 * never the database key. Entities reference each other by opaque ids; the
 * alias is verified, unique, and replaceable without identity loss.
 */
declare const PhoneAliasBrand: unique symbol;
export type PhoneAlias = string & { readonly [PhoneAliasBrand]: 'PhoneAlias' };

// WO-5.14: identity-class — trimmed non-empty (phone alias is the identity handle).
export const PhoneAliasSchema = TrimmedNonEmptyString.transform((v) => v as PhoneAlias);

declare const UserIdBrand: unique symbol;
export type UserId = string & { readonly [UserIdBrand]: 'UserId' };

// WO-5.14: id-class — trimmed non-empty.
export const UserIdSchema = TrimmedNonEmptyString.transform((v) => v as UserId);

export const VerifiedPhoneAliasSchema = z.object({
  alias: PhoneAliasSchema,
  verified: z.boolean(),
  unique: z.literal(true),
});
export type VerifiedPhoneAlias = z.infer<typeof VerifiedPhoneAliasSchema>;
