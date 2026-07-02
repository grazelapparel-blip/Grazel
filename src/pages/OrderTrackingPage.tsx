import { useState } from 'react';
import { Search, Package, Truck, MapPin, Calendar, CheckCircle, AlertCircle } from 'lucide-react';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

interface OrderTracking {
  id: string;
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  status: string;
  paymentStatus: string;
  estimatedDelivery: string | null;
  actualDelivery: string | null;
  trackingNumber: string | null;
  shippingState: string;
  subtotal: number;
  shippingCost: number;
  tax: number;
  discount: number;
  totalAmount: number;
}

interface TrackingEvent {
  id: string;
  event_type: string;
  event_title: string;
  event_description: string;
  event_date: string;
  location: string;
  notes: string;
}

export function OrderTrackingPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [order, setOrder] = useState<OrderTracking | null>(null);
  const [events, setEvents] = useState<TrackingEvent[]>([]);
  const [hasSearched, setHasSearched] = useState(false);

  const statusConfig: Record<string, { color: string; icon: any; label: string }> = {
    pending: { color: 'bg-yellow-100 text-yellow-800', icon: AlertCircle, label: 'Pending' },
    confirmed: { color: 'bg-blue-100 text-blue-800', icon: CheckCircle, label: 'Confirmed' },
    processing: { color: 'bg-blue-100 text-blue-800', icon: Package, label: 'Processing' },
    shipped: { color: 'bg-purple-100 text-purple-800', icon: Truck, label: 'Shipped' },
    in_transit: { color: 'bg-purple-100 text-purple-800', icon: Truck, label: 'In Transit' },
    out_for_delivery: { color: 'bg-orange-100 text-orange-800', icon: MapPin, label: 'Out for Delivery' },
    delivered: { color: 'bg-green-100 text-green-800', icon: CheckCircle, label: 'Delivered' },
    cancelled: { color: 'bg-red-100 text-red-800', icon: AlertCircle, label: 'Cancelled' },
    returned: { color: 'bg-gray-100 text-gray-800', icon: Package, label: 'Returned' },
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!searchQuery.trim()) {
      toast.error('Please enter an order number');
      return;
    }

    setIsSearching(true);
    setHasSearched(true);
    
    try {
      const response = await fetch(`/api/orders/track/${searchQuery.trim()}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Order not found');
      }

      const data = await response.json();
      if (data.success) {
        setOrder(data.order);
        setEvents(data.events || []);
      }
    } catch (err: any) {
      console.error('Search error:', err);
      toast.error(err.message || 'Unable to find order');
      setOrder(null);
      setEvents([]);
    } finally {
      setIsSearching(false);
    }
  };

  const paymentStatusConfig: Record<string, { color: string; label: string }> = {
    pending: { color: 'text-yellow-600', label: 'Pending' },
    completed: { color: 'text-green-600', label: 'Completed' },
    failed: { color: 'text-red-600', label: 'Failed' },
    refunded: { color: 'text-blue-600', label: 'Refunded' },
  };

  const currentConfig = statusConfig[order?.status || ''] || statusConfig.pending;
  const StatusIcon = currentConfig.icon;

  return (
    <Layout>
      <div className="min-h-[calc(100vh-60px)] bg-background-cream py-16">
        <div className="container max-w-2xl">
          {/* Header */}
          <div className="mb-12 text-center">
            <h1 className="font-serif text-3xl lg:text-4xl text-foreground mb-4">Track Your Order</h1>
            <p className="text-sm text-muted-foreground">
              Enter your order number to see real-time tracking and delivery updates.
            </p>
          </div>

          {/* Search Box */}
          <form onSubmit={handleSearch} className="mb-12 bg-card border border-border p-8 shadow-mega rounded-sm">
            <div className="flex gap-3">
              <div className="flex-1 relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Enter your order number (e.g., GRZ-2024-001)"
                  className="w-full pl-12 pr-4 py-3 border border-border bg-background-cream text-foreground focus:outline-none focus:border-primary text-sm rounded-none"
                />
              </div>
              <Button
                type="submit"
                disabled={isSearching}
                className="px-8 text-xs uppercase tracking-[0.2em] font-medium"
              >
                {isSearching ? 'Searching...' : 'Track'}
              </Button>
            </div>
          </form>

          {/* No Search Yet */}
          {!hasSearched && (
            <div className="bg-card border border-border p-12 text-center rounded-sm">
              <Package className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-40" />
              <p className="text-muted-foreground">Enter your order number above to track your shipment</p>
            </div>
          )}

          {/* Order Not Found */}
          {hasSearched && !order && (
            <div className="bg-red-50 border border-red-200 p-8 text-center rounded-sm">
              <AlertCircle className="h-12 w-12 mx-auto mb-4 text-red-600" />
              <h3 className="font-medium text-red-900 mb-2">Order Not Found</h3>
              <p className="text-sm text-red-700">
                We couldn't find an order with that number. Please check and try again.
              </p>
            </div>
          )}

          {/* Order Found */}
          {order && (
            <div className="space-y-8">
              {/* Order Status Card */}
              <div className="bg-card border border-border p-8 shadow-mega">
                <div className="flex items-start justify-between mb-6">
                  <div>
                    <h2 className="font-serif text-2xl text-foreground mb-2">Order {order.orderNumber}</h2>
                    <p className="text-sm text-muted-foreground">
                      Placed on {new Date(order.subtotal).toLocaleDateString()}
                    </p>
                  </div>
                  <div className={`flex items-center gap-2 px-4 py-2 rounded-sm ${currentConfig.color}`}>
                    <StatusIcon className="h-5 w-5" />
                    <span className="text-sm font-medium">{currentConfig.label}</span>
                  </div>
                </div>

                {/* Order Details Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-6 pb-6 border-b border-border">
                  <div>
                    <p className="text-xs uppercase tracking-[0.15em] text-muted-foreground font-medium mb-1">
                      Order Total
                    </p>
                    <p className="font-serif text-lg text-foreground">₹{order.totalAmount.toFixed(2)}</p>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-[0.15em] text-muted-foreground font-medium mb-1">
                      Payment Status
                    </p>
                    <p className={`font-medium text-sm ${paymentStatusConfig[order.paymentStatus]?.color || 'text-gray-600'}`}>
                      {paymentStatusConfig[order.paymentStatus]?.label || order.paymentStatus}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-[0.15em] text-muted-foreground font-medium mb-1">
                      Shipping To
                    </p>
                    <p className="font-medium text-sm text-foreground">{order.shippingState}</p>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-[0.15em] text-muted-foreground font-medium mb-1">
                      Tracking Number
                    </p>
                    <p className="font-mono text-sm text-foreground">
                      {order.trackingNumber || 'N/A'}
                    </p>
                  </div>
                </div>

                {/* Delivery Estimates */}
                <div className="grid grid-cols-2 gap-6">
                  {order.estimatedDelivery && (
                    <div>
                      <p className="text-xs uppercase tracking-[0.15em] text-muted-foreground font-medium mb-1">
                        Estimated Delivery
                      </p>
                      <div className="flex items-center gap-2 text-foreground">
                        <Calendar className="h-4 w-4" />
                        <span className="text-sm font-medium">
                          {new Date(order.estimatedDelivery).toLocaleDateString('en-IN', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                          })}
                        </span>
                      </div>
                    </div>
                  )}
                  {order.actualDelivery && (
                    <div>
                      <p className="text-xs uppercase tracking-[0.15em] text-muted-foreground font-medium mb-1">
                        Delivered On
                      </p>
                      <div className="flex items-center gap-2 text-green-600">
                        <CheckCircle className="h-4 w-4" />
                        <span className="text-sm font-medium">
                          {new Date(order.actualDelivery).toLocaleDateString('en-IN', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                          })}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Tracking Timeline */}
              {events && events.length > 0 && (
                <div className="bg-card border border-border p-8 shadow-mega">
                  <h3 className="font-serif text-lg text-foreground mb-6">Tracking History</h3>
                  <div className="space-y-6 relative">
                    {/* Timeline line */}
                    <div className="absolute left-5 top-0 bottom-0 w-0.5 bg-border"></div>

                    {/* Events */}
                    {events.map((event, index) => (
                      <div key={event.id} className="pl-16 relative">
                        {/* Timeline dot */}
                        <div className="absolute left-0 w-12 h-12 bg-card border-4 border-border flex items-center justify-center rounded-full">
                          {index === 0 ? (
                            <CheckCircle className="h-6 w-6 text-green-600" />
                          ) : (
                            <Package className="h-5 w-5 text-primary" />
                          )}
                        </div>

                        {/* Event content */}
                        <div className="bg-background-cream/40 p-4 rounded-sm border border-border-light">
                          <div className="flex items-start justify-between mb-2">
                            <h4 className="font-medium text-foreground">{event.event_title}</h4>
                            <span className="text-xs text-muted-foreground">
                              {new Date(event.event_date).toLocaleDateString('en-IN', {
                                day: 'numeric',
                                month: 'short',
                                year: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </span>
                          </div>
                          {event.event_description && (
                            <p className="text-sm text-muted-foreground mb-2">{event.event_description}</p>
                          )}
                          {event.location && (
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                              <MapPin className="h-3 w-3" />
                              <span>{event.location}</span>
                            </div>
                          )}
                          {event.notes && (
                            <p className="text-xs text-muted-foreground mt-2 italic">Note: {event.notes}</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Customer Info */}
              <div className="bg-card border border-border p-8 shadow-mega">
                <h3 className="font-serif text-lg text-foreground mb-4">Order Information</h3>
                <div className="space-y-3 text-sm">
                  <div>
                    <p className="text-xs uppercase tracking-[0.15em] text-muted-foreground font-medium mb-1">
                      Customer Name
                    </p>
                    <p className="text-foreground">{order.customerName}</p>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-[0.15em] text-muted-foreground font-medium mb-1">
                      Email
                    </p>
                    <p className="text-foreground">{order.customerEmail}</p>
                  </div>
                </div>
              </div>

              {/* Price Breakdown */}
              <div className="bg-card border border-border p-8 shadow-mega">
                <h3 className="font-serif text-lg text-foreground mb-4">Price Breakdown</h3>
                <div className="space-y-3 text-sm border-b border-border pb-4 mb-4">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span className="font-medium">₹{order.subtotal.toFixed(2)}</span>
                  </div>
                  {order.discount > 0 && (
                    <div className="flex justify-between text-green-600">
                      <span>Discount</span>
                      <span>-₹{order.discount.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Shipping</span>
                    <span className="font-medium">₹{order.shippingCost.toFixed(2)}</span>
                  </div>
                  {order.tax > 0 && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Tax</span>
                      <span className="font-medium">₹{order.tax.toFixed(2)}</span>
                    </div>
                  )}
                </div>
                <div className="flex justify-between text-lg font-serif font-medium">
                  <span>Total Amount</span>
                  <span>₹{order.totalAmount.toFixed(2)}</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
