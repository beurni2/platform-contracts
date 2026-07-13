#!/usr/bin/env node
// WO-5.8 Part F — THE LOCKFILE URL-FORM GATE (standing law; every repo inherits).
//
//   NO COMMITTED LOCKFILE MAY CONTAIN AN SSH-FORM GIT URL.
//
// A regenerated lockfile carries its AUTHOR'S ENVIRONMENT. An SSH-form git URL
// (git@host:path · ssh:// · git+ssh://) resolves only against that author's ssh
// keys and ~/.gitconfig, so the lockfile installs on their box and NOWHERE ELSE.
// Installability is proven only by a cache-isolated cold clone in a CLEAN HOME;
// a cold proof inside a patched container is a warm build wearing the word
// "cold". This gate fails the build the moment an SSH-form URL appears —
// HTTPS/registry-integrity resolution is the only committable form.
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const lock = join(root, 'pnpm-lock.yaml');
if (!existsSync(lock)) {
  console.error('lockfile-url-form FAILED — pnpm-lock.yaml not found at repo root');
  process.exit(1);
}
const text = readFileSync(lock, 'utf8');

// The three SSH-form git URLs, none of which is cold-installable. The headline
// case (founder's rule) is the scp-like `git@github.com:`; `ssh://` and
// `git+ssh://` are the same seam by another spelling.
const PATTERNS = [/git@[^\s/]+:/, /ssh:\/\//, /git\+ssh/];
const offenders = [];
text.split('\n').forEach((line, i) => {
  if (PATTERNS.some((re) => re.test(line))) offenders.push(`${i + 1}: ${line.trim()}`);
});

if (offenders.length) {
  console.error(`lockfile-url-form FAILED — pnpm-lock.yaml carries ${offenders.length} SSH-form git URL(s) (not cold-installable):`);
  for (const o of offenders.slice(0, 20)) console.error('  - ' + o);
  if (offenders.length > 20) console.error(`  … and ${offenders.length - 20} more`);
  console.error('Re-generate the lockfile with HTTPS/registry resolution (an SSH URL resolves only against the author\'s keys).');
  process.exit(1);
}
console.log('lockfile-url-form OK: pnpm-lock.yaml carries zero SSH-form git URLs (cold-installable resolution)');
