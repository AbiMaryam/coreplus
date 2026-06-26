// CorePlus — Supabase client + Edge Function invoker
// The anon key is safe to bundle (RLS-protected, no client-side table access).
// The service role key lives ONLY in Supabase project secrets (server-side).

import { createClient } from "@supabase/supabase-js";
import type { LicenseVerdict } from "./storage";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

export const isSupabaseConfigured = (): boolean =>
  !!SUPABASE_URL &&
  !!SUPABASE_ANON_KEY &&
  !SUPABASE_URL.includes("YOUR-PROJECT") &&
  !SUPABASE_ANON_KEY.includes("YOUR_ANON_KEY");

export const supabase = isSupabaseConfigured()
  ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: { persistSession: false, autoRefreshToken: false },
    })
  : null;

// --- Edge Function calls ---

interface LicenseCheckResponse {
  active: boolean;
  tier?: "pro";
  plan?: "monthly" | "annual";
  starts_at?: string;
  expires_at?: string;
  code?: string;
  reason?: string;
  error?: string;
}

/**
 * Validate a license code (or transaction_id for recovery) against the
 * license-check Edge Function. Returns a normalized verdict.
 */
export async function checkLicense(params: {
  code?: string;
  transactionId?: string;
}): Promise<LicenseVerdict> {
  if (!supabase) {
    return {
      active: false,
      tier: "free",
      reason: "NOT_CONFIGURED",
      checkedAt: Date.now(),
    };
  }

  const { data, error } = await supabase.functions.invoke<LicenseCheckResponse>(
    "license-check",
    {
      body: {
        code: params.code?.toUpperCase(),
        transaction_id: params.transactionId,
      },
    },
  );

  if (error || !data || data.error) {
    return {
      active: false,
      tier: "free",
      reason: "FETCH_ERROR",
      checkedAt: Date.now(),
    };
  }

  return {
    active: data.active,
    tier: data.active ? "pro" : "free",
    plan: data.plan,
    startsAt: data.starts_at,
    expiresAt: data.expires_at,
    code: data.code,
    reason: data.active ? undefined : data.reason,
    checkedAt: Date.now(),
  };
}
