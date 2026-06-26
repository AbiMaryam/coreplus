// CorePlus — content script
// Phase 2: toggle-aware injection + freemium gating.

import injectedScriptUrl from "../injected/injected.js?url";
import { computeGate, type FeatureGate } from "./gating";
import type { LicenseVerdict } from "../lib/storage";

// --- State (cached in module scope for synchronous access by injectToolkitUI) ---

let coreplusEnabled = true;
let cachedVerdict: LicenseVerdict | null = null;
let cachedGate: FeatureGate = computeGate(null);
let injectionInterval: ReturnType<typeof setInterval> | null = null;
let proxyInjected = false;

// --- Proxy injection ---

function injectProxyScript(): void {
  if (proxyInjected) return;
  const script = document.createElement("script");
  script.src = chrome.runtime.getURL(injectedScriptUrl) + "?v=" + new Date().getTime();
  script.onload = () => script.remove();
  (document.head || document.documentElement).appendChild(script);
  proxyInjected = true;
}

function setProxyEnabled(enabled: boolean): void {
  document.dispatchEvent(new CustomEvent("CorePlusSetEnabled", { detail: { enabled } }));
}

// --- State initialization ---

async function initFromStorage(): Promise<void> {
  const [enabledRes, verdictRes] = await Promise.all([
    chrome.runtime.sendMessage({ type: "getEnabled" }),
    chrome.runtime.sendMessage({ type: "getVerdict" }),
  ]);

  coreplusEnabled = enabledRes?.enabled ?? true;
  cachedVerdict = verdictRes?.verdict ?? null;
  cachedGate = computeGate(cachedVerdict);

  applyEnabledState();
}

function applyEnabledState(): void {
  if (coreplusEnabled) {
    injectProxyScript();
    setProxyEnabled(true);
    startUIInjection();
  } else {
    setProxyEnabled(false);
    stopUIInjection();
    removeToolkitUI();
  }
}

function startUIInjection(): void {
  if (injectionInterval) return;
  injectToolkitUI();
  injectionInterval = setInterval(injectToolkitUI, 1500);
}

function stopUIInjection(): void {
  if (injectionInterval) {
    clearInterval(injectionInterval);
    injectionInterval = null;
  }
}

function removeToolkitUI(): void {
  const container = document.getElementById("efaktur-toolkit-container");
  if (container) container.remove();
}

// --- Message listener (toggle + verdict updates from background SW) ---

chrome.runtime.onMessage.addListener((message, _sender, _sendResponse) => {
  if (message?.type === "coreplusToggleChanged") {
    coreplusEnabled = message.enabled;
    applyEnabledState();
  } else if (message?.type === "coreplusVerdictUpdate") {
    cachedVerdict = message.verdict;
    cachedGate = computeGate(cachedVerdict);
    // Re-inject UI to reflect new gate state
    removeToolkitUI();
    if (coreplusEnabled) injectToolkitUI();
  }
  return false; // synchronous — no sendResponse needed
});

// --- The UI injection engine ---

function injectToolkitUI(): void {
  if (!coreplusEnabled) return;

  const actionHeaderBar = document.querySelector<HTMLDivElement>(
    "div.invoice-header div.d-flex.justify-content-end",
  );
  if (!actionHeaderBar || document.getElementById("efaktur-toolkit-container")) return;

  const toolkitWrapper = document.createElement("div");
  toolkitWrapper.id = "efaktur-toolkit-container";

  const gate = cachedGate;
  const lockSuffix = gate.isPro ? "" : ' <span class="pro-lock">PRO</span>';
  const bulkDisabled = gate.isPro ? "" : "disabled";

  const html = `
        <div class="toolkit-control-group">
            <button type="button" id="efaktur-multi-btn">⚡ Multi-Period</button>
            <div id="efaktur-multi-panel" style="display: none;">
                <h4>Pilih Masa Pajak ${gate.isPro ? "(Tanpa Batas)" : `(Maks. ${gate.maxPeriods} — Pro untuk buka semua)`}</h4>
                <div class="chk-grid">
                    <label><input type="checkbox" value="TD.00701"> Januari</label><label><input type="checkbox" value="TD.00702"> Februari</label>
                    <label><input type="checkbox" value="TD.00703"> Maret</label><label><input type="checkbox" value="TD.00704"> April</label>
                    <label><input type="checkbox" value="TD.00705"> Mei</label><label><input type="checkbox" value="TD.00706"> Juni</label>
                    <label><input type="checkbox" value="TD.00707"> Juli</label><label><input type="checkbox" value="TD.00708"> Agustus</label>
                    <label><input type="checkbox" value="TD.00709"> September</label><label><input type="checkbox" value="TD.00710"> Oktober</label>
                    <label><input type="checkbox" value="TD.00711"> November</label><label><input type="checkbox" value="TD.00712"> Desember</label>
                </div>
                ${gate.isPro ? "" : `<div class="free-period-hint">Free: pilih maksimal ${gate.maxPeriods} masa. Upgrade Pro untuk semua.</div>`}
            </div>
        </div>

        <div class="toolkit-control-group">
            <button type="button" id="efaktur-fp-filter-btn">🔍 Filter FP</button>
            <div id="efaktur-fp-panel" style="display: none;">
                <h4>Tempel Daftar Nomor FP (Format Vertikal)</h4>
                <textarea id="efaktur-fp-textarea" placeholder="Contoh:\n04002600038255520\n04002600052854641"></textarea>
                <div class="fp-info-text">Pemisah otomatis baris baru terdeteksi.</div>
            </div>
        </div>

        <div class="toolkit-control-group bulk-action-wrap${gate.isPro ? "" : " locked"}">
            <input type="text" id="bulk-target-year" value="2026" placeholder="Tahun" maxlength="4">

            <select id="bulk-target-status">
                <option value="CREDITED">Dikreditkan</option>
                <option value="APPROVED">Belum Dikreditkan</option>
            </select>

            <select id="bulk-target-period">
                <option value="">-- Pilih Masa Tujuan --</option>
                <option value="TD.00701">Januari</option><option value="TD.00702">Februari</option>
                <option value="TD.00703">Maret</option><option value="TD.00704">April</option>
                <option value="TD.00705">Mei</option><option value="TD.00706">Juni</option>
                <option value="TD.00707">Juli</option><option value="TD.00708">Agustus</option>
                <option value="TD.00709">September</option><option value="TD.00710">Oktober</option>
                <option value="TD.00711">November</option><option value="TD.00712">Desember</option>
            </select>
            <button type="button" id="ef-bulk-run-btn" ${bulkDisabled}>Ubah Masa Kredit${lockSuffix}</button>
        </div>

        <button type="button" id="ef-bulk-download-btn" title="Unduh PDF Massal" ${bulkDisabled}>&#x2B73;${lockSuffix}</button>

        <div id="bulk-status-msg"></div>
    `;
  toolkitWrapper.innerHTML = html;
  actionHeaderBar.insertBefore(toolkitWrapper, actionHeaderBar.firstChild);

  // BIND EVENT LISTENERS
  const multiBtn = toolkitWrapper.querySelector<HTMLButtonElement>("#efaktur-multi-btn")!;
  const multiPanel = toolkitWrapper.querySelector<HTMLDivElement>("#efaktur-multi-panel")!;
  const fpBtn = toolkitWrapper.querySelector<HTMLButtonElement>("#efaktur-fp-filter-btn")!;
  const fpPanel = toolkitWrapper.querySelector<HTMLDivElement>("#efaktur-fp-panel")!;
  const fpTextarea = toolkitWrapper.querySelector<HTMLTextAreaElement>("#efaktur-fp-textarea")!;
  const runBulkBtn = toolkitWrapper.querySelector<HTMLButtonElement>("#ef-bulk-run-btn")!;
  const downloadBulkBtn = toolkitWrapper.querySelector<HTMLButtonElement>("#ef-bulk-download-btn")!;
  const checkboxes = Array.from(
    multiPanel.querySelectorAll<HTMLInputElement>('input[type="checkbox"]'),
  );

  // Restore saved periods
  try {
    const savedPeriods = JSON.parse(sessionStorage.getItem("efaktur_custom_periods") || "[]") as string[];
    if (savedPeriods.length > 0) {
      checkboxes.forEach((cb) => {
        if (savedPeriods.includes(cb.value)) cb.checked = true;
      });
      multiBtn.innerHTML = `⚡ Multi-Period (${savedPeriods.length})`;
      multiBtn.classList.add("active-proxy");
    }
  } catch (e) {
    /* noop */
  }

  // Restore saved FPs
  try {
    const savedFPs = JSON.parse(sessionStorage.getItem("efaktur_custom_fps") || "[]") as string[];
    if (savedFPs.length > 0) {
      fpTextarea.value = savedFPs.join("\n");
      fpBtn.innerHTML = `🔍 Filter FP (${savedFPs.length})`;
      fpBtn.classList.add("active-proxy");
    }
  } catch (e) {
    /* noop */
  }

  multiBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    fpPanel.style.display = "none";
    if (multiPanel.style.display === "block") {
      multiPanel.style.display = "none";
      triggerGridReload();
    } else {
      multiPanel.style.display = "block";
    }
  });

  fpBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    multiPanel.style.display = "none";
    if (fpPanel.style.display === "block") {
      fpPanel.style.display = "none";
      processAndSaveFPList();
      triggerGridReload();
    } else {
      fpPanel.style.display = "block";
      fpTextarea.focus();
    }
  });

  multiPanel.addEventListener("click", (e) => e.stopPropagation());
  fpPanel.addEventListener("click", (e) => e.stopPropagation());

  document.addEventListener("click", (e) => {
    if (!toolkitWrapper.contains(e.target as Node)) {
      let refreshNeeded = false;
      if (multiPanel.style.display === "block") {
        multiPanel.style.display = "none";
        refreshNeeded = true;
      }
      if (fpPanel.style.display === "block") {
        fpPanel.style.display = "none";
        processAndSaveFPList();
        refreshNeeded = true;
      }
      if (refreshNeeded) triggerGridReload();
    }
  });

  // Freemium: cap checkbox selection for free tier
  checkboxes.forEach((cb) => {
    cb.addEventListener("change", () => {
      if (!gate.isPro) {
        const checkedCount = multiPanel.querySelectorAll<HTMLInputElement>("input:checked").length;
        if (checkedCount > gate.maxPeriods) {
          cb.checked = false;
          showProLockMessage("Anda memilih lebih dari " + gate.maxPeriods + " masa. Upgrade Pro untuk memilih semua masa.");
          return;
        }
      }
      const checked = Array.from(multiPanel.querySelectorAll<HTMLInputElement>("input:checked")).map(
        (c) => c.value,
      );
      if (checked.length > 0) {
        sessionStorage.setItem("efaktur_custom_periods", JSON.stringify(checked));
        multiBtn.innerHTML = `⚡ Multi-Period (${checked.length})`;
        multiBtn.classList.add("active-proxy");
      } else {
        sessionStorage.removeItem("efaktur_custom_periods");
        multiBtn.innerHTML = "⚡ Multi-Period";
        multiBtn.classList.remove("active-proxy");
      }
    });
  });

  function processAndSaveFPList(): void {
    const rawLines = fpTextarea.value.split("\n");
    const sanitizedNumbers: string[] = [];
    rawLines.forEach((line) => {
      const clean = line.replace(/[^0-9]/g, "").trim();
      if (clean.length >= 10) sanitizedNumbers.push(clean);
    });
    if (sanitizedNumbers.length > 0) {
      sessionStorage.setItem("efaktur_custom_fps", JSON.stringify(sanitizedNumbers));
      fpBtn.innerHTML = `🔍 Filter FP (${sanitizedNumbers.length})`;
      fpBtn.classList.add("active-proxy");
    } else {
      sessionStorage.removeItem("efaktur_custom_fps");
      fpBtn.innerHTML = "🔍 Filter FP";
      fpBtn.classList.remove("active-proxy");
    }
  }

  function getSelectedInvoiceNumbers(): string[] {
    const selectedRows = document.querySelectorAll<HTMLTableRowElement>(
      'tr.p-highlight, tr:has(div.p-checkbox-box[aria-checked="true"])',
    );
    const selectedInvoiceNumbers: string[] = [];
    selectedRows.forEach((row) => {
      const cells = row.querySelectorAll("td");
      if (cells && cells.length >= 5) {
        const invoiceCellText = (cells[4] as HTMLElement).innerText || "";
        const cleanInvoiceNum = invoiceCellText.replace(/[^0-9]/g, "").trim();
        if (cleanInvoiceNum.length >= 15) selectedInvoiceNumbers.push(cleanInvoiceNum);
      }
    });
    return selectedInvoiceNumbers;
  }

  runBulkBtn.addEventListener("click", () => {
    if (!gate.canUseBulkCredit) {
      showProLockMessage("Bulk Ubah Masa adalah fitur Pro. Klik ikon CorePlus untuk mengaktifkan.");
      return;
    }

    const targetYear = (document.getElementById("bulk-target-year") as HTMLInputElement).value.trim();
    const targetStatus = (document.getElementById("bulk-target-status") as HTMLSelectElement).value;
    const targetPeriod = (document.getElementById("bulk-target-period") as HTMLSelectElement).value;
    const statusDiv = document.getElementById("bulk-status-msg")!;

    if (!targetYear || targetYear.length !== 4 || isNaN(Number(targetYear))) {
      alert("Format tahun salah!");
      return;
    }
    if (!targetPeriod) {
      alert("Pilih masa tujuan dahulu!");
      return;
    }

    const invoices = getSelectedInvoiceNumbers();
    if (invoices.length === 0) {
      alert("Centang faktur pada tabel dahulu!");
      return;
    }

    const periodSelect = document.getElementById("bulk-target-period") as HTMLSelectElement;
    const statusSelect = document.getElementById("bulk-target-status") as HTMLSelectElement;
    const selectedPeriodText = periodSelect.options[periodSelect.selectedIndex].text;
    const selectedStatusText = statusSelect.options[statusSelect.selectedIndex].text;

    if (!confirm(`Ubah ${invoices.length} faktur menjadi [${selectedStatusText}] ke Masa ${selectedPeriodText}?`))
      return;

    statusDiv.className = "loading";
    statusDiv.innerText = `Menyiapkan proses parallel...`;

    document.dispatchEvent(
      new CustomEvent("EfakturTriggerBulk", {
        detail: { invoiceNumbers: invoices, targetYear, targetStatus, targetPeriod },
      }),
    );
  });

  downloadBulkBtn.addEventListener("click", () => {
    if (!gate.canUseBulkDownload) {
      showProLockMessage("Bulk Unduh PDF adalah fitur Pro. Klik ikon CorePlus untuk mengaktifkan.");
      return;
    }

    const invoices = getSelectedInvoiceNumbers();
    const statusDiv = document.getElementById("bulk-status-msg")!;
    if (invoices.length === 0) {
      alert("Centang faktur pada tabel yang ingin diunduh terlebih dahulu!");
      return;
    }

    if (!confirm(`Unduh dokumen PDF asli untuk ${invoices.length} e-Faktur tercentang?`)) return;

    statusDiv.className = "loading";
    statusDiv.innerText = `Mengunduh PDF...`;

    document.dispatchEvent(
      new CustomEvent("EfakturTriggerDownloadBulk", { detail: { invoiceNumbers: invoices } }),
    );
  });
}

function showProLockMessage(msg: string): void {
  const statusDiv = document.getElementById("bulk-status-msg");
  if (!statusDiv) {
    alert(msg);
    return;
  }
  statusDiv.className = "pro-lock-msg";
  statusDiv.innerText = "🔒 " + msg;
  setTimeout(() => {
    statusDiv.innerText = "";
    statusDiv.className = "";
  }, 4000);
}

function triggerGridReload(): void {
  document.dispatchEvent(new CustomEvent("EfakturClearCacheSignature"));
  const nativeRefresh = document.querySelector<HTMLButtonElement>(
    'button[tooltip="Refresh"], button.p-column-filter-clear-button',
  );
  if (nativeRefresh) nativeRefresh.click();
}

document.addEventListener("EfakturBulkStatusUpdate", (e) => {
  const statusDiv = document.getElementById("bulk-status-msg");
  if (!statusDiv) return;

  const d = (e as CustomEvent).detail as { current: number; total: number; success: number; failed: number };
  statusDiv.innerText = `Proses: ${d.current}/${d.total} (${d.success} Sukses, ${d.failed} Gagal)`;

  if (d.current === d.total) {
    statusDiv.className = "success-done";
    statusDiv.innerText = `✔ Selesai memproses ${d.success} item.`;
    setTimeout(() => {
      statusDiv.innerText = "";
      statusDiv.className = "";
    }, 3000);
  }
});

// --- Boot ---

initFromStorage();
