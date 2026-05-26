import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Layout } from '@/components/layout/Layout';
import { PageTransition, Reveal } from '@/components/layout/PageTransition';
import { Button } from '@/components/ui/button';
import { useProducts } from '@/context/ProductContext';
import { ProductCard } from '@/components/product/ProductCard';

const seasons = ['All Seasons', 'Summer', 'Winter', 'Spring', 'Autumn'] as const;

export function CollectionsPage() {
  const { products } = useProducts();
  const [index, setIndex] = useState(0);
  const [season, setSeason] = useState<(typeof seasons)[number]>('All Seasons');

  const collections = [
    {
      eyebrow: 'Discover',
      title: "Men's Collection",
      description:
        'From tailored blazers to premium cashmere, explore our curated collection of menswear designed with timeless elegance and modern sophistication.',
      href: '/men',
      filter: (p: typeof products[number]) => p.category === 'men',
    },
    {
      eyebrow: 'Discover',
      title: "Women's Collection",
      description:
        'Elegant sophistication meets contemporary design. Our womenswear collection celebrates individuality with carefully selected pieces for every occasion.',
      href: '/women',
      filter: (p: typeof products[number]) => p.category === 'women',
    },
    {
      eyebrow: 'Discover',
      title: 'Essentials',
      description:
        'Foundational pieces, finished with intention. Accessories, leather goods and refined extras crafted to anchor the wardrobe.',
      href: '/essentials',
      filter: (p: typeof products[number]) => p.category === 'essentials',
    },
  ];

  const current = collections[index];
  const items = products.filter(current.filter).slice(0, 2);

  const next = () => setIndex((i) => (i + 1) % collections.length);
  const prev = () => setIndex((i) => (i - 1 + collections.length) % collections.length);

  return (
    <Layout>
      <PageTransition>
        {/* Header */}
        <section className="py-14 bg-background-cream border-b border-border-light">
          <div className="container flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6">
            <div>
              <h1 className="font-serif text-4xl lg:text-5xl">Collections</h1>
              <p className="mt-3 text-sm text-muted-foreground">Explore our curated collections</p>
            </div>
            <div className="flex items-center gap-4 flex-wrap">
              <span className="text-[10px] tracking-[0.15em] uppercase text-muted-foreground">
                Filter by season:
              </span>
              <div className="flex gap-2 flex-wrap">
                {seasons.map((s) => (
                  <button
                    key={s}
                    onClick={() => setSeason(s)}
                    className={`px-4 py-2 text-xs uppercase tracking-[0.1em] border transition-colors ${
                      season === s
                        ? 'bg-primary text-primary-foreground border-primary'
                        : 'border-border text-foreground hover:border-primary hover:text-primary'
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Carousel */}
        <section className="relative py-14 lg:py-20 bg-background-cream overflow-hidden">
          <div className="container">
            <div className="grid grid-cols-1 lg:grid-cols-[1fr_2fr] gap-10 lg:gap-16 items-start">
              {/* Editorial side */}
              <AnimatePresence mode="wait">
                <motion.div
                  key={current.title}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                  className="lg:sticky lg:top-32 space-y-6"
                >
                  <span className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
                    {current.eyebrow}
                  </span>
                  <h2 className="font-serif text-4xl lg:text-5xl leading-tight">
                    {current.title}
                  </h2>
                  <p className="text-sm text-muted-foreground leading-relaxed max-w-md">
                    {current.description}
                  </p>
                  <Link
                    to={current.href}
                    className="inline-block text-xs uppercase tracking-[0.2em] border-b border-primary text-primary pb-1 hover:text-primary-hover transition-colors"
                  >
                    Explore Now
                  </Link>
                  <p className="text-[10px] uppercase tracking-[0.15em] text-muted-foreground pt-8">
                    {items.length} Products Available
                  </p>
                </motion.div>
              </AnimatePresence>

              {/* Products */}
              <div className="relative">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={current.title + '-grid'}
                    initial={{ opacity: 0, x: 30 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                    className="grid grid-cols-1 sm:grid-cols-2 gap-6"
                  >
                    {items.length > 0 ? (
                      items.map((p) => <ProductCard key={p.id} product={p} />)
                    ) : (
                      <p className="text-muted-foreground">No products in this collection yet.</p>
                    )}
                  </motion.div>
                </AnimatePresence>

                {/* Arrows */}
                <button
                  onClick={prev}
                  aria-label="Previous"
                  className="hidden lg:flex absolute -left-16 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-card border border-border items-center justify-center hover:border-primary hover:text-primary transition-colors shadow-sm"
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>
                <button
                  onClick={next}
                  aria-label="Next"
                  className="hidden lg:flex absolute -right-16 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-card border border-border items-center justify-center hover:border-primary hover:text-primary transition-colors shadow-sm"
                >
                  <ChevronRight className="h-5 w-5" />
                </button>

                {/* Dots */}
                <div className="flex justify-center gap-2 mt-10">
                  {collections.map((_, i) => (
                    <button
                      key={i}
                      onClick={() => setIndex(i)}
                      aria-label={`Go to slide ${i + 1}`}
                      className={`h-0.5 transition-all duration-300 ${
                        i === index ? 'w-10 bg-primary' : 'w-6 bg-border'
                      }`}
                    />
                  ))}
                </div>

                {/* Mobile arrows */}
                <div className="flex lg:hidden justify-center gap-4 mt-6">
                  <Button variant="outline" size="sm" onClick={prev}>
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" size="sm" onClick={next}>
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Browse all */}
        <Reveal>
          <section className="py-14 lg:py-20 border-t border-border-light">
            <div className="container">
              <div className="mb-10">
                <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground mb-3">
                  Browse
                </p>
                <h2 className="font-serif text-3xl lg:text-4xl">All Products</h2>
                <p className="mt-3 text-sm text-muted-foreground max-w-xl">
                  Explore our complete collection of premium apparel, from tailored menswear to
                  elegant womenswear.
                </p>
              </div>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                {products.slice(0, 8).map((p) => (
                  <ProductCard key={p.id} product={p} />
                ))}
              </div>
              <div className="text-center mt-12">
                <Link to="/all">
                  <Button variant="outline" className="border-primary text-primary hover:bg-primary hover:text-primary-foreground">
                    View All Products
                  </Button>
                </Link>
              </div>
            </div>
          </section>
        </Reveal>
      </PageTransition>
    </Layout>
  );
}
