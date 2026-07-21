# The read-model kit — derivation record (WO-READ-MODEL-KIT, canon v1.2.0)

**What it is:** `packages/contracts/src/read-model.ts` — two exports,
`makeReadModelSchema` and `consumeReadModel`, that GENERALISE the read-model
envelope + consume pipeline **already shipped verbatim** in two consumers. It
invents nothing: every field and every boundary is transcribed from real code.

## The two real sources (read, not remembered)

| source | repo · path | role |
|---|---|---|
| **SW-2 supply consumer** | `shop-plus` · `packages/supply-consumer/src/{read-model,consumer}.ts` (on `main`) | the envelope `SupplyReadModelSchema` + `consumeSupplyProjection` + the supplier-identity sweep |
| **Desk-6 eligibility feed** | `platform` · `apps/ops-console/src/refusal/feed.ts` (merged `d54be53`) | the hand-rolled envelope `parseEligibilityReadModel` + `consumeEligibility` (raw path) |

## makeReadModelSchema — the envelope, once

`z.object({ version: z.number().int().min(1), asOf: IsoTimestampSchema, value })
.strict()`. This is **byte-equivalent** to shop-plus `read-model.ts`'s
`SupplyReadModelSchema` (same three fields, same constraints, same `.strict()`;
`IsoTimestampSchema` **reused** from canon `common.ts:10`, never redefined). It
is behaviourally equivalent to feed.ts's hand-rolled `parseEligibilityReadModel`
(strict 3-key set, `version` int ≥ 1, `asOf` via `IsoTimestampSchema`, `value`
via the canon value schema). Proven in `test/read-model.test.ts` by asserting
`z.toJSONSchema(makeReadModelSchema(SupplyProjectionSchema))` equals the
transcribed literal of `read-model.ts:44-51`.

## consumeReadModel — the pipeline, step for step

`absent → leakSweep → parse → age`, reproducing both files:

1. **absent** — `raw === undefined || raw === null` → `absent` (`consumer.ts:53`;
   feed.ts `consumeEligibility`).
2. **leak** — a passed `leakSweep` returning true → `rejected` /
   `identity_material_refused`, **BEFORE parse** (`consumer.ts:56-58`).
3. **parse** — `schema.safeParse`; a failure is classified by `hasEnvelope`
   (the three keys present) into `payload_not_contract_shaped` vs
   `not_a_read_model` — **verbatim** in both files.
4. **age** — `Date.parse(now) − Date.parse(asOf) > maxAgeMs` → `stale`
   (**strictly** greater; equality at the bound is `fresh`) (`consumer.ts:71`;
   feed.ts).
5. otherwise **`fresh`** (carries `value`, `asOf`, `version`).

Verdict union `fresh | stale | absent | rejected` — exactly SW-2's
`SupplyVerdict` and feed.ts's `EligibilityVerdict` raw-consume union.

## The four boundaries — as FOUND, not chosen (feed.ts vs consumer.ts agree)

| # | boundary | `consumer.ts` | `feed.ts` | outcome |
|---|---|---|---|---|
| 1 | leak → verdict | `rejected`/`identity_material_refused`, swept **before parse** (`consumer.ts:56-58`; sweep `read-model.ts:33`) | **no sweep** — buyer-PII refused by strict `PayAtDoorEligibilitySchema` | **no conflict** — `leakSweep` is a per-caller param; the sweep-order comes from the only file that sweeps |
| 2 | age edge | `ageMs > MAX → stale`, equality fresh (`consumer.ts:71`) | `ageMs > ELIGIBILITY_MAX_AGE_MS → stale` | **agree: `>`** |
| 3 | absent | `raw === undefined \|\| raw === null` (`consumer.ts:53`) | same | **agree: null‖undefined** |
| 4 | now | required `nowIso` string, `Date.parse` (`consumer.ts:76`) | required `nowIso` string, `Date.parse` | **agree: required ISO string** |

No disagreement → no STOP. The `hasEnvelope` reason classification and the
`{status:'stale', asOf, ageMs}` payload are **byte-identical** across both files.

## Two reconciliations (recorded, not papered over)

1. **Sweep order — code over the WO's prose.** The WO described "strict-parse →
   leakSweep → age". The *code* (`consumer.ts`, the only file with a sweep)
   sweeps **before** parse. The founder ruled: generalise what the files
   actually do. So the kit sweeps **before** parse — load-bearing: a raw that
   both leaks and is malformed yields `identity_material_refused`, not
   `payload_not_contract_shaped` (asserted in the order-proof test). Sweep-after
   would never fire, because a strict value schema already rejects the leaked key.
2. **`unreachable` stays in feed.ts.** feed.ts's `consumeEligibility` maps a
   transport failure (`!pull.ok`) to `unreachable` **before** the raw path. That
   is a transport-wrapper concern, outside the WO's `fresh|stale|absent|rejected`
   union and outside a raw-only kit. It stays in feed.ts's pull wrapper; the kit
   does not absorb it. (When feed.ts migrates to the kit next slice, it keeps
   `if (!pull.ok) return unreachable;` and delegates the rest.)

## Mechanism, never policy — the safety line

`maxAgeMs` and `leakSweep` are **caller parameters with no defaults**. Supply
passes **15 min** (`read-model.ts` `SUPPLY_PROJECTION_MAX_AGE_MS`, founder
2026-07-15) + its `IDENTITY_LEAK` supplier-identity sweep. Eligibility passes
**60 s** (`feed.ts` `ELIGIBILITY_MAX_AGE_MS`, founder 2026-07-20) + **no** sweep
(buyer-PII refused by its strict value schema alone). Those two founder rulings
and those two different protections are preserved by staying per-caller — the kit
homogenises neither. **Auth is out**: schema + freshness only; the authenticated
transport, the pull port, and `unreachable` stay deferred to ELIGIBILITY-WIRE-AUTH.

## Scope, version & delta

**Root-only** — the three consumers (`offer-service`, shop-plus
`supply-consumer`, platform `feed.ts`) are **untouched**; migrating them to the
kit is the next slice, with before/after verdict-identity tests. **Additive**:
new exports only. **MINOR** bump, lockstep: six `package.json` + intra-deps +
`run-gates --pinned-version` (×2) + both `docs.manifest.json` (packageVersion
only; all 11 doc hashes stable) + api-surface `packageVersion` → **1.2.0**;
lockfile re-resolved. **api-surface delta (real keys):** **+2 exports**
(`makeReadModelSchema`, `consumeReadModel`, both `function`), **0 schemas** added/
removed/changed, nothing else moved. Docs drift-check passes (source export, not
a docs change). `ci.yml` unchanged (already carries `workflow_dispatch:` from
WO-VITRINE).
