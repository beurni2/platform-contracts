#!/usr/bin/env node
import { readFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { checkDocsDrift, type DocsManifest } from './drift-check.js';

function usage(): never {
  console.error(
    'usage: drift-check <consumer-docs-dir> [--manifest <path>] [--pinned-version <semver>]',
  );
  process.exit(2);
}

async function main(): Promise<void> {
  const args = process.argv.slice(2);
  let docsDir: string | undefined;
  let manifestPath: string | undefined;
  let pinnedVersion: string | undefined;

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === '--manifest') {
      manifestPath = args[++i];
    } else if (arg === '--pinned-version') {
      pinnedVersion = args[++i];
    } else if (arg !== undefined && !arg.startsWith('--') && docsDir === undefined) {
      docsDir = arg;
    } else {
      usage();
    }
  }
  if (docsDir === undefined) usage();

  // Default manifest: the copy shipped with this package.
  const packageRoot = join(dirname(fileURLToPath(import.meta.url)), '..');
  const resolvedManifestPath = manifestPath ?? join(packageRoot, 'docs.manifest.json');

  let manifest: DocsManifest;
  try {
    manifest = JSON.parse(await readFile(resolvedManifestPath, 'utf8')) as DocsManifest;
  } catch (err) {
    console.error(`drift-check: cannot read manifest ${resolvedManifestPath}: ${String(err)}`);
    process.exit(2);
  }

  const report = await checkDocsDrift(
    pinnedVersion !== undefined
      ? { docsDir, manifest, pinnedVersion }
      : { docsDir, manifest },
  );
  if (report.ok) {
    console.log(
      `drift-check OK: ${Object.keys(manifest.files).length} canonical docs match manifest (packageVersion ${manifest.packageVersion})`,
    );
    return;
  }
  console.error('drift-check FAILED — consumer /docs diverges from canon:');
  for (const problem of report.problems) {
    console.error(`  - ${problem}`);
  }
  process.exit(1);
}

main().catch((err) => {
  console.error(`drift-check: unexpected error: ${String(err)}`);
  process.exit(2);
});
