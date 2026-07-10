import { z } from 'zod';
import {
  IdSchema,
  PaymentLegSchema,
  SettlementObligationSchema,
  SupplyProjectionSchema,
  ValidationDecisionSchema,
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
export const PaymentProviderEventPayloadSchema = z
  .object({
    orderId: IdSchema,
    paymentAttemptId: IdSchema,
    leg: PaymentLegSchema,
  })
  .strict();

export const EligibilityEventPayloadSchema = z
  .object({
    orderId: IdSchema,
    validation: ValidationDecisionSchema,
    obligation: SettlementObligationSchema,
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
