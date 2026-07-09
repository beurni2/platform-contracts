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

/** Motion — subtle, 60fps-safe on low-end Android; celebration with dignity. */
export const motion = {
  instant: { durationMs: 80, easing: 'ease-out' },
  quick: { durationMs: 160, easing: 'ease-out' },
  standard: { durationMs: 240, easing: 'ease-in-out' },
  celebrate: { durationMs: 420, easing: 'cubic-bezier(0.2, 0.8, 0.2, 1)' },
} as const;

/** Touch — ≥44px targets, icons always paired with text. */
export const touch = {
  minTargetPx: 44,
} as const;

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

export interface Theme {
  name: 'boutik-plus' | 'shop-plus' | 'sera';
  colors: ThemeColors & typeof neutralColors;
  typeScale: typeof typeScale;
  spacing: typeof spacing;
  radius: typeof radius;
  elevation: typeof elevation;
  motion: typeof motion;
  touch: typeof touch;
}

export function makeTheme(name: Theme['name'], colors: ThemeColors): Theme {
  return {
    name,
    colors: { ...neutralColors, ...colors },
    typeScale,
    spacing,
    radius,
    elevation,
    motion,
    touch,
  };
}
