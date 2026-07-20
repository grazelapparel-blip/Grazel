import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, ShoppingBag, ShieldCheck, CreditCard, Truck, Package, Zap } from 'lucide-react';
import { useCart } from '@/context/CartContext';
import { useAuth } from '@/context/AuthContext';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

declare global {
  interface Window {
    Razorpay: any;
  }
}

export function CheckoutPage() {
  const { cart, cartTotal, clearCart } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();

  // Form state
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [zip, setZip] = useState('');

  // Checkout state
  const [submitting, setSubmitting] = useState(false);
  const [shippingCost, setShippingCost] = useState(0);
  const [isFreeShipping, setIsFreeShipping] = useState(false);
  const [freeShippingThreshold, setFreeShippingThreshold] = useState(1500); // Updated from 200 to 1500
  const [shippingCalculated, setShippingCalculated] = useState(false);

  // Payment & order state
  const [paymentMethod, setPaymentMethod] = useState('upi');
  const [discountCode, setDiscountCode] = useState('');
  const [discountAmount, setDiscountAmount] = useState(0);
  const [packaging, setPackaging] = useState('standard');
  const [packagingCost, setPackagingCost] = useState(0);
  const [packagingOptions, setPackagingOptions] = useState<any[]>([]);
  const [validatingDiscount, setValidatingDiscount] = useState(false);

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

  // Fetch packaging options
  useEffect(() => {
    fetch('/api/packaging')
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.options) {
          setPackagingOptions(data.options);
        }
      })
      .catch((err) => console.error('Error fetching packaging options:', err));
  }, []);

  // Calculate shipping when state changes
  useEffect(() => {
    if (state && state.trim()) {
      calculateShipping();
    }
  }, [state]);

  // Calculate shipping cost based on state
  const calculateShipping = async () => {
    if (!state) return;

    try {
      const response = await fetch('/api/shipping/calculate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ state, subtotal: cartTotal - discountAmount }),
      });

      const data = await response.json();
      if (data.success) {
        setShippingCost(data.shippingCost);
        setIsFreeShipping(data.isFreeShipping);
        setFreeShippingThreshold(data.freeShippingThreshold);
        setShippingCalculated(true);
        if (!data.isFreeShipping && data.amountNeededForFreeShipping > 0) {
          toast.info(`Add ₹${data.amountNeededForFreeShipping.toFixed(0)} more for free shipping!`);
        }
      } else {
        toast.error(data.error || 'Unable to calculate shipping for this location');
      }
    } catch (err) {
      console.error('Shipping calculation error:', err);
      toast.error('Error calculating shipping cost');
    }
  };

  // Validate and apply discount code
  const handleApplyDiscount = async () => {
    if (!discountCode.trim()) {
      toast.error('Please enter a discount code');
      return;
    }

    setValidatingDiscount(true);
    try {
      const response = await fetch('/api/discounts/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: discountCode,
          subtotal: cartTotal,
          userId: user?.id,
        }),
      });

      const data = await response.json();
      if (data.success) {
        setDiscountAmount(data.discount.discountAmount);
        toast.success(`Discount applied! You save ₹${data.discount.discountAmount.toFixed(2)}`);
        setDiscountCode('');
      } else {
        toast.error(data.error || 'Invalid discount code');
      }
    } catch (err) {
      console.error('Discount validation error:', err);
      toast.error('Error validating discount code');
    } finally {
      setValidatingDiscount(false);
    }
  };

  // Update packaging cost when selection changes
  const handlePackagingChange = (selectedPackaging: string) => {
    setPackaging(selectedPackaging);
    const selected = packagingOptions.find((p) => p.packaging_type === selectedPackaging);
    if (selected) {
      setPackagingCost(selected.cost || 0);
    }
  };

  // Calculate final amount
  const subtotal = cartTotal;
  const finalAmount = Math.max(0, subtotal - discountAmount + shippingCost + packagingCost);

  // Handle Razorpay payment
  const handleRazorpayPayment = async () => {
    try {
      if (!name || !email || !phone || !address || !city || !state || !zip) {
        toast.error('Please fill in all shipping details');
        return;
      }

      // Create order on backend
      const orderResponse = await fetch('/api/payments/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: finalAmount,
          currency: 'INR',
          receipt: `grazel_${Date.now()}`,
          customerEmail: email,
          customerName: name,
        }),
      });

      const orderData = await orderResponse.json();
      if (!orderData.order) {
        throw new Error('Failed to create payment order');
      }

      // Load Razorpay script
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      document.body.appendChild(script);

      script.onload = () => {
        const options = {
          key: import.meta.env.VITE_RAZORPAY_KEY_ID || 'rzp_test_placeholder',
          amount: orderData.order.amount,
          currency: orderData.order.currency,
          name: 'Grazel',
          description: `Order - ${cart.length} items`,
          order_id: orderData.order.id,
          handler: async (response: any) => {
            await processOrder(response, orderData.order.id);
          },
          prefill: {
            name,
            email,
            contact: phone,
          },
          theme: {
            color: '#1a1a1a',
          },
        };

        const razorpay = new window.Razorpay(options);
        razorpay.open();
      };
    } catch (err: any) {
      console.error('Razorpay payment error:', err);
      toast.error(err.message || 'Payment processing failed');
    }
  };

  // Process order after payment
  const processOrder = async (paymentResponse: any, razorpayOrderId: string) => {
    try {
      setSubmitting(true);

      // Verify payment
      const verifyResponse = await fetch('/api/payments/verify-payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          razorpay_order_id: razorpayOrderId,
          razorpay_payment_id: paymentResponse.razorpay_payment_id,
          razorpay_signature: paymentResponse.razorpay_signature,
        }),
      });

      const verifyData = await verifyResponse.json();
      if (!verifyData.success) {
        throw new Error('Payment verification failed');
      }

      // Create order in database
      const fullAddress = `${address}, ${city}, ${state} - ${zip}`;
      const token = localStorage.getItem('grazel_user_token');

      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          userId: user?.id || null,
          customerName: name,
          customerEmail: email,
          customerPhone: phone,
          shippingAddress: fullAddress,
          shippingState: state,
          totalAmount: finalAmount,
          subtotal,
          shippingCost,
          discountAmount,
          packagingType: packaging,
          packagingCost,
          paymentMethod: paymentMethod,
          paymentStatus: 'completed',
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
        throw new Error(errorData.message || 'Failed to create order');
      }

      const createdOrder = await response.json();
      toast.success('Order placed successfully!');
      // Fire order confirmation email (non-blocking)
      sendOrderConfirmationEmail(createdOrder, name, email, finalAmount, cart);
      await clearCart();
      navigate('/review-order', { state: { order: createdOrder } });
    } catch (err: any) {
      console.error('Order processing error:', err);
      toast.error(err.message || 'Error processing order. Please contact support.');
    } finally {
      setSubmitting(false);
    }
  };

  // Non-blocking helper: sends order confirmation email
  const sendOrderConfirmationEmail = (
    order: any,
    customerName: string,
    customerEmail: string,
    totalAmount: number,
    cartItems: typeof cart
  ) => {
    fetch('/api/emails/order-confirmation', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        orderId: order.id || order.order_id,
        orderNumber: order.order_number || order.orderNumber,
        customerEmail,
        customerName,
        totalAmount,
        items: cartItems.map((item) => ({
          productName: item.product.name,
          size: item.size,
          quantity: item.quantity,
          price: item.product.price,
        })),
      }),
    }).catch((err) => console.warn('Order confirmation email failed (non-critical):', err));
  };

  // Handle COD order submission
  const handleCODSubmit = async () => {
    if (!name || !email || !phone || !address || !city || !state || !zip) {
      toast.error('Please fill in all shipping details');
      return;
    }

    setSubmitting(true);
    const fullAddress = `${address}, ${city}, ${state} - ${zip}`;
    const token = localStorage.getItem('grazel_user_token');

    try {
      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          userId: user?.id || null,
          customerName: name,
          customerEmail: email,
          customerPhone: phone,
          shippingAddress: fullAddress,
          shippingState: state,
          totalAmount: finalAmount,
          subtotal,
          shippingCost,
          discountAmount,
          packagingType: packaging,
          packagingCost,
          paymentMethod: 'cod',
          paymentStatus: 'pending',
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
      toast.success('Order placed successfully! Please pay on delivery.');
      // Fire order confirmation email (non-blocking)
      sendOrderConfirmationEmail(createdOrder, name, email, finalAmount, cart);
      await clearCart();
      navigate('/review-order', { state: { order: createdOrder } });
    } catch (err: any) {
      console.error('COD order error:', err);
      toast.error(err.message || 'Error placing order. Please try again.');
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
            {/* Checkout Form */}
            <div className="space-y-8 bg-card border border-border p-8 shadow-mega">
              {/* Shipping Information */}
              <div className="space-y-4">
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
                  <label htmlFor="checkout-phone" className="block text-xs uppercase tracking-[0.15em] text-muted-foreground font-medium mb-2">
                    Phone Number *
                  </label>
                  <input
                    id="checkout-phone"
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full px-4 py-3 border border-border bg-background-cream text-foreground focus:outline-none focus:border-primary text-sm rounded-none"
                    placeholder="+91 XXXXX XXXXX"
                  />
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
                    <select
                      id="checkout-state"
                      required
                      value={state}
                      onChange={(e) => setState(e.target.value)}
                      className="w-full px-4 py-3 border border-border bg-background-cream text-foreground focus:outline-none focus:border-primary text-sm rounded-none appearance-none"
                    >
                      <option value="">Select State</option>
                      {[
                        'Andhra Pradesh','Arunachal Pradesh','Assam','Bihar','Chhattisgarh',
                        'Goa','Gujarat','Haryana','Himachal Pradesh','Jharkhand','Karnataka',
                        'Kerala','Madhya Pradesh','Maharashtra','Manipur','Meghalaya','Mizoram',
                        'Nagaland','Odisha','Punjab','Rajasthan','Sikkim','Tamil Nadu','Telangana',
                        'Tripura','Uttar Pradesh','Uttarakhand','West Bengal',
                        'Andaman and Nicobar Islands','Chandigarh','Dadra and Nagar Haveli and Daman and Diu',
                        'Delhi','Jammu and Kashmir','Ladakh','Lakshadweep','Puducherry',
                      ].map((s) => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
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
              </div>

              {/* Shipping Information Display */}
              {shippingCalculated && (
                <div className="border border-green-200 bg-green-50 p-4 rounded-sm">
                  <div className="flex items-start gap-2">
                    <Truck className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                    <div className="text-sm">
                      <p className="font-medium text-green-900">
                        {isFreeShipping ? '✓ Free Shipping Applied!' : `Shipping Cost: ₹${shippingCost.toFixed(2)}`}
                      </p>
                      {!isFreeShipping && (
                        <p className="text-xs text-green-800 mt-1">
                          Free shipping available on orders above ₹{freeShippingThreshold.toFixed(0)}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Discount Code */}
              <div className="space-y-4 border-t border-border pt-6">
                <h3 className="font-serif text-lg text-foreground flex items-center gap-2">
                  <Zap className="h-5 w-5" /> Apply Discount
                </h3>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={discountCode}
                    onChange={(e) => setDiscountCode(e.target.value.toUpperCase())}
                    placeholder="Enter discount code"
                    className="flex-1 px-4 py-3 border border-border bg-background-cream text-foreground focus:outline-none focus:border-primary text-sm rounded-none"
                  />
                  <Button
                    type="button"
                    onClick={handleApplyDiscount}
                    disabled={validatingDiscount}
                    variant="outline"
                  >
                    {validatingDiscount ? 'Validating...' : 'Apply'}
                  </Button>
                </div>
                {discountAmount > 0 && <p className="text-sm text-green-600">Discount: -₹{discountAmount.toFixed(2)}</p>}
              </div>

              {/* Packaging Options */}
              <div className="space-y-4 border-t border-border pt-6">
                <h3 className="font-serif text-lg text-foreground flex items-center gap-2">
                  <Package className="h-5 w-5" /> Packaging
                </h3>
                <div className="space-y-3">
                  {packagingOptions.map((option) => (
                    <label key={option.id} className="flex items-center gap-3 p-3 border border-border rounded-sm cursor-pointer hover:bg-background-cream/40">
                      <input
                        type="radio"
                        name="packaging"
                        value={option.packaging_type}
                        checked={packaging === option.packaging_type}
                        onChange={(e) => handlePackagingChange(e.target.value)}
                        className="h-4 w-4"
                      />
                      <div className="flex-1">
                        <p className="font-medium text-sm">{option.name}</p>
                        <p className="text-xs text-muted-foreground">{option.description}</p>
                      </div>
                      <p className="font-medium text-sm">{option.cost > 0 ? `+₹${option.cost}` : 'Free'}</p>
                    </label>
                  ))}
                </div>
              </div>

              {/* Payment Methods */}
              <div className="space-y-4 border-t border-border pt-6">
                <h2 className="font-serif text-lg text-foreground flex items-center gap-2">
                  <CreditCard className="h-5 w-5" /> Payment Method
                </h2>
                <div className="space-y-3">
                  {['upi', 'card', 'netbanking', 'wallet', 'cod'].map((method) => {
                    const methodConfig: any = {
                      upi: {
                        label: 'UPI',
                        desc: 'Pay securely using Google Pay, PhonePe, or other UPI apps',
                      },
                      card: {
                        label: 'Credit / Debit Card',
                        desc: 'Secure payment with Visa, Mastercard, or American Express',
                      },
                      netbanking: {
                        label: 'Net Banking',
                        desc: 'Direct bank transfer from your bank account',
                      },
                      wallet: {
                        label: 'Wallet',
                        desc: 'Use your Paytm, Amazon Pay, or other wallet balance',
                      },
                      cod: {
                        label: 'Cash on Delivery (COD)',
                        desc: 'Pay securely when your order arrives',
                      },
                    };

                    return (
                      <label
                        key={method}
                        className="border border-border p-4 bg-background-cream/40 flex items-center gap-3 cursor-pointer hover:bg-background-cream/60 rounded-sm"
                      >
                        <input
                          type="radio"
                          name="payment"
                          value={method}
                          checked={paymentMethod === method}
                          onChange={(e) => setPaymentMethod(e.target.value)}
                          className="h-4 w-4"
                        />
                        <div className="flex-1">
                          <p className="text-sm font-medium text-foreground">{methodConfig[method].label}</p>
                          <p className="text-xs text-muted-foreground">{methodConfig[method].desc}</p>
                        </div>
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* Place Order Button */}
              <div className="pt-6 border-t border-border space-y-4">
                <Button
                  type="button"
                  onClick={() => {
                    if (paymentMethod === 'cod') {
                      handleCODSubmit();
                    } else {
                      handleRazorpayPayment();
                    }
                  }}
                  disabled={submitting || !shippingCalculated}
                  className="w-full py-4 text-xs uppercase tracking-[0.2em] font-medium"
                >
                  {submitting ? 'Processing...' : `Place Order • ₹${finalAmount.toFixed(2)}`}
                </Button>
                <p className="text-xs text-muted-foreground flex items-center justify-center gap-1">
                  <ShieldCheck className="h-4 w-4" /> Secure & encrypted payment
                </p>
              </div>
            </div>

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
                      {item.product.isPreOrder && <p className="mt-1 text-[10px] uppercase tracking-[0.12em] text-primary">Pre-order</p>}
                    </div>
                    <div className="text-right text-xs font-medium">₹{(item.product.price * item.quantity).toFixed(2)}</div>
                  </div>
                ))}
              </div>

              <div className="border-t border-border pt-4 space-y-2">
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Subtotal</span>
                  <span>₹{subtotal.toFixed(2)}</span>
                </div>
                {discountAmount > 0 && (
                  <div className="flex justify-between text-xs text-green-600 font-medium">
                    <span>Discount</span>
                    <span>-₹{discountAmount.toFixed(2)}</span>
                  </div>
                )}
                {shippingCalculated && (
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>Shipping</span>
                    <span className={isFreeShipping ? 'text-green-600 font-medium' : ''}>{isFreeShipping ? 'Free' : `₹${shippingCost.toFixed(2)}`}</span>
                  </div>
                )}
                {packagingCost > 0 && (
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>Packaging</span>
                    <span>₹{packagingCost.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm font-serif font-medium pt-3 border-t border-border-light">
                  <span>Total</span>
                  <span>₹{finalAmount.toFixed(2)}</span>
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
