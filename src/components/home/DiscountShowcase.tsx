import { Link } from 'react-router-dom';
import { Tag, ArrowRight, Flame, Snowflake, CloudRain, Sparkles } from 'lucide-react';
import { useProducts } from '@/context/ProductContext';

const promos = [
  { title: 'New Offers', icon: Flame, description: 'Fresh arrivals with limited-time value', href: '/new' },
  { title: 'Seasonal Offers', icon: Snowflake, description: 'Winter picks with premium savings', href: '/winter-collection' },
  { title: 'Flash Sales', icon: CloudRain, description: 'Hourly deals with rapid inventory refresh', href: '/all' },
  { title: 'Bundle Discounts', icon: Sparkles, description: 'Pair, combo and multi-save bundles', href: '/collections' },
];

export function DiscountShowcase() {
  const { products } = useProducts();
  const activeOffers = products.filter((product) => product.discount && product.discount > 0).slice(0, 4);

  return (
    <section className="border-b border-border bg-gradient-to-b from-primary/5 to-background-cream py-20 lg:py-24">
      <div className="container">
        <div className="mb-10 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="mb-3 flex items-center gap-2">
              <Tag className="h-5 w-5 text-primary" />
              <span className="text-xs uppercase tracking-[0.25em] text-primary font-medium">Promotions</span>
            </div>
            <h2 className="font-serif text-3xl lg:text-4xl text-foreground">Deals that move quickly</h2>
            <p className="mt-2 text-sm text-muted-foreground">Browse active promotions, seasonal drops and bundle savings in one place.</p>
          </div>
          <Link to="/all" className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.15em] text-foreground hover:text-primary transition-colors">
            Explore All Offers <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {promos.map((promo) => {
            const Icon = promo.icon;
            return (
              <Link key={promo.title} to={promo.href} className="border border-border bg-card p-6 transition-all hover:border-primary">
                <Icon className="mb-4 h-5 w-5 text-primary" />
                <h3 className="font-serif text-xl text-foreground">{promo.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{promo.description}</p>
              </Link>
            );
          })}
        </div>

        <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {activeOffers.map((product) => (
            <Link key={product.id} to={`/product/${product.id}`} className="border border-border bg-card p-4">
              <div className="flex items-center justify-between">
                <span className="text-xs uppercase tracking-[0.2em] text-primary">Active</span>
                <span className="rounded-none border border-primary/20 bg-primary/10 px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.15em] text-primary">{product.discount}% OFF</span>
              </div>
              <p className="mt-4 font-medium text-foreground">{product.name}</p>
              <p className="mt-1 text-sm text-muted-foreground">₹{product.price}</p>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
