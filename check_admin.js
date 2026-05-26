import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from './server/models/User.js';

dotenv.config();

const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/grazel';

mongoose.connect(mongoURI).then(async () => {
  const admin = await User.findOne({ email: 'admin@grazel.com' });
  console.log('Admin user:', admin);
  
  const allUsers = await User.find({});
  console.log('All users:', allUsers);
  
  await mongoose.connection.close();
  process.exit(0);
});
