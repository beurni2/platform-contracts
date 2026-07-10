#!/usr/bin/env node
// NEGATIVE REHEARSAL ON LIVE WIRING — one injected chain break: the
// validation_id is dropped from the step that mints it. The runner must
// bite on the REAL adapters (exit 1), not only on reference mocks.
import { runChain, formatChainReport, dropChainLink } from '@platform/certification';
import { createLiveWorld } from '../dist/world.js';
import { makeLiveChainAdapters } from '../dist/live-adapters.js';

const world = await createLiveWorld();
try {
  let tick = 0;
  const clock = { now: () => new Date(Date.UTC(2026, 6, 10, 13, 0, tick++)).toISOString() };
  const broken = dropChainLink(makeLiveChainAdapters(world, clock), 'validation_id');
  const report = await runChain(broken, 'e1live-broken');
  console.log(formatChainReport(report));
  if (report.ok) {
    console.error('NEGATIVE FAILED: the runner accepted a chain with validation_id dropped');
    process.exit(0); // exit 0 here means the gate (expecting failure) fails
  }
  console.error('runner correctly refused the broken chain (validation_id missing)');
  process.exit(1);
} finally {
  await world.dispose();
}
