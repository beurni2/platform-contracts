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
 * THE CONSUMER'S CHECK — a stand-in's answer on a recorded door must be one of
 * its recorded forms. Answers of 500 and more are the network's, not the
 * door's, and are left out. Returns why it is refused, or null.
 */
export function refusDuSubstitut(portes: readonly Porte[], methode: string, path: string, statut: number, corps: unknown): string | null {
  const porte = porteDe(portes, methode, path);
  if (porte === undefined || statut >= 500) return null;
  if (formeConnue(porte.formes, statut, corps)) return null;
  return `${porte.producteur} ${porte.methode} ${porte.chemin} never answers ${statut} ${JSON.stringify(corps).slice(0, 300)}`;
}

/**
 * THE PRODUCER'S CHECK — the forms its real door gave in its own suite,
 * against the recording: `manquantes` were recorded but not produced (a form
 * nobody proved), `inconnues` were produced but not recorded (a stand-in may
 * not use them yet). Both sides are merged first (`fusionner`). Both empty =
 * the recording is the door.
 */
export function comparer(porte: Porte, observees: readonly Forme[]): { manquantes: string[]; inconnues: string[] } {
  const vus = new Set(fusionner(observees).map(texteDeForme));
  const enregistres = new Set(fusionner(porte.formes).map(texteDeForme));
  return {
    manquantes: [...enregistres].filter((f) => !vus.has(f)).sort(),
    inconnues: [...vus].filter((f) => !enregistres.has(f)).sort(),
  };
}
