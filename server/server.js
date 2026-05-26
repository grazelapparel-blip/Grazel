import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/auth.js';
import productRoutes from './routes/products.js';
import cartRoutes from './routes/cart.js';
import orderRoutes from './routes/orders.js';
import reviewRoutes from './routes/reviews.js';
import fitProfileRoutes from './routes/fit-profile.js';
import measurementRoutes from './routes/measurements.js';
import seedMeasurements from './seeds/measurementsSeed.js';
import Product from './models/Product.js';
import User from './models/User.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' })); // support base64 encoded images during upload

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/fit-profile', fitProfileRoutes);
app.use('/api/measurements', measurementRoutes);

// Root endpoint status
app.get('/api/health', (req, res) => {
  res.json({ status: 'active', database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected' });
});

// Seed Database Function (disabled - no dummy data)
const seedDatabase = async () => {
  try {
    // Dummy product seeding disabled - start with clean database
    /*
    const productsCount = await Product.countDocuments();
    if (productsCount === 0) {
      console.log('Database empty. Seeding initial product catalog...');
      
      const seedProducts = [
        {
          name: 'Tailored Wool Blazer',
          price: 495,
          originalPrice: 495,
          discount: 0,
          category: 'men',
          subcategory: 'blazers',
          color: 'Charcoal',
          fabric: 'Wool',
          fit: 'Slim',
          sizes: ['S', 'M', 'L', 'XL'],
          images: ['/placeholder.svg'],
          isNewProduct: true,
          isBestseller: false,
          description: 'A refined tailored blazer crafted from premium Italian wool, featuring a slim silhouette and subtle horn buttons.',
          careInstructions: ['Dry clean only', 'Store on padded hanger', 'Steam to remove wrinkles'],
          composition: '100% Virgin Wool'
        },
        {
          name: 'Cashmere Crewneck Sweater',
          price: 325,
          originalPrice: 325,
          discount: 0,
          category: 'men',
          subcategory: 'knitwear',
          color: 'Navy',
          fabric: 'Cashmere',
          fit: 'Regular',
          sizes: ['S', 'M', 'L', 'XL', 'XXL'],
          images: ['/placeholder.svg'],
          isNewProduct: false,
          isBestseller: true,
          description: 'Luxuriously soft cashmere sweater with a classic crewneck silhouette.',
          careInstructions: ['Hand wash cold', 'Lay flat to dry', 'Store folded'],
          composition: '100% Cashmere'
        },
        {
          name: 'Cotton Oxford Shirt',
          price: 165,
          originalPrice: 165,
          discount: 0,
          category: 'men',
          subcategory: 'shirts',
          color: 'White',
          fabric: 'Cotton',
          fit: 'Regular',
          sizes: ['S', 'M', 'L', 'XL'],
          images: ['/placeholder.svg'],
          isNewProduct: false,
          isBestseller: false,
          description: 'Essential oxford shirt in premium cotton with mother-of-pearl buttons.',
          careInstructions: ['Machine wash cold', 'Iron on medium heat', 'Tumble dry low'],
          composition: '100% Cotton'
        },
        {
          name: 'Pleated Wool Trousers',
          price: 285,
          originalPrice: 285,
          discount: 0,
          category: 'men',
          subcategory: 'trousers',
          color: 'Charcoal',
          fabric: 'Wool',
          fit: 'Regular',
          sizes: ['28', '30', '32', '34', '36'],
          images: ['/placeholder.svg'],
          isNewProduct: true,
          isBestseller: false,
          description: 'Classic pleated trousers in fine wool suiting fabric.',
          careInstructions: ['Dry clean only', 'Hang to store'],
          composition: '98% Wool, 2% Elastane'
        },
        {
          name: 'Silk Midi Dress',
          price: 595,
          originalPrice: 595,
          discount: 0,
          category: 'women',
          subcategory: 'dresses',
          color: 'Ivory',
          fabric: 'Silk',
          fit: 'Regular',
          sizes: ['XS', 'S', 'M', 'L'],
          images: ['/placeholder.svg'],
          isNewProduct: true,
          isBestseller: true,
          description: 'Elegant midi dress in flowing silk with a subtle drape.',
          careInstructions: ['Dry clean only', 'Store on padded hanger'],
          composition: '100% Silk'
        },
        {
          name: 'Merino Wool Cardigan',
          price: 245,
          originalPrice: 245,
          discount: 0,
          category: 'women',
          subcategory: 'knitwear',
          color: 'Camel',
          fabric: 'Wool',
          fit: 'Relaxed',
          sizes: ['XS', 'S', 'M', 'L', 'XL'],
          images: ['/placeholder.svg'],
          isNewProduct: false,
          isBestseller: false,
          description: 'Soft merino wool cardigan with a relaxed, oversized silhouette.',
          careInstructions: ['Hand wash cold', 'Lay flat to dry'],
          composition: '100% Merino Wool'
        },
        {
          name: 'Linen Wide-Leg Trousers',
          price: 195,
          originalPrice: 195,
          discount: 0,
          category: 'women',
          subcategory: 'trousers',
          color: 'Natural',
          fabric: 'Linen',
          fit: 'Wide',
          sizes: ['XS', 'S', 'M', 'L'],
          images: ['/placeholder.svg'],
          isNewProduct: false,
          isBestseller: false,
          description: 'Effortless wide-leg trousers in breathable pure linen.',
          careInstructions: ['Machine wash cold', 'Iron while damp', 'Hang to dry'],
          composition: '100% Linen'
        },
        {
          name: 'Cotton Poplin Blouse',
          price: 175,
          originalPrice: 175,
          discount: 0,
          category: 'women',
          subcategory: 'shirts',
          color: 'White',
          fabric: 'Cotton',
          fit: 'Regular',
          sizes: ['XS', 'S', 'M', 'L', 'XL'],
          images: ['/placeholder.svg'],
          isNewProduct: false,
          isBestseller: true,
          description: 'Crisp cotton poplin blouse with refined details.',
          careInstructions: ['Machine wash cold', 'Iron on medium heat'],
          composition: '100% Cotton'
        },
        {
          name: 'Leather Belt',
          price: 125,
          originalPrice: 125,
          discount: 0,
          category: 'essentials',
          subcategory: 'accessories',
          color: 'Brown',
          fabric: 'Leather',
          fit: 'Standard',
          sizes: ['85', '90', '95', '100', '105'],
          images: ['/placeholder.svg'],
          isNewProduct: false,
          isBestseller: false,
          description: 'Classic leather belt with brushed silver buckle.',
          careInstructions: ['Wipe with damp cloth', 'Condition leather periodically'],
          composition: '100% Leather'
        },
        {
          name: 'Cashmere Scarf',
          price: 195,
          originalPrice: 195,
          discount: 0,
          category: 'essentials',
          subcategory: 'accessories',
          color: 'Grey',
          fabric: 'Cashmere',
          fit: 'One Size',
          sizes: ['One Size'],
          images: ['/placeholder.svg'],
          isNewProduct: true,
          isBestseller: false,
          description: 'Ultra-soft cashmere scarf in a timeless neutral tone.',
          careInstructions: ['Dry clean only', 'Store folded'],
          composition: '100% Cashmere'
        },
        {
          name: 'Wool Overcoat',
          price: 695,
          originalPrice: 695,
          discount: 0,
          category: 'men',
          subcategory: 'outerwear',
          color: 'Camel',
          fabric: 'Wool',
          fit: 'Regular',
          sizes: ['S', 'M', 'L', 'XL'],
          images: ['/placeholder.svg'],
          isNewProduct: false,
          isBestseller: true,
          description: 'Timeless wool overcoat in a rich camel tone.',
          careInstructions: ['Dry clean only', 'Store on padded hanger'],
          composition: '90% Wool, 10% Cashmere'
        },
        {
          name: 'Silk Scarf',
          price: 165,
          originalPrice: 165,
          discount: 0,
          category: 'women',
          subcategory: 'accessories',
          color: 'Burgundy',
          fabric: 'Silk',
          fit: 'One Size',
          sizes: ['One Size'],
          images: ['/placeholder.svg'],
          isNewProduct: false,
          isBestseller: false,
          description: 'Luxurious silk scarf with hand-rolled edges.',
          careInstructions: ['Dry clean only'],
          composition: '100% Silk'
        }
      ];

      // await Product.insertMany(seedProducts);
      // console.log('Seeded 12 products successfully.');
    }
    */

    // Seed default admin user for testing if none exist
    const adminCount = await User.countDocuments({ role: 'admin' });
    if (adminCount === 0) {
      console.log('No admin users found. Seeding default developer admin account...');
      await User.create({
        name: 'Developer Admin',
        email: 'admin@grazel.com',
        password: 'admin123', // will be hashed automatically by userSchema pre-save hook
        role: 'admin',
      });
      console.log('Admin account created: admin@grazel.com / admin123');
    }
  } catch (err) {
    console.error('Seeding database error:', err);
  }
};

// Database Connection & Server Startup
const connectDB = async () => {
  const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/grazel';
  
  try {
    await mongoose.connect(mongoURI);
    console.log('Connected to MongoDB database successfully.');
    await seedDatabase();
    await seedMeasurements();
    
    app.listen(PORT, () => {
      console.log(`Express server running in development mode on port ${PORT}`);
    });
  } catch (err) {
    console.error('MongoDB database connection failure:', err);
    process.exit(1);
  }
};

connectDB();
