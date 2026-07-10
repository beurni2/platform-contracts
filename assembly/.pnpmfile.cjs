// E1-assembly consumability shim (documented in JOURNAL.md):
// the app repos' service packages use workspace:* for their intra-repo
// leaf deps and ship no prepare script. This hook pins those workspace:*
// deps to the SAME repo+sha the parent was pinned to — nothing else.
// (dist/ for consumed packages is produced by scripts/build-consumed.mjs
// post-install; pnpm does not run hook-injected scripts at git-dep prep.)
const REPO_PINS = {
  '@sera/': { repo: 'sera', sha: '77f12bc01b25a5a8597edc685c5f4868fed6e04b' },
  '@boutik/': { repo: 'boutik-plus', sha: '76ef6aae3b2d2aeca6906eb7db3f03886a0c906f' },
  '@shop-plus/': { repo: 'shop-plus', sha: '0a8068fcb2bb3c7565aa734968886b80b6d0fa96' },
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
