// CorePlus — autogopay-status Edge Function
// Polls AutoGoPay transaction status. On settlement, idempotently activates
// the license and returns the code. This makes the popup self-sufficient —
// it doesn't need to wait for the webhook.
//
// Deploy: supabase functions deploy autogopay-status --no-verify-jwt
// Required secret: AUTOGOPAY_API_KEY

import { activateLicense } from "../_shared/activate.ts";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "authorization, content-type, x-client-info, apikey",
};

const AUTOGOPAY_BASE = "https://v1-gateway.autogopay.site";

function json(body: Record<string, unknown>, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", ...CORS },
  });
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });

  let body: { transaction_id?: string };
  try {
    body = await req.json();
  } catch {
    return json({ error: "Invalid JSON body" }, 400);
  }

  const txId = (body.transaction_id || "").trim();
  if (!txId) {
    return json({ error: "Provide 'transaction_id'" }, 400);
  }

  const apiKey = Deno.env.get("AUTOGOPAY_API_KEY");
  if (!apiKey) {
    return json({ error: "AUTOGOPAY_API_KEY not configured" }, 500);
  }

  // 1. Call AutoGoPay /qris/status
  let statusResponse: any;
  try {
    const res = await fetch(`${AUTOGOPAY_BASE}/qris/status`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ transaction_id: txId }),
    });
    statusResponse = await res.json();
  } catch (err) {
    console.error("[autogopay-status] AutoGoPay fetch failed:", err);
    return json({ error: "Gagal terhubung ke AutoGoPay" }, 502);
  }

  if (!statusResponse?.success || !statusResponse?.data) {
    console.error("[autogopay-status] AutoGoPay error:", statusResponse);
    return json({ error: statusResponse?.message || "AutoGoPay error" }, 502);
  }

  const txStatus = statusResponse.data.transaction_status; // pending | settlement | expire | cancel

  // 2. On settlement, activate the license (idempotent)
  if (txStatus === "settlement") {
    const activation = await activateLicense(txId);
    if (activation) {
      return json({
        status: "settlement",
        code: activation.code,
        plan: activation.plan,
        starts_at: activation.starts_at,
        expires_at: activation.expires_at,
      });
    }
    // Activation failed but payment was received — log for manual review
    console.error("[autogopay-status] Activation failed for transaction:", txId);
    return json({ status: "settlement", activation_error: true });
  }

  // 3. Return pending/expired/cancel status
  return json({
    status: txStatus,
    transaction_id: txId,
  });
});
