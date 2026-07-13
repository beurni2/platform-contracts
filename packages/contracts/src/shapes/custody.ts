import { z } from 'zod';
import { LocationSchema, MediaRefSchema } from '@platform/kernel-types';
import {
  AuthorizationSourceSchema,
  DeliveryFailureReasonSchema,
  DeliveryOutcomeFamilySchema,
  FaultClassSchema,
  HandoffAuthorizationStateSchema,
  PickupVerificationResultSchema,
  ValidationResultSchema,
} from '../enums.js';
import {
  HandoffAuthorizationSecretSchema,
  SellerReadinessChallengeSchema,
} from '../secrets.js';
import { FcfaSchema, IdSchema, IsoTimestampSchema } from './common.js';

/** §5.6 Package/Seal — the custody seal is applied at pickup (seal-after-verification), so it is absent until then. */
export const PackageSchema = z
  .object({
    packageId: IdSchema,
    sellerReadyPackaging: z.boolean(),
    custodySealId: IdSchema.optional(),
    orderLineSnapshot: z.record(z.string(), z.unknown()),
    status: z.string().min(1),
  })
  .strict();
export type Package = z.infer<typeof PackageSchema>;

/**
 * §5.6 PackageReadinessConfirmation — carries the sellerReadinessChallenge
 * and NOTHING ELSE secret. Strict: `buyerDropCode` (or any undeclared key)
 * in readiness evidence is a parse failure — CI-enforced secret separation.
 */
export const PackageReadinessConfirmationSchema = z
  .object({
    orderId: IdSchema,
    photoRef: MediaRefSchema,
    readinessChallenge: SellerReadinessChallengeSchema,
    qty: z.number().int().min(1),
    variant: IdSchema,
    availableConfirmed: z.boolean(),
    at: IsoTimestampSchema,
  })
  .strict();
export type PackageReadinessConfirmation = z.infer<typeof PackageReadinessConfirmationSchema>;

/** §5.6 PickupTask/DeliveryTask. */
const logisticsTaskBase = {
  id: IdSchema,
  orderId: IdSchema,
  location: LocationSchema,
  window: z
    .object({
      start: IsoTimestampSchema,
      end: IsoTimestampSchema,
    })
    .strict(),
  status: z.string().min(1),
  assignmentLeaseRef: IdSchema.optional(),
  routeRef: IdSchema.optional(),
};

export const PickupTaskSchema = z
  .object({ ...logisticsTaskBase, type: z.literal('pickup') })
  .strict();
export type PickupTask = z.infer<typeof PickupTaskSchema>;

export const DeliveryTaskSchema = z
  .object({ ...logisticsTaskBase, type: z.literal('delivery') })
  .strict();
export type DeliveryTask = z.infer<typeof DeliveryTaskSchema>;

export const LogisticsTaskSchema = z.discriminatedUnion('type', [PickupTaskSchema, DeliveryTaskSchema]);
export type LogisticsTask = z.infer<typeof LogisticsTaskSchema>;

/** §5.6 AssignmentLease — exactly one active lease per task (SE-I01). */
export const AssignmentLeaseSchema = z
  .object({
    taskId: IdSchema,
    holder: IdSchema,
    riderId: IdSchema,
    version: z.number().int().min(1),
    status: z.string().min(1),
  })
  .strict();
export type AssignmentLease = z.infer<typeof AssignmentLeaseSchema>;

/** §5.6 RouteManifest — one active manifest, one current stop (SE-I03). */
export const RouteManifestSchema = z
  .object({
    id: IdSchema,
    riderId: IdSchema,
    version: z.number().int().min(1),
    orderedStops: z.array(IdSchema),
    custodyInventory: z.array(IdSchema),
    status: z.string().min(1),
  })
  .strict();
export type RouteManifest = z.infer<typeof RouteManifestSchema>;

/**
 * §5.6 PickupVerification — bounded, objective conformity only (SE-I12).
 * D20 (founder ruling, 2026-07-10): dwell is RECORDED and console-surfaced
 * only — no enforcement fields exist on this shape or anywhere in canon.
 */
export const PickupVerificationSchema = z
  .object({
    orderId: IdSchema,
    riderId: IdSchema,
    checks: z.array(
      z
        .object({
          check: z.string().min(1),
          passed: z.boolean(),
        })
        .strict(),
    ),
    result: PickupVerificationResultSchema,
    rejectionReason: z.string().min(1).optional(),
    custodySealId: IdSchema.optional(),
    evidenceBundleId: IdSchema,
  })
  .strict();
export type PickupVerification = z.infer<typeof PickupVerificationSchema>;

/** §5.6 InspectionPolicy — versioned; owned by Séra/Evidence. */
export const InspectionPolicySchema = z
  .object({
    version: z.string().min(1),
    inspectionCategory: z.string().min(1),
    allowedActions: z.array(z.string().min(1)),
    sealRule: z.string().min(1),
    // D20 (founder ruling, 2026-07-10): a TARGET for recording and
    // console-surfacing dwell — never an enforcement threshold. No
    // enforcement fields exist by ruling.
    dwellTargetSec: z.number().int().min(0),
  })
  .strict();
export type InspectionPolicy = z.infer<typeof InspectionPolicySchema>;

/**
 * SE6.1 DeliveryOutcome (canon at v0.5.0) — "Structured reasons;
 * retry/reschedule/return/incident; no generic failed terminal;
 * fault-attributed." A bare 'failed' outcome is UNREPRESENTABLE: no such
 * family member exists and the strict parse refuses it (gate-proven).
 * Attempt metadata per SE5.x: "One retry window (~15 min…)". Human-readable
 * reason text lives in the i18n catalog (register-tagged), referenced by
 * key — never inline (Law 6 / §10.5). Derivations: E2-taxonomy.md §3.
 */
export const DeliveryOutcomeSchema = z
  .object({
    taskId: IdSchema,
    orderId: IdSchema,
    family: DeliveryOutcomeFamilySchema,
    reasonCode: DeliveryFailureReasonSchema,
    /** i18n catalog key for the human reason (register-tagged there). */
    humanReasonRef: z.string().min(1),
    faultClass: FaultClassSchema,
    attempt: z
      .object({
        number: z.number().int().min(1),
        at: IsoTimestampSchema,
        /** the one retry window (SE5.x), when the family grants one. */
        windowExpiresAt: IsoTimestampSchema.optional(),
      })
      .strict(),
  })
  .strict();
export type DeliveryOutcome = z.infer<typeof DeliveryOutcomeSchema>;

/** §5.6 InspectionSession. */
export const InspectionSessionSchema = z
  .object({
    orderId: IdSchema,
    inspectionCategory: z.string().min(1),
    packageOpened: z.boolean(),
    manufacturerSealOpened: z.boolean(),
    startedAt: IsoTimestampSchema,
    completedAt: IsoTimestampSchema,
    inspectionResult: z.string().min(1),
    rejectionReason: z.string().min(1).optional(),
    faultAssignment: z.string().min(1).optional(),
    evidenceBundleId: IdSchema,
  })
  .strict();
export type InspectionSession = z.infer<typeof InspectionSessionSchema>;

/** §5.6 CustodyRecord — exactly one current custodian (SE-I04). */
export const CustodyRecordSchema = z
  .object({
    packageId: IdSchema,
    currentCustodian: IdSchema,
    transitions: z.array(
      z
        .object({
          from: IdSchema.optional(),
          to: IdSchema,
          at: IsoTimestampSchema,
        })
        .strict(),
    ),
    exception: z.string().min(1).optional(),
  })
  .strict();
export type CustodyRecord = z.infer<typeof CustodyRecordSchema>;

/**
 * §5.6 EvidenceBundle — evidence supports, never releases (SE-I06/SE-I09).
 * `coarseLocation` is written in the Séra spec's shape and omitted in
 * Boutik+/Shop+ — kept optional here (canon nit flagged to the founder).
 */
export const EvidenceBundleSchema = z
  .object({
    taskId: IdSchema,
    packageId: IdSchema,
    custodySealId: IdSchema,
    artifacts: z.array(MediaRefSchema),
    coarseLocation: z.string().min(1).optional(),
    capturedAt: IsoTimestampSchema,
  })
  .strict();
export type EvidenceBundle = z.infer<typeof EvidenceBundleSchema>;

/**
 * Payment-operator actor — `ops:payment:*` (founder ruling 2026-07-13, extending
 * canon's `ops:<domain>:*` convention; sibling of `ops:moderation:*`). Break-glass
 * issuance validates by ALLOW-LIST: ONLY an actor matching this pattern validates;
 * a supplier, a dispatcher (`logistics-service:*`), an `ops:moderation:*`, or
 * anything else is refused by non-match. This is the ISSUER (« ÉMIS PAR — payment
 * operator ») half of the maker-checker seam — the authorized payment operator who
 * *issues* the HandoffAuthorization (ECOSYSTEM-MASTER-REFERENCE §5.494; Sera §115).
 * The dispatcher's « VÉRIFIÉ PAR » ground-verification is a separate act and is NOT
 * a field on this shape (canon bars the dispatcher from issuing — "nobody holds
 * both halves"), so this schema constrains issuance identity only.
 */
export const PaymentOperatorActorSchema = z
  .string()
  .regex(
    /^ops:payment:[A-Za-z0-9._:-]+$/,
    'authorizedBy must be an ops:payment:* actor (only the authorized payment operator issues a break-glass handoff authorization)',
  );

/**
 * §5.6 HandoffAuthorization — signed, single-use, payment-confirmed handoff
 * (the fourth secret; its `signature` is the branded credential).
 * `break_glass` REQUIRES a breakGlassCaseId (mandatory incident review).
 */
export const HandoffAuthorizationSchema = z
  .object({
    orderId: IdSchema,
    riderId: IdSchema,
    buyerRef: IdSchema,
    exactAmount: FcfaSchema,
    providerTransactionReference: z.string().min(1),
    authorizationSource: AuthorizationSourceSchema,
    authorizedBy: PaymentOperatorActorSchema,
    authorizationExpiresAt: IsoTimestampSchema,
    authorizationConsumedAt: IsoTimestampSchema.optional(),
    authorizationReason: z.string().min(1).optional(),
    breakGlassCaseId: IdSchema.optional(),
    signature: HandoffAuthorizationSecretSchema,
    state: HandoffAuthorizationStateSchema,
  })
  .strict()
  .superRefine((value, ctx) => {
    if (value.authorizationSource === 'break_glass' && value.breakGlassCaseId === undefined) {
      ctx.addIssue({
        code: 'custom',
        path: ['breakGlassCaseId'],
        message: 'break_glass authorization requires a breakGlassCaseId (mandatory incident review)',
      });
    }
  });
export type HandoffAuthorization = z.infer<typeof HandoffAuthorizationSchema>;

/** §5.6 ValidationDecision — the only thing that makes settlement eligible; evidence alone never releases. */
export const ValidationDecisionSchema = z
  .object({
    taskId: IdSchema,
    result: ValidationResultSchema,
    reasons: z.array(z.string().min(1)),
  })
  .strict();
export type ValidationDecision = z.infer<typeof ValidationDecisionSchema>;
