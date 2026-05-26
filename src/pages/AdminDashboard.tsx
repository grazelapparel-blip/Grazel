import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft, TrendingUp, ShoppingCart, Users, Package,
  RotateCcw, BarChart3, Boxes, Truck, FileText,
  Calendar, MapPin, RefreshCw, Plus, Edit2, Trash2
} from 'lucide-react';
import {
  AreaChart, Area, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import { ProductManager } from '@/components/admin/ProductManager';
import { useAuth } from '@/context/AuthContext';
import { useProducts } from '@/context/ProductContext';
import { toast } from 'sonner';

const tabs = [
  { id: 'overview', label: 'Overview', icon: BarChart3 },
  { id: 'users', label: 'Users', icon: Users },
  { id: 'orders', label: 'Orders', icon: ShoppingCart },
  { id: 'products', label: 'Products', icon: Package },
  { id: 'measurements', label: 'Measurements', icon: Boxes },
  { id: 'stock', label: 'Stock', icon: Boxes },
  { id: 'returns', label: 'Returns', icon: RotateCcw },
  { id: 'policy', label: 'Return Policy', icon: FileText },
];

const CRIMSON = 'hsl(355 45% 30%)';
const CRIMSON_LIGHT = 'hsl(355 40% 55%)';
const MUTED = 'hsl(25 6% 50%)';

export function AdminDashboard() {
  const { user, loading: authLoading, isAdmin, signOut } = useAuth();
  const { products, loading: productsLoading } = useProducts();
  const navigate = useNavigate();

  const [active, setActive] = useState('overview');
  const [loadingData, setLoadingData] = useState(false);
  
  // Dynamic Database State
  const [users, setUsers] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [metrics, setMetrics] = useState({
    revenue: 0,
    ordersCount: 0,
    usersCount: 0,
    productsCount: 0,
  });

  // Authorization Route Protection
  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        navigate('/admin/login', { state: { from: { pathname: '/admin' } } });
      } else if (!isAdmin) {
        toast.error('Access denied. Administrator privileges required.');
        signOut();
        navigate('/admin/login', { replace: true, state: { from: { pathname: '/admin' } } });
      }
    }
  }, [user, isAdmin, authLoading, navigate, signOut]);

  // Load Admin Data on mount / authorization
  useEffect(() => {
    if (isAdmin) {
      loadAdminData();
    }
  }, [isAdmin, products]);

  const loadAdminData = async () => {
    const token = localStorage.getItem('grazel_token');
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
      const ordersResponse = await fetch('/api/orders/all', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!ordersResponse.ok) throw new Error('Failed to load order registry');
      const ordersData = await ordersResponse.json();

      // 3. Compute Metrics
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
    const token = localStorage.getItem('grazel_token');
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

  if (authLoading || !user || !isAdmin) {
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
            {active === 'measurements' && <MeasurementsTab />}
            {active === 'stock' && <StockTab products={products} />}
            {active === 'returns' && <ReturnsTab />}
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
  const getStats = (userId: string) => {
    const userOrders = orders.filter((o) => o.user_id === userId);
    const count = userOrders.length;
    const spent = userOrders.reduce((sum, o) => sum + Number(o.total_amount), 0);
    return { count, spent };
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
                <th className="p-4">Joined Date</th>
                <th className="p-4">Access Level</th>
                <th className="p-4">Orders Count</th>
                <th className="p-4 text-right">Total Spent</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-light">
              {users.map((u) => {
                const stats = getStats(u.id);
                return (
                  <tr key={u.id} className="hover:bg-background-cream/15 transition-colors">
                    <td className="p-4 font-mono text-xs text-muted-foreground">{u.id.slice(-8)}</td>
                    <td className="p-4 font-serif text-base">{u.name || 'Valued Customer'}</td>
                    <td className="p-4">{u.email}</td>
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
                  </tr>
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
                            : 'text-yellow-700 border-yellow-200 bg-yellow-50/50'
                        }`}
                      >
                        <option value="Processing">Processing</option>
                        <option value="Shipped">Shipped</option>
                        <option value="Delivered">Delivered</option>
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
                    {o.order_items?.map((item: any) => (
                      <div key={item.id} className="py-4 first:pt-0 last:pb-0 flex items-center justify-between text-sm">
                        <div className="space-y-0.5">
                          <p className="font-medium text-foreground">{item.product_name}</p>
                          <p className="text-xs text-muted-foreground">Size: {item.size} &middot; Qty: {item.quantity}</p>
                          {item.is_pre_order && (
                            <p className="text-xs text-primary">
                              Pre-order{item.pre_order_message ? ` · ${item.pre_order_message}` : ''}
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

// 5. Stock Inventory
function StockTab({ products }: { products: any[] }) {
  const stockItems: any[] = [];
  products.forEach((p) => {
    p.sizes?.forEach((size: string) => {
      stockItems.push({
        sku: `${p.name.slice(0, 3).toUpperCase()}-${p.color?.slice(0, 2).toUpperCase()}-${size}`,
        name: `${p.name} &middot; {color} &middot; ${size}`,
        stock: p.id.charCodeAt(0) % 15 || 5, // mock threshold formula
        threshold: 5,
      });
    });
  });

  return (
    <div className="space-y-6">
      <SectionTitle>Inventory Levels</SectionTitle>
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-background-cream/50 border-b border-border">
              <tr className="text-left text-xs uppercase tracking-wider text-muted-foreground font-semibold">
                <th className="p-4">SKU Code</th>
                <th className="p-4">Product Variant</th>
                <th className="p-4">Stock Status</th>
                <th className="p-4 text-right">In Stock</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-light">
              {stockItems.map((s) => {
                const status = s.stock === 0 ? 'Out' : s.stock < s.threshold ? 'Low' : 'Healthy';
                return (
                  <tr key={s.sku} className="hover:bg-background-cream/15 transition-colors">
                    <td className="p-4 font-mono text-xs">{s.sku}</td>
                    <td className="p-4 font-serif text-base" dangerouslySetInnerHTML={{ __html: s.name }} />
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
                    <td className="p-4 text-right font-mono font-semibold">{s.stock}</td>
                  </tr>
                );
              })}
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
  const policies = [
    { title: 'Return Window', value: '30 days from delivery' },
    { title: 'Condition', value: 'Unworn, tags attached, original packaging' },
    { title: 'Refund Method', value: 'Original payment method, 5–7 business days' },
    { title: 'Exchanges', value: 'Free size exchange within 30 days' },
    { title: 'Final Sale', value: 'Marked items, non-returnable' },
  ];
  return (
    <div className="space-y-6">
      <SectionTitle>Return Policies configuration</SectionTitle>
      <Card className="divide-y divide-border-light">
        {policies.map((p) => (
          <div key={p.title} className="p-6 grid grid-cols-1 lg:grid-cols-[240px_1fr] gap-4">
            <span className="text-xs uppercase tracking-[0.15em] text-muted-foreground font-semibold">{p.title}</span>
            <p className="text-sm text-foreground leading-relaxed">{p.value}</p>
          </div>
        ))}
      </Card>
    </div>
  );
}

// 8. Measurements Tab
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
    const token = localStorage.getItem('grazel_token');
    if (!token) return;

    setLoadingMeasurements(true);
    try {
      const response = await fetch('/api/measurements', {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!response.ok) throw new Error('Failed to load measurements');

      const data = await response.json();
      const tops = data.filter((m: any) => m.fitType === 'top');
      const bottoms = data.filter((m: any) => m.fitType === 'bottom');

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

    const token = localStorage.getItem('grazel_token');
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
    const token = localStorage.getItem('grazel_token');
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
    const token = localStorage.getItem('grazel_token');
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
