# CorePlus

**Toolkit untuk Coretax** — Extends the Coretax e-Faktur portal with multi-period filtering and bulk-crediting features.

[![Chrome Web Store](https://img.shields.io/badge/Chrome%20Web%20Store-Pending%20Review-blue)](https://chrome.google.com/webstore)

## Features

- **Multi-Period Filter** — Select more than the default 2 tax periods at once (free: up to 4, Pro: all 12)
- **FP Number Filter** — Paste a list of Faktur Pajak numbers to filter the invoice grid
- **Bulk Credit/Uncredit** — Change credit status and target period for hundreds of invoices in one operation
- **Bulk PDF Download** — Download original PDF documents for selected e-Faktur in batch
- **Master Toggle** — Turn CorePlus on or off instantly from the popup

## Installation

### From Chrome Web Store
*(Available once approved)*

### From source (development)

```bash
npm install
npm run build
```

Then in Chrome:
1. Go to `chrome://extensions`
2. Enable **Developer mode** (top right)
3. Click **Load unpacked**
4. Select the `dist/` folder

## Pricing

| Plan | Price | Duration |
|---|---|---|
| Free | Rp 0 | Forever |
| Bulanan | Rp 20.000 | 30 days |
| Tahunan | Rp 100.000 | 365 days (Hemat 58%) |

Pro subscription is activated via **QRIS** payment (GoPay, OVO, Dana, ShopeePay, or any QRIS-enabled app). You receive a unique license code after payment — no account or email required.

## Tech Stack

- **Frontend**: TypeScript, Vite, @crxjs/vite-plugin
- **Backend**: Supabase (PostgreSQL, Edge Functions, pg_cron)
- **Payments**: AutoGoPay (QRIS gateway)

## Project Structure

```
coreplus/
├── src/                    # Extension source
│   ├── manifest.json       # MV3 manifest
│   ├── content/            # Content script (Coretax UI injection + gating)
│   ├── injected/           # Page-world proxy (XHR/fetch + bulk engines)
│   ├── popup/              # Extension popup (toggle + license + billing)
│   ├── background/         # Service worker (alarms + message router)
│   ├── lib/                # Shared libs (supabase, autogopay, storage, plans)
│   └── assets/             # Icons + promo images
├── supabase/               # Backend
│   ├── migrations/         # SQL migrations
│   └── functions/          # Edge Functions (Deno)
├── scripts/                # Build scripts (icon generation)
├── docs/                   # GitHub Pages content (privacy policy HTML)
├── PRIVACY.md              # Privacy policy (Markdown source)
├── STORE_LISTING.md        # Chrome Web Store submission assets
└── supabase/SETUP.md       # Supabase deployment guide
```

## Development

```bash
npm run dev       # Vite dev server with HMR
npm run build     # Production build → dist/
npm run typecheck # TypeScript check
npm run zip       # Zip dist/ for CWS upload
```

## Privacy

CorePlus processes all invoice data entirely within your browser. No Coretax data is sent to our servers. See [PRIVACY.md](./PRIVACY.md) for full details.

## Disclaimer

CorePlus is not affiliated with, endorsed by, or officially connected to the Direktorat Jenderal Pajak (DJP). "Coretax" and "e-Faktur" are trademarks of their respective owners. CorePlus is an independent tool that enhances the existing portal interface.

## License

All rights reserved.
