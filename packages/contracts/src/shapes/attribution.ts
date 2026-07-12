import { z } from 'zod';
import { IdSchema, IsoTimestampSchema } from './common.js';

/**
 * ATTRIBUTION — the two-scope model (canon v0.9.0, WO-5.2). Every name here is
 * DERIVED from the founder's edited Shop+ spec §4.1 (A6–A9), quoted verbatim
 * beside each export. Derivations: docs/derivations/ATTRIBUTION-AND-CONFORMITY.md.
 *
 * NOTE on the name `AttributionScope`: v0.8.0 exported an `AttributionScope`
 * that meant the signed token's TARGET ({kind: listing|store|campaign}). A6
 * redefines `AttributionScope` as the PORTÉE (product|identity); the old target
 * shape is now inlined into AttributionToken (byte-identical parse — see
 * commerce.ts) so this canonical name carries the founder's meaning.
 */

/**
 * A6 (Shop+ §4.1): "**Attribution a deux portées.** **`product`** — le lien
 * signé vers une offre précise … **`identity`** — l'identité permanente de la
 * revendeuse : son code court et sa vitrine."
 */
export const AttributionScopeSchema = z.enum(['product', 'identity']);
export type AttributionScope = z.infer<typeof AttributionScopeSchema>;

/**
 * A7 (Shop+ §4.1, structural — founder ruling): "la partie nom = 2 à 12 lettres
 * ASCII `A–Z` … un seul trait d'union · exactement 4 chiffres `0–9` … C'est la
 * structure qui lève l'ambiguïté — lettres avant le trait, chiffres après — et
 * non une restriction de jeu de caractères." Canonical storage is uppercase;
 * the URL slug is the lowercase of the same identifier ("`AICHA-4821` ↔
 * `/v/aicha-4821`").
 */
const RESELLER_SHORT_CODE_RE = /^[A-Z]{2,12}-[0-9]{4}$/;
export const ResellerShortCodeSchema = z.string().regex(RESELLER_SHORT_CODE_RE);
export type ResellerShortCode = z.infer<typeof ResellerShortCodeSchema>;

/**
 * A7 "Saisie tolérante": "insensible à la casse · espaces ignorés · séparateur
 * absent ou remplacé par une espace accepté (`aicha4821`, `aicha 4821` →
 * `AICHA-4821`, la frontière lettres/chiffres étant unique)." Pure normalizer:
 * strip whitespace, upper-case, and — only when no hyphen is present — insert
 * one at the single letters→digits boundary. It NEVER fabricates a valid code
 * from a mis-shaped input: the boundary regex matches only `[A-Z]+[0-9]+`, so
 * anything else passes through unchanged and fails ResellerShortCodeSchema.
 */
export function normalizeShortCode(input: string): string {
  const compact = input.replace(/\s+/g, '').toUpperCase();
  if (compact.includes('-')) return compact;
  const boundary = /^([A-Z]+)([0-9]+)$/.exec(compact);
  return boundary ? `${boundary[1]}-${boundary[2]}` : compact;
}

/** The vitrine slug is the lowercase form of the same identifier (A7). */
export function shortCodeToSlug(code: ResellerShortCode): string {
  return `/v/${code.toLowerCase()}`;
}

/**
 * A6: the attribution reference, discriminated by scope.
 *  · `product` — "le lien signé vers une offre précise :
 *    `{resellerId, offerId, issuedAt, nonce, signature}`. Inchangé ; il échoue
 *    fermé s'il est altéré." offerId REQUIRED here.
 *  · `identity` — "son code court … Portée résolue côté serveur, **sans
 *    signature**." offerId FORBIDDEN here — `.strict()` refuses it at parse.
 * The signed `product` form is additive; today's `AttributionToken` (commerce.ts)
 * is byte-untouched, so E1/E2 pins do not break.
 */
export const AttributionRefSchema = z.discriminatedUnion('scope', [
  z
    .object({
      scope: z.literal('product'),
      resellerId: IdSchema,
      offerId: IdSchema,
      issuedAt: IsoTimestampSchema,
      nonce: z.string().min(1),
      signature: z.string().min(1),
    })
    .strict(),
  z
    .object({
      scope: z.literal('identity'),
      shortCode: ResellerShortCodeSchema,
    })
    .strict(),
]);
export type AttributionRef = z.infer<typeof AttributionRefSchema>;

/**
 * A8: "**L'arrivée (`AttributionArrival`).** … enregistre une arrivée :
 * `{resellerId, scope, offerId?, arrivedAt, correlationId}`."
 */
export const AttributionArrivalSchema = z
  .object({
    resellerId: IdSchema,
    scope: AttributionScopeSchema,
    offerId: IdSchema.optional(),
    arrivedAt: IsoTimestampSchema,
    correlationId: IdSchema,
  })
  .strict();
export type AttributionArrival = z.infer<typeof AttributionArrivalSchema>;

/**
 * A8: "L'arrivée a une durée de validité **versionnée** (défaut : **30 jours** —
 * donnée de politique, ajustable, **jamais silencieusement**)." Policy DATA,
 * never a hardcoded constant at the call site — the version travels with it.
 */
export const ARRIVAL_TTL_POLICY = {
  version: 'attribution-arrival-ttl.v1',
  ttlDays: 30,
} as const;

/** An arrival is unexpired when now < arrivedAt + ttlDays (pure, UTC-days). */
function arrivalUnexpired(arrival: AttributionArrival, nowIso: string, ttlDays: number): boolean {
  const arrived = Date.parse(arrival.arrivedAt);
  const now = Date.parse(nowIso);
  if (Number.isNaN(arrived) || Number.isNaN(now)) return false;
  return now < arrived + ttlDays * 24 * 60 * 60 * 1000;
}

export interface AttributionResolveInput {
  /** Set when the order is already locked — attribution is immutable (SP-I09b.3). */
  readonly lockedResellerId?: string;
  /** A reseller resolved server-side from a code the buyer typed at payment (SP-I09b.1). */
  readonly explicitResellerId?: string;
  readonly arrivals: readonly AttributionArrival[];
  readonly nowIso: string;
  readonly ttlDays: number;
}

export type AttributionResolution =
  | { readonly attributed: true; readonly resellerId: string; readonly source: 'locked' | 'explicit_code' | 'arrival' }
  | { readonly attributed: false; readonly reason: 'none' };

/**
 * SP-I09b (A9) — the precedence resolver, executable. In order:
 *  1. A **locked** order is IMMUTABLE (`first-lock-wins`): its reseller stands
 *     and a second reference does NOT re-attribute (refused, never silent).
 *  2. Else an **explicit code at payment** wins — "l'acte délibéré de l'acheteuse."
 *  3. Else the **most recent unexpired arrival** wins (*last-touch*).
 *  4. Else NONE — "n'attribue **personne** et **ne bascule jamais vers la
 *     plateforme**." There is deliberately NO platform fallback branch.
 */
export function resolveAttribution(input: AttributionResolveInput): AttributionResolution {
  if (input.lockedResellerId !== undefined) {
    return { attributed: true, resellerId: input.lockedResellerId, source: 'locked' };
  }
  if (input.explicitResellerId !== undefined) {
    return { attributed: true, resellerId: input.explicitResellerId, source: 'explicit_code' };
  }
  const live = input.arrivals.filter((a) => arrivalUnexpired(a, input.nowIso, input.ttlDays));
  if (live.length > 0) {
    const latest = live.reduce((a, b) => (Date.parse(b.arrivedAt) > Date.parse(a.arrivedAt) ? b : a));
    return { attributed: true, resellerId: latest.resellerId, source: 'arrival' };
  }
  return { attributed: false, reason: 'none' };
}
