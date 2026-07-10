# Consuming platform-contracts — the pinned canon package set

The three app repos (`boutik-plus`, `shop-plus`, `sera`) consume the four
`@platform/*` packages **from a git ref of this repo**. There is no npm
registry involved (registry migration is a later Decision, non-blocking).

## Mechanism

- Each package carries a **`prepare` script** (`tsc -p tsconfig.json`), so pnpm
  builds it from source at install time — `dist/` is never committed.
- Inter-package dependencies are **version-pinned** (`@platform/contracts` →
  `@platform/kernel-types@0.5.0`, matching the release), never `workspace:*`, so the packages
  resolve outside this workspace; `linkWorkspacePackages: true` keeps local
  development linking the siblings.
- Consumers install with **pnpm git-dependency `path:` syntax**, pinned to a
  tag (or a commit sha — never a moving branch).

## RN-safe root entries (since v0.2.0)

Each package's root entry (`.`) exposes **only shapes, schemas, pure
functions, tokens, and catalog data — no node builtins anywhere in its import
graph** (CI-enforced by the builtin scanner). **React Native apps import the
canon directly**; the type-only workaround is now optional:

```ts
import { computeWaterfall, QuoteSchema } from '@platform/contracts'; // RN-safe
import { lintCatalog, CatalogSchema } from '@platform/i18n';         // RN-safe
import { boutikPlusTheme } from '@platform/ui-tokens';               // RN-safe
import { LocationSchema } from '@platform/kernel-types';             // RN-safe
```

Node-only tooling lives behind explicit subpaths (and the unchanged bins
`drift-check` / `copy-lint` for `pnpm exec`):

```ts
import { checkDocsDrift } from '@platform/contracts/drift-check'; // node-only lib
import { loadLintData } from '@platform/i18n/data-loader';        // node-only lib
import catalog from '@platform/i18n/catalog.json' with { type: 'json' }; // seed catalog data
// CLI modules: '@platform/contracts/drift-cli' · '@platform/i18n/lint-cli'
```

Existing consumers are unaffected: root value/type imports are unchanged, and
a `./dist/*` passthrough keeps any legacy deep import working.

## Exact install lines for an app repo (pnpm ≥ 10)

`package.json`:

```json
"dependencies": {
  "@platform/contracts":    "git+https://github.com/beurni2/platform-contracts.git#<RELEASE_SHA>&path:packages/contracts",
  "@platform/kernel-types": "git+https://github.com/beurni2/platform-contracts.git#<RELEASE_SHA>&path:packages/kernel-types",
  "@platform/i18n":         "git+https://github.com/beurni2/platform-contracts.git#<RELEASE_SHA>&path:packages/i18n",
  "@platform/ui-tokens":    "git+https://github.com/beurni2/platform-contracts.git#<RELEASE_SHA>&path:packages/ui-tokens"
}
```

`<RELEASE_SHA>` is the **release commit sha** announced per canon release —
pins use the sha (founder tag ruling). Current example: the v0.3.0 release is
`9308c641c368ea56d141867d667b122e10db682d`, so the contracts line reads
`git+https://github.com/beurni2/platform-contracts.git#9308c641c368ea56d141867d667b122e10db682d&path:packages/contracts`.

`pnpm-workspace.yaml` (both blocks are REQUIRED — override block current for ≥0.3.0):

```yaml
# pnpm 10 blocks dependency build scripts by default; the prepare builds
# need this allowlist or the packages install without dist/.
onlyBuiltDependencies:
  - "@platform/contracts"
  - "@platform/kernel-types"
  - "@platform/i18n"
  - "@platform/ui-tokens"
  - "@platform/certification"

# Inter-package version-deps exist on no registry: @platform/contracts →
# kernel-types, and @platform/certification (≥0.3.0) → contracts AND
# ui-tokens. Route ALL THREE through the pinned ref so any transitive
# resolution lands on the same release. <RELEASE_SHA> = the release commit
# sha announced per canon release (current example below).
overrides:
  "@platform/contracts": "git+https://github.com/beurni2/platform-contracts.git#<RELEASE_SHA>&path:packages/contracts"
  "@platform/kernel-types": "git+https://github.com/beurni2/platform-contracts.git#<RELEASE_SHA>&path:packages/kernel-types"
  "@platform/ui-tokens": "git+https://github.com/beurni2/platform-contracts.git#<RELEASE_SHA>&path:packages/ui-tokens"
```

## CI auth step (CI-ONLY — never in a committed lockfile URL or local config)

GitHub Actions runners have no credentials for this private repo. Each app
repo carries this step **immediately before `pnpm install`**, exactly as
deployed in all three app repos' `.github/workflows/ci.yml`:

```yaml
      - name: Authorize read access to platform-contracts (CI-only)
        run: git config --global url."https://x-access-token:${{ secrets.PLATFORM_CONTRACTS_READ_TOKEN }}@github.com/beurni2/platform-contracts".insteadOf "https://github.com/beurni2/platform-contracts"
```

It requires the **`PLATFORM_CONTRACTS_READ_TOKEN`** Actions repository secret
in each app repo: a fine-grained PAT whose repository access explicitly
includes `beurni2/platform-contracts` with **Contents: Read-only** (founder's
standing ruling). The rewrite lives only in the runner's ephemeral git
config; no token material appears in any committed file, log, or lockfile
URL. Do not use this rewrite on developer machines — local clones use normal
git credentials.

## Tags

Sandbox tag pushes return HTTP 403 (known), so tags are cut by the founder in
the **GitHub Releases UI** at the reviewed final sha after each canon release
is approved. A release tag therefore appears on origin only after founder review
of the WO-0C branch; until it does, pin the reviewed sha with identical
syntax.

## Version bumps

Consumers move by changing the pinned release sha everywhere
it appears — dependencies AND the override — in one PR, alongside the
refreshed `/docs` copy. The `drift-check` CLI shipped in `@platform/contracts`
(bin: `drift-check <your-docs-dir> --pinned-version <version>`) must stay
green in the app repo's CI; it fails on any divergence between the app's
`/docs` copy and the canon manifest of the pinned package.

## Acceptance proof

- v0.1.0 (WO-0B): scratch-directory install pinned to a main sha; §5.4 worked
  baseline asserted from the installed package
  (`_review/WO-0B-tag-review.zip` → `consumer-proof.txt`).
- v0.2.0 (WO-0C): scratch-directory install pinned to the WO-0C sha; root
  imports of all four packages plus the node-only subpaths and the JSON
  catalog subpath exercised (`_review/WO-0C-review.zip` → `logs/`).
