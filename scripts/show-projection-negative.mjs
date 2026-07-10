#!/usr/bin/env node
// NEGATIVE GATE (WO-0D): a supply projection carrying supplier identity,
// contact, or precise pickup must REFUSE at parse (B4.2/SP-I03 — the strict
// canonical schema refuses undeclared keys). Exit 1 = correctly refused;
// exit 0 = the schema leaks.
import { SupplyProjectionSchema } from '../packages/contracts/dist/index.js';

const leaking = {
  productVersionId: 'pv_001',
  offerVersion: 'offer_001@1',
  basePrice: 10_000,
  resellerCommission: 1_000,
  available: 4,
  // identity leak — none of these may ever ride the projection:
  supplierName: 'Boutique Wend-Kuni',
  supplierPhone: '+226 70 00 00 00',
  pickupAddress: 'Secteur 15, porte 123',
};

const result = SupplyProjectionSchema.safeParse(leaking);
if (result.success) {
  console.error('BUG: a projection carrying supplier identity/contact parsed — the schema leaks');
  process.exit(0);
}
console.error('supply projection with identity leak REFUSED at parse (as required):');
console.error(result.error.issues.map((i) => `  - ${i.code}: ${i.message}`).join('\n'));
process.exit(1);
