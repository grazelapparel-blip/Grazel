import { useEffect, useState } from 'react';
import { Plus, Trash2, CalendarDays, Tag, Package } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { useProducts } from '@/context/ProductContext';

interface DiscountForm {
  code: string;
  description: string;
  discountType: 'percentage' | 'fixed';
  discountValue: number;
  appliesTo: 'products' | 'categories' | 'bundles' | 'all';
  startDate: string;
  endDate: string;
  bundleIds: string[];
}

interface BundleForm {
  name: string;
  description: string;
  bundleType: 'pair_bundle' | 'combo_bundle' | 'save_more';
  productIds: string[];
  bundlePrice: number;
  originalPrice: number;
}

const bundleTypeLabels: Record<BundleForm['bundleType'], string> = {
  pair_bundle: 'Pair Bundle',
  combo_bundle: 'Combo Bundle',
  save_more: 'Buy More, Save More',
};

export function DiscountManager() {
  const { products } = useProducts();
  const [discounts, setDiscounts] = useState<any[]>([]);
  const [bundles, setBundles] = useState<any[]>([]);
  const [form, setForm] = useState<DiscountForm>({
    code: '',
    description: '',
    discountType: 'percentage',
    discountValue: 10,
    appliesTo: 'all',
    startDate: '',
    endDate: '',
    bundleIds: [],
  });
  const [bundleForm, setBundleForm] = useState<BundleForm>({
    name: '',
    description: '',
    bundleType: 'pair_bundle',
    productIds: [],
    bundlePrice: 0,
    originalPrice: 0,
  });
  const [saving, setSaving] = useState(false);
  const [savingBundle, setSavingBundle] = useState(false);

  useEffect(() => {
    void loadDiscounts();
    void loadBundles();
  }, []);

  const loadDiscounts = async () => {
    try {
      const response = await fetch('/api/discounts');
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      const data = await response.json();
      if (data.success) setDiscounts(data.discounts || []);
    } catch (err) {
      console.error('Failed to load discounts', err);
      setDiscounts([]);
    }
  };

  const loadBundles = async () => {
    try {
      const response = await fetch('/api/bundles');
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      const data = await response.json();
      if (data.success) setBundles(data.bundles || []);
    } catch (err) {
      console.error('Failed to load bundles', err);
      setBundles([]);
    }
  };

  const authHeaders = () => {
    const token = localStorage.getItem('grazel_admin_token');
    return { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) };
  };

  const toggleBundleProduct = (id: string) => {
    setBundleForm((prev) => ({
      ...prev,
      productIds: prev.productIds.includes(id)
        ? prev.productIds.filter((p) => p !== id)
        : [...prev.productIds, id],
    }));
  };

  const toggleDiscountBundle = (id: string) => {
    setForm((prev) => ({
      ...prev,
      bundleIds: prev.bundleIds.includes(id)
        ? prev.bundleIds.filter((b) => b !== id)
        : [...prev.bundleIds, id],
    }));
  };

  const createBundle = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bundleForm.name || bundleForm.productIds.length < 2 || !bundleForm.bundlePrice || !bundleForm.originalPrice) {
      toast.error('Name, at least 2 products, bundle price and original price are required');
      return;
    }

    setSavingBundle(true);
    try {
      const response = await fetch('/api/bundles', {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({
          name: bundleForm.name,
          description: bundleForm.description,
          bundleType: bundleForm.bundleType,
          productIds: bundleForm.productIds,
          bundlePrice: bundleForm.bundlePrice,
          originalPrice: bundleForm.originalPrice,
        }),
      });
      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.message || 'Unable to create bundle');
      }
      toast.success('Bundle created successfully');
      setBundleForm({ name: '', description: '', bundleType: 'pair_bundle', productIds: [], bundlePrice: 0, originalPrice: 0 });
      await loadBundles();
    } catch (err: any) {
      toast.error(err.message || 'Failed to create bundle');
    } finally {
      setSavingBundle(false);
    }
  };

  const deleteBundle = async (id: string) => {
    try {
      const response = await fetch(`/api/bundles/${id}`, { method: 'DELETE', headers: authHeaders() });
      if (!response.ok) throw new Error('Failed to delete bundle');
      setBundles((prev) => prev.filter((b) => b.id !== id));
      toast.success('Bundle deleted');
    } catch (err) {
      console.error('Failed to delete bundle', err);
      toast.error('Failed to delete bundle');
    }
  };

  const createDiscount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.code || !form.description || !form.startDate || !form.endDate) {
      toast.error('Please fill all required fields');
      return;
    }

    if (form.appliesTo === 'bundles' && form.bundleIds.length === 0) {
      toast.error('Please select at least one bundle');
      return;
    }

    setSaving(true);
    try {
      const response = await fetch('/api/admin/discounts/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: form.code,
          description: form.description,
          discountType: form.discountType,
          discountValue: form.discountValue,
          appliesto: form.appliesTo,
          bundleIds: form.bundleIds,
          startDate: form.startDate,
          endDate: form.endDate,
          maxUses: 1,
          totalMaxUses: 100,
          minOrderAmount: 0,
          isStackable: false,
        }),
      });

      if (!response.ok) throw new Error('Unable to create discount');
      toast.success('Discount created successfully');
      setForm({ code: '', description: '', discountType: 'percentage', discountValue: 10, appliesTo: 'all', startDate: '', endDate: '', bundleIds: [] });
      await loadDiscounts();
    } catch (err: any) {
      toast.error(err.message || 'Failed to create discount');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <form onSubmit={createBundle} className="space-y-4 border border-border bg-card p-6">
        <div className="flex items-center gap-2">
          <Package className="h-5 w-5 text-primary" />
          <h3 className="font-serif text-xl text-foreground">Create Bundle</h3>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <label className="space-y-2 text-sm">
            <span className="text-xs uppercase tracking-[0.15em] text-muted-foreground">Bundle Name</span>
            <input
              value={bundleForm.name}
              onChange={(e) => setBundleForm({ ...bundleForm, name: e.target.value })}
              className="w-full border border-border bg-background-cream px-3 py-2"
              placeholder="e.g. Shirt + Trouser Pair"
            />
          </label>
          <label className="space-y-2 text-sm">
            <span className="text-xs uppercase tracking-[0.15em] text-muted-foreground">Bundle Type</span>
            <select
              value={bundleForm.bundleType}
              onChange={(e) => setBundleForm({ ...bundleForm, bundleType: e.target.value as BundleForm['bundleType'] })}
              className="w-full border border-border bg-background-cream px-3 py-2"
            >
              <option value="pair_bundle">Pair Bundle (2 products)</option>
              <option value="combo_bundle">Combo Bundle</option>
              <option value="save_more">Buy More, Save More</option>
            </select>
          </label>
          <label className="space-y-2 text-sm md:col-span-2">
            <span className="text-xs uppercase tracking-[0.15em] text-muted-foreground">Description</span>
            <input
              value={bundleForm.description}
              onChange={(e) => setBundleForm({ ...bundleForm, description: e.target.value })}
              className="w-full border border-border bg-background-cream px-3 py-2"
              placeholder="Match essentials and save more when you style a duo."
            />
          </label>
          <label className="space-y-2 text-sm">
            <span className="text-xs uppercase tracking-[0.15em] text-muted-foreground">Bundle Price (₹)</span>
            <input
              type="number"
              value={bundleForm.bundlePrice}
              onChange={(e) => setBundleForm({ ...bundleForm, bundlePrice: Number(e.target.value) })}
              className="w-full border border-border bg-background-cream px-3 py-2"
            />
          </label>
          <label className="space-y-2 text-sm">
            <span className="text-xs uppercase tracking-[0.15em] text-muted-foreground">Original Price (₹)</span>
            <input
              type="number"
              value={bundleForm.originalPrice}
              onChange={(e) => setBundleForm({ ...bundleForm, originalPrice: Number(e.target.value) })}
              className="w-full border border-border bg-background-cream px-3 py-2"
            />
          </label>
        </div>

        <div className="space-y-2">
          <span className="text-xs uppercase tracking-[0.15em] text-muted-foreground">
            Select Products ({bundleForm.productIds.length} selected — pair bundles need exactly 2)
          </span>
          <div className="max-h-56 overflow-y-auto border border-border divide-y divide-border-light">
            {products.map((p) => (
              <label key={p.id} className="flex items-center gap-3 px-3 py-2 text-sm cursor-pointer hover:bg-background-cream/50">
                <input
                  type="checkbox"
                  checked={bundleForm.productIds.includes(p.id)}
                  onChange={() => toggleBundleProduct(p.id)}
                />
                <span className="text-foreground">{p.name}</span>
                <span className="ml-auto text-xs text-muted-foreground">₹{p.price}</span>
              </label>
            ))}
          </div>
        </div>

        <Button type="submit" disabled={savingBundle}>
          <Plus className="mr-2 h-4 w-4" /> {savingBundle ? 'Creating...' : 'Create Bundle'}
        </Button>
      </form>

      <div className="space-y-4">
        {bundles.length === 0 ? (
          <div className="border border-dashed border-border bg-card p-8 text-center text-sm text-muted-foreground">No bundles created yet.</div>
        ) : bundles.map((bundle) => (
          <div key={bundle.id} className="flex flex-col gap-3 border border-border bg-card p-4 md:flex-row md:items-center md:justify-between">
            <div>
              <div className="flex items-center gap-2">
                <span className="rounded-none border border-primary/20 bg-primary/10 px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.15em] text-primary">
                  {bundleTypeLabels[bundle.bundle_type as BundleForm['bundleType']] || bundle.bundle_type}
                </span>
                <span className="text-sm font-medium text-foreground">{bundle.name}</span>
              </div>
              <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                <span>₹{bundle.bundle_price} <span className="line-through">₹{bundle.original_price}</span></span>
                <span>{bundle.product_ids?.length || 0} products</span>
              </div>
            </div>
            <Button variant="outline" size="sm" onClick={() => deleteBundle(bundle.id)}>
              <Trash2 className="mr-2 h-4 w-4" /> Delete
            </Button>
          </div>
        ))}
      </div>

      <form onSubmit={createDiscount} className="space-y-4 border border-border bg-card p-6">
        <div className="flex items-center gap-2">
          <Tag className="h-5 w-5 text-primary" />
          <h3 className="font-serif text-xl text-foreground">Create Discount</h3>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <label className="space-y-2 text-sm">
            <span className="text-xs uppercase tracking-[0.15em] text-muted-foreground">Code</span>
            <input value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })} className="w-full border border-border bg-background-cream px-3 py-2" placeholder="SUMMER10" />
          </label>
          <label className="space-y-2 text-sm">
            <span className="text-xs uppercase tracking-[0.15em] text-muted-foreground">Discount Type</span>
            <select value={form.discountType} onChange={(e) => setForm({ ...form, discountType: e.target.value as any })} className="w-full border border-border bg-background-cream px-3 py-2">
              <option value="percentage">Percentage</option>
              <option value="fixed">Fixed Amount</option>
            </select>
          </label>
          <label className="space-y-2 text-sm">
            <span className="text-xs uppercase tracking-[0.15em] text-muted-foreground">Value</span>
            <input type="number" value={form.discountValue} onChange={(e) => setForm({ ...form, discountValue: Number(e.target.value) })} className="w-full border border-border bg-background-cream px-3 py-2" />
          </label>
          <label className="space-y-2 text-sm">
            <span className="text-xs uppercase tracking-[0.15em] text-muted-foreground">Applies To</span>
            <select value={form.appliesTo} onChange={(e) => setForm({ ...form, appliesTo: e.target.value as any })} className="w-full border border-border bg-background-cream px-3 py-2">
              <option value="all">All Products</option>
              <option value="products">Products</option>
              <option value="categories">Categories</option>
              <option value="bundles">Bundles</option>
            </select>
          </label>
          <label className="space-y-2 text-sm">
            <span className="text-xs uppercase tracking-[0.15em] text-muted-foreground">Start Date</span>
            <input type="date" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} className="w-full border border-border bg-background-cream px-3 py-2" />
          </label>
          <label className="space-y-2 text-sm">
            <span className="text-xs uppercase tracking-[0.15em] text-muted-foreground">End Date</span>
            <input type="date" value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })} className="w-full border border-border bg-background-cream px-3 py-2" />
          </label>
        </div>

        {form.appliesTo === 'bundles' && (
          <div className="space-y-2">
            <span className="text-xs uppercase tracking-[0.15em] text-muted-foreground">
              Select Bundles ({form.bundleIds.length} selected)
            </span>
            <div className="max-h-56 overflow-y-auto border border-border divide-y divide-border-light">
              {bundles.length === 0 ? (
                <div className="px-3 py-2 text-xs text-muted-foreground">No bundles available. Create bundles first.</div>
              ) : (
                bundles.map((bundle) => (
                  <label key={bundle.id} className="flex items-center gap-3 px-3 py-2 text-sm cursor-pointer hover:bg-background-cream/50">
                    <input
                      type="checkbox"
                      checked={form.bundleIds.includes(bundle.id)}
                      onChange={() => toggleDiscountBundle(bundle.id)}
                    />
                    <span className="text-foreground">{bundle.name}</span>
                    <span className="ml-auto text-xs text-muted-foreground">₹{bundle.bundle_price}</span>
                  </label>
                ))
              )}
            </div>
          </div>
        )}

        <Button type="submit" disabled={saving}>
          <Plus className="mr-2 h-4 w-4" /> {saving ? 'Creating...' : 'Create Discount'}
        </Button>
      </form>

      <div className="space-y-4">
        {discounts.length === 0 ? (
          <div className="border border-dashed border-border bg-card p-8 text-center text-sm text-muted-foreground">No discounts created yet.</div>
        ) : discounts.map((discount) => (
          <div key={discount.id} className="flex flex-col gap-3 border border-border bg-card p-4 md:flex-row md:items-center md:justify-between">
            <div>
              <div className="flex items-center gap-2">
                <span className="rounded-none border border-primary/20 bg-primary/10 px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.15em] text-primary">{discount.code}</span>
                <span className="text-sm text-muted-foreground">{discount.description}</span>
              </div>
              <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                <span className="flex items-center gap-1"><Tag className="h-3.5 w-3.5" /> {discount.discount_type === 'percentage' ? `${discount.discount_value}%` : `₹${discount.discount_value}`}</span>
                <span className="flex items-center gap-1"><CalendarDays className="h-3.5 w-3.5" /> {discount.start_date} → {discount.end_date}</span>
              </div>
            </div>
            <Button variant="outline" size="sm">
              <Trash2 className="mr-2 h-4 w-4" /> Delete
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}
