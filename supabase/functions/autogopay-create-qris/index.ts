// CorePlus — autogopay-create-qris Edge Function
// Creates a QRIS payment via AutoGoPay and inserts a pending license row.
//
// Deploy: supabase functions deploy autogopay-create-qris --no-verify-jwt
// Required secret: AUTOGOPAY_API_KEY

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "authorization, content-type, x-client-info, apikey",
};

const AUTOGOPAY_BASE = "https://v1-gateway.autogopay.site";

const PLANS: Record<string, { amount: number; durationDays: number }> = {
  monthly: { amount: 20000, durationDays: 30 },
  annual: { amount: 100000, durationDays: 365 },
};

function json(body: Record<string, unknown>, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", ...CORS },
  });
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });

  let body: { plan_code?: string; extend_code?: string };
  try {
    body = await req.json();
  } catch {
    return json({ error: "Invalid JSON body" }, 400);
  }

  const planCode = (body.plan_code || "").trim().toLowerCase();
  const extendCode = (body.extend_code || "").trim().toUpperCase() || null;

  if (!planCode || !PLANS[planCode]) {
    return json({ error: "Invalid plan_code. Use 'monthly' or 'annual'." }, 400);
  }

  const plan = PLANS[planCode];
  const apiKey = Deno.env.get("AUTOGOPAY_API_KEY");

  if (!apiKey) {
    return json({ error: "AUTOGOPAY_API_KEY not configured" }, 500);
  }

  // 1. Call AutoGoPay /qris/generate
  let qrisResponse: any;
  try {
    const res = await fetch(`${AUTOGOPAY_BASE}/qris/generate`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ amount: plan.amount }),
    });
    qrisResponse = await res.json();
  } catch (err) {
    console.error("[create-qris] AutoGoPay fetch failed:", err);
    return json({ error: "Gagal terhubung ke AutoGoPay" }, 502);
  }

  if (!qrisResponse?.success || !qrisResponse?.data) {
    console.error("[create-qris] AutoGoPay error:", qrisResponse);
    return json({ error: qrisResponse?.message || "AutoGoPay error" }, 502);
  }

  const tx = qrisResponse.data;

  // 2. Insert pending license row
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    { auth: { persistSession: false } },
  );

  // If extending, verify the existing code is valid
  if (extendCode) {
    const { data: existing } = await supabase
      .from("licenses")
      .select("code, status, expires_at")
      .eq("code", extendCode)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!existing) {
      return json({ error: "Kode yang akan diperpanjang tidak ditemukan" }, 400);
    }
  }

  const { error: insertErr } = await supabase.from("licenses").insert({
    plan: planCode,
    status: "pending",
    extends_code: extendCode,
    autogopay_transaction_id: tx.transaction_id,
    autogopay_order_id: tx.order_id,
    amount_idr: plan.amount,
    raw_payload: qrisResponse,
  });

  if (insertErr) {
    console.error("[create-qris] DB insert failed:", insertErr);
    // Don't fail the request — the payment was already created on AutoGoPay
  }

  // 3. Return checkout info to the extension
  return json({
    transaction_id: tx.transaction_id,
    order_id: tx.order_id,
    amount: plan.amount,
    checkout_url: tx.checkout_url,
    qr_url: tx.qr_url,
    expiry_time: tx.expiry_time,
  });
});
