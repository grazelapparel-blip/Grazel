import mongoose from 'mongoose';

const reviewSchema = new mongoose.Schema({
  productId: {
    type: String,
    required: true,
    index: true,
  },
  productName: {
    type: String,
    required: true,
    trim: true,
  },
  orderId: {
    type: String,
    required: true,
  },
  orderItemId: {
    type: String,
    required: true,
  },
  customerName: {
    type: String,
    required: true,
    trim: true,
  },
  rating: {
    type: Number,
    required: true,
    min: 1,
    max: 5,
  },
  title: {
    type: String,
    trim: true,
    maxlength: 120,
  },
  comment: {
    type: String,
    trim: true,
    maxlength: 1000,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

reviewSchema.index({ orderId: 1, orderItemId: 1 }, { unique: true });

reviewSchema.set('toJSON', {
  virtuals: true,
  transform: (doc, ret) => {
    ret.id = ret._id.toString();
    delete ret._id;
    delete ret.__v;
    return ret;
  },
});

const Review = mongoose.model('Review', reviewSchema);
export default Review;
