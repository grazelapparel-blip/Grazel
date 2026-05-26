import express from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { protect, adminOnly } from '../middleware/authMiddleware.js';

const router = express.Router();

// Generate Token helper
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || 'fallback_secret', {
    expiresIn: '30d',
  });
};

// @route   POST /api/auth/register
// @desc    Register a new user
// @access  Public
router.post('/register', async (req, res) => {
  const { name, email, password, role } = req.body;

  try {
    const userExists = await User.findOne({ email });

    if (userExists) {
      return res.status(400).json({ message: 'User already exists with this email' });
    }

    const user = await User.create({
      name,
      email,
      password,
      role: role || 'user',
    });

    if (user) {
      res.status(201).json({
        token: generateToken(user._id),
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
        },
      });
    } else {
      res.status(400).json({ message: 'Invalid user data' });
    }
  } catch (err) {
    console.error('Registration Error:', err);
    res.status(500).json({ message: err.message || 'Server error during registration' });
  }
});

// @route   POST /api/auth/login
// @desc    Authenticate user & get token
// @access  Public
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });

    if (user && (await user.comparePassword(password))) {
      res.json({
        token: generateToken(user._id),
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
        },
      });
    } else {
      res.status(401).json({ message: 'Invalid email or password' });
    }
  } catch (err) {
    console.error('Login Error:', err);
    res.status(500).json({ message: err.message || 'Server error during authentication' });
  }
});

// @route   POST /api/auth/google
// @desc    Google OAuth login/signup
// @access  Public
router.post('/google', async (req, res) => {
  const { googleId, email, name, avatar } = req.body;

  try {
    if (!googleId || !email) {
      return res.status(400).json({ message: 'Missing required Google auth data' });
    }

    // Check if user exists with this Google ID
    let user = await User.findOne({ googleId });

    if (!user) {
      // Check if user exists with this email (existing email user)
      user = await User.findOne({ email });

      if (user) {
        // Link Google account to existing user
        user.googleId = googleId;
        user.authProvider = 'google';
        user.avatar = avatar || user.avatar;
        await user.save();
      } else {
        // Create new user with Google
        user = await User.create({
          name: name || email.split('@')[0],
          email,
          googleId,
          authProvider: 'google',
          avatar,
          role: 'user',
        });
      }
    } else {
      // Update avatar if provided
      if (avatar && user.avatar !== avatar) {
        user.avatar = avatar;
        await user.save();
      }
    }

    res.json({
      token: generateToken(user._id),
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatar: user.avatar,
        authProvider: user.authProvider,
      },
    });
  } catch (err) {
    console.error('Google Auth Error:', err);
    res.status(500).json({ message: err.message || 'Server error during Google authentication' });
  }
});

// @route   GET /api/auth/me

// @desc    Get current user profile
// @access  Private
router.get('/me', protect, async (req, res) => {
  res.json({
    id: req.user._id,
    name: req.user.name,
    email: req.user.email,
    role: req.user.role,
    createdAt: req.user.createdAt,
  });
});

// @route   GET /api/auth/users
// @desc    Get all users list (Admin only)
// @access  Private/Admin
router.get('/users', protect, adminOnly, async (req, res) => {
  try {
    const users = await User.find({}).select('-password').sort({ createdAt: -1 });
    // Transform _id to id for client compatibility
    const formatted = users.map((u) => ({
      id: u._id,
      name: u.name,
      email: u.email,
      role: u.role,
      created_at: u.createdAt, // key compatibility with client frontend mapping
    }));
    res.json(formatted);
  } catch (err) {
    console.error('Fetch Users Error:', err);
    res.status(500).json({ message: err.message || 'Server error fetching user list' });
  }
});

export default router;
