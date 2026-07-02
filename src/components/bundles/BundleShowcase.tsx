import { Link } from 'react-router-dom';
import { Sparkles, ArrowRight } from 'lucide-react';

const bundles = [
  {
    title: 'Pair Bundles',
    description: 'Match essentials and save more when you style a duo.',
    savings: 'Up to 20% off',
    href: '/collections',
  },
  {
    title: 'Combo Bundles',
    description: 'Build your look with coordinated staples and accessories.',
    savings: 'Flat ₹500 off',
    href: '/collections',
  },
  {
    title: 'Buy More, Save More',
    description: 'Add more pieces and unlock larger savings automatically.',
    savings: 'Extra savings on bundles',
    href: '/all',
  },
];

export function BundleShowcase() {
  return (
    <section className="border-t border-b border-border bg-card py-20 lg:py-24">
      <div className="container">
        <div className="mb-10 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="mb-3 flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              <span className="text-xs uppercase tracking-[0.25em] text-primary font-medium">Bundle Offers</span>
            </div>
            <h2 className="font-serif text-3xl lg:text-4xl text-foreground">Curated bundles that make every purchase feel better</h2>
          </div>
          <Link to="/all" className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.15em] text-foreground hover:text-primary transition-colors">
            View All Deals <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          {bundles.map((bundle) => (
            <div key={bundle.title} className="border border-border bg-background-cream p-6">
              <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">{bundle.savings}</p>
              <h3 className="mt-3 font-serif text-xl text-foreground">{bundle.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{bundle.description}</p>
              <Link to={bundle.href} className="mt-5 inline-flex items-center gap-2 text-sm font-medium text-primary">
                Shop bundle <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
