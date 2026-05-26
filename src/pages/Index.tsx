import { Layout } from '@/components/layout/Layout';
import { HeroSection } from '@/components/home/HeroSection';
import { CategoryGrid } from '@/components/home/CategoryGrid';
import { FeaturedProducts } from '@/components/home/FeaturedProducts';
import { EditorialBanner } from '@/components/home/EditorialBanner';
import { useProducts } from '@/context/ProductContext';
import heroImage from '@/assets/hero-main.jpg';
import categoryMen from '@/assets/category-men.jpg';
import categoryWomen from '@/assets/category-women.jpg';
import categoryEssentials from '@/assets/category-essentials.jpg';
import editorialWool from '@/assets/editorial-wool.jpg';

const Index = () => {
  const { products } = useProducts();
  const newArrivals = products.filter((p) => p.isNew).slice(0, 4);
  const bestsellers = products.filter((p) => p.isBestSeller).slice(0, 4);

  const categories = [
    { title: 'Men', image: categoryMen, href: '/men' },
    { title: 'Women', image: categoryWomen, href: '/women' },
    { title: 'Essentials', image: categoryEssentials, href: '/essentials' },
  ];

  return (
    <Layout>
      {/* Hero Section */}
      <HeroSection
        title="The Art of Timeless Elegance"
        subtitle="Discover our Spring/Summer collection — crafted from the world's finest materials"
        image={heroImage}
        cta={{ label: 'Shop Women', href: '/women' }}
        secondaryCta={{ label: 'Shop Men', href: '/men' }}
        height="large"
      />

      {/* Category Grid */}
      <CategoryGrid categories={categories} />

      {/* New Arrivals - on cream background */}
      <FeaturedProducts
        title="New Arrivals"
        subtitle="The latest additions to our collection"
        products={newArrivals}
        viewAllHref="/new"
        background="cream"
      />

      {/* Editorial Banner - on white background */}
      <EditorialBanner
        title="The Wool Edit"
        subtitle="Material Focus"
        description="Explore our curated selection of premium wool pieces. Each garment is crafted from the finest virgin wool, offering unparalleled softness and enduring quality."
        image={editorialWool}
        cta={{ label: 'Discover the Collection', href: '/collections/wool' }}
        layout="left"
      />

      {/* Bestsellers */}
      <FeaturedProducts
        title="Bestsellers"
        subtitle="Our most loved pieces"
        products={bestsellers}
        viewAllHref="/bestsellers"
        background="cream"
      />

      {/* Brand Philosophy - Cream background */}
      <section className="py-20 lg:py-28 bg-background-cream border-t border-border">
        <div className="container">
          <div className="max-w-2xl mx-auto text-center">
            <p className="text-xs uppercase tracking-[0.25em] text-primary mb-6">Our Philosophy</p>
            <h2 className="font-serif text-3xl lg:text-4xl text-foreground leading-relaxed">
              Craftsmanship meets timeless design
            </h2>
            <p className="mt-6 text-muted-foreground leading-relaxed">
              Every Grazel piece is thoughtfully constructed using traditional techniques and the finest natural materials. We believe in creating garments that transcend seasons and become enduring elements of a refined wardrobe.
            </p>
          </div>
        </div>
      </section>

      {/* Service Strip */}
      <section className="py-16 bg-card border-t border-b border-border">
        <div className="container">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-10 text-center">
            <div>
              <h3 className="font-serif text-lg text-foreground mb-2">
                Complimentary Shipping
              </h3>
              <p className="text-xs text-muted-foreground uppercase tracking-wide">
                On all orders over ₹200
              </p>
            </div>
            <div>
              <h3 className="font-serif text-lg text-foreground mb-2">
                Easy Returns
              </h3>
              <p className="text-xs text-muted-foreground uppercase tracking-wide">
                30-day return policy
              </p>
            </div>
            <div>
              <h3 className="font-serif text-lg text-foreground mb-2">
                Personal Styling
              </h3>
              <p className="text-xs text-muted-foreground uppercase tracking-wide">
                Book a consultation
              </p>
            </div>
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default Index;
