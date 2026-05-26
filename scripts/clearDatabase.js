import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Product from '../server/models/Product.js';
import User from '../server/models/User.js';
import FitProfile from '../server/models/FitProfile.js';
import Cart from '../server/models/Cart.js';
import Order from '../server/models/Order.js';
import Measurement from '../server/models/Measurement.js';

dotenv.config();

const clearDatabase = async () => {
  const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/grazel';
  
  try {
    await mongoose.connect(mongoURI);
    console.log('Connected to MongoDB');

    // Delete all products (dummy data)
    const deletedProducts = await Product.deleteMany({});
    console.log(`✓ Deleted ${deletedProducts.deletedCount} products`);

    // Delete all fit profiles (dummy data)
    const deletedFitProfiles = await FitProfile.deleteMany({});
    console.log(`✓ Deleted ${deletedFitProfiles.deletedCount} fit profiles`);

    // Delete all carts (dummy data)
    const deletedCarts = await Cart.deleteMany({});
    console.log(`✓ Deleted ${deletedCarts.deletedCount} carts`);

    // Delete all orders (dummy data)
    const deletedOrders = await Order.deleteMany({});
    console.log(`✓ Deleted ${deletedOrders.deletedCount} orders`);

    // Keep admin user - only delete non-admin users
    const deletedUsers = await User.deleteMany({ role: { $ne: 'admin' } });
    console.log(`✓ Deleted ${deletedUsers.deletedCount} regular users (kept admin accounts)`);

    console.log('\n✅ Database cleanup complete!');
    console.log('Admin account (admin@grazel.com) is still available.');
    
    await mongoose.connection.close();
  } catch (err) {
    console.error('Database cleanup error:', err);
    process.exit(1);
  }
};

clearDatabase();
