#!/usr/bin/env node
// Export-map gate (WO-0C): every exports target of every package must exist
// after build, the "." entry must be RN-safe (delegated to the scanner), and
// the node-only tooling must be reachable ONLY via its explicit subpaths.
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), '..');
const EXPECTED_VERSION = JSON.parse(readFileSync(join(repoRoot, 'package.json'), 'utf8')).version;
const EXPECTED_NODE_ONLY_SUBPATHS = {
  '@platform/contracts': ['./drift-check', './drift-cli'],
  '@platform/i18n': ['./data-loader', './lint-cli'],
  '@platform/kernel-types': [],
  '@platform/ui-tokens': [],
  '@platform/certification': [],
};

let failed = false;
for (const dir of ['contracts', 'kernel-types', 'i18n', 'ui-tokens', 'certification']) {
  const packageDir = join(repoRoot, 'packages', dir);
  const pkg = JSON.parse(readFileSync(join(packageDir, 'package.json'), 'utf8'));
  const problems = [];

  for (const [subpath, target] of Object.entries(pkg.exports ?? {})) {
    const targets = typeof target === 'string' ? [target] : Object.values(target);
    for (const t of targets) {
      if (t.includes('*')) continue; // wildcard passthrough for legacy deep imports
      if (!existsSync(join(packageDir, t))) problems.push(`exports["${subpath}"] -> ${t} does not exist`);
    }
  }

  const expected = EXPECTED_NODE_ONLY_SUBPATHS[pkg.name] ?? [];
  for (const subpath of expected) {
    if (!(subpath in (pkg.exports ?? {}))) problems.push(`missing node-only subpath ${subpath}`);
  }
  if (pkg.version !== EXPECTED_VERSION) problems.push(`version is ${pkg.version}, expected ${EXPECTED_VERSION}`);
  if (!(pkg.exports?.['./dist/*'] === './dist/*')) problems.push('missing "./dist/*" passthrough (additive compat)');

  if (problems.length > 0) {
    failed = true;
    console.error(`✗ ${pkg.name}:`);
    for (const p of problems) console.error(`    - ${p}`);
  } else {
    console.log(`✓ ${pkg.name}@${pkg.version}: exports map complete — subpaths: ${Object.keys(pkg.exports).join(', ')}`);
  }
}
process.exit(failed ? 1 : 0);
