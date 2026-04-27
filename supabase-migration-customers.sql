-- Migration: add customers table + customer_id to sales
-- Run this in the Supabase SQL Editor (Dashboard > SQL Editor)

-- 1. Create customers table (phone is UNIQUE) — skips if already exists
create table if not exists customers (
  id          uuid primary key default uuid_generate_v4(),
  name        text not null,
  phone       text unique,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);



-- Add UNIQUE constraint on phone if it doesn't exist yet
do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conrelid = 'customers'::regclass and contype = 'u'
      and conname = 'customers_phone_key'
  ) then
    alter table customers add constraint customers_phone_key unique (phone);
  end if;
end;
$$;

-- set_updated_at function (safe to replace)
create or replace function set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- Trigger — drop first to avoid conflict
drop trigger if exists trg_customers_updated_at on customers;
create trigger trg_customers_updated_at
  before update on customers
  for each row execute function set_updated_at();

-- RLS (safe to re-enable)
alter table customers enable row level security;

-- Allow anon key (used by the app) and authenticated users
do $$
begin
  if not exists (
    select 1 from pg_policies
    where tablename = 'customers' and policyname = 'allow_all_anon'
  ) then
    execute 'create policy "allow_all_anon" on customers
      for all to anon using (true) with check (true)';
  end if;
end;
$$;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where tablename = 'customers' and policyname = 'allow_all_authenticated'
  ) then
    execute 'create policy "allow_all_authenticated" on customers
      for all to authenticated using (true) with check (true)';
  end if;
end;
$$;

-- 2. Add customer_id to sales (links each sale to a customer)
alter table sales
  add column if not exists customer_id uuid references customers (id) on delete set null;

create index if not exists idx_sales_customer on sales (customer_id);
