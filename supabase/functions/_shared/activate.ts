// CorePlus — shared license activation logic
// Used by both autogopay-status and autogopay-webhook for idempotent activation.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const PLAN_DURATIONS: Record<string, number> = {
  monthly: 30,
  annual: 365,
};

export interface ActivationResult {
  code: string;
  plan: string;
  starts_at: string;
  expires_at: string;
}

interface LicenseRow {
  id: string;
  code: string | null;
  plan: string;
  status: string;
  starts_at: string | null;
  expires_at: string | null;
  extends_code: string | null;
  autogopay_transaction_id: string | null;
}

function getSupabase() {
  return createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    { auth: { persistSession: false } },
  );
}

/**
 * Idempotently activate a license after AutoGoPay settlement.
 * - If already active, returns the existing code (no-op).
 * - If extending (extends_code set), reuses the old code and extends expiry.
 * - If fresh purchase, generates a new code.
 */
export async function activateLicense(transactionId: string): Promise<ActivationResult | null> {
  const supabase = getSupabase();

  // 1. Find the license row by transaction_id
  const { data: row, error } = await supabase
    .from("licenses")
    .select("*")
    .eq("autogopay_transaction_id", transactionId)
    .order("created_at", { ascending: false })
    .limit(1)
    .single<LicenseRow>();

  if (error || !row) {
    console.error("[activateLicense] License row not found for transaction:", transactionId);
    return null;
  }

  // 2. Idempotent: already activated
  if (row.status === "active" && row.code) {
    return {
      code: row.code,
      plan: row.plan,
      starts_at: row.starts_at || new Date().toISOString(),
      expires_at: row.expires_at || new Date().toISOString(),
    };
  }

  // 3. Only activate pending rows
  if (row.status !== "pending") {
    console.error("[activateLicense] License row is not pending:", row.status);
    return null;
  }

  const durationDays = PLAN_DURATIONS[row.plan] || 30;

  // 4. Extension flow: reuse existing code, extend expiry
  if (row.extends_code) {
    // Find the old active license by the code being extended
    const { data: oldRow } = await supabase
      .from("licenses")
      .select("*")
      .eq("code", row.extends_code)
      .eq("status", "active")
      .order("created_at", { ascending: false })
      .limit(1)
      .single<LicenseRow>();

    const now = new Date();
    const oldExpiry = oldRow?.expires_at ? new Date(oldRow.expires_at) : now;
    // Extend from the later of (old expiry, now) so no days are lost
    const baseDate = oldExpiry > now ? oldExpiry : now;
    const newExpiry = new Date(baseDate.getTime() + durationDays * 24 * 60 * 60 * 1000);

    // Deactivate the old row (NULL its code so only one row holds the code)
    if (oldRow) {
      await supabase
        .from("licenses")
        .update({ status: "expired", code: null })
        .eq("id", oldRow.id);
    }

    // Activate the new row with the extended code
    const { error: updateErr } = await supabase
      .from("licenses")
      .update({
        status: "active",
        code: row.extends_code,
        starts_at: now.toISOString(),
        expires_at: newExpiry.toISOString(),
      })
      .eq("id", row.id);

    if (updateErr) {
      console.error("[activateLicense] Failed to activate extension:", updateErr);
      return null;
    }

    return {
      code: row.extends_code,
      plan: row.plan,
      starts_at: now.toISOString(),
      expires_at: newExpiry.toISOString(),
    };
  }

  // 5. Fresh purchase: generate a new unique code
  const { data: newCode, error: codeErr } = await supabase.rpc("generate_license_code");
  if (codeErr || !newCode) {
    console.error("[activateLicense] Failed to generate code:", codeErr);
    return null;
  }

  const now = new Date();
  const newExpiry = new Date(now.getTime() + durationDays * 24 * 60 * 60 * 1000);

  const { error: updateErr } = await supabase
    .from("licenses")
    .update({
      status: "active",
      code: newCode,
      starts_at: now.toISOString(),
      expires_at: newExpiry.toISOString(),
    })
    .eq("id", row.id);

  if (updateErr) {
    console.error("[activateLicense] Failed to activate fresh license:", updateErr);
    return null;
  }

  return {
    code: newCode,
    plan: row.plan,
    starts_at: now.toISOString(),
    expires_at: newExpiry.toISOString(),
  };
}
