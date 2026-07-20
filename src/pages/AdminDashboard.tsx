import { useState, useEffect, Fragment } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft, TrendingUp, ShoppingCart, Users, Package,
  RotateCcw, BarChart3, Boxes, Truck, FileText,
  Calendar, MapPin, RefreshCw, Plus, Edit2, Trash2, Tag, Pen, Ruler, Download
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  AreaChart, Area, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import { ProductManager } from '@/components/admin/ProductManager';
import { DiscountManager } from '@/components/admin/DiscountManager';
import { ContentManager } from '@/components/admin/ContentManager';
import { SizeGuideManager } from '@/components/admin/SizeGuideManager';
import { useAdminAuth } from '@/context/AdminAuthContext';
import { useProducts } from '@/context/ProductContext';
import { toast } from 'sonner';

const tabs = [
  { id: 'overview', label: 'Overview', icon: BarChart3 },
  { id: 'users', label: 'Users', icon: Users },
  { id: 'orders', label: 'Orders', icon: ShoppingCart },
  { id: 'products', label: 'Products', icon: Package },
  { id: 'fitIntelligence', label: 'Fit Intelligence', icon: Ruler },
  { id: 'content', label: 'Content', icon: Pen },
  { id: 'measurements', label: 'Measurements', icon: Boxes },
  { id: 'sizeGuide', label: 'Size Guide', icon: Ruler },
  { id: 'stock', label: 'Stock', icon: Boxes },
  { id: 'returns', label: 'Returns', icon: RotateCcw },
  { id: 'discounts', label: 'Discounts', icon: Tag },
  { id: 'policy', label: 'Return Policy', icon: FileText },
];

const CRIMSON = 'hsl(355 45% 30%)';
const CRIMSON_LIGHT = 'hsl(355 40% 55%)';
const MUTED = 'hsl(25 6% 50%)';

export function AdminDashboard() {
  const { admin, loading: authLoading, isAuthenticated, adminSignOut } = useAdminAuth();
  const { products, loading: productsLoading } = useProducts();
  const navigate = useNavigate();

  // Redirect to admin login if not authenticated as admin
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      navigate('/admin/login', { replace: true });
    }
  }, [authLoading, isAuthenticated, navigate]);

  const [active, setActive] = useState('overview');
  const [loadingData, setLoadingData] = useState(false);
  
  // Dynamic Database State
  const [users, setUsers] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [fitProfiles, setFitProfiles] = useState<any[]>([]);
  const [metrics, setMetrics] = useState({
    revenue: 0,
    ordersCount: 0,
    usersCount: 0,
    productsCount: 0,
  });

  // Load Admin Data on mount / authorization
  useEffect(() => {
    if (isAuthenticated) {
      loadAdminData();
    }
  }, [isAuthenticated, products]);

  const loadAdminData = async () => {
    const token = localStorage.getItem('grazel_admin_token');
    if (!token) return;

    setLoadingData(true);
    try {
      // 1. Fetch Users List
      const usersResponse = await fetch('/api/auth/users', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!usersResponse.ok) throw new Error('Failed to load user list');
      const allUsersData = await usersResponse.json();
      
      // Filter to show only regular users (not admins)
      const regularUsersData = allUsersData.filter((u: any) => u.role === 'user');

      // 2. Fetch Orders List
      let ordersData: any[] = [];
      try {
        const ordersResponse = await fetch('/api/orders', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (ordersResponse.ok) {
          ordersData = await ordersResponse.json();
        }
      } catch {
        console.warn('Could not fetch orders — continuing without order data');
      }

      // 3. Fetch Fit Profiles List
      try {
        const fitResp = await fetch('/api/admin/fit-profiles', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (fitResp.ok) {
          const fitData = await fitResp.json();
          setFitProfiles(fitData || []);
        }
      } catch (err) {
        console.warn('Could not fetch fit profiles — continuing with defaults', err);
      }

      // 4. Compute Metrics
      const activeOrders = ordersData || [];
      const totalRevenue = activeOrders
        .filter((o: any) => o.status !== 'Cancelled')
        .reduce((sum: number, o: any) => sum + Number(o.total_amount), 0);

      setUsers(regularUsersData || []);
      setOrders(ordersData || []);
      setMetrics({
        revenue: totalRevenue,
        ordersCount: activeOrders.length,
        usersCount: regularUsersData?.length || 0,
        productsCount: products.length,
      });
    } catch (err: any) {
      console.error('Failed to load admin data:', err);
      toast.error('Could not fetch real-time administration stats');
    } finally {
      setLoadingData(false);
    }
  };

  const handleUpdateStatus = async (orderId: string, newStatus: string) => {
    const token = localStorage.getItem('grazel_admin_token');
    if (!token) return;

    try {
      const response = await fetch(`/api/orders/${orderId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!response.ok) throw new Error('Failed to update status on server');
      
      toast.success(`Order status updated to ${newStatus}`);
      
      // Find the order to get customer email for notifications
      const updatedOrder = orders.find((o) => o.id === orderId);
      
      // Fire status-based email notifications (non-blocking)
      if (updatedOrder?.customer_email) {
        const emailMap: Record<string, string> = {
          'Shipped': '/api/emails/order-shipped',
          'Delivered': '/api/emails/order-delivered',
        };
        const endpoint = emailMap[newStatus];
        if (endpoint) {
          fetch(endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              orderId,
              orderNumber: updatedOrder.order_number,
              customerEmail: updatedOrder.customer_email,
              trackingNumber: updatedOrder.tracking_number || null,
              estimatedDeliveryDate: updatedOrder.estimated_delivery_date || null,
            }),
          }).catch((err) => console.warn(`${newStatus} email failed (non-critical):`, err));
        }
      }
      
      setOrders((prev) =>
        prev.map((o) => (o.id === orderId ? { ...o, status: newStatus } : o))
      );
      
      // Recompute metrics
      loadAdminData();
    } catch (err: any) {
      console.error('Failed to update status:', err);
      toast.error('Failed to update order status');
    }
  };

  if (authLoading || !isAuthenticated) {
    return (
      <div className="min-h-screen bg-background-cream flex items-center justify-center">
        <p className="text-sm text-muted-foreground uppercase tracking-widest animate-pulse">
          Authenticating administrator...
        </p>
      </div>
    );
  }

  // Pre-calculate charts data
  const revenueTrend = [
    { m: 'Jan', value: metrics.revenue * 0.4 || 12000 },
    { m: 'Feb', value: metrics.revenue * 0.5 || 14000 },
    { m: 'Mar', value: metrics.revenue * 0.7 || 18000 },
    { m: 'Apr', value: metrics.revenue * 0.8 || 22000 },
    { m: 'May', value: metrics.revenue || 25000 },
  ];

  // Category mix
  const categorySplit = [
    { name: 'Men', value: products.filter(p => p.category === 'men').length || 1 },
    { name: 'Women', value: products.filter(p => p.category === 'women').length || 1 },
    { name: 'Essentials', value: products.filter(p => p.category === 'essentials').length || 1 },
  ];

  return (
    <div className="min-h-screen bg-background-cream text-foreground">
      {/* Header */}
      <header className="bg-card border-b border-border sticky top-0 z-30">
        <div className="container py-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-6">
            <Link to="/" className="flex items-center gap-2 text-xs uppercase tracking-wider text-muted-foreground hover:text-foreground transition-colors">
              <ArrowLeft className="h-4 w-4" /> Back to Home
            </Link>
            <div className="w-px h-6 bg-border" />
            <h1 className="font-serif text-2xl tracking-wide">Grazel Atelier Console</h1>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={loadAdminData}
              disabled={loadingData}
              className="p-2.5 bg-background border border-border hover:bg-background-cream hover:text-primary transition-colors text-muted-foreground"
              title="Sync Database"
            >
              <RefreshCw className={`h-4 w-4 ${loadingData ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>
      </header>

      {/* Tabs Menu */}
      <nav className="bg-card border-b border-border sticky top-[61px] z-20">
        <div className="container">
          <div className="flex gap-1 overflow-x-auto scrollbar-none">
            {tabs.map((t) => {
              const Icon = t.icon;
              const isActive = active === t.id;
              return (
                <button
                  key={t.id}
                  onClick={() => setActive(t.id)}
                  className={`relative flex items-center gap-2 px-5 py-4 text-xs uppercase tracking-widest whitespace-nowrap transition-colors duration-200 ${
                    isActive ? 'text-primary font-medium' : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {t.label}
                  {isActive && (
                    <motion.div
                      layoutId="admin-tab"
                      className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary"
                      transition={{ type: 'spring', stiffness: 350, damping: 25, mass: 0.8 }}
                    />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </nav>

      {/* Main Stats */}
      <main className="container py-10">
        {loadingData && (
          <div className="mb-6 bg-primary/5 text-primary text-xs uppercase tracking-widest text-center py-2.5 border border-primary/10">
            Syncing database details...
          </div>
        )}

        <AnimatePresence mode="wait">
          <motion.div
            key={active}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.25 }}
          >
            {active === 'overview' && (
              <OverviewTab
                metrics={metrics}
                revenueTrend={revenueTrend}
                categorySplit={categorySplit}
              />
            )}
            {active === 'users' && <UsersTab users={users} orders={orders} />}
            {active === 'orders' && <OrdersTab orders={orders} onUpdateStatus={handleUpdateStatus} />}
            {active === 'products' && <ProductsTab />}
            {active === 'fitIntelligence' && <FitIntelligenceTab fitProfiles={fitProfiles} />}
            {active === 'content' && <ContentTab />}
            {active === 'measurements' && <MeasurementsTab />}
            {active === 'sizeGuide' && <SizeGuideManager />}
            {active === 'stock' && <StockTab products={products} />}
            {active === 'returns' && <ReturnsTab />}
            {active === 'discounts' && <DiscountsTab />}
            {active === 'policy' && <PolicyTab />}
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  );
}

// Subcomponents helper layout
function Card({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <div className={`bg-card border border-border rounded-none shadow-mega ${className}`}>{children}</div>;
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return <h2 className="font-serif text-xl lg:text-2xl text-foreground mb-6">{children}</h2>;
}

function MetricCard({ label, value, icon: Icon, sub }: any) {
  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-4">
        <span className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground font-semibold">{label}</span>
        <Icon className="h-4 w-4 text-primary" />
      </div>
      <p className="font-serif text-3xl text-foreground">{value}</p>
      {sub && <p className="text-[10px] text-muted-foreground uppercase tracking-wider mt-2">{sub}</p>}
    </Card>
  );
}

// 1. Overview Tab
function OverviewTab({ metrics, revenueTrend, categorySplit }: any) {
  const cards = [
    { label: 'Revenue', value: `₹${metrics.revenue.toLocaleString()}`, icon: TrendingUp, sub: 'Excluding Cancelled' },
    { label: 'Orders', value: metrics.ordersCount.toString(), icon: ShoppingCart, sub: 'Total placed' },
    { label: 'Users', value: metrics.usersCount.toString(), icon: Users, sub: 'Registered profiles' },
    { label: 'Catalog size', value: metrics.productsCount.toString(), icon: Package, sub: 'Active products' },
  ];

  const avgOrderValue = metrics.ordersCount > 0 ? Math.round(metrics.revenue / metrics.ordersCount) : 0;

  return (
    <div className="space-y-10">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {cards.map((c) => <MetricCard key={c.label} {...c} />)}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="p-6 lg:col-span-2">
          <h3 className="font-serif text-lg text-foreground mb-6">Revenue Projections</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={revenueTrend}>
                <defs>
                  <linearGradient id="rev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={CRIMSON} stopOpacity={0.2} />
                    <stop offset="100%" stopColor={CRIMSON} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="2 4" stroke="hsl(35 12% 85%)" vertical={false} />
                <XAxis dataKey="m" stroke={MUTED} fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke={MUTED} fontSize={11} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={{ background: 'white', border: '1px solid hsl(35 12% 85%)', borderRadius: 0 }} />
                <Area type="monotone" dataKey="value" stroke={CRIMSON} strokeWidth={2} fill="url(#rev)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="p-6">
          <h3 className="font-serif text-lg text-foreground mb-6">Category Mix (Inventory)</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={categorySplit} dataKey="value" innerRadius={50} outerRadius={80} paddingAngle={2}>
                  {categorySplit.map((_: any, i: number) => (
                    <Cell key={i} fill={[CRIMSON, CRIMSON_LIGHT, 'hsl(38 30% 75%)'][i]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ background: 'white', border: '1px solid hsl(35 12% 85%)', borderRadius: 0 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex justify-center gap-4 text-xs mt-4">
            {categorySplit.map((c: any, i: number) => (
              <div key={c.name} className="flex items-center gap-2">
                <span className="h-2.5 w-2.5" style={{ background: [CRIMSON, CRIMSON_LIGHT, 'hsl(38 30% 75%)'][i] }} />
                {c.name} ({c.value})
              </div>
            ))}
          </div>
        </Card>
      </div>

      <div>
        <SectionTitle>Key Store Insights</SectionTitle>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          <MetricCard label="Average Order Value" value={`₹${avgOrderValue.toLocaleString()}`} icon={ShoppingCart} />
          <MetricCard label="Gross Volume" value={`₹${metrics.revenue.toLocaleString()}`} icon={TrendingUp} />
          <MetricCard label="Customer Registrations" value={metrics.usersCount.toString()} icon={Users} />
        </div>
      </div>
    </div>
  );
}

// 2. Users Tab
function UsersTab({ users, orders }: { users: any[]; orders: any[] }) {
  const [expandedUser, setExpandedUser] = useState<string | null>(null);

  const getStats = (userId: string) => {
    const userOrders = orders.filter((o) => o.user_id === userId);
    const count = userOrders.length;
    const spent = userOrders.reduce((sum, o) => sum + Number(o.total_amount), 0);
    return { count, spent, userOrders };
  };

  return (
    <div className="space-y-6">
      <SectionTitle>Customer Base</SectionTitle>
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-background-cream/50 border-b border-border">
              <tr className="text-left text-xs uppercase tracking-wider text-muted-foreground font-semibold">
                <th className="p-4">User ID</th>
                <th className="p-4">Customer Name</th>
                <th className="p-4">Email</th>
                <th className="p-4">Phone</th>
                <th className="p-4">Joined Date</th>
                <th className="p-4">Access Level</th>
                <th className="p-4">Orders Count</th>
                <th className="p-4 text-right">Total Spent</th>
                <th className="p-4 text-right">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-light">
              {users.map((u) => {
                const stats = getStats(u.id);
                const isExpanded = expandedUser === u.id;
                return (
                  <Fragment key={u.id}>
                    <tr className="hover:bg-background-cream/15 transition-colors">
                      <td className="p-4 font-mono text-xs text-muted-foreground">{u.id.slice(-8)}</td>
                      <td className="p-4 font-serif text-base">{u.name || 'Valued Customer'}</td>
                      <td className="p-4">{u.email}</td>
                      <td className="p-4 text-xs text-muted-foreground">{u.phone || '—'}</td>
                      <td className="p-4 text-xs text-muted-foreground">
                        {new Date(u.created_at).toLocaleDateString()}
                      </td>
                      <td className="p-4 text-xs">
                        <span className={`px-2 py-0.5 border capitalize ${
                          u.role === 'admin' ? 'text-primary bg-primary/5 border-primary/20' : 'text-muted-foreground border-border'
                        }`}>
                          {u.role}
                        </span>
                      </td>
                      <td className="p-4 text-center font-semibold">{stats.count}</td>
                      <td className="p-4 text-right font-medium text-foreground">₹{stats.spent.toLocaleString()}</td>
                      <td className="p-4 text-right">
                        <button
                          onClick={() => setExpandedUser(isExpanded ? null : u.id)}
                          className="text-xs text-primary underline whitespace-nowrap"
                        >
                          {isExpanded ? 'Hide' : 'View Purchases'}
                        </button>
                      </td>
                    </tr>
                    {isExpanded && (
                      <tr>
                        <td colSpan={9} className="p-0 bg-background-cream/20">
                          <div className="p-6">
                            <p className="text-xs uppercase tracking-[0.15em] text-muted-foreground font-semibold mb-4">
                              Products Purchased ({stats.userOrders.length} order{stats.userOrders.length !== 1 ? 's' : ''})
                            </p>
                            {stats.userOrders.length === 0 ? (
                              <p className="text-sm text-muted-foreground">No purchases yet.</p>
                            ) : (
                              <div className="space-y-4">
                                {stats.userOrders.map((o: any) => (
                                  <div key={o.id} className="border border-border bg-card p-4">
                                    <div className="flex flex-wrap items-center justify-between gap-2 mb-3 text-xs text-muted-foreground">
                                      <span>Order #{o.id.slice(-8).toUpperCase()} · {new Date(o.created_at).toLocaleDateString()}</span>
                                      <span className="px-2 py-0.5 border capitalize">{o.status}</span>
                                    </div>
                                    <div className="space-y-2">
                                      {(o.items || o.order_items || []).map((item: any, idx: number) => (
                                        <div key={idx} className="flex items-center justify-between text-sm">
                                          <span className="text-foreground">
                                            {item.productName || item.product_name} · Size {item.size} · Qty {item.quantity}
                                          </span>
                                          <span className="font-medium text-foreground">
                                            ₹{Number(item.price * item.quantity).toLocaleString()}
                                          </span>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    )}
                  </Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

// 3. Orders Tab (Interactive Updates)
function OrdersTab({ orders, onUpdateStatus }: { orders: any[]; onUpdateStatus: (id: string, s: string) => void }) {
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);

  return (
    <div className="space-y-6">
      <SectionTitle>Orders Registry</SectionTitle>
      
      <div className="space-y-4">
        {orders.length === 0 ? (
          <Card className="p-12 text-center text-muted-foreground uppercase tracking-widest text-xs">
            No orders registered in the system.
          </Card>
        ) : (
          orders.map((o) => {
            const isExpanded = expandedOrder === o.id;
            return (
              <Card key={o.id} className="overflow-hidden">
                <div className="p-6 flex flex-wrap items-center justify-between gap-4 bg-background-cream/30 border-b border-border">
                  <div className="space-y-1">
                    <div className="flex items-center gap-3">
                      <span className="font-serif text-lg">Order #{o.id.slice(-8).toUpperCase()}</span>
                      <button
                        onClick={() => setExpandedOrder(isExpanded ? null : o.id)}
                        className="text-xs text-primary underline"
                      >
                        {isExpanded ? 'Hide Items' : 'View Items'}
                      </button>
                    </div>
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1"><Calendar className="h-3 w-3" /> {new Date(o.created_at).toLocaleDateString()}</span>
                      <span className="flex items-center gap-1"><MapPin className="h-3 w-3" /> {o.shipping_address}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="text-xs text-muted-foreground uppercase">Grand Total</p>
                      <p className="font-serif text-base font-semibold">₹{Number(o.total_amount).toLocaleString()}</p>
                    </div>
                    <div>
                      <select
                        value={o.status}
                        onChange={(e) => onUpdateStatus(o.id, e.target.value)}
                        className={`text-xs uppercase tracking-wider font-semibold border px-3 py-2 bg-background focus:outline-none ${
                          o.status === 'Delivered'
                            ? 'text-green-700 border-green-200 bg-green-50/50'
                            : o.status === 'Cancelled'
                            ? 'text-red-600 border-red-200 bg-red-50/50'
                            : o.status === 'Shipped'
                            ? 'text-blue-700 border-blue-200 bg-blue-50/50'
                            : o.status === 'Returned'
                            ? 'text-orange-700 border-orange-200 bg-orange-50/50'
                            : 'text-yellow-700 border-yellow-200 bg-yellow-50/50'
                        }`}
                      >
                        <option value="Pending">Pending</option>
                        <option value="Confirmed">Confirmed</option>
                        <option value="Processing">Processing</option>
                        <option value="Shipped">Shipped</option>
                        <option value="Delivered">Delivered</option>
                        <option value="Returned">Returned</option>
                        <option value="Cancelled">Cancelled</option>
                      </select>
                    </div>
                  </div>
                </div>

                {isExpanded && (
                  <div className="p-6 bg-card divide-y divide-border-light">
                    <div className="mb-4 text-xs space-y-1 text-muted-foreground">
                      <p><span className="font-semibold text-foreground">Customer Name:</span> {o.customer_name}</p>
                      <p><span className="font-semibold text-foreground">Customer Email:</span> {o.customer_email}</p>
                    </div>
                    {(o.items || o.order_items || []).map((item: any) => (
                      <div key={item.id} className="py-4 first:pt-0 last:pb-0 flex items-center justify-between text-sm">
                        <div className="space-y-0.5">
                          <p className="font-medium text-foreground">{item.productName || item.product_name}</p>
                          <p className="text-xs text-muted-foreground">Size: {item.size} &middot; Qty: {item.quantity}</p>
                          {(item.isPreOrder || item.is_pre_order) && (
                            <p className="text-xs text-primary">
                              Pre-order{(item.preOrderMessage || item.pre_order_message) ? ` · ${item.preOrderMessage || item.pre_order_message}` : ''}
                            </p>
                          )}
                        </div>
                        <p className="font-semibold text-foreground">₹{Number(item.price * item.quantity).toLocaleString()}</p>
                      </div>
                    ))}
                  </div>
                )}
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}

// 4. Products Catalog
function ProductsTab() {
  return (
    <div>
      <SectionTitle>Catalog Registry</SectionTitle>
      <ProductManager />
    </div>
  );
}

function DiscountsTab() {
  return (
    <div>
      <SectionTitle>Discount Control Center</SectionTitle>
      <DiscountManager />
    </div>
  );
}

// 5. Stock Inventory
function StockTab({ products }: { products: any[] }) {
  const [stockOverrides, setStockOverrides] = useState<Record<string, number>>({});
  const [restockInputs, setRestockInputs] = useState<Record<string, string>>({});
  const [savingId, setSavingId] = useState<string | null>(null);

  const getStock = (p: any) => stockOverrides[p.id] ?? (p.stock_quantity ?? 0);

  const handleRestock = async (productId: string) => {
    const qty = Number(restockInputs[productId]);
    if (!qty || qty <= 0) {
      toast.error('Enter a valid quantity to add');
      return;
    }
    const token = localStorage.getItem('grazel_admin_token');
    setSavingId(productId);
    try {
      const response = await fetch(`/api/products/${productId}/restock`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ qty }),
      });
      if (!response.ok) throw new Error('Failed to add stock');
      const updated = await response.json();
      setStockOverrides((prev) => ({ ...prev, [productId]: updated.stock_quantity ?? (getStock({ id: productId }) + qty) }));
      setRestockInputs((prev) => ({ ...prev, [productId]: '' }));
      toast.success(`Added ${qty} units to stock`);
    } catch (err) {
      console.error('Error restocking product:', err);
      toast.error('Failed to add stock');
    } finally {
      setSavingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <SectionTitle>Inventory Levels</SectionTitle>
      <p className="text-xs text-muted-foreground -mt-4">
        Stock updates automatically when products are added/edited, and decreases automatically when customers purchase. Use "Add Stock" to top up existing inventory.
      </p>
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-background-cream/50 border-b border-border">
              <tr className="text-left text-xs uppercase tracking-wider text-muted-foreground font-semibold">
                <th className="p-4">Product</th>
                <th className="p-4">Sizes</th>
                <th className="p-4">Stock Status</th>
                <th className="p-4 text-right">In Stock</th>
                <th className="p-4 text-right">Add Stock</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-light">
              {products.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-xs text-muted-foreground">No products in catalog yet.</td>
                </tr>
              ) : (
                products.map((p) => {
                  const stock = getStock(p);
                  const status = stock === 0 ? 'Out' : stock < 5 ? 'Low' : 'Healthy';
                  return (
                    <tr key={p.id} className="hover:bg-background-cream/15 transition-colors">
                      <td className="p-4 font-serif text-base">{p.name}</td>
                      <td className="p-4 text-xs text-muted-foreground">{(p.sizes || []).join(', ')}</td>
                      <td className="p-4 text-xs">
                        <span className={`px-2 py-0.5 border ${
                          status === 'Healthy'
                            ? 'text-green-700 bg-green-50 border-green-200'
                            : status === 'Low'
                            ? 'text-yellow-700 bg-yellow-50 border-yellow-200'
                            : 'text-red-700 bg-red-50 border-red-200'
                        }`}>
                          {status}
                        </span>
                      </td>
                      <td className="p-4 text-right font-mono font-semibold">{stock}</td>
                      <td className="p-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <input
                            type="number"
                            min={1}
                            value={restockInputs[p.id] || ''}
                            onChange={(e) => setRestockInputs((prev) => ({ ...prev, [p.id]: e.target.value }))}
                            placeholder="Qty"
                            className="w-20 px-2 py-1.5 border border-border bg-background-cream text-sm rounded-none focus:outline-none focus:border-primary"
                          />
                          <button
                            onClick={() => handleRestock(p.id)}
                            disabled={savingId === p.id}
                            className="px-3 py-1.5 bg-primary text-primary-foreground text-xs uppercase tracking-wider hover:bg-primary/90 transition-colors disabled:opacity-50"
                          >
                            {savingId === p.id ? '...' : 'Add'}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

// 6. Returns Management
function ReturnsTab() {
  const returns = [
    { id: 'RET-204', order: 'ORD-1038', customer: 'Ishaan Roy', reason: 'Size too large', status: 'Approved', date: '09 May' },
    { id: 'RET-203', order: 'ORD-1032', customer: 'Aarav Sharma', reason: 'Color mismatch', status: 'Pending', date: '07 May' },
    { id: 'RET-202', order: 'ORD-1029', customer: 'Diya Patel', reason: 'Defect', status: 'Refunded', date: '04 May' },
  ];
  return (
    <div className="space-y-6">
      <SectionTitle>Store Returns</SectionTitle>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
        <MetricCard label="Open Returns" value="3" icon={RotateCcw} />
        <MetricCard label="Refunded amount" value="₹14,200" icon={TrendingUp} />
        <MetricCard label="Return Rate" value="3.2%" icon={BarChart3} />
        <MetricCard label="Avg Resolution" value="2.1 days" icon={Truck} />
      </div>
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-background-cream/50 border-b border-border">
              <tr className="text-left text-xs uppercase tracking-wider text-muted-foreground font-semibold">
                <th className="p-4">Return ID</th>
                <th className="p-4">Order ID</th>
                <th className="p-4">Customer</th>
                <th className="p-4">Reason</th>
                <th className="p-4">Date</th>
                <th className="p-4 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-light">
              {returns.map((r) => (
                <tr key={r.id} className="hover:bg-background-cream/15 transition-colors">
                  <td className="p-4 font-mono text-xs">{r.id}</td>
                  <td className="p-4 font-mono text-xs">{r.order}</td>
                  <td className="p-4 font-serif text-base">{r.customer}</td>
                  <td className="p-4 text-xs text-muted-foreground">{r.reason}</td>
                  <td className="p-4 text-xs text-muted-foreground">{r.date}</td>
                  <td className="p-4 text-right">
                    <span className="px-2 py-0.5 border text-xs text-muted-foreground capitalize">
                      {r.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

// 7. Policy Editor
function PolicyTab() {
  const [policies, setPolicies] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');
  const [newTitle, setNewTitle] = useState('');
  const [newValue, setNewValue] = useState('');

  const authHeaders = () => {
    const token = localStorage.getItem('grazel_admin_token');
    return { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) };
  };

  useEffect(() => {
    fetchPolicies();
  }, []);

  const fetchPolicies = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/return-policies', { headers: authHeaders() });
      if (!response.ok) throw new Error('Failed to load return policies');
      const data = await response.json();
      setPolicies(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Error fetching return policies:', err);
      toast.error('Failed to load return policies');
      setPolicies([]);
    } finally {
      setLoading(false);
    }
  };

  const startEdit = (p: any) => {
    setEditingId(p.id);
    setEditValue(p.value);
  };

  const saveEdit = async (id: string) => {
    try {
      const response = await fetch(`/api/return-policies/${id}`, {
        method: 'PUT',
        headers: authHeaders(),
        body: JSON.stringify({ value: editValue }),
      });
      if (!response.ok) throw new Error('Failed to update');
      const updated = await response.json();
      setPolicies((prev) => prev.map((p) => (p.id === id ? updated : p)));
      setEditingId(null);
      toast.success('Return policy updated');
    } catch (err) {
      console.error('Error updating return policy:', err);
      toast.error('Failed to update return policy');
    }
  };

  const addPolicy = async () => {
    if (!newTitle.trim() || !newValue.trim()) {
      toast.error('Both title and value are required');
      return;
    }
    try {
      const response = await fetch('/api/return-policies', {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({ title: newTitle.trim(), value: newValue.trim(), sortOrder: policies.length + 1 }),
      });
      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.message || 'Failed to add policy');
      }
      const created = await response.json();
      setPolicies((prev) => [...prev, created]);
      setNewTitle('');
      setNewValue('');
      toast.success('Return policy added');
    } catch (err: any) {
      console.error('Error adding return policy:', err);
      toast.error(err.message || 'Failed to add return policy');
    }
  };

  const deletePolicy = async (id: string) => {
    try {
      const response = await fetch(`/api/return-policies/${id}`, { method: 'DELETE', headers: authHeaders() });
      if (!response.ok) throw new Error('Failed to delete');
      setPolicies((prev) => prev.filter((p) => p.id !== id));
      toast.success('Return policy deleted');
    } catch (err) {
      console.error('Error deleting return policy:', err);
      toast.error('Failed to delete return policy');
    }
  };

  return (
    <div className="space-y-6">
      <SectionTitle>Return Policies configuration</SectionTitle>
      <p className="text-xs text-muted-foreground -mt-4">
        These entries are stored in the database and shown to customers exactly as written here.
      </p>
      <Card className="divide-y divide-border-light">
        {loading ? (
          <p className="p-6 text-xs text-muted-foreground">Loading policies...</p>
        ) : policies.length === 0 ? (
          <p className="p-6 text-xs text-muted-foreground">No policy entries yet. Add one below.</p>
        ) : (
          policies.map((p) => (
            <div key={p.id} className="p-6 grid grid-cols-1 lg:grid-cols-[240px_1fr_auto] gap-4 items-start">
              <span className="text-xs uppercase tracking-[0.15em] text-muted-foreground font-semibold pt-2">{p.title}</span>
              {editingId === p.id ? (
                <textarea
                  value={editValue}
                  onChange={(e) => setEditValue(e.target.value)}
                  rows={2}
                  className="w-full px-3 py-2 border border-border bg-background-cream text-foreground text-sm rounded-none focus:outline-none focus:border-primary"
                />
              ) : (
                <p className="text-sm text-foreground leading-relaxed pt-2">{p.value}</p>
              )}
              <div className="flex gap-2 pt-2">
                {editingId === p.id ? (
                  <button
                    onClick={() => saveEdit(p.id)}
                    className="px-3 py-1.5 bg-primary text-primary-foreground text-xs uppercase tracking-wider hover:bg-primary/90 transition-colors"
                  >
                    Save
                  </button>
                ) : (
                  <button
                    onClick={() => startEdit(p)}
                    className="p-1.5 text-muted-foreground hover:text-primary transition-colors"
                    title="Edit"
                  >
                    <Edit2 className="h-4 w-4" />
                  </button>
                )}
                <button
                  onClick={() => deletePolicy(p.id)}
                  className="p-1.5 text-muted-foreground hover:text-red-600 transition-colors"
                  title="Delete"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))
        )}
      </Card>

      <Card className="p-6 space-y-3">
        <h3 className="text-xs uppercase tracking-[0.15em] text-muted-foreground font-semibold">Add Policy Entry</h3>
        <div className="grid grid-cols-1 lg:grid-cols-[240px_1fr_auto] gap-3">
          <input
            type="text"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            placeholder="Title (e.g. Return Window)"
            className="px-3 py-2 border border-border bg-background-cream text-foreground placeholder-muted-foreground focus:outline-none focus:border-primary text-sm rounded-none"
          />
          <input
            type="text"
            value={newValue}
            onChange={(e) => setNewValue(e.target.value)}
            placeholder="Value (e.g. 30 days from delivery)"
            className="px-3 py-2 border border-border bg-background-cream text-foreground placeholder-muted-foreground focus:outline-none focus:border-primary text-sm rounded-none"
          />
          <button
            onClick={addPolicy}
            className="px-4 py-2 bg-primary text-primary-foreground text-xs uppercase tracking-wider hover:bg-primary/90 transition-colors flex items-center justify-center gap-2"
          >
            <Plus className="h-4 w-4" /> Add
          </button>
        </div>
      </Card>
    </div>
  );
}

// 8. Content Management
function ContentTab() {
  return (
    <div>
      <ContentManager />
    </div>
  );
}

// 9. Measurements Tab
function MeasurementsTab() {
  const [topMeasurements, setTopMeasurements] = useState<any[]>([]);
  const [bottomMeasurements, setBottomMeasurements] = useState<any[]>([]);
  const [loadingMeasurements, setLoadingMeasurements] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [newTopMeasurement, setNewTopMeasurement] = useState('');
  const [newTopDatatype, setNewTopDatatype] = useState<'number' | 'decimal' | 'integer' | 'string' | 'percentage'>('decimal');
  const [newBottomMeasurement, setNewBottomMeasurement] = useState('');
  const [newBottomDatatype, setNewBottomDatatype] = useState<'number' | 'decimal' | 'integer' | 'string' | 'percentage'>('decimal');

  const datatypeOptions = [
    { value: 'number', label: 'Number' },
    { value: 'decimal', label: 'Decimal' },
    { value: 'integer', label: 'Integer' },
    { value: 'string', label: 'Text' },
    { value: 'percentage', label: 'Percentage' },
  ];

  // Default measurements
  const defaultTopMeasurements = ['Chest/Bust', 'Shoulder width', 'Waist', 'Hip', 'Bicep', 'Wrist', 'Arm length', 'Garment length'];
  const defaultBottomMeasurements = ['Waist', 'Hip', 'Thigh circumference', 'Calf circumference', 'Inseam', 'Outseam', 'Ankle opening'];

  useEffect(() => {
    fetchMeasurements();
  }, []);

  const fetchMeasurements = async () => {
    const token = localStorage.getItem('grazel_admin_token');
    if (!token) return;

    setLoadingMeasurements(true);
    try {
      const response = await fetch('/api/measurements', {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!response.ok) throw new Error('Failed to load measurements');

      const data = await response.json();
      // Server returns snake_case fit_type
      const tops = data.filter((m: any) => m.fit_type === 'top' || m.fitType === 'top');
      const bottoms = data.filter((m: any) => m.fit_type === 'bottom' || m.fitType === 'bottom');

      setTopMeasurements(tops);
      setBottomMeasurements(bottoms);
    } catch (err: any) {
      console.error('Error fetching measurements:', err);
      toast.error('Failed to load measurements');
    } finally {
      setLoadingMeasurements(false);
    }
  };

  const addMeasurement = async (fitType: 'top' | 'bottom', name: string, datatype: string) => {
    if (!name.trim()) {
      toast.error('Measurement name cannot be empty');
      return;
    }

    const token = localStorage.getItem('grazel_admin_token');
    if (!token) return;

    try {
      const response = await fetch('/api/measurements', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          fitType,
          name: name.trim(),
          datatype,
          description: '',
        }),
      });

      if (!response.ok) throw new Error('Failed to add measurement');

      const newMeasurement = await response.json();
      if (fitType === 'top') {
        setTopMeasurements([...topMeasurements, newMeasurement]);
        setNewTopMeasurement('');
        setNewTopDatatype('decimal');
      } else {
        setBottomMeasurements([...bottomMeasurements, newMeasurement]);
        setNewBottomMeasurement('');
        setNewBottomDatatype('decimal');
      }

      toast.success(`${fitType.charAt(0).toUpperCase() + fitType.slice(1)} measurement added`);
    } catch (err: any) {
      console.error('Error adding measurement:', err);
      toast.error('Failed to add measurement');
    }
  };

  const deleteMeasurement = async (id: string, fitType: 'top' | 'bottom') => {
    const token = localStorage.getItem('grazel_admin_token');
    if (!token) return;

    try {
      const response = await fetch(`/api/measurements/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (!response.ok) throw new Error('Failed to delete measurement');

      if (fitType === 'top') {
        setTopMeasurements(topMeasurements.filter((m) => m.id !== id));
      } else {
        setBottomMeasurements(bottomMeasurements.filter((m) => m.id !== id));
      }

      toast.success('Measurement deleted');
    } catch (err: any) {
      console.error('Error deleting measurement:', err);
      toast.error('Failed to delete measurement');
    }
  };

  const updateMeasurement = async (id: string, fitType: 'top' | 'bottom', newName: string) => {
    const token = localStorage.getItem('grazel_admin_token');
    if (!token) return;

    try {
      const response = await fetch(`/api/measurements/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ name: newName }),
      });

      if (!response.ok) throw new Error('Failed to update measurement');

      const updated = await response.json();
      if (fitType === 'top') {
        setTopMeasurements(topMeasurements.map((m) => (m.id === id ? updated : m)));
      } else {
        setBottomMeasurements(bottomMeasurements.map((m) => (m.id === id ? updated : m)));
      }

      setEditingId(null);
      toast.success('Measurement updated');
    } catch (err: any) {
      console.error('Error updating measurement:', err);
      toast.error('Failed to update measurement');
    }
  };

  return (
    <div className="space-y-8">
      <SectionTitle>Tailored Fit Measurements</SectionTitle>

      {/* Default Reference Info */}
      <Card className="bg-primary/5 border border-primary/20 p-6">
        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-primary uppercase tracking-wide">Default Measurements Setup</h3>
          <p className="text-xs text-muted-foreground">
            The following measurements are pre-configured as defaults for your tailored fit system. You can add, edit, or delete measurements as needed.
          </p>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-4">
            <div>
              <h4 className="text-xs uppercase tracking-widest text-foreground font-semibold mb-2">Top Measurements (8)</h4>
              <ul className="text-xs text-muted-foreground space-y-1 list-disc list-inside">
                <li>Chest/Bust</li>
                <li>Shoulder width</li>
                <li>Waist</li>
                <li>Hip</li>
                <li>Bicep</li>
                <li>Wrist</li>
                <li>Arm length</li>
                <li>Garment length</li>
              </ul>
            </div>
            <div>
              <h4 className="text-xs uppercase tracking-widest text-foreground font-semibold mb-2">Bottom Measurements (7)</h4>
              <ul className="text-xs text-muted-foreground space-y-1 list-disc list-inside">
                <li>Waist</li>
                <li>Hip</li>
                <li>Thigh circumference</li>
                <li>Calf circumference</li>
                <li>Inseam</li>
                <li>Outseam</li>
                <li>Ankle opening</li>
              </ul>
            </div>
          </div>
        </div>
      </Card>

      {/* Top Measurements */}
      <div>
        <h3 className="text-lg font-serif text-foreground mb-4">Top Measurements</h3>
        <Card>
          <div className="p-6 space-y-4">
            <div className="flex gap-2">
              <input
                type="text"
                value={newTopMeasurement}
                onChange={(e) => setNewTopMeasurement(e.target.value)}
                placeholder="Enter new measurement"
                className="flex-1 px-3 py-2 border border-border bg-background-cream text-foreground placeholder-muted-foreground focus:outline-none focus:border-primary text-sm rounded-none"
                onKeyPress={(e) => {
                  if (e.key === 'Enter') addMeasurement('top', newTopMeasurement, newTopDatatype);
                }}
              />
              <select
                value={newTopDatatype}
                onChange={(e) => setNewTopDatatype(e.target.value as any)}
                className="px-3 py-2 border border-border bg-background-cream text-foreground text-sm rounded-none focus:outline-none focus:border-primary"
              >
                {datatypeOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
              <button
                onClick={() => addMeasurement('top', newTopMeasurement, newTopDatatype)}
                className="px-4 py-2 bg-primary text-primary-foreground text-xs uppercase tracking-wider hover:bg-primary/90 transition-colors flex items-center gap-2"
              >
                <Plus className="h-4 w-4" /> Add
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-4">
              {topMeasurements.length === 0 ? (
                <p className="text-xs text-muted-foreground col-span-full text-center py-6">Loading measurements...</p>
              ) : (
                topMeasurements.map((m) => (
                  <div
                    key={m.id}
                    className="flex items-center justify-between bg-background-cream/50 border border-border/50 px-4 py-3 hover:bg-background-cream/70 transition-colors"
                  >
                    {editingId === m.id ? (
                      <input
                        type="text"
                        defaultValue={m.name}
                        onBlur={(e) => updateMeasurement(m.id, 'top', e.target.value)}
                        onKeyPress={(e) => {
                          if (e.key === 'Enter') updateMeasurement(m.id, 'top', (e.target as HTMLInputElement).value);
                        }}
                        autoFocus
                        className="flex-1 px-2 py-1 border border-border bg-card text-foreground text-sm rounded-none"
                      />
                    ) : (
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-foreground">{m.name}</span>
                        <span className="text-xs text-muted-foreground bg-background-cream/70 px-2 py-0.5">{m.datatype}</span>
                      </div>
                    )}
                    <div className="flex gap-1 ml-2">
                      <button
                        onClick={() => setEditingId(editingId === m.id ? null : m.id)}
                        className="p-1 text-muted-foreground hover:text-primary transition-colors"
                        title="Edit"
                      >
                        <Edit2 className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => deleteMeasurement(m.id, 'top')}
                        className="p-1 text-muted-foreground hover:text-red-600 transition-colors"
                        title="Delete"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </Card>
      </div>

      {/* Bottom Measurements */}
      <div>
        <h3 className="text-lg font-serif text-foreground mb-4">Bottom Measurements</h3>
        <Card>
          <div className="p-6 space-y-4">
            <div className="flex gap-2">
              <input
                type="text"
                value={newBottomMeasurement}
                onChange={(e) => setNewBottomMeasurement(e.target.value)}
                placeholder="Enter new measurement"
                className="flex-1 px-3 py-2 border border-border bg-background-cream text-foreground placeholder-muted-foreground focus:outline-none focus:border-primary text-sm rounded-none"
                onKeyPress={(e) => {
                  if (e.key === 'Enter') addMeasurement('bottom', newBottomMeasurement, newBottomDatatype);
                }}
              />
              <select
                value={newBottomDatatype}
                onChange={(e) => setNewBottomDatatype(e.target.value as any)}
                className="px-3 py-2 border border-border bg-background-cream text-foreground text-sm rounded-none focus:outline-none focus:border-primary"
              >
                {datatypeOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
              <button
                onClick={() => addMeasurement('bottom', newBottomMeasurement, newBottomDatatype)}
                className="px-4 py-2 bg-primary text-primary-foreground text-xs uppercase tracking-wider hover:bg-primary/90 transition-colors flex items-center gap-2"
              >
                <Plus className="h-4 w-4" /> Add
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-4">
              {bottomMeasurements.length === 0 ? (
                <p className="text-xs text-muted-foreground col-span-full text-center py-6">Loading measurements...</p>
              ) : (
                bottomMeasurements.map((m) => (
                  <div
                    key={m.id}
                    className="flex items-center justify-between bg-background-cream/50 border border-border/50 px-4 py-3 hover:bg-background-cream/70 transition-colors"
                  >
                    {editingId === m.id ? (
                      <input
                        type="text"
                        defaultValue={m.name}
                        onBlur={(e) => updateMeasurement(m.id, 'bottom', e.target.value)}
                        onKeyPress={(e) => {
                          if (e.key === 'Enter') updateMeasurement(m.id, 'bottom', (e.target as HTMLInputElement).value);
                        }}
                        autoFocus
                        className="flex-1 px-2 py-1 border border-border bg-card text-foreground text-sm rounded-none"
                      />
                    ) : (
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-foreground">{m.name}</span>
                        <span className="text-xs text-muted-foreground bg-background-cream/70 px-2 py-0.5">{m.datatype}</span>
                      </div>
                    )}
                    <div className="flex gap-1 ml-2">
                      <button
                        onClick={() => setEditingId(editingId === m.id ? null : m.id)}
                        className="p-1 text-muted-foreground hover:text-primary transition-colors"
                        title="Edit"
                      >
                        <Edit2 className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => deleteMeasurement(m.id, 'bottom')}
                        className="p-1 text-muted-foreground hover:text-red-600 transition-colors"
                        title="Delete"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}

// 10. Fit Intelligence Submissions & Excel Export Tab
function FitIntelligenceTab({ fitProfiles: initialFitProfiles }: { fitProfiles: any[] }) {
  const [profiles, setProfiles] = useState<any[]>(initialFitProfiles || []);
  const [editingProfile, setEditingProfile] = useState<any | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setProfiles(initialFitProfiles || []);
  }, [initialFitProfiles]);

  const exportToExcel = () => {
    if (!profiles || profiles.length === 0) {
      toast.error('No fit profiles available to export');
      return;
    }
    const headers = ['Profile ID', 'Created Date', 'Customer Name', 'Customer Email', 'Fit Mode', 'Height (cm)', 'Weight (kg)', 'Chest (cm)', 'Waist (cm)', 'Hip (cm)', 'Shoulder (cm)', 'Recommended Size'];
    const rows = profiles.map((p) => [
      p.id,
      new Date(p.created_at || Date.now()).toLocaleDateString(),
      `"${p.user_name || 'Guest Customer'}"`,
      `"${p.user_email || 'N/A'}"`,
      p.type || p.fit_type || 'detailed',
      p.height || '-',
      p.weight || '-',
      p.chest || '-',
      p.waist || '-',
      p.hip || '-',
      p.shoulder_width || '-',
      p.recommended_size || '-'
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `grazel_fit_intelligence_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Fit Intelligence dataset exported to Excel (CSV)');
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProfile) return;

    setSaving(true);
    try {
      const token = localStorage.getItem('grazel_admin_token') || localStorage.getItem('grazel_user_token');
      const response = await fetch(`/api/admin/fit-profiles/${editingProfile.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify(editingProfile)
      });

      if (response.ok) {
        const updated = await response.json();
        setProfiles(prev => prev.map(p => p.id === editingProfile.id ? { ...p, ...updated } : p));
        toast.success('Fit profile updated successfully');
        setEditingProfile(null);
      } else {
        throw new Error('Failed to update fit profile');
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to update fit profile');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const token = localStorage.getItem('grazel_admin_token') || localStorage.getItem('grazel_user_token');
      const response = await fetch(`/api/admin/fit-profiles/${id}`, {
        method: 'DELETE',
        headers: {
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        }
      });

      if (response.ok) {
        setProfiles(prev => prev.filter(p => String(p.id) !== String(id)));
        toast.success('Fit profile deleted');
      } else {
        throw new Error('Failed to delete fit profile');
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to delete fit profile');
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <SectionTitle>Fit Intelligence Submissions</SectionTitle>
          <p className="text-xs text-muted-foreground -mt-4">
            Curated customer fit measurements and AI size recommendations for atelier tailoring.
          </p>
        </div>
        <Button
          onClick={exportToExcel}
          className="bg-primary text-primary-foreground hover:bg-primary/90 flex items-center gap-2 text-xs uppercase tracking-wider px-4 py-2.5"
        >
          <Download className="h-4 w-4" /> Export to Excel (.csv)
        </Button>
      </div>

      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-border bg-background-cream/50 text-[10px] uppercase tracking-[0.15em] text-muted-foreground font-semibold">
                <th className="py-3.5 px-4">Date</th>
                <th className="py-3.5 px-4">Customer Name</th>
                <th className="py-3.5 px-4">Email</th>
                <th className="py-3.5 px-4">Mode</th>
                <th className="py-3.5 px-4">Height / Weight</th>
                <th className="py-3.5 px-4">Chest / Waist</th>
                <th className="py-3.5 px-4">Recommended Size</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60 text-xs">
              {profiles.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-muted-foreground">
                    No Curated Fit submissions recorded yet.
                  </td>
                </tr>
              ) : (
                profiles.map((p) => (
                  <tr key={p.id} className="hover:bg-background-cream/30 transition-colors">
                    <td className="py-3.5 px-4 font-mono text-muted-foreground">
                      {new Date(p.created_at || Date.now()).toLocaleDateString()}
                    </td>
                    <td className="py-3.5 px-4 font-medium text-foreground">
                      {p.user_name || 'Guest Customer'}
                    </td>
                    <td className="py-3.5 px-4 text-muted-foreground">
                      {p.user_email || 'N/A'}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="inline-block px-2 py-0.5 text-[10px] uppercase tracking-wide bg-primary/10 text-primary font-medium rounded-none">
                        {p.type || p.fit_type || 'detailed'}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-foreground">
                      {p.height ? `${p.height}cm` : '-'} / {p.weight ? `${p.weight}kg` : '-'}
                    </td>
                    <td className="py-3.5 px-4 text-foreground">
                      {p.chest ? `Chest: ${p.chest}cm` : '-'} {p.waist ? `| Waist: ${p.waist}cm` : ''}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="font-serif font-bold text-sm text-primary">
                        {p.recommended_size || '-'}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-primary"
                          onClick={() => setEditingProfile({ ...p })}
                          title="Edit Fit Profile"
                        >
                          <Edit2 className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive hover:bg-destructive/10"
                          onClick={() => setDeletingId(p.id)}
                          title="Delete Fit Profile"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Edit Fit Profile Modal */}
      {editingProfile && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-card border border-border w-full max-w-lg p-6 shadow-2xl space-y-4"
          >
            <h3 className="font-serif text-lg font-bold text-foreground">Edit Fit Intelligence Profile</h3>
            <form onSubmit={handleUpdate} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] uppercase font-semibold text-muted-foreground mb-1">Customer Name</label>
                  <input
                    type="text"
                    value={editingProfile.user_name || ''}
                    onChange={(e) => setEditingProfile({ ...editingProfile, user_name: e.target.value })}
                    className="w-full px-3 py-2 bg-background border border-border text-foreground"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[10px] uppercase font-semibold text-muted-foreground mb-1">Customer Email</label>
                  <input
                    type="email"
                    value={editingProfile.user_email || ''}
                    onChange={(e) => setEditingProfile({ ...editingProfile, user_email: e.target.value })}
                    className="w-full px-3 py-2 bg-background border border-border text-foreground"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] uppercase font-semibold text-muted-foreground mb-1">Height (cm)</label>
                  <input
                    type="number"
                    value={editingProfile.height || ''}
                    onChange={(e) => setEditingProfile({ ...editingProfile, height: e.target.value })}
                    className="w-full px-3 py-2 bg-background border border-border text-foreground"
                  />
                </div>
                <div>
                  <label className="block text-[10px] uppercase font-semibold text-muted-foreground mb-1">Weight (kg)</label>
                  <input
                    type="number"
                    value={editingProfile.weight || ''}
                    onChange={(e) => setEditingProfile({ ...editingProfile, weight: e.target.value })}
                    className="w-full px-3 py-2 bg-background border border-border text-foreground"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-[10px] uppercase font-semibold text-muted-foreground mb-1">Chest (cm)</label>
                  <input
                    type="number"
                    value={editingProfile.chest || ''}
                    onChange={(e) => setEditingProfile({ ...editingProfile, chest: e.target.value })}
                    className="w-full px-3 py-2 bg-background border border-border text-foreground"
                  />
                </div>
                <div>
                  <label className="block text-[10px] uppercase font-semibold text-muted-foreground mb-1">Waist (cm)</label>
                  <input
                    type="number"
                    value={editingProfile.waist || ''}
                    onChange={(e) => setEditingProfile({ ...editingProfile, waist: e.target.value })}
                    className="w-full px-3 py-2 bg-background border border-border text-foreground"
                  />
                </div>
                <div>
                  <label className="block text-[10px] uppercase font-semibold text-muted-foreground mb-1">Recommended Size</label>
                  <input
                    type="text"
                    value={editingProfile.recommended_size || ''}
                    onChange={(e) => setEditingProfile({ ...editingProfile, recommended_size: e.target.value })}
                    className="w-full px-3 py-2 bg-background border border-border text-foreground font-bold"
                    placeholder="e.g. M, L, S"
                    required
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-border">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setEditingProfile(null)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={saving}
                  className="bg-primary text-primary-foreground hover:bg-primary/90"
                >
                  {saving ? 'Saving...' : 'Save Changes'}
                </Button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deletingId && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-card border border-border w-full max-w-sm p-6 shadow-2xl space-y-4"
          >
            <h3 className="font-serif text-lg font-bold text-foreground">Confirm Deletion</h3>
            <p className="text-xs text-muted-foreground">
              Are you sure you want to delete this customer fit profile? This action cannot be undone.
            </p>
            <div className="flex items-center justify-end gap-3 pt-2">
              <Button
                variant="outline"
                onClick={() => setDeletingId(null)}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={() => handleDelete(deletingId)}
              >
                Delete Profile
              </Button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
