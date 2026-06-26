# CorePlus — Supabase Setup Guide

This guide walks you through creating the Supabase project, running the
migration, deploying the Edge Function, and connecting the extension.

## 1. Create a Supabase project

1. Go to **https://supabase.com** → Sign up / log in
2. Click **New Project**
3. Fill in:
   - **Name**: `coreplus`
   - **Database Password**: generate a strong password and save it
   - **Region**: Southeast Asia (Singapore) — closest to Indonesia
   - **Plan**: Free tier is fine for testing
4. Wait ~2 min for provisioning to finish

## 2. Run the database migration

1. In the Supabase dashboard, open **SQL Editor** (left sidebar)
2. Click **New query**
3. Paste the contents of `supabase/migrations/0001_init.sql`
4. Click **Run**
5. Verify: you should see `licenses` table in the Table Editor

## 3. Enable pg_cron (for automatic license expiry)

1. In Supabase dashboard → **Database** → **Extensions**
2. Search for `pg_cron` and enable it
3. Go back to **SQL Editor** and run:
   ```sql
   SELECT cron.schedule(
     'coreplus-expire-licenses',
     '0 * * * *',
     $$ select public.expire_old_licenses(); $$
   );
   ```
4. Verify: `SELECT cron.job_run_details LIMIT 1;` (may be empty until first run)

## 4. Deploy the license-check Edge Function

### Option A: via Supabase CLI (recommended)

```bash
# Install Supabase CLI (if not already)
npm install -g supabase

# Log in and link the project
supabase login
supabase link --project-ref YOUR_PROJECT_REF

# Deploy
supabase functions deploy license-check --no-verify-jwt
```

> **Note:** You do NOT need to set `SUPABASE_URL` or `SUPABASE_SERVICE_ROLE_KEY`
> as secrets — Supabase auto-injects these into every Edge Function at runtime.
> The CLI will reject any secret name starting with `SUPABASE_` (reserved).
> Only set non-Supabase secrets (e.g. `AUTOGOPAY_API_KEY` in Phase 3).

### Option B: via dashboard

1. Go to **Edge Functions** → **New function**
2. Name: `license-check`
3. Paste the code from `supabase/functions/license-check/index.ts`
4. No secrets to set — `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are
   auto-injected by the platform.

## 5. Get your project URL and anon key

1. Go to **Settings** → **API**
2. Copy:
   - **Project URL**: `https://xxxxx.supabase.co`
   - **anon public key**: `eyJhbGc...`

## 6. Configure the extension

1. Edit `.env` in the project root:
   ```
   VITE_SUPABASE_URL=https://xxxxx.supabase.co
   VITE_SUPABASE_ANON_KEY=eyJhbGc...
   ```
2. Rebuild:
   ```bash
   npm run build
   ```
3. Load `dist/` as an unpacked extension in Chrome

## 7. Test license-check

The extension popup should now show the "Masukkan Kode Pro" form. Since no
payments have been made yet, entering any code will return "Kode tidak
ditemukan" — this is correct.

To manually test with a Pro license, insert a row in Supabase:

```sql
INSERT INTO public.licenses (code, plan, status, starts_at, expires_at)
VALUES (
  'CP-TEST1-ABCDE-FGHIJ',
  'annual',
  'active',
  now(),
  now() + interval '365 days'
);
```

Then enter `CP-TEST1-ABCDE-FGHIJ` in the popup → it should show "CorePlus Pro Aktif".

## 8. Deploy AutoGoPay billing functions (Phase 3)

### 8a. Run the extends_code migration

In **SQL Editor**, run `supabase/migrations/0002_add_extends_code.sql`.

### 8b. Set the AutoGoPay API key

```bash
supabase secrets set AUTOGOPAY_API_KEY=your_autogopay_api_key_here
```

Get your API key from the AutoGoPay dashboard at https://autogopay.site.

### 8c. Deploy the three billing Edge Functions

```bash
supabase functions deploy autogopay-create-qris --no-verify-jwt
supabase functions deploy autogopay-status --no-verify-jwt
supabase functions deploy autogopay-webhook --no-verify-jwt
```

### 8d. Register the webhook URL in AutoGoPay

In the AutoGoPay dashboard, set the webhook callback URL to:

```
https://YOUR_PROJECT_REF.functions.supabase.co/autogopay-webhook
```

This receives real-time notifications when QRIS payments are settled.

### 8e. Test a real payment

1. Reload the extension in Chrome
2. Open the popup → click "Bulanan — Rp 20.000" or "Tahunan — Rp 100.000"
3. A new tab opens with the QRIS code → scan with GoPay/OVO/Dana/ShopeePay
4. The popup polls every 5 seconds → on payment, it shows your license code
5. The code is saved automatically and Pro features unlock

> **Note:** The `autogopay-status` function also activates the license on
> settlement (not just the webhook), so the popup gets instant feedback even
> if the webhook is delayed.

## Next steps

- **Phase 4**: Chrome Web Store readiness (assets, privacy policy, listing)
- **Phase 5**: Build, zip, submit

## Security notes

- The **anon key** is safe to bundle in the extension — it's protected by RLS
  (no policies = no direct table access from the client).
- The **service role key** must NEVER be in the extension — it lives only in
  Supabase Edge Function secrets (auto-injected, never set manually).
- The **AutoGoPay API key** lives only in Supabase Edge Function secrets
  (`supabase secrets set AUTOGOPAY_API_KEY=...`). The extension never sees it.
- **Never paste the service role key in chat, terminal output, or commit it.**
  If it leaks, rotate it immediately in Settings → API → Reset service role key.
