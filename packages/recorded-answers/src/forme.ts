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
 * A list — or a list keyed by ids — is judged row by row: each row must be a
 * row form the real door was seen to give (`fusionner`).
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
  | { readonly t: 'liste'; readonly de: readonly Squelette[] }
  /** A list keyed by ids (a `DICTIONNAIRES` field): every value is one of these. */
  | { readonly t: 'dico'; readonly de: readonly Squelette[] };

export interface Forme {
  readonly statut: number;
  readonly corps: Squelette;
}

/** The fields whose WORDS are part of the form: what a screen decides on. */
export const VOCABULAIRE: ReadonlySet<string> = new Set([
  'ok', 'reason', 'error', 'status', 'state', 'etat', 'verdict', 'kind',
  // the words a refund, a refusal ladder and a field refusal are named by
  'raison', 'rung', 'recorded', 'field',
]);

/**
 * The fields that are lists KEYED BY IDS (Séra's board: packages in transit by
 * assignment, each rider's round and end of shift by rider, a package's
 * settlement by order). Their keys are data, never part of the form; their
 * values are judged like a list's rows.
 */
export const DICTIONNAIRES: ReadonlySet<string> = new Set(['colisEnCourse', 'manifestes', 'finDeService', 'reglement']);

/** A canonical, stable text for a skeleton: sorted keys, sorted alternatives. */
export function texteDe(s: Squelette): string {
  switch (s.t) {
    case 'mot':
      return `mot:${JSON.stringify(s.v)}`;
    case 'objet':
      return `{${Object.keys(s.cles).sort().map((k) => `${JSON.stringify(k)}:${texteDe(s.cles[k]!)}`).join(',')}}`;
    case 'liste':
      return `[${[...new Set(s.de.map(texteDe))].sort().join('|')}]`;
    case 'dico':
      return `{*:${[...new Set(s.de.map(texteDe))].sort().join('|')}}`;
    default:
      return s.t;
  }
}

function rangees(valeurs: readonly unknown[]): Squelette[] {
  const vus = new Map<string, Squelette>();
  for (const e of valeurs) {
    const s = squeletteDe(e);
    vus.set(texteDe(s), s);
  }
  return [...vus.keys()].sort().map((k) => vus.get(k)!);
}

export function squeletteDe(v: unknown, cle?: string): Squelette {
  if (cle !== undefined && VOCABULAIRE.has(cle) && (typeof v === 'string' || typeof v === 'number' || typeof v === 'boolean')) {
    return { t: 'mot', v };
  }
  if (v === null) return { t: 'null' };
  if (Array.isArray(v)) return { t: 'liste', de: rangees(v) };
  if (typeof v === 'object' && cle !== undefined && DICTIONNAIRES.has(cle)) return { t: 'dico', de: rangees(Object.values(v as object)) };
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
    case 'dico':
      return cle !== undefined && DICTIONNAIRES.has(cle) && v !== null && typeof v === 'object' && !Array.isArray(v) &&
        Object.values(v as object).every((e) => s.de.some((alt) => correspond(alt, e)));
    case 'objet': {
      if (v === null || typeof v !== 'object' || Array.isArray(v)) return false;
      const recues = Object.keys(v as object);
      const attendues = Object.keys(s.cles);
      return recues.length === attendues.length &&
        attendues.every((k) => k in (v as object) && correspond(s.cles[k]!, (v as Record<string, unknown>)[k], k));
    }
  }
}

/** The shape with every list's contents set aside: what two forms must share to be one. */
function cleDeFusion(s: Squelette): string {
  if (s.t === 'liste') return '[]';
  if (s.t === 'dico') return '{*}';
  if (s.t === 'objet') return `{${Object.keys(s.cles).sort().map((k) => `${JSON.stringify(k)}:${cleDeFusion(s.cles[k]!)}`).join(',')}}`;
  return texteDe(s);
}

function alternatives(de: readonly Squelette[]): Squelette[] {
  const groupes = new Map<string, Squelette>();
  for (const s of de) {
    const k = cleDeFusion(s);
    const deja = groupes.get(k);
    groupes.set(k, deja === undefined ? s : unir(deja, s));
  }
  return [...groupes.keys()].sort().map((k) => groupes.get(k)!);
}

/** Two skeletons sharing a `cleDeFusion`, as one: the element forms of their lists united. */
function unir(a: Squelette, b: Squelette): Squelette {
  if (a.t === 'liste' && b.t === 'liste') return { t: 'liste', de: alternatives([...a.de, ...b.de]) };
  if (a.t === 'dico' && b.t === 'dico') return { t: 'dico', de: alternatives([...a.de, ...b.de]) };
  if (a.t === 'objet' && b.t === 'objet') {
    const cles: Record<string, Squelette> = {};
    for (const k of Object.keys(a.cles).sort()) cles[k] = unir(a.cles[k]!, b.cles[k]!);
    return { t: 'objet', cles };
  }
  return a;
}

/** Every row form seen at each place a list sits in a body (`liste:.lignes`, `dico:.board.manifestes`…). */
function recolter(s: Squelette, chemin: string, acc: Map<string, Squelette[]>): void {
  if (s.t === 'liste' || s.t === 'dico') {
    const k = `${s.t}:${chemin}`;
    acc.set(k, [...(acc.get(k) ?? []), ...s.de]);
    for (const alt of s.de) recolter(alt, `${chemin}[]`, acc);
  } else if (s.t === 'objet') {
    for (const k of Object.keys(s.cles)) recolter(s.cles[k]!, `${chemin}.${k}`, acc);
  }
}

/** The same skeleton, each of its lists holding every row form seen at its place. */
function elargir(s: Squelette, chemin: string, acc: Map<string, Squelette[]>): Squelette {
  if (s.t === 'liste' || s.t === 'dico') {
    return { t: s.t, de: alternatives(acc.get(`${s.t}:${chemin}`)!).map((alt) => elargir(alt, `${chemin}[]`, acc)) };
  }
  if (s.t === 'objet') {
    const cles: Record<string, Squelette> = {};
    for (const k of Object.keys(s.cles).sort()) cles[k] = elargir(s.cles[k]!, `${chemin}.${k}`, acc);
    return { t: 'objet', cles };
  }
  return s;
}

/**
 * The forms of one door, merged so a LIST is judged row by row: a row form the
 * real door gave in one answer may stand in any answer of the same status that
 * has a list at the same place (a board with a queued task AND a rider, when
 * the producer's flows showed each apart; a paused reseller's line on a last
 * page, when the flows showed it on a page with more to come). Everything
 * outside lists stays exact: a status, a key or a word still separates forms.
 */
export function fusionner(formes: readonly Forme[]): Forme[] {
  const groupes = new Map<string, Forme>();
  for (const f of formes) {
    const k = `${f.statut} ${cleDeFusion(f.corps)}`;
    const deja = groupes.get(k);
    groupes.set(k, deja === undefined ? { statut: f.statut, corps: unir(f.corps, f.corps) } : { statut: f.statut, corps: unir(deja.corps, f.corps) });
  }
  const parStatut = new Map<number, Map<string, Squelette[]>>();
  for (const f of groupes.values()) {
    if (!parStatut.has(f.statut)) parStatut.set(f.statut, new Map());
    recolter(f.corps, '', parStatut.get(f.statut)!);
  }
  return [...groupes.keys()].sort().map((k) => {
    const f = groupes.get(k)!;
    return { statut: f.statut, corps: elargir(f.corps, '', parStatut.get(f.statut)!) };
  });
}

/** Is this answer one of the recorded forms? */
export const formeConnue = (formes: readonly Forme[], statut: number, corps: unknown): boolean =>
  formes.some((f) => f.statut === statut && correspond(f.corps, corps));
