# TAXONOMY-DATA — `@platform/taxonomy`, the shelves as DATA (canon v3.14.0)

**Status:** shipped, canon v3.14.0 (MINOR — purely additive: one new package, no shape touched).
**Founder authorisation:** 2026-09-16 — « fix the 3 that is still open », the second of the three being « where the category list lives … its real home is platform-contracts ».
**Shape touched:** none. `SupplyProjectionSchema.category` stays the free `TrimmedNonEmptyString` of CATEGORY-WIRE.md.
**Consumers that must move with it:** boutik-plus (the listing wizard's shelves), shop-plus (the reseller app's two pickers). sera does not read categories.

---

## 1. The problem, stated as it was found

Boutik+'s listing wizard (RAYONS-1, 2026-08-23) publishes a product under one of eight shelves / thirty categories, sending the label verbatim as the wire's `category`. Shop+ built its category chips from what the feed already carried, so a rayon with no product on the feed yet had no chip: the founder's product published under « Maison » could never be chosen on Shop+ (RAYONS-CANON-1, 2026-09-12). That slice mirrored Boutik+'s literal BY HAND into shop-plus and pinned it with a deep-equal test — the only drift guard available without a shared package, and a second copy of a byte-exact list in a second repo.

## 2. Why a package of DATA, and not an allowlist on the wire

| Option | Verdict |
|---|---|
| `@platform/taxonomy`: the shelves as a published constant both apps import | **Chosen.** One list, one edit, a canon MINOR per change; each app's pin is a deliberate move. |
| A `z.enum` on `SupplyProjectionSchema.category` | Rejected. That is the ⏳ category-floor Decision itself (CATEGORY-WIRE.md §5): an allowlist makes a stale producer refuse at the schema, a live listing under a retired label vanish, and a new category a MAJOR. Not this slice's to close. |
| Catalog keys in `@platform/i18n` | Rejected. The label IS the wire value; a translated string beside it would be a second value for one fact, and the copy-lint's registers are for sentences, not proper nouns. |

## 3. The byte law

A category is its label. One changed letter is a different rayon that matches no product on any feed. So the values live here, are edited deliberately with a canon MINOR, and never in an app. The shelf titles carry the em dash (U+2014); « Jeux d'extérieur » carries the straight apostrophe (U+0027) — the bytes Boutik+ publishes.

## 4. The three canon-era identifiers

The seed catalog predates the shelves and carried three snake_case ids (`fashion_bags_fabrics`, `shoes`, `sealed_beauty_cosmetics`). The package names them (`IDENTIFIANTS_CANON`) as the shelves name their successors; two have an exact twin on a shelf today, « Mode, sacs & tissus » has none. What a consumer does with a twin (match it to its label, show one chip for both) is the consumer's reading; the ids themselves are not rewritten by this package.

## 5. What this does NOT decide

The ⏳ category-floor Decision (whether the wire enforces a taxonomy) stays open and untouched. This package is the floor's data, offered to pickers and wizards; the wire still accepts any trimmed non-empty string, and every consumer's fail-closed reading of an unknown category (CATEGORY-WIRE.md §6) stands.
