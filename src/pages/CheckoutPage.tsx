import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, ShoppingBag, ShieldCheck, CreditCard } from 'lucide-react';
import { useCart } from '@/context/CartContext';
import { useAuth } from '@/context/AuthContext';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

export function CheckoutPage() {
  const { cart, cartTotal, clearCart } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [zip, setZip] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const hasPreOrderItems = cart.some((item) => item.product.isPreOrder);

  // Pre-fill profile info
  useEffect(() => {
    if (user) {
      setName(user.name || '');
      setEmail(user.email || '');
    }
  }, [user]);

  // If cart is empty, redirect back
  useEffect(() => {
    if (cart.length === 0 && !submitting) {
      toast.info('Your cart is empty. Add items to checkout.');
      navigate('/');
    }
  }, [cart, navigate, submitting]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !address || !city || !state || !zip) {
      toast.error('Please fill in all shipping details');
      return;
    }

    setSubmitting(true);
    const fullAddress = `${address}, ${city}, ${state} - ${zip}`;
    const token = localStorage.getItem('grazel_token');

    try {
      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          userId: user?.id || null,
          customerName: name,
          customerEmail: email,
          shippingAddress: fullAddress,
          totalAmount: cartTotal,
          items: cart.map((item) => ({
            productId: item.product.id || (item.product as any)._id,
            productName: item.product.name,
            price: item.product.price,
            size: item.size,
            quantity: item.quantity,
            isPreOrder: item.product.isPreOrder || false,
            preOrderMessage: item.product.preOrderMessage,
          })),
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to place order');
      }

      const createdOrder = await response.json();

      toast.success('Order placed successfully! Please rate your purchase.');
      await clearCart();
      navigate('/review-order', { state: { order: createdOrder } });
    } catch (err: any) {
      console.error('Checkout error:', err);
      toast.error(err.message || 'An error occurred while placing your order. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (cart.length === 0 && !submitting) {
    return null;
  }

  return (
    <Layout>
      <div className="min-h-[calc(100vh-60px)] bg-background-cream py-16">
        <div className="container max-w-6xl">
          <Link
            to="/"
            className="group mb-8 inline-flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
            Continue Shopping
          </Link>

          <h1 className="font-serif text-3xl lg:text-4xl text-foreground mb-10">Checkout</h1>

          <div className="grid grid-cols-1 lg:grid-cols-[1fr_400px] gap-12 items-start">
            {/* Shipping Form */}
            <form onSubmit={handleSubmit} className="space-y-8 bg-card border border-border p-8 shadow-mega">
              <h2 className="font-serif text-lg text-foreground border-b border-border pb-4">Shipping Information</h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="checkout-name" className="block text-xs uppercase tracking-[0.15em] text-muted-foreground font-medium mb-2">
                    Full Name *
                  </label>
                  <input
                    id="checkout-name"
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-4 py-3 border border-border bg-background-cream text-foreground focus:outline-none focus:border-primary text-sm rounded-none"
                    placeholder="Jane Doe"
                  />
                </div>
                <div>
                  <label htmlFor="checkout-email" className="block text-xs uppercase tracking-[0.15em] text-muted-foreground font-medium mb-2">
                    Email Address *
                  </label>
                  <input
                    id="checkout-email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-4 py-3 border border-border bg-background-cream text-foreground focus:outline-none focus:border-primary text-sm rounded-none"
                    placeholder="jane@example.com"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="checkout-address" className="block text-xs uppercase tracking-[0.15em] text-muted-foreground font-medium mb-2">
                  Street Address *
                </label>
                <input
                  id="checkout-address"
                  type="text"
                  required
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full px-4 py-3 border border-border bg-background-cream text-foreground focus:outline-none focus:border-primary text-sm rounded-none mb-3"
                  placeholder="Apartment, suite, unit, building, floor, street"
                />
              </div>

              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div className="col-span-2 md:col-span-1">
                  <label htmlFor="checkout-city" className="block text-xs uppercase tracking-[0.15em] text-muted-foreground font-medium mb-2">
                    City *
                  </label>
                  <input
                    id="checkout-city"
                    type="text"
                    required
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="w-full px-4 py-3 border border-border bg-background-cream text-foreground focus:outline-none focus:border-primary text-sm rounded-none"
                    placeholder="Mumbai"
                  />
                </div>
                <div>
                  <label htmlFor="checkout-state" className="block text-xs uppercase tracking-[0.15em] text-muted-foreground font-medium mb-2">
                    State / Region *
                  </label>
                  <input
                    id="checkout-state"
                    type="text"
                    required
                    value={state}
                    onChange={(e) => setState(e.target.value)}
                    className="w-full px-4 py-3 border border-border bg-background-cream text-foreground focus:outline-none focus:border-primary text-sm rounded-none"
                    placeholder="Maharashtra"
                  />
                </div>
                <div>
                  <label htmlFor="checkout-zip" className="block text-xs uppercase tracking-[0.15em] text-muted-foreground font-medium mb-2">
                    Postal Code *
                  </label>
                  <input
                    id="checkout-zip"
                    type="text"
                    required
                    value={zip}
                    onChange={(e) => setZip(e.target.value)}
                    className="w-full px-4 py-3 border border-border bg-background-cream text-foreground focus:outline-none focus:border-primary text-sm rounded-none"
                    placeholder="400001"
                  />
                </div>
              </div>

              <div className="pt-6 border-t border-border space-y-6">
                <h2 className="font-serif text-lg text-foreground flex items-center gap-2">
                  <CreditCard className="h-5 w-5" /> Payment Method
                </h2>
                <div className="border border-border p-4 bg-background-cream/40 flex items-center gap-3">
                  <input
                    type="radio"
                    id="cod"
                    name="payment"
                    defaultChecked
                    className="h-4 w-4 text-primary focus:ring-primary border-border"
                  />
                  <div>
                    <label htmlFor="cod" className="text-sm font-medium text-foreground cursor-pointer">
                      Cash on Delivery (COD) / Pay on Delivery
                    </label>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Pay securely in cash or via UPI at the time of delivery.
                    </p>
                  </div>
                </div>
              </div>

              <div className="pt-6">
                <Button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-4 text-xs uppercase tracking-[0.2em] font-medium"
                >
                  {submitting ? 'Placing Order...' : `${hasPreOrderItems ? 'Place Pre-Order' : 'Place Order'} • ₹${cartTotal}`}
                </Button>
              </div>
            </form>

            {/* Order Summary Sidebar */}
            <div className="bg-card border border-border p-6 space-y-6 sticky top-[100px] shadow-mega">
              <h3 className="font-serif text-lg text-foreground flex items-center gap-2 border-b border-border pb-3">
                <ShoppingBag className="h-5 w-5" /> Order Summary
              </h3>

              <div className="max-h-[300px] overflow-y-auto pr-1 divide-y divide-border-light space-y-4">
                {cart.map((item) => (
                  <div key={`${item.product.id || (item.product as any)._id}-${item.size}`} className="flex gap-3 pt-4 first:pt-0">
                    <div className="w-16 h-20 bg-secondary flex-shrink-0 overflow-hidden">
                      <img src={item.product.images?.[0] || '/placeholder.svg'} alt={item.product.name} className="w-full h-full object-cover" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-xs font-medium text-foreground truncate">{item.product.name}</h4>
                      <p className="text-[11px] text-muted-foreground mt-0.5">Size: {item.size}</p>
                      <p className="text-[11px] text-muted-foreground">Qty: {item.quantity}</p>
                      {item.product.isPreOrder && (
                        <p className="mt-1 text-[10px] uppercase tracking-[0.12em] text-primary">
                          Pre-order
                        </p>
                      )}
                    </div>
                    <div className="text-right text-xs font-medium">
                      ₹{item.product.price * item.quantity}
                    </div>
                  </div>
                ))}
              </div>

              <div className="border-t border-border pt-4 space-y-2">
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Subtotal</span>
                  <span>₹{cartTotal}</span>
                </div>
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Shipping</span>
                  <span className="text-green-600 font-medium">Free</span>
                </div>
                <div className="flex justify-between text-sm font-serif font-medium pt-3 border-t border-border-light">
                  <span>Total</span>
                  <span>₹{cartTotal}</span>
                </div>
              </div>

              <div className="bg-background-cream/70 p-3 border border-border-light flex items-start gap-2 text-[11px] text-muted-foreground">
                <ShieldCheck className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
                <span>Your checkout transaction is encrypted, secure, and compliant.</span>
              </div>
              {hasPreOrderItems && (
                <div className="bg-primary/5 p-3 border border-primary/20 text-[11px] text-primary">
                  Pre-order items will be reserved now and dispatched when they are ready.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
