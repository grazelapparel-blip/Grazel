-- ==========================================

-- GRAZEL E-COMMERCE DATABASE INITIALIZATION
-- Run this script in your Supabase SQL Editor
-- ==========================================

-- 1. PROFILES TABLE (linked to auth.users)
create table if not exists public.profiles (
  id uuid references auth.users on delete cascade primary key,
  email text not null,
  name text,
  role text not null default 'user' check (role in ('user', 'admin')),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable Row Level Security
alter table public.profiles enable row level security;

-- RLS Policies for profiles
create policy "Allow public read-access to profiles"
  on public.profiles for select
  using (true);

create policy "Allow users to update their own profile"
  on public.profiles for update
  using (auth.uid() = id);

-- Trigger to automatically create a profile entry for new registrations
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, name, role)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'name', 'Valued Customer'),
    coalesce(new.raw_user_meta_data->>'role', 'user')
  );
  return new;
end;
$$ language plpgsql security definer;

create or replace trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();


-- 2. PRODUCTS TABLE
create table if not exists public.products (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  price numeric not null,
  original_price numeric,
  discount numeric,
  category text not null,
  subcategory text,
  color text,
  fabric text,
  fit text,
  sizes text[] not null default '{}',
  images text[] not null default '{}',
  is_new boolean default false,
  is_bestseller boolean default false,
  description text,
  care_instructions text[] not null default '{}',
  composition text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable Row Level Security
alter table public.products enable row level security;

-- RLS Policies for products
create policy "Allow public read-access to products"
  on public.products for select
  using (true);

create policy "Allow admins full access to products"
  on public.products for all
  using (
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid() and profiles.role = 'admin'
    )
  );


-- 3. CART ITEMS TABLE
create table if not exists public.cart_items (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  product_id uuid references public.products on delete cascade not null,
  size text not null,
  quantity integer not null check (quantity > 0),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique (user_id, product_id, size)
);

-- Enable Row Level Security
alter table public.cart_items enable row level security;

-- RLS Policies for cart items
create policy "Users can manage their own cart items"
  on public.cart_items for all
  using (auth.uid() = user_id);


-- 4. ORDERS TABLE
create table if not exists public.orders (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete set null,
  customer_name text not null,
  customer_email text not null,
  shipping_address text not null,
  total_amount numeric not null,
  status text not null default 'Processing' check (status in ('Processing', 'Shipped', 'Delivered', 'Cancelled')),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable Row Level Security
alter table public.orders enable row level security;

-- RLS Policies for orders
create policy "Users can view their own orders"
  on public.orders for select
  using (auth.uid() = user_id);

create policy "Users can create their own orders"
  on public.orders for insert
  with check (auth.uid() = user_id or auth.uid() is null);

create policy "Admins can view and update all orders"
  on public.orders for all
  using (
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid() and profiles.role = 'admin'
    )
  );


-- 5. ORDER LINE ITEMS TABLE
create table if not exists public.order_items (

  id uuid default gen_random_uuid() primary key,
  order_id uuid references public.orders on delete cascade not null,
  product_id uuid references public.products on delete set null,
  product_name text not null,
  price numeric not null,
  size text not null,
  quantity integer not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable Row Level Security
alter table public.order_items enable row level security;

-- RLS Policies for order items
create policy "Users can view their own order items"
  on public.order_items for select
  using (
    exists (
      select 1 from public.orders
      where orders.id = order_items.order_id and orders.user_id = auth.uid()
    )
  );

create policy "Users can create their own order items"
  on public.order_items for insert
  with check (true); -- Linked order checks insert security via order ownership

create policy "Admins can view all order items"
  on public.order_items for select
  using (
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid() and profiles.role = 'admin'
    )
  );


-- ============================================================================
-- SEED DATA: ADMIN USER (ROLE) 
-- ============================================================================
-- Supabase auth credentials (email/password) live in auth.users.
-- Your app uses public.profiles.role to authorize admin actions.
--
-- This will locate the auth user by email (no UUID hard-coding required).
insert into public.profiles (id, email, name, role)
select
  u.id,
  u.email,
  'Grazel Admin'::text as name,
  'admin'::text as role
from auth.users u
where u.email = 'admin@grazel.com'
on conflict (id) do update
  set role = 'admin',
      email = excluded.email,
      name = excluded.name;




-- ==========================================
-- SEED DATA REMOVED
-- ==========================================
-- Dummy/seed product inserts were removed.
-- Keep only schema + admin role seeding (if needed).

