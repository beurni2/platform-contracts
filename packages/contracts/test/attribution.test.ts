import { describe, expect, it } from 'vitest';
import {
  AttributionScopeSchema,
  AttributionRefSchema,
  AttributionArrivalSchema,
  ResellerShortCodeSchema,
  normalizeShortCode,
  shortCodeToSlug,
  ARRIVAL_TTL_POLICY,
  resolveAttribution,
  type AttributionArrival,
} from '../src/shapes/attribution.js';
import { AttributionTokenSchema } from '../src/shapes/commerce.js';
import { DELIVERY_FAILURE_REASONS, DeliveryFailureReasonSchema } from '../src/enums.js';

// WO-5.2 canon v0.9.0 — attribution (A6–A9) + conformity_mismatch (A3+A4).
// Every assertion protects a derived invariant; derivations quoted in
// docs/derivations/ATTRIBUTION-AND-CONFORMITY.md.

const arrival = (resellerId: string, arrivedAt: string, extra: Partial<AttributionArrival> = {}): AttributionArrival => ({
  resellerId,
  scope: 'identity',
  arrivedAt,
  correlationId: `corr_${resellerId}`,
  ...extra,
});

describe('AttributionScope — two portées (A6)', () => {
  it('is exactly product | identity', () => {
    expect(AttributionScopeSchema.options).toEqual(['product', 'identity']);
  });
});

describe('AttributionRef — offerId required on product, FORBIDDEN on identity (A6, item 2)', () => {
  const product = {
    scope: 'product' as const,
    resellerId: 'r_1',
    offerId: 'off_1',
    issuedAt: '2026-07-12T00:00:00.000Z',
    nonce: 'n_1',
    signature: 'sig_1',
  };

  it('the signed product form parses (byte-shape = A6 {resellerId, offerId, issuedAt, nonce, signature})', () => {
    expect(AttributionRefSchema.safeParse(product).success).toBe(true);
  });

  it('a product ref MISSING offerId refuses', () => {
    const { offerId, ...noOffer } = product;
    void offerId;
    expect(AttributionRefSchema.safeParse(noOffer).success).toBe(false);
  });

  it('an identity ref carrying an offerId REFUSES at parse (strict; item 2)', () => {
    const leak = { scope: 'identity', shortCode: 'AICHA-4821', offerId: 'off_1' };
    expect(AttributionRefSchema.safeParse(leak).success).toBe(false);
  });

  it('a bare identity ref (short code only, no signature) parses', () => {
    expect(AttributionRefSchema.safeParse({ scope: 'identity', shortCode: 'AICHA-4821' }).success).toBe(true);
  });
});

describe('ResellerShortCode — structural schema (A7, founder ruling)', () => {
  it('accepts the canonical example AICHA-4821 and its slug is the lowercase identifier', () => {
    expect(ResellerShortCodeSchema.safeParse('AICHA-4821').success).toBe(true);
    expect(shortCodeToSlug('AICHA-4821')).toBe('/v/aicha-4821');
  });

  it('the forgiving normalizer inserts the hyphen at the unique letter/digit boundary', () => {
    expect(normalizeShortCode('aicha4821')).toBe('AICHA-4821');
    expect(normalizeShortCode('aicha 4821')).toBe('AICHA-4821');
    expect(normalizeShortCode('  AICHA-4821 ')).toBe('AICHA-4821');
  });

  it('NEGATIVE: a code with no digits refuses', () => {
    expect(ResellerShortCodeSchema.safeParse('AICHA').success).toBe(false);
    expect(ResellerShortCodeSchema.safeParse(normalizeShortCode('AICHA')).success).toBe(false);
  });

  it('NEGATIVE: a code with 5 digits refuses', () => {
    expect(ResellerShortCodeSchema.safeParse('AICHA-48210').success).toBe(false);
  });

  it('NEGATIVE: a non-ASCII letter (É) refuses (canonical is A–Z after accent-stripping)', () => {
    expect(ResellerShortCodeSchema.safeParse('AÏCHA-4821').success).toBe(false);
    expect(ResellerShortCodeSchema.safeParse('AÉCHA-4821').success).toBe(false);
  });

  it("normalization is UNAMBIGUOUS by construction — no constructible input yields a wrong valid code", () => {
    // A6/A7: "la frontière lettres/chiffres étant unique." The normalizer inserts
    // a hyphen only when the compact form is exactly [A-Z]+[0-9]+ (one boundary);
    // any other arrangement passes through and fails the schema. Probe the
    // failure classes rather than assert absence blindly.
    for (const hostile of ['4821AICHA', 'AI4C8A21', 'AICHA-48-21', 'A1B2C3D4']) {
      const normalized = normalizeShortCode(hostile);
      // it must NEVER become a valid code by fabrication
      if (ResellerShortCodeSchema.safeParse(normalized).success) {
        // if this ever fires, it is a finding — the boundary was not unique
        expect(normalized, `hostile ${hostile} fabricated a valid code`).toBe('UNREACHABLE');
      }
    }
    expect(true).toBe(true);
  });
});

describe('AttributionArrival + versioned TTL policy (A8)', () => {
  it('the shape is {resellerId, scope, offerId?, arrivedAt, correlationId} and offerId is optional', () => {
    expect(AttributionArrivalSchema.safeParse(arrival('r_1', '2026-07-12T00:00:00.000Z')).success).toBe(true);
    expect(
      AttributionArrivalSchema.safeParse(arrival('r_1', '2026-07-12T00:00:00.000Z', { scope: 'product', offerId: 'off_1' }))
        .success,
    ).toBe(true);
  });

  it('the TTL is versioned policy data (30 days), never a bare constant', () => {
    expect(ARRIVAL_TTL_POLICY.ttlDays).toBe(30);
    expect(ARRIVAL_TTL_POLICY.version).toBe('attribution-arrival-ttl.v1');
  });
});

describe('the SP-I09b precedence resolver (A9) — four arms', () => {
  const now = '2026-07-12T12:00:00.000Z';
  const ttl = ARRIVAL_TTL_POLICY.ttlDays;

  it('ARM 1 — an explicit code at payment WINS over any arrival (deliberate act)', () => {
    const r = resolveAttribution({
      explicitResellerId: 'r_explicit',
      arrivals: [arrival('r_arrival', '2026-07-12T11:00:00.000Z')],
      nowIso: now,
      ttlDays: ttl,
    });
    expect(r).toEqual({ attributed: true, resellerId: 'r_explicit', source: 'explicit_code' });
  });

  it('ARM 2 — no explicit code → the MOST RECENT unexpired arrival wins (last-touch)', () => {
    const r = resolveAttribution({
      arrivals: [
        arrival('r_old', '2026-07-01T00:00:00.000Z'),
        arrival('r_recent', '2026-07-11T00:00:00.000Z'),
        arrival('r_mid', '2026-07-05T00:00:00.000Z'),
      ],
      nowIso: now,
      ttlDays: ttl,
    });
    expect(r).toEqual({ attributed: true, resellerId: 'r_recent', source: 'arrival' });
  });

  it('ARM 3 — a LOCKED order is immutable: a fresh code does NOT re-attribute (first-lock-wins)', () => {
    const r = resolveAttribution({
      lockedResellerId: 'r_locked',
      explicitResellerId: 'r_new_attempt',
      arrivals: [arrival('r_arrival', now)],
      nowIso: now,
      ttlDays: ttl,
    });
    expect(r).toEqual({ attributed: true, resellerId: 'r_locked', source: 'locked' });
  });

  it('ARM 4 — no explicit code and no unexpired arrival → NONE, and NEVER the platform', () => {
    const r = resolveAttribution({ arrivals: [], nowIso: now, ttlDays: ttl });
    expect(r).toEqual({ attributed: false, reason: 'none' });
    // structurally impossible to fall back to a platform id — there is no such branch
    expect('resellerId' in r).toBe(false);
  });

  it('NEGATIVE — an EXPIRED arrival is excluded (past TTL) → NONE when it is the only one', () => {
    const expired = arrival('r_stale', '2026-05-01T00:00:00.000Z'); // > 30 days before now
    const r = resolveAttribution({ arrivals: [expired], nowIso: now, ttlDays: ttl });
    expect(r).toEqual({ attributed: false, reason: 'none' });
  });
});

describe('conformity_mismatch reason (A3 + A4)', () => {
  it('parses as a delivery-failure reason', () => {
    expect(DeliveryFailureReasonSchema.safeParse('conformity_mismatch').success).toBe(true);
    expect(DELIVERY_FAILURE_REASONS).toContain('conformity_mismatch');
  });

  it('NEGATIVE — an unknown reason code refuses', () => {
    expect(DeliveryFailureReasonSchema.safeParse('does_not_conform').success).toBe(false);
  });
});

describe('AttributionToken — byte-compatible with v0.8.0 (E1/E2 pins must not break)', () => {
  it('the signed token still parses its listing|store|campaign target scope unchanged', () => {
    const token = {
      id: 't_1',
      resellerId: 'r_1',
      scope: { kind: 'listing', refId: 'lst_1' },
      issued: '2026-07-12T00:00:00.000Z',
      expiry: '2026-08-12T00:00:00.000Z',
      signature: 'sig',
      version: 'v1',
    };
    expect(AttributionTokenSchema.safeParse(token).success).toBe(true);
    // a scope.kind outside the target set still refuses (target unchanged)
    expect(AttributionTokenSchema.safeParse({ ...token, scope: { kind: 'product', refId: 'x' } }).success).toBe(false);
  });
});
