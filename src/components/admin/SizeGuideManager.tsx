import { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Save, X, Ruler } from 'lucide-react';
import { toast } from 'sonner';

interface SizeGuideRow {
  id: string;
  product_type: 'top' | 'bottom' | 'dress' | 'other';
  size_code: string;
  measurements: Record<string, string>;
  unit: 'cm' | 'inches';
  description?: string;
  is_active: boolean;
}

const productTypes: { value: SizeGuideRow['product_type']; label: string }[] = [
  { value: 'top', label: 'Top' },
  { value: 'bottom', label: 'Bottom' },
  { value: 'dress', label: 'Dress' },
  { value: 'other', label: 'Other' },
];

const defaultFields = ['chest', 'waist', 'hip', 'shoulder'];

const emptyForm = {
  productType: 'top' as SizeGuideRow['product_type'],
  sizeCode: '',
  unit: 'cm' as 'cm' | 'inches',
  measurementFields: defaultFields.map((f) => ({ key: f, value: '' })),
};

export function SizeGuideManager() {
  const [rows, setRows] = useState<SizeGuideRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [activeTypeFilter, setActiveTypeFilter] = useState<'all' | SizeGuideRow['product_type']>('all');

  useEffect(() => {
    fetchRows();
  }, []);

  const authHeaders = () => {
    const token = localStorage.getItem('grazel_admin_token');
    return { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) };
  };

  const fetchRows = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/size-guides/all', { headers: authHeaders() });
      if (!response.ok) throw new Error('Failed to load size guides');
      const data = await response.json();
      setRows(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Error fetching size guides:', err);
      toast.error('Failed to load size guides');
      setRows([]);
    } finally {
      setLoading(false);
    }
  };

  const openAddForm = () => {
    setEditingId(null);
    setForm(emptyForm);
    setIsFormOpen(true);
  };

  const openEditForm = (row: SizeGuideRow) => {
    setEditingId(row.id);
    setForm({
      productType: row.product_type,
      sizeCode: row.size_code,
      unit: row.unit,
      measurementFields: Object.entries(row.measurements || {}).map(([key, value]) => ({ key, value: String(value) })),
    });
    setIsFormOpen(true);
  };

  const updateField = (index: number, key: string, value: string) => {
    setForm((prev) => {
      const fields = [...prev.measurementFields];
      fields[index] = { key, value };
      return { ...prev, measurementFields: fields };
    });
  };

  const addField = () => {
    setForm((prev) => ({ ...prev, measurementFields: [...prev.measurementFields, { key: '', value: '' }] }));
  };

  const removeField = (index: number) => {
    setForm((prev) => ({ ...prev, measurementFields: prev.measurementFields.filter((_, i) => i !== index) }));
  };

  const handleSave = async () => {
    if (!form.sizeCode.trim()) {
      toast.error('Size code is required (e.g. S, M, L)');
      return;
    }
    const measurements: Record<string, string> = {};
    form.measurementFields.forEach(({ key, value }) => {
      if (key.trim()) measurements[key.trim().toLowerCase()] = value.trim();
    });
    if (Object.keys(measurements).length === 0) {
      toast.error('Add at least one measurement field');
      return;
    }

    const payload = {
      productType: form.productType,
      sizeCode: form.sizeCode.trim().toUpperCase(),
      unit: form.unit,
      measurements,
    };

    try {
      const url = editingId ? `/api/size-guides/${editingId}` : '/api/size-guides';
      const method = editingId ? 'PUT' : 'POST';
      const response = await fetch(url, { method, headers: authHeaders(), body: JSON.stringify(payload) });
      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.message || 'Failed to save size guide');
      }
      toast.success(editingId ? 'Size guide updated' : 'Size guide added');
      setIsFormOpen(false);
      fetchRows();
    } catch (err: any) {
      console.error('Error saving size guide:', err);
      toast.error(err.message || 'Failed to save size guide');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this size guide row? It will no longer show on the product page.')) return;
    try {
      const response = await fetch(`/api/size-guides/${id}`, { method: 'DELETE', headers: authHeaders() });
      if (!response.ok) throw new Error('Failed to delete');
      setRows((prev) => prev.filter((r) => r.id !== id));
      toast.success('Size guide row deleted');
    } catch (err) {
      console.error('Error deleting size guide:', err);
      toast.error('Failed to delete size guide row');
    }
  };

  const filteredRows = (Array.isArray(rows) ? rows : []).filter((r) =>
    activeTypeFilter === 'all' ? true : r.product_type === activeTypeFilter
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h2 className="text-lg font-serif text-foreground flex items-center gap-2">
            <Ruler className="h-5 w-5 text-primary" /> Size Guide
          </h2>
          <p className="text-xs text-muted-foreground mt-1">
            Only the sizes and measurements you add here will appear in the Size Guide on the product page.
          </p>
        </div>
        <button
          onClick={openAddForm}
          className="px-4 py-2 bg-primary text-primary-foreground text-xs uppercase tracking-wider hover:bg-primary/90 transition-colors flex items-center gap-2"
        >
          <Plus className="h-4 w-4" /> Add Size
        </button>
      </div>

      <div className="flex gap-2 flex-wrap">
        <button
          onClick={() => setActiveTypeFilter('all')}
          className={`px-3 py-1.5 text-xs uppercase tracking-wide border transition-colors ${
            activeTypeFilter === 'all' ? 'border-primary bg-primary/5 text-primary' : 'border-border text-muted-foreground hover:border-primary'
          }`}
        >
          All
        </button>
        {productTypes.map((pt) => (
          <button
            key={pt.value}
            onClick={() => setActiveTypeFilter(pt.value)}
            className={`px-3 py-1.5 text-xs uppercase tracking-wide border transition-colors ${
              activeTypeFilter === pt.value ? 'border-primary bg-primary/5 text-primary' : 'border-border text-muted-foreground hover:border-primary'
            }`}
          >
            {pt.label}
          </button>
        ))}
      </div>

      <div className="border border-border bg-card overflow-x-auto">
        {loading ? (
          <p className="text-xs text-muted-foreground text-center py-10">Loading size guides...</p>
        ) : filteredRows.length === 0 ? (
          <p className="text-xs text-muted-foreground text-center py-10">No size guide rows yet. Click "Add Size" to create one.</p>
        ) : (
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="border-b border-border bg-background-cream/50">
                <th className="px-4 py-3 text-left font-medium text-foreground">Type</th>
                <th className="px-4 py-3 text-left font-medium text-foreground">Size</th>
                <th className="px-4 py-3 text-left font-medium text-foreground">Unit</th>
                <th className="px-4 py-3 text-left font-medium text-foreground">Measurements</th>
                <th className="px-4 py-3 text-right font-medium text-foreground">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredRows.map((row) => (
                <tr key={row.id} className="border-b border-border-light hover:bg-background-cream/40">
                  <td className="px-4 py-3 capitalize text-xs text-muted-foreground">{row.product_type}</td>
                  <td className="px-4 py-3 font-medium">{row.size_code}</td>
                  <td className="px-4 py-3 text-xs uppercase text-muted-foreground">{row.unit}</td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">
                    {Object.entries(row.measurements || {}).map(([k, v]) => `${k}: ${v}`).join(' · ')}
                  </td>
                  <td className="px-4 py-3 text-right whitespace-nowrap">
                    <button onClick={() => openEditForm(row)} className="p-1.5 text-muted-foreground hover:text-primary transition-colors" title="Edit">
                      <Edit2 className="h-4 w-4" />
                    </button>
                    <button onClick={() => handleDelete(row.id)} className="p-1.5 text-muted-foreground hover:text-red-600 transition-colors" title="Delete">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {isFormOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-foreground/40">
          <div className="absolute inset-0" onClick={() => setIsFormOpen(false)} />
          <div className="relative w-full max-w-lg bg-card border border-border shadow-mega max-h-[90vh] overflow-y-auto rounded-none">
            <div className="flex items-center justify-between p-6 border-b border-border">
              <h3 className="text-lg font-serif text-foreground">{editingId ? 'Edit Size Guide Row' : 'Add Size Guide Row'}</h3>
              <button onClick={() => setIsFormOpen(false)} className="text-muted-foreground hover:text-foreground">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-6 space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs uppercase tracking-wider font-semibold block mb-2 text-muted-foreground">Product Type</label>
                  <select
                    value={form.productType}
                    onChange={(e) => setForm((prev) => ({ ...prev, productType: e.target.value as SizeGuideRow['product_type'] }))}
                    className="w-full px-3 py-2 border border-border bg-background-cream text-foreground text-sm rounded-none focus:outline-none focus:border-primary"
                  >
                    {productTypes.map((pt) => (
                      <option key={pt.value} value={pt.value}>{pt.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs uppercase tracking-wider font-semibold block mb-2 text-muted-foreground">Unit</label>
                  <select
                    value={form.unit}
                    onChange={(e) => setForm((prev) => ({ ...prev, unit: e.target.value as 'cm' | 'inches' }))}
                    className="w-full px-3 py-2 border border-border bg-background-cream text-foreground text-sm rounded-none focus:outline-none focus:border-primary"
                  >
                    <option value="cm">CM</option>
                    <option value="inches">Inches</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs uppercase tracking-wider font-semibold block mb-2 text-muted-foreground">Size Code (e.g. S, M, L, XL)</label>
                <input
                  type="text"
                  value={form.sizeCode}
                  onChange={(e) => setForm((prev) => ({ ...prev, sizeCode: e.target.value }))}
                  placeholder="e.g. M"
                  className="w-full px-3 py-2 border border-border bg-background-cream text-foreground placeholder-muted-foreground focus:outline-none focus:border-primary text-sm rounded-none"
                />
              </div>

              <div>
                <label className="text-xs uppercase tracking-wider font-semibold block mb-2 text-muted-foreground">Measurements</label>
                <div className="space-y-2">
                  {form.measurementFields.map((field, index) => (
                    <div key={index} className="flex gap-2">
                      <input
                        type="text"
                        value={field.key}
                        onChange={(e) => updateField(index, e.target.value, field.value)}
                        placeholder="Field (e.g. chest)"
                        className="flex-1 px-3 py-2 border border-border bg-background-cream text-foreground placeholder-muted-foreground focus:outline-none focus:border-primary text-sm rounded-none"
                      />
                      <input
                        type="text"
                        value={field.value}
                        onChange={(e) => updateField(index, field.key, e.target.value)}
                        placeholder="Value (e.g. 96-101)"
                        className="flex-1 px-3 py-2 border border-border bg-background-cream text-foreground placeholder-muted-foreground focus:outline-none focus:border-primary text-sm rounded-none"
                      />
                      <button
                        onClick={() => removeField(index)}
                        className="px-2 text-muted-foreground hover:text-red-600 transition-colors"
                        title="Remove field"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
                <button
                  onClick={addField}
                  className="mt-2 text-xs uppercase tracking-wider text-primary hover:text-primary/80 flex items-center gap-1"
                >
                  <Plus className="h-3.5 w-3.5" /> Add measurement field
                </button>
              </div>
            </div>

            <div className="flex justify-end gap-3 p-6 border-t border-border">
              <button
                onClick={() => setIsFormOpen(false)}
                className="px-5 py-2 text-xs uppercase tracking-wider border border-border text-muted-foreground hover:text-foreground transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                className="px-5 py-2 bg-primary text-primary-foreground text-xs uppercase tracking-wider hover:bg-primary/90 transition-colors flex items-center gap-2"
              >
                <Save className="h-4 w-4" /> {editingId ? 'Update' : 'Add'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
