#!/usr/bin/env node
// THE RUN — Contract §2.3 steps 1–15 through the LIVE adapters on one
// correlation chain, with the §7.2 checkout kill-switch demonstrated IN-RUN:
// OFF mid-sequence → quote issuance refuses closed → ON → the run completes.
// Writes chain-report.html (the E1 dashboard) and prints reconciliation.
import { writeFileSync } from 'node:fs';
import { runChain, formatChainReport, chainReportHtml } from '@platform/certification';
import { QuoteSchema } from '@platform/contracts';
import { issueQuote, WORKED_BASELINE_INPUT } from '@shop-plus/commerce-core';
import { createLiveWorld } from '../dist/world.js';
import { makeLiveChainAdapters } from '../dist/live-adapters.js';

const outIndex = process.argv.indexOf('--out');
const outPath = outIndex >= 0 ? process.argv[outIndex + 1] : 'chain-report.html';
const seed = 'e1live';

const world = await createLiveWorld();
try {
  // ---- §7.2 KILL-SWITCH DEMONSTRATION (live flag service, remote toggle) ----
  console.log('=== §7.2 checkout kill-switch — live flag service ===');
  const killOn = await world.setKill('checkout', true);
  console.log(`remote toggle → ${JSON.stringify(killOn)}`);
  const killedSnapshot = await world.flagSnapshot();
  console.log(`snapshot ${killedSnapshot.version}: kills=[${killedSnapshot.kills.join(',')}]`);
  const refused = issueQuote(
    { flags: killedSnapshot, now: () => new Date(), newId: () => 'quote_killed_demo' },
    { listingRef: 'lst_demo', offerRef: 'offer_demo@1', attributionResellerId: 'rs_demo', ...WORKED_BASELINE_INPUT },
  );
  if (refused.ok || refused.reason !== 'checkout_killed') {
    console.error(`KILL-SWITCH FAILED: expected checkout_killed refusal, got ${JSON.stringify(refused)}`);
    process.exit(1);
  }
  console.log(`checkout OFF → issueQuote refused closed: reason=${refused.reason}`);
  const killOff = await world.setKill('checkout', false);
  console.log(`remote toggle → ${JSON.stringify(killOff)}`);
  const restored = await world.flagSnapshot();
  console.log(`snapshot ${restored.version}: kills=[${restored.kills.join(',')}] — checkout restored\n`);

  // ---- THE FIFTEEN STEPS, LIVE ----
  let tick = 0;
  const clock = { now: () => new Date(Date.UTC(2026, 6, 10, 12, 0, tick++)).toISOString() };
  const adapters = makeLiveChainAdapters(world, clock);
  const report = await runChain(adapters, seed);
  console.log(formatChainReport(report));
  if (outPath) {
    writeFileSync(outPath, chainReportHtml(report));
    console.log(`\nchain report written: ${outPath}`);
  }

  // ---- MONEY EVIDENCE (log-copied by the DoD) ----
  const quote = QuoteSchema.parse(world.slots.quote);
  const orderId = report.chainIds.order_id;
  const obligations = world.slots.orderSpine.ledger.obligationsFor(orderId);
  const escrow = world.slots.orderSpine.ledger.escrowFor(orderId);
  console.log('\n=== money evidence (COPIED amounts, reconciled to the franc) ===');
  console.log(`quote: productSubtotal=${quote.productSubtotal} buyerTotal=${quote.buyerTotal} sellerNet=${quote.sellerNet} resellerNet=${quote.resellerNet} platformProductFeeRevenue=${quote.platformProductFeeRevenue}`);
  console.log(`escrow checkout leg: amount=${escrow.paymentLegs[0].amount} status=${escrow.paymentLegs[0].status} (provider truth)`);
  for (const ob of obligations) console.log(`obligation: party=${ob.party} amount=${ob.amount} state=${ob.state} (COPIED from the Quote)`);
  const payouts = world.slots.payoutEvents.filter((e) => e.name === 'payout.paid.v1');
  for (const p of payouts) console.log(`payout.paid: collectRef=${p.payload.collectRef} amount=${p.payload.amount} (reconciled)`);

  process.exit(report.ok ? 0 : 1);
} finally {
  await world.dispose();
}
