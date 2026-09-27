import type { Porte } from './portes.js';

/**
 * THE RECORDINGS — written by each producer's record mode (its own workerd
 * suite run with ENREGISTRER=1), never by hand. A door belongs here only when
 * another app's tests stand in for it.
 */
export const ENREGISTREMENTS: readonly Porte[] = [];
