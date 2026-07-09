import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import * as publicApi from '../src/index.js';
import { buildApiSurface, compareApiSurface, type ApiSurface } from '../src/gates/api-surface.js';
import { canonicalJsonStringify } from '../src/canonical-json.js';

const SNAPSHOT_PATH = join(
  dirname(fileURLToPath(import.meta.url)),
  '..',
  'snapshots',
  'api-surface.snapshot.json',
);
const PACKAGE_VERSION = (
  JSON.parse(
    readFileSync(join(dirname(fileURLToPath(import.meta.url)), '..', 'package.json'), 'utf8'),
  ) as { version: string }
).version;

describe('shape-freeze — public API + schema snapshot', () => {
  it('the current surface matches the committed snapshot (deliberate version bump required to change)', () => {
    const current = buildApiSurface(publicApi as Record<string, unknown>, PACKAGE_VERSION);
    if (process.env['UPDATE_API_SNAPSHOT'] === '1') {
      writeFileSync(SNAPSHOT_PATH, canonicalJsonStringify(current) + '\n');
    }
    const snapshot = JSON.parse(readFileSync(SNAPSHOT_PATH, 'utf8')) as ApiSurface;
    const diff = compareApiSurface(current, snapshot);
    expect(
      diff.problems,
      'public API or schemas changed — a canonical-shape change requires a deliberate version bump + snapshot update in the same PR',
    ).toEqual([]);
    expect(diff.ok).toBe(true);
  });

  it('NEGATIVE FIXTURE: a tampered snapshot (silent Quote field addition) fails the freeze', () => {
    const current = buildApiSurface(publicApi as Record<string, unknown>, PACKAGE_VERSION);
    const tampered = JSON.parse(canonicalJsonStringify(current)) as ApiSurface;
    // Simulate someone silently sneaking `kittingSealId` into the frozen Quote schema.
    (tampered.schemas as Record<string, { properties?: Record<string, unknown> }>)[
      'QuoteSchema'
    ]!.properties!['kittingSealId'] = { type: 'string' };
    const diff = compareApiSurface(current, tampered);
    expect(diff.ok).toBe(false);
    expect(diff.problems).toContain('schema changed: QuoteSchema');
  });

  it('NEGATIVE FIXTURE: removing an export fails the freeze', () => {
    const current = buildApiSurface(publicApi as Record<string, unknown>, PACKAGE_VERSION);
    const snapshot = JSON.parse(readFileSync(SNAPSHOT_PATH, 'utf8')) as ApiSurface;
    const mutilated = { ...current, exports: { ...current.exports } };
    delete mutilated.exports['assertQuoteReconciles'];
    const diff = compareApiSurface(mutilated, snapshot);
    expect(diff.ok).toBe(false);
    expect(diff.problems).toContain('export removed: assertQuoteReconciles');
  });
});
