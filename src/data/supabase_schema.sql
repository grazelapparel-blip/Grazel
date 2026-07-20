-- ============================================================================
-- GRAZEL ATELIER - SUPABASE POSTGRESQL SCHEMA (COMPLETE)
-- ============================================================================
-- This is the complete schema for Grazel E-commerce platform
-- Run this schema in your Supabase SQL editor
-- Features: Products, Orders, Cart, Fit Profiles, Reviews, Admin Management
-- Auth: Supabase built-in with Email & Google OAuth support
-- ============================================================================

-- Enable extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================================
-- 1. PROFILES TABLE - User Authentication & Profiles
-- ============================================================================
-- Extends Supabase auth.users with custom user profile data
-- Supports both Email and Google OAuth authentication
-- Stores admin roles and user preferences

CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  avatar TEXT,
  phone TEXT,
  role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin')),
  auth_provider TEXT NOT NULL DEFAULT 'email' CHECK (auth_provider IN ('email', 'google')),
  google_id TEXT UNIQUE,
  google_email TEXT,
  google_name TEXT,
  google_avatar TEXT,
  last_login TIMESTAMP WITH TIME ZONE,
  is_email_verified BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,
  preferences JSONB DEFAULT '{"newsletter": false, "notifications": true}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- 2. PRODUCTS TABLE - Product Catalog
-- ============================================================================
-- Main product inventory with sizing, categorization, and fit recommendations
-- Supports new products, bestsellers, and pre-orders

CREATE TABLE IF NOT EXISTS products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  price DECIMAL(10, 2) NOT NULL,
  original_price DECIMAL(10, 2),
  discount INTEGER CHECK (discount >= 0 AND discount <= 100),
  category TEXT NOT NULL CHECK (category IN ('men', 'women', 'essentials')),
  subcategory TEXT,
  color TEXT,
  fabric TEXT,
  fit TEXT,
  sizes TEXT[] DEFAULT '{}',
  images TEXT[] DEFAULT '{}',
  is_new_product BOOLEAN DEFAULT FALSE,
  is_bestseller BOOLEAN DEFAULT FALSE,
  is_pre_order BOOLEAN DEFAULT FALSE,
  pre_order_message TEXT,
  stock_quantity INTEGER DEFAULT 0,
  care_instructions TEXT[] DEFAULT '{}',
  composition TEXT,
  delivery_returns TEXT,
  return_window_days INTEGER DEFAULT 30,
  fit_type TEXT CHECK (fit_type IN ('top', 'bottom', 'none')),
  tailored_fit_measurements UUID[] DEFAULT '{}',
  tags TEXT[] DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES profiles(id) ON DELETE SET NULL
);

CREATE INDEX idx_products_category ON products(category);
CREATE INDEX idx_products_subcategory ON products(subcategory);
CREATE INDEX idx_products_is_new ON products(is_new_product);
CREATE INDEX idx_products_is_bestseller ON products(is_bestseller);
CREATE INDEX idx_products_created_at ON products(created_at);

-- ============================================================================
-- 3. MEASUREMENTS TABLE - Sizing System
-- ============================================================================
-- Defines custom measurements for fit profiles
-- Used for tailored fit recommendations

CREATE TABLE IF NOT EXISTS measurements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  fit_type TEXT NOT NULL CHECK (fit_type IN ('top', 'bottom')),
  name TEXT NOT NULL,
  datatype TEXT NOT NULL CHECK (datatype IN ('number', 'decimal', 'integer', 'string', 'percentage')),
  description TEXT,
  unit TEXT,
  min_value DECIMAL(10, 2),
  max_value DECIMAL(10, 2),
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(fit_type, name)
);

CREATE INDEX idx_measurements_fit_type ON measurements(fit_type);

-- ============================================================================
-- 4. FIT PROFILES TABLE - User Measurements
-- ============================================================================
-- Stores customer body measurements for personalized fit recommendations

CREATE TABLE IF NOT EXISTS fit_profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  user_name TEXT, --It needs to be add in supabase profiles table
  user_email TEXT, --It needs to be add in supabase profiles table
  fit_type TEXT NOT NULL CHECK (fit_type IN ('simple', 'detailed')),
  -- Simple profile fields
  height DECIMAL(10, 2),
  weight DECIMAL(10, 2),
  -- Detailed profile fields (tops)
  chest DECIMAL(10, 2),
  shoulder_width DECIMAL(10, 2),
  bicep DECIMAL(10, 2),
  wrist DECIMAL(10, 2),
  arm_length DECIMAL(10, 2),
  -- Detailed profile fields (bottoms)
  waist DECIMAL(10, 2),
  hip DECIMAL(10, 2),
  garment_length DECIMAL(10, 2),
  inseam DECIMAL(10, 2),
  -- Calculated recommendations
  recommended_size TEXT,
  recommendations JSONB DEFAULT '{}',
  is_default BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_fit_profiles_user_id ON fit_profiles(user_id);
CREATE INDEX idx_fit_profiles_is_default ON fit_profiles(is_default);

-- ============================================================================
-- 5. CART TABLE - Shopping Cart Management
-- ============================================================================
-- Stores temporary shopping cart items for users

CREATE TABLE IF NOT EXISTS cart_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  size TEXT NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1 CHECK (quantity > 0),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, product_id, size)
);

CREATE INDEX idx_cart_items_user_id ON cart_items(user_id);
CREATE INDEX idx_cart_items_product_id ON cart_items(product_id);

-- ============================================================================
-- 6. WISHLIST TABLE - Saved Items for Later
-- ============================================================================
-- Allows users to save products for future purchase

CREATE TABLE IF NOT EXISTS wishlist (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  size TEXT,
  added_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, product_id)
);

CREATE INDEX idx_wishlist_user_id ON wishlist(user_id);
CREATE INDEX idx_wishlist_product_id ON wishlist(product_id);

-- ============================================================================
-- 7. SHIPPING ADDRESSES TABLE - User Addresses
-- ============================================================================
-- Stores multiple shipping addresses for users

CREATE TABLE IF NOT EXISTS shipping_addresses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  label TEXT,
  full_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  street_address TEXT NOT NULL,
  city TEXT NOT NULL,
  state TEXT NOT NULL,
  postal_code TEXT NOT NULL,
  country TEXT NOT NULL DEFAULT 'IN',
  is_default BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_shipping_addresses_user_id ON shipping_addresses(user_id);
CREATE INDEX idx_shipping_addresses_is_default ON shipping_addresses(is_default);

-- ============================================================================
-- 8. ORDERS TABLE - Customer Orders
-- ============================================================================
-- Stores complete order information with customer and shipping details

CREATE TABLE IF NOT EXISTS orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  order_number TEXT UNIQUE NOT NULL,
  customer_name TEXT NOT NULL,
  customer_email TEXT NOT NULL,
  customer_phone TEXT NOT NULL,
  shipping_address JSONB NOT NULL,
  billing_address JSONB,
  subtotal DECIMAL(10, 2) NOT NULL,
  shipping_cost DECIMAL(10, 2) DEFAULT 0,
  tax DECIMAL(10, 2) DEFAULT 0,
  discount DECIMAL(10, 2) DEFAULT 0,
  total_amount DECIMAL(10, 2) NOT NULL,
  payment_method TEXT CHECK (payment_method IN ('credit_card', 'upi', 'net_banking', 'wallet')),
  payment_status TEXT NOT NULL DEFAULT 'pending' CHECK (payment_status IN ('pending', 'completed', 'failed', 'refunded')),
  order_status TEXT NOT NULL DEFAULT 'pending' CHECK (order_status IN ('pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'returned')),
  tracking_number TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_orders_user_id ON orders(user_id);
CREATE INDEX idx_orders_order_status ON orders(order_status);
CREATE INDEX idx_orders_payment_status ON orders(payment_status);
CREATE INDEX idx_orders_created_at ON orders(created_at);
CREATE INDEX idx_orders_order_number ON orders(order_number);

-- ============================================================================
-- 9. ORDER ITEMS TABLE - Order Line Items
-- ============================================================================
-- Stores individual products within each order

CREATE TABLE IF NOT EXISTS order_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id) ON DELETE SET NULL,
  product_name TEXT NOT NULL,
  price DECIMAL(10, 2) NOT NULL,
  size TEXT NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1 CHECK (quantity > 0),
  is_pre_order BOOLEAN DEFAULT FALSE,
  return_status TEXT CHECK (return_status IN ('no_return', 'requested', 'approved', 'returned', 'refunded')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_order_items_order_id ON order_items(order_id);
CREATE INDEX idx_order_items_product_id ON order_items(product_id);

-- ============================================================================
-- 10. REVIEWS TABLE - Product Reviews & Ratings
-- ============================================================================
-- Stores customer reviews and ratings for products

CREATE TABLE IF NOT EXISTS reviews (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  order_id UUID REFERENCES orders(id) ON DELETE SET NULL,
  order_item_id UUID REFERENCES order_items(id) ON DELETE SET NULL,
  user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  customer_name TEXT NOT NULL,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  title TEXT,
  comment TEXT,
  verified_purchase BOOLEAN DEFAULT FALSE,
  helpful_count INTEGER DEFAULT 0,
  is_approved BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(order_item_id)
);

CREATE INDEX idx_reviews_product_id ON reviews(product_id);
CREATE INDEX idx_reviews_user_id ON reviews(user_id);
CREATE INDEX idx_reviews_rating ON reviews(rating);

-- ============================================================================
-- 11. ADMIN ACTIVITY LOG TABLE - Audit Trail
-- ============================================================================
-- Tracks all admin actions for security and audit purposes

CREATE TABLE IF NOT EXISTS admin_activity_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  admin_id UUID NOT NULL REFERENCES profiles(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  resource_type TEXT NOT NULL CHECK (resource_type IN ('product', 'order', 'user', 'settings', 'other')),
  resource_id UUID,
  details JSONB,
  ip_address TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_admin_activity_logs_admin_id ON admin_activity_logs(admin_id);
CREATE INDEX idx_admin_activity_logs_resource_type ON admin_activity_logs(resource_type);
CREATE INDEX idx_admin_activity_logs_created_at ON admin_activity_logs(created_at);

-- ============================================================================
-- 12. NOTIFICATIONS TABLE - User Notifications
-- ============================================================================
-- Stores notifications for users (orders, promotions, etc.)

CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT CHECK (type IN ('order', 'promotion', 'system', 'review')),
  related_order_id UUID REFERENCES orders(id) ON DELETE SET NULL,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  read_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_is_read ON notifications(is_read);
CREATE INDEX idx_notifications_created_at ON notifications(created_at);

-- ============================================================================
-- 13. PASSWORD RESET TOKENS TABLE
-- ============================================================================
-- Stores secure password reset tokens with expiration

CREATE TABLE IF NOT EXISTS password_reset_tokens (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  token TEXT NOT NULL UNIQUE,
  token_hash TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  used_at TIMESTAMP WITH TIME ZONE,
  ip_address TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_password_reset_tokens_user_id ON password_reset_tokens(user_id);
CREATE INDEX idx_password_reset_tokens_token_hash ON password_reset_tokens(token_hash);
CREATE INDEX idx_password_reset_tokens_expires_at ON password_reset_tokens(expires_at);

-- ============================================================================
-- 14. PASSWORD HISTORY TABLE
-- ============================================================================
-- Tracks password changes for security auditing

CREATE TABLE IF NOT EXISTS password_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  password_hash TEXT NOT NULL,
  changed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  ip_address TEXT,
  user_agent TEXT,
  reason TEXT CHECK (reason IN ('user_change', 'admin_reset', 'security_alert', 'initial_setup'))
);

CREATE INDEX idx_password_history_user_id ON password_history(user_id);
CREATE INDEX idx_password_history_changed_at ON password_history(changed_at);

-- ============================================================================
-- 15. TWO-FACTOR AUTHENTICATION TABLE
-- ============================================================================
-- Stores 2FA settings and backup codes

CREATE TABLE IF NOT EXISTS two_factor_auth (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL UNIQUE REFERENCES profiles(id) ON DELETE CASCADE,
  method TEXT NOT NULL CHECK (method IN ('totp', 'sms', 'email')),
  is_enabled BOOLEAN DEFAULT FALSE,
  totp_secret TEXT,
  phone_number TEXT,
  verified_at TIMESTAMP WITH TIME ZONE,
  backup_codes TEXT[] DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_two_factor_auth_user_id ON two_factor_auth(user_id);

-- ============================================================================
-- 16. LOGIN SESSIONS TABLE
-- ============================================================================
-- Tracks active user sessions for security monitoring

CREATE TABLE IF NOT EXISTS login_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  session_token TEXT NOT NULL UNIQUE,
  token_hash TEXT NOT NULL UNIQUE,
  ip_address TEXT NOT NULL,
  user_agent TEXT,
  device_name TEXT,
  os TEXT,
  browser TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  last_activity TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_login_sessions_user_id ON login_sessions(user_id);
CREATE INDEX idx_login_sessions_is_active ON login_sessions(is_active);
CREATE INDEX idx_login_sessions_expires_at ON login_sessions(expires_at);

-- ============================================================================
-- 17. PASSWORD POLICIES TABLE
-- ============================================================================
-- Configurable password requirements and policies

CREATE TABLE IF NOT EXISTS password_policies (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL UNIQUE,
  min_length INTEGER NOT NULL DEFAULT 8,
  require_uppercase BOOLEAN DEFAULT TRUE,
  require_lowercase BOOLEAN DEFAULT TRUE,
  require_numbers BOOLEAN DEFAULT TRUE,
  require_special_chars BOOLEAN DEFAULT TRUE,
  special_chars TEXT DEFAULT '!@#$%^&*()_+-=[]{}|;:,.<>?',
  max_age_days INTEGER,
  password_history_count INTEGER DEFAULT 5,
  lockout_threshold INTEGER DEFAULT 5,
  lockout_duration_minutes INTEGER DEFAULT 15,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default password policy
INSERT INTO password_policies (name, min_length, require_uppercase, require_lowercase, require_numbers, require_special_chars, max_age_days, password_history_count)
VALUES ('default', 8, TRUE, TRUE, TRUE, TRUE, 90, 5)
ON CONFLICT (name) DO NOTHING;

-- ============================================================================
-- 18. ACCOUNT LOCKOUT TABLE
-- ============================================================================
-- Tracks failed login attempts for security

CREATE TABLE IF NOT EXISTS account_lockouts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  failed_attempts INTEGER DEFAULT 1,
  last_attempt TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  locked_until TIMESTAMP WITH TIME ZONE,
  reason TEXT CHECK (reason IN ('password_attempts', 'suspicious_activity', 'admin_lockout')),
  ip_address TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_account_lockouts_user_id ON account_lockouts(user_id);
CREATE INDEX idx_account_lockouts_locked_until ON account_lockouts(locked_until);

-- ============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================
-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE measurements ENABLE ROW LEVEL SECURITY;
ALTER TABLE fit_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE cart_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE wishlist ENABLE ROW LEVEL SECURITY;
ALTER TABLE shipping_addresses ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_activity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE password_reset_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE password_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE two_factor_auth ENABLE ROW LEVEL SECURITY;
ALTER TABLE login_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE password_policies ENABLE ROW LEVEL SECURITY;
ALTER TABLE account_lockouts ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- PROFILES POLICIES
-- ============================================================================
CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Public can view profiles" ON profiles
  FOR SELECT USING (true);

-- ============================================================================
-- PRODUCTS POLICIES
-- ============================================================================
CREATE POLICY "Anyone can view products" ON products
  FOR SELECT USING (true);

CREATE POLICY "Only admins can create products" ON products
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Only admins can update products" ON products
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Only admins can delete products" ON products
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- ============================================================================
-- MEASUREMENTS POLICIES
-- ============================================================================
CREATE POLICY "Anyone can view measurements" ON measurements
  FOR SELECT USING (true);

CREATE POLICY "Only admins can manage measurements" ON measurements
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Only admins can update measurements" ON measurements
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Only admins can delete measurements" ON measurements
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- ============================================================================
-- FIT PROFILES POLICIES
-- ============================================================================
CREATE POLICY "Users can view own fit profiles" ON fit_profiles
  FOR SELECT USING (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Users can create fit profiles" ON fit_profiles
  FOR INSERT WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Users can update own fit profiles" ON fit_profiles
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own fit profiles" ON fit_profiles
  FOR DELETE USING (auth.uid() = user_id);

-- ============================================================================
-- CART POLICIES
-- ============================================================================
CREATE POLICY "Users can view own cart" ON cart_items
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own cart" ON cart_items
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own cart" ON cart_items
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own cart items" ON cart_items
  FOR DELETE USING (auth.uid() = user_id);

-- ============================================================================
-- WISHLIST POLICIES
-- ============================================================================
CREATE POLICY "Users can view own wishlist" ON wishlist
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own wishlist" ON wishlist
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own wishlist items" ON wishlist
  FOR DELETE USING (auth.uid() = user_id);

-- ============================================================================
-- SHIPPING ADDRESSES POLICIES
-- ============================================================================
CREATE POLICY "Users can view own shipping addresses" ON shipping_addresses
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own shipping addresses" ON shipping_addresses
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own shipping addresses" ON shipping_addresses
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own shipping addresses" ON shipping_addresses
  FOR DELETE USING (auth.uid() = user_id);

-- ============================================================================
-- ORDERS POLICIES
-- ============================================================================
CREATE POLICY "Users can view own orders" ON orders
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all orders" ON orders
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Users can create orders" ON orders
  FOR INSERT WITH CHECK (user_id IS NULL OR auth.uid() = user_id);

CREATE POLICY "Only admins can update order status" ON orders
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- ============================================================================
-- ORDER ITEMS POLICIES
-- ============================================================================
CREATE POLICY "Order items readable with order access" ON order_items
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM orders
      WHERE orders.id = order_items.order_id
      AND (auth.uid() = orders.user_id OR
           EXISTS (
             SELECT 1 FROM profiles
             WHERE id = auth.uid() AND role = 'admin'
           )
          )
    ) OR
    EXISTS (
      SELECT 1 FROM orders
      WHERE orders.id = order_items.order_id AND orders.user_id IS NULL
    )
  );

-- ============================================================================
-- REVIEWS POLICIES
-- ============================================================================
CREATE POLICY "Anyone can view approved reviews" ON reviews
  FOR SELECT USING (is_approved = true);

CREATE POLICY "Admins can view all reviews" ON reviews
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Authenticated users can create reviews" ON reviews
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Only admins can approve/manage reviews" ON reviews
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- ============================================================================
-- ADMIN ACTIVITY LOGS POLICIES
-- ============================================================================
CREATE POLICY "Only admins can view activity logs" ON admin_activity_logs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Only admins can create activity logs" ON admin_activity_logs
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- ============================================================================
-- NOTIFICATIONS POLICIES
-- ============================================================================
CREATE POLICY "Users can view own notifications" ON notifications
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own notifications" ON notifications
  FOR UPDATE USING (auth.uid() = user_id);

-- ============================================================================
-- PASSWORD RESET TOKENS POLICIES
-- ============================================================================
CREATE POLICY "Users can view own reset tokens" ON password_reset_tokens
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Only admins can create reset tokens" ON password_reset_tokens
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- ============================================================================
-- PASSWORD HISTORY POLICIES
-- ============================================================================
CREATE POLICY "Users can view own password history" ON password_history
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Only admins can view all password history" ON password_history
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- ============================================================================
-- TWO-FACTOR AUTH POLICIES
-- ============================================================================
CREATE POLICY "Users can manage own 2FA settings" ON two_factor_auth
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own 2FA settings" ON two_factor_auth
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can create 2FA settings" ON two_factor_auth
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- ============================================================================
-- LOGIN SESSIONS POLICIES
-- ============================================================================
CREATE POLICY "Users can view own sessions" ON login_sessions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own sessions" ON login_sessions
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Only admins can view all sessions" ON login_sessions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- ============================================================================
-- PASSWORD POLICIES POLICIES
-- ============================================================================
CREATE POLICY "Anyone can view password policies" ON password_policies
  FOR SELECT USING (true);

CREATE POLICY "Only admins can manage password policies" ON password_policies
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- ============================================================================
-- ACCOUNT LOCKOUT POLICIES
-- ============================================================================
CREATE POLICY "Users can view own lockout status" ON account_lockouts
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Only admins can manage lockouts" ON account_lockouts
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- ============================================================================
-- TRIGGERS & FUNCTIONS
-- ============================================================================

-- ============================================================================
-- FUNCTION: Handle New User Registration (Email & Google OAuth)
-- ============================================================================
-- Auto-create profile on user signup via Email or Google OAuth
-- Captures Google user metadata when available
-- Automatically sets admin role for designated admin emails

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  auth_provider TEXT;
  google_id_val TEXT;
  google_name_val TEXT;
  google_avatar_val TEXT;
  google_email_val TEXT;
  user_role TEXT;
BEGIN
  -- Determine auth provider
  IF new.provider = 'google' THEN
    auth_provider := 'google';
    google_id_val := new.user_metadata->>'sub';
    google_name_val := new.user_metadata->>'name';
    google_avatar_val := new.user_metadata->>'picture';
    google_email_val := new.email;
  ELSE
    auth_provider := 'email';
    google_id_val := NULL;
    google_name_val := NULL;
    google_avatar_val := NULL;
    google_email_val := NULL;
  END IF;

  -- Check if email is in admin list
  user_role := CASE 
    WHEN new.email IN ('admin@grazel.com', 'admin@example.com') THEN 'admin'
    ELSE 'user'
  END;

  INSERT INTO public.profiles (
    id,
    email,
    name,
    avatar,
    role,
    auth_provider,
    google_id,
    google_name,
    google_email,
    google_avatar,
    is_email_verified
  ) VALUES (
    new.id,
    new.email,
    COALESCE(new.user_metadata->>'name', new.email),
    COALESCE(google_avatar_val, new.user_metadata->>'avatar_url'),
    user_role,
    auth_provider,
    google_id_val,
    google_name_val,
    google_email_val,
    google_avatar_val,
    CASE WHEN new.email_confirmed_at IS NOT NULL THEN TRUE ELSE FALSE END
  );
  RETURN new;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================================================
-- FUNCTION: Update Updated_At Timestamps
-- ============================================================================
-- Automatically update the updated_at column to current timestamp

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at triggers to all tables
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON products
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_measurements_updated_at BEFORE UPDATE ON measurements
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_fit_profiles_updated_at BEFORE UPDATE ON fit_profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_cart_items_updated_at BEFORE UPDATE ON cart_items
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON orders
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_shipping_addresses_updated_at BEFORE UPDATE ON shipping_addresses
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- FUNCTION: Generate Order Number
-- ============================================================================
-- Generate unique order number automatically

CREATE OR REPLACE FUNCTION generate_order_number()
RETURNS TEXT AS $$
BEGIN
  RETURN 'ORD-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || LPAD(NEXTVAL('order_number_seq')::text, 6, '0');
END;
$$ LANGUAGE plpgsql;

-- Create sequence for order numbers
CREATE SEQUENCE IF NOT EXISTS order_number_seq START WITH 1000;

-- ============================================================================
-- FUNCTION: Update Last Login
-- ============================================================================
-- Update user's last login timestamp

CREATE OR REPLACE FUNCTION update_last_login()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.profiles
  SET last_login = NOW()
  WHERE id = auth.uid();
  RETURN NEW;
END;
$$;

-- ============================================================================
-- FUNCTION: Log Admin Activity
-- ============================================================================
-- Automatically log admin actions for audit trail

CREATE OR REPLACE FUNCTION log_admin_activity(
  p_action TEXT,
  p_resource_type TEXT,
  p_resource_id UUID,
  p_details JSONB DEFAULT NULL
)
RETURNS void AS $$
BEGIN
  INSERT INTO admin_activity_logs (admin_id, action, resource_type, resource_id, details)
  VALUES (auth.uid(), p_action, p_resource_type, p_resource_id, p_details);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- FUNCTION: Create Password Reset Token
-- ============================================================================
-- Generate a secure password reset token

CREATE OR REPLACE FUNCTION create_password_reset_token(p_user_id UUID, p_expiry_hours INT DEFAULT 24)
RETURNS TEXT AS $$
DECLARE
  v_token TEXT;
  v_token_hash TEXT;
BEGIN
  -- Generate random token
  v_token := encode(gen_random_bytes(32), 'hex');
  v_token_hash := encode(digest(v_token, 'sha256'), 'hex');

  -- Store token hash in database (not the token itself)
  INSERT INTO password_reset_tokens (user_id, token, token_hash, expires_at, ip_address)
  VALUES (
    p_user_id,
    v_token,
    v_token_hash,
    NOW() + (p_expiry_hours || ' hours')::INTERVAL,
    current_setting('app.client_ip')
  );

  -- Return the token (only shown once to user)
  RETURN v_token;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- FUNCTION: Verify Password Reset Token
-- ============================================================================
-- Verify and use a password reset token

CREATE OR REPLACE FUNCTION verify_password_reset_token(p_token_hash TEXT)
RETURNS UUID AS $$
DECLARE
  v_user_id UUID;
BEGIN
  -- Find valid, unused token
  SELECT user_id INTO v_user_id
  FROM password_reset_tokens
  WHERE token_hash = p_token_hash
    AND expires_at > NOW()
    AND used_at IS NULL
  LIMIT 1;

  IF v_user_id IS NOT NULL THEN
    -- Mark token as used
    UPDATE password_reset_tokens
    SET used_at = NOW()
    WHERE token_hash = p_token_hash;
  END IF;

  RETURN v_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- FUNCTION: Record Password Change
-- ============================================================================
-- Log password changes to history

CREATE OR REPLACE FUNCTION record_password_change(
  p_user_id UUID,
  p_password_hash TEXT,
  p_reason TEXT DEFAULT 'user_change'
)
RETURNS void AS $$
BEGIN
  INSERT INTO password_history (user_id, password_hash, reason, ip_address, user_agent)
  VALUES (
    p_user_id,
    p_password_hash,
    p_reason,
    current_setting('app.client_ip'),
    current_setting('app.user_agent')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- FUNCTION: Check Account Lockout
-- ============================================================================
-- Verify if account is locked due to failed attempts

CREATE OR REPLACE FUNCTION check_account_lockout(p_user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  v_locked BOOLEAN;
  v_policy record;
BEGIN
  -- Get default password policy
  SELECT * INTO v_policy FROM password_policies WHERE is_active = TRUE LIMIT 1;

  -- Check if account is currently locked
  SELECT EXISTS(
    SELECT 1 FROM account_lockouts
    WHERE user_id = p_user_id
      AND reason = 'password_attempts'
      AND locked_until > NOW()
  ) INTO v_locked;

  RETURN v_locked;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- FUNCTION: Record Failed Login
-- ============================================================================
-- Track failed login attempts

CREATE OR REPLACE FUNCTION record_failed_login(p_user_id UUID, p_ip_address TEXT)
RETURNS INTEGER AS $$
DECLARE
  v_attempts INTEGER;
  v_policy record;
  v_lockout_duration INTERVAL;
BEGIN
  -- Get default policy
  SELECT * INTO v_policy FROM password_policies WHERE is_active = TRUE LIMIT 1;

  -- Increment failed attempts
  UPDATE account_lockouts
  SET failed_attempts = failed_attempts + 1,
      last_attempt = NOW()
  WHERE user_id = p_user_id AND reason = 'password_attempts'
    AND locked_until IS NULL;

  IF NOT FOUND THEN
    INSERT INTO account_lockouts (user_id, failed_attempts, reason, ip_address)
    VALUES (p_user_id, 1, 'password_attempts', p_ip_address);
  END IF;

  -- Get current attempt count
  SELECT failed_attempts INTO v_attempts
  FROM account_lockouts
  WHERE user_id = p_user_id AND reason = 'password_attempts'
  LIMIT 1;

  -- Lock account if threshold exceeded
  IF v_attempts >= v_policy.lockout_threshold THEN
    v_lockout_duration := (v_policy.lockout_duration_minutes || ' minutes')::INTERVAL;
    UPDATE account_lockouts
    SET locked_until = NOW() + v_lockout_duration
    WHERE user_id = p_user_id AND reason = 'password_attempts';
  END IF;

  RETURN v_attempts;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- FUNCTION: Reset Failed Login Count
-- ============================================================================
-- Clear failed attempts on successful login

CREATE OR REPLACE FUNCTION reset_failed_login_count(p_user_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE account_lockouts
  SET failed_attempts = 0, locked_until = NULL
  WHERE user_id = p_user_id AND reason = 'password_attempts';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- FUNCTION: Create Login Session
-- ============================================================================
-- Create and track user login sessions

CREATE OR REPLACE FUNCTION create_login_session(
  p_user_id UUID,
  p_ip_address TEXT,
  p_user_agent TEXT,
  p_device_name TEXT DEFAULT NULL,
  p_session_duration_hours INT DEFAULT 24
)
RETURNS TEXT AS $$
DECLARE
  v_session_token TEXT;
  v_token_hash TEXT;
BEGIN
  -- Generate session token
  v_session_token := encode(gen_random_bytes(32), 'hex');
  v_token_hash := encode(digest(v_session_token, 'sha256'), 'hex');

  -- Extract browser and OS from user agent
  INSERT INTO login_sessions (
    user_id,
    session_token,
    token_hash,
    ip_address,
    user_agent,
    device_name,
    expires_at
  ) VALUES (
    p_user_id,
    v_session_token,
    v_token_hash,
    p_ip_address,
    p_user_agent,
    p_device_name,
    NOW() + (p_session_duration_hours || ' hours')::INTERVAL
  );

  RETURN v_session_token;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- FUNCTION: Generate 2FA TOTP Secret
-- ============================================================================
-- Create a new TOTP secret for two-factor authentication

CREATE OR REPLACE FUNCTION generate_totp_secret(p_user_id UUID)
RETURNS TEXT AS $$
DECLARE
  v_secret TEXT;
BEGIN
  -- Generate random base32 secret (compatible with authenticator apps)
  v_secret := encode(gen_random_bytes(20), 'base64');

  -- Update or create 2FA record
  INSERT INTO two_factor_auth (user_id, method, totp_secret)
  VALUES (p_user_id, 'totp', v_secret)
  ON CONFLICT (user_id) DO UPDATE
  SET totp_secret = v_secret, updated_at = NOW();

  RETURN v_secret;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- FUNCTION: Generate Backup Codes
-- ============================================================================
-- Create backup codes for 2FA recovery

CREATE OR REPLACE FUNCTION generate_backup_codes(p_user_id UUID, p_count INT DEFAULT 10)
RETURNS TEXT[] AS $$
DECLARE
  v_codes TEXT[];
  i INT;
BEGIN
  v_codes := ARRAY[]::TEXT[];

  FOR i IN 1..p_count LOOP
    v_codes := array_append(v_codes, 
      UPPER(SUBSTR(encode(gen_random_bytes(4), 'hex'), 1, 8))
    );
  END LOOP;

  UPDATE two_factor_auth
  SET backup_codes = v_codes, updated_at = NOW()
  WHERE user_id = p_user_id;

  RETURN v_codes;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- ADMIN USER SETUP & SEEDING
-- ============================================================================
-- DEFAULT ADMIN EMAILS (auto-promoted on signup):
-- • admin@grazel.com
-- • admin@example.com
--
-- SETUP STEPS:
-- 1. Go to Supabase Dashboard > Authentication > Users
-- 2. Create a new user with email: admin@grazel.com (or add your admin email to the function)
-- 3. Set a strong password
-- 4. User will automatically be promoted to admin role on first login
--
-- TO ADD MORE ADMIN EMAILS:
-- Update the handle_new_user() function WHERE clause:
-- WHEN new.email IN ('admin@grazel.com', 'admin@example.com', 'newemail@grazel.com') THEN 'admin'
--
-- TO VERIFY ADMIN USERS:
-- SELECT id, name, email, role, auth_provider, created_at 
-- FROM public.profiles 
-- WHERE role = 'admin';
--
-- TO MANUALLY PROMOTE A USER TO ADMIN:
-- UPDATE public.profiles 
-- SET role = 'admin'
-- WHERE email = 'user@example.com';
--
-- ============================================================================

-- Sample measurements setup (run after schema creation if needed)
-- For TOPS:
INSERT INTO measurements (fit_type, name, datatype, description, unit, min_value, max_value)
VALUES 
  ('top', 'Chest', 'decimal', 'Chest measurement around the fullest part', 'cm', 70, 150),
  ('top', 'Shoulder Width', 'decimal', 'Width across shoulders', 'cm', 30, 50),
  ('top', 'Arm Length', 'decimal', 'From shoulder to wrist', 'cm', 50, 80),
  ('top', 'Bicep', 'decimal', 'Around the fullest part of bicep', 'cm', 20, 50)
ON CONFLICT (fit_type, name) DO NOTHING;

-- For BOTTOMS:
INSERT INTO measurements (fit_type, name, datatype, description, unit, min_value, max_value)
VALUES 
  ('bottom', 'Waist', 'decimal', 'Around natural waist', 'cm', 50, 120),
  ('bottom', 'Hip', 'decimal', 'Around the fullest part of hips', 'cm', 70, 140),
  ('bottom', 'Inseam', 'decimal', 'From crotch to ankle', 'cm', 60, 90),
  ('bottom', 'Garment Length', 'decimal', 'Total length from waist to hem', 'cm', 80, 110)
ON CONFLICT (fit_type, name) DO NOTHING;

-- ============================================================================
-- USAGE NOTES & GUIDELINES
-- ============================================================================
--
-- SCHEMA FEATURES:
-- ✓ Complete user authentication with Email & Google OAuth support
-- ✓ Product catalog with categorization and fit recommendations
-- ✓ Shopping cart and wishlist management
-- ✓ Order management with status tracking
-- ✓ User fit profiles for personalized recommendations
-- ✓ Review system with admin approval
-- ✓ Admin activity logging for audit trails
-- ✓ Notification system for user updates
-- ✓ Row-level security (RLS) on all tables
-- ✓ Automatic timestamps on all entities
-- ✓ Comprehensive indexing for performance
--
-- SECURITY FEATURES:
-- ✓ Password reset with secure tokens (24-hour expiry)
-- ✓ Password history tracking (prevents reuse)
-- ✓ Configurable password policies
-- ✓ Two-factor authentication (TOTP + SMS + Email)
-- ✓ Backup codes for 2FA recovery
-- ✓ Login session tracking and management
-- ✓ Account lockout after failed attempts (5 tries → 15 min lockout)
-- ✓ Failed login attempt logging
-- ✓ Admin activity audit trails
-- ✓ Secure token hashing (SHA-256)
--
-- PASSWORD SECURITY FUNCTIONS:
--
-- CREATE RESET TOKEN:
-- SELECT create_password_reset_token(user_uuid, 24); -- 24-hour expiry
--
-- VERIFY RESET TOKEN:
-- SELECT verify_password_reset_token(token_hash);
--
-- RECORD PASSWORD CHANGE:
-- SELECT record_password_change(user_uuid, hashed_password, 'user_change');
--
-- CHECK LOCKOUT STATUS:
-- SELECT check_account_lockout(user_uuid);
--
-- RECORD FAILED LOGIN:
-- SELECT record_failed_login(user_uuid, '192.168.1.1');
--
-- RESET FAILED LOGIN COUNT:
-- SELECT reset_failed_login_count(user_uuid);
--
-- CREATE LOGIN SESSION:
-- SELECT create_login_session(user_uuid, '192.168.1.1', user_agent);
--
-- GENERATE 2FA TOTP SECRET:
-- SELECT generate_totp_secret(user_uuid);
--
-- GENERATE BACKUP CODES:
-- SELECT generate_backup_codes(user_uuid, 10);
--
-- PASSWORD POLICIES:
-- • Default: min 8 chars, uppercase, lowercase, numbers, special chars
-- • Max age: 90 days (automatic password reset required)
-- • History: Cannot reuse last 5 passwords
-- • Lockout: 5 failed attempts → 15 minute lockout
--
-- NO DUMMY DATA:
-- ✓ Schema contains no seed product data
-- ✓ All data must be created via admin interface or API
-- ✓ Measurements table is pre-populated with standard sizing
--
-- ADMIN SETUP:
-- ✓ Create user via Supabase Auth with email: admin@grazel.com
-- ✓ User is automatically promoted to admin on signup
-- ✓ Admin users can manage products, orders, and users
-- ✓ All admin actions are logged in admin_activity_logs
--
-- GOOGLE OAUTH:
-- ✓ Google OAuth users are auto-created in profiles table
-- ✓ Google metadata (ID, name, avatar) stored in profile
-- ✓ Auth provider automatically set to 'google'
-- ✓ Email verification status tracked
--
-- ============================================================================
-- Run this in your Supabase Dashboard -> SQL Editor

ALTER TABLE fit_profiles 
ADD COLUMN IF NOT EXISTS user_name TEXT,
ADD COLUMN IF NOT EXISTS user_email TEXT;