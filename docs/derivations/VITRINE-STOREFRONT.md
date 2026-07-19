# The storefront profile contract — derivation record (WO-VITRINE, canon v1.1.0)

**Source of truth:** the Vitrine handoff (`Vitrine__HANDOFF.md`) **§3.1 Storefront** —
« Toute valeur absente = défaut listé ici, jamais une invention » (§0). Every limit
below is the §3.1 value verbatim; nothing is invented.

## The seven net-new fields (additive, ALL defaulted)

| field | schema | §3.1 grounding (verbatim) |
|---|---|---|
| `tagline` | `z.string().max(40).default('')` | « string 0–40, défaut "" (phrase d'accueil) » |
| `bio` | `z.string().max(160).default('')` | « string 0–160, défaut "" (présentation) » |
| `cover` | `StorefrontCoverSchema` = `{status: 'none'\|'uploading'\|'pending'\|'live'\|'error', url?}` `.strict()`, default `{status:'none'}` | « { status:'none'\|'uploading'\|'pending'\|'live'\|'error', url? }, défaut none » — C-K4's five states; no generic "failed" |
| `avatar` | `StorefrontAvatarSchema` = `{mode: 'monogram'\|'photo', url?}` `.strict()`, default `{mode:'monogram'}` | « { mode:'monogram'\|'photo', url? }, défaut monogram » |
| `theme` | `StorefrontThemeSchema` = `enum('laterite','danfani','indigo','foret')`, default `'laterite'` | §3.1 « 'laterite'\|'danfani'\|'indigo'\|'foret', défaut 'laterite' » · §1.2 « ensemble fermé », « aucun sélecteur de couleur libre, jamais » — the KEYS are canon; colour recipes live in design tokens |
| `sections` | `z.array(StorefrontSectionSchema).max(4).superRefine(pid-in-≤1-section).default([])`; section = `{id, name: TrimmedNonEmptyString.max(20), pids: Id[]}` `.strict()` | « ≤ 4 × { id, name 1–20, pids[] } — un pid vit dans ≤ 1 section ; section vide = invisible côté cliente ; défaut [] » — emptiness is legal (display rule), duplication across sections is a SCHEMA refusal |
| `featuredItems` | `z.array(IdSchema).max(2).default([])` | « pid[] ordonnée ≤ 2 … MÊME forme que curatedItems : mêmes validations, même transport — champ neuf, primitive existante. Défaut [] » |

**One boundary guard beyond §3.1's bare `url?` (verifier flag, recorded):**
`cover.url`/`avatar.url` are `z.string().min(1).optional()` — the `.min(1)` refuses
`url: ""` (a degenerate encoding of absence), same class as `slug`'s `.min(1)` and
WO-5.13's `.max(120)`: a boundary guard, not a canon value. Absence is expressed by
omitting the field. §3.1 states no conditional url-required-when-`live` and none is
encoded (parse-proven both ways).

**Defaults are the compatibility guarantee:** a pre-existing storefront (the ten
WO-5.13 fields) parses unchanged; the seven fields fill from §3.1 defaults. Proven
by test (`shapes.test.ts`, the WO-VITRINE block: defaults asserted value-by-value)
and by the untouched WO-5.13 tests + `show-trimmed-string-negative.mjs` fixture.

**`featuredItems` "never a sold-out item"** — deliberately NOT a schema constraint:
§3.1 says « Jamais un article épuisé (**auto-retrait à l'affichage, le pin
persiste**) » — a display rule over live inventory, unknowable to a static shape.
K5 shows the pin on an out-of-stock item (§6). Encoding it here would break the
pin-persists semantics.

## Events — CTO ruling: canon encodes the SHAPE only (my WO STOP, sustained)

The WO originally ordered payload schemas for `storefront.created.v1` /
`storefront.published.v1`. STOPPED: `events.ts:130` documents that **payload
schemas are app-repo/E1 work** and `PlatformEventSchema.payload` is deliberately
`z.record(z.string(), z.unknown())` (WO-5.15 precedent). **CTO ruling (reversing
its own WO):** do NOT define them — the events stay names-only; the app maps
payloads at its boundary (the existing `store-projection` pattern); the
`events.ts:130` convention comment stays as-is. No event name added: §4.3 makes
every save a « publication immédiate », so `storefront.published.v1` already
carries profile updates at the app boundary.

## The two deliberate divergences (CTO-ruled, recorded not "fixed")

1. **`name` stays `TrimmedNonEmptyString.max(120)`** while the handoff §3.1 says
   3–24 and QA §8.6 checks `x/24`. Tightening would be BREAKING and would reverse
   WO-5.13's founder decision (the 120 is a boundary guard, not a canon value).
   **The contract permits a name the UI rejects — deliberately.** The app enforces
   3–24 per §3.1.
2. **`zone` stays a free `TrimmedNonEmptyString`** while §3.1 says « enum 8
   quartiers (Gounghin…) ». The handoff names only ONE quartier — enumerating
   eight would be invention. The founder supplies the list if the enum is ever
   wanted (WO-5.13's founder decision stands).

Also unchanged by order: `slug` (LOCKED — never regenerated, loi gelée 3),
`discoverable` (§3.1's `public` — the existing field name is canon), `curatedItems`
(the order primitive, § « EXISTANT »).

## Version & delta

All fields additive + defaulted → **MINOR**, lockstep: six package.json +
intra-deps + `run-gates --pinned-version` + both manifests + api-surface
packageVersion → **1.1.0**; lockfile re-resolved. **api-surface delta (structured,
real keys):** ADDED exports `STOREFRONT_THEMES, StorefrontThemeSchema,
StorefrontCoverSchema, StorefrontAvatarSchema, StorefrontSectionSchema`; ADDED
schemas (same four); CHANGED `StorefrontSchema` — **+7 properties, 0 removed, 0
otherwise changed** (the snapshot's `required` array grows 10 → 17 with it —
defaulted fields are required-on-output in the JSON-schema representation, inherent
to the +7, not extra drift); no other export/schema moved. Doc hashes unchanged
(packageVersion only). `ci.yml` gains `workflow_dispatch:` (one line, additive) so
the review branch can prove GREEN pre-merge per the WO's DISPATCH order.
