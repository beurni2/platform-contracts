#!/usr/bin/env node
// WO-5.12 — HandoffAuthorization.authorizedBy is the ISSUER (« ÉMIS PAR — payment
// operator ») half of the break-glass maker-checker: only an `ops:payment:*` actor
// may issue. Break-glass validates by ALLOW-LIST, so the four actors the WO names —
// a supplier, the dispatcher (`logistics-service:dispatch`, sera's real literal), an
// `ops:moderation:*`, and an empty-suffix `ops:payment:` — are all refused by
// non-match. NON-VACUOUS: a valid ops:payment:* issuer must PARSE, so the schema is
// not trivially rejecting everything. Exits 1 only when the valid parses AND every
// named non-payment-operator actor is refused (harness runs this under `fail`).
import { HandoffAuthorizationSchema } from '../packages/contracts/dist/index.js';

// A valid HandoffAuthorization except for authorizedBy (which each case varies), so
// the ONLY thing under test is the payment-operator allow-list on the issuer field.
const base = {
  orderId: 'o_001',
  riderId: 'rd_001',
  buyerRef: 'by_001',
  exactAmount: 10_779,
  providerTransactionReference: 'prov_tx_889',
  authorizationSource: 'provider_webhook',
  authorizationExpiresAt: '2026-07-09T10:15:00Z',
  signature: 'sig_abc',
  state: 'issued',
};

const parse = (authorizedBy) => HandoffAuthorizationSchema.safeParse({ ...base, authorizedBy });

const ok = (label, authorizedBy) => {
  const r = parse(authorizedBy);
  if (!r.success) {
    console.error(`BUG: a VALID ops:payment:* issuer was refused — the schema over-rejects (${label})`);
    console.error(r.error.issues.map((i) => `  - ${i.path.join('.')}: ${i.message}`).join('\n'));
    return false;
  }
  return true;
};

const refused = (label, authorizedBy) => {
  const r = parse(authorizedBy);
  if (r.success) {
    console.error(`BUG: ${label} PARSED — the payment-operator allow-list asserts nothing`);
    return false;
  }
  // the failure must be ON authorizedBy (not some unrelated field)
  const onField = r.error.issues.some((i) => i.path.join('.') === 'authorizedBy');
  if (!onField) {
    console.error(`BUG: ${label} failed, but not on authorizedBy — the negative is not isolating the invariant`);
    return false;
  }
  console.error(`REFUSED (${label}): ${r.error.issues.map((i) => i.message).join(' · ')}`);
  return true;
};

// Non-vacuity: a real payment operator issues.
const validOk = ok('ops:payment:desk-1 (the authorized payment operator)', 'ops:payment:desk-1');

// The four the WO names — all refused by non-match (allow-list, not deny-list).
const refusalsOk =
  refused('supplier:aicha (a supplier)', 'supplier:aicha') &&
  refused("logistics-service:dispatch (the dispatcher — VÉRIFIÉ PAR half, may not issue)", 'logistics-service:dispatch') &&
  refused('ops:moderation:x (wrong ops domain)', 'ops:moderation:x') &&
  refused('ops:payment: (empty operator id)', 'ops:payment:');

if (validOk && refusalsOk) {
  console.error(
    'payment-operator negative OK: ops:payment:desk-1 issues; supplier + dispatcher + ops:moderation + empty-suffix all REFUSED',
  );
  process.exit(1); // the non-payment actors failed as required — harness expects 'fail'
}
console.error('NEGATIVE FIXTURE MISBEHAVED — a valid issuer was rejected or a non-payment actor slipped through');
process.exit(0);
