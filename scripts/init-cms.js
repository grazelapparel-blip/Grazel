/**
 * ============================================================================
 * CMS Schema Initialization Script
 * ============================================================================
 * Run this script to create the cms_content table in Supabase
 * Command: node scripts/init-cms.js
 * ============================================================================
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials in .env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const CMS_SCHEMA = `
  CREATE TABLE IF NOT EXISTS public.cms_content (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    key VARCHAR(255) NOT NULL UNIQUE,
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    type VARCHAR(50) DEFAULT 'text' CHECK (type IN ('text', 'rich-text', 'image', 'json')),
    page VARCHAR(100) DEFAULT 'other' CHECK (page IN ('home', 'about', 'contact', 'help', 'policies', 'shipping', 'other')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by VARCHAR(255),
    updated_by VARCHAR(255)
  );

  CREATE INDEX IF NOT EXISTS idx_cms_content_key ON public.cms_content(key);
  CREATE INDEX IF NOT EXISTS idx_cms_content_page ON public.cms_content(page);
  CREATE INDEX IF NOT EXISTS idx_cms_content_updated_at ON public.cms_content(updated_at DESC);

  ALTER TABLE public.cms_content ENABLE ROW LEVEL SECURITY;

  DROP POLICY IF EXISTS "Allow public read" ON public.cms_content;
  DROP POLICY IF EXISTS "Allow admin modify" ON public.cms_content;

  CREATE POLICY "Allow public read" ON public.cms_content
    FOR SELECT USING (true);

  CREATE POLICY "Allow admin modify" ON public.cms_content
    FOR ALL USING (auth.role() = 'service_role');
`;

async function initializeSchema() {
  try {
    console.log('🔄 Initializing CMS schema...');

    // Execute schema creation
    const { error } = await supabase.rpc('exec', {
      sql: CMS_SCHEMA,
    }).catch(() => {
      // If rpc doesn't work, try direct SQL execution
      // Note: This requires proper Supabase setup
      return supabase.from('cms_content').select('count', { count: 'exact' });
    });

    if (error && error.message.includes('does not exist')) {
      console.log('⚠️  Table does not exist. Please run this SQL in Supabase SQL Editor:');
      console.log('\n' + CMS_SCHEMA);
      console.log('\n📝 Steps:');
      console.log('1. Go to https://app.supabase.com/');
      console.log('2. Select your project');
      console.log('3. Go to SQL Editor');
      console.log('4. Create new query');
      console.log('5. Paste the SQL above');
      console.log('6. Click Run\n');
      return;
    }

    // Verify table exists
    const { data: tables, error: listError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public');

    if (!listError && tables && tables.some((t) => t.table_name === 'cms_content')) {
      console.log('✅ CMS schema initialized successfully!');
      console.log('📊 Table created: cms_content');
      console.log('\n✨ You can now:');
      console.log('1. Go to Admin Dashboard → Content tab');
      console.log('2. Start creating content');
      console.log('3. Content will appear on your website automatically\n');
    } else {
      console.log('⚠️  Could not verify table creation.');
      console.log('📝 Please run the SQL in Supabase SQL Editor manually.');
    }
  } catch (error) {
    console.error('❌ Error initializing schema:', error.message);
    console.log('\n📝 Manual Setup:');
    console.log('1. Go to Supabase Dashboard → SQL Editor');
    console.log('2. Create new query');
    console.log('3. Run: ' + CMS_SCHEMA);
  }
}

initializeSchema();
