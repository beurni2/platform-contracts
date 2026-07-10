import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { z } from 'zod';

/**
 * WO-2.8 item 7 — STAGING ISOLATION, honest scope (the last E0 deferral).
 * This is the isolation MECHANISM: two profiles whose flag namespace and
 * every storage prefix are DISJOINT BY CONSTRUCTION — loading both and
 * proving zero overlap is a CI gate (scripts/gates/staging-isolation.mjs,
 * with a collision negative). Deployed staging INFRASTRUCTURE (real cloud
 * accounts, separate DO namespaces, promotion rules per Contract §7.1)
 * arrives with real credentials at E3/E4 — a config file cannot conjure it,
 * and pretending otherwise would be a mock hiding integration health.
 */

export const EnvProfileSchema = z
  .object({
    profile: z.enum(['default', 'staging']),
    flagNamespace: z.string().min(1),
    storagePrefixes: z.object({
      reservations: z.string().min(1),
      stock: z.string().min(1),
      evidence: z.string().min(1),
      ledger: z.string().min(1),
    }),
    providerMode: z.literal('sandbox'), // real provider modes are E3 (Real-Money Gate)
  })
  .strict();

export type EnvProfile = z.infer<typeof EnvProfileSchema>;

const CONFIG_DIR = join(dirname(fileURLToPath(import.meta.url)), '..', 'config');

export function loadProfile(name: 'default' | 'staging', configDir = CONFIG_DIR): EnvProfile {
  const raw = JSON.parse(readFileSync(join(configDir, `env.${name}.json`), 'utf8'));
  const profile = EnvProfileSchema.parse(raw);
  if (profile.profile !== name) {
    throw new Error(`profile file env.${name}.json declares profile '${profile.profile}'`);
  }
  return profile;
}

/**
 * The isolation law: NO namespace or prefix of one profile may equal —
 * or prefix-collide with — any of the other's. Prefix collision matters
 * because storage keys are `${prefix}${id}`: if one prefix is a prefix of
 * the other, a key written under the longer one is READABLE under the
 * shorter one's scans.
 */
export function assertProfilesIsolated(a: EnvProfile, b: EnvProfile): { collisions: string[] } {
  const collisions: string[] = [];
  const pairs: Array<[string, string, string]> = [
    ['flagNamespace', a.flagNamespace, b.flagNamespace],
    ...(Object.keys(a.storagePrefixes) as Array<keyof EnvProfile['storagePrefixes']>).map(
      (k): [string, string, string] => [`storagePrefixes.${k}`, a.storagePrefixes[k], b.storagePrefixes[k]],
    ),
  ];
  for (const [field, va, vb] of pairs) {
    if (va === vb) collisions.push(`${field}: '${va}' is shared by both profiles`);
    else if (va.startsWith(vb) || vb.startsWith(va)) {
      collisions.push(`${field}: '${va}' and '${vb}' prefix-collide`);
    }
  }
  return { collisions };
}
