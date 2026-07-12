/**
 * Family DNA (CTO charter §5): warm neutral surfaces, disciplined rounded
 * geometry, generous whitespace, large confident FCFA figures, ≥44px touch
 * targets, calm motion. Shared by all three themes; themes recolor, never
 * restructure. Tokens only — no components at v0.1.0.
 */

/** Type scale — large readable type for FCFA amounts and names. Sizes in dp/px. */
export const typeScale = {
  displayFcfa: { size: 34, lineHeight: 40, weight: 700 },
  title: { size: 24, lineHeight: 30, weight: 700 },
  heading: { size: 20, lineHeight: 26, weight: 600 },
  bodyLarge: { size: 17, lineHeight: 24, weight: 400 },
  body: { size: 15, lineHeight: 22, weight: 400 },
  label: { size: 13, lineHeight: 18, weight: 600 },
  caption: { size: 12, lineHeight: 16, weight: 400 },
} as const;

/** Spacing scale (4pt base) — generous whitespace even on small screens. */
export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
  xxxl: 48,
} as const;

/** Disciplined rounded geometry. */
export const radius = {
  none: 0,
  sm: 6,
  md: 10,
  lg: 16,
  pill: 999,
} as const;

/** Elevation levels — subtle; trust is calm, not glossy. */
export const elevation = {
  flat: { shadowOpacity: 0, shadowRadius: 0, shadowOffsetY: 0 },
  raised: { shadowOpacity: 0.08, shadowRadius: 4, shadowOffsetY: 2 },
  overlay: { shadowOpacity: 0.14, shadowRadius: 12, shadowOffsetY: 6 },
} as const;

/**
 * Motion v2 — the Signature Design Doctrine's movement law
 * (docs/DESIGN-LANGUAGE.md, « La loi du mouvement »): durations 150–250 ms,
 * soft spring curves (never linear), no animation ever blocks input,
 * celebration ≤ 800 ms, count-up ≤ 600 ms, reduced-motion honored.
 * Tokens are DATA — apps interpret them; nothing here animates.
 */
export const motion = {
  instant: { durationMs: 80, easing: 'ease-out' },
  quick: { durationMs: 150, easing: 'spring-soft' },
  standard: { durationMs: 250, easing: 'spring-soft' },
  celebrate: { durationMs: 420, easing: 'spring-soft' },
  /** The ONE named soft-spring parameter set (« courbes spring douces »).
   * ⏳ CTO defaults — the doctrine names the curve family, not the physics. */
  springSoft: { damping: 20, stiffness: 250, mass: 1 },
  /** Doctrine ceilings — hard limits, testable per export. */
  celebrationMaxMs: 800,
  countUpMaxMs: 600,
  /** The flag name every app honors (« reduced-motion respecté »). */
  reducedMotionFlag: 'prefers_reduced_motion',
} as const;

/** Touch — ≥44px targets, icons always paired with text. */
export const touch = {
  minTargetPx: 44,
} as const;

/**
 * Interaction v3 — the interaction group (docketed BY NAME at WO-4.2R, canon
 * v0.7.0). Family-level constants under « la loi du mouvement »
 * (DESIGN-LANGUAGE.md): a press feedback and a skeleton-pulse floor that
 * explain without ever blocking a saisie, honoring D17. These replace the
 * per-kit token-laundering the WO-4.2R verifiers flagged (press scale 0.98,
 * pulse floor 0.4, the shadowOpacity×5 press-opacity). androidElevation is
 * NOT here — the doctrine differentiates elevation BY THEME, so it lives
 * per-theme (see makeTheme).
 * ⏳ CTO-default VALUES — the doctrine names the roles, not the physics;
 * tuned by the founder's eye at gallery reviews (the v2 pattern).
 */
export const interaction = {
  /** Press-down scale (« le mouvement explique »); the kits' laundered 0.98. */
  pressScale: 0.98,
  /** On-press opacity — replaces the laundered shadowOpacity×5 press-opacity. */
  pressedOpacity: 0.92,
  /** Disabled affordance opacity — the kits' laundered disabled multiplier. */
  disabledOpacity: 0.4,
  /** Lowest opacity of the skeleton-loading pulse (« skeleton-loading …
   * jamais un spinner nu »); the kits' laundered 0.4. */
  skeletonPulseFloor: 0.4,
} as const;

/** ⏳ CTO-default per-theme Android elevation (« Élévation visuelle par
 * thème »): structurally per-theme (each theme carries its own, ready to
 * tune), defaulted uniform until the founder's eye sets Boutik-premium-frame
 * vs Séra-calm at gallery. Differentiating the numbers now would invent a
 * differentiation the doctrine gives only as direction. */
export const ANDROID_ELEVATION_DEFAULT = 2;

/** Warm neutral surface + ink ramp shared by every theme. */
export const neutralColors = {
  surface: '#FAF7F2',
  surfaceRaised: '#FFFFFF',
  surfaceSunken: '#F1EDE6',
  ink: '#26221C',
  inkMuted: '#5C564C',
  inkFaint: '#8A8377',
  line: '#E3DDD2',
  success: '#2E7D4F',
  warning: '#B07818',
  danger: '#B3402F',
  info: '#33608C',
} as const;

/**
 * Money display v2 — « L'argent en majesté » (DESIGN-LANGUAGE.md §2):
 * FCFA amounts are first-class visual citizens — large, tabular, breathing.
 * ⏳ the hero size is a CTO default (the doctrine names the role, not the px).
 */
export const money = {
  amountScale: {
    /** The seller's « Vous recevrez X F » — the hero of its screen. */
    hero: { size: 40, lineHeight: 46, weight: 800 },
    display: typeScale.displayFcfa,
    inline: typeScale.bodyLarge,
  },
  /** Tabular numerals wherever francs appear (doctrine: « chiffres tabulaires partout »). */
  tabularNumerals: true,
  /** Count-up ceiling — a REF into the motion law, never a second clock. */
  countUpMaxMs: motion.countUpMaxMs,
  /** The receipt staged as proof (« mis en scène comme une preuve »). */
  receiptEmphasis: { totalWeight: 700, ruleColor: neutralColors.line, reconciledBadgeColorToken: 'verifiedBadge' },
} as const;

/**
 * Landmark v2 — « Le repère, pas l'adresse » (DESIGN-LANGUAGE.md §4):
 * the landmark-first location UI is a visual PRIDE — hierarchy
 * repère → indications → zone, icon-name slots for the illustrated cards.
 * ⏳ icon names are CTO default slots; the assets are app-side work.
 */
export const landmark = {
  hierarchy: {
    repere: typeScale.heading,
    indications: typeScale.body,
    zone: typeScale.label,
  },
  iconNames: {
    repere: 'repere-pin',
    quartier: 'quartier',
    marche: 'marche',
    pharmacie: 'pharmacie',
    zone: 'zone-badge',
    /** v0.7.0 (WO-4.4 docket) — names only; the illustrated assets stay
     * app-side per the family note. `cadenas` = the « Paiement protégé »
     * padlock (Master Reference §6.2); `moto` = Séra's electric-fleet glyph
     * (Sera §7.2 Motorcycle · Master Reference §9). */
    cadenas: 'cadenas',
    moto: 'moto',
  },
} as const;

/** The three named celebration moments (DESIGN-LANGUAGE.md §3) — no fourth. */
export const CELEBRATION_MOMENTS = ['produit_pret', 'premiere_vente', 'course_validee'] as const;
export type CelebrationMomentName = (typeof CELEBRATION_MOMENTS)[number];

export interface CelebrationMoment {
  /** Woven-motif palette drawn FROM THE THEME (« motif tissé/étoiles aux couleurs du thème »). */
  motifPalette: readonly [string, string, string];
  /** « halo doux » — the theme's soft primary. */
  halo: string;
  /** Timing REFS into the motion law (≤ 800 ms, spring, never blocking). */
  timing: { maxDurationMs: typeof motion.celebrationMaxMs; easing: 'spring-soft' };
}

export type CelebrationTokens = Record<CelebrationMomentName, CelebrationMoment>;

export interface ThemeColors {
  /** App accent — the theme's identity color. */
  primary: string;
  primaryStrong: string;
  primarySoft: string;
  /** On-primary content. */
  onPrimary: string;
  /** The verified/sealed/delivered badge family — consistent across apps. */
  verifiedBadge: string;
}

function makeCelebration(colors: ThemeColors): CelebrationTokens {
  const moment = (): CelebrationMoment => ({
    motifPalette: [colors.primary, colors.primaryStrong, colors.primarySoft],
    halo: colors.primarySoft,
    timing: { maxDurationMs: motion.celebrationMaxMs, easing: 'spring-soft' },
  });
  return {
    produit_pret: moment(),
    premiere_vente: moment(),
    course_validee: moment(),
  };
}

export interface Theme {
  name: 'boutik-plus' | 'shop-plus' | 'sera';
  colors: ThemeColors & typeof neutralColors;
  typeScale: typeof typeScale;
  spacing: typeof spacing;
  radius: typeof radius;
  elevation: typeof elevation;
  motion: typeof motion;
  touch: typeof touch;
  /** v2: the three named celebration moments, colored by THIS theme. */
  celebration: CelebrationTokens;
  /** v3: family interaction constants (shared — the movement law is uniform). */
  interaction: typeof interaction;
  /** v3: per-theme Android elevation (« Élévation visuelle par thème ») —
   * structurally per-theme, ⏳ CTO-default value tuned per theme at gallery. */
  androidElevation: number;
}

export function makeTheme(
  name: Theme['name'],
  colors: ThemeColors,
  androidElevation: number = ANDROID_ELEVATION_DEFAULT,
): Theme {
  return {
    name,
    colors: { ...neutralColors, ...colors },
    typeScale,
    spacing,
    radius,
    elevation,
    motion,
    touch,
    celebration: makeCelebration(colors),
    interaction,
    androidElevation,
  };
}
