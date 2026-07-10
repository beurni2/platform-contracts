import { z } from 'zod';
import {
  FcfaSchema,
  IdSchema,
  PaymentLegSchema,
  SettlementObligationSchema,
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

export const SupplyProjectionEventPayloadSchema = z
  .object({
    productVersionId: IdSchema,
    offerVersion: z.string().min(1),
    basePrice: FcfaSchema,
    resellerCommission: FcfaSchema,
    available: z.number().int().min(0),
  })
  .strict();

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
