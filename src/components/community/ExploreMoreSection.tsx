import { Link } from 'react-router-dom';
import { ArrowRight, Building2 } from 'lucide-react';

interface PartnerBrand {
  name: string;
  description: string;
  logo: string;
  href: string;
}

const partnerBrands: PartnerBrand[] = [
  {
    name: 'Leenex',
    description: 'Premium cotton essentials for modern living',
    logo: '/placeholder.svg',
    href: '/collections',
  },
  {
    name: 'Studio House',
    description: 'Elevated staples for everyday dressing',
    logo: '/placeholder.svg',
    href: '/summer-collection',
  },
  {
    name: 'Terra Atelier',
    description: 'Sustainable silhouettes in earthy tones',
    logo: '/placeholder.svg',
    href: '/winter-collection',
  },
  {
    name: 'Nuo Studio',
    description: 'Minimalist designs with modern craftsmanship',
    logo: '/placeholder.svg',
    href: '/all',
  },
];

export function ExploreMoreSection() {
  return (
    <section className="py-20 lg:py-28 bg-card border-t border-border">
      <div className="container">
        {/* Header */}
        <div className="text-center mb-14">
          <p className="text-xs uppercase tracking-[0.25em] text-muted-foreground mb-4">Discover</p>
          <h2 className="font-serif text-3xl lg:text-4xl text-foreground">
            Explore More From Our Community
          </h2>
          <p className="mt-3 text-sm text-muted-foreground max-w-xl mx-auto">
            Discover partner brands and curated collections from our extended community of artisans and designers.
          </p>
        </div>

        {/* Brand Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {partnerBrands.map((brand) => (
            <Link
              key={brand.name}
              to={brand.href}
              className="group bg-background-cream border border-border hover:border-primary/40 transition-all p-8 text-center"
            >
              <div className="w-16 h-16 mx-auto mb-5 bg-secondary rounded-full flex items-center justify-center">
                <Building2 className="h-7 w-7 text-primary" />
              </div>
              <h3 className="font-serif text-xl text-foreground mb-2 group-hover:text-primary transition-colors">
                {brand.name}
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {brand.description}
              </p>
              <span className="inline-flex items-center gap-1 text-xs uppercase tracking-[0.15em] text-primary mt-4 group-hover:gap-2 transition-all">
                Explore <ArrowRight className="h-3 w-3" />
              </span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
