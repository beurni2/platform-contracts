#!/usr/bin/env node
// WO-5.0 value-fidelity gate: the built @platform/ui-tokens must equal the
// designer's tokens.json, group for group, value for value. A single altered
// number/colour/string fails the build. This is the machine enforcement of
// "you may not alter one designer value."
//
// WO-5.6 AMENDMENT (founder-ruled, STANDING LAW): tokens.json's values stay
// IMMUTABLE — every key it carries must be present and deep-equal in the built
// package. But the built package MAY be a SUPERSET: additional tokens DERIVED
// from other canon design docs are permitted, each anchored by
// scripts/check-design-dimensions.mjs. The relaxation is SCOPED to the groups
// that receive such tokens (SUPERSET_OK, per surface); every other group stays
// strict deep-equal.
//
// WO-FP-0: now runs over EVERY surface in SURFACES — faso-premium (dist/index.js
// ↔ docs/design/tokens.json) and grand-teint (dist/legacy/index.js ↔
// docs/design/tokens.grand-teint.json). Each surface deep-equals its own pair.
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { SURFACES } from './token-surface.data.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

function getPath(obj, path) {
  return path.split('.').reduce((o, k) => (o == null ? o : o[k]), obj);
}

// Order-insensitive, type-strict deep equality; reports the first divergence
// path. When `superset` is true, tokens.json (a) must be a subset of built (b):
// every json key present and equal, extra built keys ignored (they are pinned
// elsewhere). Immutability of designer values holds in both modes.
function diff(a, b, path, superset) {
  if (Array.isArray(a) || Array.isArray(b)) {
    if (!Array.isArray(a) || !Array.isArray(b)) return `${path}: array vs non-array`;
    if (a.length !== b.length) return `${path}: array length ${a.length} vs ${b.length}`;
    for (let i = 0; i < a.length; i++) {
      const d = diff(a[i], b[i], `${path}[${i}]`, superset);
      if (d) return d;
    }
    return null;
  }
  if (a && b && typeof a === 'object' && typeof b === 'object') {
    const ka = Object.keys(a).sort();
    const kb = Object.keys(b).sort();
    if (superset) {
      const missing = ka.filter((k) => !kb.includes(k));
      if (missing.length) return `${path}: built is missing tokens.json key(s) {${missing}}`;
    } else if (ka.join(',') !== kb.join(',')) {
      return `${path}: keys {${ka}} vs {${kb}}`;
    }
    for (const k of ka) {
      const d = diff(a[k], b[k], `${path}.${k}`, superset);
      if (d) return d;
    }
    return null;
  }
  // primitives — strict, including string codepoints (catches U+202F vs space)
  if (a !== b) {
    const enc = (v) => (typeof v === 'string' ? JSON.stringify(v) : String(v));
    return `${path}: ${enc(a)} (json) !== ${enc(b)} (built)`;
  }
  return null;
}

const problems = [];
let groupCount = 0;

for (const surface of SURFACES) {
  const tokens = JSON.parse(readFileSync(join(root, ...surface.tokensJson), 'utf8'));
  const built = await import(join(root, ...surface.entry));
  const superset = new Set(surface.SUPERSET_OK);

  for (const [jsonPath, exportName] of Object.entries(surface.FIDELITY_MAP)) {
    groupCount++;
    const jsonVal = getPath(tokens, jsonPath);
    const builtVal = built[exportName];
    if (jsonVal === undefined) problems.push(`[${surface.name}] tokens.json missing ${jsonPath}`);
    else if (builtVal === undefined) problems.push(`[${surface.name}] ui-tokens missing export ${exportName}`);
    else {
      const d = diff(jsonVal, builtVal, `${surface.name}:${exportName}`, superset.has(exportName));
      if (d) problems.push(d);
    }
  }

  // No ⏳ / "CTO default" placeholder may survive anywhere in the shipped source.
  for (const f of surface.srcFiles) {
    const txt = readFileSync(join(root, ...surface.srcDir, f), 'utf8');
    if (/⏳|CTO[ -]default/i.test(txt)) {
      problems.push(`[${surface.name}] ${f}: a ⏳/CTO-default provisional marker survives in shipped tokens`);
    }
  }
}

if (problems.length) {
  console.error('token-fidelity FAILED — built tokens diverge from their tokens.json:');
  for (const p of problems) console.error('  - ' + p);
  process.exit(1);
}
console.log(
  `token-fidelity OK: ${groupCount} groups across ${SURFACES.length} surfaces (${SURFACES.map((s) => s.name).join(', ')}) deep-equal their tokens.json; no ⏳ placeholder survives`,
);
