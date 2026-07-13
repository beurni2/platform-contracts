import { describe, expect, it } from 'vitest';
import { MODERATION_REASON_CODES, ModerationDecisionSchema } from '../src/index.js';

const OPS = 'ops:moderation:desk3';

describe('moderation decision (Boutik A1 ratified v1, founder-ratified 2026-07-13)', () => {
  it('carries exactly the six ratified reason codes', () => {
    expect([...MODERATION_REASON_CODES]).toEqual([
      'facts_incomplete',
      'no_public_safe_proof',
      'price_or_contact_in_image',
      'not_neutral_packaging',
      'prohibited_or_unlaunched_category',
      'authenticity_concern',
    ]);
  });

  it('accepts approved and changes_requested-with-reasons by an ops:moderation actor', () => {
    expect(ModerationDecisionSchema.safeParse({ decision: 'approved', decided_by: OPS }).success).toBe(true);
    expect(
      ModerationDecisionSchema.safeParse({
        decision: 'changes_requested',
        reasons: ['facts_incomplete', 'not_neutral_packaging'],
        decided_by: OPS,
      }).success,
    ).toBe(true);
  });

  it('REFUSES a reasonless changes_requested — a silent rejection is unrepresentable', () => {
    expect(
      ModerationDecisionSchema.safeParse({ decision: 'changes_requested', reasons: [], decided_by: OPS }).success,
    ).toBe(false);
  });

  it('REFUSES a supplier actor — no self-moderation, ops:moderation only', () => {
    for (const actor of ['supplier:acme-123', 'ops:finance:x', 'moderation:desk3', 'ops:moderation:']) {
      expect(
        ModerationDecisionSchema.safeParse({ decision: 'changes_requested', reasons: ['authenticity_concern'], decided_by: actor })
          .success,
        actor,
      ).toBe(false);
    }
  });

  it("REFUSES a generic 'rejected' terminal and an off-enum reason", () => {
    expect(ModerationDecisionSchema.safeParse({ decision: 'rejected', decided_by: OPS }).success).toBe(false);
    expect(
      ModerationDecisionSchema.safeParse({ decision: 'changes_requested', reasons: ['made_up_reason'], decided_by: OPS }).success,
    ).toBe(false);
  });
});
