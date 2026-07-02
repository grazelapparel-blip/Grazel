/**
 * ============================================================================
 * EMAIL SERVICE - Grazel Atelier
 * ============================================================================
 * Handles all email notifications including:
 * - Order confirmations
 * - Shipping updates
 * - Delivery notifications
 * - Review requests
 * - Return notifications
 * ============================================================================
 */

import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

// Initialize email transporter
let transporter = null;

function initializeTransporter() {
  if (!transporter) {
    const emailService = process.env.EMAIL_SERVICE || 'gmail';
    const emailUser = process.env.EMAIL_USER;
    const emailPassword = process.env.EMAIL_PASSWORD;

    if (!emailUser || !emailPassword) {
      console.warn(
        '⚠ Email credentials not configured. Set EMAIL_SERVICE, EMAIL_USER, and EMAIL_PASSWORD in .env'
      );
      return null;
    }

    try {
      transporter = nodemailer.createTransport({
        service: emailService,
        auth: {
          user: emailUser,
          pass: emailPassword,
        },
      });

      // Verify connection
      transporter.verify((error, success) => {
        if (error) {
          console.warn('⚠ Email transporter verification failed:', error.message);
          transporter = null;
        } else {
          console.log('✓ Email service verified successfully:', emailUser);
        }
      });
    } catch (err) {
      console.warn('⚠ Email transporter initialization failed:', err.message);
      return null;
    }
  }
  return transporter;
}

// ============================================================================
// EMAIL TEMPLATES
// ============================================================================

const emailTemplates = {
  orderConfirmation: (order, items) => ({
    subject: `Order Confirmation - ${order.order_number}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #333;">Order Confirmed!</h2>
        <p>Thank you for your order at Grazel Atelier.</p>
        
        <div style="background: #f5f5f5; padding: 15px; margin: 20px 0; border-radius: 5px;">
          <p><strong>Order Number:</strong> ${order.order_number}</p>
          <p><strong>Date:</strong> ${new Date(order.created_at).toLocaleDateString()}</p>
          <p><strong>Total Amount:</strong> ₹${order.total_amount?.toFixed(2) || '0.00'}</p>
        </div>

        <h3>Order Items:</h3>
        <table style="width: 100%; border-collapse: collapse;">
          <tr style="background: #eee;">
            <th style="padding: 10px; text-align: left;">Product</th>
            <th style="padding: 10px; text-align: center;">Size</th>
            <th style="padding: 10px; text-align: center;">Qty</th>
            <th style="padding: 10px; text-align: right;">Price</th>
          </tr>
          ${items
            ?.map(
              (item) => `
            <tr style="border-bottom: 1px solid #ddd;">
              <td style="padding: 10px;">${item.productName || 'Product'}</td>
              <td style="padding: 10px; text-align: center;">${item.size || '-'}</td>
              <td style="padding: 10px; text-align: center;">${item.quantity || 1}</td>
              <td style="padding: 10px; text-align: right;">₹${(item.price || 0).toFixed(2)}</td>
            </tr>
          `
            )
            .join('')}
        </table>

        <div style="background: #f9f9f9; padding: 15px; margin: 20px 0; border-radius: 5px;">
          <p><strong>Shipping Address:</strong></p>
          <p>${order.shipping_address}</p>
        </div>

        <p style="color: #666; font-size: 14px; margin-top: 20px;">
          We'll send you a tracking number as soon as your order ships. 
          Thank you for shopping with Grazel Atelier!
        </p>
      </div>
    `,
  }),

  orderShipped: (order, trackingNumber) => ({
    subject: `Your Order Has Shipped - ${order.order_number}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #333;">Your Order is On The Way!</h2>
        
        <div style="background: #e8f5e9; padding: 15px; margin: 20px 0; border-radius: 5px; border-left: 4px solid #4caf50;">
          <p><strong>Order Number:</strong> ${order.order_number}</p>
          <p><strong>Tracking Number:</strong> <code style="background: #fff; padding: 5px 10px; border-radius: 3px;">${trackingNumber || 'N/A'}</code></p>
          <p><strong>Estimated Delivery:</strong> ${order.estimated_delivery_date || 'Within 7 days'}</p>
        </div>

        <p>Your order has been dispatched and is on its way to you!</p>
        <p style="color: #666; font-size: 14px;">
          Track your shipment using the tracking number above on the courier's website.
        </p>
      </div>
    `,
  }),

  orderDelivered: (order) => ({
    subject: `Delivery Confirmed - ${order.order_number}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #333;">Your Order Has Been Delivered!</h2>
        
        <div style="background: #e3f2fd; padding: 15px; margin: 20px 0; border-radius: 5px; border-left: 4px solid #2196f3;">
          <p><strong>Order Number:</strong> ${order.order_number}</p>
          <p><strong>Delivered On:</strong> ${order.actual_delivery_date || new Date().toLocaleDateString()}</p>
        </div>

        <p>We hope you love your order! If you have any questions or concerns, please don't hesitate to reach out.</p>
        <p style="color: #666; font-size: 14px; margin-top: 20px;">
          We'd love to hear your feedback. Reply to this email or visit our website to leave a review.
        </p>
      </div>
    `,
  }),

  reviewRequest: (customerName, productName, orderNumber) => ({
    subject: `Share Your Experience with ${productName}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #333;">How Did We Do?</h2>
        
        <p>Hi ${customerName},</p>
        <p>We'd love to hear about your experience with <strong>${productName}</strong> from order <strong>${orderNumber}</strong>.</p>
        
        <p style="margin: 20px 0;">
          <a href="https://grazel.com/reviews" style="display: inline-block; background: #4caf50; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px;">
            Write a Review
          </a>
        </p>

        <p style="color: #666; font-size: 14px;">
          Your feedback helps us improve and helps other customers make informed decisions.
        </p>
      </div>
    `,
  }),

  returnApproved: (order, returnAmount) => ({
    subject: `Return Approved - ${order.order_number}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #333;">Your Return Has Been Approved</h2>
        
        <div style="background: #f3e5f5; padding: 15px; margin: 20px 0; border-radius: 5px;">
          <p><strong>Order Number:</strong> ${order.order_number}</p>
          <p><strong>Refund Amount:</strong> ₹${(returnAmount || 0).toFixed(2)}</p>
          <p><strong>Status:</strong> Approved and Processing</p>
        </div>

        <p>Your return request has been approved. The refund will be processed within 5-7 business days.</p>
        <p style="color: #666; font-size: 14px;">
          You can track the status of your return in your account dashboard.
        </p>
      </div>
    `,
  }),

  newsLetter: (firstName, unsubscribeToken) => ({
    subject: 'Welcome to Grazel Newsletter - Exclusive Offers Inside!',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #333;">Welcome to Grazel Atelier!</h2>
        
        <p>Hi ${firstName || 'Valued Customer'},</p>
        <p>Thank you for subscribing to our newsletter. We're excited to share our latest collections, exclusive offers, and fashion tips with you.</p>

        <div style="background: #fff3e0; padding: 15px; margin: 20px 0; border-radius: 5px; border-left: 4px solid #ff9800;">
          <p><strong>What to Expect:</strong></p>
          <ul style="margin: 10px 0; padding-left: 20px;">
            <li>New collection launches</li>
            <li>Exclusive subscriber-only discounts</li>
            <li>Seasonal trends and style tips</li>
            <li>Limited-time offers</li>
          </ul>
        </div>

        <p style="color: #666; font-size: 12px; margin-top: 20px;">
          <a href="https://grazel.com/unsubscribe/${unsubscribeToken}" style="color: #666; text-decoration: none;">
            Unsubscribe from newsletter
          </a>
        </p>
      </div>
    `,
  }),
};

// ============================================================================
// SEND EMAIL FUNCTIONS
// ============================================================================

/**
 * Generic email sender
 */
async function sendEmail(to, subject, html) {
  const transport = initializeTransporter();

  if (!transport) {
    console.warn('⚠ Email service not available. Email not sent to:', to);
    return { success: false, error: 'Email service not configured' };
  }

  try {
    const mailOptions = {
      from: process.env.EMAIL_FROM || process.env.EMAIL_USER || 'noreply@grazel.com',
      to,
      subject,
      html,
    };

    const info = await transport.sendMail(mailOptions);
    console.log('✓ Email sent successfully:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('✗ Email send failed:', error.message);
    return { success: false, error: error.message };
  }
}

/**
 * Send order confirmation email
 */
export async function sendOrderConfirmationEmail(order, items) {
  const template = emailTemplates.orderConfirmation(order, items);
  return sendEmail(order.customer_email, template.subject, template.html);
}

/**
 * Send order shipped email
 */
export async function sendOrderShippedEmail(order, trackingNumber) {
  const template = emailTemplates.orderShipped(order, trackingNumber);
  return sendEmail(order.customer_email, template.subject, template.html);
}

/**
 * Send order delivered email
 */
export async function sendOrderDeliveredEmail(order) {
  const template = emailTemplates.orderDelivered(order);
  return sendEmail(order.customer_email, template.subject, template.html);
}

/**
 * Send review request email
 */
export async function sendReviewRequestEmail(customerEmail, customerName, productName, orderNumber) {
  const template = emailTemplates.reviewRequest(customerName, productName, orderNumber);
  return sendEmail(customerEmail, template.subject, template.html);
}

/**
 * Send return approved email
 */
export async function sendReturnApprovedEmail(order, returnAmount) {
  const template = emailTemplates.returnApproved(order, returnAmount);
  return sendEmail(order.customer_email, template.subject, template.html);
}

/**
 * Send newsletter welcome email
 */
export async function sendNewsletterWelcomeEmail(email, firstName, unsubscribeToken) {
  const template = emailTemplates.newsLetter(firstName, unsubscribeToken);
  return sendEmail(email, template.subject, template.html);
}

/**
 * Send bulk promotional email
 */
export async function sendBulkPromotionalEmail(recipients, subject, html) {
  const transport = initializeTransporter();

  if (!transport) {
    return { success: false, error: 'Email service not configured', sent: 0, failed: 0 };
  }

  let sent = 0;
  let failed = 0;

  for (const email of recipients) {
    try {
      const mailOptions = {
        from: process.env.EMAIL_FROM || process.env.EMAIL_USER || 'noreply@grazel.com',
        to: email,
        subject,
        html,
      };

      await transport.sendMail(mailOptions);
      sent++;
    } catch (error) {
      console.error('✗ Failed to send to:', email, error.message);
      failed++;
    }
  }

  console.log(`✓ Bulk email sent: ${sent} successful, ${failed} failed`);
  return { success: true, sent, failed };
}

export default {
  sendOrderConfirmationEmail,
  sendOrderShippedEmail,
  sendOrderDeliveredEmail,
  sendReviewRequestEmail,
  sendReturnApprovedEmail,
  sendNewsletterWelcomeEmail,
  sendBulkPromotionalEmail,
};
