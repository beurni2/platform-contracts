// WO-5.7 — single source of truth for WHICH GATE OWNS WHICH ui-tokens export.
// Three gates read this, so their lists can never silently drift apart:
//   - check-token-fidelity.mjs   owns FIDELITY_MAP  (values from tokens.json)
//   - check-design-dimensions.mjs owns DERIVED       (values derived from docs)
//   - check-token-coverage.mjs   asserts the UNION covers the whole built
//     surface: FIDELITY_MAP exports ∪ {dimension} ∪ STRUCTURAL_EXPORTS, and no
//     value-leaf escapes (tokens.json leaves ∪ DERIVED paths). Every export
//     owned by EXACTLY ONE gate, or the build fails (named debt ①).

/** tokens.json group path → built export name (the immutable designer values). */
export const FIDELITY_MAP = {
  'colour.shared': 'sharedColour',
  'colour.shop': 'shopColour',
  'colour.boutik': 'boutikColour',
  'colour.sera': 'seraColour',
  type: 'type',
  spacing: 'spacing',
  radius: 'radius',
  touch: 'touch',
  motion: 'motion',
  celebration: 'celebration',
  money: 'money',
  landmark: 'landmark',
  interaction: 'interaction',
  band: 'band',
  ribbon: 'ribbon',
  skeleton: 'skeleton',
  statusbar: 'statusbar',
};

/** Groups whose built value is a SUPERSET of tokens.json (doc-derived additions). */
export const OWNED_GROUPS = ['celebration', 'band', 'dimension'];

/**
 * Design-dimension tokens — each value is either (kind 'quote') byte-stated in a
 * canon design-doc line, or (kind 'computed') the product of canon's OWN token
 * leaves. NONE is invented; each is anchored by check-design-dimensions.mjs.
 * These live OUTSIDE tokens.json (immutable); this list is their only warrant.
 */
export const DERIVED = [
  { path: 'celebration.haloPx', value: 220, kind: 'quote', doc: 'docs/design/motion.md', quote: 'halo (220px circle, theme tint)' },
  { path: 'celebration.ringPx', value: 132, kind: 'quote', doc: 'docs/design/motion.md', quote: 'ring (132px, theme colour)' },
  { path: 'band.priceBand.noteWidth', value: 118, kind: 'quote', doc: 'docs/design/components.md', quote: 'right-column honesty note (`caption` `primarySoft`, w 118)' },
  { path: 'dimension.controlHeightPx.primaryButton', value: 56, kind: 'quote', doc: 'docs/design/components.md', quote: '**Size:** h 56; margin x 16.' },
  { path: 'dimension.controlHeightPx.searchField', value: 50, kind: 'quote', doc: 'docs/design/components.md', quote: 'Hairline 1.5 box h 50: search icon 17' },
  { path: 'dimension.controlHeightPx.listRow', value: 44, kind: 'quote', doc: 'docs/design/components.md', quote: '**fixed h 44** (list virtualization law)' },
  { path: 'dimension.controlHeightPx.offlineBanner', value: 30, kind: 'quote', doc: 'docs/design/components.md', quote: 'Ink band h 30' },
  { path: 'dimension.iconSizePx.listRow', value: 17, kind: 'quote', doc: 'docs/design/components.md', quote: 'icon 17 (`ink`)' },
  { path: 'dimension.iconSizePx.emptyState', value: 28, kind: 'quote', doc: 'docs/design/components.md', quote: 'Icon 28 `soft`' },
  // WO-5.7 Part D — the TabBar glyph, byte-stated in components.md (the v0.9.1
  // nav glyphs need a size to wire into the TabBar). Derived from the DOC, never
  // the designer's README prose.
  { path: 'dimension.iconSizePx.tab', value: 20, kind: 'quote', doc: 'docs/design/components.md', quote: 'icon 20 + word `labelXS` (icon+word law)' },
  // WO-5.7 Part C — the trust-strip badge glyph (« PAIEMENT PROTÉGÉ »). NOT a
  // fourth structural icon size (which is why no doc names it): the glyph FILLS
  // the labelXS line box, so its px = labelXS.size × labelXS.lh = 10 × 1.2 = 12.
  // Anchored to canon's OWN type scale — if labelXS moves, badge must move too.
  { path: 'dimension.iconSizePx.badge', value: 12, kind: 'computed', op: 'product', factors: ['type.scale.labelXS.size', 'type.scale.labelXS.lh'] },
];

/**
 * Non-value exports the coverage gate accounts for so they cannot mask a stray
 * export. Each is justified: the three app themes + the `themes` map are
 * COMPOSITIONS of colour groups already fidelity-checked at their source
 * (sharedColour + one app palette); grandTeintMeta is tokens.json's $meta
 * provenance (name/version/law), not a design value. Adding a new export forces
 * a choice — fidelity, derived, or here — or check-token-coverage.mjs fails.
 */
export const STRUCTURAL_EXPORTS = ['grandTeintMeta', 'boutikPlusTheme', 'shopPlusTheme', 'seraTheme', 'themes'];
