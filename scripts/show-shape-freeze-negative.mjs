#!/usr/bin/env node
// Raw demonstration that the shape-freeze gate can fail (WO-0 evidence):
// against a snapshot tampered to contain `kittingSealId` on the Quote, the
// comparison must report the divergence. Exits non-zero on detection.
import { readFileSync } from 'node:fs';
import { buildApiSurface, compareApiSurface } from '../packages/contracts/dist/gates/api-surface.js';
import * as publicApi from '../packages/contracts/dist/index.js';

const pkg = JSON.parse(readFileSync(new URL('../packages/contracts/package.json', import.meta.url), 'utf8'));
const current = buildApiSurface(publicApi, pkg.version);
const tampered = JSON.parse(JSON.stringify(current));
tampered.schemas.QuoteSchema.properties.kittingSealId = { type: 'string' };

const diff = compareApiSurface(current, tampered);
if (diff.ok) {
  console.error('BUG: silent Quote schema change not detected — the freeze asserts nothing');
  process.exit(0); // exit 0 signals the gate FAILED to catch it
}
console.error('shape-freeze FAILED (as required against the tampered snapshot):');
for (const p of diff.problems) console.error(`  - ${p}`);
process.exit(1);
