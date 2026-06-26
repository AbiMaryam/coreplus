// CorePlus — AutoGoPay billing helpers (extension-side)
// Calls Supabase Edge Functions which in turn call AutoGoPay.
// The AutoGoPay API key never touches the extension.

import { supabase, isSupabaseConfigured } from "./supabase";
import type { PlanCode } from "./plans";

export interface CreateQrisResponse {
  transaction_id: string;
  order_id: string;
  amount: number;
  checkout_url: string;
  qr_url: string;
  expiry_time: string;
}

export interface StatusResponse {
  status: "pending" | "settlement" | "expire" | "cancel";
  code?: string;
  plan?: PlanCode;
  starts_at?: string;
  expires_at?: string;
  activation_error?: boolean;
  error?: string;
}

export async function createQris(params: {
  planCode: PlanCode;
  extendCode?: string;
}): Promise<CreateQrisResponse> {
  if (!supabase || !isSupabaseConfigured()) {
    throw new Error("Supabase belum dikonfigurasi");
  }

  const { data, error } = await supabase.functions.invoke<CreateQrisResponse & { error?: string }>(
    "autogopay-create-qris",
    {
      body: {
        plan_code: params.planCode,
        extend_code: params.extendCode || null,
      },
    },
  );

  if (error || !data || (data as any).error) {
    throw new Error((data as any)?.error || error?.message || "Gagal membuat pembayaran");
  }

  return data;
}

export async function checkQrisStatus(transactionId: string): Promise<StatusResponse> {
  if (!supabase || !isSupabaseConfigured()) {
    throw new Error("Supabase belum dikonfigurasi");
  }

  const { data, error } = await supabase.functions.invoke<StatusResponse>(
    "autogopay-status",
    {
      body: { transaction_id: transactionId },
    },
  );

  if (error || !data) {
    return { status: "pending", error: error?.message || "Gagal memeriksa status" };
  }

  return data;
}
