// CorePlus — license-check Edge Function
// Validates a license code (or AutoGoPay transaction_id for recovery) and
// returns the current verdict. Called by the extension's background SW.
//
// Deploy: supabase functions deploy license-check --no-verify-jwt

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "authorization, content-type, x-client-info, apikey",
};

function json(body: Record<string, unknown>, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", ...CORS },
  });
}

interface LicenseRow {
  id: string;
  code: string | null;
  plan: string;
  status: string;
  starts_at: string | null;
  expires_at: string | null;
  autogopay_transaction_id: string | null;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });

  let body: { code?: string; transaction_id?: string };
  try {
    body = await req.json();
  } catch {
    return json({ error: "Invalid JSON body" }, 400);
  }

  const code = (body.code || "").trim().toUpperCase();
  const txId = (body.transaction_id || "").trim();

  if (!code && !txId) {
    return json({ error: "Provide 'code' or 'transaction_id'" }, 400);
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    { auth: { persistSession: false } },
  );

  let query = supabase.from("licenses").select("*");
  if (code) {
    query = query.eq("code", code);
  } else {
    query = query.eq("autogopay_transaction_id", txId);
  }
  query = query.order("created_at", { ascending: false }).limit(1);

  const { data, error } = await query.single<LicenseRow>();

  if (error || !data) {
    return json({ active: false, reason: "NOT_FOUND" });
  }

  // Expired or pending
  if (data.status === "expired" || (data.expires_at && new Date(data.expires_at) < new Date())) {
    return json({ active: false, reason: "EXPIRED", plan: data.plan });
  }

  if (data.status === "pending") {
    return json({ active: false, reason: "PENDING", plan: data.plan });
  }

  // Active
  return json({
    active: true,
    tier: "pro",
    plan: data.plan,
    starts_at: data.starts_at,
    expires_at: data.expires_at,
    code: data.code,
  });
});
