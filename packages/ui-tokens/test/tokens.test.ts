import { describe, expect, it } from 'vitest';
import { boutikPlusTheme, seraTheme, shopPlusTheme, themes } from '../src/themes.js';
import { touch, typeScale } from '../src/family.js';

describe('ui-tokens — one family DNA, three themes', () => {
  it('exposes exactly the three app themes', () => {
    expect(Object.keys(themes).sort()).toEqual(['boutik-plus', 'sera', 'shop-plus']);
  });

  it('themes share the family DNA (type, spacing, radius, elevation, motion, touch)', () => {
    for (const theme of [boutikPlusTheme, shopPlusTheme, seraTheme]) {
      expect(theme.typeScale).toBe(typeScale);
      expect(theme.touch.minTargetPx).toBeGreaterThanOrEqual(44);
      expect(theme.colors.surface).toBe('#FAF7F2'); // warm neutral surface, shared
    }
  });

  it('each theme has its own identity color, but one shared verified-badge language', () => {
    const primaries = new Set([
      boutikPlusTheme.colors.primary,
      shopPlusTheme.colors.primary,
      seraTheme.colors.primary,
    ]);
    expect(primaries.size).toBe(3);
    expect(boutikPlusTheme.colors.verifiedBadge).toBe(shopPlusTheme.colors.verifiedBadge);
    expect(shopPlusTheme.colors.verifiedBadge).toBe(seraTheme.colors.verifiedBadge);
  });

  it('FCFA display type is the largest step (large, confident FCFA figures)', () => {
    expect(typeScale.displayFcfa.size).toBeGreaterThan(typeScale.title.size);
  });

  it('all color tokens are hex values (no runtime color computation)', () => {
    for (const theme of Object.values(themes)) {
      for (const [name, value] of Object.entries(theme.colors)) {
        expect(value, `${theme.name}.${name}`).toMatch(/^#[0-9A-F]{6}$/i);
      }
    }
  });
});
