# Faso Premium tokens — derivation record (WO-FP-0, canon v1.0.0)

The founder's redesign handoff (`handoff_redesign/README.md` § "The shared
system") replaces Grand Teint's **visual layer**. This record is the warrant for
every value in `docs/design/tokens.json` (Faso Premium, `$meta.version 2.0.0`)
and its byte-mirror `packages/ui-tokens/src/faso-premium.ts`. Every value is
transcribed **verbatim** from the README; a value the README does not state is
not invented.

## The STOP that opened this slice, and the four rulings

Before encoding I stopped on the motion section: the WO asked for "the six fp*
animations: duration + cubic-bezier values verbatim," but the source contradicts
both halves — the README § Motion names **seven** fp\*, and only **two** carry a
cubic-bezier. The CTO ruled (all four, journaled here as the record):

1. **The set is SEVEN** — `fpIn · fpUp · fpPop · fpPulse · fpBar · fpShimmer ·
   fpShake` (README § Motion is canonical). `fpFade` + `fpToast` exist in the
   prototypes but are **documented-out** of canon (prototype-local detail); the
   app slices derive them from their own pixel-source.
2. **Timing encodes verbatim, whatever its form** — a `cubic-bezier(…)` where the
   README attaches one (fpIn, fpUp), the literal keyword where the prototype uses
   one (fpPulse `ease` · fpBar `ease-in-out` · fpShimmer `linear` · fpShake
   `ease`). Inventing a bezier for a keyword-timed animation would be the
   violation.
3. **fpPop is ruled**: `durationMs = { min: 300, max: 450 }` (README ".3–.45s"
   verbatim); `timingFunction = cubic-bezier(.2,.8,.2,1)` — the **only** explicit
   curve the source ever attaches to it; the overshoot lives in the keyframes,
   not the curve.
4. **Ranges encode as `{ min, max }` verbatim** — never collapsed to a single
   invented value (the DESIGN-DIMENSIONS precedent). Single values stay plain
   numbers.

### fpPop — the usage split, verbatim (ruling ③, "journal it so the pick is loud")

Deduplicated across all four prototype `*.dc.html` (count = occurrences):

| duration | timingFunction | occurrences |
|---|---|---|
| `.3s`  | *(none)* | 8 |
| `.45s` | `cubic-bezier(.2,.8,.2,1)` | 5 |
| `.5s`  | `cubic-bezier(.2,.8,.2,1)` | 3 |

The token takes the README's `.3–.45s` range and the house curve
`cubic-bezier(.2,.8,.2,1)` (the only explicit curve, 5×). **Founder-overridable.**

### fpIn stragglers (the hierarchy law, journaled)

`fpIn` is used `.32s cubic-bezier(.2,.8,.2,1)` **50×**, but also `.3s` with no
bezier **19×** and `.25s` **1×**. The token is the README value (`.32s` +
bezier). Per **THE HIERARCHY LAW** (CTO):

> **THE README DEFINES THE SYSTEM; TOKENS ENCODE IT; PROTOTYPES ARE PIXEL-SOURCE
> FOR APP-LOCAL DETAIL.** Where a prototype usage strays from a token (the 19×
> fpIn no-bezier stragglers), THE TOKEN WINS and the app slice normalizes to it,
> straggler journaled. Where a value exists ONLY in a prototype (fpFade, fpToast,
> per-usage variance), the app derives locally from its own pixel-source.

This governs all four app slices that gate on this sha.

## The groups — every value, its README source line

- **colour.shared** — README § Color (shared), lines 22–24. paper `#F4EFE6`
  (Séra `#EFE8DA`), card `#FFFFFF`, ink `#1C1710`, body `#4A3F33`, sub `#6F6355`,
  hairline `#EDE4D3`/strong `#E5DCC9`/input `#E0D6C2`, dim `#EFE8DA`, disabled CTA
  `#DDD5C3` fg `#8A7D6B`. Status pairs: ok `#14603A`/`#DFEEE3`, warn
  `#5F4403`+`#7A5104` (both text tones encoded — the README states both) on
  `#F6E9C8`, danger `#8C1D18`/`#F8E1DE` border `#C4574B`, muted `#6F6355`/`#EFE8DA`.
- **colour.{boutik,shop,pwa,sera}** — README § Accent per app (primary/deep/soft/
  onPrimary) + § Signature elements 1, the woven band (each app's `gold`). Séra
  carries two deep-text tones (`#8F6812`/`#5F4403` → `deep`/`deepAlt`), a card
  tint (`#FBF3DF` → `tintCard`), dark on-primary `#241A05`, and gold `#C2571B`
  (the woven band's "third color").
- **type** — README § Type. Families: Bricolage Grotesque (display, weights
  700/800, titles `-.02em`), Instrument Sans (text, weights 400–700). Scale:
  screen 28/800 · view {19,20}/800 · heroMoney {36,38}/800 · cardMoney 24/800 ·
  row 14.5/700 · body {13,14.5} (no weight in the README → none encoded) · caps
  {10.5,11}/700, ls `.1em`, upper · pill 11/700.
- **radius** — README § Geometry. card 20 · tile 18 · art {13,14} · button 16 ·
  buttonSecondary {14,15} · sheet 30 · pill 99.
- **geometry** — the four constants the WO named (README § Geometry): statusPx 54
  · paddingPx 20 · tabDockBlurPx 18 · toastMs 2800. Other prototype geometry
  (frame 402×874, grab 40×5, list-pad) is app-local pixel-source, not canon this
  wave.
- **motion** — the seven fp\*, per rulings ①–③ above.

### Two verbatim-transcription notes (value preserved, glyph normalized)

- **titleLetterSpacing** — the README writes the typographic **U+2212 minus**
  (`−.02em`); the token carries the functional CSS value `-.02em` (ASCII). The
  value (negative two-hundredths em) is preserved; the prose glyph is not a
  design byte. Flagged for the CTO; reversible.
- **body weight** — the README gives `body 13–14.5` with **no weight**. None is
  encoded (derive-never-invent); a consumer inherits the family default.
- **family weights** — display "Weights 700/800" (a discrete pair) → `[700, 800]`;
  text "Weights 400–700" (an en-dash range) → `[400, 700]` (endpoint array, same
  form). Both numbers are README-stated; neither range is collapsed to one value.

## Scope — what this wave does NOT touch

Faso Premium encodes only the README shared-system groups the WO enumerated
(palette · four accents · type · radii · geometry · the seven motions). The
Grand Teint groups the README does not re-specify — money-format, celebration,
landmark, interaction, band, ribbon, skeleton, statusbar, dimension — stay in
**Grand Teint (legacy)** until their own named reskin slices.

## Architecture — v2 primary, v1 under a legacy path (WO item 2)

- `docs/design/tokens.json` → **Faso Premium v2** (byte-authoritative source).
- `docs/design/tokens.grand-teint.json` → Grand Teint v1, **moved byte-verbatim**
  (git rename, zero content change).
- `@platform/ui-tokens` root (`dist/index.js`) → Faso Premium
  (`src/faso-premium.ts`).
- `@platform/ui-tokens/legacy` (`dist/legacy/index.js`) → Grand Teint, its three
  source files (`family.ts`, `themes.ts`, `index.ts`) **moved byte-verbatim** to
  `src/legacy/`.
- **Both surfaces stay fully gated.** `token-surface.data.mjs` now lists two
  SURFACES; the three token gates loop over both. Faso Premium is fidelity- +
  coverage-owned (no doc-derived tokens this wave); Grand Teint keeps its 11
  design-dimension warrants. The coverage meta-gate owns the new groups; the
  planted stray (a stray export **and** a stray leaf on `motion.fpIn`) fires.

### Transition-window consumer repoints (v1 stays reachable this wave)

Three internal Grand Teint consumers move to the `./legacy` path (their reskin is
a later named slice):

- `packages/certification/src/chain/report-html.ts` — the E1 chain dashboard,
  `import … from '@platform/ui-tokens/legacy'`.
- `packages/ui-tokens/test/tokens.test.ts` — the Grand Teint structural test,
  `../src/legacy/…`.
- `scripts/check-icon-manifest.mjs` — the icon set is a Grand Teint asset
  (`landmark.iconNames`), read from `tokens.grand-teint.json`.

The Séra dispatch console stays on v1 (Grand Teint) this wave per the WO; its
reskin opens only under a later named slice or the Séra HANDOFF.

## Version — the platform bumps to 1.0.0 (lockstep, MAJOR)

"ui-tokens MAJOR bump" is machine-forced to a **platform-wide** bump:
`scripts/check-export-maps.mjs` asserts every package version equals the root
version, so the five packages cannot diverge — a ui-tokens MAJOR is a platform
MAJOR. From `0.9.10` the only MAJOR is **`1.0.0`**. All six package.json + the
`certification`→`ui-tokens`/`contracts` and `contracts`→`kernel-types` intra-deps
→ `1.0.0`; `run-gates.sh --pinned-version` → `1.0.0`; `docs.manifest.json`
packageVersion → `1.0.0` (doc hashes unchanged); the api-surface snapshot
packageVersion → `1.0.0`; lockfile re-resolved. The design-system version
(tokens.json `$meta.version`) is a **separate** line — it moves `1.0.0 (Grand
Teint)` → `2.0.0 (Faso Premium)`.

## Snapshot delta (named)

- **api-surface snapshot** — `packageVersion` **0.9.10 → 1.0.0 ONLY**; the
  `exports` and `schemas` maps are **byte-identical** (structurally compared, not
  a vacuous key-miss) — no contracts shape moved.
- **docs.manifest.json** (both copies) — `packageVersion` **0.9.10 → 1.0.0
  ONLY**; all 11 doc hashes unchanged (no `.md` changed).
- **ui-tokens built-export surface** — ADDED (Faso Premium root): `fasoPremiumMeta,
  sharedColour, boutikColour, shopColour, pwaColour, seraColour, type, radius,
  geometry, motion`. MOVED to `@platform/ui-tokens/legacy` (unchanged bytes): the
  full Grand Teint export set. No Grand Teint value altered.
