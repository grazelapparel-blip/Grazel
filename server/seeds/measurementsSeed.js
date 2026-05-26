import Measurement from '../models/Measurement.js';

const defaultMeasurements = [
  // Top Measurements
  { fitType: 'top', name: 'Chest/Bust', datatype: 'decimal', description: 'Full chest circumference' },
  { fitType: 'top', name: 'Shoulder width', datatype: 'decimal', description: 'Shoulder to shoulder width' },
  { fitType: 'top', name: 'Waist', datatype: 'decimal', description: 'Natural waist circumference' },
  { fitType: 'top', name: 'Hip', datatype: 'decimal', description: 'Hip circumference' },
  { fitType: 'top', name: 'Bicep', datatype: 'decimal', description: 'Upper arm circumference' },
  { fitType: 'top', name: 'Wrist', datatype: 'decimal', description: 'Wrist circumference' },
  { fitType: 'top', name: 'Arm length', datatype: 'decimal', description: 'Shoulder to wrist length' },
  { fitType: 'top', name: 'Garment length', datatype: 'decimal', description: 'Total garment length from shoulder' },

  // Bottom Measurements
  { fitType: 'bottom', name: 'Waist', datatype: 'decimal', description: 'Natural waist circumference' },
  { fitType: 'bottom', name: 'Hip', datatype: 'decimal', description: 'Hip circumference' },
  { fitType: 'bottom', name: 'Thigh circumference', datatype: 'decimal', description: 'Upper thigh circumference' },
  { fitType: 'bottom', name: 'Calf circumference', datatype: 'decimal', description: 'Calf circumference' },
  { fitType: 'bottom', name: 'Inseam', datatype: 'decimal', description: 'Inseam length (crotch to ankle)' },
  { fitType: 'bottom', name: 'Outseam', datatype: 'decimal', description: 'Outseam length (waist to ankle)' },
  { fitType: 'bottom', name: 'Ankle opening', datatype: 'decimal', description: 'Ankle circumference' },
];

export const seedMeasurements = async () => {
  try {
    const count = await Measurement.countDocuments();
    
    if (count === 0) {
      console.log('Seeding default measurements...');
      await Measurement.insertMany(defaultMeasurements);
      console.log(`✓ Created ${defaultMeasurements.length} default measurements`);
    } else {
      console.log(`✓ Measurements already exist (${count} found)`);
    }
  } catch (err) {
    console.error('Error seeding measurements:', err);
  }
};

export default seedMeasurements;
