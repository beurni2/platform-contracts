#!/usr/bin/env node
// RN-safe root-entry gate (WO-0C): walks the static import graph of each
// package's "." export target and fails (exit 1) if ANY node builtin
// (fs, path, child_process, url, os, crypto, … — the full builtinModules
// set, with or without the node: prefix) appears anywhere in the graph.
// @platform/* siblings are followed into their own dist; other externals
// must be on the RN-compatible allowlist.
//
//   node scripts/scan-rn-safe-entry.mjs                 # scan all four packages
//   node scripts/scan-rn-safe-entry.mjs --package-dir X # scan one package root (fixtures)
import { builtinModules } from 'node:module';
import { readFileSync, existsSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), '..');
const RN_SAFE_EXTERNAL_ALLOWLIST = new Set(['zod']);
const BUILTINS = new Set([...builtinModules, ...builtinModules.map((m) => `node:${m}`)]);

const SPECIFIER_PATTERNS = [
  /(?:import|export)\s+[^;'"]*?from\s*['"]([^'"]+)['"]/g, // import x from '...' / export ... from '...'
  /import\s*['"]([^'"]+)['"]/g, // bare side-effect import
  /import\s*\(\s*['"]([^'"]+)['"]\s*\)/g, // dynamic import
  /require\s*\(\s*['"]([^'"]+)['"]\s*\)/g, // CJS interop, just in case
];

function specifiersOf(source) {
  const found = new Set();
  for (const pattern of SPECIFIER_PATTERNS) {
    for (const match of source.matchAll(pattern)) found.add(match[1]);
  }
  return found;
}

function resolveRelative(fromFile, spec) {
  const base = resolve(dirname(fromFile), spec);
  for (const candidate of [base, `${base}.js`, join(base, 'index.js')]) {
    if (existsSync(candidate)) return candidate;
  }
  return null;
}

function rootEntryOf(packageDir) {
  const pkg = JSON.parse(readFileSync(join(packageDir, 'package.json'), 'utf8'));
  const dot = pkg.exports?.['.'];
  const target = typeof dot === 'string' ? dot : dot?.import;
  if (!target) throw new Error(`${packageDir}: no "." import target in exports`);
  return { name: pkg.name, entry: join(packageDir, target) };
}

function scanPackage(packageDir) {
  const { name, entry } = rootEntryOf(packageDir);
  const violations = [];
  const externals = new Set();
  const visited = new Set();
  const queue = [entry];

  while (queue.length > 0) {
    const file = queue.pop();
    if (visited.has(file)) continue;
    visited.add(file);
    if (!existsSync(file)) {
      violations.push(`unresolvable module in graph: ${file}`);
      continue;
    }
    const source = readFileSync(file, 'utf8');
    for (const spec of specifiersOf(source)) {
      if (spec.startsWith('.')) {
        const resolved = resolveRelative(file, spec);
        if (resolved === null) violations.push(`unresolvable relative import '${spec}' in ${file}`);
        else queue.push(resolved);
      } else if (BUILTINS.has(spec)) {
        violations.push(`node builtin '${spec}' imported in ${file}`);
      } else if (spec.startsWith('@platform/')) {
        const sibling = join(repoRoot, 'packages', spec.split('/')[1]);
        queue.push(rootEntryOf(sibling).entry);
      } else if (RN_SAFE_EXTERNAL_ALLOWLIST.has(spec.split('/')[0])) {
        externals.add(spec);
      } else {
        violations.push(`unvetted external '${spec}' in RN-safe root graph (${file}) — add to allowlist only if RN-compatible`);
      }
    }
  }
  return { name, files: visited.size, externals: [...externals].sort(), violations };
}

const args = process.argv.slice(2);
const packageDirs =
  args[0] === '--package-dir'
    ? [resolve(args[1])]
    : ['contracts', 'kernel-types', 'i18n', 'ui-tokens'].map((p) => join(repoRoot, 'packages', p));

let failed = false;
for (const dir of packageDirs) {
  const report = scanPackage(dir);
  if (report.violations.length > 0) {
    failed = true;
    console.error(`✗ ${report.name}: root entry graph is NOT RN-safe (${report.files} files scanned):`);
    for (const v of report.violations) console.error(`    - ${v}`);
  } else {
    console.log(
      `✓ ${report.name}: root entry graph RN-safe — ${report.files} files, no node builtins, externals: [${report.externals.join(', ') || 'none'}]`,
    );
  }
}
process.exit(failed ? 1 : 0);
