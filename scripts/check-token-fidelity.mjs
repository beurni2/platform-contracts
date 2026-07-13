#!/usr/bin/env node
// WO-5.0 value-fidelity gate: the built @platform/ui-tokens must equal the
// designer's docs/design/tokens.json, group for group, value for value. A
// single altered number/colour/string fails the build. This is the machine
// enforcement of "you may not alter one designer value."
//
// WO-5.6 AMENDMENT (founder-ruled, STANDING LAW): tokens.json's values stay
// IMMUTABLE — every key it carries must be present and deep-equal in the built
// package. But the built package MAY be a SUPERSET: additional tokens DERIVED
// from other canon design docs (docs/design/components.md, motion.md) are
// permitted, each anchored by scripts/check-design-dimensions.mjs. The relaxation
// is SCOPED to the groups that receive such tokens (SUPERSET_OK below); every
// other group stays strict deep-equal, so no stray key can hide anywhere else.
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { FIDELITY_MAP as MAP } from './token-surface.data.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const tokens = JSON.parse(readFileSync(join(root, 'docs', 'design', 'tokens.json'), 'utf8'));
const built = await import(join(root, 'packages', 'ui-tokens', 'dist', 'index.js'));

// tokens.json group → built export it must deep-equal (WO-5.7: shared source).

function getPath(obj, path) {
  return path.split('.').reduce((o, k) => (o == null ? o : o[k]), obj);
}

// WO-5.6: groups whose built value may be a SUPERSET of tokens.json (extra keys
// permitted, each pinned by check-design-dimensions.mjs). Everything else is
// strict deep-equal. `a` is always the tokens.json value, `b` the built value.
const SUPERSET_OK = new Set(['celebration', 'band', 'dimension']);

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
for (const [jsonPath, exportName] of Object.entries(MAP)) {
  const jsonVal = getPath(tokens, jsonPath);
  const builtVal = built[exportName];
  if (jsonVal === undefined) problems.push(`tokens.json missing ${jsonPath}`);
  else if (builtVal === undefined) problems.push(`ui-tokens missing export ${exportName}`);
  else {
    const d = diff(jsonVal, builtVal, exportName, SUPERSET_OK.has(exportName));
    if (d) problems.push(d);
  }
}

// No ⏳ / "CTO default" placeholder may survive anywhere in the shipped source.
const srcFiles = ['family.ts', 'themes.ts', 'index.ts'];
for (const f of srcFiles) {
  const txt = readFileSync(join(root, 'packages', 'ui-tokens', 'src', f), 'utf8');
  // The v0.7.0 provisional-value markers — none may survive now that every
  // value is a real designer number. ("placeholder" alone is legitimate design
  // vocabulary: skeletons ARE placeholders; only the ⏳/CTO-default markers fail.)
  if (/⏳|CTO[ -]default/i.test(txt)) {
    problems.push(`${f}: a ⏳/CTO-default provisional marker survives in shipped tokens`);
  }
}

if (problems.length) {
  console.error('token-fidelity FAILED — built tokens diverge from docs/design/tokens.json:');
  for (const p of problems) console.error('  - ' + p);
  process.exit(1);
}
console.log(
  `token-fidelity OK: ${Object.keys(MAP).length} groups deep-equal docs/design/tokens.json; no ⏳ placeholder survives`,
);
