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
        /**
         * WHICH §6.1 PAY-AT-DOOR POLICY ADMITTED THIS QUOTE (founder
         * authorisation, 2026-08-12).
         *
         * Present on Option-B quotes, absent on FULL_PREPAY — a prepaid quote
         * passes through no door gate, and a version stamped on it would name a
         * decision that was never taken.
         *
         * WHY IT IS ON THE QUOTE AT ALL: §6.1's conditions are FOUNDER-TUNABLE,
         * and the 2026-08-12 override opened three of them. The eligibility
         * decision has always carried the version it was decided under, and the
         * issuer has always dropped it on the ELIGIBLE path — so an admitted
         * door order recorded nothing about the rules that admitted it. A
         * dispute months later could not tell an order admitted under the
         * 25 000 FCFA / verified-seller policy from one admitted under
         * `v2-ouvert-a-tous`, and a re-tightening could not be dated. That is
         * the audit trail the sentinels were kept for; this is where it lands.
         *
         * OPTIONAL, DELIBERATELY. The shape is `.strict()` and every quote
         * issued before this key existed is still canon — making it required
         * would retroactively invalidate them. « Every door quote carries it »
         * is enforced by test at the issuer, which is where the rule belongs;
         * the schema's job is only to say the key is legal and non-empty.
         */
        payAtDoorPolicyVersion: z.string().min(1).optional(),
      })
      .strict(),
    expiry: IsoTimestampSchema,
  })
  .strict();
export type Quote = z.infer<typeof QuoteSchema>;
