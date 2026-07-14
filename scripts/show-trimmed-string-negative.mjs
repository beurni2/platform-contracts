#!/usr/bin/env node
// WO-5.14 — the whitespace tightening (founder ruling 2026-07-15). Id-class and
// name-class / display-string fields are trimmed non-empty: a whitespace-only value
// (" ", "\t", "") — and a surrounding-whitespace value (" x", "x ") — is refused.
// NON-VACUOUS: a fully-clean storefront must PARSE, so the schema is not trivially
// rejecting everything, and each planted refusal must land ON the tampered field.
// Exits 1 only when the clean value parses AND every plant is refused (harness runs
// this under `fail`).
import { StorefrontSchema, OrderSchema } from '../packages/contracts/dist/index.js';

const clean = {
  id: 'sf_001',
  resellerId: 'rs_001',
  slug: 'chez-aicha',
  discoverable: true,
  curatedItems: ['lst_001'],
  name: 'Chez Aïcha',
  zone: 'Rood Woko, Ouagadougou',
  category: 'Cosmétiques',
  createdAt: '2026-07-15T09:00:00Z',
  updatedAt: '2026-07-15T09:00:00Z',
};

// A valid Order — proves the tightening reaches the kernel-types Location.zone/landmark
// (the delivery-route zone) via a real shape, not only the contracts-local fields.
const cleanOrder = {
  id: 'o_001', quoteId: 'q_001', productVersionId: 'pv_001', supplierId: 'sup_001',
  resellerId: 'rs_001', buyerPhoneRef: 'by_001',
  dropoff: { pin: { lat: 12.3714, lng: -1.5197 }, zone: 'Ouaga 2000', landmark: 'En face de la pharmacie', directions: 'Portail vert', maskedRelay: 'relay_1' },
  reservationRef: 'rsv_001', escrowRef: 'esc_001', paymentMode: 'FULL_PREPAY', status: 'confirmed',
  timestamps: { createdAt: '2026-07-15T10:00:00Z' },
};

const PLANTS = [' ', '\t', '', ' x', 'x '];
const FIELDS = ['id', 'resellerId', 'name', 'zone', 'category'];
const ORDER_DROPOFF_FIELDS = ['zone', 'landmark']; // kernel-types Location display strings

// Non-vacuity: the clean storefront AND the clean order parse.
let ok = true;
if (!StorefrontSchema.safeParse(clean).success) {
  console.error('BUG: a fully-clean storefront was refused — the schema over-rejects');
  ok = false;
}
if (!OrderSchema.safeParse(cleanOrder).success) {
  console.error('BUG: a fully-clean order was refused — the schema over-rejects');
  ok = false;
}

let refusals = 0;
for (const field of FIELDS) {
  for (const bad of PLANTS) {
    const r = StorefrontSchema.safeParse({ ...clean, [field]: bad });
    if (r.success) {
      console.error(`BUG: storefront.${field} = ${JSON.stringify(bad)} PARSED — the trimmed rule asserts nothing on ${field}`);
      ok = false;
      continue;
    }
    const onField = r.error.issues.some((i) => i.path.join('.') === field);
    if (!onField) {
      console.error(`BUG: storefront.${field} = ${JSON.stringify(bad)} failed, but not on ${field} — the negative is not isolating the invariant`);
      ok = false;
      continue;
    }
    refusals += 1;
  }
}

// The kernel-types Location tightening, via Order.dropoff (proves it reaches real shapes).
let orderRefusals = 0;
for (const field of ORDER_DROPOFF_FIELDS) {
  for (const bad of PLANTS) {
    const r = OrderSchema.safeParse({ ...cleanOrder, dropoff: { ...cleanOrder.dropoff, [field]: bad } });
    if (r.success) {
      console.error(`BUG: order.dropoff.${field} = ${JSON.stringify(bad)} PARSED — kernel-types Location tightening did not reach this shape`);
      ok = false;
      continue;
    }
    const onField = r.error.issues.some((i) => i.path.join('.') === `dropoff.${field}`);
    if (!onField) {
      console.error(`BUG: order.dropoff.${field} = ${JSON.stringify(bad)} failed, but not on dropoff.${field}`);
      ok = false;
      continue;
    }
    orderRefusals += 1;
  }
}

if (ok && refusals === FIELDS.length * PLANTS.length && orderRefusals === ORDER_DROPOFF_FIELDS.length * PLANTS.length) {
  console.error(
    `trimmed-string negative OK: clean storefront + order parse; ${refusals} plants across storefront ${FIELDS.join('/')} and ${orderRefusals} across order.dropoff ${ORDER_DROPOFF_FIELDS.join('/')} (kernel-types Location) all REFUSED on their field`,
  );
  process.exit(1); // the plants failed as required — harness expects 'fail'
}
console.error('NEGATIVE FIXTURE MISBEHAVED — the clean value was rejected or a whitespace plant slipped through');
process.exit(0);
