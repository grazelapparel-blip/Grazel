import express from 'express';
import Review from '../models/Review.js';

const router = express.Router();

// @route   GET /api/reviews/product/:productId
// @desc    Get reviews for a product
// @access  Public
router.get('/product/:productId', async (req, res) => {
  try {
    const reviews = await Review.find({ productId: req.params.productId }).sort({ createdAt: -1 });
    res.json(reviews);
  } catch (err) {
    console.error('Fetch Reviews Error:', err);
    res.status(500).json({ message: err.message || 'Server error loading reviews' });
  }
});

// @route   POST /api/reviews
// @desc    Create or update a purchased product review
// @access  Public
router.post('/', async (req, res) => {
  const {
    productId,
    productName,
    orderId,
    orderItemId,
    customerName,
    rating,
    title,
    comment,
  } = req.body;

  try {
    if (!productId || !productName || !orderId || !orderItemId || !customerName || !rating) {
      return res.status(400).json({ message: 'Product, order, customer, and rating are required' });
    }

    const numericRating = Number(rating);
    if (numericRating < 1 || numericRating > 5) {
      return res.status(400).json({ message: 'Rating must be between 1 and 5' });
    }

    const review = await Review.findOneAndUpdate(
      { orderId, orderItemId },
      {
        productId,
        productName,
        orderId,
        orderItemId,
        customerName,
        rating: numericRating,
        title,
        comment,
      },
      { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true }
    );

    res.status(201).json(review);
  } catch (err) {
    console.error('Create Review Error:', err);
    res.status(400).json({ message: err.message || 'Error saving review' });
  }
});

export default router;
