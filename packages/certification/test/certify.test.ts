import { describe, expect, it } from 'vitest';
import { CERTIFICATION_BEHAVIORS, certifyAdapter } from '../src/certify.js';
import { REFERENCE_ADAPTERS, referencePaymentProviderMock } from '../src/reference/adapters.js';
import { makeDeficient } from '../src/negative/deficient.js';

describe('§3 mock certification — reference adapters', () => {
  it.each(REFERENCE_ADAPTERS.map((a) => [a.domain, a] as const))(
    '%s reference mock certifies 8/8 with every behavior individually passing',
    async (_domain, adapter) => {
      const card = await certifyAdapter(adapter);
      for (const result of card.results) {
        expect(result.passed, `${card.domain} · ${result.behavior}: ${result.detail}`).toBe(true);
      }
      expect(card.results).toHaveLength(8);
      expect(card.score).toBe('8/8');
      expect(card.certified).toBe(true);
    },
  );
});

describe('§3 mock certification — NEGATIVE: no partial passes, ever', () => {
  it.each(CERTIFICATION_BEHAVIORS.map((b) => [b] as const))(
    'a mock missing "%s" is NOT certified, and exactly that behavior fails',
    async (behavior) => {
      const deficient = makeDeficient(referencePaymentProviderMock, behavior);
      const card = await certifyAdapter(deficient);
      expect(card.certified).toBe(false);
      expect(card.score).toBe('7/8');
      const failing = card.results.filter((r) => !r.passed);
      expect(failing.map((r) => r.behavior)).toEqual([behavior]);
    },
  );
});
