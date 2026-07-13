# PackLab pack anatomy — derivation record (WO-5.6 Part D, canon v0.9.2)

**Scope + gate.** PackLab (B+9) is **build-gated** (Boutik-Plus-Build-Spec §12).
This record does **not** start that build: it adds **no contract code, no zod
schema, no values** — only the pack **SHAPE**, transcribed from the B+9 rows the
Boutik+ spec already carries, so the anatomy is canonically pinned for the day
the gate opens. Founder option C, 2026-07-12.

**What is deliberately NOT here (founder-deferred, out of scope by the WO):** the
three recede ceilings and their numbers · the platform-owner legal/merchant
structure · « Mon Enseigne » · any money or taxonomy change. None of those is
derived; none is invented. If a reader wants a ceiling value, it is ⏳ open
(Boutik-Plus-Build-Spec.md:220) — not this document.

---

## The shape, derived from the B+9 rows (quoted verbatim)

**A pack is a bill-of-materials over shared components — and its availability IS
its scarcest component.** This is stated, not inferred:

> **B+I-16 (BOM truth)** — `Boutik-Plus-Build-Spec.md:60`:
> “A `PackProduct` is a bill-of-materials over shared `PackComponent`s. Pack
> availability = **min over components of floor(available / qty)**, computed
> deterministically and service-derived (never client-set). Reservations occur at
> **component level**; assembly happens at the **kitting station (kit → QC →
> seal-at-kitting)**. Every pack MUST pass the **OrderFundingCheck solo at its own
> price** — packs are never bundle-only.”

The **scarcest-component law** the WO names is exactly `min over components of
floor(available / qty)` — a pack cannot be more available than the component it
would run out of first, and that number is **service-derived, never client-set**.

Honest degradation, not pack-protection, when a component genuinely runs low:

> **B+I-17 (component allocation — marketplace wins ties)** —
> `Boutik-Plus-Build-Spec.md:61`:
> “Each active pack holds a **reserved assembly floor** of its critical
> components. **Above the floor, solo component sales are NEVER throttled to
> protect packs**; floor pressure fires `REORDER_NEEDED` … Pack availability
> degrades **honestly** via BOM-min when a component genuinely cannot be
> replenished.”

The pack's supply mode and kitting path (shape context, no values):

> **B+9 PackLab** — `Boutik-Plus-Build-Spec.md:182`:
> “the `PLATFORM_OWNED` supply mode. **BOM packs** over shared components with
> deterministic min-availability (B+I-16) and a **kitting station** (kit → QC →
> seal-at-kitting) … a PackLab pack enters the dispatch queue on **kitting seal**,
> not seller `PackageReadinessConfirmation`.”

---

## Canonical shapes (field names only — the spec's own §5-style rows)

These are the pack aggregates the spec already lists. They are **shapes** (field
names), carrying **no ceiling values**:

> `Boutik-Plus-Build-Spec.md:106–108`:
> - `PackProduct { packId, productVersionId, components[{componentSku, qty}], assemblyCost, customerPrice, resellerCommission(C), returnPolicy, sixQuestionGate{who,moment,priceReason,resellerEarn,seraProfitable,repostable} }` — OWNER: Catalog (`PLATFORM_OWNED`)
> - `PackComponent { componentSku, state(AVAILABLE_FOR_PACK|AVAILABLE_FOR_SOLO|RESERVED_FOR_PACK_ASSEMBLY|RESERVED_FOR_CAMPAIGN|QUARANTINED|REORDER_NEEDED), packAssemblyFloor, available, soloSellable }` — OWNER: Inventory
> - `KittingJob { id, packId, components[], qcResult, kittingSealId, status }` — OWNER: Fulfillment (kitting station)

**Reading of the shape (no new claim added):** a `PackProduct` names its
`components[]` as `{componentSku, qty}` pairs; each `PackComponent` carries the
`available` and `packAssemblyFloor` that feed `floor(available / qty)`; the pack's
availability is the **minimum** of those per-component quotients. Assembly is a
`KittingJob` that ends in a `kittingSealId` — the seal, not a seller readiness
confirmation, is what puts a pack on the dispatch queue.

---

## Status

**Derived — the spec names the BOM shape (no STOP needed).** The anatomy above is
transcription of B+I-16/B+I-17 and the §5 pack rows; nothing was invented. Values,
ceilings, legal structure, and « Mon Enseigne » remain founder-deferred and are
**not** in this record. Contract code stays behind the B+9 gate.
