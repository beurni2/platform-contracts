import { makeTheme } from './family.js';

/** Boutik+ — grounded, supply-green confidence. */
export const boutikPlusTheme = makeTheme('boutik-plus', {
  primary: '#1F6B44',
  primaryStrong: '#14532F',
  primarySoft: '#E3F0E8',
  onPrimary: '#FFFFFF',
  verifiedBadge: '#1F6B44',
});

/** Shop+ — warm commerce energy. */
export const shopPlusTheme = makeTheme('shop-plus', {
  primary: '#C2571B',
  primaryStrong: '#9A4212',
  primarySoft: '#F9E9DE',
  onPrimary: '#FFFFFF',
  verifiedBadge: '#1F6B44',
});

/** Séra — road-and-custody clarity. */
export const seraTheme = makeTheme('sera', {
  primary: '#2B4C7E',
  primaryStrong: '#1D3557',
  primarySoft: '#E4EBF4',
  onPrimary: '#FFFFFF',
  verifiedBadge: '#1F6B44',
});

export const themes = {
  'boutik-plus': boutikPlusTheme,
  'shop-plus': shopPlusTheme,
  sera: seraTheme,
} as const;
