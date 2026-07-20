import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

interface Bundle {
  id: string;
  name: string;
  description?: string;
  bundle_price: number;
  original_price: number;
  discount_percentage?: number;
}

export function BundleShowcase() {
  const [bundles, setBundles] = useState<Bundle[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadBundles = async () => {
      try {
        const response = await fetch('/api/bundles');
        const data = await response.json();
        setBundles(data.success ? data.bundles || [] : []);
      } catch (err) {
        console.error('Failed to load bundles', err);
        setBundles([]);
      } finally {
        setLoading(false);
      }
    };
    loadBundles();
  }, []);

  if (!loading && bundles.length === 0) return null;

  return (
    <section className="border-t border-b border-border bg-card py-20 lg:py-24">
      <div className="container">
        <div className="mb-10 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <span className="text-xs uppercase tracking-[0.25em] text-primary font-medium">Bundle Offers</span>
            <h2 className="font-serif text-3xl lg:text-4xl text-foreground">Curated bundles that make every purchase feel better</h2>
          </div>
          <Link to="/all" className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.15em] text-foreground hover:text-primary transition-colors">
            View All Deals
          </Link>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          {bundles.map((bundle) => (
            <div key={bundle.id} className="border border-border bg-background-cream p-6">
              <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
                {bundle.discount_percentage ? `${bundle.discount_percentage}% off` : 'Bundle offer'}
              </p>
              <h3 className="mt-3 font-serif text-xl text-foreground">{bundle.name}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{bundle.description}</p>
              <div className="mt-3 flex items-center gap-2 text-sm">
                <span className="font-medium text-foreground">₹{bundle.bundle_price}</span>
                <span className="text-muted-foreground line-through">₹{bundle.original_price}</span>
              </div>
              <Link to="/collections" className="mt-5 inline-flex items-center gap-2 text-sm font-medium text-primary">
                Shop bundle
              </Link>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
