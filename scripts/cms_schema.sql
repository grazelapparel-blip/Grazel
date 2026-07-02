-- ============================================================================
-- GRAZEL CMS - CONTENT MANAGEMENT SYSTEM SCHEMA
-- ============================================================================
-- This schema creates the tables needed for the Content Management System
-- that allows admins to manage all website content dynamically.
-- ============================================================================

-- ─── Create CMS Content Table ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.cms_content (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
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

-- ─── Create Index on key for faster lookups ────────────────────────────────
CREATE INDEX idx_cms_content_key ON public.cms_content(key);
CREATE INDEX idx_cms_content_page ON public.cms_content(page);
CREATE INDEX idx_cms_content_updated_at ON public.cms_content(updated_at DESC);

-- ─── Enable RLS (Row Level Security) ──────────────────────────────────────
ALTER TABLE public.cms_content ENABLE ROW LEVEL SECURITY;

-- ─── RLS Policies ─────────────────────────────────────────────────────────
-- Allow anyone to read public content
CREATE POLICY "Allow public read" ON public.cms_content
  FOR SELECT USING (true);

-- Allow only admin to modify content
CREATE POLICY "Allow admin modify" ON public.cms_content
  FOR UPDATE, DELETE, INSERT
  USING (auth.role() = 'service_role' OR current_user_id = 'admin');

-- ─── Sample Content Data ──────────────────────────────────────────────────
-- Uncomment and customize as needed

/*
INSERT INTO public.cms_content (key, title, content, type, page) VALUES
  ('homepage_hero_title', 'Hero Title', 'Luxury Fashion Redefined', 'text', 'home'),
  ('homepage_hero_subtitle', 'Hero Subtitle', 'Discover exclusive collections curated for you', 'text', 'home'),
  ('homepage_featured_heading', 'Featured Section', 'This Season''s Trending Styles', 'text', 'home'),
  ('about_page_intro', 'About Us Intro', 'Grazel is a luxury fashion brand...', 'rich-text', 'about'),
  ('contact_page_text', 'Contact Intro', 'Get in touch with our team', 'text', 'contact'),
  ('footer_copyright', 'Footer Copyright', '© 2024 Grazel Atelier. All rights reserved.', 'text', 'other'),
  ('shipping_info', 'Shipping Information', 'Free shipping on orders above ₹1500', 'rich-text', 'shipping'),
  ('help_faq', 'Help Center FAQ', '[{"question": "How do I place an order?", "answer": "..."}]', 'json', 'help');
*/

-- ============================================================================
-- Schema Complete
-- ============================================================================
