/**
 * API Configuration
 * This file handles different API base URLs based on environment
 */

const API_BASE_URL =
  process.env.NODE_ENV === 'production' && process.env.VITE_API_URL
    ? process.env.VITE_API_URL
    : process.env.VITE_API_URL || 'http://localhost:5000';

export default API_BASE_URL;

/**
 * Example Usage:
 * 
 * import API_BASE_URL from '@/config/api';
 * 
 * const response = await fetch(`${API_BASE_URL}/api/products`);
 * const products = await response.json();
 */
