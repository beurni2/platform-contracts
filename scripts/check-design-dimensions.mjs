#!/usr/bin/env node
// WO-5.6/5.7 design-dimension gate. Canon's DESIGN DOCS state some component
// dimensions as pixel VALUES that tokens.json never carried; WO-6.0 found them
// held as kit literals. Those values now live as tokens in @platform/ui-tokens —
// but ONLY where a canon design-doc line states them, or where canon's OWN type
// scale computes them. This gate is the machine enforcement of
// derive-never-invent for those tokens:
//
//   1. every derived token in the built package equals its manifest value;
//   2a. QUOTE anchor: that value is byte-present in its source doc line;
//   2b. COMPUTED anchor: that value is the product of canon's own token leaves;
//   3. COMPLETENESS — every key the built tokens add BEYOND tokens.json is in
//      the shared DERIVED manifest. Nothing enters ui-tokens undERIVED.
//
// WO-FP-0: loops over SURFACES. faso-premium has no doc-derived tokens (DERIVED
// empty), so this gate owns grand-teint's eleven; the gate stays non-vacuous
// (its negative fixture tampers a grand-teint derived token + its source doc).
// The DERIVED / OWNED_GROUPS lists live in token-surface.data.mjs (one source).
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { SURFACES } from './token-surface.data.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

function getPath(obj, path) {
  return path.split('.').reduce((o, k) => (o == null ? o : o[k]), obj);
}
/** Leaf paths of a plain object, prefixed — e.g. 'band.priceBand.noteWidth'. */
function leafPaths(obj, prefix) {
  if (obj == null || typeof obj !== 'object' || Array.isArray(obj)) return [prefix];
  return Object.keys(obj).flatMap((k) => leafPaths(obj[k], `${prefix}.${k}`));
}

const problems = [];
let derivedCount = 0;

for (const surface of SURFACES) {
  const tokens = JSON.parse(readFileSync(join(root, ...surface.tokensJson), 'utf8'));
  const built = await import(join(root, ...surface.entry));
  derivedCount += surface.DERIVED.length;

  // Static non-vacuity: a QUOTE anchor whose quote omits its own number could
  // pass against an unrelated line; a COMPUTED anchor must declare factors.
  for (const d of surface.DERIVED) {
    if (d.kind === 'quote') {
      if (!d.quote.includes(String(d.value))) {
        problems.push(`[${surface.name}] manifest ${d.path}: quote does not contain the value ${d.value} — the doc check would be vacuous`);
      }
    } else if (d.kind === 'computed') {
      if (!Array.isArray(d.factors) || d.factors.length < 2 || d.op !== 'product') {
        problems.push(`[${surface.name}] manifest ${d.path}: a computed anchor needs op 'product' and ≥2 factors`);
      }
    } else {
      problems.push(`[${surface.name}] manifest ${d.path}: unknown anchor kind ${JSON.stringify(d.kind)}`);
    }
  }

  // (1)+(2) Each derived token equals its value AND that value is warranted —
  // either byte-stated in canon (quote) or computed from canon's own leaves.
  for (const d of surface.DERIVED) {
    const builtVal = getPath(built, d.path);
    if (builtVal === undefined) {
      problems.push(`[${surface.name}] ui-tokens missing derived token ${d.path}`);
    } else if (builtVal !== d.value) {
      problems.push(`[${surface.name}] ${d.path}: built ${JSON.stringify(builtVal)} !== derived ${d.value}`);
    }
    if (d.kind === 'quote') {
      const docText = readFileSync(join(root, d.doc), 'utf8');
      if (!docText.includes(d.quote)) {
        problems.push(`[${surface.name}] ${d.path}: canon doc ${d.doc} no longer states "${d.quote}" — derivation broken`);
      }
    } else if (d.kind === 'computed') {
      const parts = d.factors.map((f) => getPath(built, f));
      if (parts.some((p) => typeof p !== 'number')) {
        problems.push(`[${surface.name}] ${d.path}: a computed factor is missing/non-numeric (${d.factors.join(' × ')})`);
      } else {
        const product = parts.reduce((a, b) => a * b, 1);
        if (product !== d.value) {
          problems.push(`[${surface.name}] ${d.path}: canon computes ${d.factors.join(' × ')} = ${product} !== ${d.value} — derivation broken`);
        }
      }
    }
  }

  // (3) Completeness: every leaf the built group adds beyond tokens.json must be
  // a manifest token. Nothing sneaks into ui-tokens without a warrant.
  for (const g of surface.OWNED_GROUPS) {
    const builtLeaves = built[g] === undefined ? [] : leafPaths(built[g], g);
    const jsonLeaves = tokens[g] === undefined ? [] : leafPaths(tokens[g], g);
    const added = builtLeaves.filter((p) => !jsonLeaves.includes(p));
    const manifestPaths = surface.DERIVED.filter((d) => d.path === g || d.path.startsWith(`${g}.`)).map((d) => d.path);
    for (const p of added) {
      if (!manifestPaths.includes(p)) {
        problems.push(`[${surface.name}] ${p}: added to ui-tokens beyond tokens.json but NOT derived here — invent-a-token guard`);
      }
    }
    for (const p of manifestPaths) {
      if (!added.includes(p)) {
        problems.push(`[${surface.name}] ${p}: declared derived but not an addition over tokens.json (already present, or missing)`);
      }
    }
  }
}

if (problems.length) {
  console.error('design-dimensions FAILED — a derived token diverges from canon:');
  for (const p of problems) console.error('  - ' + p);
  process.exit(1);
}
console.log(
  `design-dimensions OK: ${derivedCount} tokens across ${SURFACES.length} surfaces each equal their value AND are warranted ` +
    `(byte-stated in canon or computed from its type scale); no undERIVED addition survives`,
);
