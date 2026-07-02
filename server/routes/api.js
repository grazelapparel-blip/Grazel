/**
 * ============================================================================
 * GRAZEL ATELIER - COMPREHENSIVE API ROUTES
 * ============================================================================
 * Enhanced API endpoints for:
 * - Payment processing (Razorpay)
 * - Shipping calculation
 * - Discounts & Bundles
 * - Order tracking & management
 * - Email subscriptions
 * ============================================================================
 */

import express from 'express';
import crypto from 'crypto';
import Razorpay from 'razorpay';
import nodemailer from 'nodemailer';
import { createClient } from '@supabase/supabase-js';
import emailService from '../services/emailService.js';

const router = express.Router();

// ─── Initialize Razorpay (with lazy initialization) ─────────────────────────
let razorpayInstance = null;
function initializeRazorpay() {
  if (!razorpayInstance && process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET) {
    try {
      razorpayInstance = new Razorpay({
        key_id: process.env.RAZORPAY_KEY_ID,
        key_secret: process.env.RAZORPAY_KEY_SECRET,
      });
    } catch (err) {
      console.warn('⚠ Razorpay initialization failed:', err.message);
    }
  }
  return razorpayInstance;
}

// ─── Initialize Supabase (with lazy initialization) ────────────────────────
let supabase = null;
function initializeSupabase() {
  if (!supabase) {
    const supabaseUrl = process.env.VITE_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (supabaseUrl && supabaseServiceKey) {
      try {
        supabase = createClient(supabaseUrl, supabaseServiceKey, {
          auth: { autoRefreshToken: false, persistSession: false },
        });
      } catch (err) {
        console.warn('⚠ Supabase initialization failed:', err.message);
      }
    }
  }
  return supabase;
}

// ─── Email configuration (with lazy initialization) ──────────────────────
let transporter = null;
function initializeEmailTransporter() {
  if (!transporter) {
    const user = process.env.EMAIL_USER;
    // Strip spaces from Gmail App Passwords (Google shows them spaced for readability)
    const pass = (process.env.EMAIL_PASSWORD || '').replace(/\s/g, '');

    if (!user || !pass) {
      console.warn('⚠ EMAIL_USER or EMAIL_PASSWORD not set in .env');
      return null;
    }

    try {
      transporter = nodemailer.createTransport({
        host: 'smtp.gmail.com',
        port: 465,
        secure: true,          // SSL
        auth: { user, pass },
      });
      console.log('✓ Email transporter initialized:', user);
    } catch (err) {
      console.warn('⚠ Email transporter initialization failed:', err.message);
    }
  }
  return transporter;
}

// ============================================================================
// 1. PAYMENT INTEGRATION - RAZORPAY
// ============================================================================

/**
 * Create Razorpay Order for Payment
 * POST /api/payments/create-order
 */
router.post('/payments/create-order', async (req, res) => {
  try {
    const { amount, currency = 'INR', receipt, customerEmail, customerName } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({ error: 'Invalid amount' });
    }

    const options = {
      amount: Math.round(amount * 100), // Convert to paise
      currency,
      receipt: receipt || `order_${Date.now()}`,
      customer_notify: 1,
      notes: {
        email: customerEmail,
        name: customerName,
      },
    };

    const instance = initializeRazorpay();
    if (!instance) {
      return res.status(500).json({ error: 'Razorpay not configured' });
    }
    const order = await instance.orders.create(options);
    res.status(200).json({ success: true, order });
  } catch (error) {
    console.error('Error creating Razorpay order:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Verify Razorpay Payment
 * POST /api/payments/verify-payment
 */
router.post('/payments/verify-payment', async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

    const shasum = crypto.createHmac('sha256', process.env.RAZORPAY_KEY_SECRET);
    shasum.update(`${razorpay_order_id}|${razorpay_payment_id}`);
    const digest = shasum.digest('hex');

    if (digest !== razorpay_signature) {
      return res.status(400).json({ error: 'Invalid signature' });
    }

    // Fetch payment details
    const instance = initializeRazorpay();
    if (!instance) {
      return res.status(500).json({ error: 'Razorpay not configured' });
    }
    const payment = await instance.payments.fetch(razorpay_payment_id);

    res.status(200).json({
      success: true,
      message: 'Payment verified',
      payment: {
        id: payment.id,
        amount: payment.amount / 100,
        currency: payment.currency,
        status: payment.status,
        method: payment.method,
      },
    });
  } catch (error) {
    console.error('Error verifying payment:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Get Payment Details
 * GET /api/payments/:paymentId
 */
router.get('/payments/:paymentId', async (req, res) => {
  try {
    const instance = initializeRazorpay();
    if (!instance) {
      return res.status(500).json({ error: 'Razorpay not configured' });
    }
    const payment = await instance.payments.fetch(req.params.paymentId);
    res.status(200).json({ success: true, payment });
  } catch (error) {
    console.error('Error fetching payment:', error);
    res.status(500).json({ error: error.message });
  }
});

// ============================================================================
// 2. SHIPPING & DELIVERY
// ============================================================================

/**
 * Calculate Shipping Cost Based on State
 * POST /api/shipping/calculate
 */
router.post('/shipping/calculate', async (req, res) => {
  try {
    const { state, subtotal } = req.body;

    if (!state) {
      return res.status(400).json({ error: 'State is required' });
    }

    // Fetch shipping rate for the state
    const { data: shippingRate, error } = await supabase
      .from('shipping_rates')
      .select('*')
      .eq('state', state)
      .eq('is_serviceable', true)
      .single();

    if (error || !shippingRate) {
      return res.status(404).json({ error: 'Shipping not available for this state' });
    }

    // Calculate shipping cost
    const cost =
      subtotal >= shippingRate.free_shipping_threshold
        ? 0
        : shippingRate.base_shipping_cost;

    const estimatedDelivery = new Date();
    estimatedDelivery.setDate(
      estimatedDelivery.getDate() + shippingRate.estimated_delivery_days_min
    );

    res.status(200).json({
      success: true,
      shippingCost: cost,
      isFreeShipping: cost === 0,
      freeShippingThreshold: shippingRate.free_shipping_threshold,
      amountNeededForFreeShipping:
        subtotal >= shippingRate.free_shipping_threshold
          ? 0
          : shippingRate.free_shipping_threshold - subtotal,
      estimatedDelivery,
      state,
    });
  } catch (error) {
    console.error('Error calculating shipping:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Get All Serviceable States
 * GET /api/shipping/states
 */
router.get('/shipping/states', async (req, res) => {
  try {
    const { data: states, error } = await supabase
      .from('shipping_rates')
      .select('state, base_shipping_cost, free_shipping_threshold, is_serviceable')
      .eq('is_serviceable', true)
      .order('state');

    if (error) throw error;

    res.status(200).json({ success: true, states });
  } catch (error) {
    console.error('Error fetching states:', error);
    res.status(500).json({ error: error.message });
  }
});

// ============================================================================
// 3. DISCOUNTS & COUPONS
// ============================================================================

/**
 * Validate Discount Code
 * POST /api/discounts/validate
 */
router.post('/discounts/validate', async (req, res) => {
  try {
    const { code, subtotal, items, userId } = req.body;

    if (!code) {
      return res.status(400).json({ error: 'Discount code is required' });
    }

    // Fetch discount
    const { data: discount, error: discountError } = await supabase
      .from('discounts')
      .select('*')
      .eq('code', code.toUpperCase())
      .eq('is_active', true)
      .single();

    if (discountError || !discount) {
      return res.status(404).json({ error: 'Invalid discount code' });
    }

    // Check if discount is within date range
    const now = new Date();
    if (new Date(discount.start_date) > now || new Date(discount.end_date) < now) {
      return res.status(400).json({ error: 'Discount code has expired' });
    }

    // Check minimum order amount
    if (subtotal < discount.min_order_amount) {
      return res.status(400).json({
        error: `Minimum order amount of ₹${discount.min_order_amount} required`,
      });
    }

    // Check max uses
    if (discount.total_max_uses && discount.current_uses >= discount.total_max_uses) {
      return res.status(400).json({ error: 'Discount code limit reached' });
    }

    // Calculate discount amount
    let discountAmount = 0;
    if (discount.discount_type === 'percentage') {
      discountAmount = (subtotal * discount.discount_value) / 100;
      if (discount.max_discount_amount) {
        discountAmount = Math.min(discountAmount, discount.max_discount_amount);
      }
    } else if (discount.discount_type === 'fixed_amount') {
      discountAmount = discount.discount_value;
    }

    res.status(200).json({
      success: true,
      discount: {
        id: discount.id,
        code: discount.code,
        description: discount.description,
        discountAmount,
        discountPercentage:
          discount.discount_type === 'percentage' ? discount.discount_value : 0,
        finalAmount: Math.max(0, subtotal - discountAmount),
      },
    });
  } catch (error) {
    console.error('Error validating discount:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Apply Discount Code
 * POST /api/discounts/apply
 */
router.post('/discounts/apply', async (req, res) => {
  try {
    const { discountId } = req.body;

    if (!discountId) {
      return res.status(400).json({ error: 'Discount ID is required' });
    }

    // Increment usage count
    const { error } = await supabase
      .from('discounts')
      .update({ current_uses: await getDiscountUsageCount(discountId) + 1 })
      .eq('id', discountId);

    if (error) throw error;

    res.status(200).json({ success: true, message: 'Discount applied' });
  } catch (error) {
    console.error('Error applying discount:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Helper: Get discount usage count
 */
async function getDiscountUsageCount(discountId) {
  const { data: discount } = await supabase
    .from('discounts')
    .select('current_uses')
    .eq('id', discountId)
    .single();
  return discount?.current_uses || 0;
}

// ============================================================================
// 4. BUNDLES
// ============================================================================

/**
 * Get All Active Bundles
 * GET /api/bundles
 */
router.get('/bundles', async (req, res) => {
  try {
    const { type, seasonal, featured } = req.query;

    const db = initializeSupabase();
    if (!db) {
      return res.status(500).json({ error: 'Database not configured' });
    }

    let query = db.from('bundles').select('*').eq('is_active', true);

    if (type) query = query.eq('bundle_type', type);
    if (seasonal) query = query.eq('seasonal_category', seasonal);
    if (featured === 'true') query = query.eq('is_featured', true);

    const { data: bundles, error } = await query.order('display_order');

    if (error) throw error;

    res.status(200).json({ success: true, bundles });
  } catch (error) {
    console.error('Error fetching bundles:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Get Bundle Details
 * GET /api/bundles/:bundleId
 */
router.get('/bundles/:bundleId', async (req, res) => {
  try {
    const { data: bundle, error: bundleError } = await supabase
      .from('bundles')
      .select('*')
      .eq('id', req.params.bundleId)
      .single();

    if (bundleError || !bundle) {
      return res.status(404).json({ error: 'Bundle not found' });
    }

    // Fetch product details
    const { data: products, error: productsError } = await supabase
      .from('products')
      .select('*')
      .in('id', bundle.product_ids);

    if (productsError) throw productsError;

    res.status(200).json({ success: true, bundle: { ...bundle, products } });
  } catch (error) {
    console.error('Error fetching bundle:', error);
    res.status(500).json({ error: error.message });
  }
});

// ============================================================================
// 5. ORDER TRACKING
// ============================================================================

/**
 * Get Order Tracking Status
 * GET /api/orders/:orderId/tracking
 */
router.get('/orders/:orderId/tracking', async (req, res) => {
  try {
    const { orderId } = req.params;

    // Fetch order
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('*')
      .eq('id', orderId)
      .single();

    if (orderError || !order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    // Fetch tracking events
    const { data: events, error: eventsError } = await supabase
      .from('order_tracking_events')
      .select('*')
      .eq('order_id', orderId)
      .order('event_date', { ascending: false });

    if (eventsError) throw eventsError;

    res.status(200).json({
      success: true,
      order: {
        id: order.id,
        orderNumber: order.order_number,
        status: order.order_status,
        paymentStatus: order.payment_status,
        estimatedDelivery: order.estimated_delivery_date,
        actualDelivery: order.actual_delivery_date,
        trackingNumber: order.tracking_number,
        shippingState: order.shipping_state,
      },
      events,
    });
  } catch (error) {
    console.error('Error fetching tracking:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Track Order by Order Number
 * GET /api/orders/track/:orderNumber
 */
router.get('/orders/track/:orderNumber', async (req, res) => {
  try {
    const { orderNumber } = req.params;

    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('*')
      .eq('order_number', orderNumber)
      .single();

    if (orderError || !order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    const { data: items, error: itemsError } = await supabase
      .from('order_items')
      .select('*')
      .eq('order_id', order.id);

    if (itemsError) throw itemsError;

    const { data: events, error: eventsError } = await supabase
      .from('order_tracking_events')
      .select('*')
      .eq('order_id', order.id)
      .order('event_date', { ascending: false });

    if (eventsError) throw eventsError;

    res.status(200).json({
      success: true,
      order: {
        id: order.id,
        orderNumber: order.order_number,
        customerName: order.customer_name,
        customerEmail: order.customer_email,
        status: order.order_status,
        paymentStatus: order.payment_status,
        estimatedDelivery: order.estimated_delivery_date,
        actualDelivery: order.actual_delivery_date,
        trackingNumber: order.tracking_number,
        shippingState: order.shipping_state,
        subtotal: order.subtotal,
        shippingCost: order.shipping_cost,
        tax: order.tax,
        discount: order.discount,
        totalAmount: order.total_amount,
      },
      items,
      events,
    });
  } catch (error) {
    console.error('Error tracking order:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Update Order Tracking Event (Admin)
 * POST /api/orders/:orderId/tracking/update
 */
router.post('/orders/:orderId/tracking/update', async (req, res) => {
  try {
    const { orderId } = req.params;
    const { eventType, eventTitle, eventDescription, location, notes } = req.body;

    if (!eventType) {
      return res.status(400).json({ error: 'Event type is required' });
    }

    // Create tracking event
    const { data: event, error } = await supabase
      .from('order_tracking_events')
      .insert([
        {
          order_id: orderId,
          event_type: eventType,
          event_title: eventTitle || eventType,
          event_description: eventDescription,
          location,
          notes,
        },
      ])
      .select()
      .single();

    if (error) throw error;

    // Update order status if needed
    if (eventType === 'delivered') {
      const { error: updateError } = await supabase
        .from('orders')
        .update({
          order_status: 'delivered',
          actual_delivery_date: new Date().toISOString(),
        })
        .eq('id', orderId);

      if (updateError) throw updateError;
    }

    res.status(200).json({ success: true, event });
  } catch (error) {
    console.error('Error updating tracking:', error);
    res.status(500).json({ error: error.message });
  }
});

// ============================================================================
// 6. EMAIL SUBSCRIPTIONS
// ============================================================================

/**
 * Subscribe to Newsletter
 * POST /api/subscriptions/subscribe
 */
router.post('/subscriptions/subscribe', async (req, res) => {
  try {
    const { email, firstName, lastName, subscriptionTypes = ['promotional', 'new_arrivals'] } =
      req.body;

    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    const db = initializeSupabase();
    if (!db) {
      return res.status(500).json({ error: 'Database not configured' });
    }

    // Check if already subscribed
    const { data: existing } = await db
      .from('email_subscriptions')
      .select('*')
      .eq('email', email)
      .single();

    if (existing && existing.is_active) {
      return res.status(400).json({ error: 'Email already subscribed' });
    }

    // Create or update subscription
    const { data: subscription, error } = await db
      .from('email_subscriptions')
      .upsert(
        [
          {
            email,
            first_name: firstName,
            last_name: lastName,
            subscription_types: subscriptionTypes,
            is_active: true,
            consent_given: true,
            consent_date: new Date().toISOString(),
          },
        ],
        { onConflict: 'email' }
      )
      .select()
      .single();

    if (error) throw error;

    // Send welcome email
    const emailTransporter = initializeEmailTransporter();
    if (emailTransporter) {
      try {
        await emailTransporter.sendMail({
          from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
          to: email,
          subject: 'Welcome to Grazel Newsletter',
          html: `<h2>Thank you for subscribing!</h2><p>We'll keep you updated with our latest offers and new arrivals.</p>`,
        });
      } catch (emailErr) {
        console.warn('Email send failed (subscription):', emailErr.message);
      }
    }

    res.status(200).json({ success: true, message: 'Subscribed successfully', subscription });
  } catch (error) {
    console.error('Error subscribing:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Unsubscribe from Newsletter
 * GET /api/subscriptions/unsubscribe/:token
 */
router.get('/subscriptions/unsubscribe/:token', async (req, res) => {
  try {
    const { data: subscription, error: fetchError } = await supabase
      .from('email_subscriptions')
      .select('*')
      .eq('unsubscribe_token', req.params.token)
      .single();

    if (fetchError || !subscription) {
      return res.status(404).json({ error: 'Invalid unsubscribe token' });
    }

    const { error } = await supabase
      .from('email_subscriptions')
      .update({
        is_active: false,
        unsubscribe_date: new Date().toISOString(),
      })
      .eq('id', subscription.id);

    if (error) throw error;

    res.status(200).json({ success: true, message: 'Unsubscribed successfully' });
  } catch (error) {
    console.error('Error unsubscribing:', error);
    res.status(500).json({ error: error.message });
  }
});

// ============================================================================
// 7. PACKAGING OPTIONS
// ============================================================================

/**
 * Get All Packaging Options
 * GET /api/packaging
 */
router.get('/packaging', async (req, res) => {
  try {
    const { data: options, error } = await supabase
      .from('packaging_options')
      .select('*')
      .eq('is_available', true)
      .order('display_order');

    if (error) throw error;

    res.status(200).json({ success: true, options });
  } catch (error) {
    console.error('Error fetching packaging options:', error);
    res.status(500).json({ error: error.message });
  }
});

// ============================================================================
// 8. SEASONAL COLLECTIONS
// ============================================================================

/**
 * Get All Active Seasonal Collections
 * GET /api/collections
 */
router.get('/collections', async (req, res) => {
  try {
    const { data: collections, error } = await supabase
      .from('seasonal_collections')
      .select('*')
      .eq('is_active', true)
      .order('display_order');

    if (error) throw error;

    res.status(200).json({ success: true, collections });
  } catch (error) {
    console.error('Error fetching collections:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Get Collection by Slug
 * GET /api/collections/:slug
 */
router.get('/collections/:slug', async (req, res) => {
  try {
    const { data: collection, error } = await supabase
      .from('seasonal_collections')
      .select('*')
      .eq('slug', req.params.slug)
      .eq('is_active', true)
      .single();

    if (error || !collection) {
      return res.status(404).json({ error: 'Collection not found' });
    }

    // Fetch featured products
    let products = [];
    if (collection.featured_products && collection.featured_products.length > 0) {
      const { data: prods } = await supabase
        .from('products')
        .select('*')
        .in('id', collection.featured_products);
      products = prods || [];
    }

    res.status(200).json({ success: true, collection: { ...collection, products } });
  } catch (error) {
    console.error('Error fetching collection:', error);
    res.status(500).json({ error: error.message });
  }
});

// ============================================================================
// 9. PARTNER BRANDS
// ============================================================================

/**
 * Get All Partner Brands
 * GET /api/brands
 */
router.get('/brands', async (req, res) => {
  try {
    const { data: brands, error } = await supabase
      .from('partner_brands')
      .select('*')
      .eq('is_active', true)
      .order('display_order');

    if (error) throw error;

    res.status(200).json({ success: true, brands });
  } catch (error) {
    console.error('Error fetching brands:', error);
    res.status(500).json({ error: error.message });
  }
});

// ============================================================================
// 10. SIZE GUIDES
// ============================================================================

/**
 * Get Size Guide by Product Type
 * GET /api/size-guides/:productType
 */
router.get('/size-guides/:productType', async (req, res) => {
  try {
    const { unit = 'cm' } = req.query;

    const { data: guides, error } = await supabase
      .from('size_guides')
      .select('*')
      .eq('product_type', req.params.productType)
      .eq('unit', unit)
      .eq('is_active', true)
      .order('size_code');

    if (error) throw error;

    res.status(200).json({ success: true, guides });
  } catch (error) {
    console.error('Error fetching size guides:', error);
    res.status(500).json({ error: error.message });
  }
});

// ============================================================================
// 11. COOKIE CONSENT
// ============================================================================

/**
 * Save Cookie Consent
 * POST /api/cookies/consent
 */
router.post('/cookies/consent', async (req, res) => {
  try {
    const { userId, sessionId, ipAddress, consent } = req.body;

    const { data: consentRecord, error } = await supabase
      .from('cookie_consents')
      .insert([
        {
          user_id: userId,
          session_id: sessionId,
          ip_address: ipAddress,
          essential_cookies: consent.essential || true,
          analytics_cookies: consent.analytics || false,
          marketing_cookies: consent.marketing || false,
          preferences_cookies: consent.preferences || false,
        },
      ])
      .select()
      .single();

    if (error) throw error;

    res.status(200).json({ success: true, consent: consentRecord });
  } catch (error) {
    console.error('Error saving cookie consent:', error);
    res.status(500).json({ error: error.message });
  }
});

// ============================================================================
// 12. CONTACT FORM
// ============================================================================

/**
 * Submit Contact Form
 * POST /api/contact/submit
 */
router.post('/contact/submit', async (req, res) => {
  try {
    const { name, email, phone, subject, message } = req.body;

    if (!name || !email || !message) {
      return res.status(400).json({ error: 'Required fields missing' });
    }

    const adminEmail = process.env.CONTACT_EMAIL || process.env.EMAIL_USER || 'grazelapparel@gmail.com';
    const fromEmail  = process.env.EMAIL_FROM    || process.env.EMAIL_USER || 'grazelapparel@gmail.com';

    const emailTransporter = initializeEmailTransporter();
    if (!emailTransporter) {
      console.error('Contact form: email transporter not available');
      return res.status(500).json({ error: 'Email service not configured. Please contact us directly at ' + adminEmail });
    }

    // 1. Notify admin
    await emailTransporter.sendMail({
      from: `"Grazel Contact Form" <${fromEmail}>`,
      to: adminEmail,
      replyTo: email,
      subject: `[Contact Form] ${subject || 'New message from ' + name}`,
      html: `
        <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:24px;border:1px solid #e5e5e5;border-radius:8px">
          <h2 style="color:#1a1a1a;margin-bottom:24px">New Contact Form Submission</h2>
          <table style="width:100%;border-collapse:collapse">
            <tr><td style="padding:8px 0;color:#666;width:100px"><strong>Name</strong></td><td style="padding:8px 0">${name}</td></tr>
            <tr><td style="padding:8px 0;color:#666"><strong>Email</strong></td><td style="padding:8px 0"><a href="mailto:${email}">${email}</a></td></tr>
            <tr><td style="padding:8px 0;color:#666"><strong>Phone</strong></td><td style="padding:8px 0">${phone || 'Not provided'}</td></tr>
            <tr><td style="padding:8px 0;color:#666"><strong>Subject</strong></td><td style="padding:8px 0">${subject || 'General enquiry'}</td></tr>
          </table>
          <div style="margin-top:24px;padding:16px;background:#f9f9f9;border-radius:4px">
            <strong style="color:#666">Message:</strong>
            <p style="margin:8px 0 0;white-space:pre-wrap">${message}</p>
          </div>
          <p style="margin-top:24px;font-size:12px;color:#999">Reply to this email to respond directly to ${name}.</p>
        </div>
      `,
    });

    // 2. Auto-reply to user
    await emailTransporter.sendMail({
      from: `"Grazel Atelier" <${fromEmail}>`,
      to: email,
      subject: 'We received your message – Grazel Atelier',
      html: `
        <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:24px;border:1px solid #e5e5e5;border-radius:8px">
          <h2 style="color:#1a1a1a">Thank you for reaching out, ${name}!</h2>
          <p style="color:#444;line-height:1.6">We've received your message and our team will get back to you within <strong>24–48 hours</strong>.</p>
          <div style="margin:24px 0;padding:16px;background:#f9f9f9;border-radius:4px">
            <strong style="color:#666">Your message:</strong>
            <p style="margin:8px 0 0;white-space:pre-wrap;color:#444">${message}</p>
          </div>
          <p style="color:#444">In the meantime, feel free to browse our latest collections at <a href="https://grazel.com" style="color:#1a1a1a">grazel.com</a>.</p>
          <hr style="margin:24px 0;border:none;border-top:1px solid #e5e5e5">
          <p style="font-size:12px;color:#999">Grazel Atelier · grazelapparel@gmail.com</p>
        </div>
      `,
    });

    res.status(200).json({ success: true, message: 'Message sent successfully' });
  } catch (error) {
    console.error('Contact form email error:', error.message);
    res.status(500).json({ error: 'Failed to send email: ' + error.message });
  }
});

// ============================================================================
// 13. ADMIN ENDPOINTS
// ============================================================================

/**
 * Create Discount (Admin)
 * POST /api/admin/discounts/create
 */
router.post('/admin/discounts/create', async (req, res) => {
  try {
    const {
      code,
      description,
      discountType,
      discountValue,
      appliesto,
      productIds,
      categoryIds,
      bundleIds,
      maxUses,
      totalMaxUses,
      startDate,
      endDate,
      minOrderAmount,
      isStackable,
    } = req.body;

    const { data: discount, error } = await supabase
      .from('discounts')
      .insert([
        {
          code: code.toUpperCase(),
          description,
          discount_type: discountType,
          discount_value: discountValue,
          applies_to: appliesto,
          product_ids: productIds || [],
          category_ids: categoryIds || [],
          bundle_ids: bundleIds || [],
          max_uses_per_customer: maxUses,
          total_max_uses: totalMaxUses,
          start_date: startDate,
          end_date: endDate,
          min_order_amount: minOrderAmount || 0,
          is_stackable: isStackable || false,
        },
      ])
      .select()
      .single();

    if (error) throw error;

    res.status(200).json({ success: true, discount });
  } catch (error) {
    console.error('Error creating discount:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Create Bundle (Admin)
 * POST /api/admin/bundles/create
 */
router.post('/admin/bundles/create', async (req, res) => {
  try {
    const {
      name,
      description,
      bundleType,
      productIds,
      bundlePrice,
      originalPrice,
      images,
      seasonalCategory,
      stockQuantity,
    } = req.body;

    const discountPercentage = Math.round(((originalPrice - bundlePrice) / originalPrice) * 100);
    const savingsAmount = originalPrice - bundlePrice;

    const { data: bundle, error } = await supabase
      .from('bundles')
      .insert([
        {
          name,
          description,
          bundle_type: bundleType,
          product_ids: productIds,
          bundle_price: bundlePrice,
          original_price: originalPrice,
          discount_percentage: discountPercentage,
          savings_amount: savingsAmount,
          images: images || [],
          seasonal_category: seasonalCategory,
          stock_quantity: stockQuantity || 0,
        },
      ])
      .select()
      .single();

    if (error) throw error;

    res.status(200).json({ success: true, bundle });
  } catch (error) {
    console.error('Error creating bundle:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Update Shipping Rate (Admin)
 * PUT /api/admin/shipping-rates/:state
 */
router.put('/admin/shipping-rates/:state', async (req, res) => {
  try {
    const { baseShippingCost, freeShippingThreshold, estimatedDeliveryMin, estimatedDeliveryMax } =
      req.body;

    const { data: rate, error } = await supabase
      .from('shipping_rates')
      .update({
        base_shipping_cost: baseShippingCost,
        free_shipping_threshold: freeShippingThreshold,
        estimated_delivery_days_min: estimatedDeliveryMin,
        estimated_delivery_days_max: estimatedDeliveryMax,
      })
      .eq('state', req.params.state)
      .select()
      .single();

    if (error) throw error;

    res.status(200).json({ success: true, rate });
  } catch (error) {
    console.error('Error updating shipping rate:', error);
    res.status(500).json({ error: error.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// CONTENT MANAGEMENT SYSTEM (CMS)
// ─────────────────────────────────────────────────────────────────────────────

// GET all content
router.get('/content', async (req, res) => {
  try {
    const db = initializeSupabase();
    if (!db) {
      return res.status(500).json({ error: 'Database not initialized' });
    }

    const { data, error } = await db.from('cms_content').select('*').order('created_at', { ascending: false });
    if (error) throw error;

    res.json(data || []);
  } catch (error) {
    console.error('Error fetching content:', error);
    res.status(500).json({ error: error.message });
  }
});

// GET content by page
router.get('/content/page/:page', async (req, res) => {
  try {
    const db = initializeSupabase();
    if (!db) {
      return res.status(500).json({ error: 'Database not initialized' });
    }

    const { data, error } = await db
      .from('cms_content')
      .select('*')
      .eq('page', req.params.page)
      .order('created_at', { ascending: false });
    if (error) throw error;

    res.json(data || []);
  } catch (error) {
    console.error('Error fetching page content:', error);
    res.status(500).json({ error: error.message });
  }
});

// GET single content by key
router.get('/content/key/:key', async (req, res) => {
  try {
    const db = initializeSupabase();
    if (!db) {
      return res.status(500).json({ error: 'Database not initialized' });
    }

    const { data, error } = await db
      .from('cms_content')
      .select('*')
      .eq('key', req.params.key)
      .single();
    if (error) throw error;

    res.json(data);
  } catch (error) {
    console.error('Error fetching content by key:', error);
    res.status(500).json({ error: error.message });
  }
});

// CREATE new content
router.post('/content', async (req, res) => {
  try {
    const db = initializeSupabase();
    if (!db) {
      return res.status(500).json({ error: 'Database not initialized' });
    }

    const { key, title, content, type, page } = req.body;

    if (!key || !title || !content) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const { data, error } = await db
      .from('cms_content')
      .insert([
        {
          key,
          title,
          content,
          type: type || 'text',
          page: page || 'other',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      ])
      .select();
    if (error) throw error;

    res.json(data[0]);
  } catch (error) {
    console.error('Error creating content:', error);
    res.status(500).json({ error: error.message });
  }
});

// UPDATE content
router.put('/content/:id', async (req, res) => {
  try {
    const db = initializeSupabase();
    if (!db) {
      return res.status(500).json({ error: 'Database not initialized' });
    }

    const { key, title, content, type, page } = req.body;

    const { data, error } = await db
      .from('cms_content')
      .update({
        key,
        title,
        content,
        type: type || 'text',
        page: page || 'other',
        updated_at: new Date().toISOString(),
      })
      .eq('id', req.params.id)
      .select();
    if (error) throw error;

    res.json(data[0]);
  } catch (error) {
    console.error('Error updating content:', error);
    res.status(500).json({ error: error.message });
  }
});

// DELETE content
router.delete('/content/:id', async (req, res) => {
  try {
    const db = initializeSupabase();
    if (!db) {
      return res.status(500).json({ error: 'Database not initialized' });
    }

    const { error } = await db.from('cms_content').delete().eq('id', req.params.id);
    if (error) throw error;

    res.json({ success: true, message: 'Content deleted' });
  } catch (error) {
    console.error('Error deleting content:', error);
    res.status(500).json({ error: error.message });
  }
});

// ============================================================================
// EMAIL NOTIFICATIONS
// ============================================================================

/**
 * Send Order Confirmation Email
 * POST /api/emails/order-confirmation
 */
router.post('/emails/order-confirmation', async (req, res) => {
  try {
    const { orderId, customerEmail, customerName, items, totalAmount, orderNumber } = req.body;

    if (!customerEmail || !orderId) {
      return res.status(400).json({ error: 'Email and Order ID are required' });
    }

    const order = {
      id: orderId,
      order_number: orderNumber,
      customer_email: customerEmail,
      customer_name: customerName,
      total_amount: totalAmount,
      created_at: new Date().toISOString(),
      shipping_address: req.body.shipping_address || '',
    };

    const result = await emailService.sendOrderConfirmationEmail(order, items);

    if (result.success) {
      res.json({ success: true, message: 'Order confirmation email sent', messageId: result.messageId });
    } else {
      res.status(500).json({ success: false, error: result.error });
    }
  } catch (error) {
    console.error('Error sending order confirmation email:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Send Order Shipped Email
 * POST /api/emails/order-shipped
 */
router.post('/emails/order-shipped', async (req, res) => {
  try {
    const { orderId, customerEmail, orderNumber, trackingNumber, estimatedDeliveryDate } = req.body;

    if (!customerEmail || !orderId) {
      return res.status(400).json({ error: 'Email and Order ID are required' });
    }

    const order = {
      id: orderId,
      order_number: orderNumber,
      customer_email: customerEmail,
      estimated_delivery_date: estimatedDeliveryDate,
    };

    const result = await emailService.sendOrderShippedEmail(order, trackingNumber);

    if (result.success) {
      res.json({ success: true, message: 'Shipping notification email sent', messageId: result.messageId });
    } else {
      res.status(500).json({ success: false, error: result.error });
    }
  } catch (error) {
    console.error('Error sending shipping email:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Send Order Delivered Email
 * POST /api/emails/order-delivered
 */
router.post('/emails/order-delivered', async (req, res) => {
  try {
    const { orderId, customerEmail, orderNumber, deliveredDate } = req.body;

    if (!customerEmail || !orderId) {
      return res.status(400).json({ error: 'Email and Order ID are required' });
    }

    const order = {
      id: orderId,
      order_number: orderNumber,
      customer_email: customerEmail,
      actual_delivery_date: deliveredDate,
    };

    const result = await emailService.sendOrderDeliveredEmail(order);

    if (result.success) {
      res.json({ success: true, message: 'Delivery confirmation email sent', messageId: result.messageId });
    } else {
      res.status(500).json({ success: false, error: result.error });
    }
  } catch (error) {
    console.error('Error sending delivery email:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Send Review Request Email
 * POST /api/emails/review-request
 */
router.post('/emails/review-request', async (req, res) => {
  try {
    const { customerEmail, customerName, productName, orderNumber } = req.body;

    if (!customerEmail) {
      return res.status(400).json({ error: 'Customer email is required' });
    }

    const result = await emailService.sendReviewRequestEmail(
      customerEmail,
      customerName,
      productName,
      orderNumber
    );

    if (result.success) {
      res.json({ success: true, message: 'Review request email sent', messageId: result.messageId });
    } else {
      res.status(500).json({ success: false, error: result.error });
    }
  } catch (error) {
    console.error('Error sending review request email:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Send Return Approved Email
 * POST /api/emails/return-approved
 */
router.post('/emails/return-approved', async (req, res) => {
  try {
    const { orderId, customerEmail, orderNumber, returnAmount } = req.body;

    if (!customerEmail || !orderId) {
      return res.status(400).json({ error: 'Email and Order ID are required' });
    }

    const order = {
      id: orderId,
      order_number: orderNumber,
      customer_email: customerEmail,
    };

    const result = await emailService.sendReturnApprovedEmail(order, returnAmount);

    if (result.success) {
      res.json({ success: true, message: 'Return approval email sent', messageId: result.messageId });
    } else {
      res.status(500).json({ success: false, error: result.error });
    }
  } catch (error) {
    console.error('Error sending return approval email:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Send Bulk Promotional Email
 * POST /api/emails/promotional
 */
router.post('/emails/promotional', async (req, res) => {
  try {
    const { recipients, subject, html } = req.body;

    if (!recipients || !Array.isArray(recipients) || recipients.length === 0) {
      return res.status(400).json({ error: 'Recipients array is required' });
    }

    if (!subject || !html) {
      return res.status(400).json({ error: 'Subject and HTML content are required' });
    }

    const result = await emailService.sendBulkPromotionalEmail(recipients, subject, html);

    res.json({
      success: result.success,
      message: `Promotional email campaign sent: ${result.sent} successful, ${result.failed} failed`,
      ...result,
    });
  } catch (error) {
    console.error('Error sending promotional email:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
