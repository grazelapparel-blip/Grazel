import React, { createContext, useContext, useState, useEffect } from 'react';
import { Product, CartItem, WishlistItem } from '@/types/product';
import { useAuth } from '@/context/AuthContext';
import { toast } from 'sonner';

interface CartContextType {
  cart: CartItem[];
  wishlist: WishlistItem[];
  addToCart: (product: Product, size: string, quantity?: number) => Promise<void>;
  removeFromCart: (productId: string, size: string) => Promise<void>;
  updateQuantity: (productId: string, size: string, quantity: number) => Promise<void>;
  addToWishlist: (product: Product) => void;
  removeFromWishlist: (productId: string) => void;
  isInWishlist: (productId: string) => boolean;
  cartTotal: number;
  cartCount: number;
  clearCart: () => Promise<void>;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

// Helper function to normalize product ID
const getProductId = (product: Product): string => {
  return product.id || (product as any)._id;
};

export function CartProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [cart, setCart] = useState<CartItem[]>([]);
  const [wishlist, setWishlist] = useState<WishlistItem[]>([]);

  // 1. Load Wishlist on mount
  useEffect(() => {
    const storedWishlist = localStorage.getItem('grazel_wishlist');
    if (storedWishlist) {
      try {
        setWishlist(JSON.parse(storedWishlist));
      } catch {}
    }
  }, []);

  // 2. Fetch/merge cart based on Auth state
  useEffect(() => {
    const handleAuthCartSync = async () => {
      const token = localStorage.getItem('grazel_user_token');
      if (user && token) {
        // First merge any items from local storage guest cart
        const localCartStr = localStorage.getItem('grazel_cart');
        if (localCartStr) {
          try {
            const localCart = JSON.parse(localCartStr) as CartItem[];
            if (localCart.length > 0) {
              await syncCartToBackend(localCart, token);
              localStorage.removeItem('grazel_cart');
            }
          } catch (err) {
            console.error('Failed to merge guest cart to backend:', err);
          }
        }
        // Load the full cart from Supabase via backend
        await fetchDatabaseCart(token);
      } else {
        // Load cart from localStorage for guest users
        const storedCart = localStorage.getItem('grazel_cart');
        if (storedCart) {
          try {
            setCart(JSON.parse(storedCart));
          } catch {}
        } else {
          setCart([]);
        }
      }
    };

    handleAuthCartSync();
  }, [user]);

  const fetchDatabaseCart = async (token: string) => {
    try {
      const response = await fetch('/api/cart', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        if (Array.isArray(data)) {
          // Only accept items that have a full product object (new format)
          // Items stored in old simplified format {productId, size, quantity} are discarded
          const validItems = data.filter(
            (item: any) => item && item.product && item.product.id
          ) as CartItem[];
          setCart(validItems);
        } else {
          setCart([]);
        }
      } else {
        console.error('Failed to fetch cart:', response.status);
        setCart([]);
      }
    } catch (err) {
      console.error('Failed to fetch user cart:', err);
      setCart([]);
    }
  };

  const syncCartToBackend = async (newCart: CartItem[], token: string) => {
    try {
      const response = await fetch('/api/cart', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        // Store full CartItem objects (including product) so they can be reconstructed on fetch
        body: JSON.stringify({ items: newCart }),
      });

      if (response.ok) {
        const data = await response.json();
        const validItems = Array.isArray(data)
          ? (data.filter((item: any) => item && item.product && item.product.id) as CartItem[])
          : newCart;
        setCart(validItems);
      } else {
        throw new Error('Failed to sync cart');
      }
    } catch (err) {
      console.error('Failed to sync cart with backend:', err);
      // On sync failure, keep the local cart state so user isn't lost
      setCart(newCart);
      throw err;
    }
  };

  const addToCart = async (product: Product, size: string, quantity = 1) => {
    if (!product || !getProductId(product)) {
      toast.error('Invalid product');
      return;
    }

    const token = localStorage.getItem('grazel_user_token');
    const productId = getProductId(product);
    
    // Compute new cart locally first
    const prevCart = [...cart];
    const existing = prevCart.find(
      (item) => getProductId(item.product) === productId && item.size === size
    );

    let newCart;
    if (existing) {
      newCart = prevCart.map((item) =>
        getProductId(item.product) === productId && item.size === size
          ? { ...item, quantity: item.quantity + quantity }
          : item
      );
    } else {
      newCart = [...prevCart, { product, size, quantity }];
    }

    if (user && token) {
      try {
        // Sync to backend before updating local state
        await syncCartToBackend(newCart, token);
        toast.success(product.isPreOrder ? 'Pre-order added to bag' : 'Added to bag');
      } catch (err) {
        // Revert on failure
        setCart(prevCart);
      }
    } else {
      setCart(newCart);
      localStorage.setItem('grazel_cart', JSON.stringify(newCart));
      toast.success(product.isPreOrder ? 'Pre-order added to bag (guest)' : 'Added to bag (guest)');
    }
  };

  const removeFromCart = async (productId: string, size: string) => {
    const token = localStorage.getItem('grazel_user_token');
    if (!productId) return;

    const newCart = cart.filter(
      (item) => !(getProductId(item.product) === productId && item.size === size)
    );

    if (user && token) {
      setCart(newCart);
      await syncCartToBackend(newCart, token);
      toast.success('Item removed');
    } else {
      setCart(newCart);
      localStorage.setItem('grazel_cart', JSON.stringify(newCart));
      toast.success('Item removed (guest)');
    }
  };

  const updateQuantity = async (productId: string, size: string, quantity: number) => {
    if (quantity < 1) {
      await removeFromCart(productId, size);
      return;
    }

    const token = localStorage.getItem('grazel_user_token');
    const newCart = cart.map((item) =>
      getProductId(item.product) === productId && item.size === size
        ? { ...item, quantity }
        : item
    );

    if (user && token) {
      setCart(newCart);
      await syncCartToBackend(newCart, token);
    } else {
      setCart(newCart);
      localStorage.setItem('grazel_cart', JSON.stringify(newCart));
    }
  };

  const addToWishlist = (product: Product) => {
    if (!product || !getProductId(product)) {
      toast.error('Invalid product');
      return;
    }
    setWishlist((prev) => {
      const productId = getProductId(product);
      if (prev.some((item) => getProductId(item.product) === productId)) {
        return prev;
      }
      const updated = [...prev, { product }];
      localStorage.setItem('grazel_wishlist', JSON.stringify(updated));
      return updated;
    });
    toast.success('Added to wishlist');
  };

  const removeFromWishlist = (productId: string) => {
    setWishlist((prev) => {
      const updated = prev.filter((item) => getProductId(item.product) !== productId);
      localStorage.setItem('grazel_wishlist', JSON.stringify(updated));
      return updated;
    });
    toast.success('Removed from wishlist');
  };

  const isInWishlist = (productId: string) => {
    return wishlist.some((item) => getProductId(item.product) === productId);
  };

  const cartTotal = cart.reduce((total, item) => {
    const price = item.product?.price || 0;
    return total + price * item.quantity;
  }, 0);

  const cartCount = cart.reduce((count, item) => count + item.quantity, 0);

  const clearCart = async () => {
    const token = localStorage.getItem('grazel_user_token');
    setCart([]);
    if (user && token) {
      try {
        await syncCartToBackend([], token);
      } catch {
        // Cart already cleared locally; ignore sync errors on clear
      }
    } else {
      localStorage.removeItem('grazel_cart');
    }
  };

  return (
    <CartContext.Provider
      value={{
        cart,
        wishlist,
        addToCart,
        removeFromCart,
        updateQuantity,
        addToWishlist,
        removeFromWishlist,
        isInWishlist,
        cartTotal,
        cartCount,
        clearCart,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}
