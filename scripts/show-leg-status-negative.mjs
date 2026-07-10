#!/usr/bin/env node
// WO-2.0 evidence: a payment-leg status outside the spec-enumerated
// "status(held|captured|refunded)" (Boutik l.143 / Shop l.108) must REFUSE
// at parse — including the WO-hinted 'released', which NO spec sentence
// names for legs or escrow. Exits non-zero on the refusal.
import { PaymentLegSchema } from '../packages/contracts/dist/index.js';

const leg = {
  legType: 'checkout',
  collectRef: 'collect_001',
  amount: 12500,
  fee: 0,
  status: 'released', // not spec-enumerated — must refuse
};
const result = PaymentLegSchema.safeParse(leg);
if (result.success) {
  console.error('BUG: a non-canonical leg status parsed');
  process.exit(0);
}
console.error(`payment-leg status 'released' REFUSED at parse (spec enumerates held|captured|refunded):`);
console.error(result.error.issues.map((i) => `  - ${i.path.join('.')}: ${i.code}`).join('\n'));
process.exit(1);
