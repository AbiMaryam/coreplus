// CorePlus — license check logic (used by the background service worker)

import { checkLicense, isSupabaseConfigured } from "../lib/supabase";
import {
  getLicenseCode,
  getVerdict,
  isVerdictFresh,
  setVerdict,
  type LicenseVerdict,
} from "../lib/storage";

const ALARM_NAME = "coreplus-license-check";
const CHECK_INTERVAL_MINUTES = 60; // hourly

export { ALARM_NAME, CHECK_INTERVAL_MINUTES };

/**
 * Force a license check against Supabase using the stored code.
 * Updates the cached verdict in chrome.storage.local.
 * Returns the fresh verdict.
 */
export async function refreshVerdict(): Promise<LicenseVerdict> {
  const code = await getLicenseCode();

  if (!code) {
    const free: LicenseVerdict = {
      active: false,
      tier: "free",
      checkedAt: Date.now(),
    };
    await setVerdict(free);
    return free;
  }

  if (!isSupabaseConfigured()) {
    const notConfigured: LicenseVerdict = {
      active: false,
      tier: "free",
      reason: "NOT_CONFIGURED",
      checkedAt: Date.now(),
    };
    await setVerdict(notConfigured);
    return notConfigured;
  }

  const verdict = await checkLicense({ code });
  await setVerdict(verdict);
  return verdict;
}

/**
 * Return the cached verdict if fresh enough; otherwise refresh.
 * Used by content scripts and popup for fast synchronous-ish reads.
 */
export async function getOrRefreshVerdict(): Promise<LicenseVerdict> {
  const cached = await getVerdict();
  if (cached && isVerdictFresh(cached)) {
    return cached;
  }
  return refreshVerdict();
}
