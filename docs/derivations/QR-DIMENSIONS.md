# QR-vitrine dimension tokens — derivation record (WO-5.11, canon v0.9.7)

**What this is.** WO-7.2 (the Shop+ QR vitrine — a market seller's product link
as a scannable code) needs a handful of pixel/millimetre dimensions to render a QR
that scans reliably on a printed shop wall and on-screen. WO-5.11 encodes only the
**four primitives** the designer stated; the on-screen **side is a derivation, not
a token** (see below). The four primitives enter `@platform/ui-tokens` under
`dimension.qr`, and — unlike the doc-derived `controlHeight`/`iconSize` dimensions
(see `DESIGN-DIMENSIONS.md`, which live *outside* `tokens.json`) — these are
**designer-bundle values**: they enter `docs/design/tokens.json` (fidelity-owned,
immutable) because the designer stated them as concrete numbers in the **QRVitrine
spec sheet**. This file is the derivation: one byte-exact quote per token, sourced
from that sheet.

**Authority + method.** Source of truth is the designer's **`QRVitrine - Spec`**
sheet, delivered in the WO-7.2 design handoff bundle (`handoff_wo72/`), as amended
by the designer's **rulings ledger** (`handoff_rulings_0713`, relayed in the CTO's
WO-5.11 amendment of 2026-07-13). Every one of the four primitives is **stated on
the sheet** — none is invented, none is a bare number chosen at the keyboard:
derive-and-quote, or STOP. (The WO-5.11 rule was explicit: *any value whose
derivation is absent from the sheet → STOP AND FLAG.* None was absent; no STOP was
raised.)

---

## The four primitives (tokens) — each byte-verified against the QRVitrine spec sheet

| # | Token (`dimension.qr.*`) | Value | Source line (byte-exact, QRVitrine spec sheet) | Semantic |
|---|---|---|---|---|
| 1 | `quietZoneModules` | **4** | “La zone de silence — **4 modules de papier pur**, portés par le composant lui-même.” (corrob. header line “zone de silence de 4 modules en papier pur, correction M”) | the ISO-18004 quiet zone — 4 modules of pure paper around the code |
| 2 | `moduleMinPx` | **4** | “**module 4 px (= spacing.xs, jamais de sous-pixel)**” | minimum on-screen size of one QR module (= `spacing.xs`, never sub-pixel) |
| 3 | `printModuleMinMm` | **1.0** | “**plancher d’impression 1,0 mm/module** → 37 × 1,3 = 48 mm …” | print floor: minimum 1.0 mm per module when printed |
| 4 | `printSideMm` | **48** | “plancher d’impression 1,0 mm/module → **37 × 1,3 = 48 mm — scannable à bout de bras sur un mur de boutique**” (corrob. “QR à 48 mm dans le tiers bas”) | printed side of the QR: 37 modules × 1.3 mm ≈ 48 mm — scannable across a shop wall |

---

## The on-screen side is a DERIVATION, not a token

The earlier draft of this WO carried `minSideDp = 148` as a fixed fifth token. It
was **dropped** (CTO amendment, 2026-07-13, from `handoff_rulings_0713`): 148 was
the **V3 worked example**, and the encoder is ruled **versions 1–5** — the URL
against the real origin may force **V4+**, and a frozen 148 would put a V4 QR
**under its own floor**. The side is therefore computed at render from the four
primitives, never stored:

```
minSidePx(version) = (modules(version) + 2 × quietZoneModules) × moduleMinPx
```

where `modules(version)` is the QR grid size (V3 = 29, V4 = 33). Worked examples,
quoted from the updated sheet / rulings ledger:

| version | modules | minSidePx | check |
|---|---|---|---|
| V3 | 29 | (29 + 2×4) × 4 = **148** | matches the old worked example |
| V4 | 33 | (33 + 2×4) × 4 = **164** | > 148, which is why 148 could not be frozen |

**Print floor still holds.** At the printed 48 mm side, the per-module width at V4
is `48 mm / (modules(V4) + 8) = 48 / 41 ≥ 1.17 mm ≥ the 1.0 mm floor` — holds
through V4; **the component asserts the floor at render, consuming the primitives**
(it does not trust a stored side).

**Why V3 in the first place (context, not a token).** The sheet derives the
*version* from the real payload byte count, not a guess: “Contenu réel à encoder :
https://shopplus.bf/v/aicha = 27 octets → **V3 (29×29)**, ECC M (capacité 42
octets — de la marge pour tout nom de vitrine).” The exact production URL/slug is
set by the founder’s domain ruling (questions.md Q3–Q6 + domain) and the
byte→version mapping is the encoder’s concern (vendored per Q4); a longer URL that
lands in V4 is exactly the case the dropped-token amendment protects.

---

## Out of scope for WO-5.11 (stated on the sheet, **not** encoded here)

- **`qr.ecc = "M"`** — the sheet names an error-correction level (“correction M”,
  “ECC M”). WO-5.11 encodes only the **dimension primitives**; the ECC level and
  the QR encoder itself are WO-7.2 concerns (encoder vendored/maison per
  questions.md Q4). Recording it here so the omission is deliberate, not an
  oversight: it is a real designer value, held back by scope, not dropped.

---

## Why these live in `tokens.json` (and the gate wiring)

The `DESIGN-DIMENSIONS.md` tokens are doc-*derived* (quoted from
`components.md`/`motion.md`) and stay **outside** `tokens.json`, anchored by
`check-design-dimensions.mjs`. The QR primitives are different: the designer stated
them as first-class token values in the spec sheet, so they enter
`docs/design/tokens.json` under `dimension.qr` and are **fidelity-owned**
(immutable, byte-checked by `check-token-fidelity.mjs`).

To let the *doc-derived* `dimension.controlHeightPx`/`iconSizePx` keys coexist in
the same built `dimension` export as the *fidelity-owned* `dimension.qr`, the
`dimension` export is a **SUPERSET group**: `token-surface.data.mjs` maps
`dimension → dimension` in `FIDELITY_MAP` (so the `qr` leaves are checked
`tokens.json ⊆ built`) and keeps `dimension` in `OWNED_GROUPS`, while
`check-token-fidelity.mjs` adds `dimension` to `SUPERSET_OK` (extra doc-derived
keys permitted, each still pinned by `check-design-dimensions.mjs`). The
`check-token-coverage.mjs` meta-gate then owns **exactly the four `dimension.qr`
leaves** and confirms each is present in `tokens.json` — a stray `dimension.qr.*`
leaf is rejected, proven non-vacuously by `show-token-coverage-negative.sh`
(tamper B).
