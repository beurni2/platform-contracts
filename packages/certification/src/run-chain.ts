#!/usr/bin/env node
// GATE: the §2.3 fifteen-step chain must complete 15/15 against the
// reference adapters with the full nine-id §6 chain, and the HTML report
// (the E1 dashboard seed) must be generated. Exit non-zero on any missing
// link, duplicate id, or chain break.
import { writeFileSync } from 'node:fs';
import { makeReferenceChainAdapters } from './chain/reference-chain.js';
import { chainReportHtml } from './chain/report-html.js';
import { formatChainReport, runChain } from './chain/runner.js';

const outIndex = process.argv.indexOf('--out');
const outPath = outIndex >= 0 ? process.argv[outIndex + 1] : 'chain-report.html';

const report = await runChain(makeReferenceChainAdapters(), 'e1demo');
console.log(formatChainReport(report));
if (outPath) {
  writeFileSync(outPath, chainReportHtml(report));
  console.log(`\nchain report written: ${outPath}`);
}
process.exit(report.ok ? 0 : 1);
