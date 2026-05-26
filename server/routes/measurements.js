import express from 'express';
import Measurement from '../models/Measurement.js';
import { protect, adminOnly } from '../middleware/authMiddleware.js';

const router = express.Router();

// @route   GET /api/measurements
// @desc    Get all measurements by fit type (top/bottom)
// @access  Public
router.get('/', async (req, res) => {
  try {
    const fitType = req.query.fitType; // Optional filter

    let query = {};
    if (fitType) {
      query.fitType = fitType;
    }

    const measurements = await Measurement.find(query).sort({ fitType: 1, name: 1 });
    res.json(measurements);
  } catch (err) {
    console.error('Fetch Measurements Error:', err);
    res.status(500).json({ message: err.message || 'Server error fetching measurements' });
  }
});

// @route   GET /api/measurements/:fitType
// @desc    Get measurements for a specific fit type
// @access  Public
router.get('/:fitType', async (req, res) => {
  try {
    const { fitType } = req.params;

    if (!['top', 'bottom'].includes(fitType)) {
      return res.status(400).json({ message: 'Invalid fit type. Must be "top" or "bottom".' });
    }

    const measurements = await Measurement.find({ fitType }).sort({ name: 1 });
    res.json(measurements);
  } catch (err) {
    console.error('Fetch Measurements Error:', err);
    res.status(500).json({ message: err.message || 'Server error fetching measurements' });
  }
});

// @route   POST /api/measurements
// @desc    Create a new measurement (Admin only)
// @access  Private/Admin
router.post('/', protect, adminOnly, async (req, res) => {
  try {
    const { fitType, name, description, datatype } = req.body;

    if (!fitType || !name) {
      return res.status(400).json({ message: 'fitType and name are required' });
    }

    if (!['top', 'bottom'].includes(fitType)) {
      return res.status(400).json({ message: 'Invalid fit type. Must be "top" or "bottom".' });
    }

    if (datatype && !['number', 'decimal', 'integer', 'string', 'percentage'].includes(datatype)) {
      return res.status(400).json({ message: 'Invalid datatype. Must be one of: number, decimal, integer, string, percentage.' });
    }

    // Check for duplicate
    const existingMeasurement = await Measurement.findOne({ fitType, name });
    if (existingMeasurement) {
      return res.status(400).json({ message: 'This measurement already exists for this fit type' });
    }

    const measurement = await Measurement.create({
      fitType,
      name,
      datatype: datatype || 'number',
      description: description || '',
    });

    res.status(201).json(measurement);
  } catch (err) {
    console.error('Create Measurement Error:', err);
    res.status(500).json({ message: err.message || 'Server error creating measurement' });
  }
});

// @route   PUT /api/measurements/:id
// @desc    Update a measurement (Admin only)
// @access  Private/Admin
router.put('/:id', protect, adminOnly, async (req, res) => {
  try {
    const { id } = req.params;
    const { fitType, name, description, datatype } = req.body;

    const measurement = await Measurement.findById(id);
    if (!measurement) {
      return res.status(404).json({ message: 'Measurement not found' });
    }

    if (fitType && !['top', 'bottom'].includes(fitType)) {
      return res.status(400).json({ message: 'Invalid fit type. Must be "top" or "bottom".' });
    }

    if (datatype && !['number', 'decimal', 'integer', 'string', 'percentage'].includes(datatype)) {
      return res.status(400).json({ message: 'Invalid datatype. Must be one of: number, decimal, integer, string, percentage.' });
    }

    // Check for duplicate if name or fitType is being changed
    if ((fitType || name) && (fitType !== measurement.fitType || name !== measurement.name)) {
      const existingMeasurement = await Measurement.findOne({
        fitType: fitType || measurement.fitType,
        name: name || measurement.name,
      });

      if (existingMeasurement && existingMeasurement._id.toString() !== id) {
        return res.status(400).json({ message: 'This measurement already exists for this fit type' });
      }
    }

    if (fitType) measurement.fitType = fitType;
    if (name) measurement.name = name;
    if (description !== undefined) measurement.description = description;
    if (datatype) measurement.datatype = datatype;

    const updated = await measurement.save();
    res.json(updated);
  } catch (err) {
    console.error('Update Measurement Error:', err);
    res.status(500).json({ message: err.message || 'Server error updating measurement' });
  }
});

// @route   DELETE /api/measurements/:id
// @desc    Delete a measurement (Admin only)
// @access  Private/Admin
router.delete('/:id', protect, adminOnly, async (req, res) => {
  try {
    const { id } = req.params;

    const measurement = await Measurement.findByIdAndDelete(id);
    if (!measurement) {
      return res.status(404).json({ message: 'Measurement not found' });
    }

    res.json({ message: 'Measurement deleted successfully' });
  } catch (err) {
    console.error('Delete Measurement Error:', err);
    res.status(500).json({ message: err.message || 'Server error deleting measurement' });
  }
});

export default router;
