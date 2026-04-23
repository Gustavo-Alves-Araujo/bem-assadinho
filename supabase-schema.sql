-- ============================================================
-- PDV Bem Assadinho — Supabase / PostgreSQL Schema
-- Run this in the Supabase SQL Editor (Dashboard > SQL Editor)
-- ============================================================

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- ============================================================
-- CATEGORIES
-- ============================================================
create table if not exists categories (
  id          uuid primary key default uuid_generate_v4(),
  name        text not null,
  color       text not null default '#f97316',
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- ============================================================
-- PRODUCTS
-- ============================================================
create table if not exists products (
  id           uuid primary key default uuid_generate_v4(),
  name         text not null,
  description  text,
  barcode      text unique,
  price        numeric(12, 2) not null default 0,
  cost         numeric(12, 2) not null default 0,
  stock        integer not null default 0,
  min_stock    integer not null default 5,
  unit         text not null default 'un',
  image_url    text,
  active       boolean not null default true,
  category_id  uuid references categories (id) on delete set null,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create index if not exists idx_products_category on products (category_id);
create index if not exists idx_products_active   on products (active);

-- ============================================================
-- STOCK MOVEMENTS
-- ============================================================
create table if not exists stock_movements (
  id          uuid primary key default uuid_generate_v4(),
  product_id  uuid not null references products (id) on delete cascade,
  type        text not null check (type in ('in', 'out', 'adjustment')),
  quantity    integer not null,
  reason      text,
  created_at  timestamptz not null default now()
);

create index if not exists idx_stock_movements_product on stock_movements (product_id);

-- ============================================================
-- CUSTOMERS
-- ============================================================
create table if not exists customers (
  id          uuid primary key default uuid_generate_v4(),
  name        text not null,
  phone       text unique,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create trigger trg_customers_updated_at
  before update on customers
  for each row execute function set_updated_at();

-- ============================================================
-- SALES
-- ============================================================
create table if not exists sales (
  id              uuid primary key default uuid_generate_v4(),
  total           numeric(12, 2) not null,
  subtotal        numeric(12, 2) not null,
  discount        numeric(12, 2) not null default 0,
  payment_method  text not null check (payment_method in ('cash', 'credit', 'debit', 'pix')),
  status          text not null default 'completed' check (status in ('completed', 'cancelled', 'pending')),
  customer_id     uuid references customers (id) on delete set null,
  customer_name   text,
  transaction_id  text,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create index if not exists idx_sales_status     on sales (status);
create index if not exists idx_sales_created_at on sales (created_at desc);
create index if not exists idx_sales_customer   on sales (customer_id);

-- ============================================================
-- SALE ITEMS
-- ============================================================
create table if not exists sale_items (
  id          uuid primary key default uuid_generate_v4(),
  sale_id     uuid not null references sales (id) on delete cascade,
  product_id  uuid not null references products (id),
  quantity    integer not null,
  price       numeric(12, 2) not null,
  total       numeric(12, 2) not null
);

create index if not exists idx_sale_items_sale    on sale_items (sale_id);
create index if not exists idx_sale_items_product on sale_items (product_id);

-- ============================================================
-- RECIPES
-- ============================================================
create table if not exists recipes (
  id            uuid primary key default uuid_generate_v4(),
  name          text not null,
  description   text,
  yield         numeric(12, 3) not null default 1,
  yield_unit    text not null default 'un',
  selling_price numeric(12, 2) not null default 0,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

-- ============================================================
-- RECIPE VERSIONS
-- ============================================================
create table if not exists recipe_versions (
  id           uuid primary key default uuid_generate_v4(),
  recipe_id    uuid not null references recipes (id) on delete cascade,
  version      integer not null,
  notes        text,
  total_cost   numeric(12, 4) not null default 0,
  cost_per_unit numeric(12, 4) not null default 0,
  created_at   timestamptz not null default now(),
  unique (recipe_id, version)
);

create index if not exists idx_recipe_versions_recipe on recipe_versions (recipe_id);

-- ============================================================
-- RECIPE INGREDIENTS
-- ============================================================
create table if not exists recipe_ingredients (
  id                uuid primary key default uuid_generate_v4(),
  recipe_version_id uuid not null references recipe_versions (id) on delete cascade,
  name              text not null,
  quantity          numeric(12, 4) not null,
  unit              text not null,
  price_per_unit    numeric(12, 4) not null,
  total_price       numeric(12, 4) not null
);

create index if not exists idx_recipe_ingredients_version on recipe_ingredients (recipe_version_id);

-- ============================================================
-- UPDATED_AT TRIGGER (auto-update timestamps)
-- ============================================================
create or replace function set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger trg_categories_updated_at
  before update on categories
  for each row execute function set_updated_at();

create trigger trg_products_updated_at
  before update on products
  for each row execute function set_updated_at();

create trigger trg_sales_updated_at
  before update on sales
  for each row execute function set_updated_at();

create trigger trg_recipes_updated_at
  before update on recipes
  for each row execute function set_updated_at();

-- ============================================================
-- ROW LEVEL SECURITY (RLS) — enable and lock down by default
-- Adjust policies according to your auth strategy.
-- ============================================================
alter table customers          enable row level security;
alter table categories        enable row level security;
alter table products          enable row level security;
alter table stock_movements   enable row level security;
alter table sales             enable row level security;
alter table sale_items        enable row level security;
alter table recipes           enable row level security;
alter table recipe_versions   enable row level security;
alter table recipe_ingredients enable row level security;

-- Example: allow all access for authenticated users (service-role key bypasses RLS)
-- Remove / tighten these policies before going to production with anon access.
create policy "allow_all_authenticated" on customers          for all to authenticated using (true) with check (true);
create policy "allow_all_authenticated" on categories        for all to authenticated using (true) with check (true);
create policy "allow_all_authenticated" on products          for all to authenticated using (true) with check (true);
create policy "allow_all_authenticated" on stock_movements   for all to authenticated using (true) with check (true);
create policy "allow_all_authenticated" on sales             for all to authenticated using (true) with check (true);
create policy "allow_all_authenticated" on sale_items        for all to authenticated using (true) with check (true);
create policy "allow_all_authenticated" on recipes           for all to authenticated using (true) with check (true);
create policy "allow_all_authenticated" on recipe_versions   for all to authenticated using (true) with check (true);
create policy "allow_all_authenticated" on recipe_ingredients for all to authenticated using (true) with check (true);

-- ============================================================
-- USEFUL VIEWS
-- ============================================================

-- Daily sales summary
create or replace view v_daily_sales as
select
  date_trunc('day', created_at at time zone 'America/Sao_Paulo') as day,
  count(*) as orders,
  sum(total) as revenue,
  sum(case when payment_method = 'cash'   then total else 0 end) as cash_revenue,
  sum(case when payment_method = 'credit' then total else 0 end) as credit_revenue,
  sum(case when payment_method = 'debit'  then total else 0 end) as debit_revenue
from sales
where status = 'completed'
group by 1
order by 1 desc;

-- Top products by revenue
create or replace view v_top_products as
select
  p.id,
  p.name,
  p.unit,
  sum(si.quantity) as total_qty,
  sum(si.total)    as total_revenue
from sale_items si
join sales   s on s.id = si.sale_id   and s.status = 'completed'
join products p on p.id = si.product_id
group by p.id, p.name, p.unit
order by total_revenue desc;
