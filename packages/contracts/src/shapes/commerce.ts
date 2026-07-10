import { z } from 'zod';
import {
  LocationSchema,
  MediaRefSchema,
  UserIdSchema,
  VerifiedPhoneAliasSchema,
} from '@platform/kernel-types';
import { OrderStatusSchema, PaymentModeSchema, SupplyModeSchema } from '../enums.js';
import { FcfaSchema, IdSchema, IsoTimestampSchema } from './common.js';

/** §5.6 User — phone is an alias, never the key. */
export const UserSchema = z
  .object({
    id: UserIdSchema,
    phoneAlias: VerifiedPhoneAliasSchema,
    roles: z
      .object({
        supplier: z.boolean(),
        reseller: z.boolean(),
        buyer: z.boolean(),
      })
      .strict(),
    payoutInstrumentRef: IdSchema.optional(),
    trustState: z.string().min(1),
  })
  .strict();
export type User = z.infer<typeof UserSchema>;

/**
 * §5.6 Product/Version. `supplyMode` and `handlingClass?` are canon fields
 * exactly as the spec writes them; PLATFORM_OWNED *behavior* (PackLab B+9)
 * stays build-gated.
 */
export const ProductVersionSchema = z
  .object({
    id: IdSchema,
    supplierId: IdSchema,
    version: z.number().int().min(1),
    name: z.string().min(1),
    productCode: z.string().min(1),
    facts: z.record(z.string(), z.unknown()),
    category: z.string().min(1),
    zone: z.string().min(1),
    moderationState: z.string().min(1),
    status: z.string().min(1),
    supplyMode: SupplyModeSchema,
    handlingClass: z.string().min(1).optional(),
  })
  .strict();
export type ProductVersion = z.infer<typeof ProductVersionSchema>;

/** §5.6 Variant. */
export const VariantSchema = z
  .object({
    id: IdSchema,
    productVersionId: IdSchema,
    attributes: z.record(z.string(), z.string()),
    stableSku: z.string().min(1),
  })
  .strict();
export type Variant = z.infer<typeof VariantSchema>;

/** §5.6 ProductAssets — PRICE-FREE, contact-free (B+I-02); master private + immutable (B+I-08). */
export const ProductAssetsSchema = z
  .object({
    masterRef: MediaRefSchema,
    heroSquare: MediaRefSchema,
    heroVertical: MediaRefSchema,
    proof: MediaRefSchema,
    detail: z.array(MediaRefSchema),
    hashes: z.array(z.string().min(1)),
    processingVersion: z.string().min(1),
  })
  .strict();
export type ProductAssets = z.infer<typeof ProductAssetsSchema>;

/** §5.6 SupplierOffer — basePrice = B, resellerCommission = C (seller-funded, never in the buyer price). */
export const SupplierOfferSchema = z
  .object({
    id: IdSchema,
    productVersionId: IdSchema,
    version: z.number().int().min(1),
    basePrice: FcfaSchema,
    resellerCommission: FcfaSchema,
    platformFeeVersion: z.string().min(1),
    eligibleVariants: z.array(IdSchema),
    zones: z.array(z.string().min(1)),
    effective: IsoTimestampSchema,
    expiry: IsoTimestampSchema,
    status: z.string().min(1),
  })
  .strict();
export type SupplierOffer = z.infer<typeof SupplierOfferSchema>;

/** §5.6 CommissionAgreement — bound to an offer version. */
export const CommissionAgreementSchema = z
  .object({
    id: IdSchema,
    resellerId: IdSchema,
    offerVersion: z.string().min(1),
    acceptedAt: IsoTimestampSchema,
    status: z.string().min(1),
  })
  .strict();
export type CommissionAgreement = z.infer<typeof CommissionAgreementSchema>;

/** §5.6 ResellerListing — markup (M) is versioned, future-only (SP-I02). OWNER: Shop+. */
export const ResellerListingSchema = z
  .object({
    id: IdSchema,
    resellerId: IdSchema,
    productVersionId: IdSchema,
    offerVersion: z.string().min(1),
    markup: FcfaSchema,
    version: z.number().int().min(1),
    variants: z.array(IdSchema),
    status: z.string().min(1),
  })
  .strict();
export type ResellerListing = z.infer<typeof ResellerListingSchema>;

/** §5.6 Storefront. */
export const StorefrontSchema = z
  .object({
    id: IdSchema,
    resellerId: IdSchema,
    slug: z.string().min(1),
    discoverable: z.boolean(),
    curatedItems: z.array(IdSchema),
  })
  .strict();
export type Storefront = z.infer<typeof StorefrontSchema>;

/** §5.6 AttributionToken — signed; scope is listing/store/campaign. Tamper fails closed (SP-I09). */
export const AttributionScopeSchema = z
  .object({
    kind: z.enum(['listing', 'store', 'campaign']),
    refId: IdSchema,
  })
  .strict();
export type AttributionScope = z.infer<typeof AttributionScopeSchema>;

export const AttributionTokenSchema = z
  .object({
    id: IdSchema,
    resellerId: IdSchema,
    scope: AttributionScopeSchema,
    issued: IsoTimestampSchema,
    expiry: IsoTimestampSchema,
    signature: z.string().min(1),
    version: z.string().min(1),
  })
  .strict();
export type AttributionToken = z.infer<typeof AttributionTokenSchema>;

/** §5.6 Order — resellerId LOCKED (immutable after confirmation, SP-I01). */
export const OrderSchema = z
  .object({
    id: IdSchema,
    quoteId: IdSchema,
    productVersionId: IdSchema,
    supplierId: IdSchema,
    resellerId: IdSchema,
    buyerPhoneRef: IdSchema,
    dropoff: LocationSchema,
    reservationRef: IdSchema,
    escrowRef: IdSchema,
    paymentMode: PaymentModeSchema,
    status: OrderStatusSchema,
    timestamps: z.record(z.string(), IsoTimestampSchema),
  })
  .strict();
export type Order = z.infer<typeof OrderSchema>;

/** §5.6 DeliveryFeeQuote — OWNER: Logistics (Séra) → Checkout. */
export const DeliveryFeeQuoteSchema = z
  .object({
    zoneFrom: z.string().min(1),
    zoneTo: z.string().min(1),
    fee: FcfaSchema,
    serviceable: z.boolean(),
    version: z.string().min(1),
  })
  .strict();
export type DeliveryFeeQuote = z.infer<typeof DeliveryFeeQuoteSchema>;
