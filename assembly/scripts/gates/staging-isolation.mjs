#!/usr/bin/env node
// GATE (WO-2.8 item 7): staging and default configs cannot cross — the flag
// namespace and every storage prefix must be disjoint AND prefix-safe.
// Pass a directory argument to scan a planted negative config pair instead
// of the committed one; a collision → exit 1.
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadProfile, assertProfilesIsolated } from '../../dist/env-profile.js';

const configDir = process.argv[2] ?? join(dirname(fileURLToPath(import.meta.url)), '..', '..', 'config');

let def, stg;
try {
  def = loadProfile('default', configDir);
  stg = loadProfile('staging', configDir);
} catch (err) {
  console.error(`staging-isolation: cannot load profiles from ${configDir}: ${String(err)}`);
  process.exit(2);
}
const { collisions } = assertProfilesIsolated(def, stg);
if (collisions.length > 0) {
  console.error(`staging-isolation VIOLATION — ${collisions.length} collision(s) between default and staging:`);
  for (const c of collisions) console.error(`  ${c}`);
  process.exit(1);
}
console.log(
  `staging-isolation OK: flag namespaces ('${def.flagNamespace}' vs '${stg.flagNamespace}') and all ` +
  `${Object.keys(def.storagePrefixes).length} storage prefixes disjoint and prefix-safe; providerMode sandbox on both`,
);
process.exit(0);
