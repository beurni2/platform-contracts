/**
 * REPONSES-ENREGISTREES-1 (Boutik+ AUDIT-B+2 F-82) — THE FORM OF AN ANSWER.
 *
 * Execution Contract §3: « both the live producer and the mock MUST pass the
 * same conformance suite ». A stand-in another app's tests serve in place of
 * Shop+ or Séra was « certified » by a comment; twice in September it was
 * kinder than the real door. Here the conformance is data, checked on both
 * sides:
 *   · the PRODUCER's own workerd suite proves every recorded form is one its
 *     real door gives, and that its real door gives no other in the flows it
 *     runs;
 *   · a CONSUMER's stand-in may only answer a recorded form.
 *
 * A form is the status code, the body's keys and value types, and the literal
 * words of its vocabulary fields — never ids, amounts, names or times.
 *
 * ITS BOUND, stated so a green run is never read as more: it proves a stand-in
 * never says something the real door never says (a status, a field, a reason
 * word); it does NOT prove the stand-in picks the same answer the real door
 * would for the same request.
 */

export type Squelette =
  | { readonly t: 'string' | 'number' | 'boolean' | 'null' }
  /** A vocabulary field's literal word (`ok: false`, `reason: 'not_found'`). */
  | { readonly t: 'mot'; readonly v: string | number | boolean }
  /** Exactly these keys — a key the producer never sends is a different form. */
  | { readonly t: 'objet'; readonly cles: Readonly<Record<string, Squelette>> }
  /** Every element is one of these; none recorded = only an empty list was seen. */
  | { readonly t: 'liste'; readonly de: readonly Squelette[] };

export interface Forme {
  readonly statut: number;
  readonly corps: Squelette;
}

/** The fields whose WORDS are part of the form: what a screen decides on. */
export const VOCABULAIRE: ReadonlySet<string> = new Set(['ok', 'reason', 'error', 'status', 'state', 'etat', 'verdict', 'kind']);

/** A canonical, stable text for a skeleton: sorted keys, sorted alternatives. */
export function texteDe(s: Squelette): string {
  switch (s.t) {
    case 'mot':
      return `mot:${JSON.stringify(s.v)}`;
    case 'objet':
      return `{${Object.keys(s.cles).sort().map((k) => `${JSON.stringify(k)}:${texteDe(s.cles[k]!)}`).join(',')}}`;
    case 'liste':
      return `[${[...new Set(s.de.map(texteDe))].sort().join('|')}]`;
    default:
      return s.t;
  }
}

export function squeletteDe(v: unknown, cle?: string): Squelette {
  if (cle !== undefined && VOCABULAIRE.has(cle) && (typeof v === 'string' || typeof v === 'number' || typeof v === 'boolean')) {
    return { t: 'mot', v };
  }
  if (v === null) return { t: 'null' };
  if (Array.isArray(v)) {
    const vus = new Map<string, Squelette>();
    for (const e of v) {
      const s = squeletteDe(e);
      vus.set(texteDe(s), s);
    }
    return { t: 'liste', de: [...vus.entries()].sort(([a], [b]) => (a < b ? -1 : 1)).map(([, s]) => s) };
  }
  if (typeof v === 'object') {
    const cles: Record<string, Squelette> = {};
    for (const k of Object.keys(v as object).sort()) cles[k] = squeletteDe((v as Record<string, unknown>)[k], k);
    return { t: 'objet', cles };
  }
  if (typeof v === 'string') return { t: 'string' };
  if (typeof v === 'number') return { t: 'number' };
  if (typeof v === 'boolean') return { t: 'boolean' };
  // undefined and functions never cross a JSON wire
  return { t: 'null' };
}

export const formeDe = (statut: number, corps: unknown): Forme => ({ statut, corps: squeletteDe(corps) });

export const texteDeForme = (f: Forme): string => `${f.statut} ${texteDe(f.corps)}`;

/** Does a concrete body fit this skeleton? Objects exactly; lists element by element. */
export function correspond(s: Squelette, v: unknown, cle?: string): boolean {
  switch (s.t) {
    case 'mot':
      return v === s.v && cle !== undefined && VOCABULAIRE.has(cle);
    case 'null':
      return v === null;
    case 'string':
    case 'number':
    case 'boolean':
      return typeof v === s.t && !(cle !== undefined && VOCABULAIRE.has(cle));
    case 'liste':
      return Array.isArray(v) && v.every((e) => s.de.some((alt) => correspond(alt, e)));
    case 'objet': {
      if (v === null || typeof v !== 'object' || Array.isArray(v)) return false;
      const recues = Object.keys(v as object);
      const attendues = Object.keys(s.cles);
      return recues.length === attendues.length &&
        attendues.every((k) => k in (v as object) && correspond(s.cles[k]!, (v as Record<string, unknown>)[k], k));
    }
  }
}

/** Is this answer one of the recorded forms? */
export const formeConnue = (formes: readonly Forme[], statut: number, corps: unknown): boolean =>
  formes.some((f) => f.statut === statut && correspond(f.corps, corps));
