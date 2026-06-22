import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { createClient } from '@supabase/supabase-js';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

// ─── Initialize Supabase (service role for full access) ───────────────────────
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

let supabase = null;
if (supabaseUrl && supabaseServiceKey) {
  supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  console.log('✓ Supabase initialized with service role key');
} else {
  console.warn('⚠ Supabase not configured — falling back to in-memory storage');
}

// ─── In-memory fallback (when Supabase is not available) ──────────────────────
// Pre-seed default admin so the app always has at least one admin account
const SALT_ROUNDS = 10;
const DEFAULT_ADMIN_HASH = String(bcrypt.hashSync('admin123', SALT_ROUNDS));

const mockUsers = new Map();
mockUsers.set('admin@grazel.com', {
  id: 'admin_001',
  email: 'admin@grazel.com',
  name: 'Grazel Admin',
  role: 'admin',
  password_hash: DEFAULT_ADMIN_HASH,
  created_at: new Date().toISOString(),
});

// ─── Startup: verify Supabase tables exist, then seed admin ─────────────────
// If the schema hasn't been run yet, we disable Supabase entirely so every
// route falls back to the in-memory store rather than returning 500 errors.
async function initSupabase() {
  if (!supabase) return;

  try {
    const { error } = await supabase
      .from('users')
      .select('id')
      .limit(1);

    if (error) {
      // 42P01 = undefined_table (schema not run yet)
      if (error.code === '42P01' || error.message?.includes('does not exist')) {
        console.warn('⚠  Supabase tables not found — switching to in-memory fallback.');
        console.warn('   Run scripts/supabase_schema_complete.sql in your Supabase SQL Editor.');
      } else {
        console.warn('⚠  Supabase connectivity error — switching to in-memory fallback:', error.message);
      }
      supabase = null;
      return;
    }

    console.log('✓ Supabase tables verified');

    // Tables exist — seed the default admin if absent
    const { data: existing, error: checkError } = await supabase
      .from('users')
      .select('id, email, password_hash')
      .eq('email', 'admin@grazel.com')
      .maybeSingle();

    if (checkError) {
      console.warn('⚠ Error checking for admin in Supabase:', checkError.message);
      supabase = null;
      return;
    }

    if (!existing) {
      console.log('[INIT] Seeding admin account to Supabase...');
      const { error: insertError } = await supabase.from('users').insert([{
        id: 'admin_001',
        email: 'admin@grazel.com',
        name: 'Grazel Admin',
        role: 'admin',
        password_hash: String(DEFAULT_ADMIN_HASH),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }]);
      
      if (insertError) {
        console.error('[INIT] Failed to seed admin:', insertError.message);
        supabase = null;
        return;
      }
      console.log('✓ Admin account seeded to Supabase with password: admin123');
    } else {
      console.log('✓ Supabase ready — admin account exists');
      console.log(`   Admin hash in DB: ${existing.password_hash ? existing.password_hash.substring(0, 20) + '...' : 'NULL'}`);
      // ALWAYS ensure the admin has the correct password hash so login never fails
      console.log('[INIT] Updating admin password hash to ensure it matches: admin123');
      const { error: updateErr } = await supabase.from('users').update({
        password_hash: String(DEFAULT_ADMIN_HASH),
        updated_at: new Date().toISOString(),
      }).eq('email', 'admin@grazel.com');
      if (updateErr) {
        console.error('[INIT] ERROR: Could not update admin password hash:', updateErr.message);
        console.error('[INIT] Admin login may fail. Try clearing Supabase and restarting.');
      } else {
        console.log('✓ Admin password_hash updated to match default: admin123');
      }
    }
  } catch (err) {
    console.warn('⚠  Supabase init failed — switching to in-memory fallback:', err.message);
    supabase = null;
  }
}


// ─── In-memory cart / product stores ─────────────────────────────────────────
const userCarts = new Map();
const mockProducts = [];

// ─── Local UUID helper (used when Supabase is unavailable) ───────────────────
function gen_random_uuid_text() {
  return `${Math.random().toString(36).slice(2,10)}-${Date.now().toString(36)}`;
}

// ─── Middleware ───────────────────────────────────────────────────────────────
const allowedOrigins = [
  'http://localhost:8080',
  'http://localhost:3001',
  process.env.FRONTEND_URL,
  process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null,
  process.env.VERCEL_BRANCH_URL ? `https://${process.env.VERCEL_BRANCH_URL}` : null,
].filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (e.g. curl, Postman, same-origin)
    const isVercelPreview = origin && /^https:\/\/[a-z0-9-]+\.vercel\.app$/i.test(origin);
    if (!origin || allowedOrigins.includes(origin) || isVercelPreview) {
      callback(null, true);
    } else {
      callback(new Error(`CORS policy: origin ${origin} not allowed`));
    }
  },
  credentials: true,
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

// Ensure Supabase init completes before any route runs (required on Vercel serverless)
const serverReady = (async () => {
  console.log('[STARTUP] In-memory admin credentials:');
  console.log(`   Email: admin@grazel.com`);
  console.log(`   Password: admin123`);
  console.log(`   Hash stored: ${DEFAULT_ADMIN_HASH.substring(0, 20)}...`);
  await initSupabase();
})();

app.use(async (req, res, next) => {
  try {
    await serverReady;
    next();
  } catch (err) {
    console.error('Server init failed:', err);
    res.status(500).json({ message: 'Server initialization failed' });
  }
});

// ─── Auth Middleware ──────────────────────────────────────────────────────────
const verifyToken = (req, res, next) => {
  const authHeader = req.headers.authorization;
  const token = authHeader?.split(' ')[1];
  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }
  try {
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
};

const requireAdmin = (req, res, next) => {
  if (req.user?.role !== 'admin') {
    return res.status(403).json({ error: 'Administrator access required' });
  }
  next();
};

// ─── Helpers ──────────────────────────────────────────────────────────────────
/**
 * Find a user by email.
 * Returns a normalised { id, email, name, role, password_hash } object or null.
 */
async function findUserByEmail(email) {
  const normalizedEmail = email.toLowerCase().trim();
  
  if (supabase) {
    // Explicitly select all columns including password_hash
    const { data, error } = await supabase
      .from('users')
      .select('id, email, name, role, password_hash, google_id, avatar, is_active')
      .eq('email', normalizedEmail)
      .maybeSingle();
    
    if (error) {
      console.warn('Supabase findUserByEmail error, using in-memory fallback:', error.message);
      const fallbackUser = mockUsers.get(normalizedEmail);
      console.log(`[findUserByEmail] Checking in-memory store for ${normalizedEmail}:`, fallbackUser ? 'FOUND' : 'NOT FOUND');
      return fallbackUser || null;
    }
    
    // If found in Supabase, ensure password_hash is a string and return it; otherwise fall back to in-memory
    if (data) {
      // Defensive: ensure password_hash is always a string if it exists
      if (data.password_hash && typeof data.password_hash !== 'string') {
        console.warn(`[findUserByEmail] Converting password_hash from ${typeof data.password_hash} to string`);
        data.password_hash = String(data.password_hash);
      }
      console.log(`[findUserByEmail] Found in Supabase: ${data.email}, has password_hash: ${!!data.password_hash}`);
      return data;
    }
    
    console.log(`[findUserByEmail] Not found in Supabase, checking in-memory for ${normalizedEmail}`);
  }
  
  const fallbackUser = mockUsers.get(normalizedEmail);
  console.log(`[findUserByEmail] In-memory result for ${normalizedEmail}:`, fallbackUser ? 'FOUND' : 'NOT FOUND');
  if (fallbackUser) {
    console.log(`[findUserByEmail] In-memory user has password_hash: ${!!fallbackUser.password_hash}`);
  }
  return fallbackUser || null;
}

/**
 * Find a user by their primary key (id).
 */
async function findUserById(id) {
  if (supabase) {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', id)
      .maybeSingle();
    if (error) {
      console.warn('Supabase findUserById error, using in-memory fallback:', error.message);
      // fall through to in-memory scan
    } else if (data) {
      return data;
    }
  }
  // Linear scan of the in-memory store
  for (const u of mockUsers.values()) {
    if (u.id === id) return u;
  }
  return null;
}

/**
 * Create a new user.
 * Returns the created user object or throws on failure.
 */
async function createUser({ id, email, name, role, password_hash, google_id, avatar }) {
  const now = new Date().toISOString();
  if (supabase) {
    const { data, error } = await supabase
      .from('users')
      .insert([{ id, email, name, role, password_hash, google_id, avatar, created_at: now, updated_at: now }])
      .select()
      .single();
    if (error) throw new Error(error.message);
    return data;
  }
  const user = { id, email, name, role, password_hash, google_id, avatar, created_at: now };
  mockUsers.set(email, user);
  return user;
}

/**
 * Update fields on an existing user (by id).
 */
async function updateUser(id, fields) {
  const now = new Date().toISOString();
  if (supabase) {
    const { data, error } = await supabase
      .from('users')
      .update({ ...fields, updated_at: now })
      .eq('id', id)
      .select()
      .single();
    if (error) throw new Error(error.message);
    return data;
  }
  const user = await findUserById(id);
  if (!user) throw new Error('User not found');
  Object.assign(user, fields);
  mockUsers.set(user.email, user);
  return user;
}

/**
 * Return the safe public view of a user (no password hash).
 */
function safeUser(u) {
  return { id: u.id, email: u.email, name: u.name, role: u.role };
}

/**
 * Sign a JWT token for a user.
 */
function signToken(user) {
  return jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
}

// ─── Health Check ─────────────────────────────────────────────────────────────
app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    supabase: supabase ? 'connected' : 'in-memory fallback',
    timestamp: new Date().toISOString(),
  });
});

app.get('/', (_req, res) => {
  res.json({ message: 'Grazel API Server', version: '2.0.0' });
});

// ─── PRODUCTS ─────────────────────────────────────────────────────────────────

// Helper: map camelCase product body to snake_case DB columns
function toDbProduct(body, id = null) {
  const now = new Date().toISOString();
  return {
    ...(id ? { id } : {}),
    name: body.name,
    description: body.description || null,
    price: Number(body.price) || 0,
    original_price: body.originalPrice != null ? Number(body.originalPrice) : (body.original_price != null ? Number(body.original_price) : null),
    discount: body.discount || 0,
    category: body.category,
    subcategory: body.subcategory || null,
    fabric: body.fabric || null,
    fit: body.fit || null,
    fit_type: body.fitType || body.fit_type || 'none',
    sizes: body.sizes || [],
    images: body.images || [],
    is_new_product: body.isNewProduct ?? body.isNew ?? body.is_new_product ?? false,
    is_bestseller: body.isBestseller ?? body.isBestSeller ?? body.is_bestseller ?? false,
    is_pre_order: body.isPreOrder ?? body.is_pre_order ?? false,
    pre_order_message: body.preOrderMessage || body.pre_order_message || null,
    care_instructions: body.careInstructions || body.care_instructions || [],
    composition: body.composition || null,
    delivery_returns: body.deliveryReturns || body.delivery_returns || null,
    return_window_days: body.returnWindowDays ?? body.return_window_days ?? 30,
    tailored_fit_measurements: body.tailoredFitMeasurements || body.tailored_fit_measurements || [],
    stock_quantity: body.stock_quantity || 0,
    updated_at: now,
  };
}
app.get('/api/products', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 100;

    if (supabase) {
      const from = (page - 1) * limit;
      const to = from + limit - 1;
      const { data, error, count } = await supabase
        .from('products')
        .select('*', { count: 'exact' })
        .range(from, to);

      if (error) {
        console.warn('GET /api/products Supabase error, falling back:', error.message);
        // Fall through to mock products below
      } else {
        return res.json({ products: data || [], total: count || 0, page, limit });
      }
    }

    // In-memory fallback — only respond 200 if there's actual data;
    // an empty array causes the frontend to show a blank catalog. Returning 503
    // instead triggers ProductContext's loadFallbackProducts() which uses the
    // static mock data bundled with the frontend.
    if (mockProducts.length === 0) {
      return res.status(503).json({ error: 'No products available — run schema or add products via admin.' });
    }
    res.json({ products: mockProducts, total: mockProducts.length, page: 1, limit: 100 });
  } catch (err) {
    console.error('GET /api/products error:', err);
    res.status(503).json({ error: 'Products unavailable — using client-side fallback.' });
  }
});

app.post('/api/products', verifyToken, requireAdmin, async (req, res) => {
  try {
    const id = `prod_${Date.now()}`;
    const now = new Date().toISOString();
    if (supabase) {
      const dbProduct = { ...toDbProduct(req.body, id), created_at: now };
      const { data, error } = await supabase.from('products').insert([dbProduct]).select().single();
      if (error) throw error;
      return res.status(201).json(data);
    }
    const product = { ...req.body, id, created_at: now };
    mockProducts.push(product);
    res.status(201).json(product);
  } catch (err) {
    console.error('POST /api/products error:', err);
    res.status(500).json({ error: 'Failed to add product' });
  }
});

app.put('/api/products/:id', verifyToken, requireAdmin, async (req, res) => {
  try {
    if (supabase) {
      const updates = toDbProduct(req.body);
      const { data, error } = await supabase
        .from('products')
        .update(updates)
        .eq('id', req.params.id)
        .select()
        .single();
      if (error) throw error;
      return res.json(data);
    }
    const idx = mockProducts.findIndex(p => p.id === req.params.id);
    if (idx === -1) return res.status(404).json({ error: 'Product not found' });
    mockProducts[idx] = { ...mockProducts[idx], ...req.body };
    res.json(mockProducts[idx]);
  } catch (err) {
    console.error('PUT /api/products/:id error:', err);
    res.status(500).json({ error: 'Failed to update product' });
  }
});

app.delete('/api/products/:id', verifyToken, requireAdmin, async (req, res) => {
  try {
    if (supabase) {
      const { error } = await supabase.from('products').delete().eq('id', req.params.id);
      if (error) throw error;
      return res.json({ message: 'Product deleted' });
    }
    const idx = mockProducts.findIndex(p => p.id === req.params.id);
    if (idx !== -1) mockProducts.splice(idx, 1);
    res.json({ message: 'Product deleted' });
  } catch (err) {
    console.error('DELETE /api/products/:id error:', err);
    res.status(500).json({ error: 'Failed to delete product' });
  }
});

// ─── CART ─────────────────────────────────────────────────────────────────────
app.get('/api/cart', verifyToken, async (req, res) => {
  try {
    const userId = req.user.id;
    if (supabase) {
      const { data, error } = await supabase
        .from('carts')
        .select('items')
        .eq('user_id', userId)
        .maybeSingle();
      if (error) throw error;
      return res.json(data?.items || []);
    }
    res.json(userCarts.get(userId) || []);
  } catch (err) {
    console.error('GET /api/cart error:', err);
    res.status(500).json({ error: 'Failed to fetch cart' });
  }
});

app.post('/api/cart', verifyToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { items } = req.body;
    if (!Array.isArray(items)) {
      return res.status(400).json({ error: 'Items must be an array' });
    }

    if (supabase) {
      const { data, error } = await supabase
        .from('carts')
        .upsert({ user_id: userId, items, updated_at: new Date().toISOString() }, { onConflict: 'user_id' })
        .select('items')
        .single();
      if (error) throw error;
      return res.json(data?.items || items);
    }

    userCarts.set(userId, items);
    res.json(items);
  } catch (err) {
    console.error('POST /api/cart error:', err);
    res.status(500).json({ error: 'Failed to update cart' });
  }
});

app.delete('/api/cart', verifyToken, async (req, res) => {
  try {
    const userId = req.user.id;
    if (supabase) {
      const { error } = await supabase.from('carts').delete().eq('user_id', userId);
      if (error) throw error;
      return res.json({ message: 'Cart cleared' });
    }
    userCarts.delete(userId);
    res.json({ message: 'Cart cleared' });
  } catch (err) {
    console.error('DELETE /api/cart error:', err);
    res.status(500).json({ error: 'Failed to clear cart' });
  }
});

// ─── AUTHENTICATION ───────────────────────────────────────────────────────────

// REGISTER
app.post('/api/auth/register', async (req, res) => {
  try {
    const { name, email, password, role = 'user' } = req.body;

    if (!email || !password || !name) {
      return res.status(400).json({ message: 'Name, email and password are required' });
    }

    if (password.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters' });
    }

    // Normalize email
    const normalizedEmail = email.toLowerCase().trim();

    // Check for existing user
    const existing = await findUserByEmail(normalizedEmail);
    if (existing) {
      return res.status(409).json({ message: 'An account with this email already exists' });
    }

    const password_hash = await bcrypt.hash(password, SALT_ROUNDS);
    const userId = `user_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;

    const newUser = await createUser({
      id: userId,
      email: normalizedEmail,
      name,
      role,
      password_hash,
      google_id: null,
      avatar: null,
    });

    const token = signToken(newUser);

    res.status(201).json({
      success: true,
      message: 'Registration successful',
      token,
      user: safeUser(newUser),
    });
  } catch (err) {
    console.error('POST /api/auth/register error:', err);
    res.status(500).json({ message: err.message || 'Registration failed. Please try again.' });
  }
});

// LOGIN
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    // Normalize email to lowercase
    const normalizedEmail = email.toLowerCase().trim();
    console.log(`[LOGIN] Attempting login for: ${normalizedEmail}`);

    const user = await findUserByEmail(normalizedEmail);
    if (!user) {
      console.warn(`[LOGIN] User not found for ${normalizedEmail}`);
      console.warn(`[LOGIN] Available users in mockUsers: ${Array.from(mockUsers.keys()).join(', ')}`);
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    console.log(`[LOGIN] User found: ${user.email}, checking password...`);
    console.log(`[LOGIN] User object has password_hash:`, !!user.password_hash);
    console.log(`[LOGIN] Password hash type:`, typeof user.password_hash);
    console.log(`[LOGIN] Password hash length:`, user.password_hash?.length || 0);

    if (!user.password_hash) {
      console.warn(`[LOGIN] User ${normalizedEmail} has no password hash (Google-only account)`);
      return res.status(401).json({ message: 'This account uses Google Sign-In only' });
    }

    // Ensure password_hash is a string (defensive)
    let passwordHashStr = user.password_hash;
    if (typeof passwordHashStr !== 'string') {
      console.warn(`[LOGIN] Password hash is not a string (type: ${typeof passwordHashStr}), converting...`);
      passwordHashStr = String(passwordHashStr);
    }

    console.log(`[LOGIN] Comparing password (${password.length} chars) against hash (${passwordHashStr.length} chars)`);
    const passwordValid = await bcrypt.compare(password, passwordHashStr);
    console.log(`[LOGIN] Password validation for ${normalizedEmail}:`, passwordValid ? 'VALID' : 'INVALID');
    
    if (!passwordValid) {
      console.warn(`[LOGIN] Invalid password for ${normalizedEmail}`);
      // Debug: also try comparing with the default admin hash directly
      if (normalizedEmail === 'admin@grazel.com') {
        const defaultHashValid = await bcrypt.compare(password, DEFAULT_ADMIN_HASH);
        console.warn(`[LOGIN] DEBUG: Comparing against DEFAULT_ADMIN_HASH directly:`, defaultHashValid ? 'VALID' : 'INVALID');
      }
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    console.log(`✓ Login successful for ${normalizedEmail}`);
    const token = signToken(user);

    res.json({
      success: true,
      token,
      user: safeUser(user),
    });
  } catch (err) {
    console.error('POST /api/auth/login error:', err);
    res.status(500).json({ message: err.message || 'Login failed. Please try again.' });
  }
});

// GOOGLE AUTH
// Handle the OAuth redirect callback (GET) from Google's popup flow.
// After the user authenticates in the popup, Google redirects here.
// We serve a minimal HTML page that sends the id_token to the opener
// via postMessage, then closes the popup.
app.get('/api/auth/google', (req, res) => {
  res.set('Content-Type', 'text/html');
  res.send(`<!DOCTYPE html>
<html><head><title>Signing in...</title></head>
<body><script>
(function(){
  try {
    var hash = window.location.hash.substring(1);
    var params = new URLSearchParams(hash);
    var idToken = params.get('id_token');
    if (idToken && window.opener) {
      window.opener.postMessage({ type: 'google-credential', credential: idToken }, '*');
    }
  } catch(e) {}
  try { window.close(); } catch(e) {}
  document.body.innerText = 'Authentication successful. You may close this window.';
})();
<\/script></body></html>`);
});

app.post('/api/auth/google', async (req, res) => {
  try {
    const { googleId, email, name = 'User', avatar } = req.body;

    if (!email || !googleId) {
      return res.status(400).json({ message: 'Google ID and email are required' });
    }

    let user = await findUserByEmail(email);

    if (user) {
      // Update existing user's Google info
      user = await updateUser(user.id, { google_id: googleId, avatar: avatar || user.avatar, name: name || user.name });
    } else {
      // Create new user via Google
      const userId = `google_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
      user = await createUser({
        id: userId,
        email,
        name,
        role: 'user',
        password_hash: null,
        google_id: googleId,
        avatar,
      });
    }

    const token = signToken(user);

    res.json({
      success: true,
      token,
      user: safeUser(user),
    });
  } catch (err) {
    console.error('POST /api/auth/google error:', err);
    res.status(500).json({ message: err.message || 'Google authentication failed. Please try again.' });
  }
});

// GET CURRENT USER
app.get('/api/auth/me', verifyToken, async (req, res) => {
  try {
    const user = await findUserById(req.user.id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json(safeUser(user));
  } catch (err) {
    console.error('GET /api/auth/me error:', err);
    res.status(500).json({ message: 'Failed to verify session' });
  }
});

// LIST ALL USERS (Admin only)
app.get('/api/auth/users', verifyToken, requireAdmin, async (req, res) => {
  try {
    if (supabase) {
      const { data, error } = await supabase
        .from('users')
        .select('id, email, name, role, google_id, created_at, updated_at')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return res.json(data || []);
    }

    // Fallback: return in-memory users (without password hashes)
    const users = Array.from(mockUsers.values()).map(safeUser);
    res.json(users);
  } catch (err) {
    console.error('GET /api/auth/users error:', err);
    res.status(500).json({ message: 'Failed to fetch users' });
  }
});

// ─── ORDERS ───────────────────────────────────────────────────────────────────

// LIST orders (admin only)
app.get('/api/orders', verifyToken, requireAdmin, async (req, res) => {
  try {
    if (supabase) {
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return res.json(data || []);
    }
    res.json([]);
  } catch (err) {
    console.error('GET /api/orders error:', err);
    res.status(500).json({ error: 'Failed to fetch orders' });
  }
});

// LIST current user's own orders
app.get('/api/orders/my', verifyToken, async (req, res) => {
  try {
    const userId = req.user.id;
    if (supabase) {
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return res.json(data || []);
    }
    res.json([]);
  } catch (err) {
    console.error('GET /api/orders/my error:', err);
    res.status(500).json({ error: 'Failed to fetch your orders' });
  }
});

// CREATE order (authenticated or guest checkout)
app.post('/api/orders', async (req, res) => {
  try {
    const {
      userId,
      customerName,
      customerEmail,
      shippingAddress,
      totalAmount,
      items = [],
      paymentMethod,
      notes,
    } = req.body;

    if (!customerName || !customerEmail || !shippingAddress || !items.length) {
      return res.status(400).json({ message: 'customerName, customerEmail, shippingAddress, and items are required' });
    }

    // Give each embedded item a stable id so ReviewOrderPage can reference it
    const itemsWithIds = items.map((item, idx) => ({
      id: `item_${Date.now()}_${idx}`,
      ...item,
    }));

    const orderId = `ord_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    const now = new Date().toISOString();

    if (supabase) {
      const { data, error } = await supabase
        .from('orders')
        .insert([{
          id: orderId,
          user_id: userId || null,
          customer_name: customerName,
          customer_email: customerEmail,
          shipping_address: shippingAddress,
          total_amount: totalAmount,
          subtotal: totalAmount,
          items: itemsWithIds,
          status: 'Pending',
          payment_method: paymentMethod || null,
          payment_status: 'pending',
          notes: notes || null,
          created_at: now,
          updated_at: now,
        }])
        .select()
        .single();

      if (error) throw error;

      // Decrement stock for each item (best-effort, non-blocking)
      for (const item of itemsWithIds) {
        if (item.productId) {
          try {
            await supabase.rpc('decrement_product_stock', {
              p_product_id: item.productId,
              p_qty: item.quantity || 1,
              p_order_id: orderId,
            });
          } catch (err) {
            console.warn('Stock decrement warning:', err.message);
          }
        }
      }

      return res.status(201).json(data);
    }

    // In-memory fallback
    const order = {
      id: orderId,
      user_id: userId || null,
      customer_name: customerName,
      customer_email: customerEmail,
      shipping_address: shippingAddress,
      total_amount: totalAmount,
      subtotal: totalAmount,
      items: itemsWithIds,
      status: 'Pending',
      payment_status: 'pending',
      created_at: now,
      updated_at: now,
    };
    res.status(201).json(order);
  } catch (err) {
    console.error('POST /api/orders error:', err);
    res.status(500).json({ message: err.message || 'Failed to place order' });
  }
});

// UPDATE order status (admin only)
app.put('/api/orders/:id/status', verifyToken, requireAdmin, async (req, res) => {
  try {
    const { status } = req.body;
    const validStatuses = ['Pending','Confirmed','Processing','Shipped','Delivered','Cancelled','Returned'];
    if (!status || !validStatuses.includes(status)) {
      return res.status(400).json({ message: `status must be one of: ${validStatuses.join(', ')}` });
    }

    if (supabase) {
      const { data, error } = await supabase
        .from('orders')
        .update({ status, updated_at: new Date().toISOString() })
        .eq('id', req.params.id)
        .select()
        .single();
      if (error) throw error;
      return res.json(data);
    }
    res.json({ id: req.params.id, status });
  } catch (err) {
    console.error('PUT /api/orders/:id/status error:', err);
    res.status(500).json({ message: 'Failed to update order status' });
  }
});

// ─── REVIEWS ──────────────────────────────────────────────────────────────────

// GET reviews for a product
app.get('/api/reviews', async (req, res) => {
  try {
    const { productId } = req.query;
    if (supabase) {
      let query = supabase
        .from('reviews')
        .select('*')
        .eq('is_approved', true)
        .order('created_at', { ascending: false });
      if (productId) query = query.eq('product_id', productId);
      const { data, error } = await query;
      if (error) throw error;
      return res.json(data || []);
    }
    res.json([]);
  } catch (err) {
    console.error('GET /api/reviews error:', err);
    res.status(500).json({ error: 'Failed to fetch reviews' });
  }
});

// POST a review (after checkout)
app.post('/api/reviews', async (req, res) => {
  try {
    const { productId, productName, orderId, orderItemId, customerName, rating, title, comment } = req.body;

    if (!productId || !customerName || !rating) {
      return res.status(400).json({ message: 'productId, customerName and rating are required' });
    }
    if (rating < 1 || rating > 5) {
      return res.status(400).json({ message: 'rating must be between 1 and 5' });
    }

    const token = req.headers.authorization?.split(' ')[1];
    let userId = null;
    if (token) {
      try { userId = jwt.verify(token, JWT_SECRET)?.id; } catch {}
    }

    const reviewId = `rev_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    const now = new Date().toISOString();

    if (supabase) {
      const { data, error } = await supabase
        .from('reviews')
        .insert([{
          id: reviewId,
          product_id: productId,
          order_id: orderId || null,
          order_item_id: orderItemId || null,
          user_id: userId,
          customer_name: customerName,
          rating,
          title: title || null,
          comment: comment || null,
          is_approved: true,
          created_at: now,
          updated_at: now,
        }])
        .select()
        .single();

      if (error) {
        // Duplicate review for order_item_id — return 409
        if (error.code === '23505') {
          return res.status(409).json({ message: 'You have already reviewed this item' });
        }
        throw error;
      }
      return res.status(201).json(data);
    }

    res.status(201).json({ id: reviewId, product_id: productId, rating, customer_name: customerName, created_at: now });
  } catch (err) {
    console.error('POST /api/reviews error:', err);
    res.status(500).json({ message: err.message || 'Failed to save review' });
  }
});

// ─── FIT PROFILES ─────────────────────────────────────────────────────────────

// GET current user's fit profile
app.get('/api/fit-profile/me', verifyToken, async (req, res) => {
  try {
    const userId = req.user.id;
    if (supabase) {
      const { data, error } = await supabase
        .from('fit_profiles')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      return res.json(data || null);
    }
    res.json(null);
  } catch (err) {
    console.error('GET /api/fit-profile/me error:', err);
    res.status(500).json({ error: 'Failed to fetch fit profile' });
  }
});

// POST / upsert fit profile
app.post('/api/fit-profile', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    let userId = req.body.userId || null;
    if (token) {
      try { userId = jwt.verify(token, JWT_SECRET)?.id || userId; } catch {}
    }

    const {
      type, height, weight, chest, shoulderWidth, waist, hip,
      bicep, wrist, armLength, garmentLength, recommendedSize,
    } = req.body;

    if (!type || !['simple', 'detailed'].includes(type)) {
      return res.status(400).json({ message: 'type must be "simple" or "detailed"' });
    }

    const profileId = `fit_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    const now = new Date().toISOString();

    const payload = {
      id: profileId,
      user_id: userId || null,
      type,
      height: height || null,
      weight: weight || null,
      chest: chest || null,
      shoulder_width: shoulderWidth || null,
      waist: waist || null,
      hip: hip || null,
      bicep: bicep || null,
      wrist: wrist || null,
      arm_length: armLength || null,
      garment_length: garmentLength || null,
      recommended_size: recommendedSize || null,
      created_at: now,
      updated_at: now,
    };

    if (supabase) {
      if (userId) {
        // Upsert — replace existing profile for this user
        const { data: existing } = await supabase
          .from('fit_profiles')
          .select('id')
          .eq('user_id', userId)
          .maybeSingle();

        if (existing) {
          const { data, error } = await supabase
            .from('fit_profiles')
            .update({ ...payload, id: existing.id, updated_at: now })
            .eq('id', existing.id)
            .select()
            .single();
          if (error) throw error;
          return res.json(data);
        }
      }

      const { data, error } = await supabase
        .from('fit_profiles')
        .insert([payload])
        .select()
        .single();
      if (error) throw error;
      return res.json(data);
    }

    res.status(201).json({ ...payload, id: profileId });
  } catch (err) {
    console.error('POST /api/fit-profile error:', err);
    res.status(500).json({ message: err.message || 'Failed to save fit profile' });
  }
});

// ─── MEASUREMENTS ─────────────────────────────────────────────────────────────

// GET all measurements (optionally filtered by fitType)
app.get('/api/measurements', async (req, res) => {
  try {
    const { fitType } = req.query;
    if (supabase) {
      let query = supabase
        .from('measurements')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: true });
      if (fitType) query = query.eq('fit_type', fitType);
      const { data, error } = await query;
      if (error) throw error;
      return res.json(data || []);
    }
    res.json([]);
  } catch (err) {
    console.error('GET /api/measurements error:', err);
    res.status(500).json({ error: 'Failed to fetch measurements' });
  }
});

// POST create measurement (admin only)
app.post('/api/measurements', verifyToken, requireAdmin, async (req, res) => {
  try {
    const { fitType, name, datatype = 'decimal', description, unit } = req.body;
    if (!fitType || !name) {
      return res.status(400).json({ message: 'fitType and name are required' });
    }

    const measurementId = gen_random_uuid_text();
    const now = new Date().toISOString();

    if (supabase) {
      const { data, error } = await supabase
        .from('measurements')
        .insert([{ id: measurementId, fit_type: fitType, name, datatype, description: description || null, unit: unit || null, created_at: now, updated_at: now }])
        .select()
        .single();
      if (error) {
        if (error.code === '23505') return res.status(409).json({ message: `Measurement "${name}" already exists for ${fitType}` });
        throw error;
      }
      return res.status(201).json(data);
    }
    res.status(201).json({ id: measurementId, fit_type: fitType, name, datatype, created_at: now });
  } catch (err) {
    console.error('POST /api/measurements error:', err);
    res.status(500).json({ message: err.message || 'Failed to add measurement' });
  }
});

// PUT update measurement (admin only)
app.put('/api/measurements/:id', verifyToken, requireAdmin, async (req, res) => {
  try {
    const { name, datatype, description, unit, is_active } = req.body;
    if (supabase) {
      const updates = {};
      if (name !== undefined) updates.name = name;
      if (datatype !== undefined) updates.datatype = datatype;
      if (description !== undefined) updates.description = description;
      if (unit !== undefined) updates.unit = unit;
      if (is_active !== undefined) updates.is_active = is_active;
      updates.updated_at = new Date().toISOString();

      const { data, error } = await supabase
        .from('measurements')
        .update(updates)
        .eq('id', req.params.id)
        .select()
        .single();
      if (error) throw error;
      return res.json(data);
    }
    res.json({ id: req.params.id, ...req.body });
  } catch (err) {
    console.error('PUT /api/measurements/:id error:', err);
    res.status(500).json({ message: 'Failed to update measurement' });
  }
});

// DELETE measurement (admin only)
app.delete('/api/measurements/:id', verifyToken, requireAdmin, async (req, res) => {
  try {
    if (supabase) {
      // Soft-delete: mark inactive rather than hard delete
      const { error } = await supabase
        .from('measurements')
        .update({ is_active: false, updated_at: new Date().toISOString() })
        .eq('id', req.params.id);
      if (error) throw error;
      return res.json({ message: 'Measurement deleted' });
    }
    res.json({ message: 'Measurement deleted' });
  } catch (err) {
    console.error('DELETE /api/measurements/:id error:', err);
    res.status(500).json({ message: 'Failed to delete measurement' });
  }
});

// ─── Error Handling ───────────────────────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err.stack);
  res.status(500).json({ error: 'Internal server error' });
});

app.use((req, res) => {
  res.status(404).json({ error: `Route not found: ${req.method} ${req.path}` });
});

// ─── Start (local dev only — Vercel uses api/index.js) ───────────────────────
if (!process.env.VERCEL) {
  serverReady.then(() => {
    app.listen(PORT, () => {
      console.log(`\n🚀 Grazel API Server running at http://localhost:${PORT}`);
      console.log(`   Storage: ${supabase ? 'Supabase (PostgreSQL)' : 'In-memory (fallback)'}`);
      console.log(`   Admin credentials: admin@grazel.com / admin123\n`);
    });
  });
}

export default app;
