import mongoose from 'mongoose';

const orderItemSchema = new mongoose.Schema({
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: false, // can be null if product is deleted from catalog
  },
  productName: {
    type: String,
    required: true,
  },
  price: {
    type: Number,
    required: true,
    min: 0,
  },
  size: {
    type: String,
    required: true,
  },
  quantity: {
    type: Number,
    required: true,
    min: 1,
  },
  isPreOrder: {
    type: Boolean,
    default: false,
  },
  preOrderMessage: {
    type: String,
    trim: true,
  },
});

const orderSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false, // supports guest checkouts
  },
  customerName: {
    type: String,
    required: true,
  },
  customerEmail: {
    type: String,
    required: true,
  },
  shippingAddress: {
    type: String,
    required: true,
  },
  totalAmount: {
    type: Number,
    required: true,
    min: 0,
  },
  status: {
    type: String,
    enum: ['Processing', 'Shipped', 'Delivered', 'Cancelled'],
    default: 'Processing',
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  items: [orderItemSchema],
});

// Configure JSON transform to compatible format
orderSchema.set('toJSON', {
  virtuals: true,
  transform: (doc, ret) => {
    ret.id = ret._id.toString();
    delete ret._id;
    delete ret.__v;
    if (ret.items) {
      ret.items = ret.items.map((item) => {
        item.id = item._id.toString();
        delete item._id;
        return item;
      });
    }
    return ret;
  }
});

const Order = mongoose.model('Order', orderSchema);
export default Order;
