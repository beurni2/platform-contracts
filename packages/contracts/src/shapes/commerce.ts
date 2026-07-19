import { z } from 'zod';
import {
  LocationSchema,
  MediaRefSchema,
  UserIdSchema,
  VerifiedPhoneAliasSchema,
} from '@platform/kernel-types';
import { OrderStatusSchema, PaymentModeSchema, SupplyModeSchema } from '../enums.js';
import { FcfaSchema, IdSchema, IsoTimestampSchema, TrimmedNonEmptyString } from './common.js';

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
    name: TrimmedNonEmptyString, // WO-5.14 name-class (trimmed non-empty)
    productCode: z.string().min(1),
    facts: z.record(z.string(), z.unknown()),
    category: TrimmedNonEmptyString, // WO-5.14 display string (trimmed non-empty)
    zone: TrimmedNonEmptyString, // WO-5.14 display string (trimmed non-empty)
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
    zones: z.array(TrimmedNonEmptyString), // WO-5.14 display strings (trimmed non-empty)
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
 * The four Faso Premium storefront themes — a CLOSED set (Vitrine HANDOFF §1.2:
 * « ensemble fermé », « aucun sélecteur de couleur libre, jamais »). The theme
 * keys are canon; the colour recipes live in the design tokens, not here.
 */
export const STOREFRONT_THEMES = ['laterite', 'danfani', 'indigo', 'foret'] as const;
export const StorefrontThemeSchema = z.enum(STOREFRONT_THEMES);
export type StorefrontTheme = z.infer<typeof StorefrontThemeSchema>;

/**
 * Storefront cover image lifecycle (Vitrine HANDOFF §3.1 · C-K4's five states).
 * `pending` = awaiting Séra verification — the prior version stays live (§4.3).
 * No generic "failed": `error` is the upload-refusal state with a retry path.
 */
export const StorefrontCoverSchema = z
  .object({
    status: z.enum(['none', 'uploading', 'pending', 'live', 'error']),
    url: z.string().min(1).optional(),
  })
  .strict();
export type StorefrontCover = z.infer<typeof StorefrontCoverSchema>;

/** Storefront avatar (Vitrine HANDOFF §3.1): monogram (letter 1 of name on the
 *  theme accent — nothing to upload) or a Séra-verified photo. */
export const StorefrontAvatarSchema = z
  .object({
    mode: z.enum(['monogram', 'photo']),
    url: z.string().min(1).optional(),
  })
  .strict();
export type StorefrontAvatar = z.infer<typeof StorefrontAvatarSchema>;

/** One storefront section (Vitrine HANDOFF §3.1): name 1–20, ordered pids.
 *  An empty section is invisible buyer-side (§6) — emptiness is legal here. */
export const StorefrontSectionSchema = z
  .object({
    id: IdSchema,
    name: TrimmedNonEmptyString.max(20),
    pids: z.array(IdSchema),
  })
  .strict();
export type StorefrontSection = z.infer<typeof StorefrontSectionSchema>;

/**
 * §5.6 Storefront. OWNER: Shop+ (§5.2 "owns Storefront & Attribution").
 * WO-5.13 (SP0.2 — "reseller activation (store name/zone/category focus)",
 * Shop-Plus-Building-Plan:34): the Seller #001 aggregate fields are added
 * ADDITIVELY — every field above `name` is byte-unchanged. `zone` and `category`
 * are free DISPLAY STRINGS (« Rood Woko, Ouagadougou » precedent, copy.md:157); a
 * zone enum / gazetteer and the category-floor taxonomy are FOUNDER DECISIONS and
 * do NOT enter this shape. See docs/derivations/STOREFRONT-FIELDS.md.
 *
 * WO-VITRINE (Vitrine HANDOFF §3.1): the seven profile fields are added
 * ADDITIVELY, every one DEFAULTED so every pre-existing storefront parses
 * unchanged. Grounding + the two deliberate divergences (`name` stays .max(120)
 * while the UI enforces 3–24; `zone` stays free while the handoff names an
 * 8-quartier enum it does not enumerate) in docs/derivations/VITRINE-STOREFRONT.md.
 * `featuredItems` is the curatedItems primitive (ordered pid list) + the ≤2 cap;
 * "never a sold-out item" is a DISPLAY rule (auto-retrait à l'affichage, the pin
 * persists — §3.1) and deliberately NOT a schema constraint. `slug` stays LOCKED
 * (never regenerated, even after rename — loi gelée 3).
 */
export const StorefrontSchema = z
  .object({
    id: IdSchema,
    resellerId: IdSchema,
    slug: z.string().min(1),
    discoverable: z.boolean(),
    curatedItems: z.array(IdSchema),
    // WO-5.13 — additive: the Seller #001 aggregate fields (SP0.2).
    name: TrimmedNonEmptyString.max(120), // WO-5.14 name-class (trimmed non-empty); .max(120) boundary guard, not a canon value (founder-overridable)
    zone: TrimmedNonEmptyString, // WO-5.14 display string (trimmed non-empty) — still no zone enum (founder decision)
    category: TrimmedNonEmptyString, // WO-5.14 display string (trimmed non-empty) — still no category floor (open founder decision)
    createdAt: IsoTimestampSchema,
    updatedAt: IsoTimestampSchema,
    // WO-VITRINE — additive, all defaulted (HANDOFF §3.1 defaults verbatim).
    tagline: z.string().max(40).default(''), // « phrase d'accueil » 0–40, défaut ""
    bio: z.string().max(160).default(''), // « présentation » 0–160, défaut ""
    cover: StorefrontCoverSchema.default({ status: 'none' }), // défaut none
    avatar: StorefrontAvatarSchema.default({ mode: 'monogram' }), // défaut monogram
    theme: StorefrontThemeSchema.default('laterite'), // défaut 'laterite'
    sections: z
      .array(StorefrontSectionSchema)
      .max(4) // « ≤ 4 » sections
      .superRefine((sections, ctx) => {
        // « un pid vit dans ≤ 1 section » (§3.1) — a duplicate across sections refuses.
        const seen = new Map<string, number>();
        sections.forEach((section, i) => {
          for (const pid of section.pids) {
            if (seen.has(pid)) {
              ctx.addIssue({
                code: 'custom',
                message: `pid ${pid} appears in sections[${seen.get(pid)}] and sections[${i}] — a product lives in at most one section (HANDOFF §3.1)`,
                path: [i, 'pids'],
              });
            } else {
              seen.set(pid, i);
            }
          }
        });
      })
      .default([]), // défaut []
    featuredItems: z.array(IdSchema).max(2).default([]), // « À la une » ≤ 2 — the curatedItems primitive + the cap; défaut []
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
    zoneFrom: TrimmedNonEmptyString, // WO-5.14 display string (trimmed non-empty)
    zoneTo: TrimmedNonEmptyString, // WO-5.14 display string (trimmed non-empty)
    fee: FcfaSchema,
    serviceable: z.boolean(),
    version: z.string().min(1),
  })
  .strict();
export type DeliveryFeeQuote = z.infer<typeof DeliveryFeeQuoteSchema>;
