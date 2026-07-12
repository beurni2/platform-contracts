import { z } from 'zod';
import {
  CustodyLiabilityCauseSchema,
  EscrowTxnStatusSchema,
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
    // v0.5.0: promoted from a bare string — the aggregator's flow stages
    // "collect→hold→split→payout" + refunded (E2-taxonomy.md §2).
    status: EscrowTxnStatusSchema,
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

/**
 * §5.6 probationLimits — closed at v0.7.0 (WO-0G) from the open record to the
 * STRICT set of limits the trust-tier text names (Boutik-Plus-Build-Spec.md
 * :31–35; derivation quotes in docs/derivations/V0.7.0-DOCKET.md). Every key
 * optional (limits vary by tier — a trusted seller may carry none). STRICT by
 * construction: the zero-deposit law (B+I-12) is enforced at the type
 * boundary — a deposit/reserve/money key has no home here and refuses at
 * parse. `maxOrderValueFcfa` is the spec's named "order value" CEILING, never
 * a held/deposit amount.
 */
export const ProbationLimitsSchema = z
  .object({
    /** "one active order at a time" / "multiple concurrent orders" / "lower concurrency" */
    maxActiveOrders: z.number().int().min(0).optional(),
    /** "limited quantity/order value" / "higher value limits" — a ceiling, not a deposit */
    maxOrderValueFcfa: FcfaSchema.optional(),
    /** "limited quantity/order value" — a per-order quantity ceiling */
    maxOrderQuantity: z.number().int().min(0).optional(),
    /** "approved launch categories only, no high-risk/counterfeit-prone categories" */
    approvedCategoriesOnly: z.boolean().optional(),
    /** "FULL_PREPAY orders only" / "Option B disabled, FULL_PREPAY-only" */
    fullPrepayOnly: z.boolean().optional(),
    /** "every pickup rider-verified" / "mandatory pickup verification" */
    everyPickupVerified: z.boolean().optional(),
  })
  .strict();
export type ProbationLimits = z.infer<typeof ProbationLimitsSchema>;

/** §5.6 SellerTrustState — progression, not payment (zero deposit, ever). */
export const SellerTrustStateSchema = z
  .object({
    sellerId: IdSchema,
    tier: SellerTrustTierSchema,
    faultCount: z.number().int().min(0),
    restrictions: z.array(z.string().min(1)),
    probationLimits: ProbationLimitsSchema,
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
