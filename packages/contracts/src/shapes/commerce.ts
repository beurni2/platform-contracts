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

/**
 * §5.6 Storefront. OWNER: Shop+ (§5.2 "owns Storefront & Attribution").
 * WO-5.13 (SP0.2 — "reseller activation (store name/zone/category focus)",
 * Shop-Plus-Building-Plan:34): the Seller #001 aggregate fields are added
 * ADDITIVELY — every field above `name` is byte-unchanged. `zone` and `category`
 * are free DISPLAY STRINGS (« Rood Woko, Ouagadougou » precedent, copy.md:157); a
 * zone enum / gazetteer and the category-floor taxonomy are FOUNDER DECISIONS and
 * do NOT enter this shape. See docs/derivations/STOREFRONT-FIELDS.md.
 */
export const StorefrontSchema = z
  .object({
    id: IdSchema,
    resellerId: IdSchema,
    slug: z.string().min(1),
    discoverable: z.boolean(),
    curatedItems: z.array(IdSchema),
    // WO-5.13 — additive: the Seller #001 aggregate fields (SP0.2).
    name: z.string().min(1).max(120), // .max(120) is a boundary guard, not a canon value (founder-overridable)
    zone: z.string().min(1), // display string — no zone enum (founder decision)
    category: z.string().min(1), // display string — no category floor (open founder decision)
    createdAt: IsoTimestampSchema,
    updatedAt: IsoTimestampSchema,
  })
  .strict();
export type Storefront = z.infer<typeof StorefrontSchema>;

/**
 * §5.6 AttributionToken — signed; the token's target scope is listing/store/
 * campaign. Tamper fails closed (SP-I09). BYTE-IDENTICAL to v0.8.0: the object
 * shape is unchanged — only the standalone `AttributionScope` export was
 * retired at v0.9.0 (WO-5.2), the target inlined here so the canonical name
 * `AttributionScope` can carry the A6 portée (product|identity, in
 * shapes/attribution.ts). E1/E2 pins parse the same bytes.
 */
export const AttributionTokenSchema = z
  .object({
    id: IdSchema,
    resellerId: IdSchema,
    scope: z
      .object({
        kind: z.enum(['listing', 'store', 'campaign']),
        refId: IdSchema,
      })
      .strict(),
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

/**
 * Supply-to-reseller projection — the §2.2 canonical single definition
 * (promoted from @platform/certification at v0.4.0; owner: Boutik+ → Shop+).
 * B4.2/SP-I03: the projection NEVER carries supplier identity, contact, or
 * precise pickup — the strict schema refuses any undeclared key.
 */
export const SupplyProjectionSchema = z
  .object({
    productVersionId: IdSchema,
    offerVersion: z.string().min(1),
    basePrice: FcfaSchema,
    resellerCommission: FcfaSchema,
    available: z.number().int().min(0),
  })
  .strict();
export type SupplyProjection = z.infer<typeof SupplyProjectionSchema>;

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
