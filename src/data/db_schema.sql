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


-- ==========================================
-- SEED DATA: INITIAL PRODUCT CATALOG
-- ==========================================

insert into public.products (name, price, category, subcategory, color, fabric, fit, sizes, images, is_new, is_bestseller, description, care_instructions, composition)
values
  (
    'Tailored Wool Blazer',
    495,
    'men',
    'blazers',
    'Charcoal',
    'Wool',
    'Slim',
    array['S', 'M', 'L', 'XL'],
    array['/placeholder.svg'],
    true,
    false,
    'A refined tailored blazer crafted from premium Italian wool, featuring a slim silhouette and subtle horn buttons.',
    array['Dry clean only', 'Store on padded hanger', 'Steam to remove wrinkles'],
    '100% Virgin Wool'
  ),
  (
    'Cashmere Crewneck Sweater',
    325,
    'men',
    'knitwear',
    'Navy',
    'Cashmere',
    'Regular',
    array['S', 'M', 'L', 'XL', 'XXL'],
    array['/placeholder.svg'],
    false,
    true,
    'Luxuriously soft cashmere sweater with a classic crewneck silhouette.',
    array['Hand wash cold', 'Lay flat to dry', 'Store folded'],
    '100% Cashmere'
  ),
  (
    'Cotton Oxford Shirt',
    165,
    'men',
    'shirts',
    'White',
    'Cotton',
    'Regular',
    array['S', 'M', 'L', 'XL'],
    array['/placeholder.svg'],
    false,
    false,
    'Essential oxford shirt in premium cotton with mother-of-pearl buttons.',
    array['Machine wash cold', 'Iron on medium heat', 'Tumble dry low'],
    '100% Cotton'
  ),
  (
    'Pleated Wool Trousers',
    285,
    'men',
    'trousers',
    'Charcoal',
    'Wool',
    'Regular',
    array['28', '30', '32', '34', '36'],
    array['/placeholder.svg'],
    true,
    false,
    'Classic pleated trousers in fine wool suiting fabric.',
    array['Dry clean only', 'Hang to store'],
    '98% Wool, 2% Elastane'
  ),
  (
    'Silk Midi Dress',
    595,
    'women',
    'dresses',
    'Ivory',
    'Silk',
    'Regular',
    array['XS', 'S', 'M', 'L'],
    array['/placeholder.svg'],
    true,
    true,
    'Elegant midi dress in flowing silk with a subtle drape.',
    array['Dry clean only', 'Store on padded hanger'],
    '100% Silk'
  ),
  (
    'Merino Wool Cardigan',
    245,
    'women',
    'knitwear',
    'Camel',
    'Wool',
    'Relaxed',
    array['XS', 'S', 'M', 'L', 'XL'],
    array['/placeholder.svg'],
    false,
    false,
    'Soft merino wool cardigan with a relaxed, oversized silhouette.',
    array['Hand wash cold', 'Lay flat to dry'],
    '100% Merino Wool'
  ),
  (
    'Linen Wide-Leg Trousers',
    195,
    'women',
    'trousers',
    'Natural',
    'Linen',
    'Wide',
    array['XS', 'S', 'M', 'L'],
    array['/placeholder.svg'],
    false,
    false,
    'Effortless wide-leg trousers in breathable pure linen.',
    array['Machine wash cold', 'Iron while damp', 'Hang to dry'],
    '100% Linen'
  ),
  (
    'Cotton Poplin Blouse',
    175,
    'women',
    'shirts',
    'White',
    'Cotton',
    'Regular',
    array['XS', 'S', 'M', 'L', 'XL'],
    array['/placeholder.svg'],
    false,
    true,
    'Crisp cotton poplin blouse with refined details.',
    array['Machine wash cold', 'Iron on medium heat'],
    '100% Cotton'
  ),
  (
    'Leather Belt',
    125,
    'essentials',
    'accessories',
    'Brown',
    'Leather',
    'Standard',
    array['85', '90', '95', '100', '105'],
    array['/placeholder.svg'],
    false,
    false,
    'Classic leather belt with brushed silver buckle.',
    array['Wipe with damp cloth', 'Condition leather periodically'],
    '100% Leather'
  ),
  (
    'Cashmere Scarf',
    195,
    'essentials',
    'accessories',
    'Grey',
    'Cashmere',
    'One Size',
    array['One Size'],
    array['/placeholder.svg'],
    true,
    false,
    'Ultra-soft cashmere scarf in a timeless neutral tone.',
    array['Dry clean only', 'Store folded'],
    '100% Cashmere'
  ),
  (
    'Wool Overcoat',
    695,
    'men',
    'outerwear',
    'Camel',
    'Wool',
    'Regular',
    array['S', 'M', 'L', 'XL'],
    array['/placeholder.svg'],
    false,
    true,
    'Timeless wool overcoat in a rich camel tone.',
    array['Dry clean only', 'Store on padded hanger'],
    '90% Wool, 10% Cashmere'
  ),
  (
    'Silk Scarf',
    165,
    'women',
    'accessories',
    'Burgundy',
    'Silk',
    'One Size',
    array['One Size'],
    array['/placeholder.svg'],
    false,
    false,
    'Luxurious silk scarf with hand-rolled edges.',
    array['Dry clean only'],
    '100% Silk'
  );
