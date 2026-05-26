import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { Product } from '@/types/product';
import { ProductGrid } from '@/components/product/ProductGrid';

interface FeaturedProductsProps {
  title: string;
  subtitle?: string;
  products: Product[];
  viewAllHref?: string;
  columns?: 2 | 3 | 4;
  background?: 'cream' | 'white';
}

export function FeaturedProducts({
  title,
  subtitle,
  products,
  viewAllHref,
  columns = 4,
  background = 'cream',
}: FeaturedProductsProps) {
  const bgClass = background === 'cream' ? 'bg-background-cream' : 'bg-card';

  return (
    <section className={`py-20 lg:py-28 ${bgClass}`}>
      <div className="container">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-12">
          <div>
            <h2 className="font-serif text-3xl lg:text-4xl text-foreground">
              {title}
            </h2>
            {subtitle && (
              <p className="mt-2 text-sm text-muted-foreground">{subtitle}</p>
            )}
          </div>
          {viewAllHref && (
            <Link
              to={viewAllHref}
              className="flex items-center gap-2 text-xs uppercase tracking-[0.15em] text-foreground hover:text-primary transition-colors group"
            >
              <span>View All</span>
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Link>
          )}
        </div>

        {/* Products */}
        <ProductGrid products={products} columns={columns} />
      </div>
    </section>
  );
}
