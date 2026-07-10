#!/usr/bin/env node
// CONFORMANCE BEFORE RETIREMENT (Contract §3): "Before replacing a mock with
// the live sibling, both the live producer and the mock MUST pass the same
// conformance suite." Runs each pair side by side; 8/8 or nothing.
import {
  certifyAdapter,
  formatScorecard,
  referenceEligibilityMock,
  referencePaymentProviderMock,
  referenceReadinessMock,
  referenceSupplyProjectionMock,
} from '@platform/certification';
import {
  makeLiveEligibilityProducer,
  makeLiveReadinessProducer,
  makeLiveSupplyProjectionProducer,
  makeSandboxPaymentProviderAdapter,
} from '../dist/live-certifiables.js';

const PAIRS = [
  { domain: 'supply-projection', mock: referenceSupplyProjectionMock, live: makeLiveSupplyProjectionProducer(), liveName: 'LIVE boutik offer-service projection' },
  { domain: 'readiness', mock: referenceReadinessMock, live: makeLiveReadinessProducer(), liveName: 'LIVE boutik fulfillment-service readiness' },
  { domain: 'eligibility', mock: referenceEligibilityMock, live: makeLiveEligibilityProducer(), liveName: 'LIVE sera custody-service eligibility' },
  { domain: 'payment-provider', mock: referencePaymentProviderMock, live: makeSandboxPaymentProviderAdapter(), liveName: 'SANDBOX provider (shop-plus MockPaymentProvider composition — stays a mock at E1)' },
];

let allCertified = true;
for (const pair of PAIRS) {
  const [mockCard, liveCard] = [await certifyAdapter(pair.mock), await certifyAdapter(pair.live)];
  console.log(`\n=== §3 pair — ${pair.domain} ===`);
  console.log(`MOCK  · ${formatScorecard(mockCard)}`);
  console.log(`LIVE  · (${pair.liveName})\n        ${formatScorecard(liveCard).split('\n').join('\n        ')}`);
  if (!mockCard.certified || !liveCard.certified) allCertified = false;
}
console.log(allCertified ? '\nALL §3 PAIRS CERTIFIED — every scorecard 8/8, mock and live side by side' : '\nCONFORMANCE FAILED — a producer did not certify; DO NOT retire its mock');
process.exit(allCertified ? 0 : 1);
