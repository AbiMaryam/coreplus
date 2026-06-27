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
https://abimaryam.github.io/coreplus/privacy.html
```

✅ Live and verified (HTTP 200). This URL goes in the CWS dashboard "Privacy Policy" field.

## 9. Screenshots (1280×800)

All 6 screenshots are in the `screenshot/` folder, sized 1280×800 (CWS compatible). Upload all 6 to the CWS dashboard:

| # | File | Description |
|---|---|---|
| 1 | `screenshot/MP Filter.png` | Multi-period picker — toolkit UI with period checkbox grid expanded |
| 2 | `screenshot/FP Filter.png` | FP number filter — invoice list pasted, grid filtered to matching invoices |
| 3 | `screenshot/Bulk Credit Period Changer.png` | Bulk credit — controls + "Ubah Masa Kredit" button + progress message |
| 4 | `screenshot/Bulk Download.png` | Bulk PDF download — navy download button + progress + files in download bar |
| 5 | `screenshot/Free Plan.png` | Popup — Free tier with toggle ON, code entry, QRIS plan cards |
| 6 | `screenshot/Pro Plan.png` | Popup — Pro active showing plan, start date, expiry, days remaining |

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
- **Website**: https://github.com/AbiMaryam
- **Support email**: eastaxconsulting@gmail.com
- **Privacy policy URL**: https://abimaryam.github.io/coreplus/privacy.html

Fill these in the CWS dashboard when submitting.
