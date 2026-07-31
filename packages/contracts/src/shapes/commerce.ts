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
 * The thirty-one selectable boutique headers — a CLOSED set on the theme
 * precedent: no free styling, ever. Keys are canon; the visual recipes live in
 * the buyer render, never here.
 *
 *  · `classique`            the shipped default every pre-existing storefront keeps
 *  · série 1 (5)            ENTETES-B, founder-authorized 2026-07-28
 *  · « série 6 » (5)        ENTETES-E0, founder-authorized 2026-07-30. These
 *                           keys now DRAW the série 4 contract units
 *                           (Prestige · Terracotta · Étendard · Douceur ·
 *                           Tissage, ENTETES-F): the drawing was superseded,
 *                           the KEYS were deliberately not renamed so no live
 *                           storefront could hold a value the service refuses.
 *                           Renaming them is owed follow-up, not a rename here.
 *  · séries 2 · 3 · 5 (20)  ENTETES-H, founder-authorized 2026-07-31
 *                           (« Design_brief_for_Claude_4.zip »), appended
 *                           additively in the brief's own anchor order.
 *
 * ADDITIVE ONLY, AND THE ORDER OF ROLLOUT IS NOT OPTIONAL. Every key here must
 * be accepted by the DEPLOYED storefront service before any picker offers it.
 * Reversed, the picker hands the service a value it refuses — the exact
 * `unknown_header_style` failure the founder hit on his own phone. Canon
 * first, deploy second, picker last.
 */
export const STOREFRONT_HEADER_STYLES = [
  'classique',
  'royale',
  'heritage',
  'chaleureux',
  'cristal',
  'dynamique',
  // ENTETES-E0 (founder-authorized 2026-07-30) — the five styles of the
  // founder's Beurni Boss handoff (« En-têtes Boutique — Série 6 · Burkina
  // Faso cinématique »), appended additively: buyer-render styles exactly
  // like the first five designer headers. ASCII keys are canon (`seance`,
  // never « séance »); the visual recipes live in the buyer render.
  'masque',
  'harmattan',
  'balafon',
  'seance',
  'cauris',
  // ENTETES-H — série 2 « ateliers » (founder-authorized 2026-07-31).
  'indigo',
  'couture',
  'safran',
  'grenat',
  'kraft',
  // ENTETES-H — série 3 « vitrines » (10).
  'audace',
  'fleurie',
  'prisme',
  'pop',
  'chrome',
  'neon',
  'perle',
  'artisan',
  'braise',
  'graffiti',
  // ENTETES-H — série 5 « artisanat burkinabè » (5). ASCII keys are canon
  // (`karite`, never « karité »), exactly as `seance` was.
  'dunda',
  'karite',
  'bronze',
  'calebasse',
  'pagne',
  // ENTETES-L — série 8 « luxe » (2) and série 9 « éditions » (4), founder-
  // authorized 2026-07-31 from « Design brief for Claude 2 / 3 ». APPENDED, as
  // every growth of this list has been: a stored value's POSITION never moves,
  // so no storefront can come back as a different header after the bump.
  // ASCII keys are canon and LOWERCASE-ONLY — the enum's own guard is
  // /^[a-z]+$/, which caught `filDor` on its way in. « Fil d'Or » is `fildor`,
  // exactly as « karité » is `karite`.
  'fildor',
  'bazin',
  'couverture',
  'billet',
  'enseigne',
  'hologramme',
] as const;
export const StorefrontHeaderStyleSchema = z.enum(STOREFRONT_HEADER_STYLES);
export type StorefrontHeaderStyle = z.infer<typeof StorefrontHeaderStyleSchema>;

/**
 * ENTETES-C (founder-authorized 2026-07-28) — HER framing of a photo: the
 * point of the image the frame keeps anchored, as CSS object-position
 * percentages (integers 0–100 of the image's own width/height). OPTIONAL as a
 * WHOLE on the photo shapes below: absent = the header style's contract
 * framing, exactly as before this field existed; present = her choice, which
 * every header obeys. A complete pair by construction — a lone axis is
 * unrepresentable, so no renderer ever guesses half a framing.
 */
export const StorefrontPhotoFocusSchema = z
  .object({
    x: z.number().int().min(0).max(100),
    y: z.number().int().min(0).max(100),
  })
  .strict();
export type StorefrontPhotoFocus = z.infer<typeof StorefrontPhotoFocusSchema>;

/**
 * Storefront cover image lifecycle (Vitrine HANDOFF §3.1 · C-K4's five states).
 * `pending` = awaiting Séra verification — the prior version stays live (§4.3).
 * No generic "failed": `error` is the upload-refusal state with a retry path.
 * ENTETES-C: `focus` is her saved framing of THIS photo — a fresh upload starts
 * unframed (the writer clears it; a stale framing must never crop a new photo).
 */
export const StorefrontCoverSchema = z
  .object({
    status: z.enum(['none', 'uploading', 'pending', 'live', 'error']),
    url: z.string().min(1).optional(),
    focus: StorefrontPhotoFocusSchema.optional(),
  })
  .strict();
export type StorefrontCover = z.infer<typeof StorefrontCoverSchema>;

/** Storefront avatar (Vitrine HANDOFF §3.1): monogram (letter 1 of name on the
 *  theme accent — nothing to upload) or a Séra-verified photo. ENTETES-C:
 *  `focus` as on the cover — her framing of the portrait in the medallion. */
export const StorefrontAvatarSchema = z
  .object({
    mode: z.enum(['monogram', 'photo']),
    url: z.string().min(1).optional(),
    focus: StorefrontPhotoFocusSchema.optional(),
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
    // ENTETES-B — additive, defaulted (founder-authorized 2026-07-28): the
    // reseller's chosen header style; every pre-existing storefront parses
    // unchanged as 'classique'.
    headerStyle: StorefrontHeaderStyleSchema.default('classique'),
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
 * §5.6 AssetRef — a display reference to a product image, carried on the supply
 * wire (SupplyProjection.assetRefs) so Shop+'s buyer surface renders images with
 * no second display read-model. A BARE string (matches the Shop+ buyer view's
 * `assetRefs: readonly string[]` — zero transformation), deliberately NOT the rich
 * integrity-bearing `MediaRefSchema` used internally by `ProductAssets`.
 *
 * FIRST-CLASS RULE (B4.2 / SP-I03), not a comment: an asset reference MUST NEVER
 * encode supplier identity — opaque, or `productVersionId`-keyed, only. The
 * producer (Boutik+ offer-service) holds `ProductVersion.supplierId` and derives
 * these refs from `ProductAssets` `MediaRef.ref` storage keys, whose natural key
 * shape is supplier-scoped — so it could leak a supplier id into a URL VALUE
 * without meaning to.
 *
 * WHERE THE RULE IS ENFORCED: at the producer's out-guard, NOT here. Canon cannot
 * value-enforce this: `SupplyProjection` deliberately never carries `supplierId`,
 * and `supplierId` is an unformatted `IdSchema` (no canon supplier-id pattern to
 * match) — so a value refine here would have to INVENT a pattern. The producer
 * holds `supplierId` and must reject any assetRef that contains it (the key-based
 * `sweepIdentityKeys` cannot see identity embedded in a value). This type is the
 * canonical home of the rule; the check lives where the identity is known.
 */
export const AssetRefSchema = z.string().min(1);
export type AssetRef = z.infer<typeof AssetRefSchema>;

/**
 * Supply-to-reseller projection — the §2.2 canonical single definition
 * (promoted from @platform/certification at v0.4.0; owner: Boutik+ → Shop+).
 * B4.2/SP-I03: the projection NEVER carries supplier identity, contact, or
 * precise pickup — the strict schema refuses any undeclared key. It DOES carry
 * buyer-facing DISPLAY data (SUPPLY-DISPLAY-FIELDS-1): `productName` and
 * `assetRefs`, both REQUIRED — economics never arrive without the name and images
 * they belong to (the partial-state the second-read-model option would have
 * risked). Display data is not identity: the ban is on supplier identity/contact/
 * pickup, never on the product's own name and pictures.
 */
export const SupplyProjectionSchema = z
  .object({
    productVersionId: IdSchema,
    offerVersion: z.string().min(1),
    basePrice: FcfaSchema,
    resellerCommission: FcfaSchema,
    available: z.number().int().min(0),
    productName: TrimmedNonEmptyString, // name-class, matches ProductVersionSchema.name (WO-5.14)
    assetRefs: z.array(AssetRefSchema), // bare refs, matches CustomerProductView.assetRefs — zero transformation
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
