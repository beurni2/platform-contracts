/**
 * @platform/taxonomy — THE PRODUCT TAXONOMY AS DATA (canon 3.14.0,
 * TAXONOMIE-CANON-1, founder order 2026-09-16: « fix the 3 that is still
 * open » — the category list's home).
 *
 * ONE LIST, TWO APPS. Boutik+'s listing wizard (RAYONS-1, 2026-08-23) publishes
 * a product under one of these categories, sending the label VERBATIM as the
 * wire's `category`; Shop+'s pickers (RAYONS-CANON-1, 2026-09-12) offer the
 * same shelves so a reseller can choose a rayon before any product reaches
 * the feed under it. Until this package existed, Shop+ carried a hand copy of
 * Boutik+'s literal pinned by a test — a drift surface in two repos.
 *
 * WHAT THIS IS NOT (the ⏳ category-floor Decision stays open, untouched):
 * canon `category` on `SupplyProjection` remains a free `TrimmedNonEmptyString`
 * (derivations/CATEGORY-WIRE.md §5). This package is the floor's DATA — the
 * shelves a store is aisled by — never an allowlist, never a refusal on the
 * wire. A string these shelves did not produce is still a category.
 *
 * BYTE LAW: a category is its label. One changed letter is a different rayon
 * that matches no product, so the values here are edited deliberately, with a
 * canon MINOR, never in an app. Em dash U+2014 in the shelf titles; the
 * STRAIGHT apostrophe U+0027 in « Jeux d'extérieur » (what Boutik+ publishes).
 *
 * Titles and category names are taxonomy DATA — proper nouns of the store,
 * not sentences — which is why they live here rather than in a translated
 * catalog: the wire carries them, and a translation would be a second value.
 */

export interface Rayon {
  /** The shelf's name, as the pickers head it. */
  readonly titre: string;
  /** The categories on that shelf — each one a wire value, verbatim. */
  readonly categories: readonly string[];
}

/**
 * The shelves, in the order Boutik+'s wizard shows them: the founder's named
 * products first (bébé, jouets, maison), the eight shipped categories after.
 */
export const RAYONS: readonly Rayon[] = [
  { titre: 'Bébé — sortie & voyage', categories: ['Siège auto', 'Poussette'] },
  { titre: 'Bébé — chambre', categories: ['Lit petit enfant', 'Lit à barreaux', 'Couffin'] },
  { titre: 'Bébé — bain', categories: ['Baignoire bébé', 'Bassine de bain', 'Tapis de bain', 'Serviette bébé'] },
  { titre: 'Bébé — repas', categories: ['Chaise haute', 'Assiettes & couverts enfant', 'Table de repas enfant', 'Bavoir'] },
  { titre: 'Jouets & jeux', categories: ['Petites voitures', 'Jeux éducatifs', 'Poupées & dînette', "Jeux d'extérieur", 'Vélo enfant'] },
  { titre: 'Maison & chambre', categories: ['Coiffeuse', 'Draps & housses', 'Vase', 'Décoration', 'Maison'] },
  { titre: 'Mode & tissus', categories: ['Mode femme', 'Mode homme', 'Enfant', 'Chaussures', 'Sacs', 'Tissus'] },
  { titre: 'Beauté', categories: ['Beauté scellée'] },
];

/** Every category the shelves carry — the membership test a picker or a
 *  consumer asks (« does the taxonomy know this wire value? »). */
export const CATEGORIES: ReadonlySet<string> = new Set(RAYONS.flatMap((r) => r.categories));

/**
 * The three canon-era MVP identifiers, the only non-French values the wire
 * has ever carried (`fashion_bags_fabrics`, `shoes`, `sealed_beauty_cosmetics`,
 * from the seed catalog), named as the shelves name their successors. Two of
 * them have an exact twin on a shelf today; « Mode, sacs & tissus » spans
 * several categories and has none — it stays its own rayon wherever it is
 * still carried.
 */
export const IDENTIFIANTS_CANON: ReadonlyMap<string, string> = new Map([
  ['fashion_bags_fabrics', 'Mode, sacs & tissus'],
  ['shoes', 'Chaussures'],
  ['sealed_beauty_cosmetics', 'Beauté scellée'],
]);
