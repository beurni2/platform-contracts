/**
 * No-gated-shapes gate (WO-0 §B7; founder ruling 2026-07-08): the public API
 * exports none of the PackLab (B+9) or Cercle (SP9) shapes, and the event
 * registry carries no gated event name. Gated material enters `contracts/`
 * only by deliberate version bump behind its build gate.
 */
export const GATED_EXPORT_NAMES = [
  // PackLab (B+9)
  'PackProduct',
  'PackComponent',
  'KittingJob',
  'PackLabCeilings',
  'RestockDecision',
  // Cercle records (SP9, Shop+ §5.6)
  'CustomerCircle',
  'CircleMembership',
  'MarketingConsent',
  'CommunicationPreference',
  'CustomerInterest',
  'CustomerSegment',
  'ResellerCampaign',
  'CampaignRecipe',
  'CampaignAudience',
  'CampaignOffer',
  'CampaignBudget',
  'CampaignFundingAllocation',
  'CampaignReservation',
  'CampaignCommitment',
  'CampaignSpend',
  'CampaignRelease',
  'CampaignRefund',
  'CampaignOrderAttribution',
  'ScheduledDeliveryCluster',
  'CustomerReferral',
  'ReferralReward',
  'VerifiedBuyerReview',
  'ReviewMediaConsent',
  'PromotionalAssetPack',
  'CampaignLandingPage',
  'CampaignPerformance',
  'CampaignVote',
  'ProviderCampaignAllocation',
  'CampaignLedgerEntry',
  'CampaignReconciliationCase',
  'CampaignBalanceSnapshot',
] as const;

export const GATED_EVENT_PREFIXES = ['packlab.', 'cercle.', 'campaign.', 'referral.', 'review.'] as const;

export interface GatedShapesReport {
  ok: boolean;
  violations: string[];
}

export function checkNoGatedShapes(
  exportNames: readonly string[],
  eventNames: readonly string[],
): GatedShapesReport {
  const violations: string[] = [];
  for (const name of exportNames) {
    for (const gated of GATED_EXPORT_NAMES) {
      if (name === gated || name === `${gated}Schema`) {
        violations.push(`gated shape exported from public API: ${name}`);
      }
    }
  }
  for (const eventName of eventNames) {
    for (const prefix of GATED_EVENT_PREFIXES) {
      if (eventName.startsWith(prefix)) {
        violations.push(`gated event name in registry: ${eventName}`);
      }
    }
  }
  return { ok: violations.length === 0, violations };
}
