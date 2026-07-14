// WO-5.7 / WO-FP-0 — single source of truth for WHICH GATE OWNS WHICH ui-tokens
// export, now across TWO built surfaces:
//   • faso-premium — the v1.0.0 visual layer, entry `dist/index.js`
//                    (docs/design/tokens.json)
//   • grand-teint  — v1, frozen & byte-preserved under ./legacy for one
//                    transition window, entry `dist/legacy/index.js`
//                    (docs/design/tokens.grand-teint.json)
//
// Three gates read this list and loop over EVERY surface, so no surface's
// exports can silently escape a gate:
//   - check-token-fidelity.mjs    FIDELITY_MAP: built ⊇ its tokens.json (values)
//   - check-design-dimensions.mjs DERIVED / OWNED_GROUPS: doc/computed additions
//   - check-token-coverage.mjs    the UNION covers the WHOLE built surface —
//     FIDELITY_MAP exports ∪ OWNED (dimension) ∪ STRUCTURAL, every value-leaf ∈
//     tokens.json leaves ∪ DERIVED paths. Every export owned by EXACTLY ONE
//     gate on its surface, or the build fails.

/** Faso Premium (WO-FP-0). tokens.json group path → built export name. No
 *  doc-derived additions this wave (every value comes straight from tokens.json),
 *  so DERIVED / OWNED_GROUPS / SUPERSET_OK are empty. */
const FASO_PREMIUM = {
  name: 'faso-premium',
  tokensJson: ['docs', 'design', 'tokens.json'],
  entry: ['packages', 'ui-tokens', 'dist', 'index.js'],
  srcDir: ['packages', 'ui-tokens', 'src'],
  srcFiles: ['faso-premium.ts', 'index.ts'],
  FIDELITY_MAP: {
    'colour.shared': 'sharedColour',
    'colour.boutik': 'boutikColour',
    'colour.shop': 'shopColour',
    'colour.pwa': 'pwaColour',
    'colour.sera': 'seraColour',
    type: 'type',
    radius: 'radius',
    geometry: 'geometry',
    motion: 'motion',
  },
  SUPERSET_OK: [],
  DERIVED: [],
  OWNED_GROUPS: [],
  STRUCTURAL_EXPORTS: ['fasoPremiumMeta'],
};

/** Grand Teint (v1) — the existing lists, byte-unchanged, now pointed at the
 *  ./legacy entry. Frozen for the transition window; still fully gated. */
const GRAND_TEINT = {
  name: 'grand-teint',
  tokensJson: ['docs', 'design', 'tokens.grand-teint.json'],
  entry: ['packages', 'ui-tokens', 'dist', 'legacy', 'index.js'],
  srcDir: ['packages', 'ui-tokens', 'src', 'legacy'],
  srcFiles: ['family.ts', 'themes.ts', 'index.ts'],
  FIDELITY_MAP: {
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
    // WO-5.11: tokens.json's `dimension` group carries ONLY the QR block
    // (designer-bundle values). The rest of `dimension` (controlHeight/iconSize)
    // is doc-derived and design-dimensions-owned; `dimension` is a SUPERSET
    // group, so fidelity checks the qr leaves ⊆ built and the derived leaves stay
    // owned there.
    dimension: 'dimension',
  },
  // Groups whose built value is a SUPERSET of tokens.json (doc-derived additions).
  SUPERSET_OK: ['celebration', 'band', 'dimension'],
  // Design-dimension tokens — each value is either (kind 'quote') byte-stated in
  // a canon design-doc line, or (kind 'computed') the product of canon's OWN
  // token leaves. NONE is invented; each anchored by check-design-dimensions.mjs.
  DERIVED: [
    { path: 'celebration.haloPx', value: 220, kind: 'quote', doc: 'docs/design/motion.md', quote: 'halo (220px circle, theme tint)' },
    { path: 'celebration.ringPx', value: 132, kind: 'quote', doc: 'docs/design/motion.md', quote: 'ring (132px, theme colour)' },
    { path: 'band.priceBand.noteWidth', value: 118, kind: 'quote', doc: 'docs/design/components.md', quote: 'right-column honesty note (`caption` `primarySoft`, w 118)' },
    { path: 'dimension.controlHeightPx.primaryButton', value: 56, kind: 'quote', doc: 'docs/design/components.md', quote: '**Size:** h 56; margin x 16.' },
    { path: 'dimension.controlHeightPx.searchField', value: 50, kind: 'quote', doc: 'docs/design/components.md', quote: 'Hairline 1.5 box h 50: search icon 17' },
    { path: 'dimension.controlHeightPx.listRow', value: 44, kind: 'quote', doc: 'docs/design/components.md', quote: '**fixed h 44** (list virtualization law)' },
    { path: 'dimension.controlHeightPx.offlineBanner', value: 30, kind: 'quote', doc: 'docs/design/components.md', quote: 'Ink band h 30' },
    { path: 'dimension.iconSizePx.listRow', value: 17, kind: 'quote', doc: 'docs/design/components.md', quote: 'icon 17 (`ink`)' },
    { path: 'dimension.iconSizePx.emptyState', value: 28, kind: 'quote', doc: 'docs/design/components.md', quote: 'Icon 28 `soft`' },
    { path: 'dimension.iconSizePx.tab', value: 20, kind: 'quote', doc: 'docs/design/components.md', quote: 'icon 20 + word `labelXS` (icon+word law)' },
    { path: 'dimension.iconSizePx.badge', value: 12, kind: 'computed', op: 'product', factors: ['type.scale.labelXS.size', 'type.scale.labelXS.lh'] },
  ],
  OWNED_GROUPS: ['celebration', 'band', 'dimension'],
  STRUCTURAL_EXPORTS: ['grandTeintMeta', 'boutikPlusTheme', 'shopPlusTheme', 'seraTheme', 'themes'],
};

/** Every built surface a gate must sweep. */
export const SURFACES = [FASO_PREMIUM, GRAND_TEINT];
