// CorePlus — plan definitions (single source of truth for pricing)
// Used by popup billing UI and Edge Function payload validation.

export type PlanCode = "monthly" | "annual";

export interface Plan {
  code: PlanCode;
  name: string;
  priceIdr: number;
  durationDays: number;
  features: string[];
}

export const PLANS: Record<PlanCode, Plan> = {
  monthly: {
    code: "monthly",
    name: "Bulanan",
    priceIdr: 20000,
    durationDays: 30,
    features: [
      "Filter multi-masa tanpa batas",
      "Bulk ubah masa kredit",
      "Bulk unduh PDF",
      "Prioritas bantuan via WhatsApp",
    ],
  },
  annual: {
    code: "annual",
    name: "Tahunan",
    priceIdr: 100000,
    durationDays: 365,
    features: [
      "Semua fitur Bulanan",
      "Hemat 58% vs bulanan",
      "Prioritas dukungan penuh",
    ],
  },
};

export const FREE_TIER_MAX_PERIODS = 4;

export function formatIdr(amount: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(amount);
}
