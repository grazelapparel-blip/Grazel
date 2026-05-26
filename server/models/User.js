import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true,
  },
  password: {
    type: String,
    required: false, // Optional for OAuth users
  },
  role: {
    type: String,
    enum: ['user', 'admin'],
    default: 'user',
  },
  // OAuth fields
  authProvider: {
    type: String,
    enum: ['email', 'google'],
    default: 'email',
  },
  googleId: {
    type: String,
    sparse: true,
  },
  avatar: {
    type: String, // Profile picture URL from Google
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Hash password before saving (only if password is provided)
userSchema.pre('save', async function () {
  if (!this.isModified('password') || !this.password) {
    return;
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// Compare password method
userSchema.methods.comparePassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

const User = mongoose.model('User', userSchema);
export default User;
