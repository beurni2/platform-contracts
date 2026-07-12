import {
  boutikColour,
  seraColour,
  sharedColour,
  shopColour,
  type Theme,
} from './family.js';

/**
 * The three app themes on one family DNA (Grand Teint). Each theme's `colours`
 * is the shared palette merged with exactly one app accent palette — per-theme
 * resolution by construction. Names are canon identifiers (`boutik-plus`,
 * `shop-plus`, `sera`); the designer's tokens.json keys (boutik/shop/sera) map
 * to these one-to-one.
 */

/** Boutik+ — grounded, supply-green confidence. */
export const boutikPlusTheme: Theme = {
  name: 'boutik-plus',
  colours: { ...sharedColour, ...boutikColour },
};

/** Shop+ — warm commerce energy. */
export const shopPlusTheme: Theme = {
  name: 'shop-plus',
  colours: { ...sharedColour, ...shopColour },
};

/** Séra — road-and-custody clarity. */
export const seraTheme: Theme = {
  name: 'sera',
  colours: { ...sharedColour, ...seraColour },
};

export const themes = {
  'boutik-plus': boutikPlusTheme,
  'shop-plus': shopPlusTheme,
  sera: seraTheme,
} as const;
