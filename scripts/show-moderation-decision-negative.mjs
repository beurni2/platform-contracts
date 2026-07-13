#!/usr/bin/env node
// WO-5.10 — ModerationDecisionSchema refuses the two malformed decisions the WO
// names: a REASONLESS changes_requested (a silent rejection) and a SUPPLIER-actor
// decision (self-moderation). Also shows the generic 'rejected' terminal is
// unrepresentable. NON-VACUOUS: two VALID decisions must PARSE, so the schema is
// not trivially rejecting everything. Exits 1 only when the valids parse AND
// every malformed decision is refused.
import { ModerationDecisionSchema } from '../packages/contracts/dist/index.js';

const ok = (label, value) => {
  const r = ModerationDecisionSchema.safeParse(value);
  if (!r.success) {
    console.error(`BUG: a VALID decision was refused — the schema over-rejects (${label})`);
    console.error(r.error.issues.map((i) => `  - ${i.path.join('.')}: ${i.message}`).join('\n'));
    return false;
  }
  return true;
};
const refused = (label, value) => {
  const r = ModerationDecisionSchema.safeParse(value);
  if (r.success) {
    console.error(`BUG: ${label} PARSED — the schema asserts nothing`);
    return false;
  }
  console.error(`REFUSED (${label}): ${r.error.issues.map((i) => i.message).join(' · ')}`);
  return true;
};

// Non-vacuity: valid decisions parse.
const validsOk =
  ok('approved by ops', { decision: 'approved', decided_by: 'ops:moderation:desk3' }) &&
  ok('changes_requested with a reason by ops', {
    decision: 'changes_requested',
    reasons: ['facts_incomplete'],
    decided_by: 'ops:moderation:desk3',
  });

// The two refusals the WO names + the unrepresentable generic terminal.
const refusalsOk =
  refused('reasonless changes_requested (silent rejection)', {
    decision: 'changes_requested',
    reasons: [],
    decided_by: 'ops:moderation:desk3',
  }) &&
  refused('supplier-actor decision (self-moderation)', {
    decision: 'changes_requested',
    reasons: ['authenticity_concern'],
    decided_by: 'supplier:acme-123',
  }) &&
  refused("generic 'rejected' terminal", {
    decision: 'rejected',
    decided_by: 'ops:moderation:desk3',
  });

if (validsOk && refusalsOk) {
  console.error('moderation-decision negative OK: valids parse; reasonless + supplier-actor + generic-rejected all REFUSED');
  process.exit(1); // the malformed decisions failed as required — harness expects 'fail'
}
console.error('NEGATIVE FIXTURE MISBEHAVED — a valid was rejected or a malformed decision slipped through');
process.exit(0);
