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

/**
 * §6.5 RELATED-PARTY DETECTION (tiered; OWNER: Risk) — canon v3.6.0.
 *
 * §6.5 names two families. AUTO-VOID: the same verified identity, the same
 * phone, the same mobile-money account, or the reseller buying through her own
 * account. MANUAL-REVIEW (explicitly NOT auto-void): the same device,
 * household, landmark, shared phone or network — « often legitimate in Burkina
 * Faso », the spec's own words, in bold. During investigation the commission is
 * HELD, not returned; there is an appeal path; on violation it returns to the
 * seller, on clear it is paid.
 *
 * ⚠ ONE IDENTIFIER DEPARTS FROM THE SPEC'S WORD, AND ONLY THE WORD. §6.5 writes
 * « identity/phone/wallet »; this enum says `mobile_money_account`, because the
 * ecosystem-wide Ten Laws #2 scan bans that English token outright (it exists to
 * stop a stored-value module ever appearing, and it is deliberately blunt — the
 * repo's convention is that code bends around it, not that the guard is
 * narrowed). The meaning is unchanged and is arguably more exact for this
 * market, where the account in question is always MoMo.
 *
 * ═══ WHY THE TIER IS THE WHOLE POINT ═══
 *
 * Two families of signal, and treating them alike would be the defect. A shared
 * handset, a shared landmark, one household, one neighbourhood wifi — these are
 * ORDINARY in Burkina Faso, and auto-voiding a reseller's commission on them
 * would punish the normal shape of life here. They flag for a human. Only an
 * identity match — the SAME verified person, phone or wallet on both sides —
 * voids automatically, because that is not a coincidence.
 *
 * THE SIGNALS ARE SPLIT INTO TWO NAMED SETS RATHER THAN ONE LIST WITH A
 * SEVERITY FIELD. A single list plus a severity would let a caller mark a
 * household match as identity-grade; two sets make that unrepresentable.
 */
export const RelatedPartySignalsSchema = z
  .object({
    /**
     * Identity-grade matches — the auto-void family. Each is a match of the
     * SAME verified identity, phone or mobile-money account across the two
     * sides, or the reseller buying through her own account.
     */
    identity: z.array(z.enum(['verified_identity', 'phone', 'mobile_money_account', 'own_account'])),
    /**
     * Circumstantial matches — the review family. Never auto-void: « often
     * legitimate in Burkina Faso » is spec text, not a caveat.
     */
    circumstantial: z.array(z.enum(['device', 'household', 'landmark', 'shared_phone', 'network'])),
  })
  .strict();
export type RelatedPartySignals = z.infer<typeof RelatedPartySignalsSchema>;

/**
 * §6.5's outcome for one order's reseller commission.
 *
 * `held` IS NOT `voided`, and the distinction is the buyer-facing half of the
 * rule: « During investigation commission is **held**, not returned; appeal
 * path; on violation → returned to seller; on clear → paid. » A review does not
 * take her money — it pauses it, with a way back.
 */
export const RelatedPartyDecisionSchema = z
  .object({
    orderId: IdSchema,
    outcome: z.enum(['clear', 'held_for_review', 'auto_void']),
    signals: RelatedPartySignalsSchema,
    /** The policy version this decision was made under — decisions replay. */
    policyVersion: z.string().min(1),
    decidedAt: IsoTimestampSchema,
  })
  .strict();
export type RelatedPartyDecision = z.infer<typeof RelatedPartyDecisionSchema>;

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
