#!/usr/bin/env node
// Post-install build of the consumed app service packages (JOURNAL'd):
// the app repos ship src/ + tsconfig.json in their git+path packs but no
// prepare script, so pnpm installs them without dist/. This compiles each
// consumed package IN PLACE in the pnpm virtual store with the assembly's
// typescript, in dependency order. Their per-package tsconfig extends
// ../../tsconfig.base.json (not shipped in the pack) — byte-identical
// across all three repos at the pinned shas (sha256-verified in the DoD
// logs) — so each compile substitutes ./consumed-base-tsconfig.json, our
// committed copy of that exact file.
import { execFileSync } from 'node:child_process';
import { existsSync, readdirSync, realpathSync, writeFileSync, readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(HERE, '..');
const BASE_TSCONFIG = join(ROOT, 'consumed-base-tsconfig.json');
const TSC = join(ROOT, 'node_modules', 'typescript', 'bin', 'tsc');

// dependency order: leaves first (observability / flags-client), then the rest.
const CONSUMED = [
  '@sera/observability',
  '@boutik/observability',
  '@shop-plus/observability',
  '@shop-plus/flags-client',
  '@sera/logistics-service',
  '@sera/custody-service',
  '@sera/evidence-service',
  '@boutik/supplier-service',
  '@boutik/catalog-service',
  '@boutik/media-service',
  '@boutik/offer-service',
  '@boutik/fulfillment-service',
  '@boutik/inventory-service',
  '@shop-plus/commerce-core',
  '@shop-plus/attribution-service',
];

function realPkgDir(name) {
  const linked = join(ROOT, 'node_modules', ...name.split('/'));
  if (!existsSync(linked)) return undefined;
  return realpathSync(linked);
}

// The file:-linked @platform/certification packs only its dist/ (its
// `files` filter) — the repo root must be built BEFORE `pnpm install` here.
const certEntry = join(ROOT, 'node_modules', '@platform', 'certification', 'dist', 'index.js');
if (!existsSync(certEntry)) {
  console.error(
    'build-consumed: @platform/certification has no dist in this install.\n' +
    'Bootstrap order (see assembly/README.md): at the REPO ROOT run\n' +
    '  pnpm install && pnpm build\n' +
    'then re-run `pnpm install` in assembly/.',
  );
  process.exit(1);
}

let built = 0;
for (const name of CONSUMED) {
  const dir = realPkgDir(name);
  if (dir === undefined) {
    console.error(`build-consumed: ${name} not installed — install first`);
    process.exit(1);
  }
  if (existsSync(join(dir, 'dist', 'index.js'))) continue; // already built (store is content-addressed per sha)
  const tsconfigPath = join(dir, 'tsconfig.json');
  const original = JSON.parse(readFileSync(tsconfigPath, 'utf8'));
  if (original.extends !== '../../tsconfig.base.json') {
    console.error(`build-consumed: ${name} tsconfig extends "${original.extends}" — expected ../../tsconfig.base.json; refusing to guess`);
    process.exit(1);
  }
  const buildConfig = {
    ...original,
    extends: BASE_TSCONFIG,
    compilerOptions: {
      ...(original.compilerOptions ?? {}),
      // the app repos hoist @types/node at their roots (^22.20.1 in all
      // three); the packed dep can't see one, so point at the assembly's.
      typeRoots: [join(ROOT, 'node_modules', '@types')],
    },
  };
  const buildConfigPath = join(dir, 'tsconfig.assembly-build.json');
  writeFileSync(buildConfigPath, JSON.stringify(buildConfig, null, 2));
  execFileSync(process.execPath, [TSC, '-p', buildConfigPath], { cwd: dir, stdio: 'inherit' });
  built += 1;
  console.log(`build-consumed: ${name} → dist/ compiled`);
}
console.log(`build-consumed: done (${built} compiled, ${CONSUMED.length - built} already present)`);
