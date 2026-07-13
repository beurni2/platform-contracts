# Design-dimension tokens — derivation record (WO-5.6, canon v0.9.2)

**What this is.** WO-6.0 (the boutik Grand Teint kit) surfaced a *zero-hardcode*
gap: pixel dimensions that canon's **design docs** state as values, but
`docs/design/tokens.json` never carried — so the kit held them as literals.
Those values now enter `@platform/ui-tokens`, **but only where a canon design-doc
line states them**. This file is the derivation: one doc quote per token, plus
the STOP for the one value no doc states.

**Authority + method.** `tokens.json` values stay **immutable**; the
token-fidelity gate is amended to permit `tokens.json ⊆ built`, and a new gate
`scripts/check-design-dimensions.mjs` **byte-anchors every added value** to the
doc line below. Nothing here is invented: derive-and-quote, or STOP. Source of
truth is the design canon (`docs/design/components.md`, `docs/design/motion.md`).

---

## Derived tokens (11) — each byte-verified against its doc line, or computed from canon's type scale

| # | Token (`@platform/ui-tokens`) | Value | Source line (byte-exact) | Semantic |
|---|---|---|---|---|
| 1 | `celebration.haloPx` | **220** | `motion.md:28` — “halo (220px circle, theme tint) scale .35→1.18 …” | the celebration halo circle diameter |
| 2 | `celebration.ringPx` | **132** | `motion.md:29` — “ring (132px, theme colour) scale .5→1.32 …” | the celebration ring diameter |
| 3 | `band.priceBand.noteWidth` | **118** | `components.md:53` — “right-column honesty note (\`caption\` \`primarySoft\`, w 118)” | width of the PriceBand right-column honesty note |
| 4 | `dimension.controlHeightPx.primaryButton` | **56** | `components.md:36` — “**Size:** h 56; margin x 16.” (PrimaryButton) | primary-action button height (corrob. `GRAND-TEINT.md:70` “full-width, h 56”) |
| 5 | `dimension.controlHeightPx.searchField` | **50** | `components.md:81` — “Hairline 1.5 box h 50: search icon 17 …” (SearchField) | search field height |
| 6 | `dimension.controlHeightPx.listRow` | **44** | `components.md:30` — “**fixed h 44** (list virtualization law)” (ListRow) | list-row / header touch height (corrob. `:13` AppHeader, `:155` AlertRow) |
| 7 | `dimension.controlHeightPx.offlineBanner` | **30** | `components.md:71` — “Ink band h 30, \`onInk\` caption + wifi-off icon.” (OfflineBanner) | offline banner band height |
| 8 | `dimension.iconSizePx.listRow` | **17** | `components.md:28` — “icon 17 (\`ink\`) + label \`row\` …” (ListRow) | standard inline icon (corrob. `:81` search icon 17, `:129` check square 17) |
| 9 | `dimension.iconSizePx.emptyState` | **28** | `components.md:62` — “Icon 28 \`soft\` + one sentence \`body\` …” (EmptyState) | empty-state icon |
| 10 | `dimension.iconSizePx.tab` | **20** | `components.md:74` — “icon 20 + word \`labelXS\` (icon+word law)” (TabBar) | the TabBar glyph — the v0.9.1 nav icons need a size to wire in (WO-5.7 Part D) |
| 11 | `dimension.iconSizePx.badge` | **12** | *computed* — `type.scale.labelXS.size × lh = 10 × 1.2 = 12` | trust-strip badge glyph, WO-5.7 Part C (see the resolved STOP below) |

**On value 50 (searchField).** Two doc contexts carry 50: `components.md:81`
(SearchField, a **clean single value** “box h 50”) and `components.md:41`
(SecondaryButton, a **range** “h 50–56”). A range cannot derive a single token,
so the token is named for — and quoted from — the SearchField line only. The
SecondaryButton/danger height stays a documented **range**, not a token.

---

## The 12 px badge — STOP RESOLVED (WO-5.7 Part C)

At v0.9.2 the kit's third icon-size prop (**12 px**) was STOP-flagged: no canon
line stated a 12 px *icon*, only the spacing step `4/8/12/16/24/34` and row-pad
“11–12”. The designer resolved it (`handoff_icon_badge/README.md`, 2026-07-13):

> `type.scale.labelXS = 10 px, lh 1.2 → 10 × 1.2 = 12`. The glyph **fills the
> labelXS line box** — it is **not** a fourth structural icon size, which is
> exactly why no doc named one. Source: the buyer trust strip « PAIEMENT
> PROTÉGÉ » (PackLab prototype).

So the value is **derived, not invented** — computed from canon's OWN type scale.
`check-design-dimensions.mjs` anchors it as a **computed** token
(`labelXS.size × labelXS.lh`), so if the label scale ever moves, the badge must
move with it or the build fails. The founder ruled: **VALUE 12 is the designer's
and is immutable; the SHAPE is canon's** — it enters the existing
`dimension.iconSizePx.badge`, **not** a new top-level `icon` group (two shapes
for one concept is a canon-shape conflict; the designer's proposed `icon.badge.size`
was refused, and `check-token-coverage.mjs` now guards against exactly that stray).

**The three laws that ARE the token's meaning** (carry them wherever the badge is used):

1. **icon + word, never icon alone** — the badge glyph never appears without its label.
2. **NOT a hit target** — the pair is display-only; a tappable row supplies the ≥ 48 px area.
3. **DO NOT UPSCALE** — if it looks small, the LABEL scale is wrong, not the icon.

---

## Enforcement

The three gates read ONE shared source of ownership, `scripts/token-surface.data.mjs`
(`FIDELITY_MAP` · `DERIVED` · `OWNED_GROUPS` · `STRUCTURAL_EXPORTS`), so their
lists cannot silently drift apart.

- **`scripts/check-design-dimensions.mjs`** — for each of the **11** tokens: built
  value `===` the manifest value; and it is **warranted** — either (QUOTE) the
  byte-exact quote is present in its doc and carries the number, or (COMPUTED) the
  value equals the product of canon's own token leaves (the badge:
  `type.scale.labelXS.size × lh`). **Completeness:** every key the built tokens add
  beyond `tokens.json` in `{celebration, band, dimension}` must be one of the 11.
- **`scripts/check-token-coverage.mjs`** (WO-5.7, named debt ①) — the meta-gate:
  every built ui-tokens export is owned by **exactly one** gate — a
  `FIDELITY_MAP` export, the `dimension` group, or a declared `STRUCTURAL_EXPORT`
  — and every value leaf is a `tokens.json` leaf or a `DERIVED` path. A stray
  export (e.g. the designer's proposed top-level `icon` group) or a stray leaf
  owned by no gate **fails the build** — closing the vacuous-test hole where a
  token silently never ships while both value gates report green.
- **`scripts/check-token-fidelity.mjs`** — `tokens.json` values remain immutable;
  the built package may be a **superset** for `{celebration, band}`, every addition
  owned by the design-dimensions gate.
- Negative fixtures prove each gate non-vacuous: `show-design-dimensions-negative.sh`
  (bad value · bad doc), `show-token-coverage-negative.sh` (stray export · stray
  leaf), `show-token-fidelity-negative.sh` (one altered designer value).
