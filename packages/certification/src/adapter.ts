import { z } from 'zod';
import type { PlatformEvent } from '@platform/contracts';

/**
 * The standard mock-adapter interface per E1 contract domain (Contract §3).
 * A mock implements this so the certification suite can force each of the
 * eight required misbehaviors and observe them. The LIVE sibling implements
 * the same interface at assembly — both must pass the same suite before a
 * mock is replaced (§3).
 */
export const CERTIFIABLE_DOMAINS = [
  'payment-provider',
  'eligibility',
  'supply-projection',
  'readiness',
] as const;
export type CertifiableDomain = (typeof CERTIFIABLE_DOMAINS)[number];

/** Controls the certification suite uses to force §3 misbehaviors. */
export interface EmissionControls {
  /** §3 behavior 1 — emit duplicates (same command_id delivered more than once). */
  duplicate?: boolean;
  /** §3 behavior 2 — deliver events out of aggregateVersion order. */
  outOfOrder?: boolean;
  /** §3 behavior 3 — delay delivery by at least this many ms. */
  delayMs?: number;
  /** §3 behavior 5 — simulate a timeout: the emission must fail with a TimeoutError. */
  timeout?: boolean;
  /** §3 behavior 6 — simulate a partial failure: a strict prefix delivers, then failure. */
  partialFailure?: boolean;
}

export interface DeliveredEvent {
  event: PlatformEvent;
  /** ms timestamp at delivery — the delay behavior is measured on this. */
  deliveredAt: number;
}

export interface EmissionResult {
  delivered: DeliveredEvent[];
  /** set when the emission ended in a simulated failure (behavior 6). */
  failure?: { afterCount: number; reason: string };
}

export class MockTimeoutError extends Error {
  override readonly name = 'MockTimeoutError';
}

export interface ProjectionRead {
  /** monotonically increasing projection version. */
  version: number;
  asOf: string;
  value: Record<string, unknown>;
}

export interface TransitionAttempt {
  from: string;
  to: string;
  accepted: boolean;
  reason?: string;
}

export interface MockAdapter {
  readonly domain: CertifiableDomain;
  /**
   * §3 behavior 8 — the contract schema the adapter's payloads are generated
   * from. MUST be the registry schema for its domain (identity-checked); the
   * live producer declares the same one.
   */
  readonly producerSchema: z.ZodType;
  /** Emit the domain's canonical happy-path event sequence for one scenario seed, under controls. */
  emit(seed: string, controls: EmissionControls): Promise<EmissionResult>;
  /** §3 behavior 4 — a projection read that serves a genuinely stale version when asked. */
  readProjection(seed: string, options: { stale: boolean }): Promise<ProjectionRead>;
  /** §3 behavior 7 — attempt the domain's canonical INVALID state transition; must be rejected. */
  attemptInvalidTransition(): TransitionAttempt;
}
