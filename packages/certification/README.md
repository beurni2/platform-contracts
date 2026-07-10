# @platform/certification — E1 shared harness

The Contract §3 **mock-certification suite**, **envelope conformance**, and
the §2.3 **fifteen-step chain runner** (with the §6 nine-id correlation chain
and the E1 "basic dashboard" report).

## Node-only — never in an app's runtime graph

This package is **node tooling**. Its root entry may import node builtins and
is exempt from the RN-safe root-entry gate. It MUST NOT be imported by any
app's runtime graph (RN app, PWA, worker): apps use it only from tests, CI
gates, and harness scripts. The export-map gate tracks it; the RN-safe
scanner deliberately does not include it in the four RN-safe roots.

## What certification means

A mock is not trustworthy until it misbehaves like the real service
(Contract §3). `certifyAdapter` runs the eight behaviors as executable
checks and produces a per-behavior scorecard:

emit duplicates · deliver events out of order · delay events · return stale
projections · simulate timeouts · simulate partial failures · reject invalid
state transitions · be generated from the same contract schema as the producer.

**Certification is 8/8 — there are no partial passes.** Before replacing a
mock with the live sibling, both the live producer and the mock MUST pass
the same conformance suite (§3).

## Domains

Adapters exist per E1 contract domain: `payment-provider` · `eligibility` ·
`supply-projection` · `readiness`. The per-domain event payload schemas live
here at E1, composed strictly from pinned `@platform/contracts` shapes; they
are promoted into `contracts/` by deliberate version bump when frozen
(Contract §2.2).

## The chain runner

`runChain` executes the §2.3 fifteen steps against pluggable `ChainAdapters`
(reference mocks bundled; live siblings at assembly), validates ONE
correlation chain across the nine ids
(`quote_id → reservation_id → payment_attempt_id → order_id → package_id →
delivery_task_id → validation_id → settlement_obligation_id →
provider_payout_id`), validates the step-6 Quote against `QuoteSchema` +
`assertQuoteReconciles`, and emits a text + static-HTML chain report — the
E1 dashboard seed. Any missing link, duplicate id, or chain break exits
non-zero.
