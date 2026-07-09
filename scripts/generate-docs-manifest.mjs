#!/usr/bin/env node
// Generates docs.manifest.json (sha256 per canonical doc + package version)
// at the repo root AND as the copy shipped inside @platform/contracts.
// Deterministic: no timestamps, sorted keys.
import { createHash } from 'node:crypto';
import { readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), '..');
const docsDir = join(repoRoot, 'docs');
const contractsPkg = JSON.parse(
  readFileSync(join(repoRoot, 'packages', 'contracts', 'package.json'), 'utf8'),
);

const files = {};
for (const name of readdirSync(docsDir).filter((n) => n.endsWith('.md')).sort()) {
  const bytes = readFileSync(join(docsDir, name));
  files[name] = createHash('sha256').update(bytes).digest('hex');
}

const manifest = JSON.stringify({ packageVersion: contractsPkg.version, files }, null, 2) + '\n';
writeFileSync(join(repoRoot, 'docs.manifest.json'), manifest);
writeFileSync(join(repoRoot, 'packages', 'contracts', 'docs.manifest.json'), manifest);
console.log(
  `docs.manifest.json written (${Object.keys(files).length} docs, packageVersion ${contractsPkg.version})`,
);
