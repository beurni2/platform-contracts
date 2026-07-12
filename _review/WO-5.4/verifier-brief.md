# FRESH-CONTEXT VERIFIER BRIEF — WO-5.4 (canon v0.9.1: icon set 26 → 29)

You are a fresh-context verifier. No memory of the build. Judge only the code on
branch `canon/v0.9.1` (one commit ahead of `origin/main`). Try to break each
claim. Report findings most-severe first (`file:line` · claim at risk · concrete
failure). End with `VERDICT: PASS`/`VERDICT: FAIL` + a `BLOCKING:` list.

## The change
WO-6.0 hit a real canon gap: the 26-icon Grand Teint set had no bottom-nav glyph
for Accueil/Produits. The founder took it to the designer; three glyphs came back
(accueil, produits, vitrine). This WO adds them, regenerates the icon manifest,
extends `landmark.iconNames` to 29, bumps every version 0.9.0→0.9.1, and extends
the icon gate with a permanent `ns0:` regression + an xmlns check.

## VERIFIER MANDATE (do each by your own hands)
1. **Byte-verify the three new icons against the bundle.** The bundle's originals
   are in `_review/WO-5.4/bundle-icons/`. Run `cmp assets/icons/accueil.svg
   _review/WO-5.4/bundle-icons/accueil.svg` (and produits, vitrine). They must be
   byte-identical. Also confirm their sizes are 262 / 297 / 269 B.
2. **The 26 existing icons are byte-UNCHANGED.** `git diff origin/main...HEAD --
   assets/icons/` must show ONLY the 3 new files + the manifest edit — no existing
   `.svg` touched. `git diff origin/main...HEAD -- 'assets/icons/*.svg'` must list
   only the 3 additions.
3. **Craft an ns0-bearing icon and prove the regression CATCHES it.** Inject an
   `ns0:` prefix into some manifested icon (patch its manifest sha so ONLY the ns0
   check can fire), run `node scripts/check-icon-manifest.mjs`, confirm it EXITS 1
   naming the ns0 regression, then `git checkout` to restore. A gate that stays
   green with an ns0 icon present is a FAIL.
4. **Audit the snapshot delta name-by-name.** Compare
   `packages/contracts/snapshots/api-surface.snapshot.json` at `origin/main` vs
   `HEAD`. The ONLY change must be `packageVersion 0.9.0→0.9.1`; every export and
   every schema byte-identical. Any other delta is a finding.
5. **Manifest integrity.** `assets/icons/icons.manifest.json` must say count 29,
   totalRawBytes 8184; each icon's sha256 must match the file on disk; and the sum
   of all 29 files must equal 8184.
6. **iconNames parity + fidelity.** `landmark.iconNames` in `family.ts` and in
   `docs/design/tokens.json` must both be the same 29 names, and must equal the
   set of icon files (the icon gate asserts `names == iconNames`). The
   token-fidelity gate must stay green (no designer VALUE altered).
7. **No forbidden touch.** No money/taxonomy/secrets/contracts-shape/event file
   changed; assembly pins untouched.

## Commands you may run
`git diff origin/main...HEAD [-- path]`, `cmp`, `sha256sum`, `node
scripts/check-icon-manifest.mjs`, `node scripts/check-token-fidelity.mjs`,
`bash scripts/run-gates.sh`, `pnpm -r test`, read any file. Do NOT fix anything.
