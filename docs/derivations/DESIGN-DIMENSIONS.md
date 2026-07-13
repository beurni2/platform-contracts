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

## Derived tokens (9) — each byte-verified against its doc line

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

**On value 50 (searchField).** Two doc contexts carry 50: `components.md:81`
(SearchField, a **clean single value** “box h 50”) and `components.md:41`
(SecondaryButton, a **range** “h 50–56”). A range cannot derive a single token,
so the token is named for — and quoted from — the SearchField line only. The
SecondaryButton/danger height stays a documented **range**, not a token.

---

## STOP — one value no canon line states (founder → designer)

**`iconSize 12` — NOT tokenised.** WO-6.0's kit carries three icon-size props
(17 / 28 / **12**). 17 and 28 are stated as icon sizes above. **12 is not stated
as an icon size anywhere in the design canon.** The only canonical 12s are:

- `GRAND-TEINT.md:70` — the **spacing scale** `4/8/12/16/24/34` (12 is a spacing
  step, not an icon size), and
- `components.md:24` — “row pad **11–12**” (row padding, a range, not an icon).

Per derive-never-invent (“inventing a value no doc states → STOP instead”), a
12 px **icon** is flagged here for the founder to take to the designer. Two clean
resolutions, founder's call — **do not resolve creatively**:

1. the designer names a 12 px icon explicitly (then it becomes a derived token in
   a later slice), or
2. the kit's 12 px icon is re-pointed at an existing named icon size (17 / 20 /
   28) or, if it is genuinely a *spacing*-sized glyph, at the existing
   `spacing.md` (=12) token.

Until the founder rules, **nothing 12-shaped enters `dimension.iconSizePx`.**
Shipping nothing here is correct — nothing names it.

---

## Enforcement

- **`scripts/check-design-dimensions.mjs`** — for each of the 9 tokens: built
  value `===` the table value; the byte-exact quote is present in its doc; the
  quote contains the number (static non-vacuity). **Completeness:** every key the
  built tokens add beyond `tokens.json` in `{celebration, band, dimension}` must
  be one of these 9 — an undERIVED addition fails the gate.
- **`scripts/show-design-dimensions-negative.sh`** — proves the gate non-vacuous
  **both ways**: a tampered token value (haloPx 220→221) is rejected, and a
  tampered doc (motion.md 220px→221px) is rejected.
- **`scripts/check-token-fidelity.mjs`** (amended) — `tokens.json` values remain
  immutable; the built package may be a **superset**, every addition owned here.
