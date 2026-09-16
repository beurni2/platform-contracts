import { describe, expect, it } from 'vitest';
import { CATEGORIES, IDENTIFIANTS_CANON, RAYONS } from '../src/index.js';

/**
 * TAXONOMIE-CANON-1 — the shelves are DATA with a byte law: a category is its
 * label, one changed letter is a different rayon. These pins are what a
 * consumer's hand copy used to be (shop-plus `rayons-taxonomie.test.ts`,
 * RAYONS-CANON-1), now held once, here, beside the values.
 */
describe('RAYONS — the shelves Boutik+ publishes from and Shop+ offers', () => {
  it('8 shelves, 30 categories, none blank, none twice, each within the account book’s 64-char bound, every shelf titled', () => {
    expect(RAYONS).toHaveLength(8);
    const all = RAYONS.flatMap((r) => r.categories);
    expect(all).toHaveLength(30);
    expect(new Set(all).size).toBe(30);
    for (const c of all) {
      expect(c.trim()).toBe(c);
      expect(c).not.toBe('');
      expect(c.length).toBeLessThanOrEqual(64);
    }
    for (const r of RAYONS) expect(r.titre.trim()).not.toBe('');
    expect(CATEGORIES.size).toBe(30);
  });

  it('carries the founder’s named products (RAYONS-1) and the eight shipped categories live listings still wear', () => {
    for (const c of [
      'Siège auto', 'Poussette', 'Lit petit enfant', 'Lit à barreaux', 'Couffin',
      'Baignoire bébé', 'Bassine de bain', 'Tapis de bain', 'Serviette bébé',
      'Chaise haute', 'Assiettes & couverts enfant', 'Table de repas enfant', 'Bavoir',
      'Petites voitures', 'Jeux éducatifs', 'Poupées & dînette', "Jeux d'extérieur", 'Vélo enfant',
      'Coiffeuse', 'Draps & housses', 'Vase', 'Décoration',
      'Mode femme', 'Mode homme', 'Chaussures', 'Sacs', 'Tissus', 'Beauté scellée', 'Maison', 'Enfant',
    ]) {
      expect(CATEGORIES.has(c), c).toBe(true);
    }
  });

  it('spells « Jeux d’extérieur » with the STRAIGHT apostrophe (U+0027) and the shelf titles with the em dash (U+2014) — the bytes the wire carries', () => {
    const jeux = RAYONS.find((r) => r.titre === 'Jouets & jeux')!.categories.find((c) => c.startsWith('Jeux d'))!;
    expect(jeux.charCodeAt(6)).toBe(0x27);
    for (const r of RAYONS.filter((r) => r.titre.startsWith('Bébé'))) expect(r.titre.includes('—')).toBe(true);
  });

  it('the three canon-era ids: two have an exact twin on a shelf, « Mode, sacs & tissus » deliberately has none', () => {
    expect(IDENTIFIANTS_CANON.size).toBe(3);
    expect(CATEGORIES.has(IDENTIFIANTS_CANON.get('shoes')!)).toBe(true);
    expect(CATEGORIES.has(IDENTIFIANTS_CANON.get('sealed_beauty_cosmetics')!)).toBe(true);
    expect(CATEGORIES.has(IDENTIFIANTS_CANON.get('fashion_bags_fabrics')!)).toBe(false);
  });
});
