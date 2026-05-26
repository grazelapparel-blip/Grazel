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
      const token = localStorage.getItem('grazel_token');
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
        // Load the full cart from MongoDB
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
        setCart(data as CartItem[]);
      }
    } catch (err) {
      console.error('Failed to fetch user cart from MongoDB:', err);
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
        body: JSON.stringify({
          items: newCart.map((item) => ({
            productId: item.product.id || (item.product as any)._id,
            size: item.size,
            quantity: item.quantity,
          })),
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setCart(data as CartItem[]);
      }
    } catch (err) {
      console.error('Failed to sync cart with Express backend:', err);
    }
  };

  const addToCart = async (product: Product, size: string, quantity = 1) => {
    const token = localStorage.getItem('grazel_token');
    
    // Compute new cart locally first
    const prevCart = [...cart];
    const existing = prevCart.find(
      (item) => (item.product.id === product.id || (item.product as any)._id === (product as any)._id) && item.size === size
    );

    let newCart;
    if (existing) {
      newCart = prevCart.map((item) =>
        (item.product.id === product.id || (item.product as any)._id === (product as any)._id) && item.size === size
          ? { ...item, quantity: item.quantity + quantity }
          : item
      );
    } else {
      newCart = [...prevCart, { product, size, quantity }];
    }

    if (user && token) {
      // Optimistically update local state then sync
      setCart(newCart);
      await syncCartToBackend(newCart, token);
      toast.success(product.isPreOrder ? 'Pre-order added to bag' : 'Added to bag');
    } else {
      setCart(newCart);
      localStorage.setItem('grazel_cart', JSON.stringify(newCart));
      toast.success(product.isPreOrder ? 'Pre-order added to bag (guest)' : 'Added to bag (guest)');
    }
  };

  const removeFromCart = async (productId: string, size: string) => {
    const token = localStorage.getItem('grazel_token');
    const newCart = cart.filter(
      (item) => !((item.product.id === productId || (item.product as any)._id === productId) && item.size === size)
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

    const token = localStorage.getItem('grazel_token');
    const newCart = cart.map((item) =>
      (item.product.id === productId || (item.product as any)._id === productId) && item.size === size
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
    setWishlist((prev) => {
      if (prev.some((item) => item.product.id === product.id || (item.product as any)._id === (product as any)._id)) {
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
      const updated = prev.filter((item) => item.product.id !== productId && (item.product as any)._id !== productId);
      localStorage.setItem('grazel_wishlist', JSON.stringify(updated));
      return updated;
    });
    toast.success('Removed from wishlist');
  };

  const isInWishlist = (productId: string) => {
    return wishlist.some((item) => item.product.id === productId || (item.product as any)._id === productId);
  };

  const cartTotal = cart.reduce(
    (total, item) => total + item.product.price * item.quantity,
    0
  );

  const cartCount = cart.reduce((count, item) => count + item.quantity, 0);

  const clearCart = async () => {
    const token = localStorage.getItem('grazel_token');
    if (user && token) {
      setCart([]);
      await syncCartToBackend([], token);
    } else {
      setCart([]);
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
