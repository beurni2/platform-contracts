import { z } from 'zod';
import { canonicalJsonStringify } from '../canonical-json.js';

/**
 * Shape-freeze gate (WO-0 §B7): a canonical descriptor of the public API —
 * every export name + kind, and the JSON-Schema projection of every exported
 * zod schema. The committed snapshot pins the surface; any change fails CI
 * unless the snapshot is deliberately updated in the same PR as a version
 * bump.
 */
export interface ApiSurface {
  packageVersion: string;
  exports: Record<string, string>;
  schemas: Record<string, unknown>;
}

export function buildApiSurface(mod: Record<string, unknown>, packageVersion: string): ApiSurface {
  const exports: Record<string, string> = {};
  const schemas: Record<string, unknown> = {};
  for (const name of Object.keys(mod).sort()) {
    const value = mod[name];
    if (value instanceof z.ZodType) {
      exports[name] = 'zod-schema';
      schemas[name] = z.toJSONSchema(value, { io: 'output', unrepresentable: 'any' });
    } else if (typeof value === 'function') {
      exports[name] = 'function';
    } else if (Array.isArray(value)) {
      exports[name] = `array:${canonicalJsonStringify(value)}`;
    } else if (typeof value === 'object' && value !== null) {
      exports[name] = `object:${canonicalJsonStringify(value)}`;
    } else {
      exports[name] = `${typeof value}:${String(value)}`;
    }
  }
  return { packageVersion, exports, schemas };
}

export interface SurfaceDiff {
  ok: boolean;
  problems: string[];
}

export function compareApiSurface(current: ApiSurface, snapshot: ApiSurface): SurfaceDiff {
  const problems: string[] = [];
  if (current.packageVersion !== snapshot.packageVersion) {
    problems.push(
      `package version changed: snapshot ${snapshot.packageVersion} -> current ${current.packageVersion}`,
    );
  }
  const currentNames = new Set(Object.keys(current.exports));
  const snapshotNames = new Set(Object.keys(snapshot.exports));
  for (const name of snapshotNames) {
    if (!currentNames.has(name)) problems.push(`export removed: ${name}`);
  }
  for (const name of currentNames) {
    if (!snapshotNames.has(name)) problems.push(`export added: ${name}`);
  }
  for (const name of currentNames) {
    if (snapshotNames.has(name) && current.exports[name] !== snapshot.exports[name]) {
      problems.push(`export changed: ${name} (${snapshot.exports[name]} -> ${current.exports[name]})`);
    }
  }
  const currentSchemas = canonicalJsonStringify(current.schemas);
  const snapshotSchemas = canonicalJsonStringify(snapshot.schemas);
  if (currentSchemas !== snapshotSchemas) {
    for (const name of new Set([...Object.keys(current.schemas), ...Object.keys(snapshot.schemas)])) {
      const cur = name in current.schemas ? canonicalJsonStringify(current.schemas[name]) : '<absent>';
      const snap = name in snapshot.schemas ? canonicalJsonStringify(snapshot.schemas[name]) : '<absent>';
      if (cur !== snap) problems.push(`schema changed: ${name}`);
    }
  }
  return { ok: problems.length === 0, problems };
}
