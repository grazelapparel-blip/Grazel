-- ============================================================================
-- GRAZEL ATELIER - COMPLETE DATABASE SCHEMA
-- ============================================================================
-- Combined schema including:
--   1. Base schema (users, products, orders, etc.)
--   2. Extensions (discounts, bundles, shipping rates, etc.)
--   3. CMS (content management system)
--
-- Run this ENTIRE script in Supabase SQL Editor:
--   Dashboard → SQL Editor → New Query → Paste → Run
-- ============================================================================

-- ─── EXTENSIONS ──────────────────────────────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================================
-- SHARED UTILITY FUNCTION: Auto-update updated_at on every row change
-- ============================================================================
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- ============================================================================
-- TABLE 1: USERS
-- Custom auth users managed by Express JWT backend.
-- Supports email/password and Google OAuth sign-in.
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.users (
  id            TEXT          PRIMARY KEY,
  email         TEXT          UNIQUE NOT NULL,
  name          TEXT          NOT NULL DEFAULT '',
  password_hash TEXT,                                  -- NULL for Google-only accounts
  role          TEXT          NOT NULL DEFAULT 'user'
                              CHECK (role IN ('user', 'admin')),
  google_id     TEXT          UNIQUE,                  -- Google OAuth sub claim
  avatar        TEXT,                                  -- Profile image URL
  phone         TEXT,
  is_active     BOOLEAN       NOT NULL DEFAULT TRUE,
  created_at    TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_users_email     ON public.users (email);
CREATE INDEX IF NOT EXISTS idx_users_role      ON public.users (role);
CREATE INDEX IF NOT EXISTS idx_users_google_id ON public.users (google_id);

DROP TRIGGER IF EXISTS trg_users_updated_at ON public.users;
CREATE TRIGGER trg_users_updated_at
  BEFORE UPDATE ON public.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ============================================================================
-- TABLE 2: PRODUCTS
-- Product catalog. Admins can CREATE / UPDATE / DELETE via Express backend.
-- All users and guests can READ.
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.products (
  id                        TEXT          PRIMARY KEY,   -- e.g. "prod_1720000000_abc12"
  name                      TEXT          NOT NULL,
  description               TEXT,
  price                     NUMERIC(12,2) NOT NULL DEFAULT 0 CHECK (price >= 0),
  original_price            NUMERIC(12,2)           CHECK (original_price >= 0),
  discount                  INTEGER       DEFAULT 0  CHECK (discount >= 0 AND discount <= 100),
  category                  TEXT          NOT NULL
                            CHECK (category IN ('men', 'women', 'essentials')),
  subcategory               TEXT,
  color                     TEXT,
  fabric                    TEXT,
  fit                       TEXT,                        -- "Slim", "Regular", "Relaxed", etc.
  fit_type                  TEXT          DEFAULT 'none'
                            CHECK (fit_type IN ('top', 'bottom', 'none')),
  sizes                     JSONB         NOT NULL DEFAULT '[]',
  images                    JSONB         NOT NULL DEFAULT '[]',
  is_new_product            BOOLEAN       NOT NULL DEFAULT FALSE,
  is_bestseller             BOOLEAN       NOT NULL DEFAULT FALSE,
  is_pre_order              BOOLEAN       NOT NULL DEFAULT FALSE,
  pre_order_message         TEXT,
  stock_quantity            INTEGER       NOT NULL DEFAULT 0 CHECK (stock_quantity >= 0),
  care_instructions         JSONB         NOT NULL DEFAULT '[]',
  composition               TEXT,
  delivery_returns          TEXT,
  return_window_days        INTEGER       NOT NULL DEFAULT 30 CHECK (return_window_days >= 0),
  tailored_fit_measurements JSONB         NOT NULL DEFAULT '[]', -- array of measurement ids
  tags                      JSONB         NOT NULL DEFAULT '[]',
  -- New customization fields from schema_upgrade
  is_customizable           BOOLEAN       DEFAULT FALSE,
  customization_options     JSONB         DEFAULT '{}',
  seasonal_category         TEXT          CHECK (seasonal_category IN (
    'summer', 'winter', 'monsoon', 'autumn', 'diwali', 'eid', 'everyday', NULL
  )),
  is_bundle_eligible        BOOLEAN       DEFAULT TRUE,
  created_by                TEXT          REFERENCES public.users(id) ON DELETE SET NULL,
  created_at                TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  updated_at                TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

-- Add missing columns if table already existed without them (idempotent)
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS is_customizable BOOLEAN DEFAULT FALSE;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS customization_options JSONB DEFAULT '{}';
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS seasonal_category TEXT;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS is_bundle_eligible BOOLEAN DEFAULT TRUE;

CREATE INDEX IF NOT EXISTS idx_products_category      ON public.products (category);
CREATE INDEX IF NOT EXISTS idx_products_subcategory   ON public.products (subcategory);
CREATE INDEX IF NOT EXISTS idx_products_is_new        ON public.products (is_new_product);
CREATE INDEX IF NOT EXISTS idx_products_is_bestseller ON public.products (is_bestseller);
CREATE INDEX IF NOT EXISTS idx_products_is_pre_order  ON public.products (is_pre_order);
CREATE INDEX IF NOT EXISTS idx_products_is_customizable ON public.products (is_customizable);
CREATE INDEX IF NOT EXISTS idx_products_seasonal_category ON public.products (seasonal_category);
CREATE INDEX IF NOT EXISTS idx_products_created_at    ON public.products (created_at DESC);

DROP TRIGGER IF EXISTS trg_products_updated_at ON public.products;
CREATE TRIGGER trg_products_updated_at
  BEFORE UPDATE ON public.products
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ============================================================================
-- TABLE 3: MEASUREMENTS
-- Defines the individual body measurement fields available for fit profiles.
-- Admins add/edit/delete via /api/measurements endpoints.
-- Used by ProductManager to associate required measurements with products.
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.measurements (
  id          TEXT        PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  fit_type    TEXT        NOT NULL CHECK (fit_type IN ('top', 'bottom')),
  name        TEXT        NOT NULL,
  datatype    TEXT        NOT NULL DEFAULT 'decimal'
              CHECK (datatype IN ('number', 'decimal', 'integer', 'string', 'percentage')),
  description TEXT,
  unit        TEXT,                         -- e.g. "cm", "kg", "%"
  min_value   NUMERIC(10,2),
  max_value   NUMERIC(10,2),
  is_active   BOOLEAN     NOT NULL DEFAULT TRUE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (fit_type, name)
);

CREATE INDEX IF NOT EXISTS idx_measurements_fit_type  ON public.measurements (fit_type);
CREATE INDEX IF NOT EXISTS idx_measurements_is_active ON public.measurements (is_active);

DROP TRIGGER IF EXISTS trg_measurements_updated_at ON public.measurements;
CREATE TRIGGER trg_measurements_updated_at
  BEFORE UPDATE ON public.measurements
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ============================================================================
-- TABLE 4: FIT PROFILES
-- Stores each user's body measurements for personalised size recommendations.
-- Supports both "simple" (height/weight) and "detailed" (full measurements).
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.fit_profiles (
  id                TEXT          PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  user_id           TEXT          REFERENCES public.users(id) ON DELETE SET NULL,
  type              TEXT          NOT NULL CHECK (type IN ('simple', 'detailed')),
  -- Simple profile fields
  height            NUMERIC(6,2),   -- cm
  weight            NUMERIC(6,2),   -- kg
  -- Detailed top measurements
  chest             NUMERIC(6,2),   -- cm
  shoulder_width    NUMERIC(6,2),   -- cm
  bicep             NUMERIC(6,2),   -- cm
  wrist             NUMERIC(6,2),   -- cm
  arm_length        NUMERIC(6,2),   -- cm
  garment_length    NUMERIC(6,2),   -- cm
  -- Detailed bottom measurements
  waist             NUMERIC(6,2),   -- cm
  hip               NUMERIC(6,2),   -- cm
  inseam            NUMERIC(6,2),   -- cm
  -- Computed
  recommended_size  TEXT,
  recommendations   JSONB         NOT NULL DEFAULT '{}',
  is_default        BOOLEAN       NOT NULL DEFAULT FALSE,
  created_at        TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_fit_profiles_user_id    ON public.fit_profiles (user_id);
CREATE INDEX IF NOT EXISTS idx_fit_profiles_is_default ON public.fit_profiles (is_default);

DROP TRIGGER IF EXISTS trg_fit_profiles_updated_at ON public.fit_profiles;
CREATE TRIGGER trg_fit_profiles_updated_at
  BEFORE UPDATE ON public.fit_profiles
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ============================================================================
-- TABLE 5: CARTS
-- One row per user. Items stored as a JSONB array to allow guest merging.
-- Each item: { productId, size, quantity, product (full snapshot) }
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.carts (
  user_id    TEXT        PRIMARY KEY REFERENCES public.users(id) ON DELETE CASCADE,
  items      JSONB       NOT NULL DEFAULT '[]',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

DROP TRIGGER IF EXISTS trg_carts_updated_at ON public.carts;
CREATE TRIGGER trg_carts_updated_at
  BEFORE UPDATE ON public.carts
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ============================================================================
-- TABLE 6: WISHLIST
-- Stores user's saved (wishlisted) products per-user.
-- Currently stored in localStorage on the frontend; this table is the server mirror.
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.wishlist (
  id          TEXT        PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  user_id     TEXT        NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  product_id  TEXT        NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  added_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, product_id)
);

CREATE INDEX IF NOT EXISTS idx_wishlist_user_id    ON public.wishlist (user_id);
CREATE INDEX IF NOT EXISTS idx_wishlist_product_id ON public.wishlist (product_id);

-- ============================================================================
-- TABLE 7: SHIPPING ADDRESSES
-- Multiple saved shipping addresses per user. One can be set as default.
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.shipping_addresses (
  id             TEXT        PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  user_id        TEXT        NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  label          TEXT,                         -- e.g. "Home", "Office"
  full_name      TEXT        NOT NULL,
  phone          TEXT,
  street_address TEXT        NOT NULL,
  city           TEXT        NOT NULL,
  state          TEXT        NOT NULL,
  postal_code    TEXT        NOT NULL,
  country        TEXT        NOT NULL DEFAULT 'IN',
  is_default     BOOLEAN     NOT NULL DEFAULT FALSE,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_shipping_addresses_user_id    ON public.shipping_addresses (user_id);
CREATE INDEX IF NOT EXISTS idx_shipping_addresses_is_default ON public.shipping_addresses (is_default);

DROP TRIGGER IF EXISTS trg_shipping_addresses_updated_at ON public.shipping_addresses;
CREATE TRIGGER trg_shipping_addresses_updated_at
  BEFORE UPDATE ON public.shipping_addresses
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ============================================================================
-- TABLE 15: DISCOUNTS (Created early because ORDERS references it)
-- Product, Category, and Bundle Discounts
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.discounts (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  code TEXT UNIQUE NOT NULL,
  description TEXT,
  discount_type TEXT NOT NULL CHECK (discount_type IN ('percentage', 'fixed_amount', 'buy_more_save_more')),
  discount_value DECIMAL(10, 2) NOT NULL,
  max_discount_amount DECIMAL(10, 2),
  min_order_amount DECIMAL(10, 2) DEFAULT 0,
  applies_to TEXT NOT NULL CHECK (applies_to IN ('products', 'categories', 'bundles', 'all')),
  product_ids TEXT[] DEFAULT '{}',
  category_ids TEXT[] DEFAULT '{}',
  bundle_ids TEXT[] DEFAULT '{}',
  max_uses_per_customer INTEGER,
  total_max_uses INTEGER,
  current_uses INTEGER DEFAULT 0,
  start_date TIMESTAMP WITH TIME ZONE NOT NULL,
  end_date TIMESTAMP WITH TIME ZONE NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  is_stackable BOOLEAN DEFAULT FALSE,
  created_by TEXT REFERENCES public.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_discounts_code ON public.discounts(code);
CREATE INDEX idx_discounts_is_active ON public.discounts(is_active);
CREATE INDEX idx_discounts_end_date ON public.discounts(end_date);
CREATE INDEX idx_discounts_applies_to ON public.discounts(applies_to);

-- ============================================================================
-- TABLE 8: ORDERS
-- Created by CheckoutPage. Each order embeds its line items as JSONB.
-- Admin can update status via /api/orders/:id/status.
-- ============================================================================

-- Sequence for readable order numbers
CREATE SEQUENCE IF NOT EXISTS public.order_number_seq START WITH 1000 INCREMENT BY 1;

CREATE TABLE IF NOT EXISTS public.orders (
  id               TEXT          PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  user_id          TEXT          REFERENCES public.users(id) ON DELETE SET NULL,
  order_number     TEXT          UNIQUE NOT NULL
                                 DEFAULT ('ORD-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' ||
                                          LPAD(NEXTVAL('public.order_number_seq')::TEXT, 6, '0')),
  customer_name    TEXT          NOT NULL,
  customer_email   TEXT          NOT NULL,
  shipping_address TEXT          NOT NULL,   -- formatted string from CheckoutPage
  -- Items embedded as JSONB for simplicity + easy restoration on ReviewOrderPage
  -- Each item: { id, productId, productName, price, size, quantity, isPreOrder, preOrderMessage }
  items            JSONB         NOT NULL DEFAULT '[]',
  subtotal         NUMERIC(12,2) NOT NULL DEFAULT 0,
  total_amount     NUMERIC(12,2) NOT NULL DEFAULT 0 CHECK (total_amount >= 0),
  status           TEXT          NOT NULL DEFAULT 'Pending'
                   CHECK (status IN ('Pending','Confirmed','Processing','Shipped','Delivered','Cancelled','Returned')),
  payment_method   TEXT          CHECK (payment_method IN ('credit_card','upi','net_banking','wallet','cod')),
  payment_status   TEXT          NOT NULL DEFAULT 'pending'
                   CHECK (payment_status IN ('pending','completed','failed','refunded')),
  tracking_number  TEXT,
  notes            TEXT,
  -- New fields from schema_upgrade
  packaging_type   TEXT          CHECK (packaging_type IN (
    'standard', 'premium', 'gift', 'eco-friendly', 'personalized', NULL
  )) DEFAULT 'standard',
  packaging_cost   DECIMAL(10, 2) DEFAULT 0,
  applied_coupon_code TEXT,
  applied_discount_code TEXT REFERENCES public.discounts(id) ON DELETE SET NULL,
  shipping_state   TEXT,
  estimated_delivery_date DATE,
  actual_delivery_date DATE,
  custom_notes     TEXT,
  created_at       TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

-- Add missing columns if table already existed without them (idempotent)
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS packaging_type TEXT CHECK (packaging_type IN ('standard', 'premium', 'gift', 'eco-friendly', 'personalized'));
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS packaging_cost DECIMAL(10, 2) DEFAULT 0;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS applied_coupon_code TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS applied_discount_code TEXT REFERENCES public.discounts(id) ON DELETE SET NULL;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS shipping_state TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS estimated_delivery_date DATE;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS actual_delivery_date DATE;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS custom_notes TEXT;

CREATE INDEX IF NOT EXISTS idx_orders_user_id        ON public.orders (user_id);
CREATE INDEX IF NOT EXISTS idx_orders_status         ON public.orders (status);
CREATE INDEX IF NOT EXISTS idx_orders_payment_status ON public.orders (payment_status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at     ON public.orders (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_order_number   ON public.orders (order_number);
CREATE INDEX IF NOT EXISTS idx_orders_packaging_type ON public.orders (packaging_type);
CREATE INDEX IF NOT EXISTS idx_orders_shipping_state ON public.orders (shipping_state);

DROP TRIGGER IF EXISTS trg_orders_updated_at ON public.orders;
CREATE TRIGGER trg_orders_updated_at
  BEFORE UPDATE ON public.orders
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ============================================================================
-- TABLE 9: REVIEWS
-- Customers submit reviews from ReviewOrderPage after placing an order.
-- Fields match the payload ReviewOrderPage sends to /api/reviews.
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.reviews (
  id               TEXT        PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  product_id       TEXT        REFERENCES public.products(id) ON DELETE CASCADE,
  order_id         TEXT        REFERENCES public.orders(id) ON DELETE SET NULL,
  order_item_id    TEXT,        -- string key from embedded order items JSONB
  user_id          TEXT        REFERENCES public.users(id) ON DELETE SET NULL,
  customer_name    TEXT        NOT NULL,
  rating           INTEGER     NOT NULL CHECK (rating >= 1 AND rating <= 5),
  title            TEXT,
  comment          TEXT,
  verified_purchase BOOLEAN    NOT NULL DEFAULT FALSE,
  helpful_count    INTEGER     NOT NULL DEFAULT 0,
  is_approved      BOOLEAN     NOT NULL DEFAULT TRUE,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (order_item_id)       -- one review per order line item
);

CREATE INDEX IF NOT EXISTS idx_reviews_product_id ON public.reviews (product_id);
CREATE INDEX IF NOT EXISTS idx_reviews_user_id    ON public.reviews (user_id);
CREATE INDEX IF NOT EXISTS idx_reviews_rating     ON public.reviews (rating);
CREATE INDEX IF NOT EXISTS idx_reviews_is_approved ON public.reviews (is_approved);

DROP TRIGGER IF EXISTS trg_reviews_updated_at ON public.reviews;
CREATE TRIGGER trg_reviews_updated_at
  BEFORE UPDATE ON public.reviews
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ============================================================================
-- TABLE 10: RETURN REQUESTS
-- Return management shown in AdminDashboard → Returns tab.
-- Linked to an order; each row tracks one return request.
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.return_requests (
  id             TEXT        PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  order_id       TEXT        NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  user_id        TEXT        REFERENCES public.users(id) ON DELETE SET NULL,
  order_item_id  TEXT,                    -- matches item.id in orders.items JSONB
  customer_name  TEXT        NOT NULL,
  reason         TEXT        NOT NULL,
  status         TEXT        NOT NULL DEFAULT 'Requested'
                 CHECK (status IN ('Requested','Approved','Rejected','Completed','Refunded')),
  refund_amount  NUMERIC(12,2),
  admin_notes    TEXT,
  resolved_by    TEXT        REFERENCES public.users(id) ON DELETE SET NULL,
  resolved_at    TIMESTAMPTZ,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_return_requests_order_id  ON public.return_requests (order_id);
CREATE INDEX IF NOT EXISTS idx_return_requests_user_id   ON public.return_requests (user_id);
CREATE INDEX IF NOT EXISTS idx_return_requests_status    ON public.return_requests (status);
CREATE INDEX IF NOT EXISTS idx_return_requests_created_at ON public.return_requests (created_at DESC);

DROP TRIGGER IF EXISTS trg_return_requests_updated_at ON public.return_requests;
CREATE TRIGGER trg_return_requests_updated_at
  BEFORE UPDATE ON public.return_requests
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ============================================================================
-- TABLE 11: RETURN POLICIES
-- Editable policy entries shown in AdminDashboard → Policy tab.
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.return_policies (
  id         TEXT        PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  title      TEXT        NOT NULL UNIQUE,
  value      TEXT        NOT NULL,
  sort_order INTEGER     NOT NULL DEFAULT 0,
  is_active  BOOLEAN     NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

DROP TRIGGER IF EXISTS trg_return_policies_updated_at ON public.return_policies;
CREATE TRIGGER trg_return_policies_updated_at
  BEFORE UPDATE ON public.return_policies
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ============================================================================
-- TABLE 12: NOTIFICATIONS
-- User-facing notifications (order updates, promotions, system alerts).
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.notifications (
  id               TEXT        PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  user_id          TEXT        REFERENCES public.users(id) ON DELETE CASCADE,
  title            TEXT        NOT NULL,
  message          TEXT        NOT NULL,
  type             TEXT        CHECK (type IN ('order','promotion','system','review','return')),
  related_order_id TEXT        REFERENCES public.orders(id) ON DELETE SET NULL,
  is_read          BOOLEAN     NOT NULL DEFAULT FALSE,
  read_at          TIMESTAMPTZ,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notifications_user_id    ON public.notifications (user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read    ON public.notifications (is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON public.notifications (created_at DESC);

-- ============================================================================
-- TABLE 13: ADMIN ACTIVITY LOGS
-- Audit trail of every admin action (add/edit/delete product, update orders, etc.).
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.admin_activity_logs (
  id            TEXT        PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  admin_id      TEXT        NOT NULL REFERENCES public.users(id) ON DELETE SET NULL,
  action        TEXT        NOT NULL,  -- e.g. "CREATE_PRODUCT", "UPDATE_ORDER_STATUS"
  resource_type TEXT        NOT NULL
                CHECK (resource_type IN ('product','order','user','measurement','return','settings','other')),
  resource_id   TEXT,                  -- id of the affected record
  details       JSONB,                 -- before/after snapshot or extra context
  ip_address    TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_admin_logs_admin_id      ON public.admin_activity_logs (admin_id);
CREATE INDEX IF NOT EXISTS idx_admin_logs_resource_type ON public.admin_activity_logs (resource_type);
CREATE INDEX IF NOT EXISTS idx_admin_logs_created_at    ON public.admin_activity_logs (created_at DESC);

-- ============================================================================
-- TABLE 14: STOCK MOVEMENTS
-- Tracks inventory changes so the Stock tab in AdminDashboard can show history.
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.stock_movements (
  id           TEXT        PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  product_id   TEXT        NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  change_qty   INTEGER     NOT NULL,   -- positive = restock, negative = sale/adjustment
  reason       TEXT        NOT NULL
               CHECK (reason IN ('sale','restock','adjustment','return','damage')),
  reference_id TEXT,                   -- order id, return id, etc.
  notes        TEXT,
  performed_by TEXT        REFERENCES public.users(id) ON DELETE SET NULL,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_stock_movements_product_id ON public.stock_movements (product_id);
CREATE INDEX IF NOT EXISTS idx_stock_movements_created_at ON public.stock_movements (created_at DESC);

-- ============================================================================
-- SCHEMA UPGRADE TABLES - From schema_upgrade.sql
-- ============================================================================

-- ============================================================================
-- TABLE 16: BUNDLES
-- Product Bundles and Combos
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.bundles (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  name TEXT NOT NULL,
  description TEXT,
  bundle_type TEXT NOT NULL CHECK (bundle_type IN ('pair_bundle', 'combo_bundle', 'save_more')),
  product_ids TEXT[] NOT NULL,
  bundle_price DECIMAL(10, 2) NOT NULL,
  original_price DECIMAL(10, 2) NOT NULL,
  discount_percentage DECIMAL(5, 2),
  savings_amount DECIMAL(10, 2),
  images TEXT[] DEFAULT '{}',
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  is_featured BOOLEAN DEFAULT FALSE,
  stock_quantity INTEGER DEFAULT 0,
  seasonal_category TEXT CHECK (seasonal_category IN (
    'summer', 'winter', 'monsoon', 'autumn', 'diwali', 'eid', 'everyday', NULL
  )),
  created_by TEXT REFERENCES public.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_bundles_is_active ON public.bundles(is_active);
CREATE INDEX idx_bundles_is_featured ON public.bundles(is_featured);
CREATE INDEX idx_bundles_bundle_type ON public.bundles(bundle_type);

-- ============================================================================
-- TABLE 17: SHIPPING RATES
-- State-based Shipping Costs
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.shipping_rates (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  state TEXT NOT NULL UNIQUE,
  base_shipping_cost DECIMAL(10, 2) NOT NULL DEFAULT 0,
  free_shipping_threshold DECIMAL(10, 2) NOT NULL DEFAULT 1500,
  estimated_delivery_days_min INTEGER DEFAULT 3,
  estimated_delivery_days_max INTEGER DEFAULT 7,
  is_serviceable BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_shipping_rates_state ON public.shipping_rates(state);
CREATE INDEX idx_shipping_rates_is_serviceable ON public.shipping_rates(is_serviceable);

-- Pre-populate Indian states with default shipping rates
INSERT INTO public.shipping_rates (state, base_shipping_cost, free_shipping_threshold, estimated_delivery_days_min, estimated_delivery_days_max, is_serviceable)
VALUES
  ('Andhra Pradesh', 60, 1500, 3, 7, true),
  ('Arunachal Pradesh', 150, 1500, 7, 14, true),
  ('Assam', 100, 1500, 5, 10, true),
  ('Bihar', 80, 1500, 4, 8, true),
  ('Chhattisgarh', 80, 1500, 4, 8, true),
  ('Goa', 80, 1500, 3, 7, true),
  ('Gujarat', 70, 1500, 3, 7, true),
  ('Haryana', 50, 1500, 2, 5, true),
  ('Himachal Pradesh', 100, 1500, 4, 8, true),
  ('Jharkhand', 80, 1500, 4, 8, true),
  ('Karnataka', 70, 1500, 3, 7, true),
  ('Kerala', 80, 1500, 4, 8, true),
  ('Madhya Pradesh', 80, 1500, 4, 8, true),
  ('Maharashtra', 50, 1500, 2, 5, true),
  ('Manipur', 150, 1500, 7, 14, true),
  ('Meghalaya', 150, 1500, 7, 14, true),
  ('Mizoram', 150, 1500, 7, 14, true),
  ('Nagaland', 150, 1500, 7, 14, true),
  ('Odisha', 80, 1500, 4, 8, true),
  ('Punjab', 60, 1500, 3, 7, true),
  ('Rajasthan', 80, 1500, 4, 8, true),
  ('Sikkim', 150, 1500, 7, 14, true),
  ('Tamil Nadu', 70, 1500, 3, 7, true),
  ('Telangana', 60, 1500, 3, 7, true),
  ('Tripura', 150, 1500, 7, 14, true),
  ('Uttar Pradesh', 70, 1500, 3, 7, true),
  ('Uttarakhand', 100, 1500, 4, 8, true),
  ('West Bengal', 80, 1500, 4, 8, true),
  ('Andaman and Nicobar Islands', 200, 1500, 10, 21, true),
  ('Chandigarh', 50, 1500, 2, 5, true),
  ('Dadra and Nagar Haveli', 80, 1500, 4, 8, true),
  ('Daman and Diu', 80, 1500, 4, 8, true),
  ('Lakshadweep', 250, 1500, 14, 21, true),
  ('Delhi', 40, 1500, 1, 3, true),
  ('Puducherry', 80, 1500, 4, 8, true),
  ('Ladakh', 200, 1500, 10, 21, true),
  ('Jammu and Kashmir', 150, 1500, 7, 14, true)
ON CONFLICT (state) DO NOTHING;

-- ============================================================================
-- TABLE 18: SEASONAL COLLECTIONS
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.seasonal_collections (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  name TEXT NOT NULL UNIQUE,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  collection_type TEXT NOT NULL CHECK (collection_type IN (
    'summer', 'winter', 'monsoon', 'autumn', 'diwali', 'eid', 'other'
  )),
  banner_image TEXT,
  featured_products TEXT[] DEFAULT '{}',
  is_active BOOLEAN DEFAULT TRUE,
  display_order INTEGER DEFAULT 0,
  start_date TIMESTAMP WITH TIME ZONE,
  end_date TIMESTAMP WITH TIME ZONE,
  created_by TEXT REFERENCES public.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_seasonal_collections_is_active ON public.seasonal_collections(is_active);
CREATE INDEX idx_seasonal_collections_collection_type ON public.seasonal_collections(collection_type);
CREATE INDEX idx_seasonal_collections_slug ON public.seasonal_collections(slug);

-- ============================================================================
-- TABLE 19: EMAIL SUBSCRIPTIONS
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.email_subscriptions (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  user_id TEXT REFERENCES public.users(id) ON DELETE SET NULL,
  email TEXT NOT NULL,
  first_name TEXT,
  last_name TEXT,
  subscription_types TEXT[] DEFAULT '{"promotional", "new_arrivals", "seasonal_updates"}',
  is_active BOOLEAN DEFAULT TRUE,
  consent_given BOOLEAN DEFAULT TRUE,
  consent_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_email_sent TIMESTAMP WITH TIME ZONE,
  unsubscribe_token TEXT UNIQUE,
  unsubscribe_date TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(email)
);

CREATE INDEX idx_email_subscriptions_user_id ON public.email_subscriptions(user_id);
CREATE INDEX idx_email_subscriptions_is_active ON public.email_subscriptions(is_active);
CREATE INDEX idx_email_subscriptions_email ON public.email_subscriptions(email);

-- ============================================================================
-- TABLE 20: EMAIL TEMPLATES
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.email_templates (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  name TEXT NOT NULL UNIQUE,
  subject TEXT NOT NULL,
  template_type TEXT NOT NULL CHECK (template_type IN (
    'promotional', 'new_arrivals', 'seasonal_updates', 'order_confirmation',
    'order_shipped', 'order_delivered', 'review_request', 'cart_abandoned'
  )),
  html_content TEXT NOT NULL,
  plain_text_content TEXT,
  variables JSONB DEFAULT '{}',
  is_active BOOLEAN DEFAULT TRUE,
  created_by TEXT REFERENCES public.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_email_templates_template_type ON public.email_templates(template_type);
CREATE INDEX idx_email_templates_is_active ON public.email_templates(is_active);

-- ============================================================================
-- TABLE 21: COOKIE CONSENTS
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.cookie_consents (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  user_id TEXT REFERENCES public.users(id) ON DELETE SET NULL,
  session_id TEXT,
  ip_address TEXT,
  essential_cookies BOOLEAN DEFAULT TRUE,
  analytics_cookies BOOLEAN DEFAULT FALSE,
  marketing_cookies BOOLEAN DEFAULT FALSE,
  preferences_cookies BOOLEAN DEFAULT FALSE,
  consent_version TEXT DEFAULT '1.0',
  consent_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_cookie_consents_user_id ON public.cookie_consents(user_id);
CREATE INDEX idx_cookie_consents_session_id ON public.cookie_consents(session_id);

-- ============================================================================
-- TABLE 22: PARTNER BRANDS
-- For "Explore More" section
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.partner_brands (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  logo_url TEXT,
  website_url TEXT,
  category TEXT DEFAULT 'community_partner',
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_partner_brands_is_active ON public.partner_brands(is_active);
CREATE INDEX idx_partner_brands_category ON public.partner_brands(category);

-- Pre-populate with example partners
INSERT INTO public.partner_brands (name, description, category, display_order, is_active)
VALUES
  ('Leenex', 'Premium eco-friendly fashion brand', 'community_partner', 1, true)
ON CONFLICT (name) DO NOTHING;

-- ============================================================================
-- TABLE 23: SIZE GUIDES
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.size_guides (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  product_type TEXT NOT NULL CHECK (product_type IN ('top', 'bottom', 'dress', 'other')),
  size_code TEXT NOT NULL,
  measurements JSONB NOT NULL,
  unit TEXT DEFAULT 'cm' CHECK (unit IN ('cm', 'inches')),
  description TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(product_type, size_code, unit)
);

CREATE INDEX idx_size_guides_product_type ON public.size_guides(product_type);
CREATE INDEX idx_size_guides_size_code ON public.size_guides(size_code);

-- ============================================================================
-- TABLE 24: ORDER TRACKING EVENTS
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.order_tracking_events (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  order_id TEXT NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL CHECK (event_type IN (
    'order_placed', 'payment_received', 'order_confirmed', 'order_processing',
    'order_shipped', 'in_transit', 'out_for_delivery', 'delivered',
    'cancelled', 'return_initiated', 'return_delivered', 'refunded'
  )),
  event_title TEXT NOT NULL,
  event_description TEXT,
  event_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  location TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_order_tracking_events_order_id ON public.order_tracking_events(order_id);
CREATE INDEX idx_order_tracking_events_event_type ON public.order_tracking_events(event_type);
CREATE INDEX idx_order_tracking_events_event_date ON public.order_tracking_events(event_date);

-- ============================================================================
-- TABLE 25: PACKAGING OPTIONS
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.packaging_options (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  packaging_type TEXT NOT NULL CHECK (packaging_type IN (
    'standard', 'premium', 'gift', 'eco-friendly', 'personalized'
  )),
  cost DECIMAL(10, 2) DEFAULT 0,
  is_available BOOLEAN DEFAULT TRUE,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

INSERT INTO public.packaging_options (name, description, packaging_type, cost, display_order, is_available)
VALUES
  ('Standard Packaging', 'Basic protective packaging', 'standard', 0, 1, true),
  ('Premium Packaging', 'Enhanced protective packaging with premium materials', 'premium', 50, 2, true),
  ('Gift Packaging', 'Beautiful gift wrapping suitable for presents', 'gift', 100, 3, true),
  ('Eco-Friendly Packaging', 'Sustainable and environmentally friendly materials', 'eco-friendly', 30, 4, true),
  ('Personalized Packaging', 'Custom personalized packaging with message', 'personalized', 150, 5, true)
ON CONFLICT (name) DO NOTHING;

-- ============================================================================
-- TABLE 26: CMS CONTENT
-- Content Management System for dynamic website content
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.cms_content (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  
  -- Content Identification
  key VARCHAR(255) NOT NULL UNIQUE,
  title VARCHAR(255) NOT NULL,
  content TEXT NOT NULL,
  
  -- Content Type
  type VARCHAR(50) DEFAULT 'text' CHECK (type IN ('text', 'rich-text', 'image', 'json')),
  
  -- Page/Section Assignment
  page VARCHAR(100) DEFAULT 'other' CHECK (page IN (
    'home', 'about', 'contact', 'help', 'policies', 'shipping', 'other'
  )),
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Metadata
  created_by VARCHAR(255),
  updated_by VARCHAR(255)
);

CREATE INDEX idx_cms_content_key ON public.cms_content(key);
CREATE INDEX idx_cms_content_page ON public.cms_content(page);
CREATE INDEX idx_cms_content_updated_at ON public.cms_content(updated_at DESC);

-- ============================================================================
-- EXTENDED FUNCTIONS (from schema_upgrade)
-- ============================================================================

-- Function to generate readable order number
CREATE OR REPLACE FUNCTION public.generate_order_number()
RETURNS TEXT
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN 'ORD-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-'
         || LPAD(NEXTVAL('public.order_number_seq')::TEXT, 6, '0');
END;
$$;

-- Function to decrease product stock on order placement
CREATE OR REPLACE FUNCTION public.decrement_product_stock(
  p_product_id  TEXT,
  p_qty         INTEGER,
  p_order_id    TEXT DEFAULT NULL
)
RETURNS VOID
LANGUAGE plpgsql
AS $$
BEGIN
  UPDATE public.products
  SET    stock_quantity = GREATEST(0, stock_quantity - p_qty)
  WHERE  id = p_product_id;

  INSERT INTO public.stock_movements (product_id, change_qty, reason, reference_id)
  VALUES (p_product_id, -p_qty, 'sale', p_order_id);
END;
$$;

-- Function to restock product
CREATE OR REPLACE FUNCTION public.restock_product(
  p_product_id  TEXT,
  p_qty         INTEGER,
  p_reason      TEXT   DEFAULT 'restock',
  p_notes       TEXT   DEFAULT NULL,
  p_admin_id    TEXT   DEFAULT NULL
)
RETURNS VOID
LANGUAGE plpgsql
AS $$
BEGIN
  UPDATE public.products
  SET    stock_quantity = stock_quantity + p_qty
  WHERE  id = p_product_id;

  INSERT INTO public.stock_movements (product_id, change_qty, reason, notes, performed_by)
  VALUES (p_product_id, p_qty, p_reason, p_notes, p_admin_id);
END;
$$;

-- Function to mark default shipping address
CREATE OR REPLACE FUNCTION public.set_default_shipping_address(
  p_user_id    TEXT,
  p_address_id TEXT
)
RETURNS VOID
LANGUAGE plpgsql
AS $$
BEGIN
  UPDATE public.shipping_addresses
  SET    is_default = FALSE
  WHERE  user_id = p_user_id AND id <> p_address_id;

  UPDATE public.shipping_addresses
  SET    is_default = TRUE
  WHERE  id = p_address_id AND user_id = p_user_id;
END;
$$;

-- Function to create order notification
CREATE OR REPLACE FUNCTION public.notify_order_status_change()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.status IS DISTINCT FROM OLD.status AND NEW.user_id IS NOT NULL THEN
    INSERT INTO public.notifications (user_id, title, message, type, related_order_id)
    VALUES (
      NEW.user_id,
      'Order ' || NEW.order_number || ' — ' || NEW.status,
      'Your order #' || NEW.order_number || ' status has been updated to: ' || NEW.status,
      'order',
      NEW.id
    );
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_order_status_notification ON public.orders;
CREATE TRIGGER trg_order_status_notification
  AFTER UPDATE ON public.orders
  FOR EACH ROW EXECUTE FUNCTION public.notify_order_status_change();

-- Function to mark review as verified purchase
CREATE OR REPLACE FUNCTION public.mark_verified_purchase()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  v_order_user_id TEXT;
BEGIN
  IF NEW.order_id IS NOT NULL AND NEW.user_id IS NOT NULL THEN
    SELECT user_id INTO v_order_user_id
    FROM   public.orders
    WHERE  id = NEW.order_id;

    IF v_order_user_id = NEW.user_id THEN
      NEW.verified_purchase := TRUE;
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_review_verified_purchase ON public.reviews;
CREATE TRIGGER trg_review_verified_purchase
  BEFORE INSERT ON public.reviews
  FOR EACH ROW EXECUTE FUNCTION public.mark_verified_purchase();

-- Function to log admin action
CREATE OR REPLACE FUNCTION public.log_admin_action(
  p_admin_id      TEXT,
  p_action        TEXT,
  p_resource_type TEXT,
  p_resource_id   TEXT   DEFAULT NULL,
  p_details       JSONB  DEFAULT NULL,
  p_ip_address    TEXT   DEFAULT NULL
)
RETURNS VOID
LANGUAGE plpgsql
AS $$
BEGIN
  INSERT INTO public.admin_activity_logs
    (admin_id, action, resource_type, resource_id, details, ip_address)
  VALUES
    (p_admin_id, p_action, p_resource_type, p_resource_id, p_details, p_ip_address);
END;
$$;

-- Function to get product average rating
CREATE OR REPLACE FUNCTION public.get_product_rating(p_product_id TEXT)
RETURNS TABLE (avg_rating NUMERIC, review_count BIGINT)
LANGUAGE sql
STABLE
AS $$
  SELECT
    ROUND(AVG(rating)::NUMERIC, 1) AS avg_rating,
    COUNT(*)                        AS review_count
  FROM public.reviews
  WHERE product_id = p_product_id
    AND is_approved = TRUE;
$$;

-- Function to get user order summary
CREATE OR REPLACE FUNCTION public.get_user_order_summary(p_user_id TEXT)
RETURNS TABLE (total_orders BIGINT, total_spent NUMERIC)
LANGUAGE sql
STABLE
AS $$
  SELECT
    COUNT(*)           AS total_orders,
    COALESCE(SUM(total_amount), 0) AS total_spent
  FROM public.orders
  WHERE user_id = p_user_id
    AND status <> 'Cancelled';
$$;

-- Function to clean up expired carts
CREATE OR REPLACE FUNCTION public.cleanup_stale_carts()
RETURNS INTEGER
LANGUAGE plpgsql
AS $$
DECLARE
  v_count INTEGER;
BEGIN
  DELETE FROM public.carts
  WHERE updated_at < NOW() - INTERVAL '90 days';

  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END;
$$;

-- ============================================================================
-- ROW LEVEL SECURITY (RLS)
-- NOTE: The Express backend uses SERVICE_ROLE_KEY and therefore bypasses RLS.
-- These policies protect direct Supabase client connections (e.g. future mobile).
-- ============================================================================

ALTER TABLE public.users               ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.measurements        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fit_profiles        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.carts               ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wishlist            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shipping_addresses  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders              ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews             ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.return_requests     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.return_policies     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_activity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stock_movements     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.discounts           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bundles             ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shipping_rates      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.seasonal_collections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_templates     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cookie_consents     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.partner_brands      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.size_guides         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_tracking_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.packaging_options   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cms_content         ENABLE ROW LEVEL SECURITY;

-- ─── PRODUCTS policies ───────────────────────────────────────────────────────
DROP POLICY IF EXISTS "products_public_read"   ON public.products;
CREATE POLICY "products_public_read"
  ON public.products FOR SELECT
  USING (true);

-- ─── MEASUREMENTS policies ───────────────────────────────────────────────────
DROP POLICY IF EXISTS "measurements_public_read" ON public.measurements;
CREATE POLICY "measurements_public_read"
  ON public.measurements FOR SELECT
  USING (is_active = true);

-- ─── REVIEWS policies ────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "reviews_public_read" ON public.reviews;
CREATE POLICY "reviews_public_read"
  ON public.reviews FOR SELECT
  USING (is_approved = true);

-- ─── RETURN POLICIES policies ────────────────────────────────────────────────
DROP POLICY IF EXISTS "return_policies_public_read" ON public.return_policies;
CREATE POLICY "return_policies_public_read"
  ON public.return_policies FOR SELECT
  USING (is_active = true);

-- ─── DISCOUNTS policies ──────────────────────────────────────────────────────
DROP POLICY IF EXISTS "discounts_public_read" ON public.discounts;
CREATE POLICY "discounts_public_read"
  ON public.discounts FOR SELECT
  USING (is_active = true);

-- ─── BUNDLES policies ────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "bundles_public_read" ON public.bundles;
CREATE POLICY "bundles_public_read"
  ON public.bundles FOR SELECT
  USING (is_active = true);

-- ─── SHIPPING RATES policies ─────────────────────────────────────────────────
DROP POLICY IF EXISTS "shipping_rates_public_read" ON public.shipping_rates;
CREATE POLICY "shipping_rates_public_read"
  ON public.shipping_rates FOR SELECT
  USING (true);

-- ─── SEASONAL COLLECTIONS policies ───────────────────────────────────────────
DROP POLICY IF EXISTS "collections_public_read" ON public.seasonal_collections;
CREATE POLICY "collections_public_read"
  ON public.seasonal_collections FOR SELECT
  USING (is_active = true);

-- ─── PARTNER BRANDS policies ─────────────────────────────────────────────────
DROP POLICY IF EXISTS "partner_brands_public_read" ON public.partner_brands;
CREATE POLICY "partner_brands_public_read"
  ON public.partner_brands FOR SELECT
  USING (is_active = true);

-- ─── SIZE GUIDES policies ────────────────────────────────────────────────────
DROP POLICY IF EXISTS "size_guides_public_read" ON public.size_guides;
CREATE POLICY "size_guides_public_read"
  ON public.size_guides FOR SELECT
  USING (is_active = true);

-- ─── PACKAGING OPTIONS policies ──────────────────────────────────────────────
DROP POLICY IF EXISTS "packaging_options_public_read" ON public.packaging_options;
CREATE POLICY "packaging_options_public_read"
  ON public.packaging_options FOR SELECT
  USING (is_available = true);

-- ─── CMS CONTENT policies ────────────────────────────────────────────────────
DROP POLICY IF EXISTS "cms_content_public_read" ON public.cms_content;
CREATE POLICY "cms_content_public_read"
  ON public.cms_content FOR SELECT
  USING (true);

-- ─── CMS CONTENT - INSERT policy (admin only) ────────────────────────────────
DROP POLICY IF EXISTS "cms_content_admin_insert" ON public.cms_content;
CREATE POLICY "cms_content_admin_insert"
  ON public.cms_content FOR INSERT
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid()::TEXT AND role = 'admin')
  );

-- ─── CMS CONTENT - UPDATE policy (admin only) ────────────────────────────────
DROP POLICY IF EXISTS "cms_content_admin_update" ON public.cms_content;
CREATE POLICY "cms_content_admin_update"
  ON public.cms_content FOR UPDATE
  USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid()::TEXT AND role = 'admin')
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid()::TEXT AND role = 'admin')
  );

-- ─── CMS CONTENT - DELETE policy (admin only) ────────────────────────────────
DROP POLICY IF EXISTS "cms_content_admin_delete" ON public.cms_content;
CREATE POLICY "cms_content_admin_delete"
  ON public.cms_content FOR DELETE
  USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid()::TEXT AND role = 'admin')
  );

-- ============================================================================
-- GRANT PERMISSIONS
-- ============================================================================
-- Grant select on all public tables to authenticated users
GRANT SELECT ON public.discounts, public.bundles, public.shipping_rates, 
  public.seasonal_collections, public.partner_brands, public.size_guides, 
  public.packaging_options, public.cms_content TO authenticated;

-- Grant all permissions to service role (for backend operations)
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO service_role;

-- ============================================================================
-- DEFAULT SEED DATA
-- ============================================================================

-- ─── Default Admin User ──────────────────────────────────────────────────────
-- Password is "admin123" — hashed with bcrypt (10 rounds).
INSERT INTO public.users (id, email, name, password_hash, role)
VALUES (
  'admin_001',
  'admin@grazel.com',
  'Grazel Admin',
  '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', -- bcrypt of "admin123"
  'admin'
)
ON CONFLICT (id) DO NOTHING;

-- ─── Default Measurements (Top) ──────────────────────────────────────────────
INSERT INTO public.measurements (fit_type, name, datatype, unit, description) VALUES
  ('top', 'Chest/Bust',      'decimal',  'cm', 'Full chest circumference at widest point'),
  ('top', 'Shoulder Width',  'decimal',  'cm', 'Measured across the back from shoulder to shoulder'),
  ('top', 'Waist',           'decimal',  'cm', 'Natural waist circumference'),
  ('top', 'Hip',             'decimal',  'cm', 'Hip circumference at widest point'),
  ('top', 'Bicep',           'decimal',  'cm', 'Upper arm circumference'),
  ('top', 'Wrist',           'decimal',  'cm', 'Wrist circumference'),
  ('top', 'Arm Length',      'decimal',  'cm', 'From shoulder seam to wrist bone'),
  ('top', 'Garment Length',  'decimal',  'cm', 'From highest point of shoulder to desired hem')
ON CONFLICT (fit_type, name) DO NOTHING;

-- ─── Default Measurements (Bottom) ───────────────────────────────────────────
INSERT INTO public.measurements (fit_type, name, datatype, unit, description) VALUES
  ('bottom', 'Waist',                'decimal', 'cm', 'Natural waist circumference'),
  ('bottom', 'Hip',                  'decimal', 'cm', 'Hip circumference at widest point'),
  ('bottom', 'Thigh Circumference',  'decimal', 'cm', 'Upper thigh circumference'),
  ('bottom', 'Calf Circumference',   'decimal', 'cm', 'Widest part of the calf'),
  ('bottom', 'Inseam',               'decimal', 'cm', 'From crotch seam to ankle'),
  ('bottom', 'Outseam',              'decimal', 'cm', 'From waistband to ankle on outer leg'),
  ('bottom', 'Ankle Opening',        'decimal', 'cm', 'Circumference of trouser opening at ankle')
ON CONFLICT (fit_type, name) DO NOTHING;

-- ─── Default Return Policies ─────────────────────────────────────────────────
INSERT INTO public.return_policies (title, value, sort_order) VALUES
  ('Return Window',   '30 days from delivery date',                              1),
  ('Condition',       'Unworn, with tags attached, in original packaging',        2),
  ('Refund Method',   'Original payment method; processed within 5–7 business days', 3),
  ('Exchanges',       'Free size exchange within 30 days of delivery',            4),
  ('Final Sale',      'Items marked as Final Sale are non-returnable',            5)
ON CONFLICT (title) DO NOTHING;

-- ============================================================================
-- END OF COMPLETE COMBINED SCHEMA
-- ============================================================================
-- TABLES CREATED (26):
--   Base schema (14 tables) + Upgrade schema (11 tables) + CMS (1 table)
--
-- All constraints, indexes, triggers, functions, and RLS policies are included.
-- Ready to run as a single complete migration script.
-- ============================================================================
