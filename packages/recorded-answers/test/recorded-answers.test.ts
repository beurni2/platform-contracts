import { describe, expect, it } from 'vitest';
import {
  ENREGISTREMENTS,
  comparer,
  correspond,
  formeConnue,
  formeDe,
  fusionner,
  porteDe,
  refusDuSubstitut,
  squeletteDe,
  texteDeForme,
  type Porte,
} from '../src/index.js';

/**
 * REPONSES-ENREGISTREES-1 — the form of an answer, and the two checks built on
 * it. What a form keeps (status, keys, value types, vocabulary words) and what
 * it lets vary (ids, amounts, names, times) is pinned here, because a form
 * that kept too little would let a kinder stand-in through, and one that kept
 * too much would refuse every honest one.
 */

const refus = { ok: false, reason: 'not_found' };
const liste = { ok: true, orders: [{ orderId: 'o-1', total: 12_000, note: null }] };

describe('the form of an answer', () => {
  it('keeps the status, the keys, the value types and the vocabulary words — never the values', () => {
    expect(correspond(squeletteDe(liste), { ok: true, orders: [{ orderId: 'o-9', total: 1, note: null }] })).toBe(true);
    expect(correspond(squeletteDe(refus), { ok: false, reason: 'not_found' })).toBe(true);
  });

  it('a different reason word, a missing key, an added key, a changed type is a different form', () => {
    const s = squeletteDe(refus);
    expect(correspond(s, { ok: false, reason: 'refusee' })).toBe(false);
    expect(correspond(s, { ok: false })).toBe(false);
    expect(correspond(s, { ok: false, reason: 'not_found', extra: 1 })).toBe(false);
    expect(correspond(squeletteDe(liste), { ok: true, orders: [{ orderId: 7, total: 1, note: null }] })).toBe(false);
    expect(correspond(squeletteDe(liste), { ok: true, orders: [{ orderId: 'o', total: 1, note: 'x' }] })).toBe(false);
  });

  it('a vocabulary word only matches under a vocabulary key, and a free string never matches under one', () => {
    expect(squeletteDe({ status: 'recorded' })).toEqual({ t: 'objet', cles: { status: { t: 'mot', v: 'recorded' } } });
    expect(correspond({ t: 'mot', v: 'x' }, 'x')).toBe(false); // no key: not a vocabulary field
    expect(correspond({ t: 'objet', cles: { reason: { t: 'string' } } }, { reason: 'anything' })).toBe(false);
  });

  it('lists: every element must be one of the recorded element forms; an empty list fits any', () => {
    const s = squeletteDe({ rows: [{ kind: 'a' }, { kind: 'b' }] });
    expect(correspond(s, { rows: [{ kind: 'b' }, { kind: 'a' }, { kind: 'a' }] })).toBe(true);
    expect(correspond(s, { rows: [] })).toBe(true);
    expect(correspond(s, { rows: [{ kind: 'c' }] })).toBe(false);
    expect(correspond(squeletteDe({ rows: [] }), { rows: [{ kind: 'a' }] }), 'only an empty list was ever seen').toBe(false);
  });

  it('a list keyed by ids: its keys are data, its values judged like rows — and only under a named field', () => {
    const s = squeletteDe({ manifestes: { 'rider-a': { status: 'active' }, 'rider-b': { status: 'active' } } });
    expect(correspond(s, { manifestes: { 'rider-zz': { status: 'active' } } })).toBe(true);
    expect(correspond(s, { manifestes: {} })).toBe(true);
    expect(correspond(s, { manifestes: { 'rider-zz': { status: 'closed' } } })).toBe(false);
    expect(correspond(squeletteDe({ finDeService: {} }), { finDeService: { r: { at: 'x' } } }), 'only an empty one was seen').toBe(false);
    // an ordinary object keeps its keys as the form
    expect(correspond(squeletteDe({ board: { a: 1 } }), { board: { b: 1 } })).toBe(false);
    const a = formeDe(200, { manifestes: { r1: { status: 'active' } } });
    const b = formeDe(200, { manifestes: { r2: { status: 'closed' } } });
    expect(fusionner([a, b])).toHaveLength(1);
    expect(formeConnue(fusionner([a, b]), 200, { manifestes: { x: { status: 'closed' }, y: { status: 'active' } } })).toBe(true);
  });

  it('the canonical text is stable across key order and element order, and tells forms apart', () => {
    const a = formeDe(200, { b: 1, a: [{ kind: 'x' }, { kind: 'y' }] });
    const b = formeDe(200, { a: [{ kind: 'y' }, { kind: 'x' }, { kind: 'x' }], b: 2 });
    expect(texteDeForme(a)).toBe(texteDeForme(b));
    expect(texteDeForme(formeDe(404, refus))).not.toBe(texteDeForme(formeDe(409, refus)));
  });

  it('the status is part of the form', () => {
    expect(formeConnue([formeDe(404, refus)], 404, refus)).toBe(true);
    expect(formeConnue([formeDe(404, refus)], 409, refus)).toBe(false);
  });
});

describe('fusionner — a list is judged row by row', () => {
  it('two answers of the same shape whose lists held different rows become one form holding both row forms', () => {
    const a = formeDe(200, { ok: true, rows: [{ kind: 'queued' }] });
    const b = formeDe(200, { ok: true, rows: [{ kind: 'rider' }] });
    const [f, ...reste] = fusionner([a, b]);
    expect(reste).toEqual([]);
    expect(formeConnue([f!], 200, { ok: true, rows: [{ kind: 'rider' }, { kind: 'queued' }] })).toBe(true);
    expect(formeConnue([a, b], 200, { ok: true, rows: [{ kind: 'rider' }, { kind: 'queued' }] }), 'unmerged, the mix is refused').toBe(false);
  });

  it('merges rows inside rows too, and never merges outside a list: a status, a key or a word still separates', () => {
    const a = formeDe(200, { rows: [{ id: 'x', tags: [{ kind: 'a' }] }] });
    const b = formeDe(200, { rows: [{ id: 'y', tags: [{ kind: 'b' }] }] });
    expect(fusionner([a, b])).toHaveLength(1);
    expect(formeConnue(fusionner([a, b]), 200, { rows: [{ id: 'z', tags: [{ kind: 'b' }, { kind: 'a' }] }] })).toBe(true);
    expect(fusionner([formeDe(200, refus), formeDe(404, refus)])).toHaveLength(2);
    expect(fusionner([formeDe(200, { ok: true }), formeDe(200, { ok: true, next: 'c' })])).toHaveLength(2);
    expect(fusionner([formeDe(409, refus), formeDe(409, { ok: false, reason: 'refusee' })])).toHaveLength(2);
  });

  it('rows are pooled by their place across answers of one status whatever keys sit beside the list — never across statuses', () => {
    const page = formeDe(200, { ok: true, lignes: [{ state: 'paused' }], next: 'c' });
    const derniere = formeDe(200, { ok: true, lignes: [{ state: 'active' }] });
    const f = fusionner([page, derniere]);
    expect(f).toHaveLength(2);
    expect(formeConnue(f, 200, { ok: true, lignes: [{ state: 'active' }, { state: 'paused' }] }), 'a paused line on a last page').toBe(true);
    expect(formeConnue(f, 200, { ok: true, lignes: [{ state: 'closed' }] })).toBe(false);
    const autre = fusionner([formeDe(200, { lignes: [{ state: 'active' }] }), formeDe(409, { lignes: [{ state: 'paused' }] })]);
    expect(formeConnue(autre, 200, { lignes: [{ state: 'paused' }] })).toBe(false);
  });

  it('is stable: merging merged forms changes nothing', () => {
    const f = fusionner([formeDe(200, liste), formeDe(200, { ok: true, orders: [] }), formeDe(404, refus)]);
    expect(fusionner(f).map(texteDeForme)).toEqual(f.map(texteDeForme));
  });
});

const PORTES: readonly Porte[] = [
  { producteur: 'shop-plus', methode: 'POST', chemin: '/checkout/dispatch/:orderId/refusal', formes: [formeDe(200, { ok: true }), formeDe(404, refus)] },
  { producteur: 'sera', methode: 'GET', chemin: '/ops/board', formes: [formeDe(200, liste)] },
];

describe('the door a request is for', () => {
  it('matches the method and every fixed segment; a `:name` segment matches any one segment', () => {
    expect(porteDe(PORTES, 'post', '/checkout/dispatch/ord-7/refusal')?.chemin).toBe('/checkout/dispatch/:orderId/refusal');
    expect(porteDe(PORTES, 'GET', '/checkout/dispatch/ord-7/refusal')).toBeUndefined();
    expect(porteDe(PORTES, 'POST', '/checkout/dispatch/ord-7')).toBeUndefined();
    expect(porteDe(PORTES, 'POST', '/checkout/dispatch/a/b/refusal')).toBeUndefined();
    expect(porteDe(PORTES, 'GET', '/ops/board/')?.producteur).toBe('sera');
  });
});

describe('THE CONSUMER’S CHECK — a stand-in may only say what the real door says', () => {
  it('a recorded form passes; an unrecorded one is refused, naming the door and the answer', () => {
    expect(refusDuSubstitut(PORTES, 'POST', '/checkout/dispatch/o/refusal', 404, refus)).toBeNull();
    const why = refusDuSubstitut(PORTES, 'POST', '/checkout/dispatch/o/refusal', 409, { ok: false, reason: 'deja' });
    expect(why).toContain('shop-plus POST /checkout/dispatch/:orderId/refusal never answers 409');
  });

  it('a door listed with no form yet refuses every answer', () => {
    const vide: Porte[] = [{ producteur: 'sera', methode: 'GET', chemin: '/ops/riders', formes: [] }];
    expect(refusDuSubstitut(vide, 'GET', '/ops/riders', 200, { ok: true, riders: [] })).not.toBeNull();
  });

  it('a door nobody recorded is not this check’s business, nor is a 5xx (the network’s, not the door’s)', () => {
    expect(refusDuSubstitut(PORTES, 'GET', '/ailleurs', 200, { any: 1 })).toBeNull();
    expect(refusDuSubstitut(PORTES, 'GET', '/ops/board', 503, 'down')).toBeNull();
    expect(refusDuSubstitut(PORTES, 'GET', '/ops/board', 499, 'x')).not.toBeNull();
  });
});

describe('THE PRODUCER’S CHECK — the recording is the door, both ways', () => {
  it('merges both sides first: rows seen apart match a recording that holds them together', () => {
    const porte: Porte = { producteur: 'sera', methode: 'GET', chemin: '/b', formes: fusionner([formeDe(200, { rows: [{ k: 'a' }] }), formeDe(200, { rows: [{ k: 'b' }] })]) };
    expect(comparer(porte, [formeDe(200, { rows: [{ k: 'b' }] }), formeDe(200, { rows: [{ k: 'a' }] })])).toEqual({ manquantes: [], inconnues: [] });
  });

  it('names forms recorded but never produced, and forms produced but never recorded', () => {
    const porte = PORTES[0]!;
    expect(comparer(porte, [formeDe(200, { ok: true }), formeDe(404, refus)])).toEqual({ manquantes: [], inconnues: [] });
    const r = comparer(porte, [formeDe(200, { ok: true }), formeDe(409, refus)]);
    expect(r.manquantes).toEqual([texteDeForme(formeDe(404, refus))]);
    expect(r.inconnues).toEqual([texteDeForme(formeDe(409, refus))]);
  });
});

describe('ENREGISTREMENTS — the data itself', () => {
  it('no door twice, no form twice on a door, every path absolute, every form stored merged', () => {
    const cles = ENREGISTREMENTS.map((p) => `${p.producteur} ${p.methode} ${p.chemin}`);
    expect(new Set(cles).size).toBe(cles.length);
    for (const p of ENREGISTREMENTS) {
      expect(p.chemin.startsWith('/'), p.chemin).toBe(true);
      expect(p.methode).toBe(p.methode.toUpperCase());
      const t = p.formes.map(texteDeForme);
      expect(new Set(t).size, `${p.chemin} records a form twice`).toBe(t.length);
      expect(fusionner(p.formes).map(texteDeForme), `${p.chemin} is stored merged`).toEqual(t);
    }
  });
});
