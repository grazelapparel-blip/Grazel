/**
 * scripts/seed-products.js
 * Seeds the Supabase `products` table with the static mock product catalogue.
 * Run once:  node scripts/seed-products.js
 */
import dotenv from 'dotenv';
dotenv.config();

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SERVICE_KEY  = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error('Missing VITE_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env');
  process.exit(1);
}

const API = `${SUPABASE_URL}/rest/v1/products`;
const HEADERS = {
  'Content-Type': 'application/json',
  'apikey': SERVICE_KEY,
  'Authorization': `Bearer ${SERVICE_KEY}`,
  'Prefer': 'resolution=merge-duplicates',   // upsert — safe to re-run
};

// ─── Product catalogue (mirrors src/data/products.ts) ────────────────────────
const products = [
  {
    id: '1', name: 'Tailored Wool Blazer', price: 495,
    category: 'men', subcategory: 'blazers', color: 'Charcoal', fabric: 'Wool', fit: 'Slim', fit_type: 'top',
    sizes: ['S','M','L','XL'],
    images: ['https://images.unsplash.com/photo-1591047990975-36ce1a0a95a8?w=400&h=600&fit=crop','https://images.unsplash.com/photo-1552062407-c551eeda4098?w=400&h=600&fit=crop'],
    is_new_product: true, is_pre_order: true, pre_order_message: 'Ships in 3-4 weeks',
    description: 'A refined tailored blazer crafted from premium Italian wool, featuring a slim silhouette and subtle horn buttons.',
    care_instructions: ['Dry clean only','Store on padded hanger','Steam to remove wrinkles'],
    composition: '100% Virgin Wool', return_window_days: 30, stock_quantity: 12,
  },
  {
    id: '2', name: 'Cashmere Crewneck Sweater', price: 325,
    category: 'men', subcategory: 'knitwear', color: 'Navy', fabric: 'Cashmere', fit: 'Regular', fit_type: 'top',
    sizes: ['S','M','L','XL','XXL'],
    images: ['https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400&h=600&fit=crop','https://images.unsplash.com/photo-1556821552-9f63f23d9bfc?w=400&h=600&fit=crop'],
    is_bestseller: true,
    description: 'Luxuriously soft cashmere sweater with a classic crewneck silhouette.',
    care_instructions: ['Hand wash cold','Lay flat to dry','Store folded'],
    composition: '100% Cashmere', return_window_days: 30, stock_quantity: 18,
  },
  {
    id: '3', name: 'Cotton Oxford Shirt', price: 165,
    category: 'men', subcategory: 'shirts', color: 'White', fabric: 'Cotton', fit: 'Regular', fit_type: 'top',
    sizes: ['S','M','L','XL'],
    images: ['https://images.unsplash.com/photo-1503341455253-b2b723bb9e8b?w=400&h=600&fit=crop'],
    description: 'Essential oxford shirt in premium cotton with mother-of-pearl buttons.',
    care_instructions: ['Machine wash cold','Iron on medium heat','Tumble dry low'],
    composition: '100% Cotton', return_window_days: 30, stock_quantity: 25,
  },
  {
    id: '4', name: 'Pleated Wool Trousers', price: 285,
    category: 'men', subcategory: 'trousers', color: 'Charcoal', fabric: 'Wool', fit: 'Regular', fit_type: 'bottom',
    sizes: ['28','30','32','34','36'],
    images: ['https://images.unsplash.com/photo-1473999505340-cb870c50cf1b?w=400&h=600&fit=crop','https://images.unsplash.com/photo-1506629082632-11c87b2e7dee?w=400&h=600&fit=crop'],
    is_new_product: true,
    description: 'Classic pleated trousers in fine wool suiting fabric.',
    care_instructions: ['Dry clean only','Hang to store'],
    composition: '98% Wool, 2% Elastane', return_window_days: 30, stock_quantity: 15,
  },
  {
    id: '5', name: 'Silk Midi Dress', price: 595,
    category: 'women', subcategory: 'dresses', color: 'Ivory', fabric: 'Silk', fit: 'Regular', fit_type: 'none',
    sizes: ['XS','S','M','L'],
    images: ['https://images.unsplash.com/photo-1595831572513-4eb9651c1da1?w=400&h=600&fit=crop'],
    is_new_product: true, is_bestseller: true,
    description: 'Elegant midi dress in flowing silk with a subtle drape.',
    care_instructions: ['Dry clean only','Store on padded hanger'],
    composition: '100% Silk', return_window_days: 30, stock_quantity: 8,
  },
  {
    id: '6', name: 'Merino Wool Cardigan', price: 245,
    category: 'women', subcategory: 'knitwear', color: 'Camel', fabric: 'Wool', fit: 'Relaxed', fit_type: 'top',
    sizes: ['XS','S','M','L','XL'],
    images: ['https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=400&h=600&fit=crop'],
    description: 'Soft merino wool cardigan with a relaxed, oversized silhouette.',
    care_instructions: ['Hand wash cold','Lay flat to dry'],
    composition: '100% Merino Wool', return_window_days: 30, stock_quantity: 20,
  },
  {
    id: '7', name: 'Linen Wide-Leg Trousers', price: 195,
    category: 'women', subcategory: 'trousers', color: 'Natural', fabric: 'Linen', fit: 'Wide', fit_type: 'bottom',
    sizes: ['XS','S','M','L'],
    images: ['/placeholder.svg'],
    description: 'Effortless wide-leg trousers in breathable pure linen.',
    care_instructions: ['Machine wash cold','Iron while damp','Hang to dry'],
    composition: '100% Linen', return_window_days: 30, stock_quantity: 14,
  },
  {
    id: '8', name: 'Cotton Poplin Blouse', price: 175,
    category: 'women', subcategory: 'shirts', color: 'White', fabric: 'Cotton', fit: 'Regular', fit_type: 'top',
    sizes: ['XS','S','M','L','XL'],
    images: ['/placeholder.svg'],
    is_bestseller: true,
    description: 'Crisp cotton poplin blouse with refined details.',
    care_instructions: ['Machine wash cold','Iron on medium heat'],
    composition: '100% Cotton', return_window_days: 30, stock_quantity: 22,
  },
  {
    id: '9', name: 'Leather Belt', price: 125,
    category: 'essentials', subcategory: 'accessories', color: 'Brown', fabric: 'Leather', fit: 'Standard', fit_type: 'none',
    sizes: ['85','90','95','100','105'],
    images: ['/placeholder.svg'],
    description: 'Classic leather belt with brushed silver buckle.',
    care_instructions: ['Wipe with damp cloth','Condition leather periodically'],
    composition: '100% Leather', return_window_days: 30, stock_quantity: 30,
  },
  {
    id: '10', name: 'Cashmere Scarf', price: 195,
    category: 'essentials', subcategory: 'accessories', color: 'Grey', fabric: 'Cashmere', fit: 'One Size', fit_type: 'none',
    sizes: ['One Size'],
    images: ['/placeholder.svg'],
    is_new_product: true, is_pre_order: true, pre_order_message: 'Dispatch starts next month',
    description: 'Ultra-soft cashmere scarf in a timeless neutral tone.',
    care_instructions: ['Dry clean only','Store folded'],
    composition: '100% Cashmere', return_window_days: 30, stock_quantity: 10,
  },
  {
    id: '11', name: 'Wool Overcoat', price: 695,
    category: 'men', subcategory: 'outerwear', color: 'Camel', fabric: 'Wool', fit: 'Regular', fit_type: 'top',
    sizes: ['S','M','L','XL'],
    images: ['/placeholder.svg'],
    is_bestseller: true,
    description: 'Timeless wool overcoat in a rich camel tone.',
    care_instructions: ['Dry clean only','Store on padded hanger'],
    composition: '90% Wool, 10% Cashmere', return_window_days: 30, stock_quantity: 7,
  },
  {
    id: '12', name: 'Silk Scarf', price: 165,
    category: 'women', subcategory: 'accessories', color: 'Burgundy', fabric: 'Silk', fit: 'One Size', fit_type: 'none',
    sizes: ['One Size'],
    images: ['/placeholder.svg'],
    description: 'Luxurious silk scarf with hand-rolled edges.',
    care_instructions: ['Dry clean only'],
    composition: '100% Silk', return_window_days: 30, stock_quantity: 16,
  },
];

// ─── Upsert all products ──────────────────────────────────────────────────────
// PostgREST requires every row object to have the exact same keys.
const normalised = products.map(p => ({
  id:                p.id,
  name:              p.name,
  description:       p.description       ?? null,
  price:             p.price,
  original_price:    p.original_price    ?? null,
  discount:          p.discount          ?? 0,
  category:          p.category,
  subcategory:       p.subcategory       ?? null,
  color:             p.color             ?? null,
  fabric:            p.fabric            ?? null,
  fit:               p.fit               ?? null,
  fit_type:          p.fit_type          ?? 'none',
  sizes:             p.sizes             ?? [],
  images:            p.images            ?? [],
  is_new_product:    p.is_new_product    ?? false,
  is_bestseller:     p.is_bestseller     ?? false,
  is_pre_order:      p.is_pre_order      ?? false,
  pre_order_message: p.pre_order_message ?? null,
  stock_quantity:    p.stock_quantity    ?? 0,
  care_instructions: p.care_instructions ?? [],
  composition:       p.composition       ?? null,
  delivery_returns:  p.delivery_returns  ?? null,
  return_window_days:p.return_window_days ?? 30,
  tags:              p.tags              ?? [],
}));

console.log(`Seeding ${normalised.length} products into Supabase…`);

const res = await fetch(API, {
  method: 'POST',
  headers: HEADERS,
  body: JSON.stringify(normalised),
});

if (res.ok) {
  console.log(`✓ Done — ${normalised.length} products upserted successfully.`);
} else {
  const err = await res.text();
  console.error('✗ Seed failed:', res.status, err);
  process.exit(1);
}
