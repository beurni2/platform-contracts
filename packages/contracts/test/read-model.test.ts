import { describe, expect, it } from 'vitest';
import { z } from 'zod';
import { makeReadModelSchema, consumeReadModel, type LeakSweep } from '../src/read-model.js';
import { IsoTimestampSchema } from '../src/shapes/common.js';
import { SupplyProjectionSchema } from '../src/shapes/commerce.js';
import { PayAtDoorEligibilitySchema } from '../src/shapes/settlement.js';

/*
 * WO-READ-MODEL-KIT — proves the kit reproduces the two real files it generalises:
 *   - shop-plus `packages/supply-consumer/src/{read-model,consumer}.ts` (SW-2)
 *   - platform  `apps/ops-console/src/refusal/feed.ts` (Desk 6, merged d54be53)
 * Every boundary below cites the file it is copied from. No boundary is chosen here.
 */

// The SW-1↔SW-2 supplier-identity sweep, VERBATIM from read-model.ts:33 +
// consumer.ts `hasIdentityLeak` — supply's caller-passed leakSweep. Eligibility
// passes NONE (its buyer-PII is refused by the strict value schema alone, feed.ts).
const IDENTITY_LEAK = /supplier[_-]?(id|name|phone|contact)|phone|whatsapp|pickup|adresse|address/i;
const supplyLeakSweep: LeakSweep = (raw) => {
  if (raw === null || typeof raw !== 'object') return false;
  const value = (raw as { value?: unknown }).value;
  if (value === null || typeof value !== 'object') return false;
  return Object.keys(value as object).some((k) => IDENTITY_LEAK.test(k));
};

const SUPPLY_MAX_AGE_MS = 15 * 60 * 1000; // read-model.ts SUPPLY_PROJECTION_MAX_AGE_MS (founder 2026-07-15)
const ELIGIBILITY_MAX_AGE_MS = 60 * 1000; // feed.ts ELIGIBILITY_MAX_AGE_MS (founder 2026-07-20)

const validSupplyValue = {
  productVersionId: 'pv_1',
  offerVersion: '1',
  basePrice: 10_000,
  resellerCommission: 1_000,
  available: 5,
  productName: 'Savon de karité', // SUPPLY-DISPLAY-FIELDS-1 (now required on SupplyProjection)
  assetRefs: ['media/pv_1/hero.jpg'],
};
const validEligValue = {
  buyerRef: 'buyer_1',
  state: 'eligible',
  buyerRefusalCount: 0,
  buyerRiskState: 'clean',
  requiredDeposit: 0,
};

const NOW = '2026-07-21T12:00:00.000Z';
const NOW_MS = Date.parse(NOW);
const isoAgo = (ms: number) => new Date(NOW_MS - ms).toISOString();

describe('makeReadModelSchema — the read-model envelope, once', () => {
  const supplyEnvelope = makeReadModelSchema(SupplyProjectionSchema);

  it('is byte-equivalent to consumer.ts SupplyReadModelSchema (read-model.ts:44-51)', () => {
    // The literal definition transcribed from shop-plus read-model.ts:44-51.
    const reference = z
      .object({
        version: z.number().int().min(1),
        asOf: IsoTimestampSchema,
        value: SupplyProjectionSchema,
      })
      .strict();
    expect(z.toJSONSchema(supplyEnvelope, { io: 'output', unrepresentable: 'any' })).toEqual(
      z.toJSONSchema(reference, { io: 'output', unrepresentable: 'any' }),
    );
  });

  it('accepts a valid envelope and passes the value through (both value shapes)', () => {
    const s = supplyEnvelope.safeParse({ version: 2, asOf: NOW, value: validSupplyValue });
    expect(s.success).toBe(true);
    if (s.success) expect(s.data.value).toEqual(validSupplyValue);

    const e = makeReadModelSchema(PayAtDoorEligibilitySchema).safeParse({
      version: 1,
      asOf: NOW,
      value: validEligValue,
    });
    expect(e.success).toBe(true);
  });

  it('.strict() refuses an undeclared envelope key (consumer.ts SupplyReadModelSchema.strict / feed.ts ENVELOPE_KEYS)', () => {
    const r = supplyEnvelope.safeParse({ version: 1, asOf: NOW, value: validSupplyValue, extra: 'x' });
    expect(r.success).toBe(false);
  });

  it('version: integer ≥ 1 (feed.ts parseEligibilityReadModel version check)', () => {
    for (const bad of [0, -1, 1.5]) {
      expect(supplyEnvelope.safeParse({ version: bad, asOf: NOW, value: validSupplyValue }).success).toBe(
        false,
      );
    }
    expect(supplyEnvelope.safeParse({ version: 1, asOf: NOW, value: validSupplyValue }).success).toBe(true);
  });

  it('asOf: canon IsoTimestampSchema — empty string refused', () => {
    expect(supplyEnvelope.safeParse({ version: 1, asOf: '', value: validSupplyValue }).success).toBe(false);
  });

  it('a missing envelope key is refused (envelope incomplete)', () => {
    expect(supplyEnvelope.safeParse({ asOf: NOW, value: validSupplyValue }).success).toBe(false);
    expect(supplyEnvelope.safeParse({ version: 1, value: validSupplyValue }).success).toBe(false);
    expect(supplyEnvelope.safeParse({ version: 1, asOf: NOW }).success).toBe(false);
  });

  it('a non-contract value is refused by the inner strict schema (a planted key fails here)', () => {
    const r = supplyEnvelope.safeParse({
      version: 1,
      asOf: NOW,
      value: { ...validSupplyValue, supplierPhone: '+226...' },
    });
    expect(r.success).toBe(false);
  });
});

describe('consumeReadModel — reproduces feed.ts + consumer.ts verdicts, step for step', () => {
  const supplyOpts = {
    schema: makeReadModelSchema(SupplyProjectionSchema),
    maxAgeMs: SUPPLY_MAX_AGE_MS,
    now: NOW,
    leakSweep: supplyLeakSweep,
  };
  const eligOpts = {
    schema: makeReadModelSchema(PayAtDoorEligibilitySchema),
    maxAgeMs: ELIGIBILITY_MAX_AGE_MS,
    now: NOW,
  };

  it('absent — null and undefined both → absent (consumer.ts:53; feed.ts consumeEligibility)', () => {
    expect(consumeReadModel(null, supplyOpts)).toEqual({ status: 'absent' });
    expect(consumeReadModel(undefined, supplyOpts)).toEqual({ status: 'absent' });
    expect(consumeReadModel(null, eligOpts)).toEqual({ status: 'absent' });
  });

  it('rejected/not_a_read_model — no envelope (feed.ts hasEnvelope=false path)', () => {
    expect(consumeReadModel(42, supplyOpts)).toEqual({ status: 'rejected', reason: 'not_a_read_model' });
    expect(consumeReadModel({ foo: 1 }, supplyOpts)).toEqual({
      status: 'rejected',
      reason: 'not_a_read_model',
    });
  });

  it('rejected/payload_not_contract_shaped — envelope present, value not contract-shaped (feed.ts hasEnvelope=true path)', () => {
    const badValue = { version: 2, asOf: NOW, value: { ...validSupplyValue, available: -1 } };
    expect(consumeReadModel(badValue, supplyOpts)).toEqual({
      status: 'rejected',
      reason: 'payload_not_contract_shaped',
    });
    // an extra envelope key is envelope-present-but-not-contract-shaped, too (.strict())
    expect(
      consumeReadModel({ version: 2, asOf: NOW, value: validSupplyValue, extra: 1 }, supplyOpts),
    ).toEqual({ status: 'rejected', reason: 'payload_not_contract_shaped' });
  });

  it('rejected/identity_material_refused — supply leakSweep BEFORE parse (consumer.ts:56-58 order proof)', () => {
    // The raw both LEAKS (supplierPhone in value) AND is malformed (available missing).
    // Sweep-before-parse ⇒ identity_material_refused WINS. Sweep-after-parse would have
    // returned payload_not_contract_shaped — this asserts the order is not incidental.
    const { available: _drop, ...noAvailable } = validSupplyValue;
    const leakyAndMalformed = {
      version: 2,
      asOf: NOW,
      value: { ...noAvailable, supplierPhone: '+226...' },
    };
    expect(consumeReadModel(leakyAndMalformed, supplyOpts)).toEqual({
      status: 'rejected',
      reason: 'identity_material_refused',
    });
  });

  it('eligibility has NO sweep — buyer-PII is refused by the strict schema alone (feed.ts posture)', () => {
    // Same class of planted-PII, but eligibility passes no leakSweep. The strict
    // value schema rejects it → payload_not_contract_shaped, NOT identity_material_refused.
    const leakyElig = { version: 2, asOf: NOW, value: { ...validEligValue, buyerPhone: '+226...' } };
    expect(consumeReadModel(leakyElig, eligOpts)).toEqual({
      status: 'rejected',
      reason: 'payload_not_contract_shaped',
    });
  });

  it('age edge — ageMs === maxAgeMs is FRESH; ageMs > maxAgeMs is STALE (consumer.ts:71; feed.ts, strictly >)', () => {
    // exactly at the bound → fresh (equality stays fresh)
    const atBound = { version: 3, asOf: isoAgo(SUPPLY_MAX_AGE_MS), value: validSupplyValue };
    expect(consumeReadModel(atBound, supplyOpts)).toEqual({
      status: 'fresh',
      value: validSupplyValue,
      asOf: isoAgo(SUPPLY_MAX_AGE_MS),
      version: 3,
    });
    // one ms beyond → stale, carrying asOf + measured ageMs
    const beyond = { version: 3, asOf: isoAgo(SUPPLY_MAX_AGE_MS + 1), value: validSupplyValue };
    expect(consumeReadModel(beyond, supplyOpts)).toEqual({
      status: 'stale',
      asOf: isoAgo(SUPPLY_MAX_AGE_MS + 1),
      ageMs: SUPPLY_MAX_AGE_MS + 1,
    });
  });

  it('fresh within the bound carries value + asOf + version (both callers)', () => {
    const supply = { version: 7, asOf: isoAgo(1_000), value: validSupplyValue };
    expect(consumeReadModel(supply, supplyOpts)).toEqual({
      status: 'fresh',
      value: validSupplyValue,
      asOf: isoAgo(1_000),
      version: 7,
    });
    const elig = { version: 4, asOf: isoAgo(1_000), value: validEligValue };
    expect(consumeReadModel(elig, eligOpts)).toEqual({
      status: 'fresh',
      value: validEligValue,
      asOf: isoAgo(1_000),
      version: 4,
    });
  });

  it('now is consumed, not defaulted — the SAME read is fresh at one now and stale at a later now', () => {
    const read = { version: 1, asOf: isoAgo(0), value: validEligValue }; // asOf = NOW
    expect(consumeReadModel(read, { ...eligOpts, now: NOW }).status).toBe('fresh');
    const later = new Date(NOW_MS + ELIGIBILITY_MAX_AGE_MS + 1).toISOString();
    expect(consumeReadModel(read, { ...eligOpts, now: later }).status).toBe('stale');
  });

  it('the different per-caller bounds are honoured — a read stale for eligibility is fresh for supply', () => {
    // aged 90s: past eligibility's 60s bound, well within supply's 15min bound.
    const aged = { version: 1, asOf: isoAgo(90 * 1000), value: validSupplyValue };
    expect(consumeReadModel(aged, supplyOpts).status).toBe('fresh');
    const agedElig = { version: 1, asOf: isoAgo(90 * 1000), value: validEligValue };
    expect(consumeReadModel(agedElig, eligOpts).status).toBe('stale');
  });
});
