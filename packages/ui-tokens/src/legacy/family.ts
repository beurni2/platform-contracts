/**
 * GRAND TEINT — the design system as data (canon v0.8.0, WO-5.0).
 *
 * The founder's signed design bundle (design_handoff_grand_teint, direction
 * 1b, locked 2026-07) is the SOURCE OF TRUTH. Every value here is transcribed
 * BYTE-FOR-VALUE from `docs/design/tokens.json` — every prior provisional
 * default is now a real designer value. A CI fidelity gate
 * (scripts/check-token-fidelity.mjs) cross-checks this file against that JSON;
 * a value edit here that diverges from the designer's JSON fails the build.
 * The DESIGN-LANGUAGE doctrine remains the law; Grand Teint is its expression
 * (docs/GRAND-TEINT.md).
 *
 * Tokens are DATA — apps interpret them; nothing here is a component, nothing
 * renders, nothing computes a colour at runtime (RN-safe root, no JSX).
 */

/** tokens.json $meta — provenance, verbatim. */
export const grandTeintMeta = {
  name: 'Grand Teint',
  version: '1.0.0',
  replaces: 'platform-contracts/packages/ui-tokens v0.7.0',
  themes: ['boutik', 'shop', 'sera'],
  law: 'Zero hardcode. Every colour, dimension, duration and radius in any surface must resolve to a token in this file.',
  provenance:
    'Values proven on screen in: PWA Acheteuse - Prototype.dc.html, Celebrations.dc.html (direction 1b, founder-approved 2026-07-12)',
} as const;

// ── colour ────────────────────────────────────────────────────────────────
/** colour.shared — one ink, one paper; hairlines and scrim are rgba translucency (RN-legal literals). */
export const sharedColour = {
  ink: '#1B140D',
  paper: '#FFFDF7',
  onInk: '#FFF8F1',
  body: '#4A3F33',
  muted: '#6E6154',
  soft: '#8D7C64',
  sand: '#F3EBDB',
  surfaceMuted: '#FBF7EC',
  hairline: 'rgba(27,20,13,0.14)',
  hairlineMid: 'rgba(27,20,13,0.22)',
  hairlineStrong: 'rgba(27,20,13,0.35)',
  success: '#1F4D36',
  successTint: '#F2F7F1',
  warning: '#6B4E0C',
  warningTint: '#F7EED7',
  warningStripe: '#F1DFAE',
  danger: '#B3382C',
  dangerDeep: '#7A2418',
  dangerTint: '#F9E9E6',
  scrim: 'rgba(27,20,13,0.45)',
  desk: '#EBE6DC',
} as const;

/** colour.shop — warm commerce energy (#C2571B canon). */
export const shopColour = {
  primary: '#C2571B',
  primaryStrong: '#A34312',
  primarySoft: '#F4CFB4',
  onPrimary: '#FFF8F1',
  themeStrip: '#C2571B',
} as const;

/** colour.boutik — grounded supply-green confidence. */
export const boutikColour = {
  primary: '#1F4D36',
  primaryStrong: '#163A28',
  primarySoft: '#CFE0D4',
  onPrimary: '#F2F7F1',
  themeStrip: '#1F4D36',
  artisanAccent: '#D9A441',
} as const;

/** colour.sera — road-and-custody clarity; ink primary, amber accent. */
export const seraColour = {
  primary: '#1B140D',
  primaryStrong: '#000000',
  onPrimary: '#FFF8F1',
  accent: '#D9A441',
  accentStrong: '#B98A1F',
  accentTint: '#FBF4E4',
  themeStrip: '#D9A441',
} as const;

// ── type ──────────────────────────────────────────────────────────────────
/** type — Archivo variable; `lh` is a unitless line-height multiplier,
 * `ls` letterspacing (px), `wght`/`wdth` variable-font axes, `caps` uppercase. */
export const type = {
  family: 'Archivo',
  familyFallback: 'system-ui, sans-serif',
  variableAxes: { wght: [400, 900], wdth: [75, 125] },
  webFontDisplay: 'optional',
  scale: {
    labelXS: { size: 10, lh: 1.2, wght: 800, ls: 2.2, caps: true },
    label: { size: 11, lh: 1.2, wght: 800, ls: 2.0, caps: true },
    labelLG: { size: 12.5, lh: 1.2, wght: 800, ls: 2.4, caps: true },
    caption: { size: 12.5, lh: 1.45, wght: 500 },
    body: { size: 16, lh: 1.5, wght: 500 },
    bodyStrong: { size: 16, lh: 1.5, wght: 700 },
    row: { size: 14, lh: 1.4, wght: 600 },
    title: { size: 19, lh: 1.15, wght: 800 },
    titleLG: { size: 24, lh: 1.08, wght: 900, wdth: 110 },
    display: { size: 28, lh: 1.08, wght: 900, wdth: 110 },
  },
  note: 'Web prototype rendered some body copy at 15 px inside a 360 px artboard; production RN builds use body=16 dp per canon. Titles may set wdth up to 112. tnum is mandatory in every franc context (see money.tabular).',
} as const;

// ── spacing · radius · touch ────────────────────────────────────────────────
export const spacing = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 34 } as const;

export const radius = { box: 0, card: 0, button: 6, chip: 4, badge: 0, sheet: 0, pill: 999 } as const;

export const touch = { minTargetPx: 48, minGapPx: 8 } as const;

// ── motion ──────────────────────────────────────────────────────────────────
/** motion — durations in ms; easings are CSS cubic-bezier strings (web-proven,
 * interpreted by each surface). layoutAnimation forbidden; only transform+opacity. */
export const motion = {
  instantMs: 90,
  quickMs: 150,
  standardMs: 240,
  celebrateMaxMs: 800,
  countUpMs: 560,
  springSoft: 'cubic-bezier(0.2, 0.8, 0.25, 1)',
  springPop: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
  flyOut: 'cubic-bezier(0.16, 0.8, 0.3, 1)',
  animatableProperties: ['transform', 'opacity'],
  layoutAnimation: 'forbidden',
  reducedMotion: 'every animation has a static equivalent that loses no information',
} as const;

// ── celebration ──────────────────────────────────────────────────────────────
/** celebration — three named moments only, each app-tagged, ≤ 800 ms, dismissible, non-blocking. */
export const celebration = {
  haloMs: 700,
  ringMs: 620,
  // WO-5.6 design-dimension tokens — pixel geometry of the two celebration
  // rings, DERIVED from docs/design/motion.md (the celebration storyboard), NOT
  // from tokens.json. Anchored token-by-token by check-design-dimensions.mjs.
  haloPx: 220,
  ringPx: 132,
  motifMs: 640,
  motifStaggerMs: 14,
  badgeMs: 260,
  badgeDelayMs: 50,
  particleCount: 10,
  dismissible: true,
  blocking: false,
  produitPret: {
    app: 'boutik',
    motif: 'losange tissé (weave diamond)',
    halo: 'rgba(31,77,54,0.20)',
    ring: '#1F4D36',
    motifColours: ['#1F4D36', '#D9A441'],
    badgeBg: '#1F4D36',
    badgeFg: '#F2F7F1',
    label: 'PRODUIT PRÊT',
  },
  premiereVente: {
    app: 'shop',
    motif: 'losange tissé (weave diamond)',
    halo: 'rgba(194,87,27,0.18)',
    ring: '#C2571B',
    motifColours: ['#C2571B', '#D9A441'],
    badgeBg: '#C2571B',
    badgeFg: '#FFF8F1',
    label: 'PREMIÈRE VENTE',
    countUpMs: 560,
  },
  courseValidee: {
    app: 'sera',
    motif: 'chevron de route',
    halo: 'rgba(217,164,65,0.26)',
    ring: '#B98A1F',
    motifColours: ['#1B140D', '#B98A1F'],
    badgeBg: '#1B140D',
    badgeFg: '#D9A441',
    label: 'COURSE VALIDÉE',
  },
} as const;

// ── money ─────────────────────────────────────────────────────────────────
/** money — l'argent en majesté; tabular always, narrow-space group separator
 * (U+202F), narrow-space + F suffix; abbreviation and truncation forbidden. */
export const money = {
  amountScale: {
    hero: { size: 52, lh: 1.0, wght: 900 },
    page: { size: 40, lh: 1.05, wght: 900 },
    section: { size: 18, lh: 1.2, wght: 900 },
    row: { size: 14, lh: 1.4, wght: 700 },
  },
  tabular: true,
  groupSeparator: ' ',
  currencySuffix: ' F',
  abbreviation: 'forbidden',
  truncation: 'forbidden',
  countUpMs: 560,
  reconcileLine: { size: 11, wght: 600, ls: 0.4, align: 'right' },
  receiptEmphasis: { totalBorderPx: 1.5, totalSize: 18, totalWght: 900 },
} as const;

// ── landmark ─────────────────────────────────────────────────────────────────
/** landmark — le repère, pas l'adresse; illustration palette is illustration-only
 * (bleuPortail depicts real blue gates, never enters chrome). */
export const landmark = {
  repere: { size: 20, lh: 1.25, wght: 800 },
  indications: { size: 16, lh: 1.5, wght: 500 },
  zone: { size: 10.5, lh: 1.2, wght: 800, ls: 1.8, caps: true },
  cardBorderPx: 2,
  illustration: {
    paper: '#FFFDF7',
    sand: '#F3EBDB',
    ink: '#1B140D',
    terracotta: '#C2571B',
    amber: '#D9A441',
    green: '#1F4D36',
    bleuPortail: '#33608C',
    $note: 'illustration-only palette — bleuPortail depicts real blue gates and never enters chrome (proposals.md §9)',
  },
  iconNames: [
    'cadenas', 'moto', 'repere', 'zone', 'voix', 'enregistrer', 'ecouter', 'camera',
    'reprendre', 'coche', 'refus', 'scelle', 'colis', 'horloge', 'argent', 'gains',
    'partager', 'recherche', 'filtre', 'alerte', 'sos', 'horsligne', 'oeil', 'cle',
    'chevron', 'telephone',
    // WO-5.4 (v0.9.1): the three nav glyphs that closed the WO-6.0 tab-bar gap —
    // the 26-icon set drew for screens, not for a bottom nav (Accueil · Produits · Vitrine).
    'accueil', 'produits', 'vitrine',
  ],
} as const;

// ── interaction ──────────────────────────────────────────────────────────────
/** interaction — press/skeleton feedback + structural selection (accent edge,
 * corner ticks, focus ring); androidElevation is a small named scale, never elevation theatre. */
export const interaction = {
  pressScale: 0.98,
  pressedOpacity: 0.92,
  disabledOpacity: 0.4,
  skeletonPulseFloor: 0.4,
  androidElevation: { surface: 0, overlay: 4, sheet: 8 },
  hairline: { thin: 1, medium: 1.5, strong: 2 },
  selectedBorderPx: 2,
  accentEdgePx: 5,
  cornerTick: { sizePx: 14, strokePx: 2, insetPx: 12 },
  selectedMark: { sizePx: 26 },
  focusRing: { widthPx: 2, offsetPx: 2 },
} as const;

// ── band · ribbon · skeleton · statusbar (v0.8.0 — the four new groups) ──────
/** band — the 4 px theme strip + the signature price band. */
export const band = {
  themeStripPx: 4,
  priceBand: {
    padY: 13,
    padX: 16,
    labelToken: 'type.labelXS',
    amountToken: 'money.amountScale.page',
    // WO-5.6 — width of the PriceBand right-column honesty note, DERIVED from
    // docs/design/components.md (PriceBand ⭐, "w 118"). Anchored by the gate.
    noteWidth: 118,
  },
} as const;

/** ribbon — the sandbox « APERÇU — BAC À SABLE » preview stripe. */
export const ribbon = {
  sandbox: {
    heightPx: 24,
    stripeA: '#F7EED7',
    stripeB: '#F1DFAE',
    stripePx: 10,
    text: '#6B4E0C',
    label: 'APERÇU — BAC À SABLE',
  },
} as const;

/** skeleton — exact-dimension placeholders; layout shift forbidden. */
export const skeleton = {
  bg: '#F3EBDB',
  pulseFloor: 0.4,
  pulseMs: 1100,
  rule: 'identical dimensions to the content it replaces; layout shift forbidden',
} as const;

/** statusbar — the app status bar clock + icon ink. */
export const statusbar = {
  clock: { size: 13, wght: 600 },
  iconInk: 'colour.shared.ink',
} as const;

// ── dimension (v0.9.2 — WO-5.6 design-dimension tokens) ──────────────────────
/**
 * dimension — component pixel dimensions that canon's DESIGN DOCS state as
 * values but tokens.json never carried, surfaced by WO-6.0's zero-hardcode
 * finding (a kit that held them as literals). Each is DERIVED AND QUOTED from
 * its `docs/design/components.md` line in `docs/derivations/DESIGN-DIMENSIONS.md`
 * and byte-anchored by `scripts/check-design-dimensions.mjs`. These live OUTSIDE
 * tokens.json (whose values stay immutable); the fidelity gate is amended to
 * permit tokens.json ⊆ built, and this new gate owns every added value.
 *
 * NOT here — the STOP: the kit's third icon-size prop (12 px) has NO canon line
 * stating a 12 px icon (12 appears only as the spacing step 4/8/12/16/24/34 and
 * as row padding "11–12", neither an icon size). Per derive-never-invent it is
 * flagged for the founder → designer in DESIGN-DIMENSIONS.md, not tokenised.
 */
export const dimension = {
  controlHeightPx: {
    primaryButton: 56, // components.md — PrimaryButton "Size: h 56"
    searchField: 50, // components.md — SearchField "Hairline 1.5 box h 50"
    listRow: 44, // components.md — ListRow "fixed h 44 (list virtualization law)"
    offlineBanner: 30, // components.md — OfflineBanner "Ink band h 30"
  },
  iconSizePx: {
    listRow: 17, // components.md — ListRow "icon 17"
    tab: 20, // components.md — TabBar "icon 20 + word `labelXS`" (WO-5.7 Part D)
    emptyState: 28, // components.md — EmptyState "Icon 28"
    // WO-5.7 Part C — the trust-strip badge glyph (« PAIEMENT PROTÉGÉ »). NOT a
    // fourth structural icon size: it FILLS the labelXS line box, so its px =
    // type.scale.labelXS.size × lh = 10 × 1.2 = 12. Computed-anchored by the gate
    // to canon's own type scale. Three laws (DESIGN-DIMENSIONS.md): icon+word
    // never alone · not a hit target · do not upscale (fix the label, not this).
    badge: 12,
  },
  // WO-5.11 — QR-vitrine PRIMITIVES. Unlike the doc-derived controlHeight/iconSize
  // above, these are DESIGNER-BUNDLE values: they live in docs/design/tokens.json
  // (fidelity-owned), sourced from the QRVitrine spec sheet (WO-7.2 handoff), with
  // each derivation quoted in docs/derivations/QR-DIMENSIONS.md. Only the four
  // primitives are tokens; the on-screen side is NOT frozen — the encoder is ruled
  // versions 1–5, so the real URL may force V4+, and a frozen side would put a
  // larger QR under its own floor. The component derives the side at render from
  // these primitives: minSidePx = (modules(version) + 2·quietZoneModules)·moduleMinPx
  // (see QR-DIMENSIONS.md), asserting the print floor as it goes.
  qr: {
    quietZoneModules: 4, // ISO 18004 quiet zone (4 modules of pure paper)
    moduleMinPx: 4, // = spacing.xs (no sub-pixel)
    printModuleMinMm: 1.0, // print floor: 1.0 mm/module
    printSideMm: 48, // 37 × 1.3 mm ≈ 48 mm — scannable across a shop wall
  },
} as const;

// ── theme composition (per-theme resolution: shared + one app palette) ───────
export type ThemeName = 'boutik-plus' | 'shop-plus' | 'sera';

export interface Theme {
  name: ThemeName;
  /** Merged palette: the shared ink/paper/hairlines + this app's accent palette. */
  colours: typeof sharedColour & Record<string, string>;
}
