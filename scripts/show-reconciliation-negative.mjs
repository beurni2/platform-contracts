#!/usr/bin/env node
// Raw demonstration that the reconciliation gate can fail (WO-0 evidence):
// a quote whose resellerNet was computed as an independent multiplication —
// the FORBIDDEN construction — must throw. Exits non-zero on the throw.
import { assertQuoteReconciles } from '../packages/contracts/dist/money/waterfall.js';

const broken = {
  productSubtotal: 10_779,
  deliveryFee: 600,
  buyerTotal: 11_379,
  sellerNet: 9_168,
  resellerNet: Math.floor(0.8 * (333 + 778)), // 888 — independent multiplication, loses 1 F
  platformProductFeeRevenue: 722,
  amountPaidAtCheckout: 600,
  amountDueAtDelivery: 10_779,
};

try {
  assertQuoteReconciles(broken);
  console.error('BUG: the broken quote reconciled — the gate asserts nothing');
  process.exit(0); // exit 0 signals the gate FAILED to catch it
} catch (err) {
  console.error(String(err));
  process.exit(1);
}
