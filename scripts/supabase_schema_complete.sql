-- ============================================================================
-- GRAZEL ATELIER — SUPABASE COMPLETE SCHEMA
-- ============================================================================
-- Run this ENTIRE script in Supabase SQL Editor:
--   Dashboard → SQL Editor → New Query → Paste → Run
--
-- Architecture Notes:
--   • Uses a CUSTOM Express/JWT backend (NOT Supabase Auth)
--   • All primary keys are TEXT (not UUID) to match server.js ID generation
--   • Backend uses SERVICE_ROLE_KEY → bypasses RLS
--   • RLS policies are included for security completeness
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
  created_by                TEXT          REFERENCES public.users(id) ON DELETE SET NULL,
  created_at                TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  updated_at                TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_products_category      ON public.products (category);
CREATE INDEX IF NOT EXISTS idx_products_subcategory   ON public.products (subcategory);
CREATE INDEX IF NOT EXISTS idx_products_is_new        ON public.products (is_new_product);
CREATE INDEX IF NOT EXISTS idx_products_is_bestseller ON public.products (is_bestseller);
CREATE INDEX IF NOT EXISTS idx_products_is_pre_order  ON public.products (is_pre_order);
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
  created_at       TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_orders_user_id        ON public.orders (user_id);
CREATE INDEX IF NOT EXISTS idx_orders_status         ON public.orders (status);
CREATE INDEX IF NOT EXISTS idx_orders_payment_status ON public.orders (payment_status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at     ON public.orders (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_order_number   ON public.orders (order_number);

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
-- FUNCTIONS
-- ============================================================================

-- ─── FUNCTION: Generate Readable Order Number ────────────────────────────────
-- Called by the orders DEFAULT; also available standalone.
CREATE OR REPLACE FUNCTION public.generate_order_number()
RETURNS TEXT
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN 'ORD-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-'
         || LPAD(NEXTVAL('public.order_number_seq')::TEXT, 6, '0');
END;
$$;

-- ─── FUNCTION: Decrease Product Stock on Order Placement ─────────────────────
-- Called manually from the backend when an order is created.
-- Prevents stock from going below 0.
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

-- ─── FUNCTION: Restock Product ───────────────────────────────────────────────
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

-- ─── FUNCTION: Mark Default Shipping Address ─────────────────────────────────
-- Ensures only one address per user is the default.
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

-- ─── FUNCTION: Create Order Notification ─────────────────────────────────────
-- Inserts a user notification when an order status changes.
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

-- ─── FUNCTION: Mark Review as Verified Purchase ──────────────────────────────
-- Automatically sets verified_purchase = TRUE when the reviewer's user_id
-- matches the order's user_id.
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

-- ─── FUNCTION: Update Cart Timestamp ─────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.handle_cart_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_carts_updated_at ON public.carts;
CREATE TRIGGER trg_carts_updated_at
  BEFORE UPDATE ON public.carts
  FOR EACH ROW EXECUTE FUNCTION public.handle_cart_updated_at();

-- ─── FUNCTION: Log Admin Action ──────────────────────────────────────────────
-- Convenience function for inserting admin activity log entries.
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

-- ─── FUNCTION: Get Product Average Rating ────────────────────────────────────
-- Returns the average approved rating and review count for a product.
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

-- ─── FUNCTION: Get User Order Summary ────────────────────────────────────────
-- Returns total orders and total spend for a given user (admin overview).
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

-- ─── FUNCTION: Clean Up Expired Carts ────────────────────────────────────────
-- Clears carts that have not been updated in more than 90 days.
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

-- ─── USERS policies ──────────────────────────────────────────────────────────
-- Service role (backend) has full access; anon/authenticated are blocked by default.
-- (No direct RLS needed here since backend owns all user operations.)

-- ─── PRODUCTS policies ───────────────────────────────────────────────────────
DROP POLICY IF EXISTS "products_public_read"   ON public.products;
CREATE POLICY "products_public_read"
  ON public.products FOR SELECT
  USING (true);

-- Writes are handled exclusively by backend with service role key.

-- ─── MEASUREMENTS policies ───────────────────────────────────────────────────
DROP POLICY IF EXISTS "measurements_public_read" ON public.measurements;
CREATE POLICY "measurements_public_read"
  ON public.measurements FOR SELECT
  USING (is_active = true);

-- ─── FIT PROFILES policies ───────────────────────────────────────────────────
-- No auth.uid() available (custom JWT), so all access goes through backend.

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

-- ============================================================================
-- DEFAULT SEED DATA
-- ============================================================================

-- ─── Default Admin User ──────────────────────────────────────────────────────
-- Password is "admin123" — hashed with bcrypt (10 rounds).
-- The server also seeds this on startup via seedAdminToSupabase().
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
-- END OF SCHEMA
-- ============================================================================
-- TABLES CREATED (14):
--   1. users               — Auth users (email + Google OAuth)
--   2. products            — Product catalog (admin CRUD)
--   3. measurements        — Measurement field definitions (top/bottom)
--   4. fit_profiles        — User body measurements
--   5. carts               — Per-user shopping cart (JSONB items)
--   6. wishlist            — Saved products per user
--   7. shipping_addresses  — Saved delivery addresses
--   8. orders              — Customer orders (JSONB items)
--   9. reviews             — Product reviews and ratings
--  10. return_requests     — Customer return requests
--  11. return_policies     — Editable return policy entries
--  12. notifications       — User-facing notifications
--  13. admin_activity_logs — Admin audit trail
--  14. stock_movements     — Inventory change history
--
-- FUNCTIONS CREATED (9):
--   generate_order_number()        — Readable order number (ORD-YYYYMMDD-XXXXXX)
--   decrement_product_stock()      — Deduct stock + log movement on sale
--   restock_product()              — Add stock + log movement on restock
--   set_default_shipping_address() — Ensure one default address per user
--   notify_order_status_change()   — Insert notification on order status update
--   mark_verified_purchase()       — Auto-verify review against order owner
--   log_admin_action()             — Insert admin activity log entry
--   get_product_rating()           — Average rating + review count
--   get_user_order_summary()       — Total orders + spend for a user
--   cleanup_stale_carts()          — Remove carts idle > 90 days
--
-- TRIGGERS CREATED (9):
--   trg_users_updated_at               — auto updated_at on users
--   trg_products_updated_at            — auto updated_at on products
--   trg_measurements_updated_at        — auto updated_at on measurements
--   trg_fit_profiles_updated_at        — auto updated_at on fit_profiles
--   trg_carts_updated_at               — auto updated_at on carts
--   trg_shipping_addresses_updated_at  — auto updated_at on shipping_addresses
--   trg_orders_updated_at              — auto updated_at on orders
--   trg_reviews_updated_at             — auto updated_at on reviews
--   trg_return_requests_updated_at     — auto updated_at on return_requests
--   trg_return_policies_updated_at     — auto updated_at on return_policies
--   trg_order_status_notification      — notify user on order status change
--   trg_review_verified_purchase       — mark review as verified if order matches
-- ============================================================================
