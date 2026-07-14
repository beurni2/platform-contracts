import { z } from 'zod';

/**
 * Canon rule (founder ruling 2026-07-15, WO-5.14 — "the whitespace tightening"):
 * a NON-EMPTY string with NO leading/trailing whitespace. Internal whitespace is
 * allowed (« Rood Woko, Ouagadougou », « Chez Aïcha »); a whitespace-only or
 * surrounding-whitespace value is invalid. Encoded as a regex (not a `.refine`) so
 * the rule is JSON-Schema-representable and drift-locks in the shape-freeze snapshot
 * — `^\S…\S$`, starts and ends with a non-whitespace char.
 *
 * This is the base primitive for the id-class and name/display-class strings across
 * BOTH kernel-types (UserId, PhoneAlias, Location.zone/landmark) and @platform/contracts
 * (IdSchema, names, zone/category). Machine references, MIME tokens, policy versions,
 * states, reasons, and timestamps are EXEMPT — see
 * platform-contracts docs/derivations/WHITESPACE-TIGHTENING.md for the per-field
 * disposition. Lives here because kernel-types is the base package contracts consumes.
 */
const TRIMMED_NON_EMPTY = /^\S([\s\S]*\S)?$/;
export const TrimmedNonEmptyString = z
  .string()
  .min(1)
  .regex(TRIMMED_NON_EMPTY, { message: 'must be non-empty and trimmed (no leading/trailing whitespace)' });
