// E1-assembly consumability shim (documented in JOURNAL.md):
// the app repos' service packages use workspace:* for their intra-repo
// leaf deps and ship no prepare script. This hook pins those workspace:*
// deps to the SAME repo+sha the parent was pinned to — nothing else.
// (dist/ for consumed packages is produced by scripts/build-consumed.mjs
// post-install; pnpm does not run hook-injected scripts at git-dep prep.)
const REPO_PINS = {
  '@sera/': { repo: 'sera', sha: '6213d41ca073a16e344dc3e45931690f3158c547' },
  '@boutik/': { repo: 'boutik-plus', sha: '7e4901d8e993b8d4462e2854aa79c44a631419a6' },
  '@shop-plus/': { repo: 'shop-plus', sha: '74913d782bbf04e58cc5aee6b458ffcb025b33a5' },
};
// intra-repo leaf packages live under packages/ in all three repos
const DIRS = {
  '@sera/observability': 'packages/observability',
  '@boutik/observability': 'packages/observability',
  '@shop-plus/observability': 'packages/observability',
  '@shop-plus/flags-client': 'packages/flags-client',
};
function readPackage(pkg) {
  const scope = Object.keys(REPO_PINS).find((s) => (pkg.name ?? '').startsWith(s));
  if (!scope) return pkg;
  for (const [dep, spec] of Object.entries(pkg.dependencies ?? {})) {
    if (String(spec).startsWith('workspace:')) {
      const dir = DIRS[dep];
      const pin = REPO_PINS[Object.keys(REPO_PINS).find((s) => dep.startsWith(s))];
      if (!dir || !pin) throw new Error(`unmapped workspace dep ${dep} of ${pkg.name} — extend DIRS`);
      pkg.dependencies[dep] = `git+https://github.com/beurni2/${pin.repo}.git#${pin.sha}&path:${dir}`;
    }
  }
  return pkg;
}
module.exports = { hooks: { readPackage } };
