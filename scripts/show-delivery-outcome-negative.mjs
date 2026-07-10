#!/usr/bin/env node
// WO-2.0 evidence: a GENERIC 'failed' delivery outcome is UNREPRESENTABLE
// (SE-I10 "No generic failed terminal state." · SE6.1 "no generic failed
// terminal"). No enum member 'failed' exists; the strict parse must refuse.
// Exits non-zero on the refusal.
import { DeliveryOutcomeSchema, DELIVERY_OUTCOME_FAMILIES } from '../packages/contracts/dist/index.js';

if (DELIVERY_OUTCOME_FAMILIES.includes('failed')) {
  console.error('BUG: a generic failed family member exists in canon');
  process.exit(0);
}
const outcome = {
  taskId: 'task_001',
  orderId: 'o_001',
  family: 'failed', // the banned generic terminal
  reasonCode: 'honest_absence',
  humanReasonRef: 'delivery.reason.honest_absence',
  faultClass: 'buyer',
  attempt: { number: 1, at: '2026-07-10T10:00:00Z' },
};
const result = DeliveryOutcomeSchema.safeParse(outcome);
if (result.success) {
  console.error('BUG: a bare-failed delivery outcome parsed');
  process.exit(0);
}
console.error(`delivery outcome family 'failed' REFUSED at parse (SE-I10 — unrepresentable):`);
console.error(result.error.issues.map((i) => `  - ${i.path.join('.')}: ${i.code}`).join('\n'));
process.exit(1);
