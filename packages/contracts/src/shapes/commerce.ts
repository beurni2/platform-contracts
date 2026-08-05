import { z } from 'zod';
import {
  LocationSchema,
  MediaRefSchema,
  UserIdSchema,
  VerifiedPhoneAliasSchema,
} from '@platform/kernel-types';
import { OrderStatusSchema, PaymentModeSchema, SellerTrustTierSchema, SupplyModeSchema } from '../enums.js';
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

/**
 * VIDEO-PRODUIT (canon v3.4.0, founder order 2026-08-02: « a short video of
 * like 6 second max that will show on shop+ … the short video to be the hero
 * card »). The founder's own bound, canon-enforced so no surface can stretch
 * it — like the audio note's `durationSec`, this is RECORDED media (Law 5),
 * stored and played, never processed or generated.
 */
export const PRODUCT_VIDEO_MAX_SEC = 6;

/** One SHORT product video. `durationSec` is the DEVICE'S measured duration,
 *  a whole-second ceiling (5.3 s records as 6): the bound refuses at parse
 *  time everywhere the shape travels, not in one screen's goodwill. */
export const ProductVideoRefSchema = MediaRefSchema.extend({
  durationSec: z.number().int().positive().max(PRODUCT_VIDEO_MAX_SEC),
}).strict();
export type ProductVideoRef = z.infer<typeof ProductVideoRefSchema>;

/** §5.6 ProductAssets — PRICE-FREE, contact-free (B+I-02); master private + immutable (B+I-08). */
export const ProductAssetsSchema = z
  .object({
    masterRef: MediaRefSchema,
    heroSquare: MediaRefSchema,
    heroVertical: MediaRefSchema,
    proof: MediaRefSchema,
    detail: z.array(MediaRefSchema),
    /** VIDEO-PRODUIT — OPTIONAL and additive: a product without one is every
     *  product before this, byte-for-byte. */
    video: ProductVideoRefSchema.optional(),
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
 * The Faso Premium storefront themes — a CLOSED set (Vitrine HANDOFF §1.2:
 * « ensemble fermé », « aucun sélecteur de couleur libre, jamais »). The theme
 * keys are canon; the colour recipes live in the design tokens, not here.
 *
 * CLOSED MEANS CURATED, NOT FROZEN — the same reading the header set has always
 * had (it grew 5 → 10 → 31 under « a CLOSED set on the theme precedent »). What
 * §1.2 forbids is a free colour picker in a seller's hands, because every preset
 * must arrive with its contrasts already proven. It has never forbidden the
 * founder from commissioning more presets.
 *
 * THEMES-8 (founder order, 2026-08-05: « add 4 more nice and beautiful habillage
 * colors and make sure there is a light pink in it »). The four appended carry
 * the same two proofs as the original four, computed rather than eyeballed:
 * θ.on on θ.accent ≥ 4.5:1 and θ.deep on white ≥ 7:1.
 */
export const STOREFRONT_THEMES = [
  'laterite',
  'danfani',
  'indigo',
  'foret',
  // THEMES-8 — frangipanier is the founder's light pink; the other three fill
  // the gaps the first four left (rose, teal, violet, bronze).
  //
  // NAMES CHOSEN AGAINST THE HEADER VOCABULARY, not just against each other:
  // `hibiscus` and `karite` were the first picks and both are already HEADER
  // style keys, which would have put two identically-labelled cards on the one
  // screen that shows both grids. Distinct names cost nothing here and are
  // unfixable once a seller's shop is stored under one.
  'frangipanier',
  'lagune',
  'aubergine',
  'sahel',
] as const;
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
  // ENTETES-M — série 10 « féminines » (2) and série 11 « jardins » (4),
  // founder-authorized 2026-07-31. APPENDED, like every growth before it.
  //
  // THE KEY IS THE BRIEF'S OWN `id=` ANCHOR, not the title a seller reads —
  // the rule recorded at ENTETES-H and the reason « Bougainvillier » enters as
  // `bougain`: that is what `id="bougain"` says in « En-tetes Boutique -
  // Serie 10 ». The picker shows her « Bougainvillier » from the catalog; no
  // one but this file ever sees the key.
  'dentelle',
  'bougain',
  'flamboyant',
  'hibiscus',
  'papillons',
  'guirlande',
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

/**
 * VOIX-PRODUIT (founder-authorized 2026-08-03: « build the audio line end to
 * end », answering the §7 stop this field was blocked on) — the reseller's
 * recorded note about ONE of her products. §5 of the design doctrine: « voice
 * and audio are first-class UI … because many users sell and buy by voice ».
 *
 * TWO STATES ON THE WIRE, AND ONLY TWO. `recording` and `recorded` are phone-side
 * UI states that never leave the device; the record that reaches a buyer is
 * either `pending` (bytes accepted, not yet pointed at — loi 7: queued is
 * pending, never done) or `ready` (a real, playable url). The BUYER renders a
 * note ONLY when it is `ready`, which is why `url` may be absent while pending
 * and why an absent url can never be mistaken for a playable one.
 *
 * `durationMs` IS BOUNDED BY THE SERVICE, NOT HERE (AUDIO_MAX_DURATION_MS =
 * 60 000). The schema keeps it a non-negative integer: a canon ceiling would be
 * a second bound to keep in step with the media service's, and the service is
 * the one that sees the bytes. Deliberate, and the same division the video
 * ref's byte cap already uses.
 *
 * DETERMINISTIC (loi 5): recorded audio, never synthesis.
 */
export const StorefrontVoiceNoteSchema = z
  .object({
    status: z.enum(['pending', 'ready']),
    url: z.string().min(1).optional(),
    durationMs: z.number().int().min(0),
  })
  .strict();
export type StorefrontVoiceNote = z.infer<typeof StorefrontVoiceNoteSchema>;

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
    // VOIX-PRODUIT — additive, defaulted (founder-authorized 2026-08-03): pid →
    // her recorded note about that product. Every pre-existing storefront parses
    // unchanged as `{}`, which is exactly « aucune note » — the state the buyer
    // already renders honestly today.
    //
    // A RECORD KEYED BY PID, not an array with a pid field: a product has at
    // most ONE current note, and a map makes a second one unrepresentable
    // rather than merely discouraged. The key is an `IdSchema` pid; nothing
    // here asserts the pid is IN `curatedItems`, because a note may outlive an
    // unpin and re-pinning must not lose her recording.
    productNotes: z.record(IdSchema, StorefrontVoiceNoteSchema).default({}),
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
 *
 * ═══ `category` — CATEGORY-WIRE-1 (v3.0.0), AND WHY IT IS REQUIRED ═══
 *
 * `ProductVersionSchema.category` has been canon since the beginning; this
 * projection dropped it, so Shop+ has never seen a product's category. That
 * absence had two consequences, and the field is here to close both:
 *   · §6.2's at-door inspection matrix has no row to pick, so every buyer sees
 *     the conservative fallback whatever she actually bought;
 *   · §6.1's « category inspectable » condition had nowhere to read a category
 *     FROM, so the checkout wire accepted one from the caller — the party the
 *     condition exists to constrain.
 *
 * REQUIRED, matching `productName`/`assetRefs`, and for the same reason those
 * are: a projection that can omit it degrades SILENTLY. An absent category
 * refuses Option B and shows the cautious inspection row — both correct, both
 * invisible — so a producer that simply forgot would look exactly like a
 * product that is genuinely uninspectable. Required makes a stale producer fail
 * LOUDLY at the schema instead of quietly at the buyer's door.
 *
 * ═══ `sellerTier` — SELLER-TIER-WIRE-1 (v3.1.0), AND WHY IT IS OPTIONAL ═══
 *
 * §6.1's FIRST condition is « seller tier ≥ verified ». Shop+ cannot evaluate
 * it: canon keys `SellerTrustState` by `sellerId`, and B4.2 keeps supplier
 * identity off this projection by design, so Shop+ has no key to look a tier up
 * with. The consequence was live — the checkout wire accepted the tier from the
 * BUYER'S REQUEST, and pay-at-door worked in production only because the client
 * asserted `verified`. The condition was not merely unenforced; the claim was
 * load-bearing.
 *
 * The tier is a PROPERTY of the offer, not an identity: one of three values
 * shared by every supplier in that band, naming no one. Supplier economics
 * (`basePrice`, `resellerCommission`) already travel here and are stripped
 * before the buyer, so this is the weaker disclosure, not a new class.
 *
 * OPTIONAL, unlike `category`, and the difference is what absence COSTS. An
 * absent category degrades two things, one of them buyer-visible — she sees a
 * plausible screen with no sign anything is wrong. An absent tier degrades
 * exactly one: Option B is not offered, which is precisely what §6.1 already
 * prescribes for any condition it cannot prove. So optional is strictly better
 * than the status quo in EVERY state — a producer that sends it gives the gate
 * server truth; one that does not gets refused, which beats trusting the wire —
 * and it costs no coordinated deploy where a wrong order empties every shop.
 *
 * IT DECIDES NOTHING ABOUT PROGRESSION. How a supplier BECOMES `verified` is
 * ⏳ « Verification tiers evidence + progression thresholds » and stays open.
 * This field only carries whatever tier the producer can honestly state.
 *
 * NO TAXONOMY IS DECIDED HERE. The type is the same free `TrimmedNonEmptyString`
 * canon already uses for every category (`ProductVersionSchema.category`,
 * `StorefrontSchema.category`), on the rule written at `StorefrontSchema`: « the
 * category-floor taxonomy [is a] FOUNDER DECISION and [does] NOT enter this
 * shape ». Consumers allowlist what they recognise and fail closed on the rest;
 * carrying a value changes no taxonomy and closes no ⏳ Decision.
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
    category: TrimmedNonEmptyString, // display string, matches ProductVersionSchema.category — zero transformation (CATEGORY-WIRE-1)
    sellerTier: SellerTrustTierSchema.optional(), // §6.1 « seller tier ≥ verified », from the producer (SELLER-TIER-WIRE-1)
    /** VIDEO-PRODUIT (v3.4.0) — the short video's bare display ref, OPTIONAL
     *  (most products have none). Same class as `assetRefs`, same first-class
     *  AssetRef rule: it MUST NEVER encode supplier identity, enforced at the
     *  producer's out-guard exactly as documented on `AssetRefSchema`. The
     *  ≤ 6 s bound lives on `ProductVideoRefSchema` at the producer; a bare
     *  display ref carries no duration to re-check. */
    videoRef: AssetRefSchema.optional(),
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

/**
 * ═══════════════════════════════════════════════════════════════════════════
 * RESELLER-ACCOUNTS-1 (canon v3.8.0) — the reseller ACCOUNT's access state.
 * Founder-approved shape, 2026-08-04 (« go on that shape »).
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * SP0.2's account, admission-side. A reseller signs up herself (founder
 * override, 2026-08-04: credentials are name + email + password + phone —
 * departing from the plan's phone-alias, logged in both JOURNALs); the account
 * exists at once but the APP stays closed until she enters the one-time access
 * code the founder minted for her on his console.
 *
 * THE THREE STATES, and why there is no fourth:
 *   pending_access — signed up, not yet admitted. Every read refuses by name.
 *   active         — admitted. The app is fully open; nothing inside asks again.
 *   paused         — the founder cut her off. Every read refuses by name; the
 *                    UI never merely hides a button (a pause that only greys
 *                    the client is not a pause).
 * No deleted/terminal state: cutting access is reversible by design, and an
 * account that vanished would orphan her storefront and her attributed orders.
 *
 * DELIBERATELY NOT the canon word « activation »: Build-Spec line 191 already
 * defines activation as a COMMERCIAL milestone (payout-ready + agreement +
 * listing + shared link) with its own event `reseller.activated.v1`. Admission
 * and activation are different facts and never share a name.
 *
 * WHAT THIS SHAPE DOES NOT CARRY: credentials. The password hash, its salt and
 * session material are Worker-internal storage, never a cross-app contract —
 * a canon shape with a password field is how a hash ends up on a wire.
 */
export const ResellerAccessStateSchema = z.enum(['pending_access', 'active', 'paused']);
export type ResellerAccessState = z.infer<typeof ResellerAccessStateSchema>;

/** Who moved the state. `signup` mints pending_access; `admission` is her own
 *  one-time code consuming itself; `founder` is the console's pause/resume. */
export const ResellerAccessActorSchema = z.enum(['signup', 'admission', 'founder']);
export type ResellerAccessActor = z.infer<typeof ResellerAccessActorSchema>;

/** One access transition — the payload of `reseller.access_changed.v1` and the
 *  audit row the account book keeps for every move it ever makes. */
export const ResellerAccessChangeSchema = z
  .object({
    accountId: IdSchema,
    state: ResellerAccessStateSchema,
    at: IsoTimestampSchema,
    by: ResellerAccessActorSchema,
  })
  .strict();
export type ResellerAccessChange = z.infer<typeof ResellerAccessChangeSchema>;
