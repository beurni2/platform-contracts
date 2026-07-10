#!/usr/bin/env node
// NEGATIVE GATE: a deliberately deficient mock (one §3 behavior removed —
// here, duplicates) must FAIL certification. Exit 1 = correctly refused;
// exit 0 = the suite certified a deficient mock and asserts nothing.
import { referencePaymentProviderMock } from './reference/adapters.js';
import { makeDeficient } from './negative/deficient.js';
import { certifyAdapter, formatScorecard } from './certify.js';

const deficient = makeDeficient(referencePaymentProviderMock, 'emits_duplicates');
const card = await certifyAdapter(deficient);
console.log('deficient mock (duplicates behavior removed):');
console.log(formatScorecard(card));
if (card.certified) {
  console.error('BUG: the deficient mock was certified — the suite asserts nothing');
  process.exit(0);
}
console.error(`certification REFUSED as required (${card.score})`);
process.exit(1);
