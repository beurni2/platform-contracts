#!/usr/bin/env node
// NEGATIVE GATE: a malformed envelope (missing correlation_id) must fail
// envelope conformance. Exit 1 = correctly refused; exit 0 = bug.
import { checkEnvelopeConformance } from './envelope-conformance.js';

const malformed = {
  name: 'checkout.quote_created.v1',
  envelope: {
    command_id: 'cmd_1',
    // correlation_id MISSING — the chain cannot exist without it
    aggregateVersion: 1,
    actor: 'mock:payment-provider',
    serverTime: '2026-07-09T10:00:00Z',
    version: 'v1',
  },
  payload: {},
};

const report = checkEnvelopeConformance([malformed]);
if (report.ok) {
  console.error('BUG: a malformed envelope passed conformance');
  process.exit(0);
}
console.error('envelope conformance REFUSED as required:');
for (const p of report.problems) console.error(`  - ${p}`);
process.exit(1);
