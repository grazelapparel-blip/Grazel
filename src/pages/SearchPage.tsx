import { useState, useMemo, useEffect, useRef } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Search as SearchIcon, X, TrendingUp, Clock, ArrowUpRight } from 'lucide-react';
import { Layout } from '@/components/layout/Layout';
import { PageTransition } from '@/components/layout/PageTransition';
import { ProductCard } from '@/components/product/ProductCard';
import { Checkbox } from '@/components/ui/checkbox';
import { useProducts } from '@/context/ProductContext';

const popular = ['Cashmere sweater', 'Wool blazer', 'Silk dress', 'Linen trousers', 'Cotton shirt', 'Camel overcoat'];

export function SearchPage() {
  const { products } = useProducts();
  const [params, setParams] = useSearchParams();
  const initial = params.get('q') ?? '';
  const [query, setQuery] = useState(initial);
  const [submitted, setSubmitted] = useState(initial);
  const [recent, setRecent] = useState<string[]>([]);
  const [gender, setGender] = useState<string[]>([]);
  const [fabric, setFabric] = useState<string[]>([]);
  const [sort, setSort] = useState('relevance');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
    try {
      const stored = JSON.parse(localStorage.getItem('grazel:recent') ?? '[]');
      if (Array.isArray(stored)) setRecent(stored.slice(0, 6));
    } catch { /* ignore */ }
  }, []);

  const allFabrics = useMemo(() => Array.from(new Set(products.map((p) => p.fabric))), []);

  const suggestions = useMemo(() => {
    if (query.length < 1) return [];
    const q = query.toLowerCase();
    return products
      .filter((p) =>
        p.name.toLowerCase().includes(q) ||
        p.fabric.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q) ||
        p.subcategory.toLowerCase().includes(q)
      )
      .slice(0, 5);
  }, [query]);

  const results = useMemo(() => {
    let r = [...products];
    if (submitted) {
      const q = submitted.toLowerCase();
      r = r.filter((p) =>
        p.name.toLowerCase().includes(q) ||
        p.fabric.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q) ||
        p.subcategory.toLowerCase().includes(q)
      );
    }
    if (gender.length) r = r.filter((p) => gender.includes(p.category));
    if (fabric.length) r = r.filter((p) => fabric.includes(p.fabric));
    if (sort === 'price-asc') r.sort((a, b) => a.price - b.price);
    if (sort === 'price-desc') r.sort((a, b) => b.price - a.price);
    return r;
  }, [submitted, gender, fabric, sort]);

  const submit = (term: string) => {
    const t = term.trim();
    if (!t) return;
    setQuery(t);
    setSubmitted(t);
    setParams({ q: t });
    const next = [t, ...recent.filter((r) => r !== t)].slice(0, 6);
    setRecent(next);
    localStorage.setItem('grazel:recent', JSON.stringify(next));
  };

  const toggle = (arr: string[], val: string, set: (v: string[]) => void) =>
    set(arr.includes(val) ? arr.filter((x) => x !== val) : [...arr, val]);

  return (
    <Layout>
      <PageTransition>
        {/* Hero search */}
        <section className="bg-background-cream pt-14 pb-10 border-b border-border-light">
          <div className="container max-w-3xl">
            <p className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground mb-3">Search</p>
            <h1 className="font-serif text-4xl lg:text-5xl mb-8">What are you looking for?</h1>
            <form
              onSubmit={(e) => { e.preventDefault(); submit(query); }}
              className="relative"
            >
              <SearchIcon className="absolute left-0 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <input
                ref={inputRef}
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search for products, fabrics, collections…"
                className="w-full bg-transparent border-b-2 border-foreground py-4 pl-10 pr-12 text-lg font-light placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors"
              />
              {query && (
                <button
                  type="button"
                  onClick={() => { setQuery(''); setSubmitted(''); setParams({}); }}
                  className="absolute right-0 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  aria-label="Clear"
                >
                  <X className="h-5 w-5" />
                </button>
              )}

              {/* Predictive dropdown */}
              <AnimatePresence>
                {query.length > 0 && suggestions.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.18 }}
                    className="absolute left-0 right-0 top-full mt-2 bg-card border border-border shadow-mega z-20"
                  >
                    <p className="px-5 pt-4 pb-2 text-[10px] uppercase tracking-[0.15em] text-muted-foreground">
                      Suggestions
                    </p>
                    <ul>
                      {suggestions.map((s) => (
                        <li key={s.id}>
                          <Link
                            to={`/product/${s.id}`}
                            className="flex items-center gap-4 px-5 py-3 hover:bg-background-cream transition-colors group"
                          >
                            <div className="w-10 h-12 bg-secondary flex-shrink-0 overflow-hidden">
                              <img src={s.images[0]} alt="" className="w-full h-full object-cover" />
                            </div>
                            <div className="flex-1">
                              <p className="text-sm group-hover:text-primary transition-colors">{s.name}</p>
                              <p className="text-xs text-muted-foreground">{s.fabric} · ₹{s.price}</p>
                            </div>
                            <ArrowUpRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </motion.div>
                )}
              </AnimatePresence>
            </form>
          </div>
        </section>

        {/* Empty state with popular/recent */}
        {!submitted && (
          <section className="py-14">
            <div className="container grid grid-cols-1 lg:grid-cols-2 gap-12 max-w-3xl">
              <div>
                <div className="flex items-center gap-2 text-muted-foreground mb-5">
                  <TrendingUp className="h-4 w-4" />
                  <span className="text-[10px] uppercase tracking-[0.2em]">Popular Searches</span>
                </div>
                <ul className="space-y-3">
                  {popular.map((t) => (
                    <li key={t}>
                      <button
                        onClick={() => submit(t)}
                        className="text-sm hover:text-primary transition-colors"
                      >
                        {t}
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <div className="flex items-center gap-2 text-muted-foreground mb-5">
                  <Clock className="h-4 w-4" />
                  <span className="text-[10px] uppercase tracking-[0.2em]">Recent Searches</span>
                </div>
                {recent.length > 0 ? (
                  <ul className="space-y-3">
                    {recent.map((t) => (
                      <li key={t}>
                        <button onClick={() => submit(t)} className="text-sm hover:text-primary transition-colors">
                          {t}
                        </button>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-muted-foreground">No recent searches yet.</p>
                )}
              </div>
            </div>
          </section>
        )}

        {/* Results */}
        {submitted && (
          <section className="py-10 lg:py-14">
            <div className="container grid grid-cols-1 lg:grid-cols-[240px_1fr] gap-10">
              <aside className="space-y-8">
                <div>
                  <p className="text-[10px] uppercase tracking-[0.15em] text-muted-foreground mb-2">Results for</p>
                  <p className="font-serif text-xl">"{submitted}"</p>
                  <p className="text-xs text-muted-foreground mt-1">{results.length} items</p>
                </div>

                <FilterBlock title="Category">
                  {Object.keys(categories).map((c) => (
                    <FilterCheck key={c} label={c.charAt(0).toUpperCase() + c.slice(1)} checked={gender.includes(c)} onChange={() => toggle(gender, c, setGender)} />
                  ))}
                </FilterBlock>

                <FilterBlock title="Fabric">
                  {allFabrics.map((f) => (
                    <FilterCheck key={f} label={f} checked={fabric.includes(f)} onChange={() => toggle(fabric, f, setFabric)} />
                  ))}
                </FilterBlock>
              </aside>

              <div>
                <div className="flex items-center justify-between mb-8">
                  <div className="flex gap-2 flex-wrap">
                    {gender.map((g) => (
                      <Chip key={g} label={g} onRemove={() => toggle(gender, g, setGender)} />
                    ))}
                    {fabric.map((f) => (
                      <Chip key={f} label={f} onRemove={() => toggle(fabric, f, setFabric)} />
                    ))}
                  </div>
                  <select
                    value={sort}
                    onChange={(e) => setSort(e.target.value)}
                    className="bg-card border border-border px-4 py-2 text-xs uppercase tracking-[0.1em] focus:outline-none focus:border-primary"
                  >
                    <option value="relevance">Relevance</option>
                    <option value="price-asc">Price: Low to High</option>
                    <option value="price-desc">Price: High to Low</option>
                  </select>
                </div>

                {results.length > 0 ? (
                  <div className="grid grid-cols-2 lg:grid-cols-3 gap-6">
                    {results.map((p, i) => (
                      <motion.div
                        key={p.id}
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.4, delay: i * 0.04 }}
                      >
                        <ProductCard product={p} />
                      </motion.div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-20 border border-dashed border-border">
                    <p className="font-serif text-2xl mb-2">No matches</p>
                    <p className="text-sm text-muted-foreground">Try a broader search term or remove filters.</p>
                  </div>
                )}
              </div>
            </div>
          </section>
        )}
      </PageTransition>
    </Layout>
  );
}

function FilterBlock({ title, children }: { title: string; children: React.ReactNode }) {
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
      <span className={`text-sm transition-colors ${checked ? 'text-primary' : 'group-hover:text-primary'}`}>{label}</span>
    </label>
  );
}

function Chip({ label, onRemove }: { label: string; onRemove: () => void }) {
  return (
    <span className="inline-flex items-center gap-2 px-3 py-1.5 text-xs border border-primary text-primary">
      {label}
      <button onClick={onRemove}><X className="h-3 w-3" /></button>
    </span>
  );
}
