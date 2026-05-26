import mongoose from 'mongoose';

const measurementSchema = new mongoose.Schema({
  fitType: {
    type: String,
    enum: ['top', 'bottom'],
    required: true,
  },
  name: {
    type: String,
    required: true,
    trim: true,
  },
  datatype: {
    type: String,
    enum: ['number', 'decimal', 'integer', 'string', 'percentage'],
    default: 'number',
  },
  description: {
    type: String,
    trim: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Create virtual for compatible API mapping: translate `id` fields
measurementSchema.set('toJSON', {
  virtuals: true,
  transform: (doc, ret) => {
    ret.id = ret._id.toString();
    delete ret._id;
    delete ret.__v;
    return ret;
  }
});

const Measurement = mongoose.model('Measurement', measurementSchema);
export default Measurement;
