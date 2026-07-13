import { z } from 'zod';

/** §5.5 (all specs): the only two payment modes. */
export const PAYMENT_MODES = ['FULL_PREPAY', 'DELIVERY_FEE_PREPAID_PRODUCT_AT_DOOR'] as const;
export const PaymentModeSchema = z.enum(PAYMENT_MODES);
export type PaymentMode = z.infer<typeof PaymentModeSchema>;

/** §5.6: supply modes. PLATFORM_OWNED *behavior* (PackLab B+9) stays build-gated; the field is canon. */
export const SUPPLY_MODES = ['SELLER_HELD', 'PLATFORM_OWNED'] as const;
export const SupplyModeSchema = z.enum(SUPPLY_MODES);
export type SupplyMode = z.infer<typeof SupplyModeSchema>;

/** §5.6: fund solvency states. */
export const FUND_SOLVENCY_STATES = ['HEALTHY', 'WATCH', 'RESTRICTED', 'CRITICAL'] as const;
export const FundSolvencyStateSchema = z.enum(FUND_SOLVENCY_STATES);
export type FundSolvencyState = z.infer<typeof FundSolvencyStateSchema>;

/** §5.6: seller trust tiers (progression, not payment). */
export const SELLER_TRUST_TIERS = ['provisional', 'verified', 'trusted'] as const;
export const SellerTrustTierSchema = z.enum(SELLER_TRUST_TIERS);
export type SellerTrustTier = z.infer<typeof SellerTrustTierSchema>;

/** §5.6: fault classes on every ProtectionClaim. */
export const FAULT_CLASSES = ['seller', 'sera', 'payment_provider', 'buyer', 'platform_system', 'unresolved'] as const;
export const FaultClassSchema = z.enum(FAULT_CLASSES);
export type FaultClass = z.infer<typeof FaultClassSchema>;

/**
 * Order status (canon since v0.3.0/NB-6; the three E2 failure states added
 * at v0.5.0 by deliberate bump — every member derived, quotes in
 * docs/derivations/E2-taxonomy.md §1; enum only, the state machine is
 * app-repo work):
 *   payment_failed — Contract E2 "reservation-held-after-payment-fail" /
 *                    §6 "a reservation stays held after payment failure"
 *   cancelled      — SE-I10 "retry/return/cancellation/support/incident" /
 *                    "refund/cancellation consume reason + evidence"
 *   refunded       — B+7 "buyer refunded" / B+I-13 "the buyer's refund"
 * NO generic 'failed' member exists (SE-I10) — unrepresentable, gate-proven.
 */
export const ORDER_STATUSES = [
  'quote_issued',
  'reserved',
  'payment_pending',
  'paid',
  'confirmed',
  'payment_failed',
  'cancelled',
  'refunded',
] as const;
export const OrderStatusSchema = z.enum(ORDER_STATUSES);
export type OrderStatus = z.infer<typeof OrderStatusSchema>;

/**
 * Moderation reason codes — Boutik A1 RATIFIED v1 set (founder-ratified
 * 2026-07-13; canon since v0.9.6). Every `changes_requested` decision names one
 * or more of these; a silent/reasonless rejection is unrepresentable (see
 * `ModerationDecisionSchema`, shapes/moderation.ts). Grounded in
 * Boutik-Plus-Build-Spec: B+I-01 (approved facts + public-safe actual-item
 * proof), the price-free / contact-free hero rule, the neutral-packaging rule
 * (B+3), category rules, and "no unresolved moderation / authenticity concern".
 * PLATFORM Desk 3 issues decisions naming these; boutik catalog-service consumes
 * them.
 */
export const MODERATION_REASON_CODES = [
  'facts_incomplete',
  'no_public_safe_proof',
  'price_or_contact_in_image',
  'not_neutral_packaging',
  'prohibited_or_unlaunched_category',
  'authenticity_concern',
] as const;
export const ModerationReasonCodeSchema = z.enum(MODERATION_REASON_CODES);
export type ModerationReasonCode = z.infer<typeof ModerationReasonCodeSchema>;

/** §5.6: SettlementObligation state — Locked→Pending→Eligible→Payable→Processing→Paid|Held|Failed (enum only; the state machine is app-repo work). */
export const SETTLEMENT_OBLIGATION_STATES = [
  'Locked',
  'Pending',
  'Eligible',
  'Payable',
  'Processing',
  'Paid',
  'Held',
  'Failed',
] as const;
export const SettlementObligationStateSchema = z.enum(SETTLEMENT_OBLIGATION_STATES);
export type SettlementObligationState = z.infer<typeof SettlementObligationStateSchema>;

/** §5.6: HandoffAuthorization lifecycle states. */
export const HANDOFF_AUTHORIZATION_STATES = [
  'requested',
  'operator_verifying',
  'provider_confirmed',
  'issued',
  'consumed',
  'expired',
  'voided',
] as const;
export const HandoffAuthorizationStateSchema = z.enum(HANDOFF_AUTHORIZATION_STATES);
export type HandoffAuthorizationState = z.infer<typeof HandoffAuthorizationStateSchema>;

/** §5.6: authorization sources — provider webhook, or break-glass (mandatory incident review). */
export const AUTHORIZATION_SOURCES = ['provider_webhook', 'break_glass'] as const;
export const AuthorizationSourceSchema = z.enum(AUTHORIZATION_SOURCES);
export type AuthorizationSource = z.infer<typeof AuthorizationSourceSchema>;

/** §5.6: ValidationDecision results. */
export const VALIDATION_RESULTS = ['validated', 'review_hold', 'rejected'] as const;
export const ValidationResultSchema = z.enum(VALIDATION_RESULTS);
export type ValidationResult = z.infer<typeof ValidationResultSchema>;

/** §5.6: PickupVerification results. */
export const PICKUP_VERIFICATION_RESULTS = ['accepted', 'refused'] as const;
export const PickupVerificationResultSchema = z.enum(PICKUP_VERIFICATION_RESULTS);
export type PickupVerificationResult = z.infer<typeof PickupVerificationResultSchema>;

/** §5.6 EscrowTxn payment legs. */
export const PAYMENT_LEG_TYPES = ['checkout', 'door'] as const;
export const PaymentLegTypeSchema = z.enum(PAYMENT_LEG_TYPES);
export type PaymentLegType = z.infer<typeof PaymentLegTypeSchema>;

export const PAYMENT_LEG_STATUSES = ['held', 'captured', 'refunded'] as const;
export const PaymentLegStatusSchema = z.enum(PAYMENT_LEG_STATUSES);
export type PaymentLegStatus = z.infer<typeof PaymentLegStatusSchema>;

/**
 * §5.6 EscrowTxn.status — promoted from a bare string at v0.5.0. The four
 * flow stages are the aggregator's, named identically in both specs:
 * "BCEAO-licensed aggregator (collect→hold→split→payout; no app holds
 * funds)"; refunded per the leg vocabulary + B+I-13. Derivations:
 * docs/derivations/E2-taxonomy.md §2.
 */
export const ESCROW_TXN_STATUSES = ['collect', 'hold', 'split', 'payout', 'refunded'] as const;
export const EscrowTxnStatusSchema = z.enum(ESCROW_TXN_STATUSES);
export type EscrowTxnStatus = z.infer<typeof EscrowTxnStatusSchema>;

/**
 * SE6.1 delivery-outcome families — "Structured reasons;
 * retry/reschedule/return/incident; no generic failed terminal;
 * fault-attributed." A generic 'failed' member is deliberately
 * UNREPRESENTABLE (SE-I10) — gate-proven at parse. Derivations:
 * docs/derivations/E2-taxonomy.md §3 (spec-prose variant `return_required`
 * flagged there for founder ratification).
 */
export const DELIVERY_OUTCOME_FAMILIES = ['retry', 'reschedule', 'return', 'incident'] as const;
export const DeliveryOutcomeFamilySchema = z.enum(DELIVERY_OUTCOME_FAMILIES);
export type DeliveryOutcomeFamily = z.infer<typeof DeliveryOutcomeFamilySchema>;

/**
 * Structured delivery-failure reason codes — Shop+ §6.4 verbatim ("Classify
 * reason: honest_absence | unusable_location | insufficient_balance |
 * change_of_mind | repeated_abuse | fraud | conformity_mismatch") plus
 * provider_failure ("Honest absence / provider failure do NOT escalate").
 * conformity_mismatch added at v0.9.0 (WO-5.2): Shop+ §6.4 reason enum (A4) +
 * Séra Building-Plan SE5.1 (A3): "Un refus valide à l'inspection porte le code
 * `conformity_mismatch`." Human-readable text lives in the i18n catalog,
 * register-tagged — never inline (Law 6 / §10.5). Derivations:
 * docs/derivations/ATTRIBUTION-AND-CONFORMITY.md §1.
 */
export const DELIVERY_FAILURE_REASONS = [
  'honest_absence',
  'unusable_location',
  'insufficient_balance',
  'change_of_mind',
  'repeated_abuse',
  'fraud',
  'provider_failure',
  'conformity_mismatch',
] as const;
export const DeliveryFailureReasonSchema = z.enum(DELIVERY_FAILURE_REASONS);
export type DeliveryFailureReason = z.infer<typeof DeliveryFailureReasonSchema>;

/** §5.6: CustodyLiabilityClaim causes (Séra-caused; separate from the Protection Fund). */
export const CUSTODY_LIABILITY_CAUSES = ['sera_loss', 'sera_damage'] as const;
export const CustodyLiabilityCauseSchema = z.enum(CUSTODY_LIABILITY_CAUSES);
export type CustodyLiabilityCause = z.infer<typeof CustodyLiabilityCauseSchema>;
