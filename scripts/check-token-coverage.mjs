#!/usr/bin/env node
// WO-5.7 gate-COVERAGE meta-check. check-token-fidelity.mjs owns tokens.json
// values; check-design-dimensions.mjs owns doc/computed-derived values. Both
// read HAND-MAINTAINED lists. This gate asserts their union is the WHOLE built
// ui-tokens surface — so a brand-new export could NOT be added and SILENTLY NOT
// SHIP while both gates reported green (the vacuous-test class, §8).
//
// Every built export is owned by EXACTLY ONE gate, per surface:
//   TOP-LEVEL: built export ∈ (FIDELITY_MAP exports ∪ OWNED_GROUPS ∪ STRUCTURAL)
//   LEAF     : every value leaf ∈ (tokens.json leaves ∪ DERIVED paths)
// A stray export or a stray leaf owned by no gate FAILS THE BUILD.
//
// WO-FP-0: loops over SURFACES — faso-premium (dist/index.js) and grand-teint
// (dist/legacy/index.js). Each surface's exports are covered by its own lists,
// so the coverage meta-gate OWNS the new Faso Premium groups; a planted stray on
// either surface fires. Lists come from token-surface.data.mjs (one source).
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { SURFACES } from './token-surface.data.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

function getPath(obj, path) {
  return path.split('.').reduce((o, k) => (o == null ? o : o[k]), obj);
}
/** Leaf paths of a plain object, prefixed. */
function leafPaths(obj, prefix) {
  if (obj == null || typeof obj !== 'object' || Array.isArray(obj)) return [prefix];
  return Object.keys(obj).flatMap((k) => leafPaths(obj[k], `${prefix}.${k}`));
}

const problems = [];
let exportCount = 0;

for (const surface of SURFACES) {
  const tokens = JSON.parse(readFileSync(join(root, ...surface.tokensJson), 'utf8'));
  const built = await import(join(root, ...surface.entry));

  const fidelityExports = Object.values(surface.FIDELITY_MAP);
  // OWNED_GROUPS covers any owned group not already a FIDELITY_MAP export.
  const ownedTopLevel = new Set([...fidelityExports, ...surface.OWNED_GROUPS, ...surface.STRUCTURAL_EXPORTS]);

  // The built runtime export surface (skip TS type-only names — none at runtime).
  const builtTop = Object.keys(built).filter((k) => k !== 'default');
  exportCount += builtTop.length;

  // 1 — no built export is unowned; no owner is dangling.
  for (const e of builtTop) {
    if (!ownedTopLevel.has(e)) {
      problems.push(`[${surface.name}] export '${e}' is owned by NO gate — add it to FIDELITY_MAP, DERIVED, or STRUCTURAL_EXPORTS (or it ships unchecked / not at all)`);
    }
  }
  for (const e of ownedTopLevel) {
    if (!builtTop.includes(e)) {
      problems.push(`[${surface.name}] '${e}' is claimed by a gate list but is NOT a built export — stale owner`);
    }
  }

  // 2 — leaf completeness for every VALUE export (structural excluded): each
  // leaf is either an immutable tokens.json leaf or a DERIVED path.
  const coveredLeaves = new Set();
  for (const [jsonPath, exportName] of Object.entries(surface.FIDELITY_MAP)) {
    const jsonVal = getPath(tokens, jsonPath);
    if (jsonVal !== undefined) for (const p of leafPaths(jsonVal, exportName)) coveredLeaves.add(p);
  }
  for (const d of surface.DERIVED) coveredLeaves.add(d.path);

  for (const e of builtTop) {
    if (surface.STRUCTURAL_EXPORTS.includes(e)) continue;
    for (const leaf of leafPaths(built[e], e)) {
      if (!coveredLeaves.has(leaf)) {
        problems.push(`[${surface.name}] leaf '${leaf}' is checked by NO gate — not a tokens.json value, not a DERIVED token`);
      }
    }
  }
}

if (problems.length) {
  console.error('token-coverage FAILED — a ui-tokens export/leaf escapes every gate:');
  for (const p of problems) console.error('  - ' + p);
  process.exit(1);
}
console.log(
  `token-coverage OK: ${exportCount} exports across ${SURFACES.length} surfaces (${SURFACES.map((s) => s.name).join(', ')}) each owned by exactly one gate; every value leaf is tokens.json or DERIVED`,
);
