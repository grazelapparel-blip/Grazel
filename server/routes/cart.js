import express from 'express';
import Cart from '../models/Cart.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// @route   GET /api/cart
// @desc    Get user's cart
// @access  Private
router.get('/', protect, async (req, res) => {
  try {
    let cart = await Cart.findOne({ userId: req.user._id }).populate('items.productId');
    
    if (!cart) {
      // Create empty cart for new user if it doesn't exist
      cart = await Cart.create({ userId: req.user._id, items: [] });
    }

    // Format output to match frontend structure: { product, size, quantity }
    const formattedItems = cart.items
      .filter((item) => item.productId !== null) // filter out deleted products
      .map((item) => ({
        product: item.productId,
        size: item.size,
        quantity: item.quantity,
      }));

    res.json(formattedItems);
  } catch (err) {
    console.error('Fetch Cart Error:', err);
    res.status(500).json({ message: err.message || 'Server error loading cart' });
  }
});

// @route   POST /api/cart
// @desc    Sync user's cart (overwrites database cart)
// @access  Private
router.post('/', protect, async (req, res) => {
  const { items } = req.body; // array of { productId, size, quantity }

  try {
    let cart = await Cart.findOne({ userId: req.user._id });

    const formattedItems = items.map((item) => ({
      productId: item.productId || item.product?.id,
      size: item.size,
      quantity: item.quantity,
    }));

    if (cart) {
      cart.items = formattedItems;
      await cart.save();
    } else {
      cart = await Cart.create({
        userId: req.user._id,
        items: formattedItems,
      });
    }

    // Populate products to return fully detailed cart
    const populatedCart = await Cart.findById(cart._id).populate('items.productId');
    
    const responseItems = populatedCart.items
      .filter((item) => item.productId !== null)
      .map((item) => ({
        product: item.productId,
        size: item.size,
        quantity: item.quantity,
      }));

    res.json(responseItems);
  } catch (err) {
    console.error('Sync Cart Error:', err);
    res.status(500).json({ message: err.message || 'Server error saving cart' });
  }
});

export default router;
