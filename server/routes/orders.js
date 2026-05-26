import express from 'express';
import Order from '../models/Order.js';
import { protect, adminOnly } from '../middleware/authMiddleware.js';

const router = express.Router();

// @route   POST /api/orders
// @desc    Place a new order
// @access  Public
router.post('/', async (req, res) => {
  const { userId, customerName, customerEmail, shippingAddress, totalAmount, items } = req.body;

  try {
    const formattedItems = items.map((item) => ({
      productId: item.productId || item.product?.id,
      productName: item.productName || item.product?.name,
      price: item.price || item.product?.price,
      size: item.size,
      quantity: item.quantity,
      isPreOrder: item.isPreOrder ?? item.product?.isPreOrder ?? false,
      preOrderMessage: item.preOrderMessage || item.product?.preOrderMessage,
    }));

    const order = new Order({
      userId: userId || null,
      customerName,
      customerEmail,
      shippingAddress,
      totalAmount,
      items: formattedItems,
      status: 'Processing',
    });

    const createdOrder = await order.save();
    res.status(201).json(createdOrder);
  } catch (err) {
    console.error('Create Order Error:', err);
    res.status(400).json({ message: err.message || 'Error processing order' });
  }
});

// @route   GET /api/orders/my-orders
// @desc    Get order history of logged-in user
// @access  Private
router.get('/my-orders', protect, async (req, res) => {
  try {
    const orders = await Order.find({ userId: req.user._id }).sort({ createdAt: -1 });
    
    // Format response to match frontend requirements
    const formattedOrders = orders.map((o) => ({
      id: o._id,
      customer_name: o.customerName,
      customer_email: o.customerEmail,
      shipping_address: o.shippingAddress,
      total_amount: o.totalAmount,
      status: o.status,
      created_at: o.createdAt,
      order_items: o.items.map((item) => ({
        id: item._id,
        product_name: item.productName,
        price: item.price,
        size: item.size,
        quantity: item.quantity,
        is_pre_order: item.isPreOrder,
        pre_order_message: item.preOrderMessage,
      })),
    }));

    res.json(formattedOrders);
  } catch (err) {
    console.error('Fetch My Orders Error:', err);
    res.status(500).json({ message: err.message || 'Server error loading order history' });
  }
});

// @route   GET /api/orders/all
// @desc    Get all orders (Admin only)
// @access  Private/Admin
router.get('/all', protect, adminOnly, async (req, res) => {
  try {
    const orders = await Order.find({}).sort({ createdAt: -1 });
    
    const formattedOrders = orders.map((o) => ({
      id: o._id,
      user_id: o.userId,
      customer_name: o.customerName,
      customer_email: o.customerEmail,
      shipping_address: o.shippingAddress,
      total_amount: o.totalAmount,
      status: o.status,
      created_at: o.createdAt,
      order_items: o.items.map((item) => ({
        id: item._id,
        product_name: item.productName,
        price: item.price,
        size: item.size,
        quantity: item.quantity,
        is_pre_order: item.isPreOrder,
        pre_order_message: item.preOrderMessage,
      })),
    }));

    res.json(formattedOrders);
  } catch (err) {
    console.error('Fetch Admin Orders Error:', err);
    res.status(500).json({ message: err.message || 'Server error loading admin orders' });
  }
});

// @route   PUT /api/orders/:id/status
// @desc    Update order status (Admin only)
// @access  Private/Admin
router.put('/:id/status', protect, adminOnly, async (req, res) => {
  const { status } = req.body;

  try {
    const order = await Order.findById(req.params.id);

    if (order) {
      order.status = status;
      const updatedOrder = await order.save();
      res.json(updatedOrder);
    } else {
      res.status(404).json({ message: 'Order not found' });
    }
  } catch (err) {
    console.error('Update Order Status Error:', err);
    res.status(400).json({ message: err.message || 'Error updating order status' });
  }
});

export default router;
