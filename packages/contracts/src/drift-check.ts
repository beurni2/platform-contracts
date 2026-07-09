import { createHash } from 'node:crypto';
import { readFile, readdir } from 'node:fs/promises';
import { join } from 'node:path';

/**
 * Docs drift-check (WO-0 §B6, Execution Contract E0): canonical `/docs` live
 * in platform-contracts; each app repo carries a CI-drift-checked copy. Given
 * a consumer repo's /docs copy and its pinned package version, exit non-zero
 * on ANY divergence from the manifest — changed bytes, missing docs, extra
 * docs, or a version mismatch.
 */
export interface DocsManifest {
  packageVersion: string;
  files: Record<string, string>; // filename -> sha256 (hex)
}

export interface DriftReport {
  ok: boolean;
  problems: string[];
}

export function sha256Hex(bytes: Uint8Array): string {
  return createHash('sha256').update(bytes).digest('hex');
}

export async function checkDocsDrift(options: {
  docsDir: string;
  manifest: DocsManifest;
  pinnedVersion?: string;
}): Promise<DriftReport> {
  const { docsDir, manifest, pinnedVersion } = options;
  const problems: string[] = [];

  if (pinnedVersion !== undefined && pinnedVersion !== manifest.packageVersion) {
    problems.push(
      `pinned package version ${pinnedVersion} does not match manifest packageVersion ${manifest.packageVersion}`,
    );
  }

  let entries: string[];
  try {
    entries = (await readdir(docsDir, { withFileTypes: true }))
      .filter((e) => e.isFile() && e.name.endsWith('.md'))
      .map((e) => e.name);
  } catch (err) {
    return { ok: false, problems: [`cannot read docs dir ${docsDir}: ${String(err)}`] };
  }

  for (const [name, expectedSha] of Object.entries(manifest.files)) {
    if (!entries.includes(name)) {
      problems.push(`missing canonical doc: ${name}`);
      continue;
    }
    const bytes = await readFile(join(docsDir, name));
    const actualSha = sha256Hex(bytes);
    if (actualSha !== expectedSha) {
      problems.push(`doc drifted from canon: ${name} (expected sha256 ${expectedSha}, got ${actualSha})`);
    }
  }

  for (const name of entries) {
    if (!(name in manifest.files)) {
      problems.push(`doc not in canonical manifest: ${name}`);
    }
  }

  return { ok: problems.length === 0, problems };
}
