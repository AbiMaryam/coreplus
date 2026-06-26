// CorePlus — popup controller
// Full state machine: toggle + license views + AutoGoPay billing flow.

import { isSupabaseConfigured } from "../lib/supabase";
import { formatIdr, type PlanCode, PLANS } from "../lib/plans";
import { createQris, checkQrisStatus } from "../lib/autogopay";
import {
  getPendingTransaction,
  setPendingTransaction,
  isPendingTxExpired,
  type LicenseVerdict,
  type PendingTransaction,
} from "../lib/storage";

const content = document.getElementById("content")!;
const toggle = document.getElementById("master-toggle") as HTMLInputElement;
const toggleStatus = document.getElementById("toggle-status")!;

let pollInterval: ReturnType<typeof setInterval> | null = null;
let currentVerdict: LicenseVerdict | null = null;

// --- Helpers ---

function send<T = Record<string, unknown>>(message: Record<string, unknown>): Promise<T> {
  return chrome.runtime.sendMessage(message);
}

function formatDate(iso?: string): string {
  if (!iso) return "-";
  return new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(iso));
}

function daysUntil(iso?: string): number | null {
  if (!iso) return null;
  const diff = new Date(iso).getTime() - Date.now();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

function stopPolling(): void {
  if (pollInterval) {
    clearInterval(pollInterval);
    pollInterval = null;
  }
}

// --- Toggle logic ---

async function initToggle(): Promise<void> {
  const res = await send<{ enabled: boolean }>({ type: "getEnabled" });
  const enabled = res?.enabled ?? true;
  toggle.checked = enabled;
  updateToggleStatus(enabled);

  toggle.addEventListener("change", async () => {
    const enabled = toggle.checked;
    toggle.disabled = true;
    updateToggleStatus(enabled);
    await send({ type: "setEnabled", enabled });
    toggle.disabled = false;
    renderContent();
  });
}

function updateToggleStatus(enabled: boolean): void {
  toggleStatus.textContent = enabled ? "Aktif" : "Nonaktif";
  toggleStatus.style.color = enabled ? "rgba(255, 213, 74, 0.9)" : "rgba(255, 255, 255, 0.4)";
}

// --- Views ---

function renderLoading(): void {
  content.innerHTML = `
    <div style="display:flex;justify-content:center;padding:40px 0;">
      <span class="spinner spinner-dark"></span>
    </div>`;
}

function renderNotConfigured(): void {
  content.innerHTML = `
    <div class="alert alert-error">
      CorePlus belum dikonfigurasi. Tambahkan URL dan anon key Supabase di <code>.env</code> lalu rebuild ekstensi.
    </div>`;
}

function renderDisabled(): void {
  content.innerHTML = `
    <div class="card">
      <h2>CorePlus Nonaktif</h2>
      <p>Aktifkan toggle di atas untuk menggunakan CorePlus pada portal Coretax.</p>
    </div>`;
}

function renderFree(): void {
  content.innerHTML = `
    <div class="card">
      <h2>CorePlus Free</h2>
      <p>Filter FP dan multi-masa hingga 4 periode aktif. Masukkan kode Pro untuk membuka semua fitur.</p>
    </div>
    <div class="section-title">Masukkan Kode Pro</div>
    <div class="form-group">
      <input type="text" id="code-input" placeholder="CP-XXXXX-XXXXX-XXXXX" spellcheck="false" autocomplete="off" />
    </div>
    <button id="activate-btn" class="btn btn-primary">Aktifkan Pro</button>
    <div id="activate-msg"></div>
    <div class="divider"></div>
    <div class="section-title">Atau Bayar via QRIS</div>
    <button id="buy-monthly" class="btn btn-accent" style="margin-bottom:10px;">
      Bulanan — ${formatIdr(PLANS.monthly.priceIdr)}
    </button>
    <button id="buy-annual" class="btn btn-accent">
      Tahunan — ${formatIdr(PLANS.annual.priceIdr)} <span style="font-size:11px;opacity:0.8">(Hemat 58%)</span>
    </button>`;

  bindCodeEntry();
  document.getElementById("buy-monthly")?.addEventListener("click", () => startBilling("monthly"));
  document.getElementById("buy-annual")?.addEventListener("click", () => startBilling("annual"));
}

function renderBilling(planCode: PlanCode, extendCode?: string): void {
  const plan = PLANS[planCode];
  const label = extendCode ? "Perpanjang" : "Bayar";
  content.innerHTML = `
    <div class="card">
      <h2>${label} ${plan.name}</h2>
      <p>Membuat QRIS pembayaran ${formatIdr(plan.priceIdr)}...</p>
    </div>
    <div style="display:flex;justify-content:center;padding:20px 0;">
      <span class="spinner spinner-dark"></span>
    </div>`;
}

function renderPending(tx: PendingTransaction): void {
  const plan = PLANS[tx.planCode];
  const minsLeft = Math.max(0, 15 - Math.floor((Date.now() - tx.createdAt) / 60000));
  content.innerHTML = `
    <div class="card">
      <h2>Menunggu Pembayaran</h2>
      <p>Scan QRIS di tab yang dibuka untuk membayar ${formatIdr(tx.amount)} (${plan.name}).</p>
    </div>
    <div class="pending-info">
      <div class="pending-spinner">
        <span class="spinner spinner-dark"></span>
        <span>Memeriksa pembayaran... ${minsLeft} menit tersisa</span>
      </div>
    </div>
    <button id="open-checkout" class="btn btn-ghost" style="margin-bottom:8px;">Buka Ulang Halaman QRIS</button>
    <button id="cancel-payment" class="btn btn-ghost">Batalkan</button>`;

  document.getElementById("open-checkout")?.addEventListener("click", () => {
    chrome.tabs.create({ url: tx.checkoutUrl });
  });

  document.getElementById("cancel-payment")?.addEventListener("click", async () => {
    stopPolling();
    await setPendingTransaction(null);
    renderFree();
  });

  // Start polling
  startPolling(tx);
}

function renderSuccess(code: string, plan: PlanCode, expiresAt: string): void {
  const planName = PLANS[plan].name;
  content.innerHTML = `
    <div class="alert alert-success">
      ✔ Pembayaran berhasil! CorePlus Pro ${planName} aktif.
    </div>
    <div class="section-title">Simpan Kode Ini</div>
    <div class="code-display">${code}</div>
    <p style="font-size:11px;color:var(--muted);margin:8px 0 16px;text-align:center;">
      Kode ini adalah kunci akses Pro Anda. Simpan baik-baik — tanpa kode, akses tidak bisa dipulihkan.
    </p>
    <div class="card">
      <div class="status-row">
        <span class="status-label">Paket</span>
        <span class="status-value">${planName}</span>
      </div>
      <div class="status-row">
        <span class="status-label">Berlaku hingga</span>
        <span class="status-value green">${formatDate(expiresAt)}</span>
      </div>
    </div>
    <button id="go-to-status" class="btn btn-primary">Lihat Status</button>`;

  document.getElementById("go-to-status")?.addEventListener("click", async () => {
    renderLoading();
    const res = await send<{ verdict: LicenseVerdict }>({ type: "getVerdict" });
    if (res?.verdict) render(res.verdict);
  });
}

function renderPro(verdict: LicenseVerdict): void {
  const days = daysUntil(verdict.expiresAt);
  const expiringSoon = days !== null && days <= 7;
  const planName = verdict.plan === "annual" ? "Tahunan" : "Bulanan";
  const planCode = verdict.plan || "monthly";

  content.innerHTML = `
    <div class="card">
      <h2>CorePlus Pro Aktif</h2>
      <p>Semua fitur terbuka. Terima kasih telah mendukung CorePlus.</p>
    </div>
    <div class="card">
      <div class="status-row">
        <span class="status-label">Paket</span>
        <span class="status-value">${planName}</span>
      </div>
      <div class="status-row">
        <span class="status-label">Berlaku sejak</span>
        <span class="status-value">${formatDate(verdict.startsAt)}</span>
      </div>
      <div class="status-row">
        <span class="status-label">Berakhir</span>
        <span class="status-value ${expiringSoon ? "red" : "green"}">${formatDate(verdict.expiresAt)}</span>
      </div>
      <div class="status-row">
        <span class="status-label">Sisa waktu</span>
        <span class="status-value ${expiringSoon ? "red" : ""}">${days !== null ? days + " hari" : "-"}</span>
      </div>
    </div>
    ${expiringSoon ? `<div class="alert alert-info">Langganan berakhir dalam ${days} hari.</div>` : ""}
    ${
      expiringSoon
        ? `<button id="renew-annual" class="btn btn-accent" style="margin-bottom:8px;">Perpanjang Tahunan — ${formatIdr(PLANS.annual.priceIdr)}</button>
           <button id="renew-monthly" class="btn btn-accent" style="margin-bottom:8px;">Perpanjang Bulanan — ${formatIdr(PLANS.monthly.priceIdr)}</button>`
        : ""
    }
    <button id="refresh-btn" class="btn btn-ghost" style="margin-bottom:8px;">Periksa Ulang Status</button>
    <button id="logout-btn" class="btn btn-ghost">Hapus Kode dari Perangkat Ini</button>`;

  document.getElementById("refresh-btn")?.addEventListener("click", async (e) => {
    const btn = e.target as HTMLButtonElement;
    btn.disabled = true;
    btn.innerHTML = `<span class="spinner spinner-dark"></span> Memeriksa...`;
    const res = await send<{ verdict: LicenseVerdict }>({ type: "checkLicense" });
    btn.disabled = false;
    btn.innerHTML = "Periksa Ulang Status";
    if (res.verdict) render(res.verdict);
  });

  document.getElementById("logout-btn")?.addEventListener("click", async () => {
    await send({ type: "clearLicense" });
    renderFree();
  });

  const code = verdict.code;
  document.getElementById("renew-annual")?.addEventListener("click", () => {
    if (code) startBilling("annual", code);
  });
  document.getElementById("renew-monthly")?.addEventListener("click", () => {
    if (code) startBilling("monthly", code);
  });
}

function renderExpired(verdict: LicenseVerdict): void {
  const planName = verdict.plan === "annual" ? "Tahunan" : "Bulanan";
  content.innerHTML = `
    <div class="alert alert-error">
      Kode Pro Anda telah kedaluwarsa (paket ${planName}). Masukkan kode baru atau bayar ulang.
    </div>
    <div class="section-title">Masukkan Kode Baru</div>
    <div class="form-group">
      <input type="text" id="code-input" placeholder="CP-XXXXX-XXXXX-XXXXX" spellcheck="false" autocomplete="off" />
    </div>
    <button id="activate-btn" class="btn btn-primary">Aktifkan Pro</button>
    <div id="activate-msg"></div>
    <div class="divider"></div>
    <div class="section-title">Atau Bayar via QRIS</div>
    <button id="buy-monthly" class="btn btn-accent" style="margin-bottom:10px;">
      Bulanan — ${formatIdr(PLANS.monthly.priceIdr)}
    </button>
    <button id="buy-annual" class="btn btn-accent">
      Tahunan — ${formatIdr(PLANS.annual.priceIdr)}
    </button>
    <div class="divider"></div>
    <button id="logout-btn" class="btn btn-ghost">Hapus Kode Lama</button>`;

  bindCodeEntry();
  document.getElementById("buy-monthly")?.addEventListener("click", () => startBilling("monthly"));
  document.getElementById("buy-annual")?.addEventListener("click", () => startBilling("annual"));

  document.getElementById("logout-btn")?.addEventListener("click", async () => {
    await send({ type: "clearLicense" });
    renderFree();
  });
}

function renderError(): void {
  content.innerHTML = `
    <div class="alert alert-error">
      Gagal memeriksa status lisensi. Periksa koneksi internet Anda.
    </div>
    <button id="retry-btn" class="btn btn-primary">Coba Lagi</button>`;

  document.getElementById("retry-btn")?.addEventListener("click", () => {
    renderContent();
  });
}

// --- Shared code-entry binding ---

function bindCodeEntry(): void {
  const btn = document.getElementById("activate-btn") as HTMLButtonElement | null;
  const input = document.getElementById("code-input") as HTMLInputElement | null;
  const msg = document.getElementById("activate-msg");
  if (!btn || !input) return;

  btn.addEventListener("click", async () => {
    const code = input.value.trim();
    if (!code) {
      if (msg) msg.innerHTML = `<div class="alert alert-error">Masukkan kode terlebih dahulu.</div>`;
      return;
    }
    btn.disabled = true;
    btn.innerHTML = `<span class="spinner"></span> Memeriksa...`;
    if (msg) msg.innerHTML = "";

    const res = await send<{ verdict: LicenseVerdict }>({ type: "setCode", code });
    btn.disabled = false;
    btn.innerHTML = "Aktifkan Pro";

    if (res.verdict?.active) {
      render(res.verdict);
    } else {
      const reason = res.verdict?.reason || "UNKNOWN";
      const messages: Record<string, string> = {
        NOT_FOUND: "Kode tidak ditemukan. Periksa kembali penulisan kode.",
        EXPIRED: "Kode ini telah kedaluwarsa. Bayar ulang untuk melanjutkan.",
        PENDING: "Pembayaran belum dikonfirmasi. Coba lagi dalam beberapa menit.",
        FETCH_ERROR: "Gagal terhubung ke server. Periksa koneksi internet lalu coba lagi.",
        NOT_CONFIGURED: "Server belum dikonfigurasi.",
        UNKNOWN: "Terjadi kesalahan. Coba lagi.",
      };
      if (msg) msg.innerHTML = `<div class="alert alert-error">${messages[reason] || messages.UNKNOWN}</div>`;
    }
  });

  input.addEventListener("keypress", (e) => {
    if (e.key === "Enter") btn.click();
  });
  input.focus();
}

// --- Billing flow ---

async function startBilling(planCode: PlanCode, extendCode?: string): Promise<void> {
  stopPolling();
  renderBilling(planCode, extendCode);

  try {
    const result = await createQris({ planCode, extendCode });

    const tx: PendingTransaction = {
      transactionId: result.transaction_id,
      planCode,
      checkoutUrl: result.checkout_url,
      amount: result.amount,
      expiryTime: result.expiry_time,
      extendCode,
      createdAt: Date.now(),
    };
    await setPendingTransaction(tx);

    // Open checkout page in a new tab
    chrome.tabs.create({ url: result.checkout_url });

    // Switch to pending view (starts polling)
    renderPending(tx);
  } catch (err) {
    content.innerHTML = `
      <div class="alert alert-error">
        Gagal membuat pembayaran: ${err instanceof Error ? err.message : "kesalahan tidak diketahui"}
      </div>
      <button id="retry-billing" class="btn btn-primary">Coba Lagi</button>`;
    document.getElementById("retry-billing")?.addEventListener("click", () => {
      if (currentVerdict?.active && currentVerdict.code) {
        renderPro(currentVerdict);
      } else {
        renderFree();
      }
    });
  }
}

function startPolling(tx: PendingTransaction): void {
  stopPolling();
  let attempts = 0;
  const maxAttempts = 180; // 15 min at 5s intervals

  pollInterval = setInterval(async () => {
    attempts++;
    if (attempts > maxAttempts || isPendingTxExpired(tx)) {
      stopPolling();
      await setPendingTransaction(null);
      renderExpiredPayment();
      return;
    }

    try {
      const status = await checkQrisStatus(tx.transactionId);

      if (status.status === "settlement" && status.code) {
        stopPolling();
        await setPendingTransaction(null);

        // Store the code and update the verdict via background SW
        const res = await send<{ verdict: LicenseVerdict }>({
          type: "setCode",
          code: status.code,
        });

        if (res.verdict?.active) {
          currentVerdict = res.verdict;
          renderSuccess(status.code, tx.planCode, status.expires_at || res.verdict.expiresAt || "");
        } else {
          // Code was returned but verdict says inactive — show success anyway with the code
          renderSuccess(status.code, tx.planCode, status.expires_at || "");
        }
      } else if (status.status === "expire" || status.status === "cancel") {
        stopPolling();
        await setPendingTransaction(null);
        renderExpiredPayment();
      }
      // else: still pending, keep polling
    } catch (err) {
      // Network error — keep polling, don't interrupt the user
      console.error("[CorePlus] Polling error:", err);
    }
  }, 5000);
}

function renderExpiredPayment(): void {
  content.innerHTML = `
    <div class="alert alert-error">
      Pembayaran kedaluwarsa atau dibatalkan. Silakan coba lagi.
    </div>
    <button id="retry-billing" class="btn btn-primary">Coba Bayar Lagi</button>`;

  document.getElementById("retry-billing")?.addEventListener("click", () => {
    if (currentVerdict?.active && currentVerdict.code) {
      renderPro(currentVerdict);
    } else {
      renderFree();
    }
  });
}

// --- Main router ---

function render(verdict: LicenseVerdict): void {
  currentVerdict = verdict;
  if (verdict.active) {
    renderPro(verdict);
  } else if (verdict.reason === "EXPIRED") {
    renderExpired(verdict);
  } else {
    renderFree();
  }
}

async function renderContent(): Promise<void> {
  stopPolling();

  if (!toggle.checked) {
    renderDisabled();
    return;
  }

  renderLoading();

  if (!isSupabaseConfigured()) {
    renderNotConfigured();
    return;
  }

  // Check for pending transaction first (resume polling if popup was reopened)
  const pendingTx = await getPendingTransaction();
  if (pendingTx && !isPendingTxExpired(pendingTx)) {
    renderPending(pendingTx);
    return;
  }
  if (pendingTx) {
    await setPendingTransaction(null);
  }

  const res = await send<{ verdict: LicenseVerdict; error?: string }>({ type: "getVerdict" });

  if (!res || res.error || !res.verdict) {
    renderError();
    return;
  }

  render(res.verdict);
}

async function init(): Promise<void> {
  await initToggle();
  await renderContent();
}

init();
