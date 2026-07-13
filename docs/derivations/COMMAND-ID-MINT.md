# command_id — the mint rule (canon, WO-5.9)

**Founder ruling (Beurni, 2026-07-13), verbatim:**

> `command_id` is minted CLIENT-SIDE, exactly ONCE at command creation, PERSISTED
> with the command, and NEVER recomputed. FORMAT: UUIDv4. ENTROPY: the OS CSPRNG
> (expo-crypto on React Native; `crypto.randomUUID` elsewhere). `Math.random()` is
> FORBIDDEN as an idempotency-key source. Canon encodes this; consumers adopt on
> their next slice.

This closes the WO-5.7 Part E STOP-flag (canon previously constrained only
`command_id: z.string().min(1)` and named no mint format or entropy source).

---

## Why each clause is load-bearing (not preference)

- **Client-side · minted once · persisted · never recomputed** — forced by
  offline-first (Ten Laws #7). There is no server when offline, so the client
  mints. And a *recomputed* id collides with its persisted self across a reboot:
  the retry carries a new id, the provider sees two commands, and the UI shows the
  first as pending forever — or worse, a second charge. Reproducibility here IS the
  bug; the id is minted once and stored beside the command.
- **UUIDv4 + OS CSPRNG · `Math.random()` forbidden** — `Math.random()` carries only
  its SEED's entropy, and nobody has proven what a cold-booted Android-Go device
  seeds it with; two commands can collide into one idempotency key. A CSPRNG
  (expo-crypto / OS entropy pool, surfaced as Web Crypto `crypto.randomUUID`) is
  cold-boot-safe by construction and costs one call. Format and entropy are **one
  seam** — ruled together so consumers change once.

## What canon ships (this slice)

- **`CommandIdSchema`** (`@platform/contracts`) — a UUIDv4, branded (`.brand<'CommandId'>()`)
  so a raw string cannot stand in for a validated, minted id. This is the canonical
  shape a client MUST mint to.
- **`mintCommandId(): CommandId`** — the reference mint helper. RN-safe: it reads the
  ambient Web Crypto global (`globalThis.crypto.randomUUID`), never an `import` of the
  `crypto` builtin (the RN-safe scanner forbids that in the root graph). It NEVER falls
  back to `Math.random`; with no CSPRNG it THROWS. The output is validated on the way
  out, so it cannot emit a non-UUIDv4.
- **`scripts/check-mint-path-entropy.mjs`** — the gate (every repo inherits): scans each
  mint-path file (`command-id*` / `commandId*`) for `Math.random` and fails on any hit,
  and requires each to draw from a CSPRNG (so an empty file can't pass vacuously).
  Non-vacuous by a planted `Math.random` offender (`show-mint-path-entropy-negative.sh`).

## What canon does NOT change (and why)

- **`EventEnvelopeSchema.command_id` stays `z.string().min(1)`** — deliberately NOT
  tightened to `CommandIdSchema` in this slice. The certification **reference chain**
  mints deterministic, readable ids (`cmd_chain_${seed}_s${step}_${n}`) so its 15-step
  run and HTML report are byte-stable and inspectable; forcing UUIDv4 (random) there
  would break that reproducibility. The envelope is the transport; `CommandIdSchema` is
  the mint shape a production client validates against. **Flagged for the CTO:** if the
  envelope should enforce `CommandIdSchema` in a later slice, the reference chain needs a
  test-only id strategy first.

## Consumers

APPS adopts `mintCommandId` at its isolated offline seam `src/offline/commandId.ts` on
its next slice, and inherits `check-mint-path-entropy.mjs`. This is the next
CONSUMER-VISIBLE canon pin.
