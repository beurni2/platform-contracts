#!/usr/bin/env node
// WO-5.6 design-dimension gate. Canon's DESIGN DOCS state some component
// dimensions as pixel VALUES that docs/design/tokens.json never carried; WO-6.0
// found them held as kit literals. Those values now live as tokens in
// @platform/ui-tokens — but ONLY when a canon design-doc line states them. This
// gate is the machine enforcement of derive-never-invent for those tokens:
//
//   1. every derived token in the built package equals its manifest value;
//   2. that value is byte-present in its source doc line (the exact quote);
//   3. the quote genuinely carries the number (static non-vacuity self-check);
//   4. COMPLETENESS — every key the built tokens add BEYOND tokens.json is in
//      this manifest. Nothing enters ui-tokens undERIVED; nothing is invented.
//
// Companion to check-token-fidelity.mjs (which owns tokens.json ⊆ built). The
// two together fully constrain family.ts: fidelity pins the immutable designer
// values; this gate pins every addition to a doc line.
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const tokens = JSON.parse(readFileSync(join(root, 'docs', 'design', 'tokens.json'), 'utf8'));
const built = await import(join(root, 'packages', 'ui-tokens', 'dist', 'index.js'));

// Every design-dimension token: its built path, its value, and the canon
// design-doc line that states it (byte-exact substring, and it MUST contain the
// number). docs/derivations/DESIGN-DIMENSIONS.md carries the human table + the
// 12 px STOP that is deliberately absent here.
const DERIVED = [
  { path: 'celebration.haloPx', value: 220, doc: 'docs/design/motion.md', quote: 'halo (220px circle, theme tint)' },
  { path: 'celebration.ringPx', value: 132, doc: 'docs/design/motion.md', quote: 'ring (132px, theme colour)' },
  { path: 'band.priceBand.noteWidth', value: 118, doc: 'docs/design/components.md', quote: 'right-column honesty note (`caption` `primarySoft`, w 118)' },
  { path: 'dimension.controlHeightPx.primaryButton', value: 56, doc: 'docs/design/components.md', quote: '**Size:** h 56; margin x 16.' },
  { path: 'dimension.controlHeightPx.searchField', value: 50, doc: 'docs/design/components.md', quote: 'Hairline 1.5 box h 50: search icon 17' },
  { path: 'dimension.controlHeightPx.listRow', value: 44, doc: 'docs/design/components.md', quote: '**fixed h 44** (list virtualization law)' },
  { path: 'dimension.controlHeightPx.offlineBanner', value: 30, doc: 'docs/design/components.md', quote: 'Ink band h 30' },
  { path: 'dimension.iconSizePx.listRow', value: 17, doc: 'docs/design/components.md', quote: 'icon 17 (`ink`)' },
  { path: 'dimension.iconSizePx.emptyState', value: 28, doc: 'docs/design/components.md', quote: 'Icon 28 `soft`' },
];

// Which token groups this gate owns the additions to (built ⊋ tokens.json here).
const OWNED_GROUPS = ['celebration', 'band', 'dimension'];

function getPath(obj, path) {
  return path.split('.').reduce((o, k) => (o == null ? o : o[k]), obj);
}

/** Leaf paths of a plain object, prefixed — e.g. 'band.priceBand.noteWidth'. */
function leafPaths(obj, prefix) {
  if (obj == null || typeof obj !== 'object' || Array.isArray(obj)) return [prefix];
  return Object.keys(obj).flatMap((k) => leafPaths(obj[k], `${prefix}.${k}`));
}

const problems = [];

// (3) Static non-vacuity: a manifest quote that does not contain its own number
// could let the doc check pass against an unrelated line. Fail before anything.
for (const d of DERIVED) {
  if (!d.quote.includes(String(d.value))) {
    problems.push(`manifest ${d.path}: quote does not contain the value ${d.value} — the doc check would be vacuous`);
  }
}

// (1)+(2) Each derived token equals its value AND that value is stated in canon.
for (const d of DERIVED) {
  const builtVal = getPath(built, d.path);
  if (builtVal === undefined) {
    problems.push(`ui-tokens missing derived token ${d.path}`);
  } else if (builtVal !== d.value) {
    problems.push(`${d.path}: built ${JSON.stringify(builtVal)} !== derived ${d.value}`);
  }
  const docText = readFileSync(join(root, d.doc), 'utf8');
  if (!docText.includes(d.quote)) {
    problems.push(`${d.path}: canon doc ${d.doc} no longer states "${d.quote}" — derivation broken`);
  }
}

// (4) Completeness: every leaf the built group adds beyond tokens.json must be a
// manifest token. Nothing sneaks into ui-tokens without a doc line.
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
  `design-dimensions OK: ${DERIVED.length} tokens each equal their value AND are byte-stated in canon; ` +
    `no undERIVED addition survives in {${OWNED_GROUPS.join(', ')}} (12 px icon STOP-flagged, not tokenised)`,
);
