import mongoose from 'mongoose';

const fitProfileSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false, // Allow anonymous fit profiles
  },
  type: {
    type: String,
    enum: ['simple', 'detailed'],
    required: true,
  },
  // Simple Fit Profile fields
  height: {
    type: Number, // in cm
    required: false,
  },
  weight: {
    type: Number, // in kg
    required: false,
  },
  // Detailed Fit Profile fields (Curate Your Fit)
  chest: {
    type: Number, // in cm
    required: false,
  },
  shoulderWidth: {
    type: Number,
    required: false,
  },
  waist: {
    type: Number,
    required: false,
  },
  hip: {
    type: Number,
    required: false,
  },
  bicep: {
    type: Number,
    required: false,
  },
  wrist: {
    type: Number,
    required: false,
  },
  armLength: {
    type: Number,
    required: false,
  },
  garmentLength: {
    type: Number,
    required: false,
  },
  // Recommendations based on measurements
  recommendedSize: {
    type: String,
    trim: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

// Update timestamp on save
fitProfileSchema.pre('save', function() {
  this.updatedAt = Date.now();
});

// Virtual for API compatibility
fitProfileSchema.set('toJSON', {
  virtuals: true,
  transform: (doc, ret) => {
    ret.id = ret._id.toString();
    delete ret._id;
    delete ret.__v;
    return ret;
  }
});

const FitProfile = mongoose.model('FitProfile', fitProfileSchema);
export default FitProfile;
