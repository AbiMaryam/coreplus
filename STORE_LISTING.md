# CorePlus — Chrome Web Store Listing

Everything you need to fill in the CWS Developer Dashboard submission form.

---

## 1. Extension Name

```
CorePlus
```

## 2. Short Description (≤132 characters)

```
Multi-period filtering, bulk credit changes, and batch PDF downloads for the Coretax portal.
```

(91 characters — fits the 132 char limit)

## 3. Detailed Description

```
CorePlus is a productivity toolkit for tax professionals who use the Coretax portal (coretaxdjp.pajak.go.id). It extends the portal's built-in capabilities with multi-period filtering and bulk operations, saving hours of repetitive work.

FEATURES

• Multi-Period Filter — Select more than the default 2 tax periods at once. Free tier allows up to 4 periods; Pro unlocks all 12 months.

• FP Number Filter — Paste a list of Faktur Pajak numbers to filter the invoice grid instantly. Works alongside multi-period filtering.

• Bulk Credit/Uncredit — Change the credit status (Dikreditkan / Belum Dikreditkan) and target tax period for hundreds of selected invoices in one operation. Runs in parallel with clear progress reporting.

• Bulk PDF Download — Download original PDF documents for selected e-Faktur in batch. Files are saved individually with invoice numbers as filenames.

• Master Toggle — Turn CorePlus on or off instantly from the popup. When off, the Coretax portal works exactly as it does without the extension.

FREEMIUM MODEL

• Free: FP filter + multi-period (up to 4 periods)
• Pro (Rp 20.000/bulan or Rp 100.000/tahun): Unlimited periods + bulk credit + bulk PDF download

Pro subscription is activated via QRIS payment (GoPay, OVO, Dana, ShopeePay, or any QRIS-enabled app). You receive a unique license code after payment — no account or email required.

PRIVACY

CorePlus processes all invoice data entirely within your browser. No Coretax data is sent to our servers. We only store your license code and payment metadata. See the privacy policy for full details.

DISCLAIMER

CorePlus is not affiliated with, endorsed by, or officially connected to the Direktorat Jenderal Pajak (DJP). "Coretax" and "e-Faktur" are trademarks of their respective owners. CorePlus is an independent tool that enhances the existing portal interface.
```

## 4. Category

```
Productivity
```

## 5. Language

```
Indonesian (id) + English (en)
```

(If only one is available, set Indonesian as primary since the target users are Indonesian tax professionals.)

## 6. Single Purpose Statement

```
CorePlus extends the Coretax e-Faktur portal with multi-period filtering and batch operations (bulk credit status changes and bulk PDF downloads) to help tax professionals process large volumes of invoices more efficiently.
```

## 7. Permission Justifications

### storage
```
Used to remember the user's master toggle preference (on/off), cached license verification status, and pending QRIS transaction ID during payment. This allows the extension to function offline (with a 7-day grace window) and resume polling if the popup is closed during payment.
```

### alarms
```
Used to schedule periodic license verification checks (hourly) so the extension can detect when a Pro subscription has expired or been renewed without requiring the user to manually refresh.
```

### host_permissions: *://coretaxdjp.pajak.go.id/*
```
Required to inject the toolkit UI (multi-period picker, FP filter, bulk action controls) into the Coretax portal and to proxy the portal's own API requests for multi-period filtering and bulk operations. All data processed stays within the user's browser session on the Coretax domain.
```

### host_permissions: https://*.supabase.co/*
```
Required to call Supabase Edge Functions for license verification (checking if a Pro code is valid) and QRIS payment processing (creating payments, polling payment status). Only license codes and payment metadata are transmitted — no Coretax invoice data ever leaves the browser.
```

## 8. Privacy Policy URL

```
https://YOUR-GITHUB-USERNAME.github.io/coreplus/privacy.html
```

### How to host this on GitHub Pages (free, ~5 minutes)

1. **Create a GitHub account** at https://github.com (if you don't have one)
2. **Create a new repository** named `coreplus` (or any name you prefer)
3. **Push the extension code** to the repo:
   ```bash
   git init
   git add .
   git commit -m "CorePlus v3.0"
   git branch -M main
   git remote add origin https://github.com/YOUR-USERNAME/coreplus.git
   git push -u origin main
   ```
4. **Enable GitHub Pages**:
   - Go to the repo on GitHub → **Settings** → **Pages** (left sidebar)
   - Under **Build and deployment** → **Source**: select **Deploy from a branch**
   - Under **Branch**: select `main` and `/docs` folder
   - Click **Save**
5. **Wait ~1 minute** for GitHub to build the page
6. **Your privacy policy URL** is now live at:
   ```
   https://YOUR-USERNAME.github.io/coreplus/privacy.html
   ```
7. **Test it** — open the URL in your browser. You should see a styled navy/gold page with the full privacy policy.
8. **Paste the URL** into the CWS dashboard "Privacy Policy" field and replace `YOUR-GITHUB-USERNAME` in `STORE_LISTING.md` above with your actual username.

> **Note:** The styled HTML is already at `docs/privacy.html` in this repo — no need to create it. GitHub Pages serves it automatically from the `/docs` folder.

## 9. Screenshots (1280×800 or 640×400)

Prepare 3–5 screenshots. Recommended:

1. **Multi-period picker open** — Show the toolkit UI injected into the Coretax action bar with the period checkbox grid expanded. Highlight the ability to select more than 2 periods.

2. **FP filter in action** — Show the FP filter panel with a list of invoice numbers pasted, and the grid filtered to show only matching invoices.

3. **Bulk credit operation** — Show the bulk action controls (year, status, period selects + "Ubah Masa Kredit" button) with the progress message "Proses: 45/120 (40 Sukses, 5 Gagal)".

4. **Bulk PDF download** — Show the bulk download button (navy square with down-arrow icon) and a progress message like "Mengunduh PDF..." or "Proses: 30/80 (28 Sukses, 2 Gagal)" with downloaded PDF files visible in the browser's download bar.

5. **Popup — Free tier** — Show the CorePlus popup with the toggle ON, "CorePlus Free" card, code entry field, and the two QRIS plan cards (Bulanan Rp 20.000 / Tahunan Rp 100.000).

6. **Popup — Pro active** — Show the popup with "CorePlus Pro Aktif" card displaying plan, start date, expiry date, and days remaining.

**Tips:**
- Take screenshots on a 1280×800 display (or resize the browser window)
- Use a real Coretax page (with test/sample data, not real taxpayer data)
- Blur or redact any real NPWP or taxpayer names in screenshots
- Ensure the amber toolkit buttons are clearly visible against the Coretax UI

## 10. Promotional Images (optional but recommended)

### Small promo tile (440×280)
A promotional image shown on the CWS listing page. Should feature:
- The CorePlus icon
- The name "CorePlus"
- A tagline like "Toolkit untuk Coretax"
- Navy background with gold accents (matching the extension's design)

A placeholder is generated at `src/assets/promo-440x280.png`.

### Marquee promo tile (920×680, optional)
Not required for initial submission. Can be added later for featured placement.

## 11. Graphics Assets

| Asset | Size | File | Status |
|---|---|---|---|
| Extension icon | 16×16 | `src/assets/icon-16.png` | ✅ |
| Extension icon | 32×32 | `src/assets/icon-32.png` | ✅ |
| Extension icon | 48×48 | `src/assets/icon-48.png` | ✅ |
| Extension icon | 128×128 | `src/assets/icon-128.png` | ✅ |
| Promo tile | 440×280 | `src/assets/promo-440x280.png` | ✅ placeholder |

## 12. Submission Notes (for the CWS review team)

```
CorePlus is a productivity extension for Indonesian tax professionals using the Coretax portal. Here are key points for the review:

1. SINGLE PURPOSE: The extension exclusively enhances the Coretax e-Faktur portal with multi-period filtering and batch operations. It does not modify any other website.

2. USER-INITIATED ACTIONS: All bulk operations (credit changes, PDF downloads) are explicitly triggered by the user clicking a button after selecting invoices. No operations run automatically on page load.

3. RATE LIMITING: Bulk operations use controlled concurrency (5 parallel requests for credit changes, 3 for PDF downloads) to avoid overloading the portal. These are user-initiated batch operations, not automated scraping.

4. NO CIRCUMVENTION: The extension does not bypass authentication, paywalls, or security controls. It extends the portal's existing filter capabilities by making parallel requests with the user's own session credentials.

5. PAYMENT: Pro features are unlocked via QRIS payment through AutoGoPay (a legitimate Indonesian payment gateway). No payment card data is processed by the extension. The payment page is hosted by AutoGoPay.

6. DATA PRIVACY: No Coretax invoice data leaves the user's browser. The extension only communicates with Supabase (for license verification) and AutoGoPay (via Supabase Edge Functions, never directly). See the privacy policy for full details.

7. NOT AFFILIATED WITH DJP: CorePlus is an independent tool. It is not affiliated with, endorsed by, or officially connected to the Direktorat Jenderal Pajak.
```

## 13. Developer Information

- **Developer name**: [Your name or company]
- **Website**: [Your website or GitHub profile]
- **Support email**: [Your support email]
- **Privacy policy URL**: [GitHub Pages URL after hosting]

Fill these in the CWS dashboard when submitting.
