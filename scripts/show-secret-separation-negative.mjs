#!/usr/bin/env node
// NEGATIVE (secret separation, WO-0 four-secrets law): the substitution
// fixture MUST NOT compile. tsc exits 2 on type errors; this wrapper
// normalizes the outcome to the repo-wide convention (WO-2.8 item 8):
// exit 1 = the negative bit (compile refused), exit 0 = VIOLATION (the
// substitution compiled — the type wall is gone).
import { spawnSync } from 'node:child_process';

const out = spawnSync(
  'npx',
  [
    'tsc', '--noEmit', '--strict', '--target', 'es2022',
    '--module', 'nodenext', '--moduleResolution', 'nodenext',
    'packages/contracts/fixtures/secret-substitution.negative.ts',
  ],
  { encoding: 'utf8' },
);
if (out.status === 0) {
  console.error('VIOLATION: the secret-substitution fixture COMPILED — the four-secrets type wall is gone');
  process.exit(0); // the harness (expected=fail) flags exit 0 as the failure
}
process.stdout.write(out.stdout ?? '');
console.error(`secret substitution refused by the compiler (tsc exit ${out.status}) — the negative bit`);
process.exit(1);
