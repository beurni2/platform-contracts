import type { Porte } from './portes.js';

/**
 * THE RECORDINGS — the doors of Shop+ and Séra that Boutik+'s screen walks
 * stand in for, each with the forms its real door gave in its producer's own
 * workerd suites. The forms are written by the producer's record run
 * (`scripts/certifier-reponses.mjs --enregistrer` in shop-plus and sera),
 * never by hand. A door with no form refuses every stand-in answer.
 */
export const ENREGISTREMENTS: readonly Porte[] = [
  { producteur: 'shop-plus', methode: 'GET', chemin: '/checkout/dispatch', formes: [] },
  { producteur: 'shop-plus', methode: 'POST', chemin: '/checkout/dispatch/:orderId/refusal', formes: [] },
  { producteur: 'shop-plus', methode: 'GET', chemin: '/checkout/gains', formes: [] },
  { producteur: 'shop-plus', methode: 'GET', chemin: '/reseller/suivi', formes: [] },
  { producteur: 'shop-plus', methode: 'GET', chemin: '/reseller/codes', formes: [] },
  { producteur: 'shop-plus', methode: 'GET', chemin: '/reseller/accounts', formes: [] },
  { producteur: 'shop-plus', methode: 'POST', chemin: '/buyer/accounts/recovery-code', formes: [] },
  { producteur: 'sera', methode: 'GET', chemin: '/ops/board', formes: [] },
  { producteur: 'sera', methode: 'POST', chemin: '/ops/task', formes: [] },
  { producteur: 'sera', methode: 'POST', chemin: '/ops/order/retirer', formes: [] },
  { producteur: 'sera', methode: 'GET', chemin: '/ops/riders', formes: [] },
  { producteur: 'sera', methode: 'GET', chemin: '/ops/rider-codes', formes: [] },
  { producteur: 'sera', methode: 'POST', chemin: '/ops/riders/remove', formes: [] },
];
