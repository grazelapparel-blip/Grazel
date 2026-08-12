// Shared in-memory database for local fallback when Supabase is not available
import bcrypt from 'bcryptjs';

const SALT_ROUNDS = 10;
const DEFAULT_ADMIN_HASH = String(bcrypt.hashSync('admin123', SALT_ROUNDS));

export const mockUsers = new Map();
mockUsers.set('admin@grazel.com', {
  id: 'admin_001',
  email: 'admin@grazel.com',
  name: 'Grazel Admin',
  role: 'admin',
  password_hash: DEFAULT_ADMIN_HASH,
  created_at: new Date().toISOString(),
});

export const mockOrders = [];
export const mockReviews = [];

export const defaultSizeGuides = [
  // Top size guide
  {
    id: 'sg_top_s',
    product_type: 'top',
    size_code: 'S',
    unit: 'cm',
    measurements: { chest: '92', waist: '82', hip: '94', shoulder: '42' },
    is_active: true
  },
  {
    id: 'sg_top_m',
    product_type: 'top',
    size_code: 'M',
    unit: 'cm',
    measurements: { chest: '96', waist: '86', hip: '98', shoulder: '44' },
    is_active: true
  },
  {
    id: 'sg_top_l',
    product_type: 'top',
    size_code: 'L',
    unit: 'cm',
    measurements: { chest: '100', waist: '90', hip: '102', shoulder: '46' },
    is_active: true
  },
  {
    id: 'sg_top_xl',
    product_type: 'top',
    size_code: 'XL',
    unit: 'cm',
    measurements: { chest: '104', waist: '94', hip: '106', shoulder: '48' },
    is_active: true
  },
  
  // Bottom size guide
  {
    id: 'sg_bottom_30',
    product_type: 'bottom',
    size_code: '30',
    unit: 'cm',
    measurements: { waist: '76', hip: '94', inseam: '78', outseam: '102' },
    is_active: true
  },
  {
    id: 'sg_bottom_32',
    product_type: 'bottom',
    size_code: '32',
    unit: 'cm',
    measurements: { waist: '81', hip: '99', inseam: '79', outseam: '103' },
    is_active: true
  },
  {
    id: 'sg_bottom_34',
    product_type: 'bottom',
    size_code: '34',
    unit: 'cm',
    measurements: { waist: '86', hip: '104', inseam: '80', outseam: '104' },
    is_active: true
  },
  
  // Dress size guide
  {
    id: 'sg_dress_s',
    product_type: 'dress',
    size_code: 'S',
    unit: 'cm',
    measurements: { chest: '88', waist: '68', hip: '94', length: '110' },
    is_active: true
  },
  {
    id: 'sg_dress_m',
    product_type: 'dress',
    size_code: 'M',
    unit: 'cm',
    measurements: { chest: '92', waist: '72', hip: '98', length: '112' },
    is_active: true
  },
  {
    id: 'sg_dress_l',
    product_type: 'dress',
    size_code: 'L',
    unit: 'cm',
    measurements: { chest: '96', waist: '76', hip: '102', length: '114' },
    is_active: true
  }
];

export let mockSizeGuides = [...defaultSizeGuides];

export function resetMockSizeGuides() {
  mockSizeGuides = [...defaultSizeGuides];
}
