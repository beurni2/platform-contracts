#!/usr/bin/env node
// Bundle the flag worker for Miniflare (same treatment the app repos give
// their DO workers: esbuild → dist-worker/*.mjs).
import { build } from 'esbuild';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
await build({
  entryPoints: [join(ROOT, 'worker', 'flag-worker.ts')],
  bundle: true,
  format: 'esm',
  outfile: join(ROOT, 'dist-worker', 'flag-worker.mjs'),
  platform: 'neutral',
  conditions: ['import'],
});
console.log('flag worker bundled: dist-worker/flag-worker.mjs');
