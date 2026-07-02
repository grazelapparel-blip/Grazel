import { useMemo } from 'react';
import { useLocation, Link } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { ProductCard } from '@/components/product/ProductCard';
import { useProducts } from '@/context/ProductContext';

const seasonalCollections: Record<string, { title: string; description: string; season: string }> = {
  'summer-collection': {
    title: 'Summer Collection',
    description: 'Light, breathable fabrics perfect for warm days. Linen shirts, cotton dresses, and airy silhouettes.',
    season: 'summer',
  },
  'winter-collection': {
    title: 'Winter Collection',
    description: 'Warm, luxurious layers for the colder months. Cashmere knits, wool overcoats, and refined outerwear.',
    season: 'winter',
  },
  'monsoon-collection': {
    title: 'Monsoon Collection',
    description: 'Weather-ready essentials for rainy days. Water-resistant outerwear and easy-care fabrics.',
    season: 'monsoon',
  },
  'autumn-collection': {
    title: 'Autumn Collection',
    description: 'Transitional pieces for the season of change. Rich textures in warm earth tones.',
    season: 'autumn',
  },
  'diwali-collection': {
    title: 'Diwali Collection',
    description: 'Celebrate the festival of lights in style. Curated pieces for festive occasions.',
    season: 'diwali',
  },
  'eid-collection': {
    title: 'Eid Collection',
    description: 'Elegant ensembles for Eid celebrations. Traditional craftsmanship meets modern design.',
    season: 'eid',
  },
};

export function CategoriesPage() {
  const { products } = useProducts();
  const location = useLocation();
  // Extract route segment from URL path using React Router location
  const path = location.pathname.replace(/^\//, '');
  const collection = seasonalCollections[path];

  const filteredProducts = useMemo(() => {
    if (!collection) return [];
    // Filter by season-related keywords in fabric name and category
    return products.filter((p) => {
      const fabric = p.fabric?.toLowerCase() || '';
      const name = p.name?.toLowerCase() || '';
      const category = p.category?.toLowerCase() || '';
      const subcategory = p.subcategory?.toLowerCase() || '';
      const season = collection.season.toLowerCase();

      // Summer: light fabrics
      if (season === 'summer') {
        return (
          fabric.includes('linen') ||
          fabric.includes('cotton') ||
          fabric.includes('silk') ||
          name.includes('summer') ||
          name.includes('linen') ||
          name.includes('cotton')
        );
      }
      // Winter: warm fabrics
      if (season === 'winter') {
        return (
          fabric.includes('wool') ||
          fabric.includes('cashmere') ||
          fabric.includes('tweed') ||
          name.includes('wool') ||
          name.includes('winter') ||
          name.includes('overcoat') ||
          name.includes('cashmere')
        );
      }
      // Monsoon: easy care
      if (season === 'monsoon') {
        return (
          fabric.includes('cotton') ||
          name.includes('rain') ||
          name.includes('water') ||
          name.includes('monsoon')
        );
      }
      // Autumn: transitional
      if (season === 'autumn') {
        return (
          name.includes('jacket') ||
          name.includes('knit') ||
          fabric.includes('wool') ||
          fabric.includes('cotton')
        );
      }
      // Diwali/Eid: festive
      if (season === 'diwali' || season === 'eid') {
        return (
          name.includes('silk') ||
          fabric.includes('silk') ||
          name.includes('festive') ||
          name.includes('diwali') ||
          name.includes('eid') ||
          category === 'women' ||
          subcategory.includes('dress') ||
          subcategory.includes('ethnic')
        );
      }
      return true;
    });
  }, [products, collection]);

  if (!collection) {
    return (
      <Layout>
        <div className="container py-20 text-center">
          <h1 className="font-serif text-3xl text-foreground">Collection not found</h1>
          <Link to="/collections" className="text-primary underline mt-4 inline-block">
            View all collections
          </Link>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      {/* Header */}
      <section className="bg-background-cream py-16 border-b border-border">
        <div className="container text-center">
          <h1 className="font-serif text-4xl lg:text-5xl text-foreground mb-4">
            {collection.title}
          </h1>
          <p className="text-muted-foreground max-w-xl mx-auto text-sm">
            {collection.description}
          </p>
          <p className="text-xs text-muted-foreground mt-6 uppercase tracking-[0.2em]">
            {filteredProducts.length} items
          </p>
        </div>
      </section>

      {/* Products */}
      <section className="py-14 bg-background-cream">
        <div className="container">
          {filteredProducts.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {filteredProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          ) : (
            <div className="text-center py-20">
              <p className="font-serif text-2xl text-muted-foreground mb-4">
                Coming Soon
              </p>
              <p className="text-sm text-muted-foreground">
                Our {collection.title.toLowerCase()} is being curated. Check back soon.
              </p>
              <Link
                to="/all"
                className="inline-block mt-6 text-xs uppercase tracking-[0.2em] text-primary border-b border-primary pb-1"
              >
                Browse all products
              </Link>
            </div>
          )}
        </div>
      </section>
    </Layout>
  );
}
