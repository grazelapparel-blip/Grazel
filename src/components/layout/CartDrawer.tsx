import { motion, AnimatePresence } from 'framer-motion';
import { X, Minus, Plus, ShoppingBag } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useCart } from '@/context/CartContext';

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CartDrawer({ isOpen, onClose }: CartDrawerProps) {
  const { cart, cartTotal, removeFromCart, updateQuantity } = useCart();

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-foreground/40 z-50"
            onClick={onClose}
          />

          {/* Drawer */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
            className="fixed top-0 right-0 h-full w-full max-w-md bg-card z-50 shadow-mega flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-5 border-b border-border">
              <h2 className="font-serif text-lg">Shopping Bag</h2>
              <Button variant="icon" size="icon-sm" onClick={onClose}>
                <X className="h-5 w-5" />
              </Button>
            </div>

            {/* Cart Items */}
            <div className="flex-1 overflow-y-auto px-6 py-6">
              {cart.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center">
                  <ShoppingBag className="h-12 w-12 text-muted-foreground mb-4" />
                  <p className="text-muted-foreground mb-2">Your bag is empty</p>
                  <p className="text-sm text-muted-foreground">
                    Discover our latest collection
                  </p>
                </div>
              ) : (
                <ul className="space-y-6">
                  {cart.map((item) => (
                    <li
                      key={`${item.product.id}-${item.size}`}
                      className="flex gap-4"
                    >
                      {/* Image */}
                      <Link
                        to={`/product/${item.product.id}`}
                        onClick={onClose}
                        className="w-20 h-28 bg-secondary flex-shrink-0 overflow-hidden"
                      >
                        <img
                          src={item.product.images[0]}
                          alt={item.product.name}
                          className="w-full h-full object-cover"
                        />
                      </Link>

                      {/* Details */}
                      <div className="flex-1 flex flex-col">
                        <Link
                          to={`/product/${item.product.id}`}
                          onClick={onClose}
                          className="text-sm text-foreground hover:text-primary transition-colors"
                        >
                          {item.product.name}
                        </Link>
                        <p className="text-sm text-muted-foreground mt-1">
                          Size: {item.size}
                        </p>
                        <p className="text-sm text-foreground mt-1">
                          ₹{item.product.price}
                        </p>
                        {item.product.isPreOrder && (
                          <p className="mt-1 text-[11px] uppercase tracking-[0.12em] text-primary">
                            {item.product.preOrderMessage || 'Pre-order'}
                          </p>
                        )}

                        {/* Quantity */}
                        <div className="flex items-center gap-3 mt-auto">
                          <button
                            onClick={() =>
                              updateQuantity(
                                item.product.id,
                                item.size,
                                item.quantity - 1
                              )
                            }
                            className="p-1 text-muted-foreground hover:text-foreground transition-colors"
                          >
                            <Minus className="h-3 w-3" />
                          </button>
                          <span className="text-sm w-6 text-center">
                            {item.quantity}
                          </span>
                          <button
                            onClick={() =>
                              updateQuantity(
                                item.product.id,
                                item.size,
                                item.quantity + 1
                              )
                            }
                            className="p-1 text-muted-foreground hover:text-foreground transition-colors"
                          >
                            <Plus className="h-3 w-3" />
                          </button>
                        </div>
                      </div>

                      {/* Remove */}
                      <button
                        onClick={() => removeFromCart(item.product.id, item.size)}
                        className="text-muted-foreground hover:text-primary transition-colors self-start"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* Footer */}
            {cart.length > 0 && (
              <div className="border-t border-border px-6 py-6 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Subtotal</span>
                  <span className="text-lg font-serif">₹{cartTotal}</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  Shipping and taxes calculated at checkout
                </p>
                {cart.some((item) => item.product.isPreOrder) && (
                  <p className="border border-primary/20 bg-primary/5 p-3 text-xs text-primary">
                    Your bag includes pre-order items.
                  </p>
                )}
                <Button variant="add" className="w-full" asChild>
                  <Link to="/checkout" onClick={onClose}>
                    Proceed to Checkout
                  </Link>
                </Button>
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={onClose}
                >
                  Continue Shopping
                </Button>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
