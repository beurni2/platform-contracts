#!/usr/bin/env node
// Raw demonstration (WO-1.0; updated WO-2.0): a status string outside the
// EIGHT canon members must REFUSE at parse — including the generic 'failed'
// that SE-I10 makes unrepresentable. Exits non-zero on the refusal.
import { OrderSchema } from '../packages/contracts/dist/index.js';

const order = {
  id: 'o_001',
  quoteId: 'q_001',
  productVersionId: 'pv_001',
  supplierId: 'sup_001',
  resellerId: 'rs_001',
  buyerPhoneRef: 'by_001',
  dropoff: {
    pin: { lat: 12.3714, lng: -1.5197 },
    zone: 'Ouaga 2000',
    landmark: 'En face de la pharmacie',
    directions: 'Portail vert',
    maskedRelay: 'relay_1',
  },
  reservationRef: 'rsv_001',
  escrowRef: 'esc_001',
  paymentMode: 'FULL_PREPAY',
  status: 'failed', // the SE-I10-banned generic terminal — must refuse
  timestamps: { createdAt: '2026-07-09T10:00:00Z' },
};

const result = OrderSchema.safeParse(order);
if (result.success) {
  console.error('BUG: a generic failed order status parsed — the enum asserts nothing');
  process.exit(0); // exit 0 signals the gate FAILED to catch it
}
console.error(`order status 'failed' REFUSED at parse (as required — SE-I10):`);
console.error(result.error.issues.map((i) => `  - ${i.code}: ${i.message}`).join('\n'));
process.exit(1);
