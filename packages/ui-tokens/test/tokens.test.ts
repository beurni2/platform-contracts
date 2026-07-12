import { describe, expect, it, expectTypeOf } from 'vitest';
import { boutikPlusTheme, seraTheme, shopPlusTheme, themes } from '../src/themes.js';
import {
  band,
  celebration,
  interaction,
  landmark,
  money,
  motion,
  radius,
  ribbon,
  seraColour,
  sharedColour,
  skeleton,
  spacing,
  statusbar,
  touch,
  type,
  type Theme,
} from '../src/family.js';

// ── Grand Teint — canon v0.8.0 (WO-5.0) ─────────────────────────────────────
// The values themselves are machine-verified against docs/design/tokens.json
// by scripts/check-token-fidelity.mjs (the fidelity gate). These tests assert
// STRUCTURE, per-theme resolution, typing, and the design laws.

describe('themes — one family DNA, three app identities', () => {
  it('exposes exactly the three canon-named themes', () => {
    expect(Object.keys(themes).sort()).toEqual(['boutik-plus', 'sera', 'shop-plus']);
    expect(boutikPlusTheme.name).toBe('boutik-plus');
    expect(shopPlusTheme.name).toBe('shop-plus');
    expect(seraTheme.name).toBe('sera');
  });

  it('per-theme resolution: shared palette merged with exactly one app accent', () => {
    // shared ink/paper reach every theme
    for (const t of Object.values(themes)) {
      expect(t.colours.ink).toBe('#1B140D');
      expect(t.colours.paper).toBe('#FFFDF7');
    }
    // each app's own primary/accent resolves
    expect(boutikPlusTheme.colours.primary).toBe('#1F4D36');
    expect(shopPlusTheme.colours.primary).toBe('#C2571B');
    expect(seraTheme.colours.accent).toBe('#D9A441'); // Séra leads with amber accent on ink
    // three distinct theme strips
    const strips = new Set([
      boutikPlusTheme.colours.themeStrip,
      shopPlusTheme.colours.themeStrip,
      seraTheme.colours.themeStrip,
    ]);
    expect(strips.size).toBe(3);
  });

  it('Séra carries no primarySoft (ink primary, amber accent) — faithful to the designer', () => {
    expect('primarySoft' in seraColour).toBe(false);
    expect(seraColour.primary).toBe('#1B140D');
  });
});

describe('colour — sun-first ink on paper; translucency via rgba literals', () => {
  it('opaque roles are hex; hairlines and scrim are rgba (RN-legal, not runtime computation)', () => {
    expect(sharedColour.ink).toMatch(/^#[0-9A-F]{6}$/i);
    expect(sharedColour.hairline).toBe('rgba(27,20,13,0.14)');
    expect(sharedColour.hairlineMid).toBe('rgba(27,20,13,0.22)');
    expect(sharedColour.hairlineStrong).toBe('rgba(27,20,13,0.35)');
    expect(sharedColour.scrim).toBe('rgba(27,20,13,0.45)');
    // every colour token is a hex or an rgba() literal — never a function/undefined
    for (const [k, v] of Object.entries(sharedColour)) {
      expect(v, k).toMatch(/^(#[0-9A-F]{6}|rgba\([0-9.,\s]+\))$/i);
    }
  });
});

describe("money — l'argent en majesté", () => {
  it('hero is the biggest step; tabular always; narrow-space separator; abbreviation & truncation forbidden', () => {
    expect(money.amountScale.hero.size).toBeGreaterThan(money.amountScale.page.size);
    expect(money.amountScale.page.size).toBeGreaterThan(money.amountScale.section.size);
    expect(money.tabular).toBe(true);
    // U+202F NARROW NO-BREAK SPACE — the exact codepoint the designer specified
    expect(money.groupSeparator).toBe(' ');
    expect(money.groupSeparator.codePointAt(0)).toBe(0x202f);
    expect(money.currencySuffix).toBe(' F');
    expect(money.abbreviation).toBe('forbidden');
    expect(money.truncation).toBe('forbidden');
  });
});

describe('type — Archivo variable, unitless line-heights', () => {
  it('carries the designer scale keys with size/lh/wght; body ≥ 16 (accessibility floor)', () => {
    expect(type.family).toBe('Archivo');
    expect(Object.keys(type.scale)).toContain('display');
    expect(Object.keys(type.scale)).toContain('labelXS');
    expect(type.scale.body.size).toBeGreaterThanOrEqual(16);
    expect(type.scale.body.lh).toBe(1.5);
    expect(type.variableAxes.wght).toEqual([400, 900]);
  });
});

describe('celebration — three named moments only, each app-tagged, ≤ 800 ms, non-blocking', () => {
  it('exactly the three moments, no fourth, each bound to its app', () => {
    const moments = ['produitPret', 'premiereVente', 'courseValidee'] as const;
    for (const m of moments) expect(celebration[m]).toBeDefined();
    expect(celebration.produitPret.app).toBe('boutik');
    expect(celebration.premiereVente.app).toBe('shop');
    expect(celebration.courseValidee.app).toBe('sera');
    expect(celebration.blocking).toBe(false);
    expect(celebration.dismissible).toBe(true);
    // every celebration duration sits within the 800 ms ceiling
    for (const k of ['haloMs', 'ringMs', 'motifMs', 'badgeMs'] as const) {
      expect(celebration[k]).toBeLessThanOrEqual(motion.celebrateMaxMs);
    }
  });
});

describe('touch · radius · spacing · motion — the layout grammar', () => {
  it('touch floor is 48 (Grand Teint accessibility floor)', () => {
    expect(touch.minTargetPx).toBe(48);
    expect(touch.minGapPx).toBe(8);
  });
  it('radius is 0 on money/box surfaces, pill only for pills', () => {
    expect(radius.box).toBe(0);
    expect(radius.card).toBe(0);
    expect(radius.pill).toBe(999);
  });
  it('spacing is the 4/8/12/16/24/34 scale', () => {
    expect(Object.values(spacing)).toEqual([4, 8, 12, 16, 24, 34]);
  });
  it('motion easings are CSS cubic-bezier strings; only transform+opacity animate; layout forbidden', () => {
    expect(motion.springSoft).toBe('cubic-bezier(0.2, 0.8, 0.25, 1)');
    expect(motion.animatableProperties).toEqual(['transform', 'opacity']);
    expect(motion.layoutAnimation).toBe('forbidden');
  });
});

describe('landmark — le repère, pas l’adresse; 29 named icon slots', () => {
  it('hierarchy descends repère → indications → zone; illustration palette is illustration-only', () => {
    expect(landmark.repere.size).toBeGreaterThan(landmark.indications.size);
    expect(landmark.indications.size).toBeGreaterThan(landmark.zone.size);
    expect(landmark.illustration.bleuPortail).toBe('#33608C');
    expect(landmark.iconNames).toHaveLength(29);
    expect(landmark.iconNames).toContain('cadenas');
    expect(landmark.iconNames).toContain('moto');
  });
  it('WO-5.4 (v0.9.1): the three nav glyphs that closed the WO-6.0 tab-bar gap are present', () => {
    expect(landmark.iconNames).toContain('accueil');
    expect(landmark.iconNames).toContain('produits');
    expect(landmark.iconNames).toContain('vitrine');
  });
});

describe('the four NEW groups (v0.8.0) — band · ribbon · skeleton · statusbar', () => {
  it('band — the 4 px theme strip + the signature price band', () => {
    expect(band.themeStripPx).toBe(4);
    expect(band.priceBand.amountToken).toBe('money.amountScale.page');
  });
  it('ribbon — the sandbox preview stripe with its honest label', () => {
    expect(ribbon.sandbox.label).toBe('APERÇU — BAC À SABLE');
    expect(ribbon.sandbox.heightPx).toBe(24);
  });
  it('skeleton — exact-dimension placeholder, layout shift forbidden', () => {
    expect(skeleton.pulseFloor).toBe(0.4);
    expect(skeleton.rule).toContain('layout shift forbidden');
  });
  it('statusbar — clock + icon ink', () => {
    expect(statusbar.clock.size).toBe(13);
    expect(statusbar.iconInk).toBe('colour.shared.ink');
  });
});

describe('interaction — press/skeleton feedback + structural selection', () => {
  it('androidElevation is a small named scale (no elevation theatre); focus ring present', () => {
    expect(interaction.androidElevation).toEqual({ surface: 0, overlay: 4, sheet: 8 });
    expect(interaction.pressScale).toBe(0.98);
    expect(interaction.accentEdgePx).toBe(5);
    expect(interaction.focusRing).toEqual({ widthPx: 2, offsetPx: 2 });
  });
});

describe('TYPE-LEVEL — themes and groups resolve as typed constants', () => {
  it('theme + money + the new groups type correctly', () => {
    expectTypeOf(boutikPlusTheme).toMatchTypeOf<Theme>();
    expectTypeOf(shopPlusTheme.colours.ink).toEqualTypeOf<string>();
    expectTypeOf(money.tabular).toEqualTypeOf<true>();
    expectTypeOf(band.themeStripPx).toEqualTypeOf<4>();
    // runtime anchor
    expect(seraTheme.colours.themeStrip).toBe('#D9A441');
  });
});
