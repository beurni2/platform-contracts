import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { CatalogSchema } from '../src/catalog.js';
import { loadLintData } from '../src/data-loader.js';
import { estimateSyllables, findToken, lintCatalog, splitSentences } from '../src/lint.js';

const here = dirname(fileURLToPath(import.meta.url));
const seedCatalog = CatalogSchema.parse(
  JSON.parse(readFileSync(join(here, '..', 'catalog', 'catalog.json'), 'utf8')),
);
const negativeCatalog = CatalogSchema.parse(
  JSON.parse(readFileSync(join(here, '..', 'fixtures', 'negative-catalog.json'), 'utf8')),
);

describe('copy-lint — seed catalog (canonical Shop+ §6.1 checkout strings)', () => {
  it('the canonical money copy passes all four conditions', async () => {
    const data = await loadLintData();
    const report = lintCatalog(seedCatalog, data);
    expect(report.violations).toEqual([]);
    expect(report.ok).toBe(true);
    expect(report.checkedEntries).toBe(8);
  });

  it('the seed contains the required §6.1 strings, tagged register: money', () => {
    const byKey = new Map(seedCatalog.map((e) => [e.key, e]));
    expect(byKey.get('checkout.pay_now_line')?.fr).toBe('À payer maintenant : {X} FCFA');
    expect(byKey.get('checkout.pay_at_delivery_line')?.fr).toBe('À payer à la livraison : {Y} FCFA');
    // the 4th changed money string (Option B body) — its « {D} FCFA » suffix is asserted
    // too, so all four §6.1 money strings are guarded against a « F » regression, not three.
    expect(byKey.get('checkout.option_b.body')?.fr).toContain('({D} FCFA)');
    expect(byKey.get('checkout.replay_line')?.fr).toBe(
      "Vous payez {X} FCFA maintenant et {Y} FCFA à la livraison — d'accord ?",
    );
    expect(byKey.get('checkout.option_b.fee_warning')?.fr).toContain('non remboursables');
    for (const entry of seedCatalog) {
      expect(entry.register).toBe('money');
      expect(entry.screenClass).toBe('checkout');
    }
  });
});

describe('copy-lint — NEGATIVE FIXTURE (must fail, and for the right reasons)', () => {
  it('fails the fixture catalog containing « Veuillez patienter » and « séquestre »', async () => {
    const data = await loadLintData();
    const report = lintCatalog(negativeCatalog, data);
    expect(report.ok).toBe(false);

    const conditions = new Set(report.violations.map((v) => v.condition));
    // All four §10.5 failure conditions are exercised:
    expect(conditions).toContain('banned_register_token');
    expect(conditions).toContain('register_mismatch');
    expect(conditions).toContain('reading_level');
    expect(conditions).toContain('local_language_in_money_or_instruction');

    const messages = report.violations.map((v) => `${v.key}: ${v.message}`).join('\n');
    expect(messages).toContain('bad.banned.veuillez');
    expect(messages).toContain('« veuillez »');
    expect(messages).toContain('bad.banned.sequestre');
    expect(messages).toContain('« séquestre »');
    expect(messages).toContain('bad.register_mismatch.money_with_urgency');
    expect(messages).toContain('bad.register_mismatch.selling_with_jargon');
    expect(messages).toContain('bad.reading_level.administrative_wall');
    expect(messages).toContain('bad.local_language.moore_in_money');
    expect(messages).toContain('bad.local_language.dioula_variant_on_instruction');
  });
});

describe('copy-lint — D18 label rule (founder-signed 2026-07-10)', () => {
  const entry = (key: string, fr: string, screenClass: string, register = 'neutral') =>
    ({ key, fr, register, screenClass }) as never;

  it('« Espace revendeur » PASSES as a label (reading-level exempt)', async () => {
    const data = await loadLintData();
    const report = lintCatalog([entry('nav.reseller_space', 'Espace revendeur', 'label', 'selling')], data);
    expect(report.violations).toEqual([]);
    expect(report.ok).toBe(true);
  });

  it('« Repère » PASSES as a label (the D18 collision instance — 1 word, 3 syllables)', async () => {
    const data = await loadLintData();
    const report = lintCatalog([entry('nav.landmark', 'Repère', 'label')], data);
    expect(report.violations).toEqual([]);
    expect(report.ok).toBe(true);
  });

  it('a 5+-word administrative sentence still FAILS the budget on a non-label class', async () => {
    const data = await loadLintData();
    const report = lintCatalog(
      [entry('bad.admin', 'Vérification administrative supplémentaire nécessaire immédiatement actuellement', 'status')],
      data,
    );
    expect(report.ok).toBe(false);
    expect(report.violations.some((v) => v.condition === 'reading_level')).toBe(true);
  });

  it('« séquestre » in a label still FAILS the banned-token check', async () => {
    const data = await loadLintData();
    const report = lintCatalog([entry('bad.label', 'Séquestre actif', 'label', 'money')], data);
    expect(report.ok).toBe(false);
    expect(report.violations.some((v) => v.condition === 'banned_register_token' && v.message.includes('séquestre'))).toBe(true);
  });

  it('a 4+-word over-budget string PASSES as a label but FAILS on a non-label class (isolates the label exemption)', async () => {
    const data = await loadLintData();
    // 4 words (min-words clause does NOT exempt it), avg ~4.5 syllables/word
    // (over every class budget) — only the D18 label exemption lets it pass.
    const fr = 'Coordonnées géolocalisées vérification communautaire';
    const asLabel = lintCatalog([entry('nav.geo', fr, 'label')], data);
    expect(asLabel.violations).toEqual([]);
    expect(asLabel.ok).toBe(true);
    const asStatus = lintCatalog([entry('status.geo', fr, 'status')], data);
    expect(asStatus.ok).toBe(false);
    expect(asStatus.violations.some((v) => v.condition === 'reading_level')).toBe(true);
  });

  it('sentences under four words are budget-exempt even OUTSIDE labels (D18 min-words clause)', async () => {
    const data = await loadLintData();
    // 2 words, avg syllables ~4 — would have failed every budget before D18.
    const report = lintCatalog([entry('status.done', 'Vérification terminée.', 'status')], data);
    expect(report.violations).toEqual([]);
    expect(report.ok).toBe(true);
  });
});

describe('copy-lint internals', () => {
  it('token matching respects word boundaries (« vite » does not match « invité »)', () => {
    expect(findToken('Vous êtes invité à la fête', ['vite'])).toBeUndefined();
    expect(findToken('Payez vite !', ['vite'])).toBe('vite');
  });

  it('token matching is case- and accent-faithful', () => {
    expect(findToken('VEUILLEZ patienter', ['veuillez'])).toBe('veuillez');
    expect(findToken('placé sous SÉQUESTRE', ['séquestre'])).toBe('séquestre');
  });

  it('sentence splitting and syllable heuristic behave sanely', () => {
    expect(splitSentences('Une phrase. Une autre !')).toEqual(['Une phrase', 'Une autre']);
    expect(estimateSyllables('paiement')).toBe(2);
    expect(estimateSyllables('sécurisée')).toBe(4);
    expect(estimateSyllables('F')).toBe(1);
  });

  it('condition (b) also scans moore/dioula variant texts, not only fr', async () => {
    const data = await loadLintData();
    const report = lintCatalog(
      [
        {
          key: 'selling.with_jargon_in_variant',
          fr: 'Regardez ces nouveaux pagnes',
          register: 'selling',
          screenClass: 'selling_surface',
          dioula: 'texte avec solde débiteur dedans',
        },
      ],
      data,
    );
    expect(report.ok).toBe(false);
    expect(report.violations.some((v) => v.condition === 'register_mismatch' && v.message.includes('(dioula)'))).toBe(
      true,
    );
  });

  it('catalog schema rejects an entry with an unknown register', () => {
    const bad = [{ key: 'x', fr: 'Texte', register: 'shouty', screenClass: 'general' }];
    expect(CatalogSchema.safeParse(bad).success).toBe(false);
  });

  it('catalog schema rejects duplicate keys', () => {
    const bad = [
      { key: 'dup', fr: 'Un', register: 'neutral', screenClass: 'general' },
      { key: 'dup', fr: 'Deux', register: 'neutral', screenClass: 'general' },
    ];
    expect(CatalogSchema.safeParse(bad).success).toBe(false);
  });
});
