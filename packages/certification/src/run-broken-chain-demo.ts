#!/usr/bin/env node
// NEGATIVE GATE: dropping one id (validation_id) from the chain must fail
// the runner. Exit 1 = correctly detected; exit 0 = the runner asserts
// nothing.
import { dropChainLink, makeReferenceChainAdapters } from './chain/reference-chain.js';
import { formatChainReport, runChain } from './chain/runner.js';

const broken = dropChainLink(makeReferenceChainAdapters(), 'validation_id');
const report = await runChain(broken, 'e1demo');
console.log(formatChainReport(report));
if (report.ok) {
  console.error('BUG: the chain passed with validation_id dropped');
  process.exit(0);
}
console.error('chain REFUSED as required (missing link detected)');
process.exit(1);
