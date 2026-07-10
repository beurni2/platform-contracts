#!/usr/bin/env node
// WO-2.0 evidence: a faultClass outside the §5.6 enumeration
// "faultClass(seller|sera|payment_provider|buyer|platform_system|unresolved)"
// (Boutik l.148) must REFUSE at parse. Exits non-zero on the refusal.
import { ProtectionClaimSchema } from '../packages/contracts/dist/index.js';

const claim = {
  orderId: 'o_001',
  reason: 'failed pickup attempt',
  amount: 1000,
  faultClass: 'logistics', // not a §5.6 member — must refuse
  evidenceBundleId: 'veb_001',
  state: 'opened',
};
const result = ProtectionClaimSchema.safeParse(claim);
if (result.success) {
  console.error('BUG: a non-canonical faultClass parsed');
  process.exit(0);
}
console.error(`faultClass 'logistics' REFUSED at parse (§5.6 enumerates six members):`);
console.error(result.error.issues.map((i) => `  - ${i.path.join('.')}: ${i.code}`).join('\n'));
process.exit(1);
