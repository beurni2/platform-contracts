import { z } from 'zod';
import { ModerationReasonCodeSchema } from '../enums.js';

/**
 * Moderation decision — Boutik A1 RATIFIED v1 (founder-ratified 2026-07-13; canon
 * since v0.9.6). PLATFORM Desk 3 ISSUES these; boutik catalog-service CONSUMES
 * them (B+I-01: "an approved moderation decision"). Three properties are enforced
 * at the schema, not by discipline:
 *
 *  1. EXACTLY TWO outcomes — `approved` | `changes_requested`. There is no
 *     generic/"rejected" terminal, so a SILENT rejection is unrepresentable
 *     (mirrors the no-generic-'failed' order-status law).
 *  2. `changes_requested` MUST name ≥1 reason of `MODERATION_REASON_CODES` — a
 *     REASONLESS rejection is unrepresentable.
 *  3. `decided_by` MUST be an `ops:moderation:*` actor — "no self-moderation;
 *     verification/moderation operator is Ops only" (Boutik-Plus-Build-Spec
 *     §Roles). A supplier actor never validates.
 */

/** `decided_by` must be an ops:moderation:* actor (no self-moderation). */
const ModerationActorSchema = z
  .string()
  .regex(/^ops:moderation:[A-Za-z0-9._:-]+$/, 'decided_by must be an ops:moderation:* actor (no self-moderation)');

export const ModerationDecisionSchema = z.discriminatedUnion('decision', [
  z
    .object({
      decision: z.literal('approved'),
      decided_by: ModerationActorSchema,
    })
    .strict(),
  z
    .object({
      decision: z.literal('changes_requested'),
      // ≥1 reason: a reasonless (silent) rejection cannot be constructed.
      reasons: z.array(ModerationReasonCodeSchema).min(1),
      decided_by: ModerationActorSchema,
    })
    .strict(),
]);
export type ModerationDecision = z.infer<typeof ModerationDecisionSchema>;
