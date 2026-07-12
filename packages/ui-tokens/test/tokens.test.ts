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

// ── ui-tokens v2 (WO-0E) — the Signature Design Doctrine as data ──────────
import { expectTypeOf } from 'vitest';
import {
  CELEBRATION_MOMENTS,
  landmark,
  money,
  motion,
  type CelebrationMoment,
  type Theme,
} from '../src/family.js';

describe('v2 motion — la loi du mouvement (DESIGN-LANGUAGE.md)', () => {
  it('carries the doctrine durations (150/250ms), spring params, and both ceilings', () => {
    expect(motion.quick.durationMs).toBe(150);
    expect(motion.standard.durationMs).toBe(250);
    expect(motion.springSoft).toEqual({ damping: 20, stiffness: 250, mass: 1 });
    expect(motion.celebrationMaxMs).toBe(800);
    expect(motion.countUpMaxMs).toBe(600);
    expect(motion.reducedMotionFlag).toBe('prefers_reduced_motion');
  });

  it('no standard motion is linear, and no named duration exceeds the celebration ceiling', () => {
    for (const key of ['quick', 'standard', 'celebrate'] as const) {
      expect(motion[key].easing).not.toBe('linear');
      expect(motion[key].durationMs).toBeLessThanOrEqual(motion.celebrationMaxMs);
    }
  });
});

describe('v2 celebration — three named moments, colored per theme', () => {
  it('every theme carries exactly the three named moments — no fourth', () => {
    expect([...CELEBRATION_MOMENTS]).toEqual(['produit_pret', 'premiere_vente', 'course_validee']);
    for (const theme of Object.values(themes)) {
      expect(Object.keys(theme.celebration).sort()).toEqual([...CELEBRATION_MOMENTS].sort());
    }
  });

  it("each moment's motif palette and halo come FROM ITS OWN THEME", () => {
    for (const theme of Object.values(themes)) {
      for (const name of CELEBRATION_MOMENTS) {
        const moment = theme.celebration[name];
        expect(moment.motifPalette).toEqual([
          theme.colors.primary,
          theme.colors.primaryStrong,
          theme.colors.primarySoft,
        ]);
        expect(moment.halo).toBe(theme.colors.primarySoft);
        expect(moment.timing.maxDurationMs).toBe(motion.celebrationMaxMs);
        expect(moment.timing.easing).toBe('spring-soft');
      }
    }
    // the three themes celebrate in three DIFFERENT palettes
    const halos = new Set(Object.values(themes).map((t) => t.celebration.premiere_vente.halo));
    expect(halos.size).toBe(3);
  });

  it('TYPE-LEVEL: celebration and motion tokens resolve per theme as typed constants', () => {
    expectTypeOf(boutikPlusTheme.celebration.produit_pret).toEqualTypeOf<CelebrationMoment>();
    expectTypeOf(shopPlusTheme.celebration.premiere_vente.halo).toEqualTypeOf<string>();
    expectTypeOf(seraTheme.celebration.course_validee.timing.maxDurationMs).toEqualTypeOf<800>();
    expectTypeOf(seraTheme.motion.countUpMaxMs).toEqualTypeOf<600>();
    expectTypeOf(boutikPlusTheme).toMatchTypeOf<Theme>();
    // runtime anchor so this test asserts something executable too:
    const resolved: CelebrationMoment = shopPlusTheme.celebration.premiere_vente;
    expect(resolved.halo).toBe('#F9E9DE');
  });
});

describe("v2 money — l'argent en majesté", () => {
  it('the hero amount is the largest money step, tabular numerals mandated, count-up refs the motion law', () => {
    expect(money.amountScale.hero.size).toBeGreaterThan(money.amountScale.display.size);
    expect(money.amountScale.display.size).toBeGreaterThan(money.amountScale.inline.size);
    expect(money.tabularNumerals).toBe(true);
    expect(money.countUpMaxMs).toBe(motion.countUpMaxMs);
    expect(money.receiptEmphasis.reconciledBadgeColorToken).toBe('verifiedBadge');
  });
});

describe("v2 landmark — le repère, pas l'adresse", () => {
  it('hierarchy descends repère → indications → zone, with named icon slots', () => {
    expect(landmark.hierarchy.repere.size).toBeGreaterThan(landmark.hierarchy.indications.size);
    expect(landmark.hierarchy.indications.size).toBeGreaterThan(landmark.hierarchy.zone.size);
    for (const slot of Object.values(landmark.iconNames)) {
      expect(typeof slot).toBe('string');
      expect(slot.length).toBeGreaterThan(0);
    }
  });
});

// ── ui-tokens v3 (WO-0G, canon v0.7.0) — the docket ──────────────────────
import { interaction, ANDROID_ELEVATION_DEFAULT, makeTheme } from '../src/family.js';

const boutikPlusColors = {
  primary: '#1F6B44',
  primaryStrong: '#14532F',
  primarySoft: '#E3F0E8',
  onPrimary: '#FFFFFF',
  verifiedBadge: '#1F6B44',
};

describe('v3 interaction — the interaction group (docketed by name at WO-4.2R)', () => {
  it('carries exactly the four family-level names, no more', () => {
    expect(Object.keys(interaction).sort()).toEqual(
      ['disabledOpacity', 'pressScale', 'pressedOpacity', 'skeletonPulseFloor'].sort(),
    );
  });

  it('the laundered kit constants are now named tokens (0.98 press, 0.4 pulse floor)', () => {
    expect(interaction.pressScale).toBe(0.98);
    expect(interaction.skeletonPulseFloor).toBe(0.4);
    // every interaction constant is a bounded 0<v≤1 factor (no color, no size)
    for (const v of Object.values(interaction)) {
      expect(typeof v).toBe('number');
      expect(v).toBeGreaterThan(0);
      expect(v).toBeLessThanOrEqual(1);
    }
  });

  it('every theme carries the shared interaction group by reference', () => {
    for (const theme of Object.values(themes)) {
      expect(theme.interaction).toBe(interaction);
    }
  });
});

describe('v3 androidElevation — per-theme (« Élévation visuelle par thème »)', () => {
  it('every theme carries its OWN androidElevation number (structurally per-theme)', () => {
    for (const theme of Object.values(themes)) {
      expect(typeof theme.androidElevation).toBe('number');
      expect(theme.androidElevation).toBeGreaterThanOrEqual(0);
    }
  });

  it('the ⏳ default is uniform until gallery tuning; makeTheme accepts a per-theme override', () => {
    expect(boutikPlusTheme.androidElevation).toBe(ANDROID_ELEVATION_DEFAULT);
    expect(seraTheme.androidElevation).toBe(ANDROID_ELEVATION_DEFAULT);
    // per-theme differentiation is supported by the API (tuned at gallery)
    const tuned = makeTheme('boutik-plus', boutikPlusColors, 4);
    expect(tuned.androidElevation).toBe(4);
  });

  it('TYPE-LEVEL: interaction and androidElevation resolve per theme', () => {
    expectTypeOf(seraTheme.interaction.pressScale).toEqualTypeOf<number>();
    expectTypeOf(boutikPlusTheme.androidElevation).toEqualTypeOf<number>();
  });
});

describe('v3 icon slots — cadenas + moto join the family (names only)', () => {
  it('the two new slots are present as non-empty names, assets app-side', () => {
    expect(landmark.iconNames.cadenas).toBe('cadenas');
    expect(landmark.iconNames.moto).toBe('moto');
  });

  it('the slot family now names all seven, still names-only strings', () => {
    expect(Object.keys(landmark.iconNames).sort()).toEqual(
      ['cadenas', 'marche', 'moto', 'pharmacie', 'quartier', 'repere', 'zone'].sort(),
    );
  });
});
