# E1 assembly — the fifteen steps, live

The Contract §2.3 walking skeleton over the three app repos' REAL service
code, consumed as pnpm git+path dependencies at the pinned mains recorded in
`package.json`, plus canon at the pinned release sha. The payment provider is
the certified sandbox mock — no real provider at E1.

## Bootstrap (order matters)

```sh
# 1. repo root — the file:-linked @platform/certification packs its dist
pnpm install && pnpm build
# 2. this directory
cd assembly
pnpm install --frozen-lockfile   # postinstall compiles the consumed app packages
pnpm build                        # assembly sources + the flag worker bundle
```

## The evidence commands

```sh
pnpm conformance   # §3 pairs — every mock AND its live sibling, 8/8 each
pnpm e1            # the fifteen steps live (+ §7.2 kill-switch demo) → chain-report.html
pnpm e1:negative   # validation_id dropped on live wiring — MUST exit 1
```

Mechanism notes: the app packages ship no `prepare` and use `workspace:*`
for intra-repo leaf deps — `.pnpmfile.cjs` pins those to the same repo+sha,
and `scripts/build-consumed.mjs` compiles each consumed package in the pnpm
store against `consumed-base-tsconfig.json` (byte-identical to all three
repos' `tsconfig.base.json` at the pinned shas — sha256-verified in the
review packet logs). Their committed DO worker bundles (boutik stock, shop
reservation) run under Miniflare/workerd, as do this harness's flag worker.
