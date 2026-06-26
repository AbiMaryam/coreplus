-- CorePlus — add extends_code column for renewal/extension flow
-- Run this in the Supabase SQL Editor after 0001_init.sql.

alter table public.licenses
  add column if not exists extends_code text;

create index if not exists idx_licenses_extends_code
  on public.licenses (extends_code) where extends_code is not null;

comment on column public.licenses.extends_code is
  'If set, this pending payment extends an existing license identified by this code. On settlement, the existing code is reused and its expiry extended.';
