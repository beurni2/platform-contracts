import { z } from 'zod';
import { IsoTimestampSchema } from './shapes/common.js';

/**
 * THE READ-MODEL KIT (WO-READ-MODEL-KIT) — the shared read-model envelope and
 * consume pipeline, extracted ONCE from the two consumers that already ship it
 * verbatim:
 *   - shop-plus SW-2 supply consumer — `packages/supply-consumer/src/consumer.ts`
 *     + `.../read-model.ts` (repo `shop-plus`, on `main`).
 *   - platform ops-console eligibility feed — `apps/ops-console/src/refusal/feed.ts`
 *     (repo `platform`, merged `d54be53`).
 * This GENERALISES what those two files ACTUALLY do — the same envelope, the same
 * verdict union, the same boundaries — and nothing more. It invents no wire, no
 * second pattern, no policy.
 *
 * MECHANISM, NEVER POLICY — the safety line. The kit ships NO default freshness
 * bound and NO default identity sweep. `maxAgeMs` and `leakSweep` are per-caller
 * PARAMETERS: supply passes 15 min (founder ruling 2026-07-15) + its
 * supplier-identity `IDENTITY_LEAK` sweep; eligibility passes 60 s (founder ruling
 * 2026-07-20) + NO sweep — its buyer-PII is refused by the strict value schema
 * alone. Those different founder rulings and those different protections are
 * preserved by staying per-caller; the kit homogenises neither.
 *
 * AUTH IS OUT. This module is schema + freshness only. The authenticated
 * transport, the pull port, and eligibility's transport-level `unreachable`
 * verdict stay in the caller (feed.ts wraps this kit) — deferred to
 * ELIGIBILITY-WIRE-AUTH. No auth surface is added here.
 */

/**
 * The read-model envelope schema, generic over the caller's canon value shape.
 * Byte-equivalent to shop-plus's `SupplyReadModelSchema` (`consumer`'s
 * `read-model.ts`): the SAME three fields, the SAME constraints — `version` an
 * integer ≥ 1 · `asOf` the canon `IsoTimestampSchema` (reused, never redefined) ·
 * `value` the caller's schema — and the SAME `.strict()` (an undeclared envelope
 * key is refused). platform feed.ts hand-rolls the identical envelope in
 * `parseEligibilityReadModel` (strict 3-key set, `version` int ≥ 1, `asOf` via
 * `IsoTimestampSchema`, `value` via the canon value schema); this is that
 * envelope, expressed once.
 */
export function makeReadModelSchema<V extends z.ZodTypeAny>(valueSchema: V) {
  return z
    .object({
      version: z.number().int().min(1),
      asOf: IsoTimestampSchema,
      value: valueSchema,
    })
    .strict();
}

/** A read-model parsed through {@link makeReadModelSchema}. */
export type ReadModel<V> = { readonly version: number; readonly asOf: string; readonly value: V };

/** Extract the inner value type carried by a {@link makeReadModelSchema} envelope. */
type EnvelopeValue<V extends z.ZodTypeAny> = z.infer<V> extends { value: infer T } ? T : never;

/**
 * The verdict — EXACTLY shop-plus SW-2's `SupplyVerdict` and platform feed.ts's
 * `EligibilityVerdict` raw-consume union, generalised: `fresh | stale | absent |
 * rejected`. `fresh` carries the parsed `value`, its `asOf`, its `version`;
 * `stale` carries `asOf` + the measured `ageMs`; `absent` is bare; `rejected`
 * carries a reason. `identity_material_refused` is reachable ONLY when a
 * `leakSweep` is passed (supply); the two parse reasons reproduce both files'
 * `hasEnvelope` classification verbatim. Eligibility's transport `unreachable`
 * is NOT here — it lives in feed.ts's pull wrapper, above this raw-consume.
 */
export type ReadModelVerdict<V> =
  | { readonly status: 'fresh'; readonly value: V; readonly asOf: string; readonly version: number }
  | { readonly status: 'stale'; readonly asOf: string; readonly ageMs: number }
  | { readonly status: 'absent' }
  | {
      readonly status: 'rejected';
      readonly reason: 'not_a_read_model' | 'payload_not_contract_shaped' | 'identity_material_refused';
    };

/**
 * A caller-supplied identity/PII sweep: given the RAW pulled payload (unparsed),
 * return `true` to refuse it closed. Runs BEFORE the schema parse — mirroring
 * consumer.ts, where the sweep is the named, independent line of defence that
 * yields `identity_material_refused` even on a payload the strict parse would
 * also reject (`consumer.ts` `consumeSupplyProjection`; sweep `hasIdentityLeak`
 * navigates to `raw.value` keys). The kit ships none; the caller passes its own.
 */
export type LeakSweep = (raw: unknown) => boolean;

/** Options for {@link consumeReadModel}. All freshness/sweep policy is the caller's. */
export interface ConsumeReadModelOptions<V extends z.ZodTypeAny> {
  /** The envelope schema built by {@link makeReadModelSchema}. */
  readonly schema: V;
  /** Freshness bound in milliseconds. NO default — the caller's founder ruling (supply 15 min, eligibility 60 s). */
  readonly maxAgeMs: number;
  /** The current instant, as an ISO timestamp. REQUIRED — the kit keeps no clock of its own. */
  readonly now: string;
  /** Optional identity/PII sweep, run BEFORE parse. NO default. */
  readonly leakSweep?: LeakSweep;
}

/**
 * Consume one pulled read-model into a verdict, reproducing consumer.ts's
 * `consumeSupplyProjection` and feed.ts's `consumeEligibility` (raw path) STEP
 * FOR STEP:
 *
 *   1. absent — `raw === undefined || raw === null` → `absent`.
 *   2. leak — a passed `leakSweep` returning true → `rejected` /
 *      `identity_material_refused`, BEFORE the parse.
 *   3. parse — `schema.safeParse(raw)`; on failure classify by `hasEnvelope`
 *      (the three keys `version|asOf|value` present) into
 *      `payload_not_contract_shaped` vs `not_a_read_model`.
 *   4. age — `Date.parse(now) − Date.parse(asOf) > maxAgeMs` → `stale`
 *      (STRICTLY greater; equality at the bound is still `fresh`).
 *   5. otherwise `fresh`.
 *
 * Pure: no clock of its own, no I/O, never throws.
 */
export function consumeReadModel<V extends z.ZodTypeAny>(
  raw: unknown,
  options: ConsumeReadModelOptions<V>,
): ReadModelVerdict<EnvelopeValue<V>> {
  const { schema, maxAgeMs, now, leakSweep } = options;

  // 1. absent — null or undefined, before anything else (consumer.ts / feed.ts).
  if (raw === undefined || raw === null) return { status: 'absent' };

  // 2. identity sweep FIRST — refused closed, never merely dropped (consumer.ts).
  if (leakSweep !== undefined && leakSweep(raw)) {
    return { status: 'rejected', reason: 'identity_material_refused' };
  }

  // 3. strict envelope+value parse; a failure is classified by hasEnvelope —
  //    "not a read-model" vs "envelope present but not contract-shaped" —
  //    verbatim from both files' parse.
  const parsed = schema.safeParse(raw);
  if (!parsed.success) {
    const hasEnvelope =
      typeof raw === 'object' && raw !== null && 'version' in raw && 'asOf' in raw && 'value' in raw;
    return {
      status: 'rejected',
      reason: hasEnvelope ? 'payload_not_contract_shaped' : 'not_a_read_model',
    };
  }
  const model = parsed.data as ReadModel<EnvelopeValue<V>>;

  // 4. freshness — strictly beyond the bound is stale; equality stays fresh.
  const ageMs = Date.parse(now) - Date.parse(model.asOf);
  if (ageMs > maxAgeMs) {
    return { status: 'stale', asOf: model.asOf, ageMs };
  }

  // 5. fresh — the only verdict that may back a gated action.
  return { status: 'fresh', value: model.value, asOf: model.asOf, version: model.version };
}
