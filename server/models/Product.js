import mongoose from 'mongoose';

const productSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  price: {
    type: Number,
    required: true,
    min: 0,
  },
  originalPrice: {
    type: Number,
    min: 0,
  },
  discount: {
    type: Number,
    default: 0,
    min: 0,
    max: 100,
  },
  category: {
    type: String,
    required: true,
    enum: ['men', 'women', 'essentials'],
  },
  subcategory: {
    type: String,
    trim: true,
  },
  color: {
    type: String,
    trim: true,
  },
  fabric: {
    type: String,
    trim: true,
  },
  fit: {
    type: String,
    default: 'Regular',
  },
  sizes: {
    type: [String],
    default: [],
  },
  images: {
    type: [String],
    default: ['/placeholder.svg'],
  },
  isNewProduct: {
    type: Boolean,
    default: false,
  },
  isBestseller: {
    type: Boolean,
    default: false,
  },
  isPreOrder: {
    type: Boolean,
    default: false,
  },
  preOrderMessage: {
    type: String,
    trim: true,
  },
  description: {
    type: String,
    trim: true,
  },
  careInstructions: {
    type: [String],
    default: [],
  },
  composition: {
    type: String,
    trim: true,
  },
  deliveryReturns: {
    type: String,
    trim: true,
  },
  returnWindowDays: {
    type: Number,
    default: 30,
    min: 0,
    description: 'Number of days after purchase within which product can be returned',
  },
  // Tailored Fit Fields
  fitType: {
    type: String,
    enum: ['top', 'bottom', 'none'],
    default: 'none',
  },
  tailoredFitMeasurements: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Measurement',
    },
  ],
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Create virtual for compatible API mapping: translate `id` fields
productSchema.set('toJSON', {
  virtuals: true,
  transform: (doc, ret) => {
    ret.id = ret._id.toString();
    delete ret._id;
    delete ret.__v;
    return ret;
  }
});

const Product = mongoose.model('Product', productSchema);
export default Product;
