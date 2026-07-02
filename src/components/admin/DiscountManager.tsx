import { useEffect, useState } from 'react';
import { Plus, Trash2, CalendarDays, Tag } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

interface DiscountForm {
  code: string;
  description: string;
  discountType: 'percentage' | 'fixed';
  discountValue: number;
  appliesTo: 'products' | 'categories' | 'bundles' | 'all';
  startDate: string;
  endDate: string;
}

export function DiscountManager() {
  const [discounts, setDiscounts] = useState<any[]>([]);
  const [form, setForm] = useState<DiscountForm>({
    code: '',
    description: '',
    discountType: 'percentage',
    discountValue: 10,
    appliesTo: 'all',
    startDate: '',
    endDate: '',
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    void loadDiscounts();
  }, []);

  const loadDiscounts = async () => {
    try {
      const response = await fetch('/api/discounts');
      const data = await response.json();
      if (data.success) setDiscounts(data.discounts || []);
    } catch (err) {
      console.error('Failed to load discounts', err);
    }
  };

  const createDiscount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.code || !form.description || !form.startDate || !form.endDate) {
      toast.error('Please fill all required fields');
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
      setForm({ code: '', description: '', discountType: 'percentage', discountValue: 10, appliesTo: 'all', startDate: '', endDate: '' });
      await loadDiscounts();
    } catch (err: any) {
      toast.error(err.message || 'Failed to create discount');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
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
