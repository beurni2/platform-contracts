import { formeConnue, fusionner, texteDeForme, type Forme } from './forme.js';

/**
 * A DOOR one app stands in for in its tests: who produces it, the method, the
 * path with `:name` for a segment that varies, and the forms its real answers
 * take — recorded by the producer's own suite (see `comparer`).
 */
export interface Porte {
  readonly producteur: 'shop-plus' | 'sera';
  readonly methode: string;
  readonly chemin: string;
  readonly formes: readonly Forme[];
}

/** The door a request is for, or undefined when no recording covers it. */
export function porteDe(portes: readonly Porte[], methode: string, path: string): Porte | undefined {
  const segs = path.split('/').filter((s) => s !== '');
  return portes.find((p) => {
    if (p.methode !== methode.toUpperCase()) return false;
    const motif = p.chemin.split('/').filter((s) => s !== '');
    return motif.length === segs.length && motif.every((m, i) => m.startsWith(':') || m === segs[i]);
  });
}

/**
 * THE CONSUMER'S CHECK — call it for every answer a stand-in gives at one
 * producer's address, with that producer's doors: the door must be recorded
 * (a door nobody recorded is a door nobody proved), and the answer must be one
 * of its recorded forms. An answer of 500 and more is the network's, not the
 * door's, and is left out — unless its body names a `reason`, which a screen
 * can read as the door's word. Returns why it is refused, or null.
 */
export function refusDuSubstitut(portes: readonly Porte[], methode: string, path: string, statut: number, corps: unknown): string | null {
  const nommeUneRaison = corps !== null && typeof corps === 'object' && !Array.isArray(corps) && 'reason' in corps;
  if (statut >= 500 && !nommeUneRaison) return null;
  const porte = porteDe(portes, methode, path);
  if (porte === undefined) return `${methode.toUpperCase()} ${path} has no recording — record it from the producer before a stand-in answers it`;
  if (formeConnue(porte.formes, statut, corps)) return null;
  return `${porte.producteur} ${porte.methode} ${porte.chemin} never answers ${statut} ${JSON.stringify(corps).slice(0, 300)}`;
}

/**
 * THE PRODUCER'S CHECK — the forms its real door gave in its own suite,
 * against the recording: `manquantes` were recorded but not produced (a form
 * nobody proved), `inconnues` were produced but not recorded (a stand-in may
 * not use them yet). Because rows are pooled (`fusionner`), a form is judged by
 * whether it ADDS anything to the other side: a new row the real door starts
 * giving is listed as unknown and leaves every recorded form given.
 */
export function comparer(porte: Porte, observees: readonly Forme[]): { manquantes: string[]; inconnues: string[] } {
  const texte = (formes: readonly Forme[]): string => fusionner(formes).map(texteDeForme).join('\n');
  const vus = fusionner(observees);
  const enregistres = fusionner(porte.formes);
  const avecVus = texte(vus);
  const avecEnregistres = texte(enregistres);
  return {
    manquantes: enregistres.filter((f) => texte([...vus, f]) !== avecVus).map(texteDeForme).sort(),
    inconnues: vus.filter((f) => texte([...enregistres, f]) !== avecEnregistres).map(texteDeForme).sort(),
  };
}
