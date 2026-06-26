// CorePlus — chrome.storage.local helpers
// Typed wrappers for all persisted extension state.

import type { PlanCode } from "./plans";

export interface LicenseVerdict {
  active: boolean;
  tier: "free" | "pro";
  plan?: PlanCode;
  startsAt?: string;
  expiresAt?: string;
  code?: string;
  reason?: string; // when inactive: "NOT_FOUND" | "EXPIRED" | "PENDING" | "OFFLINE_GRACE"
  checkedAt: number; // epoch ms — when this verdict was last refreshed
}

export interface PendingTransaction {
  transactionId: string;
  planCode: PlanCode;
  checkoutUrl: string;
  amount: number;
  expiryTime: string;
  extendCode?: string;
  createdAt: number;
}

const KEYS = {
  enabled: "coreplus_enabled",
  code: "license_code",
  verdict: "license_verdict",
  pendingTx: "pending_transaction",
} as const;

// --- individual getters ---

export async function getEnabled(): Promise<boolean> {
  const result = await chrome.storage.local.get(KEYS.enabled);
  return result[KEYS.enabled] ?? true; // default ON
}

export async function setEnabled(enabled: boolean): Promise<void> {
  await chrome.storage.local.set({ [KEYS.enabled]: enabled });
}

export async function getLicenseCode(): Promise<string | null> {
  const result = await chrome.storage.local.get(KEYS.code);
  return result[KEYS.code] ?? null;
}

export async function setLicenseCode(code: string | null): Promise<void> {
  if (code === null) {
    await chrome.storage.local.remove(KEYS.code);
  } else {
    await chrome.storage.local.set({ [KEYS.code]: code });
  }
}

export async function getVerdict(): Promise<LicenseVerdict | null> {
  const result = await chrome.storage.local.get(KEYS.verdict);
  return result[KEYS.verdict] ?? null;
}

export async function setVerdict(verdict: LicenseVerdict | null): Promise<void> {
  if (verdict === null) {
    await chrome.storage.local.remove(KEYS.verdict);
  } else {
    await chrome.storage.local.set({ [KEYS.verdict]: verdict });
  }
}

// --- composite helpers ---

export async function clearLicense(): Promise<void> {
  await setLicenseCode(null);
  await setVerdict(null);
}

// Grace window: if we can't reach Supabase, trust the last verdict for this long.
const OFFLINE_GRACE_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

export function isVerdictFresh(verdict: LicenseVerdict | null): boolean {
  if (!verdict) return false;
  return Date.now() - verdict.checkedAt < OFFLINE_GRACE_MS;
}

export function isVerdictGraceExpired(verdict: LicenseVerdict | null): boolean {
  if (!verdict) return true;
  return Date.now() - verdict.checkedAt >= OFFLINE_GRACE_MS;
}

// --- Pending transaction (for billing flow) ---

export async function getPendingTransaction(): Promise<PendingTransaction | null> {
  const result = await chrome.storage.local.get(KEYS.pendingTx);
  return result[KEYS.pendingTx] ?? null;
}

export async function setPendingTransaction(tx: PendingTransaction | null): Promise<void> {
  if (tx === null) {
    await chrome.storage.local.remove(KEYS.pendingTx);
  } else {
    await chrome.storage.local.set({ [KEYS.pendingTx]: tx });
  }
}

export function isPendingTxExpired(tx: PendingTransaction | null): boolean {
  if (!tx) return true;
  // AutoGoPay QRIS expires after ~15 minutes
  return Date.now() - tx.createdAt > 16 * 60 * 1000;
}
