// @platform/contracts — canonical shared contracts for Boutik+ × Shop+ × Séra.
// Shapes live ONLY here; no app redefines them (Execution Contract §3).
export * from './enums.js';
export * from './secrets.js';
export * from './money/rounding-law.js';
export * from './money/waterfall.js';
export * from './canonical-json.js';
export * from './shapes/common.js';
export * from './shapes/quote.js';
export * from './shapes/commerce.js';
export * from './shapes/custody.js';
export * from './shapes/settlement.js';
export * from './events.js';
export * from './gates/no-gated-shapes.js';
export * from './gates/api-surface.js';
export * from './drift-check.js';
