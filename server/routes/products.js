import express from 'express';
import Product from '../models/Product.js';
import { protect, adminOnly } from '../middleware/authMiddleware.js';

const router = express.Router();

// @route   GET /api/products
// @desc    Get all products
// @access  Public
router.get('/', async (req, res) => {
  try {
    const products = await Product.find({}).sort({ createdAt: -1 });
    res.json(products);
  } catch (err) {
    console.error('Fetch Products Error:', err);
    res.status(500).json({ message: err.message || 'Server error fetching catalog' });
  }
});

// @route   GET /api/products/:id
// @desc    Get product by ID
// @access  Public
router.get('/:id', async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (product) {
      res.json(product);
    } else {
      res.status(404).json({ message: 'Product not found' });
    }
  } catch (err) {
    console.error('Fetch Product Detail Error:', err);
    res.status(500).json({ message: 'Invalid product ID format or server error' });
  }
});

// @route   POST /api/products
// @desc    Create a new product (Admin only)
// @access  Private/Admin
router.post('/', protect, adminOnly, async (req, res) => {
  const {
    name, price, originalPrice, discount, category, subcategory,
    color, fabric, fit, sizes, images, isNewProduct, isBestseller,
    isPreOrder, preOrderMessage,
    description, careInstructions, composition, deliveryReturns, fitType, tailoredFitMeasurements, returnWindowDays
  } = req.body;

  try {
    const product = new Product({
      name,
      price,
      originalPrice: originalPrice || price,
      discount: discount || 0,
      category,
      subcategory,
      color,
      fabric,
      fit: fit || 'Regular',
      sizes: sizes || [],
      images: images || ['/placeholder.svg'],
      isNewProduct: isNewProduct || false,
      isBestseller: isBestseller || false,
      isPreOrder: isPreOrder || false,
      preOrderMessage,
      description,
      careInstructions: careInstructions || [],
      composition,
      deliveryReturns,
      returnWindowDays: returnWindowDays || 30,
      fitType: fitType || 'none',
      tailoredFitMeasurements: tailoredFitMeasurements || [],
    });

    const createdProduct = await product.save();
    res.status(201).json(createdProduct);
  } catch (err) {
    console.error('Create Product Error:', err);
    res.status(400).json({ message: err.message || 'Invalid product details' });
  }
});

// @route   PUT /api/products/:id
// @desc    Update a product (Admin only)
// @access  Private/Admin
router.put('/:id', protect, adminOnly, async (req, res) => {
  const {
    name, price, originalPrice, discount, category, subcategory,
    color, fabric, fit, sizes, images, isNewProduct, isBestseller,
    isPreOrder, preOrderMessage,
    description, careInstructions, composition, deliveryReturns, fitType, tailoredFitMeasurements, returnWindowDays
  } = req.body;

  try {
    const product = await Product.findById(req.params.id);

    if (product) {
      product.name = name ?? product.name;
      product.price = price ?? product.price;
      product.originalPrice = originalPrice ?? product.originalPrice;
      product.discount = discount ?? product.discount;
      product.category = category ?? product.category;
      product.subcategory = subcategory ?? product.subcategory;
      product.color = color ?? product.color;
      product.fabric = fabric ?? product.fabric;
      product.fit = fit ?? product.fit;
      product.sizes = sizes ?? product.sizes;
      product.images = images ?? product.images;
      product.isNewProduct = isNewProduct ?? product.isNewProduct;
      product.isBestseller = isBestseller ?? product.isBestseller;
      product.isPreOrder = isPreOrder ?? product.isPreOrder;
      product.preOrderMessage = preOrderMessage ?? product.preOrderMessage;
      product.description = description ?? product.description;
      product.careInstructions = careInstructions ?? product.careInstructions;
      product.composition = composition ?? product.composition;
      product.deliveryReturns = deliveryReturns ?? product.deliveryReturns;
      product.returnWindowDays = returnWindowDays ?? product.returnWindowDays;
      product.fitType = fitType ?? product.fitType;
      product.tailoredFitMeasurements = tailoredFitMeasurements ?? product.tailoredFitMeasurements;

      const updatedProduct = await product.save();
      res.json(updatedProduct);
    } else {
      res.status(404).json({ message: 'Product not found' });
    }
  } catch (err) {
    console.error('Update Product Error:', err);
    res.status(400).json({ message: err.message || 'Invalid product details' });
  }
});

// @route   DELETE /api/products/:id
// @desc    Delete a product (Admin only)
// @access  Private/Admin
router.delete('/:id', protect, adminOnly, async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);

    if (product) {
      await Product.findByIdAndDelete(req.params.id);
      res.json({ message: 'Product removed successfully' });
    } else {
      res.status(404).json({ message: 'Product not found' });
    }
  } catch (err) {
    console.error('Delete Product Error:', err);
    res.status(500).json({ message: err.message || 'Server error deleting product' });
  }
});

export default router;
