import { Link } from 'react-router-dom';

interface Category {
  title: string;
  image: string;
  href: string;
}

interface CategoryGridProps {
  categories: Category[];
}

export function CategoryGrid({ categories }: CategoryGridProps) {
  return (
    <section className="py-20 lg:py-28 bg-background-cream">
      <div className="container">
        {/* Header */}
        <div className="text-center mb-14">
          <p className="text-xs uppercase tracking-[0.25em] text-muted-foreground mb-4">Discover</p>
          <h2 className="font-serif text-3xl lg:text-4xl text-foreground">
            Shop by Category
          </h2>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
          {categories.map((category) => (
            <Link key={category.title} to={category.href} className="block group">
              <div className="relative aspect-[4/5] overflow-hidden bg-card">
                <img
                  src={category.image}
                  alt={category.title}
                  className="w-full h-full object-cover transition-transform duration-500 ease-out group-hover:scale-[1.02]"
                />
                {/* Subtle overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-foreground/50 via-foreground/10 to-transparent" />
                
                {/* Content */}
                <div className="absolute inset-0 flex flex-col items-center justify-end pb-10">
                  <h3 className="font-serif text-2xl text-white tracking-wide mb-2">
                    {category.title}
                  </h3>
                  <span className="text-xs uppercase tracking-[0.2em] text-white/70">
                    Explore
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
