#!/usr/bin/env node
// WO-5.0 icon gate: every icon in assets/icons/ matches its manifest sha256,
// every icon uses currentColor (one colour, tinted by context — the icon+word
// law), and the manifest name set equals landmark.iconNames in the designer's
// tokens.json. One source of truth for all four repos.
import { createHash } from 'node:crypto';
import { readFileSync, readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const dir = join(root, 'assets', 'icons');
const manifest = JSON.parse(readFileSync(join(dir, 'icons.manifest.json'), 'utf8'));
// WO-FP-0: the icon set is a Grand Teint asset (landmark.iconNames); it stays on
// the v1 source while Faso Premium (tokens.json) takes the root this wave.
const tokens = JSON.parse(readFileSync(join(root, 'docs', 'design', 'tokens.grand-teint.json'), 'utf8'));

const problems = [];
let total = 0;
const svgs = readdirSync(dir).filter((f) => f.endsWith('.svg')).sort();
for (const file of svgs) {
  const bytes = readFileSync(join(dir, file));
  total += bytes.length;
  const name = file.slice(0, -4);
  const entry = manifest.icons[name];
  if (!entry) { problems.push(`${file}: absent from manifest`); continue; }
  const sha = createHash('sha256').update(bytes).digest('hex');
  if (sha !== entry.sha256) problems.push(`${file}: sha ${sha} != manifest ${entry.sha256}`);
  if (bytes.length !== entry.bytes) problems.push(`${file}: ${bytes.length} bytes != manifest ${entry.bytes}`);
  if (!bytes.includes('currentColor')) problems.push(`${file}: does not use currentColor`);
  const text = bytes.toString('utf8');
  // WO-5.4 PERMANENT regression test for the WO-5.1 invisible-icon defect: a
  // namespace prefix like `<ns0:path>` (left by some SVG toolchains) renders
  // invisible on many engines. Zero `ns0:` anywhere — never again.
  if (text.includes('ns0:')) problems.push(`${file}: carries an "ns0:" namespace prefix (WO-5.1 invisible-icon regression)`);
  // Every root <svg> must declare its namespace or it will not render standalone.
  if (!/<svg\b[^>]*\sxmlns=/.test(text)) problems.push(`${file}: root <svg> is missing xmlns`);
}
const fileNames = new Set(svgs.map((f) => f.slice(0, -4)));
const tokenNames = new Set(tokens.landmark.iconNames);
for (const n of tokenNames) if (!fileNames.has(n)) problems.push(`landmark.iconNames has "${n}" with no icon file`);
for (const n of fileNames) if (!tokenNames.has(n)) problems.push(`icon "${n}" not in landmark.iconNames`);
if (manifest.$meta.totalRawBytes !== total) problems.push(`manifest totalRawBytes ${manifest.$meta.totalRawBytes} != actual ${total}`);

if (problems.length) {
  console.error('icon-manifest FAILED:');
  for (const p of problems) console.error('  - ' + p);
  process.exit(1);
}
console.log(`icon-manifest OK: ${svgs.length} icons, ${total} raw bytes, all currentColor, zero ns0: prefixes, every root <svg> carries xmlns, names == landmark.iconNames`);
