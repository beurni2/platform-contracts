# Attribution & conformity — derivation table (WO-5.2, canon v0.9.0)

**The rule (derive-never-invent, absolute for this slice):** every enum member,
shape field, and function contract added at v0.9.0 is DERIVED from the founder's
edited `/docs` (WO-5.2 PART A, A1–A10) — the governing sentence is quoted
verbatim beside each name. A name with no quote does not enter canon. Two
reviewer drafting errors were caught against canon before any derivation and
corrected by founder ruling: **A2** `released`→`captured` (Boutik §5.6 + the
ratified E2-taxonomy exclusion) and **A7** ambiguity-free charset → structural
schema (its own example `AICHA-4821` carried `I` and `1`). This document is repo
governance, not part of the drift-checked distribution set.

Citation form: `document § / edit-id at the canon/attribution branch`.

## 1. `conformity_mismatch` — the inspection-refusal reason (item 1)

| Canon | Governing quote (verbatim) | Source |
|---|---|---|
| `DELIVERY_FAILURE_REASONS += conformity_mismatch` | "Classify reason: `honest_absence \| … \| fraud \| **conformity_mismatch**`" · "Un refus valide à l'inspection porte le code `**conformity_mismatch**`." | Shop-Plus-Build-Spec §6.4 (A4) · Sera-Building-Plan SE5.1 (A3) |

**Asserts (no code change), item 1:**
- **DeliveryOutcome family** = `retry \| reschedule \| return \| incident` — MATCHES Séra spec after A1 (`return_required`→`return`); the ratified `return` naming holds.
- **Shop leg-status** = `held \| captured \| refunded` — MATCHES Shop §5.6 after the A2 correction (now value-identical to Boutik §5.6 l.143). The `released`-refuses-at-parse negative (`shapes.test.ts`) stays LIVE — no spec names `released` for escrow/payment legs.

## 2. `AttributionScope` · `AttributionRef` — the two portées (item 2)

| Canon | Governing quote (verbatim) | Source |
|---|---|---|
| `AttributionScope = 'product' \| 'identity'` | "**Attribution a deux portées.** **`product`** — le lien signé vers une offre précise … **`identity`** — l'identité permanente de la revendeuse" | Shop §4.1 (A6) |
| `AttributionRef.product = {resellerId, offerId, issuedAt, nonce, signature}`, offerId **required** | "**`product`** — le lien signé vers une offre précise : `{resellerId, offerId, issuedAt, nonce, signature}`. Inchangé ; il échoue fermé s'il est altéré." | Shop §4.1 (A6) |
| `AttributionRef.identity = {shortCode}`, no signature, offerId **forbidden** (`.strict()` refuses) | "**`identity`** — … son code court et sa vitrine. Portée résolue côté serveur, **sans signature**." · SP-I09b.4 "Une référence altérée … n'attribue personne" | Shop §4.1 (A6) · SP-I09b (A9) |

**Byte-compat (item 2, E1/E2 pins):** v0.8.0's `AttributionScope` meant the signed
token's TARGET (`{kind: listing\|store\|campaign, refId}`). A6 redefines the name
as the portée. The old target shape is **inlined into `AttributionToken`**
(`commerce.ts`) — the AttributionToken object parses the SAME bytes (proven:
`attribution.test.ts` "byte-compatible with v0.8.0"), only the standalone
`AttributionScope` export is retired. No external consumer imported it
(grep-confirmed); the snapshot bump records the API change deliberately.

## 3. `ResellerShortCode` — structural schema (item 3, A7 founder ruling)

| Canon | Governing quote (verbatim) | Source |
|---|---|---|
| `ResellerShortCodeSchema = /^[A-Z]{2,12}-[0-9]{4}$/` | "la partie nom = **2 à 12 lettres ASCII `A–Z`** … un seul trait d'union · **exactement 4 chiffres `0–9`**" | Shop §4.1 (A7) |
| `normalizeShortCode` (trim · upper · hyphen at the unique letter/digit boundary) | "insensible à la casse · espaces ignorés · séparateur absent ou remplacé par une espace accepté (`aicha4821`, `aicha 4821` → `AICHA-4821`, la frontière lettres/chiffres étant unique)" | Shop §4.1 (A7) |
| `shortCodeToSlug` = lowercase | "**Stockage canonique en majuscules ; slug d'URL en minuscules.**" · "`AICHA-4821` ↔ `/v/aicha-4821`" | Shop §4.1 (A7) |

**Negatives (item 3):** no digits · 5 digits · non-ASCII `É`/`Ï` · and a hostile
sweep proving normalization is UNAMBIGUOUS by construction — the hyphen is
inserted only for a compact `[A-Z]+[0-9]+` (one boundary); no constructible
input fabricates a wrong valid code (no finding). "**C'est la structure qui lève
l'ambiguïté** … et non une restriction de jeu de caractères."

## 4. `AttributionArrival` + versioned TTL (item 4, A8)

| Canon | Governing quote (verbatim) | Source |
|---|---|---|
| `AttributionArrival = {resellerId, scope, offerId?, arrivedAt, correlationId}` | "enregistre une arrivée : `{resellerId, scope, offerId?, arrivedAt, correlationId}`" | Shop §4.1 (A8) |
| `ARRIVAL_TTL_POLICY = {version, ttlDays: 30}` — policy DATA, not a constant | "une durée de validité **versionnée** (défaut : **30 jours** — donnée de politique, ajustable, **jamais silencieusement**)" | Shop §4.1 (A8) |

## 5. `resolveAttribution` — the precedence resolver (item 5, SP-I09b / A9)

| Arm | Governing quote (verbatim) | Source |
|---|---|---|
| 1 · locked ⇒ immutable, refuse re-attribution | "Une fois la commande **verrouillée**, l'attribution est **immuable** (`first-lock-wins`, inchangé) ; un second jeton valide … est refusé … sans ré-attribution silencieuse." | SP-I09b.3 (A9) |
| 2 · explicit code wins | "Un **code saisi explicitement au paiement** l'emporte — c'est l'acte délibéré de l'acheteuse." | SP-I09b.1 (A9) |
| 3 · else most-recent unexpired arrival | "Sinon, **l'arrivée non expirée la plus récente** l'emporte (*last-touch*)." | SP-I09b.2 (A9) |
| 4 · else NONE, never platform | "Une référence altérée, expirée ou non résolvable n'attribue **personne** et **ne bascule jamais vers la plateforme**." | SP-I09b.4 (A9) · A6 | 

The `{attributed:false, reason:'none'}` branch carries NO `resellerId`; there is
no platform-fallback branch in the function (asserted structurally).

## 6. `claim-state` enumeration — STILL DEFERRED (item 6)

No sentence in the edited `/docs` names a claim-state lifecycle. Per the standing
deferral (WO-0G ruling ④, unchanged), **the claim-state enum is NOT derived** —
inventing it is forbidden. Boutik's local claim vocabulary stays local to boutik.
Re-recorded here so the deferral is visible at v0.9.0; it opens only when a spec
sentence names the lifecycle.

## 7. Scope of the /docs edits

The ten PART A edits are exactly the founder's relayed text (A1–A10), located by
content, pre-edit asserted; the only non-founder token is the structural
`### 4.1 Attribution` heading hosting A6–A8/A10 (the founder's own subject-word).
Outer relay `« »` are delimiters; inner `« Livré par Séra »`/`« Paiement protégé »`
are content quotes, kept.
