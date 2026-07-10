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
 * E1 order status — the five-state list (canon at v0.3.0 per the WO-1.1
 * verifier's NB-6 and Contract §2.2 single-definition; enum only, the state
 * machine is app-repo work). Terminal/failure states are E2's and are
 * deliberately absent.
 */
export const ORDER_STATUSES = ['quote_issued', 'reserved', 'payment_pending', 'paid', 'confirmed'] as const;
export const OrderStatusSchema = z.enum(ORDER_STATUSES);
export type OrderStatus = z.infer<typeof OrderStatusSchema>;

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

/** §5.6: CustodyLiabilityClaim causes (Séra-caused; separate from the Protection Fund). */
export const CUSTODY_LIABILITY_CAUSES = ['sera_loss', 'sera_damage'] as const;
export const CustodyLiabilityCauseSchema = z.enum(CUSTODY_LIABILITY_CAUSES);
export type CustodyLiabilityCause = z.infer<typeof CustodyLiabilityCauseSchema>;
