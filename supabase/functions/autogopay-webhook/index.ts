// CorePlus — autogopay-webhook Edge Function
// Receives AutoGoPay webhook notifications, verifies the HMAC-SHA256 signature,
// and activates the license on settlement.
//
// Deploy: supabase functions deploy autogopay-webhook --no-verify-jwt
// Required secret: AUTOGOPAY_API_KEY
// Register webhook URL in AutoGoPay dashboard:
//   https://<project>.functions.supabase.co/autogopay-webhook

import { activateLicense } from "../_shared/activate.ts";

const AUTOGOPAY_BASE = "https://v1-gateway.autogopay.site";

Deno.serve(async (req: Request) => {
  if (req.method !== "POST") {
    return new Response("Method Not Allowed", { status: 405 });
  }

  const apiKey = Deno.env.get("AUTOGOPAY_API_KEY");
  if (!apiKey) {
    console.error("[webhook] AUTOGOPAY_API_KEY not configured");
    return new Response("Server not configured", { status: 500 });
  }

  // 1. Read the RAW body (critical — signature is computed over raw bytes, not re-serialized JSON)
  const rawBody = await req.text();
  const signature = req.headers.get("x-signature") || "";

  if (!signature) {
    console.error("[webhook] Missing X-Signature header");
    return new Response("Missing signature", { status: 401 });
  }

  // 2. Verify HMAC-SHA256 signature
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(apiKey),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );

  const expectedSigBuf = await crypto.subtle.sign(
    "HMAC",
    key,
    new TextEncoder().encode(rawBody),
  );
  const expectedSig = Array.from(new Uint8Array(expectedSigBuf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");

  // Constant-time comparison
  if (signature.length !== expectedSig.length || !timingSafeEqual(signature, expectedSig)) {
    console.error("[webhook] Invalid signature");
    return new Response("Invalid signature", { status: 401 });
  }

  // 3. Parse the verified payload
  let payload: any;
  try {
    payload = JSON.parse(rawBody);
  } catch {
    console.error("[webhook] Invalid JSON payload");
    return new Response("Invalid JSON", { status: 400 });
  }

  console.log("[webhook] Received event:", payload?.event, "status:", payload?.transaction?.status);

  // 4. Process settlement
  if (payload?.event === "transaction.received" && payload?.transaction?.status === "settlement") {
    const txId = payload.transaction.id;

    if (txId) {
      const activation = await activateLicense(txId);
      if (activation) {
        console.log("[webhook] License activated:", activation.code);
      } else {
        // Try matching by order_id as fallback (docs ambiguity: webhook id may differ from generate transaction_id)
        const orderId = payload.transaction.order_id;
        if (orderId) {
          const activation2 = await activateLicense(orderId);
          if (activation2) {
            console.log("[webhook] License activated via order_id fallback:", activation2.code);
          } else {
            console.error("[webhook] Could not activate license for tx:", txId, "order:", orderId);
          }
        } else {
          console.error("[webhook] No transaction id found in webhook payload");
        }
      }
    }
  }

  // 5. Return 200 (AutoGoPay expects 200 within 10 seconds)
  return new Response(JSON.stringify({ success: true }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
});

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return result === 0;
}
