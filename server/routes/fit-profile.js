import express from 'express';
import FitProfile from '../models/FitProfile.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// Helper function to calculate recommended size based on measurements
const calculateRecommendedSize = (measurements) => {
  const { height, weight, chest, waist } = measurements;
  
  // Simple algorithm based on measurements
  if (height && weight && !chest) {
    // Simple Fit Profile - height & weight based
    if (height < 165 && weight < 60) return 'XS';
    if (height < 170 && weight < 70) return 'S';
    if (height < 180 && weight < 85) return 'M';
    if (height < 190 && weight < 100) return 'L';
    return 'XL';
  }
  
  // Detailed Fit Profile - chest based (in cm)
  if (chest) {
    if (chest < 84) return 'XS';
    if (chest < 92) return 'S';
    if (chest < 100) return 'M';
    if (chest < 108) return 'L';
    if (chest < 116) return 'XL';
    return 'XXL';
  }
  
  return 'M'; // Default
};

// @route   POST /api/fit-profile
// @desc    Create or update a fit profile
// @access  Public (can save without auth)
router.post('/', async (req, res) => {
  const { type, height, weight, chest, shoulderWidth, waist, hip, bicep, wrist, armLength, garmentLength, userId } = req.body;

  try {
    if (!type || !['simple', 'detailed'].includes(type)) {
      return res.status(400).json({ message: 'Type must be either "simple" or "detailed"' });
    }

    // Calculate recommended size
    const recommendedSize = calculateRecommendedSize({ height, weight, chest, waist });

    const fitProfile = new FitProfile({
      userId: userId || null,
      type,
      height: type === 'simple' ? height : undefined,
      weight: type === 'simple' ? weight : undefined,
      chest: type === 'detailed' ? chest : undefined,
      shoulderWidth: type === 'detailed' ? shoulderWidth : undefined,
      waist: type === 'detailed' ? waist : undefined,
      hip: type === 'detailed' ? hip : undefined,
      bicep: type === 'detailed' ? bicep : undefined,
      wrist: type === 'detailed' ? wrist : undefined,
      armLength: type === 'detailed' ? armLength : undefined,
      garmentLength: type === 'detailed' ? garmentLength : undefined,
      recommendedSize,
    });

    const savedProfile = await fitProfile.save();
    res.status(201).json(savedProfile);
  } catch (err) {
    console.error('Create Fit Profile Error:', err);
    res.status(400).json({ message: err.message || 'Error creating fit profile' });
  }
});

// @route   GET /api/fit-profile/user/:userId
// @desc    Get fit profile for a specific user
// @access  Private
router.get('/user/:userId', protect, async (req, res) => {
  try {
    // Only allow users to fetch their own profile or admins can fetch any
    if (req.user._id.toString() !== req.params.userId && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to view this profile' });
    }

    const fitProfile = await FitProfile.findOne({ userId: req.params.userId }).sort({ createdAt: -1 });
    
    if (!fitProfile) {
      return res.status(404).json({ message: 'Fit profile not found for this user' });
    }

    res.json(fitProfile);
  } catch (err) {
    console.error('Fetch Fit Profile Error:', err);
    res.status(500).json({ message: err.message || 'Server error fetching fit profile' });
  }
});

// @route   GET /api/fit-profile/me
// @desc    Get current logged-in user's fit profile
// @access  Private
router.get('/me', protect, async (req, res) => {
  try {
    const fitProfile = await FitProfile.findOne({ userId: req.user._id }).sort({ createdAt: -1 });
    
    if (!fitProfile) {
      return res.json(null); // Return null if no profile exists yet
    }

    res.json(fitProfile);
  } catch (err) {
    console.error('Fetch My Fit Profile Error:', err);
    res.status(500).json({ message: err.message || 'Server error fetching your fit profile' });
  }
});

// @route   PUT /api/fit-profile/:id
// @desc    Update a fit profile
// @access  Private
router.put('/:id', protect, async (req, res) => {
  const { type, height, weight, chest, shoulderWidth, waist, hip, bicep, wrist, armLength, garmentLength } = req.body;

  try {
    const fitProfile = await FitProfile.findById(req.params.id);

    if (!fitProfile) {
      return res.status(404).json({ message: 'Fit profile not found' });
    }

    // Authorization check
    if (fitProfile.userId && fitProfile.userId.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to update this profile' });
    }

    // Update fields
    if (type) fitProfile.type = type;
    if (height !== undefined) fitProfile.height = height;
    if (weight !== undefined) fitProfile.weight = weight;
    if (chest !== undefined) fitProfile.chest = chest;
    if (shoulderWidth !== undefined) fitProfile.shoulderWidth = shoulderWidth;
    if (waist !== undefined) fitProfile.waist = waist;
    if (hip !== undefined) fitProfile.hip = hip;
    if (bicep !== undefined) fitProfile.bicep = bicep;
    if (wrist !== undefined) fitProfile.wrist = wrist;
    if (armLength !== undefined) fitProfile.armLength = armLength;
    if (garmentLength !== undefined) fitProfile.garmentLength = garmentLength;

    // Recalculate recommended size
    fitProfile.recommendedSize = calculateRecommendedSize({
      height: fitProfile.height,
      weight: fitProfile.weight,
      chest: fitProfile.chest,
      waist: fitProfile.waist,
    });

    const updatedProfile = await fitProfile.save();
    res.json(updatedProfile);
  } catch (err) {
    console.error('Update Fit Profile Error:', err);
    res.status(400).json({ message: err.message || 'Error updating fit profile' });
  }
});

// @route   GET /api/fit-profile/:id
// @desc    Get fit profile by ID
// @access  Public (can view without auth)
router.get('/:id', async (req, res) => {
  try {
    const fitProfile = await FitProfile.findById(req.params.id);

    if (!fitProfile) {
      return res.status(404).json({ message: 'Fit profile not found' });
    }

    res.json(fitProfile);
  } catch (err) {
    console.error('Fetch Fit Profile Detail Error:', err);
    res.status(500).json({ message: 'Invalid fit profile ID or server error' });
  }
});

export default router;
