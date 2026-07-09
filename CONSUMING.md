# Consuming platform-contracts — the pinned canon package set

The three app repos (`boutik-plus`, `shop-plus`, `sera`) consume the four
`@platform/*` packages **from a git ref of this repo**. There is no npm
registry involved (registry migration is a later Decision, non-blocking).

## Mechanism (chosen at WO-0B, founder-approved)

- Each package carries a **`prepare` script** (`tsc -p tsconfig.json`), so pnpm
  builds it from source at install time — `dist/` is never committed.
- Inter-package dependencies are **version-pinned** (`@platform/contracts` →
  `@platform/kernel-types@0.1.0`), never `workspace:*`, so the packages
  resolve outside this workspace; `linkWorkspacePackages: true` keeps local
  development linking the siblings.
- Consumers install with **pnpm git-dependency `path:` syntax**, pinned to a
  tag (or a commit sha — never a moving branch).

## Exact install lines for an app repo (pnpm ≥ 10)

`package.json`:

```json
"dependencies": {
  "@platform/contracts":    "git+https://github.com/beurni2/platform-contracts.git#v0.1.0&path:packages/contracts",
  "@platform/kernel-types": "git+https://github.com/beurni2/platform-contracts.git#v0.1.0&path:packages/kernel-types",
  "@platform/i18n":         "git+https://github.com/beurni2/platform-contracts.git#v0.1.0&path:packages/i18n",
  "@platform/ui-tokens":    "git+https://github.com/beurni2/platform-contracts.git#v0.1.0&path:packages/ui-tokens"
}
```

`pnpm-workspace.yaml` (both blocks are REQUIRED):

```yaml
# pnpm 10 blocks dependency build scripts by default; the prepare builds
# need this allowlist or the packages install without dist/.
onlyBuiltDependencies:
  - "@platform/contracts"
  - "@platform/kernel-types"
  - "@platform/i18n"
  - "@platform/ui-tokens"

# @platform/contracts depends on @platform/kernel-types@0.1.0, which exists
# on no registry; this override routes that transitive resolution to the
# same pinned git ref.
overrides:
  "@platform/kernel-types": "git+https://github.com/beurni2/platform-contracts.git#v0.1.0&path:packages/kernel-types"
```

Or as a one-liner from the app repo root:

```
pnpm add "git+https://github.com/beurni2/platform-contracts.git#v0.1.0&path:packages/contracts" "git+https://github.com/beurni2/platform-contracts.git#v0.1.0&path:packages/kernel-types" "git+https://github.com/beurni2/platform-contracts.git#v0.1.0&path:packages/i18n" "git+https://github.com/beurni2/platform-contracts.git#v0.1.0&path:packages/ui-tokens"
```

(after adding the two `pnpm-workspace.yaml` blocks above).

## Version bumps

Consumers move by changing the pinned ref (`#v0.1.0` → `#v0.2.0`) everywhere
it appears — dependencies AND the override — in one PR, alongside the
refreshed `/docs` copy. The `drift-check` CLI shipped in `@platform/contracts`
(bin: `drift-check <your-docs-dir> --pinned-version <version>`) must stay
green in the app repo's CI; it fails on any divergence between the app's
`/docs` copy and the canon manifest of the pinned package.

## Acceptance proof

This mechanism was proven from a scratch directory outside the repo: all four
packages installed pinned to a main sha, `computeWaterfall` +
`assertQuoteReconciles` imported, and the §5.4 worked baseline asserted
(10,000 / 1,000 / 1,500 / 1,000 → 11,500 · 12,500 · 8,500 · 2,000 · 1,000).
The sandbox demonstration used a `git+file://` URL to the same repo — the
syntax is identical for the GitHub URL above. Output:
`_review/WO-0B-tag-review.zip` → `consumer-proof.txt`.
