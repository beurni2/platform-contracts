/**
 * FASO PREMIUM — the design system as data (canon v1.0.0, WO-FP-0).
 *
 * The founder's redesign handoff (handoff_redesign/README.md § "The shared
 * system") is the SOURCE OF TRUTH for the visual layer that replaces Grand
 * Teint. Every value here is transcribed VERBATIM from that README — a value
 * the README does not state is not invented (CTO rulings ①–④, WO-FP-0). A CI
 * fidelity gate (scripts/check-token-fidelity.mjs) cross-checks this file,
 * group for group, against `docs/design/tokens.json`; a divergent value fails
 * the build. The coverage meta-gate owns these groups; a stray export or leaf
 * fires (scripts/check-token-coverage.mjs).
 *
 * Grand Teint v1 is preserved BYTE-VERBATIM under ./legacy (importable at
 * @platform/ui-tokens/legacy) for one transition window; the Séra dispatch
 * console stays on it this wave. Its reskin is a later named slice.
 *
 * Tokens are DATA — apps interpret them; nothing here is a component, nothing
 * renders, nothing computes a colour at runtime (RN-safe root, no JSX).
 *
 * RANGES: a value the README states as a range (type 19–20, radius art 13–14,
 * fpPop .3–.45s) is { min, max } VERBATIM — never a single invented value.
 * MOTION: each fp* is { durationMs, timingFunction }; timingFunction is the
 * source's verbatim value whatever its form — a cubic-bezier where the README
 * attaches one (fpIn, fpUp, fpPop), else the literal keyword the prototype uses
 * (fpPulse ease · fpBar ease-in-out · fpShimmer linear · fpShake ease).
 */

/** tokens.json $meta — provenance, verbatim. */
export const fasoPremiumMeta = {
  name: 'Faso Premium',
  version: '2.0.0',
  replaces:
    'Grand Teint (docs/design/tokens.grand-teint.json) — its visual layer; importable at @platform/ui-tokens/legacy for the transition window (the Séra dispatch console stays on v1 this wave)',
  apps: ['boutik', 'shop', 'pwa', 'sera'],
  source:
    'handoff_redesign/README.md § The shared system ("Faso Premium") — founder redesign handoff 2026-07',
  law: 'Zero hardcode. Every colour, dimension, duration and radius in any Faso Premium surface must resolve to a token in this file. Every value here is transcribed VERBATIM from the handoff README; a value the README does not state is not invented (WO-FP-0, CTO rulings ①–④).',
  scope:
    'WO-FP-0 encodes the README shared-system: the shared palette, the four per-app accent sets, the type scale + two family names, radii, the four geometry constants, and the seven fp* motions. Money-format, celebration, landmark, interaction, band, ribbon, skeleton, statusbar and dimension groups remain in Grand Teint (legacy) until their own named reskin slices.',
  ranges:
    'A value the README states as a range (e.g. type 19–20, radius art 13–14, fpPop .3–.45s) is encoded as { "min": a, "max": b } VERBATIM — never collapsed to a single invented value (CTO ruling ④).',
  motion:
    'Each fp* motion is { durationMs, timingFunction }. timingFunction is the source\'s verbatim value whatever its form — a cubic-bezier where the README attaches one (fpIn, fpUp, fpPop), else the literal keyword the prototype uses (fpPulse ease · fpBar ease-in-out · fpShimmer linear · fpShake ease). fpPop takes cubic-bezier(.2,.8,.2,1) — the only explicit curve the source ever attaches to it (CTO ruling ③). Durations are the README seconds, exact to ms.',
} as const;

// ── colour.shared — one paper (Séra a shade deeper), one card, one ink; the
// four status pairs. Verbatim README § Color (shared). warn carries two text
// tones (#5F4403 / #7A5104), both encoded — the README states both, neither is
// picked. mutedFg/mutedBg reuse #6F6355 / #EFE8DA under their status names.
export const sharedColour = {
  paper: '#F4EFE6',
  paperSera: '#EFE8DA',
  card: '#FFFFFF',
  ink: '#1C1710',
  body: '#4A3F33',
  sub: '#6F6355',
  hairline: '#EDE4D3',
  hairlineStrong: '#E5DCC9',
  hairlineInput: '#E0D6C2',
  dim: '#EFE8DA',
  disabledCta: '#DDD5C3',
  disabledCtaFg: '#8A7D6B',
  okFg: '#14603A',
  okBg: '#DFEEE3',
  warnFg: '#5F4403',
  warnFgAlt: '#7A5104',
  warnBg: '#F6E9C8',
  dangerFg: '#8C1D18',
  dangerBg: '#F8E1DE',
  dangerBorder: '#C4574B',
  mutedFg: '#6F6355',
  mutedBg: '#EFE8DA',
} as const;

// ── colour.<app> — one accent per screen, never two. primary/deep/soft/onPrimary
// from README § Accent per app; gold from § Signature elements 1 (the woven band).
/** Boutik+ — grounded, supply-green confidence. */
export const boutikColour = {
  primary: '#0B5B47',
  deep: '#073B2E',
  soft: '#E4EFE9',
  onPrimary: '#F6F1E7',
  gold: '#C89A3F',
} as const;

/** Shop+ — warm commerce energy. */
export const shopColour = {
  primary: '#A31D4E',
  deep: '#701134',
  soft: '#F8E4EC',
  onPrimary: '#FCF4EE',
  gold: '#E0A11B',
} as const;

/** PWA Cliente (acheteuse) — terracotta. */
export const pwaColour = {
  primary: '#C2571B',
  deep: '#7A340E',
  soft: '#F7E7D8',
  onPrimary: '#FFF6EC',
  gold: '#C89A3F',
} as const;

/** Séra — road-and-custody clarity; amber primary, two deep tones, dark on-primary. */
export const seraColour = {
  primary: '#D9A441',
  deep: '#8F6812',
  deepAlt: '#5F4403',
  soft: '#F6E9C8',
  tintCard: '#FBF3DF',
  onPrimary: '#241A05',
  gold: '#C2571B',
} as const;

// ── type — Bricolage Grotesque (display) + Instrument Sans (text); the scale as
// listed, ranges as { min, max }. `size` in px, `wght` a font weight, `upper`
// uppercase, `letterSpacing` a CSS em string. `body` carries no weight in the
// README, so none is encoded. See $note for the money render rule + the U+2212
// transcription of titleLetterSpacing.
export const type = {
  families: {
    display: { name: 'Bricolage Grotesque', weights: [700, 800], titleLetterSpacing: '-.02em' },
    text: { name: 'Instrument Sans', weights: [400, 700] },
  },
  scale: {
    screen: { size: 28, wght: 800 },
    view: { size: { min: 19, max: 20 }, wght: 800 },
    heroMoney: { size: { min: 36, max: 38 }, wght: 800 },
    cardMoney: { size: 24, wght: 800 },
    row: { size: 14.5, wght: 700 },
    body: { size: { min: 13, max: 14.5 } },
    caps: { size: { min: 10.5, max: 11 }, wght: 700, letterSpacing: '.1em', upper: true },
    pill: { size: 11, wght: 700 },
  },
  $note:
    "Money values and codes render font-feature-settings:'tnum' + white-space:nowrap, format fr-FR grouping + narrow-space F (« 11 500 F ») — a rendering rule carried verbatim from the README type section; the franc formatter itself stays the Grand Teint money group for this wave. `body` carries no weight in the README, so none is encoded (derive-never-invent). `titleLetterSpacing` transcribes the README's typographic U+2212 minus to the functional CSS value -.02em.",
} as const;

// ── radius — px; art + secondary-button are ranges (README § Geometry). ────────
export const radius = {
  card: 20,
  tile: 18,
  art: { min: 13, max: 14 },
  button: 16,
  buttonSecondary: { min: 14, max: 15 },
  sheet: 30,
  pill: 99,
} as const;

// ── geometry — the four named constants (README § Geometry). status/padding/
// blur in px, toast in ms. Other prototype geometry (frame, grab, list-pad) is
// app-local pixel-source per the hierarchy law, not elevated to canon this wave.
export const geometry = {
  statusPx: 54,
  paddingPx: 20,
  tabDockBlurPx: 18,
  toastMs: 2800,
} as const;

// ── motion — the seven fp* (README § Motion). durationMs from the README
// seconds (exact); timingFunction verbatim, cubic-bezier or keyword. fpPop is a
// duration range with the house curve (CTO ruling ③). All respect
// prefers-reduced-motion at the consumer.
export const motion = {
  fpIn: { durationMs: 320, timingFunction: 'cubic-bezier(.2,.8,.2,1)' },
  fpUp: { durationMs: 340, timingFunction: 'cubic-bezier(.32,.72,.25,1)' },
  fpPop: { durationMs: { min: 300, max: 450 }, timingFunction: 'cubic-bezier(.2,.8,.2,1)' },
  fpPulse: { durationMs: 1200, timingFunction: 'ease' },
  fpBar: { durationMs: 1300, timingFunction: 'ease-in-out' },
  fpShimmer: { durationMs: 1200, timingFunction: 'linear' },
  fpShake: { durationMs: 400, timingFunction: 'ease' },
} as const;
