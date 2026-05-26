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
    ...p,
    isNew: p.isNewProduct ?? p.isNew,
    isBestSeller: p.isBestseller ?? p.isBestSeller,
    isPreOrder: p.isPreOrder ?? p.is_pre_order ?? false,
    preOrderMessage: p.preOrderMessage ?? p.pre_order_message,
  });

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/products');
      if (response.ok) {
        const data = await response.json();
        const mapped = data.map(mapBackendProduct);
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
    const token = localStorage.getItem('grazel_token');
    
    // Map compatible isNew flag to model isNewProduct
    const { id, is_new, is_bestseller, ...rest } = product as any;
    const bodyPayload = {
      ...rest,
      isNewProduct: is_new !== undefined ? is_new : product.isNew,
      isBestseller: is_bestseller !== undefined ? is_bestseller : product.isBestseller,
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
      toast.success('Product successfully added to MongoDB catalog!');
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
    const token = localStorage.getItem('grazel_token');
    const { id, is_new, is_bestseller, ...rest } = product as any;
    const bodyPayload = {
      ...rest,
      isNewProduct: is_new !== undefined ? is_new : product.isNew,
      isBestseller: is_bestseller !== undefined ? is_bestseller : product.isBestseller,
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
      toast.success('Product successfully updated in MongoDB catalog!');
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
    const token = localStorage.getItem('grazel_token');

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
      toast.success('Product successfully deleted from MongoDB catalog!');
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
