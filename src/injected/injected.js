// CorePlus — page-context proxy & bulk engines
// Phase 2: adds master-toggle passthrough via CorePlusSetEnabled event.
// Runs in the page's main world via a <script> tag injected from content/index.ts.

(function () {
  if (window.__efakturCoreToolkitLoaded) return;
  window.__efakturCoreToolkitLoaded = true;

  // Master toggle flag — when false, all proxy/bulk operations become passthrough.
  let __coreplusDisabled = false;
  document.addEventListener("CorePlusSetEnabled", (e) => {
    __coreplusDisabled = !e.detail.enabled;
    if (__coreplusDisabled) {
      console.log("[CorePlus] Master toggle OFF — proxy passthrough active.");
    } else {
      console.log("[CorePlus] Master toggle ON — proxy active.");
    }
  });

  const originalXHR = window.XMLHttpRequest;
  const XHR_open = originalXHR.prototype.open;
  const XHR_send = originalXHR.prototype.send;
  const XHR_setRequestHeader = originalXHR.prototype.setRequestHeader;

  window.__efakturCache = { signature: "", data: [], envelope: null };
  window.__authHeaders = {};
  window.__globalTaxpayerId = "";

  originalXHR.prototype.open = function (method, url) {
    this._method = method;
    this._url = url;
    return XHR_open.apply(this, arguments);
  };

  originalXHR.prototype.setRequestHeader = function (header, value) {
    if (!this._requestHeaders) this._requestHeaders = {};
    this._requestHeaders[header] = value;
    window.__authHeaders[header] = value;
    return XHR_setRequestHeader.apply(this, arguments);
  };

  originalXHR.prototype.send = async function (body) {
    // Master toggle OFF → passthrough to original XHR
    if (__coreplusDisabled) return XHR_send.apply(this, arguments);

    let customPeriods = [];
    let customFPs = [];
    try {
      customPeriods = JSON.parse(sessionStorage.getItem("efaktur_custom_periods") || "[]");
    } catch (e) {
      /* noop */
    }
    try {
      customFPs = JSON.parse(sessionStorage.getItem("efaktur_custom_fps") || "[]");
    } catch (e) {
      /* noop */
    }

    const url = this._url;
    const method = this._method;
    const isInvoiceListAPI = url && typeof url === "string" && url.includes("/api/inputinvoice/list");
    const activeModifications = customPeriods.length > 2 || customFPs.length > 0;

    if (isInvoiceListAPI) {
      if (!activeModifications) {
        this.addEventListener("readystatechange", function () {
          if (this.readyState === 4 && this.status === 200) {
            try {
              const rawRes = JSON.parse(this.responseText);
              if (rawRes && rawRes.IsSuccessful && rawRes.Payload && rawRes.Payload.Data) {
                console.log(
                  `💾 [CorePlus] Merekam pasif ${rawRes.Payload.Data.length} data faktur dari filter grid Coretax.`,
                );
                window.__efakturCache.data = rawRes.Payload.Data;
                window.__efakturCache.envelope = rawRes;
                window.__efakturCache.signature = "NATIVE_FILTER_ACTIVE";

                try {
                  const bodyObj = JSON.parse(body);
                  if (bodyObj && bodyObj.TaxpayerAggregateIdentifier) {
                    window.__globalTaxpayerId = bodyObj.TaxpayerAggregateIdentifier;
                  }
                } catch (e) {
                  /* noop */
                }
              }
            } catch (e) {
              /* noop */
            }
          }
        });
        return XHR_send.apply(this, arguments);
      }

      let originalPayload;
      try {
        originalPayload = JSON.parse(body);
      } catch (e) {
        return XHR_send.apply(this, arguments);
      }

      const filterIndex = originalPayload.Filters.findIndex(
        (f) => f.PropertyName === "TaxInvoicePeriod",
      );

      if (filterIndex !== -1) {
        if (originalPayload.TaxpayerAggregateIdentifier) {
          window.__globalTaxpayerId = originalPayload.TaxpayerAggregateIdentifier;
        }

        const requestedFirst = originalPayload.First || 0;
        const requestedRows = originalPayload.Rows || 50;

        const requestSignature = JSON.stringify({
          periods: customPeriods,
          fps: customFPs,
          filters: originalPayload.Filters.filter((f) => f.PropertyName !== "TaxInvoicePeriod"),
          sortField: originalPayload.SortField,
          sortOrder: originalPayload.SortOrder,
        });

        const serveSlicedResponse = (dataArray, totalCount, masterWrapper) => {
          if (customFPs.length > 0) {
            dataArray = dataArray.filter((item) => {
              const numStr = String(item.TaxInvoiceNumber || "").trim();
              return customFPs.some((fp) => numStr.includes(fp) || fp.includes(numStr));
            });
            totalCount = dataArray.length;
          }

          const slice = dataArray.slice(requestedFirst, requestedFirst + requestedRows);
          const mockedWrapper = JSON.parse(JSON.stringify(masterWrapper));
          mockedWrapper.Payload.Data = slice;
          mockedWrapper.Payload.TotalRecords = totalCount;

          const responseText = JSON.stringify(mockedWrapper);
          Object.defineProperty(this, "responseText", { get: () => responseText });
          Object.defineProperty(this, "response", { get: () => mockedWrapper });
          Object.defineProperty(this, "status", { get: () => 200 });
          Object.defineProperty(this, "readyState", { get: () => 4 });

          this.dispatchEvent(new Event("readystatechange"));
          this.dispatchEvent(new Event("load"));
          if (typeof this.onreadystatechange === "function") this.onreadystatechange.call(this);
          if (typeof this.onload === "function") this.onload.call(this);
        };

        if (window.__efakturCache.signature === requestSignature) {
          serveSlicedResponse(
            window.__efakturCache.data,
            window.__efakturCache.data.length,
            window.__efakturCache.envelope,
          );
          return;
        }

        const effectivePeriods =
          customPeriods.length >= 2 ? customPeriods : originalPayload.Filters[filterIndex].Value;
        const chunks = [];
        for (let i = 0; i < effectivePeriods.length; i += 2) {
          chunks.push(effectivePeriods.slice(i, i + 2));
        }

        try {
          console.log(`⚡ [CorePlus] Fetching compilation matrices chunks parallel networks...`);
          const fetchPromises = chunks.map((chunk) => {
            const clonedPayload = JSON.parse(JSON.stringify(originalPayload));
            clonedPayload.Filters[filterIndex].Value = chunk;
            clonedPayload.Rows = 3000;
            clonedPayload.First = 0;

            return window
              .fetch(url, {
                method,
                credentials: "same-origin",
                headers: Object.assign({ "Content-Type": "application/json" }, window.__authHeaders),
                body: JSON.stringify(clonedPayload),
              })
              .then((r) => r.json());
          });

          const responseChunks = await Promise.all(fetchPromises);
          let compiledData = [];
          const baseEnvelope = responseChunks[0];

          responseChunks.forEach((chunkRes) => {
            if (chunkRes && chunkRes.IsSuccessful && chunkRes.Payload && chunkRes.Payload.Data) {
              compiledData = compiledData.concat(chunkRes.Payload.Data);
            }
          });

          if (originalPayload.SortField) {
            const field = originalPayload.SortField;
            const order = originalPayload.SortOrder === 1 ? 1 : -1;
            compiledData.sort((a, b) => {
              const fA = a[field] || "";
              const fB = b[field] || "";
              return fA < fB ? -1 * order : fA > fB ? 1 * order : 0;
            });
          }

          window.__efakturCache = {
            signature: requestSignature,
            data: compiledData,
            envelope: baseEnvelope,
          };
          serveSlicedResponse(compiledData, compiledData.length, baseEnvelope);
          return;
        } catch (err) {
          console.error("⚡ [CorePlus] Internal stream mapping mismatch:", err);
        }
      }
    }
    return XHR_send.apply(this, arguments);
  };

  document.addEventListener("EfakturClearCacheSignature", () => {
    window.__efakturCache.signature = "";
  });

  // PIPELINE FEATURE A: HIGH-SPEED PARALLEL CREDIT ENGINE
  document.addEventListener("EfakturTriggerBulk", async (e) => {
    if (__coreplusDisabled) return;
    const { invoiceNumbers, targetYear, targetStatus, targetPeriod } = e.detail;
    const cleanedScrapedNumbers = invoiceNumbers.map((num) => String(num).trim());

    if (!window.__efakturCache.data || window.__efakturCache.data.length === 0) {
      alert(`CorePlus Error: Cache data kosong. Silakan klik ikon refresh.`);
      return;
    }

    const mappedInvoiceObjects = window.__efakturCache.data.filter((item) => {
      const cacheNum = String(item.TaxInvoiceNumber).trim();
      return cleanedScrapedNumbers.some(
        (scrapedNum) => cacheNum.includes(scrapedNum) || scrapedNum.includes(cacheNum),
      );
    });

    if (mappedInvoiceObjects.length === 0) {
      alert(`CorePlus Error: Gagal mencocokkan nomor faktur terpilih.`);
      return;
    }

    const totalJobs = mappedInvoiceObjects.length;
    let processedCount = 0;
    let successCount = 0;
    let failedCount = 0;
    window.__efakturCache.signature = "";

    const CONCURRENCY_LIMIT = 5;
    for (let i = 0; i < mappedInvoiceObjects.length; i += CONCURRENCY_LIMIT) {
      const chunk = mappedInvoiceObjects.slice(i, i + CONCURRENCY_LIMIT);
      const promises = chunk.map(async (invoice) => {
        const bulkPayload = {
          RecordId: invoice.RecordId,
          BuyerStatus: targetStatus,
          Year: targetYear,
          Period: targetPeriod,
          EinvoiceVATStatus: "VAT_VAT",
          TaxpayerAggregateIdentifier:
            invoice.BuyerTaxpayerAggregateIdentifier || window.__globalTaxpayerId,
        };

        try {
          const res = await window
            .fetch("https://coretaxdjp.pajak.go.id/einvoiceportal/api/inputinvoice/credit-uncredit", {
              method: "POST",
              credentials: "same-origin",
              headers: Object.assign({ "Content-Type": "application/json" }, window.__authHeaders),
              body: JSON.stringify(bulkPayload),
            })
            .then((r) => r.json());

          if (res && res.IsSuccessful) successCount++;
          else failedCount++;
        } catch (err) {
          failedCount++;
        }

        processedCount++;
        document.dispatchEvent(
          new CustomEvent("EfakturBulkStatusUpdate", {
            detail: {
              current: processedCount,
              total: totalJobs,
              success: successCount,
              failed: failedCount,
            },
          }),
        );
      });
      await Promise.all(promises);
    }
  });

  // PIPELINE FEATURE B: HIGH-SPEED PARALLEL DOWNLOAD PDF ENGINE
  document.addEventListener("EfakturTriggerDownloadBulk", async (e) => {
    if (__coreplusDisabled) return;
    const { invoiceNumbers } = e.detail;
    const cleanedScrapedNumbers = invoiceNumbers.map((num) => String(num).trim());

    const mappedInvoiceObjects = window.__efakturCache.data.filter((item) => {
      const cacheNum = String(item.TaxInvoiceNumber).trim();
      return cleanedScrapedNumbers.some(
        (scrapedNum) => cacheNum.includes(scrapedNum) || scrapedNum.includes(cacheNum),
      );
    });

    if (mappedInvoiceObjects.length === 0) {
      alert(`CorePlus Error: Gagal memetakan metadata cetak dokumen dari memori cache.`);
      return;
    }

    const totalJobs = mappedInvoiceObjects.length;
    let processedCount = 0;
    let successCount = 0;
    let failedCount = 0;

    // Batas download simultan 3 dokumen bersamaan agar browser tidak membeku memproses string PDF besar
    const CONCURRENCY_LIMIT = 3;

    for (let i = 0; i < mappedInvoiceObjects.length; i += CONCURRENCY_LIMIT) {
      const chunk = mappedInvoiceObjects.slice(i, i + CONCURRENCY_LIMIT);
      const promises = chunk.map(async (invoice) => {
        // Konversi tanggal Coretax (menghilangkan offset +07:00 jika ada untuk menyamakan payload aslinya)
        let cleanDate = "2026-06-18T00:00:00";
        if (invoice.LastUpdatedDate) cleanDate = invoice.LastUpdatedDate.split("+")[0];
        else if (invoice.CreationDate) cleanDate = invoice.CreationDate.split("+")[0];

        const downloadPayload = {
          EInvoiceRecordIdentifier: invoice.RecordId,
          EInvoiceAggregateIdentifier: invoice.AggregateIdentifier,
          DocumentAggregateIdentifier: invoice.DocumentFormAggregateIdentifier,
          TaxpayerAggregateIdentifier:
            invoice.BuyerTaxpayerAggregateIdentifier || window.__globalTaxpayerId,
          LetterNumber: invoice.TaxInvoiceNumber,
          DocumentDate: cleanDate,
          EInvoiceMenuType: "Input",
          TaxInvoiceStatus: invoice.PeriodCredit
            ? "CREDITED"
            : invoice.InputInvoiceStatus || invoice.TaxInvoiceStatus || "APPROVED",
        };

        try {
          const res = await window
            .fetch(
              "https://coretaxdjp.pajak.go.id/einvoiceportal/api/DownloadInvoice/download-invoice-document",
              {
                method: "POST",
                credentials: "same-origin",
                headers: Object.assign({ "Content-Type": "application/json" }, window.__authHeaders),
                body: JSON.stringify(downloadPayload),
              },
            )
            .then((r) => r.json());

          // Jika API sukses mengembalikan Content Base64, lakukan pembongkaran blob file secara langsung
          if (res && res.IsSuccessful && res.Content) {
            const base64Content = res.Content;
            const fileName = res.FileName || `Faktur_${invoice.TaxInvoiceNumber}.pdf`;

            // Eksekusi trigger native link anchor download browser
            const linkSource = `data:application/pdf;base64,${base64Content}`;
            const downloadLink = document.createElement("a");
            downloadLink.href = linkSource;
            downloadLink.download = fileName;
            downloadLink.click();

            successCount++;
          } else {
            failedCount++;
          }
        } catch (err) {
          failedCount++;
        }

        processedCount++;
        document.dispatchEvent(
          new CustomEvent("EfakturBulkStatusUpdate", {
            detail: {
              current: processedCount,
              total: totalJobs,
              success: successCount,
              failed: failedCount,
            },
          }),
        );
      });

      await Promise.all(promises);
      // Jeda 400ms antar kelompok download agar antrean file download di browser terproses sempurna
      await new Promise((resolve) => setTimeout(resolve, 400));
    }
  });
})();
