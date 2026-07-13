#!/usr/bin/env node
// WO-5.7 gate-COVERAGE meta-check (named debt ①). check-token-fidelity.mjs owns
// tokens.json values; check-design-dimensions.mjs owns doc/computed-derived
// values. Both read HAND-MAINTAINED lists. NOTHING asserted that their union is
// the WHOLE built ui-tokens surface — so a brand-new export (e.g. the designer's
// proposed top-level `icon` group) could be added and SILENTLY NOT SHIP while
// both gates reported green. That is the vacuous-test class (§8): a token that
// never renders while the machine says all is well.
//
// This gate closes it. Every built export is owned by EXACTLY ONE gate:
//   TOP-LEVEL: built export ∈ (FIDELITY_MAP exports ∪ {dimension} ∪ STRUCTURAL)
//   LEAF     : every value leaf ∈ (tokens.json leaves ∪ DERIVED paths)
// A stray export or a stray leaf owned by no gate FAILS THE BUILD. Lists come
// from token-surface.data.mjs (one source, three gates).
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { FIDELITY_MAP, DERIVED, STRUCTURAL_EXPORTS } from './token-surface.data.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const tokens = JSON.parse(readFileSync(join(root, 'docs', 'design', 'tokens.json'), 'utf8'));
const built = await import(join(root, 'packages', 'ui-tokens', 'dist', 'index.js'));

function getPath(obj, path) {
  return path.split('.').reduce((o, k) => (o == null ? o : o[k]), obj);
}
/** Leaf paths of a plain object, prefixed. */
function leafPaths(obj, prefix) {
  if (obj == null || typeof obj !== 'object' || Array.isArray(obj)) return [prefix];
  return Object.keys(obj).flatMap((k) => leafPaths(obj[k], `${prefix}.${k}`));
}

const problems = [];

// Top-level ownership: fidelity exports + the design-dimension group + declared
// structural (non-value) exports. `dimension` is the only OWNED group absent
// from FIDELITY_MAP (celebration/band are fidelity exports that also carry
// derived additions — still fidelity-owned at the top level).
const fidelityExports = Object.values(FIDELITY_MAP);
const ownedTopLevel = new Set([...fidelityExports, 'dimension', ...STRUCTURAL_EXPORTS]);

// The built runtime export surface (skip TS type-only names — none at runtime).
const builtTop = Object.keys(built).filter((k) => k !== 'default');

// 1 — no built export is unowned; no owner is dangling.
for (const e of builtTop) {
  if (!ownedTopLevel.has(e)) {
    problems.push(`export '${e}' is owned by NO gate — add it to FIDELITY_MAP, DERIVED, or STRUCTURAL_EXPORTS (or it ships unchecked / not at all)`);
  }
}
for (const e of ownedTopLevel) {
  if (!builtTop.includes(e)) {
    problems.push(`'${e}' is claimed by a gate list but is NOT a built export — stale owner`);
  }
}

// 2 — leaf completeness for every VALUE export (structural excluded): each leaf
// is either an immutable tokens.json leaf or a DERIVED path.
const coveredLeaves = new Set();
for (const [jsonPath, exportName] of Object.entries(FIDELITY_MAP)) {
  const jsonVal = getPath(tokens, jsonPath);
  if (jsonVal !== undefined) for (const p of leafPaths(jsonVal, exportName)) coveredLeaves.add(p);
}
for (const d of DERIVED) coveredLeaves.add(d.path);

for (const e of builtTop) {
  if (STRUCTURAL_EXPORTS.includes(e)) continue;
  for (const leaf of leafPaths(built[e], e)) {
    if (!coveredLeaves.has(leaf)) {
      problems.push(`leaf '${leaf}' is checked by NO gate — not a tokens.json value, not a DERIVED token`);
    }
  }
}

if (problems.length) {
  console.error('token-coverage FAILED — a ui-tokens export/leaf escapes every gate:');
  for (const p of problems) console.error('  - ' + p);
  process.exit(1);
}
console.log(
  `token-coverage OK: ${builtTop.length} exports each owned by exactly one gate ` +
    `(${fidelityExports.length} fidelity · dimension · ${STRUCTURAL_EXPORTS.length} structural); every value leaf is tokens.json or DERIVED`,
);
