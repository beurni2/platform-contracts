import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { checkDocsDrift, sha256Hex, type DocsManifest } from '../src/drift-check.js';

function makeConsumerDocs(files: Record<string, string>): { dir: string; manifest: DocsManifest } {
  const dir = mkdtempSync(join(tmpdir(), 'drift-check-'));
  const manifest: DocsManifest = { packageVersion: '0.1.0', files: {} };
  for (const [name, content] of Object.entries(files)) {
    writeFileSync(join(dir, name), content);
    manifest.files[name] = sha256Hex(Buffer.from(content));
  }
  return { dir, manifest };
}

describe('drift-check — consumer /docs vs canonical manifest', () => {
  const canonical = {
    'Ecosystem-Engineering-Execution-Contract.md': '# Contract\ncanonical text\n',
    'Shop-Plus-Build-Spec.md': '# Shop+\ncanonical text\n',
  };

  it('passes when the consumer copy is byte-identical and the pinned version matches', async () => {
    const { dir, manifest } = makeConsumerDocs(canonical);
    const report = await checkDocsDrift({ docsDir: dir, manifest, pinnedVersion: '0.1.0' });
    expect(report.problems).toEqual([]);
    expect(report.ok).toBe(true);
  });

  it('FAILS on a tampered doc (single byte changed)', async () => {
    const { dir, manifest } = makeConsumerDocs(canonical);
    writeFileSync(
      join(dir, 'Shop-Plus-Build-Spec.md'),
      '# Shop+\ncanonical text (drifted)\n',
    );
    const report = await checkDocsDrift({ docsDir: dir, manifest, pinnedVersion: '0.1.0' });
    expect(report.ok).toBe(false);
    expect(report.problems.some((p) => p.includes('doc drifted from canon: Shop-Plus-Build-Spec.md'))).toBe(true);
  });

  it('FAILS on a missing canonical doc', async () => {
    const { dir, manifest } = makeConsumerDocs(canonical);
    manifest.files['Sera-Build-Spec.md'] = 'f'.repeat(64);
    const report = await checkDocsDrift({ docsDir: dir, manifest });
    expect(report.ok).toBe(false);
    expect(report.problems).toContain('missing canonical doc: Sera-Build-Spec.md');
  });

  it('FAILS on an extra doc the canon does not know', async () => {
    const { dir, manifest } = makeConsumerDocs(canonical);
    writeFileSync(join(dir, 'Rogue-Doc.md'), 'not canon');
    const report = await checkDocsDrift({ docsDir: dir, manifest });
    expect(report.ok).toBe(false);
    expect(report.problems).toContain('doc not in canonical manifest: Rogue-Doc.md');
  });

  it('FAILS on a pinned-version mismatch', async () => {
    const { dir, manifest } = makeConsumerDocs(canonical);
    const report = await checkDocsDrift({ docsDir: dir, manifest, pinnedVersion: '0.2.0' });
    expect(report.ok).toBe(false);
    expect(
      report.problems.some((p) => p.includes('pinned package version 0.2.0 does not match manifest packageVersion 0.1.0')),
    ).toBe(true);
  });
});
