import { z } from 'zod';
import {
  FcfaSchema,
  IdSchema,
  PaymentLegStatusSchema,
  SupplyProjectionSchema,
} from '@platform/contracts';
import type { CertifiableDomain } from './adapter.js';

/**
 * Per-domain event payload schemas for the E1 certification suite —
 * composed STRICTLY from pinned @platform/contracts shapes. They live here
 * at E1 and are promoted into `contracts/` by deliberate version bump when
 * frozen (Contract §2.2). §3 behavior 8 identity-checks an adapter's
 * declared producerSchema against this registry: the mock and the live
 * producer must declare the SAME schema.
 */
/**
 * E1-ASSEMBLY ALIGNMENT (flagged in JOURNAL.md, founder-reviewable):
 * the deployed payment consumer (shop-plus OrderSpine, founder-reviewed
 * WO-1.1) parses top-level `amount`/`status` — the shape the sandbox
 * provider mock actually emits. The prior nested `{orderId, paymentAttemptId,
 * leg}` shape was a WO-1.0 scaffold no deployed producer or consumer uses; a
 * mock certified against it would hide the real contract (§3: "a green run
 * against an obedient mock is not evidence").
 */
export const PaymentProviderEventPayloadSchema = z
  .object({
    provider: z.string().min(1),
    payment_attempt_id: IdSchema,
    collectRef: z.string().min(1),
    amount: FcfaSchema,
    fee: FcfaSchema,
    status: PaymentLegStatusSchema,
    order_id: IdSchema,
    redelivery: z.number().int().min(0),
  })
  .strict();

/**
 * E1-ASSEMBLY ALIGNMENT (flagged in JOURNAL.md, founder-reviewable):
 * the live settlement-eligibility producer (sera CustodySpine,
 * founder-reviewed WO-1.3) emits an amount-free signal — SE-I09: Séra never
 * computes proceeds; commerce-core copies amounts from the Quote on its
 * side. The prior payload carried a SettlementObligation WITH an amount in a
 * Séra-produced event, which the live producer must never emit (Ten Laws #2).
 */
export const EligibilityEventPayloadSchema = z
  .object({
    order_id: IdSchema,
    task_id: IdSchema,
    validation_id: IdSchema,
    result: z.literal('validated'),
    settlement_eligibility: z.literal(true),
  })
  .strict();

/**
 * Promoted to @platform/contracts at v0.4.0 (§2.2 single definition) —
 * re-exported here so the domain registry and existing imports keep working.
 */
export const SupplyProjectionEventPayloadSchema = SupplyProjectionSchema;

export const ReadinessEventPayloadSchema = z
  .object({
    orderId: IdSchema,
    packageId: IdSchema,
    readinessConfirmed: z.boolean(),
    at: z.string().min(1),
  })
  .strict();

export const DOMAIN_PAYLOAD_SCHEMAS: Readonly<Record<CertifiableDomain, z.ZodType>> = {
  'payment-provider': PaymentProviderEventPayloadSchema,
  eligibility: EligibilityEventPayloadSchema,
  'supply-projection': SupplyProjectionEventPayloadSchema,
  readiness: ReadinessEventPayloadSchema,
};
