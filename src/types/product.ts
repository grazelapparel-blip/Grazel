export interface Product {
  id: string;
  name: string;
  price: number;
  originalPrice?: number;
  discount?: number;
  category: string;
  subcategory: string;
  fabric: string;
  fit: string;
  fitType?: 'top' | 'bottom' | 'none';
  sizes: string[];
  images: string[];
  isNew?: boolean;
  isBestSeller?: boolean;
  isPreOrder?: boolean;
  preOrderMessage?: string;
  description?: string;
  careInstructions?: string[];
  composition?: string;
  deliveryReturns?: string;
  returnWindowDays?: number;
  tailoredFitMeasurements?: string[];
}

export interface FilterState {
  category: string[];
  subcategory: string[];
  color: string[];
  fabric: string[];
  fit: string[];
  size: string[];
  priceRange: [number, number];
  availability: boolean;
}

export interface CartItem {
  product: Product;
  size: string;
  quantity: number;
}

export interface WishlistItem {
  product: Product;
}

export type SortOption = 'new' | 'price-asc' | 'price-desc' | 'bestsellers';
