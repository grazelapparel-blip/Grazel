import React, { createContext, useContext, useState, useEffect } from 'react';
import { Product } from '@/types/product';
import { products as mockProducts } from '@/data/products';
import { toast } from 'sonner';

interface ProductContextType {
  products: Product[];
  addProduct: (product: Product) => Promise<void>;
  updateProduct: (product: Product) => Promise<void>;
  deleteProduct: (id: string) => Promise<void>;
  refreshProducts: () => Promise<void>;
  loading: boolean;
}

const ProductContext = createContext<ProductContextType | undefined>(undefined);

export function ProductProvider({ children }: { children: React.ReactNode }) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  const mapBackendProduct = (p: any): Product => ({
    id: p.id,
    name: p.name,
    description: p.description,
    price: Number(p.price) || 0,
    originalPrice: Number(p.original_price ?? p.originalPrice ?? p.price) || 0,
    discount: p.discount ?? 0,
    category: p.category,
    subcategory: p.subcategory ?? '',
    fabric: p.fabric ?? '',
    fit: p.fit ?? 'Regular',
    fitType: (p.fit_type ?? p.fitType ?? 'none') as 'top' | 'bottom' | 'none',
    sizes: p.sizes ?? [],
    images: p.images ?? [],
    isNew: p.is_new_product ?? p.isNewProduct ?? p.isNew ?? false,
    isBestSeller: p.is_bestseller ?? p.isBestseller ?? p.isBestSeller ?? false,
    isPreOrder: p.is_pre_order ?? p.isPreOrder ?? false,
    preOrderMessage: p.pre_order_message ?? p.preOrderMessage,
    careInstructions: p.care_instructions ?? p.careInstructions ?? [],
    composition: p.composition ?? '',
    deliveryReturns: p.delivery_returns ?? p.deliveryReturns ?? '',
    returnWindowDays: p.return_window_days ?? p.returnWindowDays ?? 7,
    tailoredFitMeasurements: p.tailored_fit_measurements ?? p.tailoredFitMeasurements ?? [],
    stock_quantity: p.stock_quantity ?? 0,
  });

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/products?page=1&limit=100');
      if (response.ok) {
        const data = await response.json();
        // Handle both paginated and non-paginated responses for compatibility
        const productsList = data.products || data;
        const mapped = (Array.isArray(productsList) ? productsList : []).map(mapBackendProduct);
        setProducts(mapped);
      } else {
        console.warn('API error fetching products, using fallback');
        loadFallbackProducts();
      }
    } catch (err) {
      console.warn('Network error fetching products, using fallback:', err);
      loadFallbackProducts();
    } finally {
      setLoading(false);
    }
  };

  const loadFallbackProducts = () => {
    const stored = localStorage.getItem('grazel_products');
    if (stored) {
      try {
        setProducts(JSON.parse(stored));
      } catch {
        setProducts(mockProducts);
      }
    } else {
      setProducts(mockProducts);
      localStorage.setItem('grazel_products', JSON.stringify(mockProducts));
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const addProduct = async (product: Product) => {
    // Check for admin token first (for admin operations), then user token
    const token = localStorage.getItem('grazel_admin_token') || localStorage.getItem('grazel_user_token');
    
    // Map compatible isNew flag to model isNewProduct
    const { id, is_new, is_bestseller, ...rest } = product as any;
    const bodyPayload = {
      ...rest,
      isNewProduct: is_new !== undefined ? is_new : product.isNew,
      isBestseller: is_bestseller !== undefined ? is_bestseller : product.isBestSeller,
      isPreOrder: product.isPreOrder ?? false,
      preOrderMessage: product.preOrderMessage,
      images: product.images || ['/placeholder.svg'],
      returnWindowDays: product.returnWindowDays || 30,
    };

    try {
      const response = await fetch('/api/products', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(bodyPayload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to add product');
      }

      const newProduct = await response.json();
      setProducts((prev) => [mapBackendProduct(newProduct), ...prev]);
      toast.success('Product added to catalog!');
    } catch (err: any) {
      console.error('Error adding product to backend:', err);
      toast.error(`Failed to add product: ${err.message}`);

      // Fallback local update
      const updated = [product, ...products];
      setProducts(updated);
      localStorage.setItem('grazel_products', JSON.stringify(updated));
    }
  };

  const updateProduct = async (product: Product) => {
    // Check for admin token first (for admin operations), then user token
    const token = localStorage.getItem('grazel_admin_token') || localStorage.getItem('grazel_user_token');
    const { id, is_new, is_bestseller, ...rest } = product as any;
    const bodyPayload = {
      ...rest,
      isNewProduct: is_new !== undefined ? is_new : product.isNew,
      isBestseller: is_bestseller !== undefined ? is_bestseller : product.isBestSeller,
      isPreOrder: product.isPreOrder ?? false,
      preOrderMessage: product.preOrderMessage,
      images: product.images || ['/placeholder.svg'],
      returnWindowDays: product.returnWindowDays || 30,
    };

    try {
      const response = await fetch(`/api/products/${product.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(bodyPayload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to update product');
      }

      const updated = await response.json();
      setProducts((prev) => prev.map((p) => (p.id === product.id ? mapBackendProduct(updated) : p)));
      toast.success('Product updated successfully!');
    } catch (err: any) {
      console.error('Error updating product on backend:', err);
      toast.error(`Failed to update product: ${err.message}`);

      // Fallback local update
      const updated = products.map((p) => (p.id === product.id ? product : p));
      setProducts(updated);
      localStorage.setItem('grazel_products', JSON.stringify(updated));
    }
  };

  const deleteProduct = async (id: string) => {
    // Check for admin token first (for admin operations), then user token
    const token = localStorage.getItem('grazel_admin_token') || localStorage.getItem('grazel_user_token');

    try {
      const response = await fetch(`/api/products/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to delete product');
      }

      setProducts((prev) => prev.filter((p) => p.id !== id));
      toast.success('Product deleted successfully!');
    } catch (err: any) {
      console.error('Error deleting product from backend:', err);
      toast.error(`Failed to delete product: ${err.message}`);

      // Fallback local update
      const updated = products.filter((p) => p.id !== id);
      setProducts(updated);
      localStorage.setItem('grazel_products', JSON.stringify(updated));
    }
  };

  const refreshProducts = async () => {
    await fetchProducts();
  };

  return (
    <ProductContext.Provider
      value={{
        products,
        addProduct,
        updateProduct,
        deleteProduct,
        refreshProducts,
        loading,
      }}
    >
      {children}
    </ProductContext.Provider>
  );
}

export function useProducts() {
  const context = useContext(ProductContext);
  if (!context) {
    throw new Error('useProducts must be used within ProductProvider');
  }
  return context;
}
