import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Measurement from './server/models/Measurement.js';

dotenv.config();

const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/grazel';

mongoose.connect(mongoURI).then(async () => {
  const result = await Measurement.deleteMany({});
  console.log(`Deleted ${result.deletedCount} measurements`);
  await mongoose.connection.close();
  process.exit(0);
});
