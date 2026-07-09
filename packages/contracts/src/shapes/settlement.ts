import { z } from 'zod';
import {
  CustodyLiabilityCauseSchema,
  FaultClassSchema,
  FundSolvencyStateSchema,
  PaymentLegStatusSchema,
  PaymentLegTypeSchema,
  SellerTrustTierSchema,
  SettlementObligationStateSchema,
} from '../enums.js';
import { FcfaSchema, IdSchema, IsoTimestampSchema, SignedFcfaSchema } from './common.js';

/** §5.6 SettlementObligation — amount is LOCKED from the quote/ledger, never recomputed (B+I-05). */
export const SettlementObligationSchema = z
  .object({
    orderId: IdSchema,
    party: z.string().min(1),
    amount: FcfaSchema,
    state: SettlementObligationStateSchema,
    payoutRef: IdSchema.optional(),
    holds: z.array(z.string().min(1)),
  })
  .strict();
export type SettlementObligation = z.infer<typeof SettlementObligationSchema>;

/** §5.6 EscrowTxn — provider truth; paymentLegs per mode. No app holds funds. */
export const PaymentLegSchema = z
  .object({
    legType: PaymentLegTypeSchema,
    collectRef: z.string().min(1),
    amount: FcfaSchema,
    fee: FcfaSchema,
    status: PaymentLegStatusSchema,
  })
  .strict();
export type PaymentLeg = z.infer<typeof PaymentLegSchema>;

export const EscrowTxnSchema = z
  .object({
    orderId: IdSchema,
    provider: z.string().min(1),
    paymentLegs: z.array(PaymentLegSchema),
    status: z.string().min(1),
    splitBreakdown: z.record(z.string(), FcfaSchema),
    payoutRefs: z.array(IdSchema),
  })
  .strict();
export type EscrowTxn = z.infer<typeof EscrowTxnSchema>;

/** §5.6/§6 ProtectionFund — OWNER: Ledger&Settlement. Platform-funded; sellers never contribute. */
export const ProtectionFundSchema = z
  .object({
    openingFundCapital: FcfaSchema,
    balance: FcfaSchema,
    minimumOperatingBalance: FcfaSchema,
    requiredProtectionBalance: FcfaSchema,
    availableProtectionBalance: FcfaSchema,
    committedClaimsAmount: FcfaSchema,
    fundSolvencyState: FundSolvencyStateSchema,
    allocationPolicy: z
      .object({
        byCategory: z.record(z.string(), z.number()),
        byZone: z.record(z.string(), z.number()),
        bySellerTier: z.record(z.string(), z.number()),
      })
      .strict(),
    inflowsBySource: z.array(
      z.object({ source: z.string().min(1), amount: FcfaSchema }).strict(),
    ),
    outflowsByReason: z.array(
      z.object({ reason: z.string().min(1), amount: FcfaSchema }).strict(),
    ),
  })
  .strict();
export type ProtectionFund = z.infer<typeof ProtectionFundSchema>;

/** §5.6 ProtectionClaim — every claim carries a faultClass. */
export const ProtectionClaimSchema = z
  .object({
    orderId: IdSchema,
    reason: z.string().min(1),
    amount: FcfaSchema,
    faultClass: FaultClassSchema,
    evidenceBundleId: IdSchema,
    state: z.string().min(1),
  })
  .strict();
export type ProtectionClaim = z.infer<typeof ProtectionClaimSchema>;

/** §5.6 CustodyLiabilityClaim — Séra-caused; separate from the Protection Fund. */
export const CustodyLiabilityClaimSchema = z
  .object({
    orderId: IdSchema,
    cause: CustodyLiabilityCauseSchema,
    amount: FcfaSchema,
    evidenceBundleId: IdSchema,
    state: z.string().min(1),
  })
  .strict();
export type CustodyLiabilityClaim = z.infer<typeof CustodyLiabilityClaimSchema>;

/** §5.6 SellerTrustState — progression, not payment (zero deposit, ever). */
export const SellerTrustStateSchema = z
  .object({
    sellerId: IdSchema,
    tier: SellerTrustTierSchema,
    faultCount: z.number().int().min(0),
    restrictions: z.array(z.string().min(1)),
    probationLimits: z.record(z.string(), z.unknown()),
  })
  .strict();
export type SellerTrustState = z.infer<typeof SellerTrustStateSchema>;

/** §5.6 PayAtDoorEligibility — OWNER: Risk; the progressive buyer-refusal ladder writes here. */
export const PayAtDoorEligibilitySchema = z
  .object({
    buyerRef: IdSchema,
    state: z.string().min(1),
    reason: z.string().min(1).optional(),
    buyerRefusalCount: z.number().int().min(0),
    buyerRiskState: z.string().min(1),
    requiredDeposit: FcfaSchema,
    prepayOnlyUntil: IsoTimestampSchema.optional(),
  })
  .strict();
export type PayAtDoorEligibility = z.infer<typeof PayAtDoorEligibilitySchema>;

/** §5.6 DeliveryCost — decomposed, never a single optimistic figure (Séra §7.1). Margins may be negative. */
export const DeliveryCostSchema = z
  .object({
    orderId: IdSchema,
    directDeliveryCost: FcfaSchema,
    returnDeliveryCost: FcfaSchema,
    allocatedFleetOverhead: FcfaSchema,
    allocatedDispatchOverhead: FcfaSchema,
    fullyLoadedDeliveryCost: FcfaSchema,
    deliveryFunding: FcfaSchema,
    deliveryContributionMargin: SignedFcfaSchema,
  })
  .strict();
export type DeliveryCost = z.infer<typeof DeliveryCostSchema>;
