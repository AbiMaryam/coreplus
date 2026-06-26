-- CorePlus — initial schema
-- Run this in the Supabase SQL Editor (or via `supabase db push`).

-- =============================================================================
-- 1. EXTENSIONS
-- =============================================================================
create extension if not exists "pgcrypto";   -- gen_random_uuid()
create extension if not exists "pg_cron";     -- scheduled expiry job

-- =============================================================================
-- 2. LICENSES TABLE
-- =============================================================================
create table if not exists public.licenses (
  id            uuid        primary key default gen_random_uuid(),
  code          text        unique,                         -- CP-XXXXX-XXXXX-XXXXX; NULL until paid
  plan          text        not null,                       -- 'monthly' | 'annual'
  status        text        not null default 'pending',     -- 'pending' | 'active' | 'expired'
  starts_at     timestamptz,
  expires_at    timestamptz,

  -- AutoGoPay linkage (populated at QRIS generation time)
  autogopay_transaction_id text,
  autogopay_order_id       text,
  amount_idr               integer,

  -- Audit / recovery
  raw_payload   jsonb,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create index if not exists idx_licenses_code     on public.licenses (code) where code is not null;
create index if not exists idx_licenses_status   on public.licenses (status);
create index if not exists idx_licenses_autogopay_tx on public.licenses (autogopay_transaction_id);
create index if not exists idx_licenses_expires  on public.licenses (expires_at) where status = 'active';

-- Auto-update updated_at
create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_licenses_touch on public.licenses;
create trigger trg_licenses_touch
  before update on public.licenses
  for each row execute function public.touch_updated_at();

-- =============================================================================
-- 3. ROW LEVEL SECURITY
-- The extension only talks to Edge Functions (service_role). No direct client
-- access to this table is needed, so we enable RLS with NO policies → all
-- anon/authenticated access is denied. Only service_role can read/write.
-- =============================================================================
alter table public.licenses enable row level security;

-- (No policies = locked down. Edge Functions use service_role which bypasses RLS.)

-- =============================================================================
-- 4. HELPER: generate a human-readable license code
-- Format: CP-XXXXX-XXXXX-XXXXX  (uppercase alphanumeric, no ambiguous chars)
-- =============================================================================
create or replace function public.generate_license_code()
returns text language plpgsql as $$
declare
  chars text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';  -- no O, 0, I, 1, L
  seg1  text := '';
  seg2  text := '';
  seg3  text := '';
  i     int;
  candidate text;
begin
  loop
    seg1 := ''; seg2 := ''; seg3 := '';
    for i in 1..5 loop
      seg1 := seg1 || substr(chars, floor(random() * length(chars))::int + 1, 1);
    end loop;
    for i in 1..5 loop
      seg2 := seg2 || substr(chars, floor(random() * length(chars))::int + 1, 1);
    end loop;
    for i in 1..5 loop
      seg3 := seg3 || substr(chars, floor(random() * length(chars))::int + 1, 1);
    end loop;
    candidate := 'CP-' || seg1 || '-' || seg2 || '-' || seg3;
    -- ensure uniqueness
    exit when not exists (select 1 from public.licenses where code = candidate);
  end loop;
  return candidate;
end;
$$;

-- =============================================================================
-- 5. PG_CRON — hourly job to expire licenses past their expiry date
-- Nulls the code so it can no longer be used for login. Row stays for audit.
-- =============================================================================
create or replace function public.expire_old_licenses()
returns void language plpgsql as $$
begin
  update public.licenses
    set status = 'expired',
        code   = null
    where status = 'active'
      and expires_at is not null
      and expires_at < now();
end;
$$;

-- Schedule hourly (uncomment the SELECT if pg_cron is enabled on your project)
-- select cron.schedule(
--   'coreplus-expire-licenses',
--   '0 * * * *',
--   $$ select public.expire_old_licenses(); $$
-- );

-- =============================================================================
-- 6. UPDATED_AT auto-refresh for the cron-scheduled function
-- =============================================================================
comment on table  public.licenses is 'CorePlus license codes — one row per payment. Code is NULL until paid, NULLed again on expiry.';
comment on column public.licenses.code is 'Human-readable license code (CP-XXXXX-XXXXX-XXXXX). NULL while pending or after expiry.';
comment on column public.licenses.autogopay_transaction_id is 'AutoGoPay transaction UUID — used for recovery if the user loses their code.';
