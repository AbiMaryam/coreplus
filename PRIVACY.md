# CorePlus Privacy Policy

Last updated: June 25, 2026

## Overview

CorePlus is a browser extension that extends the Coretax portal
(`coretaxdjp.pajak.go.id`) with multi-period filtering and bulk-crediting
features. This privacy policy explains what data we collect, how we use it,
and your rights.

## Data We Collect

### License codes

When you purchase a Pro subscription, we generate a unique license code
(e.g. `CP-XXXXX-XXXXX-XXXXX`) and store it in our Supabase database. This
code is linked to your payment transaction ID and subscription details
(plan, start date, expiry date).

### Payment metadata

When you pay via QRIS through AutoGoPay, we receive and store:
- AutoGoPay transaction ID and order ID
- Payment amount (IDR)
- Payment status (pending, settlement, expired)
- Plan type (monthly or annual)

We do **not** receive or store your full name, bank account details, QRIS
app credentials, or any financial account numbers. Payment processing is
handled entirely by AutoGoPay and your QRIS payment provider (GoPay, OVO,
Dana, ShopeePay, etc.).

### Data stored locally on your device

The following data is stored in your browser's `chrome.storage.local` and
never leaves your device except for license verification:

- **CorePlus enabled/disabled toggle state** (boolean)
- **License code** (the code you entered or received after payment)
- **Cached license verdict** (active/inactive status with expiry date)
- **Pending transaction ID** (only during an active payment flow, cleared after)

### Data processed in-browser on the Coretax portal

CorePlus intercepts and processes e-Faktur invoice data (invoice numbers,
period codes, credit statuses) **entirely within your browser** to provide
its filtering and bulk-operation features. This data is:

- Never sent to our servers
- Never transmitted to any third party
- Never stored outside your browser session
- Processed only to perform the features you explicitly request

## Data We Do NOT Collect

- No email addresses or passwords (no account system)
- No personal identification information
- No browsing history
- No Coretax login credentials (we capture auth headers only for same-origin
  API requests within the portal, never transmit them elsewhere)
- No financial account numbers or card details
- No tracking or analytics
- No advertising identifiers

## How We Use Your Data

- **License codes**: To verify your Pro subscription status and grant access
  to premium features
- **Payment metadata**: To link QRIS payments to license codes and manage
  subscription expiry
- **Local storage**: To remember your toggle preference and license status
  between browser sessions (with a 7-day offline grace window)

## Data Sharing

We do not sell, rent, or share your data with any third party. Data is
processed only through:

- **Supabase** (database hosting, Edge Functions) — license and payment
  metadata storage
- **AutoGoPay** (payment gateway) — QRIS transaction processing

Both services are bound by their own privacy and security policies.

## Data Retention

- **Active licenses**: Retained for the duration of your subscription plus
  audit purposes
- **Expired licenses**: The license code is nullified (can no longer be used)
  but the row is retained for audit and recovery purposes
- **Local storage**: Cleared when you click "Hapus Kode" in the popup or
  uninstall the extension

## Your Rights

- **Access**: You can view your license status anytime in the CorePlus popup
- **Deletion**: Click "Hapus Kode dari Perangkat Ini" to remove your code
  from this device. Contact support to request server-side deletion.
- **Recovery**: If you lose your code, you can recover access using your
  AutoGoPay transaction ID (shown on your payment receipt)

## Children's Privacy

CorePlus is a professional tax tool intended for tax professionals and
finance teams in Indonesia. It is not directed at children under 18 and we
do not knowingly collect data from children.

## Security

- All communication with Supabase uses HTTPS/TLS
- The Supabase anon key bundled in the extension is protected by Row Level
  Security (RLS) — no direct table access is possible from the client
- The service role key and AutoGoPay API key are stored only in Supabase
  project secrets and never appear in the extension
- Webhook signatures are verified using HMAC-SHA256

## Changes to This Policy

We may update this privacy policy from time to time. Changes will be posted
on this page with an updated date.

## Contact

For privacy questions or data requests, please contact:
- GitHub: [your GitHub repo URL]
- Email: [your support email]

## Disclaimer

CorePlus is not affiliated with, endorsed by, or officially connected to
the Direktorat Jenderal Pajak (DJP) or any government agency. "Coretax" and
"e-Faktur" are trademarks of their respective owners. CorePlus is an
independent tool that enhances the existing Coretax portal interface.
