#!/usr/bin/env node
// GATE: the four bundled reference adapters must each certify 8/8 (§3).
// Exit non-zero if ANY behavior on ANY domain is missing — no partial passes.
import { REFERENCE_ADAPTERS } from './reference/adapters.js';
import { certifyAdapter, formatScorecard } from './certify.js';

const cards = [];
for (const adapter of REFERENCE_ADAPTERS) {
  cards.push(await certifyAdapter(adapter));
}
for (const card of cards) {
  console.log(formatScorecard(card));
  console.log('');
}
const certified = cards.filter((card) => card.certified).length;
console.log(`certification: ${certified}/${cards.length} domains certified (8/8 behaviors each required)`);
process.exit(certified === cards.length ? 0 : 1);
