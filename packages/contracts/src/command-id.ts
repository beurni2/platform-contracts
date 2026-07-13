import { z } from 'zod';

/**
 * command_id — the client-minted idempotency key. FOUNDER RULING (Beurni,
 * 2026-07-13): minted CLIENT-SIDE, exactly ONCE at command creation, PERSISTED
 * with the command, and NEVER recomputed. FORMAT: UUIDv4. ENTROPY: the OS CSPRNG
 * (expo-crypto on React Native; `crypto.randomUUID` elsewhere). `Math.random()`
 * is FORBIDDEN as an idempotency-key source.
 *
 * WHY it is not judgement: offline-first (Ten Laws #7) forces client-side + mint-
 * once-persist-never-recompute — a recomputed id collides with its persisted self
 * across a reboot (a lost action shown as pending forever), and `Math.random()`
 * carries only its SEED's entropy, unproven on a cold-booted Android-Go device, so
 * two commands can collide (a double-charge). The full rule + rationale live in
 * `docs/derivations/COMMAND-ID-MINT.md`. This module is the canon SCHEMA + the
 * reference MINT HELPER; consumers adopt it at their offline seam.
 */

/** UUIDv4: version nibble `4`, variant `[89ab]`. */
const UUID_V4 = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/**
 * The canonical shape of a validly-minted command_id: a UUIDv4, branded so a raw
 * string cannot be passed where a minted id is required without validation.
 */
export const CommandIdSchema = z
  .string()
  .regex(UUID_V4, 'command_id must be a UUIDv4 minted from the OS CSPRNG')
  .brand<'CommandId'>();
export type CommandId = z.infer<typeof CommandIdSchema>;

/**
 * Reference mint helper. RN-SAFE: it reads the AMBIENT Web Crypto global
 * (`globalThis.crypto`) — never an `import` of the `crypto` builtin, which the
 * RN-safe scanner forbids in this root graph. Node/web expose it natively; React
 * Native apps provide it via expo-crypto. It NEVER falls back to `Math.random`:
 * with no CSPRNG it THROWS, because a fabricated idempotency key is worse than a
 * loud failure at command creation. The result is validated on the way out, so
 * the helper cannot emit a non-UUIDv4.
 */
export function mintCommandId(): CommandId {
  const webCrypto = (globalThis as { crypto?: { randomUUID?: () => string } }).crypto;
  if (!webCrypto || typeof webCrypto.randomUUID !== 'function') {
    throw new Error(
      'mintCommandId: no OS CSPRNG (globalThis.crypto.randomUUID). React Native must provide expo-crypto; never substitute Math.random as an idempotency-key source.',
    );
  }
  return CommandIdSchema.parse(webCrypto.randomUUID());
}
