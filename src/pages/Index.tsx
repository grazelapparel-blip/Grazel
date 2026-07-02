import { Layout } from '@/components/layout/Layout';
import { HeroSection } from '@/components/home/HeroSection';
import { CategoryGrid } from '@/components/home/CategoryGrid';
import { FeaturedProducts } from '@/components/home/FeaturedProducts';
import { EditorialBanner } from '@/components/home/EditorialBanner';
import { ExploreMoreSection } from '@/components/community/ExploreMoreSection';
import { DiscountShowcase } from '@/components/home/DiscountShowcase';
import { BundleShowcase } from '@/components/bundles/BundleShowcase';
import { useProducts } from '@/context/ProductContext';
import heroImage from '@/assets/hero-main.jpg';
import categoryMen from '@/assets/category-men.jpg';
import categoryWomen from '@/assets/category-women.jpg';
import categoryEssentials from '@/assets/category-essentials.jpg';
import editorialWool from '@/assets/editorial-wool.jpg';
import { Link } from 'react-router-dom';
import { ArrowRight, Tag, Sparkles, Package, Gift, ShieldCheck, Truck } from 'lucide-react';

const seasonalCollections = [
  { name: 'Summer Collection', href: '/summer-collection', color: 'bg-amber-50 border-amber-200 text-amber-800', emoji: '☀️' },
  { name: 'Winter Collection', href: '/winter-collection', color: 'bg-blue-50 border-blue-200 text-blue-800', emoji: '❄️' },
  { name: 'Monsoon Collection', href: '/monsoon-collection', color: 'bg-gray-100 border-gray-300 text-gray-700', emoji: '🌧️' },
  { name: 'Autumn Collection', href: '/autumn-collection', color: 'bg-orange-50 border-orange-200 text-orange-800', emoji: '🍂' },
  { name: 'Diwali Collection', href: '/diwali-collection', color: 'bg-yellow-50 border-yellow-200 text-yellow-800', emoji: '🪔' },
  { name: 'Eid Collection', href: '/eid-collection', color: 'bg-green-50 border-green-200 text-green-800', emoji: '🌙' },
];

const Index = () => {
  const { products } = useProducts();
  const newArrivals = products.filter((p) => p.isNew).slice(0, 4);
  const bestsellers = products.filter((p) => p.isBestSeller).slice(0, 4);
  const discountedProducts = products.filter((p) => p.discount && p.discount > 0).slice(0, 4);
  const preOrderProducts = products.filter((p) => p.isPreOrder).slice(0, 4);

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
        subtitle="Discover our collections — crafted from the world's finest materials"
        image={heroImage}
        cta={{ label: 'Shop Women', href: '/women' }}
        secondaryCta={{ label: 'Shop Men', href: '/men' }}
        height="large"
      />

      {/* Seasonal Collections Strip */}
      <section className="py-8 bg-card border-b border-border">
        <div className="container">
          <div className="flex items-center gap-4 overflow-x-auto pb-2 scrollbar-none">
            <span className="text-xs uppercase tracking-[0.15em] text-muted-foreground font-medium whitespace-nowrap">
              Seasonal Collections
            </span>
            <div className="flex gap-2 flex-nowrap">
              {seasonalCollections.map((col) => (
                <Link
                  key={col.name}
                  to={col.href}
                  className={`flex items-center gap-2 px-4 py-2 border ${col.color} whitespace-nowrap hover:opacity-80 transition-opacity text-xs font-medium rounded-sm`}
                >
                  <span>{col.emoji}</span>
                  <span>{col.name}</span>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>

      <DiscountShowcase />

      <BundleShowcase />

      {/* Discounts & Offers Section */}
      {discountedProducts.length > 0 && (
        <section className="py-20 lg:py-24 bg-gradient-to-b from-primary/5 to-background-cream border-b border-border">
          <div className="container">
            <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-10">
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Tag className="h-5 w-5 text-primary" />
                  <span className="text-xs uppercase tracking-[0.25em] text-primary font-medium">Hot Offers</span>
                </div>
                <h2 className="font-serif text-3xl lg:text-4xl text-foreground">
                  Special Deals & Offers
                </h2>
                <p className="mt-2 text-sm text-muted-foreground">
                  Limited-time discounts on premium pieces. Don't miss out.
                </p>
              </div>
              <Link
                to="/all"
                className="flex items-center gap-2 text-xs uppercase tracking-[0.15em] text-foreground hover:text-primary transition-colors group whitespace-nowrap"
              >
                <span>View All Offers</span>
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Link>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {discountedProducts.map((product) => (
                <Link key={product.id} to={`/product/${product.id}`} className="group bg-card border border-border hover:border-primary/30 transition-all">
                  <div className="aspect-[3/4] bg-secondary overflow-hidden relative">
                    <img src={product.images[0]} alt={product.name} className="w-full h-full object-cover" />
                    {product.discount && (
                      <div className="absolute top-2 left-2 bg-red-600 text-white text-[10px] font-bold px-2 py-1 uppercase tracking-[0.1em]">
                        {product.discount}% OFF
                      </div>
                    )}
                  </div>
                  <div className="p-3">
                    <p className="text-xs text-muted-foreground truncate">{product.name}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-sm font-semibold text-foreground">₹{product.price}</span>
                      {product.originalPrice && (
                        <span className="text-xs text-muted-foreground line-through">₹{product.originalPrice}</span>
                      )}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Category Grid */}
      <CategoryGrid categories={categories} />

      {/* New Arrivals */}
      <FeaturedProducts
        title="New Arrivals"
        subtitle="The latest additions to our collection"
        products={newArrivals}
        viewAllHref="/new"
        background="cream"
      />

      {/* Editorial Banner */}
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

      {/* Pre-Order Section */}
      {preOrderProducts.length > 0 && (
        <section className="py-20 lg:py-24 bg-card border-t border-b border-border">
          <div className="container">
            <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-10">
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Sparkles className="h-5 w-5 text-primary" />
                  <span className="text-xs uppercase tracking-[0.25em] text-primary font-medium">Coming Soon</span>
                </div>
                <h2 className="font-serif text-3xl lg:text-4xl text-foreground">
                  Pre-Order Now
                </h2>
                <p className="mt-2 text-sm text-muted-foreground">
                  Reserve upcoming pieces before they arrive.
                </p>
              </div>
              <Link
                to="/all"
                className="flex items-center gap-2 text-xs uppercase tracking-[0.15em] text-foreground hover:text-primary transition-colors group"
              >
                <span>View All Pre-Orders</span>
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Link>
            </div>
            <FeaturedProducts title="Pre-Order Now" products={preOrderProducts} columns={4} background="white" />
          </div>
        </section>
      )}

      {/* Brand Philosophy */}
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

      {/* Service Strip - Updated with ₹1500 threshold */}
      <section className="py-16 bg-card border-t border-b border-border">
        <div className="container">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 text-center">
            <div>
              <Truck className="h-6 w-6 mx-auto mb-3 text-primary" />
              <h3 className="font-serif text-lg text-foreground mb-2">
                Free Shipping
              </h3>
              <p className="text-xs text-muted-foreground uppercase tracking-wide">
                On orders over ₹1,500
              </p>
            </div>
            <div>
              <ShieldCheck className="h-6 w-6 mx-auto mb-3 text-primary" />
              <h3 className="font-serif text-lg text-foreground mb-2">
                Easy Returns
              </h3>
              <p className="text-xs text-muted-foreground uppercase tracking-wide">
                7-day return policy
              </p>
            </div>
            <div>
              <Gift className="h-6 w-6 mx-auto mb-3 text-primary" />
              <h3 className="font-serif text-lg text-foreground mb-2">
                Premium Packaging
              </h3>
              <p className="text-xs text-muted-foreground uppercase tracking-wide">
                Gift-ready delivery
              </p>
            </div>
            <div>
              <Package className="h-6 w-6 mx-auto mb-3 text-primary" />
              <h3 className="font-serif text-lg text-foreground mb-2">
                Order Tracking
              </h3>
              <p className="text-xs text-muted-foreground uppercase tracking-wide">
                Real-time updates
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Explore More From Community */}
      <ExploreMoreSection />
    </Layout>
  );
};

export default Index;
