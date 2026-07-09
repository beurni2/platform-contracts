import { z } from 'zod';
import { PaymentModeSchema } from '../enums.js';
import { FcfaSchema, IdSchema, IsoTimestampSchema, SignedFcfaSchema } from './common.js';

/**
 * Canonical Quote — THE FROZEN SHAPE (Boutik+ Spec §5.6 verbatim; founder
 * ruling 2026-07-08). IMMUTABLE once issued; reconciles to the franc
 * (assertQuoteReconciles). `supplyMode` / `handlingClass` / `kittingSealId`
 * NEVER appear on the Quote — a kitting seal cannot exist at quote time;
 * those fields enter contracts only by deliberate version bump behind the
 * B+9 gate. The schema is strict: undeclared keys are a parse failure.
 *
 * `campaignId?` / `campaignBenefit?` are canon fields kept per the founder
 * ruling (Cercle reconciliation anchor); Cercle *behavior* stays build-gated.
 */
export const CampaignBenefitSchema = z
  .object({
    type: z.string().min(1),
    customerShare: FcfaSchema,
    campaignShare: FcfaSchema,
  })
  .strict();
export type CampaignBenefit = z.infer<typeof CampaignBenefitSchema>;

export const QuoteSchema = z
  .object({
    id: IdSchema,
    /** LOCKED from qualified attribution or checkout storefront (SP-I01). */
    attributionResellerId: IdSchema,
    paymentMode: PaymentModeSchema,
    sellerBasePrice: FcfaSchema,
    sellerFundedCommission: FcfaSchema,
    resellerMarkup: FcfaSchema,
    productSubtotal: FcfaSchema,
    deliveryFee: FcfaSchema,
    buyerTotal: FcfaSchema,
    amountPaidAtCheckout: FcfaSchema,
    amountDueAtDelivery: FcfaSchema,
    sellerPlatformFee: FcfaSchema,
    sellerNet: SignedFcfaSchema,
    resellerGrossEarnings: FcfaSchema,
    resellerPlatformFee: FcfaSchema,
    resellerNet: FcfaSchema,
    platformProductFeeRevenue: FcfaSchema,
    paymentProcessingFeeEstimate: FcfaSchema,
    taxFields: z.record(z.string(), z.unknown()),
    campaignId: IdSchema.optional(),
    campaignBenefit: CampaignBenefitSchema.optional(),
    policyVersions: z
      .object({
        settlementPolicyVersion: z.string().min(1),
        inspectionPolicyVersion: z.string().min(1),
      })
      .strict(),
    expiry: IsoTimestampSchema,
  })
  .strict();
export type Quote = z.infer<typeof QuoteSchema>;
