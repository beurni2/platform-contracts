#!/usr/bin/env node
import { readFile } from 'node:fs/promises';
import { CatalogSchema } from './catalog.js';
import { defaultDataDir, loadLintData } from './data-loader.js';
import { formatLintReport, lintCatalog } from './lint.js';

function usage(): never {
  console.error('usage: copy-lint <catalog.json> [--data-dir <dir>]');
  process.exit(2);
}

async function main(): Promise<void> {
  const args = process.argv.slice(2);
  let catalogPath: string | undefined;
  let dataDir: string | undefined;
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === '--data-dir') {
      dataDir = args[++i];
    } else if (arg !== undefined && !arg.startsWith('--') && catalogPath === undefined) {
      catalogPath = arg;
    } else {
      usage();
    }
  }
  if (catalogPath === undefined) usage();

  const raw: unknown = JSON.parse(await readFile(catalogPath, 'utf8'));
  const parsed = CatalogSchema.safeParse(raw);
  if (!parsed.success) {
    console.error(`copy-lint FAILED: ${catalogPath} is not a valid catalog:`);
    console.error(parsed.error.message);
    process.exit(1);
  }
  const data = await loadLintData(dataDir ?? defaultDataDir());
  const report = lintCatalog(parsed.data, data);
  if (report.ok) {
    console.log(formatLintReport(report));
    return;
  }
  console.error(formatLintReport(report));
  process.exit(1);
}

main().catch((err) => {
  console.error(`copy-lint: unexpected error: ${String(err)}`);
  process.exit(2);
});
