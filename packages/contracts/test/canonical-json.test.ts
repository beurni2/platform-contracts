import { describe, expect, it } from 'vitest';
import { canonicalJsonStringify } from '../src/canonical-json.js';

describe('canonical JSON — byte-stable Quote/Order snapshots', () => {
  it('produces identical bytes regardless of key insertion order', () => {
    const a = { buyerTotal: 12_500, productSubtotal: 11_500, deliveryFee: 1_000 };
    const b = { deliveryFee: 1_000, buyerTotal: 12_500, productSubtotal: 11_500 };
    expect(canonicalJsonStringify(a)).toBe(canonicalJsonStringify(b));
    expect(canonicalJsonStringify(a)).toBe('{"buyerTotal":12500,"deliveryFee":1000,"productSubtotal":11500}');
  });

  it('sorts nested objects and preserves array order', () => {
    const value = { z: { b: 2, a: 1 }, list: [3, 1, 2] };
    expect(canonicalJsonStringify(value)).toBe('{"list":[3,1,2],"z":{"a":1,"b":2}}');
  });

  it('omits undefined object properties (optional Quote fields)', () => {
    expect(canonicalJsonStringify({ a: 1, campaignId: undefined })).toBe('{"a":1}');
  });

  it('hard-fails on values JSON cannot represent faithfully', () => {
    expect(() => canonicalJsonStringify({ a: Number.NaN })).toThrow(TypeError);
    expect(() => canonicalJsonStringify({ a: Infinity })).toThrow(TypeError);
    expect(() => canonicalJsonStringify({ a: [undefined] })).toThrow(TypeError);
    expect(() => canonicalJsonStringify({ a: () => 1 })).toThrow(TypeError);
    expect(() => canonicalJsonStringify(new Date())).toThrow(TypeError);
  });

  it('round-trips to the same bytes after parse (snapshot stability)', () => {
    const quoteLike = {
      id: 'q_1',
      buyerTotal: 11_379,
      productSubtotal: 10_779,
      deliveryFee: 600,
      taxFields: {},
      policyVersions: { settlementPolicyVersion: 'sp1', inspectionPolicyVersion: 'ip1' },
    };
    const once = canonicalJsonStringify(quoteLike);
    const twice = canonicalJsonStringify(JSON.parse(once));
    expect(twice).toBe(once);
  });
});
