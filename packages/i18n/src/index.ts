// RN-SAFE ROOT ENTRY (WO-0C): catalog schema + pure lint functions only —
// no node builtins. Node-only tooling lives behind explicit subpaths:
//   @platform/i18n/data-loader   (fs-based lint-data loader)
//   @platform/i18n/lint-cli      (the CLI module; also bin `copy-lint`)
//   @platform/i18n/catalog.json  (the seed catalog as importable JSON data)
export * from './catalog.js';
export * from './lint.js';
