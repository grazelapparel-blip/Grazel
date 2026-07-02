-- ============================================================================
-- GRAZEL ATELIER - SCHEMA UPGRADE & EXTENSIONS
-- ============================================================================
-- This migration adds new tables and fields for enhanced e-commerce features
-- Run this after the base schema_complete.sql
-- ============================================================================

-- ============================================================================
-- 1. EXTEND PRODUCTS TABLE - Add customization and new fields
-- ============================================================================
ALTER TABLE products ADD COLUMN IF NOT EXISTS is_customizable BOOLEAN DEFAULT FALSE;
ALTER TABLE products ADD COLUMN IF NOT EXISTS customization_options JSONB DEFAULT '{}';
ALTER TABLE products ADD COLUMN IF NOT EXISTS seasonal_category TEXT CHECK (seasonal_category IN (
  'summer', 'winter', 'monsoon', 'autumn', 'diwali', 'eid', 'everyday', NULL
));
ALTER TABLE products ADD COLUMN IF NOT EXISTS is_bundle_eligible BOOLEAN DEFAULT TRUE;

-- ============================================================================
-- 2. EXTEND ORDERS TABLE - Add packaging and discount tracking
-- ============================================================================
ALTER TABLE orders ADD COLUMN IF NOT EXISTS packaging_type TEXT CHECK (packaging_type IN (
  'standard', 'premium', 'gift', 'eco-friendly', 'personalized', NULL
)) DEFAULT 'standard';
ALTER TABLE orders ADD COLUMN IF NOT EXISTS packaging_cost DECIMAL(10, 2) DEFAULT 0;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS applied_coupon_code TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS applied_discount_code UUID REFERENCES discounts(id) ON DELETE SET NULL;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS shipping_state TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS estimated_delivery_date DATE;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS actual_delivery_date DATE;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS custom_notes TEXT;

-- ============================================================================
-- 3. EXTEND ORDER_ITEMS TABLE - Add customization details
-- ============================================================================
ALTER TABLE order_items ADD COLUMN IF NOT EXISTS customization_details JSONB DEFAULT '{}';
ALTER TABLE order_items ADD COLUMN IF NOT EXISTS is_customizable_product BOOLEAN DEFAULT FALSE;
ALTER TABLE order_items ADD COLUMN IF NOT EXISTS return_eligible BOOLEAN DEFAULT TRUE;
ALTER TABLE order_items ADD COLUMN IF NOT EXISTS return_requested_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE order_items ADD COLUMN IF NOT EXISTS return_reason TEXT;

-- ============================================================================
-- 4. DISCOUNTS TABLE - Product, Category, and Bundle Discounts
-- ============================================================================
CREATE TABLE IF NOT EXISTS discounts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code TEXT UNIQUE NOT NULL,
  description TEXT,
  discount_type TEXT NOT NULL CHECK (discount_type IN ('percentage', 'fixed_amount', 'buy_more_save_more')),
  discount_value DECIMAL(10, 2) NOT NULL,
  max_discount_amount DECIMAL(10, 2),
  min_order_amount DECIMAL(10, 2) DEFAULT 0,
  applies_to TEXT NOT NULL CHECK (applies_to IN ('products', 'categories', 'bundles', 'all')),
  product_ids UUID[] DEFAULT '{}',
  category_ids TEXT[] DEFAULT '{}',
  bundle_ids UUID[] DEFAULT '{}',
  max_uses_per_customer INTEGER,
  total_max_uses INTEGER,
  current_uses INTEGER DEFAULT 0,
  start_date TIMESTAMP WITH TIME ZONE NOT NULL,
  end_date TIMESTAMP WITH TIME ZONE NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  is_stackable BOOLEAN DEFAULT FALSE,
  created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_discounts_code ON discounts(code);
CREATE INDEX idx_discounts_is_active ON discounts(is_active);
CREATE INDEX idx_discounts_end_date ON discounts(end_date);
CREATE INDEX idx_discounts_applies_to ON discounts(applies_to);

-- ============================================================================
-- 5. BUNDLES TABLE - Product Bundles and Combos
-- ============================================================================
CREATE TABLE IF NOT EXISTS bundles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  bundle_type TEXT NOT NULL CHECK (bundle_type IN ('pair_bundle', 'combo_bundle', 'save_more')),
  product_ids UUID[] NOT NULL,
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
  created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_bundles_is_active ON bundles(is_active);
CREATE INDEX idx_bundles_is_featured ON bundles(is_featured);
CREATE INDEX idx_bundles_bundle_type ON bundles(bundle_type);

-- ============================================================================
-- 6. SHIPPING RATES TABLE - State-based Shipping Costs
-- ============================================================================
CREATE TABLE IF NOT EXISTS shipping_rates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  state TEXT NOT NULL UNIQUE,
  base_shipping_cost DECIMAL(10, 2) NOT NULL DEFAULT 0,
  free_shipping_threshold DECIMAL(10, 2) NOT NULL DEFAULT 1500,
  estimated_delivery_days_min INTEGER DEFAULT 3,
  estimated_delivery_days_max INTEGER DEFAULT 7,
  is_serviceable BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_shipping_rates_state ON shipping_rates(state);
CREATE INDEX idx_shipping_rates_is_serviceable ON shipping_rates(is_serviceable);

-- Pre-populate Indian states with default shipping rates
INSERT INTO shipping_rates (state, base_shipping_cost, free_shipping_threshold, estimated_delivery_days_min, estimated_delivery_days_max, is_serviceable)
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
-- 7. SEASONAL COLLECTIONS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS seasonal_collections (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL UNIQUE,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  collection_type TEXT NOT NULL CHECK (collection_type IN (
    'summer', 'winter', 'monsoon', 'autumn', 'diwali', 'eid', 'other'
  )),
  banner_image TEXT,
  featured_products UUID[] DEFAULT '{}',
  is_active BOOLEAN DEFAULT TRUE,
  display_order INTEGER DEFAULT 0,
  start_date TIMESTAMP WITH TIME ZONE,
  end_date TIMESTAMP WITH TIME ZONE,
  created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_seasonal_collections_is_active ON seasonal_collections(is_active);
CREATE INDEX idx_seasonal_collections_collection_type ON seasonal_collections(collection_type);
CREATE INDEX idx_seasonal_collections_slug ON seasonal_collections(slug);

-- ============================================================================
-- 8. EMAIL SUBSCRIPTIONS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS email_subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
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

CREATE INDEX idx_email_subscriptions_user_id ON email_subscriptions(user_id);
CREATE INDEX idx_email_subscriptions_is_active ON email_subscriptions(is_active);
CREATE INDEX idx_email_subscriptions_email ON email_subscriptions(email);

-- ============================================================================
-- 9. EMAIL TEMPLATES TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS email_templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
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
  created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_email_templates_template_type ON email_templates(template_type);
CREATE INDEX idx_email_templates_is_active ON email_templates(is_active);

-- ============================================================================
-- 10. COOKIE CONSENTS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS cookie_consents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
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

CREATE INDEX idx_cookie_consents_user_id ON cookie_consents(user_id);
CREATE INDEX idx_cookie_consents_session_id ON cookie_consents(session_id);

-- ============================================================================
-- 11. PARTNER BRANDS TABLE (for "Explore More" section)
-- ============================================================================
CREATE TABLE IF NOT EXISTS partner_brands (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
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

CREATE INDEX idx_partner_brands_is_active ON partner_brands(is_active);
CREATE INDEX idx_partner_brands_category ON partner_brands(category);

-- Pre-populate with example partners
INSERT INTO partner_brands (name, description, category, display_order, is_active)
VALUES
  ('Leenex', 'Premium eco-friendly fashion brand', 'community_partner', 1, true)
ON CONFLICT (name) DO NOTHING;

-- ============================================================================
-- 12. SIZE GUIDE DATA TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS size_guides (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
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

CREATE INDEX idx_size_guides_product_type ON size_guides(product_type);
CREATE INDEX idx_size_guides_size_code ON size_guides(size_code);

-- ============================================================================
-- 13. ORDER TRACKING EVENTS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS order_tracking_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
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

CREATE INDEX idx_order_tracking_events_order_id ON order_tracking_events(order_id);
CREATE INDEX idx_order_tracking_events_event_type ON order_tracking_events(event_type);
CREATE INDEX idx_order_tracking_events_event_date ON order_tracking_events(event_date);

-- ============================================================================
-- 14. PACKAGING OPTIONS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS packaging_options (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
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

INSERT INTO packaging_options (name, description, packaging_type, cost, display_order, is_available)
VALUES
  ('Standard Packaging', 'Basic protective packaging', 'standard', 0, 1, true),
  ('Premium Packaging', 'Enhanced protective packaging with premium materials', 'premium', 50, 2, true),
  ('Gift Packaging', 'Beautiful gift wrapping suitable for presents', 'gift', 100, 3, true),
  ('Eco-Friendly Packaging', 'Sustainable and environmentally friendly materials', 'eco-friendly', 30, 4, true),
  ('Personalized Packaging', 'Custom personalized packaging with message', 'personalized', 150, 5, true)
ON CONFLICT (name) DO NOTHING;

-- ============================================================================
-- 15. EXTENDED RLS POLICIES FOR NEW TABLES
-- ============================================================================
ALTER TABLE discounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE bundles ENABLE ROW LEVEL SECURITY;
ALTER TABLE shipping_rates ENABLE ROW LEVEL SECURITY;
ALTER TABLE seasonal_collections ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE cookie_consents ENABLE ROW LEVEL SECURITY;
ALTER TABLE partner_brands ENABLE ROW LEVEL SECURITY;
ALTER TABLE size_guides ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_tracking_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE packaging_options ENABLE ROW LEVEL SECURITY;

-- Discounts: anyone can view active, admins manage
CREATE POLICY "Anyone can view active discounts" ON discounts
  FOR SELECT USING (is_active = true);

CREATE POLICY "Admins can view all discounts" ON discounts
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Only admins can manage discounts" ON discounts
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Only admins can update discounts" ON discounts
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Bundles: public view, admin manage
CREATE POLICY "Anyone can view active bundles" ON bundles
  FOR SELECT USING (is_active = true);

CREATE POLICY "Admins can manage bundles" ON bundles
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Shipping rates: public view, admin manage
CREATE POLICY "Anyone can view shipping rates" ON shipping_rates
  FOR SELECT USING (true);

CREATE POLICY "Admins can manage shipping rates" ON shipping_rates
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Seasonal collections: public view active, admin manage
CREATE POLICY "Anyone can view active collections" ON seasonal_collections
  FOR SELECT USING (is_active = true);

CREATE POLICY "Admins can manage collections" ON seasonal_collections
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Email subscriptions: users manage own, system view
CREATE POLICY "Users can manage own subscriptions" ON email_subscriptions
  FOR SELECT USING (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Users can update own subscriptions" ON email_subscriptions
  FOR UPDATE USING (auth.uid() = user_id);

-- Cookie consents: users view own
CREATE POLICY "Users can view own cookie consents" ON cookie_consents
  FOR SELECT USING (auth.uid() = user_id OR session_id IS NOT NULL);

-- Partner brands: public view
CREATE POLICY "Anyone can view active partner brands" ON partner_brands
  FOR SELECT USING (is_active = true);

-- Size guides: public view
CREATE POLICY "Anyone can view size guides" ON size_guides
  FOR SELECT USING (is_active = true);

-- Order tracking events: users view own order events
CREATE POLICY "Users can view tracking for own orders" ON order_tracking_events
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM orders
      WHERE orders.id = order_id AND orders.user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can view all tracking events" ON order_tracking_events
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Packaging options: public view
CREATE POLICY "Anyone can view packaging options" ON packaging_options
  FOR SELECT USING (is_available = true);

-- ============================================================================
-- 16. GRANT PERMISSIONS
-- ============================================================================
-- Grant select on all public tables to authenticated users
GRANT SELECT ON discounts, bundles, shipping_rates, seasonal_collections,
  partner_brands, size_guides, packaging_options TO authenticated;

-- Grant all permissions to service role (for backend operations)
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO service_role;

-- ============================================================================
-- 17. CREATE INDEXES FOR PERFORMANCE
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_products_is_customizable ON products(is_customizable);
CREATE INDEX IF NOT EXISTS idx_products_seasonal_category ON products(seasonal_category);
CREATE INDEX IF NOT EXISTS idx_orders_packaging_type ON orders(packaging_type);
CREATE INDEX IF NOT EXISTS idx_orders_shipping_state ON orders(shipping_state);
CREATE INDEX IF NOT EXISTS idx_order_items_return_eligible ON order_items(return_eligible);

-- ============================================================================
-- END OF MIGRATION
-- ============================================================================
