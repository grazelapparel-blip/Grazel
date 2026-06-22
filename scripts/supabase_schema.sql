-- ============================================================================
-- GRAZEL — Supabase Schema Setup
-- Run this entire script in your Supabase project SQL Editor:
--   Dashboard → SQL Editor → New Query → Paste → Run
-- ============================================================================

-- ─── USERS ───────────────────────────────────────────────────────────────────
create table if not exists public.users (
  id            text        primary key,
  email         text        unique not null,
  name          text,
  password_hash text,
  role          text        not null default 'user' check (role in ('user', 'admin')),
  google_id     text,
  avatar        text,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create index if not exists users_email_idx on public.users (email);

create or replace function public.handle_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists users_updated_at on public.users;
create trigger users_updated_at
  before update on public.users
  for each row execute procedure public.handle_updated_at();

-- ─── PRODUCTS ─────────────────────────────────────────────────────────────────
create table if not exists public.products (
  id                 text        primary key,
  name               text        not null,
  description        text,
  price              numeric     not null default 0,
  category           text,
  subcategory        text,
  sizes              jsonb       default '[]',
  images             jsonb       default '[]',
  tags               jsonb       default '[]',
  is_new_product     boolean     default false,
  is_bestseller      boolean     default false,
  is_pre_order       boolean     default false,
  pre_order_message  text,
  return_window_days int         default 30,
  stock              int         default 0,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);

create index if not exists products_category_idx on public.products (category);

drop trigger if exists products_updated_at on public.products;
create trigger products_updated_at
  before update on public.products
  for each row execute procedure public.handle_updated_at();

-- ─── CARTS ────────────────────────────────────────────────────────────────────
create table if not exists public.carts (
  user_id    text        primary key references public.users(id) on delete cascade,
  items      jsonb       not null default '[]',
  updated_at timestamptz not null default now()
);

-- ─── ORDERS ───────────────────────────────────────────────────────────────────
create table if not exists public.orders (
  id         text        primary key default gen_random_uuid()::text,
  user_id    text        references public.users(id) on delete set null,
  items      jsonb       not null default '[]',
  total      numeric     not null default 0,
  status     text        not null default 'pending' check (status in ('pending','confirmed','shipped','delivered','cancelled')),
  address    jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists orders_user_id_idx on public.orders (user_id);

drop trigger if exists orders_updated_at on public.orders;
create trigger orders_updated_at
  before update on public.orders
  for each row execute procedure public.handle_updated_at();

-- ─── ROW LEVEL SECURITY ───────────────────────────────────────────────────────
alter table public.users    enable row level security;
alter table public.products enable row level security;
alter table public.carts    enable row level security;
alter table public.orders   enable row level security;

-- Allow public read for products
create policy "Public products read"
  on public.products for select using (true);
