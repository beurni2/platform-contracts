#!/usr/bin/env node
// WO-5.6/5.7 design-dimension gate. Canon's DESIGN DOCS state some component
// dimensions as pixel VALUES that docs/design/tokens.json never carried; WO-6.0
// found them held as kit literals. Those values now live as tokens in
// @platform/ui-tokens — but ONLY where a canon design-doc line states them, or
// where canon's OWN type scale computes them. This gate is the machine
// enforcement of derive-never-invent for those tokens:
//
//   1. every derived token in the built package equals its manifest value;
//   2a. QUOTE anchor: that value is byte-present in its source doc line (the
//       exact quote), and the quote genuinely carries the number;
//   2b. COMPUTED anchor: that value is the product of canon's own token leaves
//       (e.g. the badge glyph fills the labelXS line box: size × lh);
//   3. COMPLETENESS — every key the built tokens add BEYOND tokens.json is in
//      the shared DERIVED manifest. Nothing enters ui-tokens undERIVED.
//
// Companion to check-token-fidelity.mjs (tokens.json ⊆ built) and
// check-token-coverage.mjs (the union is the whole surface). The DERIVED /
// OWNED_GROUPS lists live in token-surface.data.mjs — one source, three gates.
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { DERIVED, OWNED_GROUPS } from './token-surface.data.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const tokens = JSON.parse(readFileSync(join(root, 'docs', 'design', 'tokens.json'), 'utf8'));
const built = await import(join(root, 'packages', 'ui-tokens', 'dist', 'index.js'));

function getPath(obj, path) {
  return path.split('.').reduce((o, k) => (o == null ? o : o[k]), obj);
}

/** Leaf paths of a plain object, prefixed — e.g. 'band.priceBand.noteWidth'. */
function leafPaths(obj, prefix) {
  if (obj == null || typeof obj !== 'object' || Array.isArray(obj)) return [prefix];
  return Object.keys(obj).flatMap((k) => leafPaths(obj[k], `${prefix}.${k}`));
}

const problems = [];

// Static non-vacuity: a QUOTE anchor whose quote omits its own number could pass
// against an unrelated line; a COMPUTED anchor must declare factors. Fail first.
for (const d of DERIVED) {
  if (d.kind === 'quote') {
    if (!d.quote.includes(String(d.value))) {
      problems.push(`manifest ${d.path}: quote does not contain the value ${d.value} — the doc check would be vacuous`);
    }
  } else if (d.kind === 'computed') {
    if (!Array.isArray(d.factors) || d.factors.length < 2 || d.op !== 'product') {
      problems.push(`manifest ${d.path}: a computed anchor needs op 'product' and ≥2 factors`);
    }
  } else {
    problems.push(`manifest ${d.path}: unknown anchor kind ${JSON.stringify(d.kind)}`);
  }
}

// (1)+(2) Each derived token equals its value AND that value is warranted —
// either byte-stated in canon (quote) or computed from canon's own leaves.
for (const d of DERIVED) {
  const builtVal = getPath(built, d.path);
  if (builtVal === undefined) {
    problems.push(`ui-tokens missing derived token ${d.path}`);
  } else if (builtVal !== d.value) {
    problems.push(`${d.path}: built ${JSON.stringify(builtVal)} !== derived ${d.value}`);
  }
  if (d.kind === 'quote') {
    const docText = readFileSync(join(root, d.doc), 'utf8');
    if (!docText.includes(d.quote)) {
      problems.push(`${d.path}: canon doc ${d.doc} no longer states "${d.quote}" — derivation broken`);
    }
  } else if (d.kind === 'computed') {
    const parts = d.factors.map((f) => getPath(built, f));
    if (parts.some((p) => typeof p !== 'number')) {
      problems.push(`${d.path}: a computed factor is missing/non-numeric (${d.factors.join(' × ')})`);
    } else {
      const product = parts.reduce((a, b) => a * b, 1);
      if (product !== d.value) {
        problems.push(`${d.path}: canon computes ${d.factors.join(' × ')} = ${product} !== ${d.value} — derivation broken`);
      }
    }
  }
}

// (3) Completeness: every leaf the built group adds beyond tokens.json must be a
// manifest token. Nothing sneaks into ui-tokens without a warrant.
for (const g of OWNED_GROUPS) {
  const builtLeaves = built[g] === undefined ? [] : leafPaths(built[g], g);
  const jsonLeaves = tokens[g] === undefined ? [] : leafPaths(tokens[g], g);
  const added = builtLeaves.filter((p) => !jsonLeaves.includes(p));
  const manifestPaths = DERIVED.filter((d) => d.path === g || d.path.startsWith(`${g}.`)).map((d) => d.path);
  for (const p of added) {
    if (!manifestPaths.includes(p)) {
      problems.push(`${p}: added to ui-tokens beyond tokens.json but NOT derived here — invent-a-token guard`);
    }
  }
  for (const p of manifestPaths) {
    if (!added.includes(p)) {
      problems.push(`${p}: declared derived but not an addition over tokens.json (already present, or missing)`);
    }
  }
}

if (problems.length) {
  console.error('design-dimensions FAILED — a derived token diverges from canon:');
  for (const p of problems) console.error('  - ' + p);
  process.exit(1);
}
console.log(
  `design-dimensions OK: ${DERIVED.length} tokens each equal their value AND are warranted ` +
    `(byte-stated in canon or computed from its type scale); no undERIVED addition survives in {${OWNED_GROUPS.join(', ')}}`,
);
