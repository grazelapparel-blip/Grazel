import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { Layout } from '@/components/layout/Layout';
import { PageTransition } from '@/components/layout/PageTransition';
import { ProductCard } from '@/components/product/ProductCard';
import { Checkbox } from '@/components/ui/checkbox';
import { useProducts } from '@/context/ProductContext';

const festivals = [
  'All Festivals', 'Diwali', 'Holi', 'Eid', 'Christmas', 'New Year',
  'Pongal', 'Onam', 'Durga Puja', 'Wedding', 'Party',
] as const;

const sortOptions = [
  { value: 'new', label: 'New Arrivals' },
  { value: 'price-asc', label: 'Price: Low to High' },
  { value: 'price-desc', label: 'Price: High to Low' },
  { value: 'bestsellers', label: 'Best Sellers' },
];

const genders = ['Men', 'Women', 'Unisex'];

export function AllProductsPage() {
  const { products } = useProducts();
  const allSubcats = Array.from(new Set(
    products.map((p) => p.subcategory).filter(Boolean)
  ));
  const allFabrics = Array.from(new Set(
    products.map((p) => p.fabric).filter(Boolean)
  ));
  const [festival, setFestival] = useState<(typeof festivals)[number]>('All Festivals');
  const [sort, setSort] = useState('new');
  const [gender, setGender] = useState<string[]>([]);
  const [subcat, setSubcat] = useState<string[]>([]);
  const [fabric, setFabric] = useState<string[]>([]);
  const [newOnly, setNewOnly] = useState(true);
  const [preOrderOnly, setPreOrderOnly] = useState(false);

  const toggle = (arr: string[], val: string, set: (v: string[]) => void) => {
    set(arr.includes(val) ? arr.filter((x) => x !== val) : [...arr, val]);
  };

  const clearAll = () => {
    setGender([]); setSubcat([]); setFabric([]); setNewOnly(false); setPreOrderOnly(false); setFestival('All Festivals');
  };

  const filtered = useMemo(() => {
    let r = [...products];
    if (gender.length) r = r.filter((p) => gender.map((g) => g.toLowerCase()).includes(p.category));
    if (subcat.length) r = r.filter((p) => subcat.map((s) => s.toLowerCase()).includes(p.subcategory.toLowerCase()));
    if (fabric.length) r = r.filter((p) => fabric.includes(p.fabric));
    if (newOnly) r = r.filter((p) => p.isNew);
    if (preOrderOnly) r = r.filter((p) => p.isPreOrder);
    switch (sort) {
      case 'price-asc': r.sort((a, b) => a.price - b.price); break;
      case 'price-desc': r.sort((a, b) => b.price - a.price); break;
      case 'bestsellers': r.sort((a, b) => (b.isBestSeller ? 1 : 0) - (a.isBestSeller ? 1 : 0)); break;
      default: r.sort((a, b) => (b.isNew ? 1 : 0) - (a.isNew ? 1 : 0));
    }
    return r;
  }, [products, gender, subcat, fabric, newOnly, preOrderOnly, sort, festival]);

  const activeCount = gender.length + subcat.length + fabric.length + (newOnly ? 1 : 0) + (preOrderOnly ? 1 : 0);

  return (
    <Layout>
      <PageTransition>
        <section className="bg-background-cream py-14 lg:py-20">
          <div className="container">
            <h1 className="font-serif text-4xl lg:text-5xl">All Products</h1>
            <p className="mt-3 text-sm text-muted-foreground">
              {filtered.length} of {products.length} items
            </p>

            {/* Festival tabs */}
            <div className="mt-10 flex flex-wrap gap-2">
              {festivals.map((f) => (
                <button
                  key={f}
                  onClick={() => setFestival(f)}
                  className={`px-4 py-2 text-xs uppercase tracking-[0.1em] border transition-colors ${
                    festival === f
                      ? 'border-foreground text-foreground bg-card'
                      : 'border-border text-muted-foreground hover:border-primary hover:text-primary bg-card'
                  }`}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>
        </section>

        <section className="py-10 lg:py-14">
          <div className="container grid grid-cols-1 lg:grid-cols-[260px_1fr] gap-10">
            {/* Sidebar */}
            <aside className="space-y-8">
              {activeCount > 0 && (
                <button
                  onClick={clearAll}
                  className="text-xs text-primary uppercase tracking-[0.15em] hover:text-primary-hover"
                >
                  Clear all filters
                </button>
              )}

              <FilterGroup title="Gender">
                {genders.map((g) => (
                  <FilterCheck key={g} label={g} checked={gender.includes(g)} onChange={() => toggle(gender, g, setGender)} />
                ))}
              </FilterGroup>

              <FilterGroup title="Availability">
                <FilterCheck label="New In" checked={newOnly} onChange={() => setNewOnly(!newOnly)} />
                <FilterCheck label="Pre-order" checked={preOrderOnly} onChange={() => setPreOrderOnly(!preOrderOnly)} />
              </FilterGroup>

              <FilterGroup title="Category">
                {allSubcats.slice(0, 6).map((s) => (
                  <FilterCheck key={s} label={s} checked={subcat.includes(s)} onChange={() => toggle(subcat, s, setSubcat)} />
                ))}
              </FilterGroup>

              <FilterGroup title="Fabric">
                {allFabrics.map((f) => (
                  <FilterCheck key={f} label={f} checked={fabric.includes(f)} onChange={() => toggle(fabric, f, setFabric)} />
                ))}
              </FilterGroup>
            </aside>

            {/* Results */}
            <div>
              <div className="flex items-center justify-between gap-4 mb-8 flex-wrap">
                <div className="flex gap-2 flex-wrap">
                  {newOnly && (
                    <Chip label="New In" onRemove={() => setNewOnly(false)} />
                  )}
                  {preOrderOnly && (
                    <Chip label="Pre-order" onRemove={() => setPreOrderOnly(false)} />
                  )}
                  {gender.map((g) => <Chip key={g} label={g} onRemove={() => toggle(gender, g, setGender)} />)}
                  {subcat.map((s) => <Chip key={s} label={s} onRemove={() => toggle(subcat, s, setSubcat)} />)}
                  {fabric.map((f) => <Chip key={f} label={f} onRemove={() => toggle(fabric, f, setFabric)} />)}
                </div>
                <select
                  value={sort}
                  onChange={(e) => setSort(e.target.value)}
                  className="bg-card border border-border px-4 py-2 text-xs uppercase tracking-[0.1em] focus:outline-none focus:border-primary"
                >
                  {sortOptions.map((o) => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
              </div>

              <AnimatePresence mode="wait">
                {filtered.length > 0 ? (
                  <motion.div
                    key="grid"
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.4 }}
                    className="grid grid-cols-2 lg:grid-cols-3 gap-6"
                  >
                    {filtered.map((p, i) => (
                      <motion.div
                        key={p.id}
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.4, delay: i * 0.04 }}
                      >
                        <ProductCard product={p} />
                      </motion.div>
                    ))}
                  </motion.div>
                ) : (
                  <motion.div
                    key="empty"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="text-center py-24"
                  >
                    <p className="font-serif text-2xl mb-3">No products found</p>
                    <p className="text-sm text-muted-foreground mb-6">Try adjusting your filters</p>
                    <button onClick={clearAll} className="text-xs uppercase tracking-[0.2em] text-primary border-b border-primary pb-1">
                      Clear all filters
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </section>
      </PageTransition>
    </Layout>
  );
}

function FilterGroup({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="border-t border-border-light pt-6">
      <h3 className="font-serif text-lg mb-4">{title}</h3>
      <div className="space-y-3">{children}</div>
    </div>
  );
}

function FilterCheck({ label, checked, onChange }: { label: string; checked: boolean; onChange: () => void }) {
  return (
    <label className="flex items-center gap-3 cursor-pointer group">
      <Checkbox checked={checked} onCheckedChange={onChange} />
      <span className={`text-sm transition-colors ${checked ? 'text-primary' : 'text-foreground group-hover:text-primary'}`}>
        {label}
      </span>
    </label>
  );
}

function Chip({ label, onRemove }: { label: string; onRemove: () => void }) {
  return (
    <span className="inline-flex items-center gap-2 px-3 py-1.5 text-xs border border-primary text-primary">
      {label}
      <button onClick={onRemove} aria-label={`Remove ${label}`}>
        <X className="h-3 w-3" />
      </button>
    </span>
  );
}
