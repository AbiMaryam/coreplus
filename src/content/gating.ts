// CorePlus — freemium gating logic
// Determines which features are available based on the license verdict.

import { FREE_TIER_MAX_PERIODS } from "../lib/plans";
import type { LicenseVerdict } from "../lib/storage";

export interface FeatureGate {
  canUseMultiPeriod: boolean;
  maxPeriods: number; // 4 for free, Infinity for pro
  canUseBulkCredit: boolean;
  canUseBulkDownload: boolean;
  isPro: boolean;
}

export function computeGate(verdict: LicenseVerdict | null): FeatureGate {
  const isPro = !!verdict && verdict.active && verdict.tier === "pro";
  if (isPro) {
    return {
      isPro: true,
      canUseMultiPeriod: true,
      maxPeriods: Infinity,
      canUseBulkCredit: true,
      canUseBulkDownload: true,
    };
  }
  return {
    isPro: false,
    canUseMultiPeriod: true,
    maxPeriods: FREE_TIER_MAX_PERIODS,
    canUseBulkCredit: false,
    canUseBulkDownload: false,
  };
}
