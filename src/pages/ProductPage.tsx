import { useEffect, useMemo, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Heart, Minus, Plus, ChevronDown, ChevronRight, Ruler, Sparkles, Star } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { useCart } from '@/context/CartContext';
import { useProducts } from '@/context/ProductContext';
import { FeaturedProducts } from '@/components/home/FeaturedProducts';
import { FitIntelligence } from '@/components/product/FitIntelligence';
import { VirtualTryOn } from '@/components/product/VirtualTryOn';

type ProductReview = {
  id: string;
  productId: string;
  customerName: string;
  rating: number;
  title?: string;
  comment?: string;
  createdAt?: string;
};

export function ProductPage() {
  const { id } = useParams<{ id: string }>();
  const { addToCart, addToWishlist, removeFromWishlist, isInWishlist } = useCart();
  const { products } = useProducts();
  
  const product = products.find((p) => p.id === id);
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [expandedSections, setExpandedSections] = useState<string[]>(['description']);
  const [showSizeGuide, setShowSizeGuide] = useState(false);
  const [showFit, setShowFit] = useState(false);
  const [showTryOn, setShowTryOn] = useState(false);
  const [recommendedSize, setRecommendedSize] = useState<string | null>(null);
  const [reviews, setReviews] = useState<ProductReview[]>([]);

  useEffect(() => {
    if (!id) return;

    const loadReviews = async () => {
      try {
        const response = await fetch(`/api/reviews/product/${id}`);
        if (!response.ok) throw new Error('Failed to load reviews');
        const data = await response.json();
        setReviews(data);
      } catch {
        try {
          const stored = localStorage.getItem('grazel_reviews');
          const localReviews = stored ? JSON.parse(stored) : [];
          setReviews(localReviews.filter((review: ProductReview) => review.productId === id));
        } catch {
          setReviews([]);
        }
      }
    };

    loadReviews();
  }, [id]);

  const averageRating = useMemo(() => {
    if (reviews.length === 0) return 0;
    return reviews.reduce((total, review) => total + review.rating, 0) / reviews.length;
  }, [reviews]);

  if (!product) {
    return (
      <Layout>
        <div className="container py-20 text-center">
          <h1 className="font-serif text-2xl mb-4">Product not found</h1>
          <Link to="/" className="text-primary hover:underline">
            Return to homepage
          </Link>
        </div>
      </Layout>
    );
  }

  const inWishlist = isInWishlist(product.id);
  const relatedProducts = products
    .filter((p) => p.category === product.category && p.id !== product.id)
    .slice(0, 4);

  const toggleSection = (section: string) => {
    setExpandedSections((prev) =>
      prev.includes(section)
        ? prev.filter((s) => s !== section)
        : [...prev, section]
    );
  };

  const handleAddToCart = () => {
    if (!selectedSize) return;
    addToCart(product, selectedSize, quantity);
  };

  const handleWishlistClick = () => {
    if (inWishlist) {
      removeFromWishlist(product.id);
    } else {
      addToWishlist(product);
    }
  };

  const AccordionSection = ({
    id,
    title,
    children,
  }: {
    id: string;
    title: string;
    children: React.ReactNode;
  }) => (
    <div className="accordion-quiet">
      <button
        onClick={() => toggleSection(id)}
        className="w-full flex items-center justify-between text-sm font-medium text-foreground"
      >
        <span>{title}</span>
        <ChevronDown
          className={`h-4 w-4 transition-transform ${
            expandedSections.includes(id) ? 'rotate-180' : ''
          }`}
        />
      </button>
      <AnimatePresence>
        {expandedSections.includes(id) && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="pt-4 text-sm text-muted-foreground leading-relaxed">
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );

  return (
    <Layout>
      {/* Breadcrumb */}
      <nav className="container py-4 text-sm text-muted-foreground">
        <ol className="flex items-center gap-2">
          <li>
            <Link to="/" className="hover:text-foreground transition-colors">
              Home
            </Link>
          </li>
          <ChevronRight className="h-3 w-3" />
          <li>
            <Link
              to={`/${product.category}`}
              className="hover:text-foreground transition-colors capitalize"
            >
              {product.category}
            </Link>
          </li>
          <ChevronRight className="h-3 w-3" />
          <li className="text-foreground">{product.name}</li>
        </ol>
      </nav>

      {/* Product Section */}
      <section className="container pb-20">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-16">
          {/* Images */}
          <div className="space-y-4">
            <div className="aspect-[3/4] bg-secondary overflow-hidden">
              <img
                src={product.images[0]}
                alt={product.name}
                className="w-full h-full object-cover"
              />
            </div>
          </div>

          {/* Product Info */}
          <div className="lg:sticky lg:top-[120px] lg:self-start space-y-6">
            {/* Header */}
            <div>
              {product.isNew && (
                <span className="inline-block px-2 py-1 text-[10px] uppercase tracking-wider bg-foreground text-background mb-3">
                  New
                </span>
              )}
              <h1 className="font-serif text-3xl lg:text-4xl text-foreground">
                {product.name}
              </h1>
              <p className="mt-2 text-lg text-foreground">₹{product.price}</p>
              <p className="mt-1 text-sm text-muted-foreground">
                {product.fabric} · {product.fit} Fit
              </p>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <div className="flex items-center gap-1 text-primary">
                  {[1, 2, 3, 4, 5].map((value) => (
                    <Star
                      key={value}
                      className={`h-4 w-4 ${averageRating >= value - 0.25 ? 'fill-current' : ''}`}
                    />
                  ))}
                </div>
                <span className="text-sm text-muted-foreground">
                  {reviews.length > 0
                    ? `${averageRating.toFixed(1)} (${reviews.length} review${reviews.length > 1 ? 's' : ''})`
                  : 'No reviews yet'}
                </span>
              </div>
              {product.isPreOrder && (
                <div className="mt-4 border border-primary/20 bg-primary/5 px-4 py-3 text-sm text-primary">
                  <span className="font-medium uppercase tracking-[0.12em] text-xs">Pre-order</span>
                  <p className="mt-1 text-muted-foreground">
                    {product.preOrderMessage || 'Reserve this product now. It will be dispatched when it is ready.'}
                  </p>
                </div>
              )}
            </div>

            {/* Size Selection */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-medium text-foreground">
                  Select Size
                </span>
                <button
                  onClick={() => setShowSizeGuide(true)}
                  className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  <Ruler className="h-4 w-4" />
                  <span>Size Guide</span>
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {product.sizes.map((size) => (
                  <button
                    key={size}
                    onClick={() => setSelectedSize(size)}
                    className={`min-w-[48px] h-12 px-4 text-sm border transition-colors ${
                      selectedSize === size
                        ? 'border-primary text-primary bg-primary/5'
                        : 'border-border hover:border-primary'
                    }`}
                  >
                    {size}
                  </button>
                ))}
              </div>
              {!selectedSize && !recommendedSize && (
                <p className="mt-2 text-xs text-muted-foreground">
                  Please select a size
                </p>
              )}
              {recommendedSize && (
                <p className="mt-2 text-xs text-primary">
                  Fit Intelligence recommends size {recommendedSize}
                </p>
              )}

              {/* Fit Intelligence + Try-On row */}
              <div className="grid grid-cols-2 gap-3 mt-4">
                <button
                  onClick={() => setShowFit(true)}
                  className="flex items-center justify-center gap-2 py-3 border border-border hover:border-primary hover:text-primary text-xs uppercase tracking-[0.15em] transition-colors"
                >
                  <Ruler className="h-3.5 w-3.5" /> Find My Size
                </button>
                {/*<button
                  onClick={() => setShowTryOn(true)}
                  className="flex items-center justify-center gap-2 py-3 border border-border hover:border-primary hover:text-primary text-xs uppercase tracking-[0.15em] transition-colors"
                >
                  <Sparkles className="h-3.5 w-3.5" /> Virtual Try-On
                </button> */}
              </div>
            </div>

            {/* Quantity */}
            <div>
              <span className="text-sm font-medium text-foreground block mb-3">
                Quantity
              </span>
              <div className="flex items-center gap-4">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="w-10 h-10 flex items-center justify-center border border-border hover:border-primary transition-colors"
                >
                  <Minus className="h-4 w-4" />
                </button>
                <span className="w-8 text-center">{quantity}</span>
                <button
                  onClick={() => setQuantity(quantity + 1)}
                  className="w-10 h-10 flex items-center justify-center border border-border hover:border-primary transition-colors"
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Add to Cart */}
            <div className="flex gap-3">
              <Button
                variant="add"
                onClick={handleAddToCart}
                disabled={!selectedSize}
                className="flex-1"
              >
                {product.isPreOrder ? 'Pre-order' : 'Add to Bag'}
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={handleWishlistClick}
                className={inWishlist ? 'text-primary border-primary' : ''}
              >
                <Heart className={`h-5 w-5 ${inWishlist ? 'fill-current' : ''}`} />
              </Button>
            </div>

            {/* Accordions */}
            <div>
              <AccordionSection id="description" title="Description">
                {product.description || "No description available"}
              </AccordionSection>

              <AccordionSection id="composition" title="Composition & Fabric">
                <p>{product.composition || "Composition details will be added soon"}</p>
              </AccordionSection>

              <AccordionSection id="care" title="Care Instructions">
                <ul className="space-y-1">
                  {product.careInstructions?.map((instruction, index) => (
                    <li key={index}>• {instruction}</li>
                  ))}
                </ul>
              </AccordionSection>

              <AccordionSection id="delivery" title="Delivery & Returns">
                {product.deliveryReturns ? (
                  <>
                    {product.isPreOrder && (
                      <p className="mb-2 text-primary">
                        Pre-order: {product.preOrderMessage || 'dispatches when ready.'}
                      </p>
                    )}
                    <p>{product.deliveryReturns}</p>
                  </>
                ) : (
                  <>
                    {product.isPreOrder && (
                      <p className="mb-2 text-primary">
                        Pre-order: {product.preOrderMessage || 'dispatches when ready.'}
                      </p>
                    )}
                    <p className="mb-2">
                      Standard delivery: 3-5 business days (Free on orders over ₹200)
                    </p>
                    <p className="mb-2">Express delivery: 1-2 business days (₹15)</p>
                    <p>
                      Returns are accepted within 30 days of delivery. Items must be
                      unworn with tags attached.
                    </p>
                  </>
                )}
              </AccordionSection>

              <AccordionSection id="reviews" title={`Ratings & Reviews (${reviews.length})`}>
                {reviews.length > 0 ? (
                  <div className="space-y-5">
                    <div className="flex items-center gap-3 text-foreground">
                      <span className="font-serif text-3xl">{averageRating.toFixed(1)}</span>
                      <div>
                        <div className="flex items-center gap-1 text-primary">
                          {[1, 2, 3, 4, 5].map((value) => (
                            <Star
                              key={value}
                              className={`h-4 w-4 ${averageRating >= value - 0.25 ? 'fill-current' : ''}`}
                            />
                          ))}
                        </div>
                        <p className="mt-1 text-xs text-muted-foreground">
                          Based on {reviews.length} verified purchase review{reviews.length > 1 ? 's' : ''}
                        </p>
                      </div>
                    </div>

                    <div className="space-y-4">
                      {reviews.map((review) => (
                        <article key={review.id} className="border-t border-border-light pt-4">
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <div className="flex items-center gap-1 text-primary">
                              {[1, 2, 3, 4, 5].map((value) => (
                                <Star
                                  key={value}
                                  className={`h-3.5 w-3.5 ${review.rating >= value ? 'fill-current' : ''}`}
                                />
                              ))}
                            </div>
                            <span className="text-[11px] uppercase tracking-[0.12em] text-muted-foreground">
                              Verified purchase
                            </span>
                          </div>
                          {review.title && (
                            <h3 className="mt-2 text-sm font-medium text-foreground">{review.title}</h3>
                          )}
                          {review.comment && <p className="mt-2">{review.comment}</p>}
                          <p className="mt-2 text-xs text-muted-foreground">
                            {review.customerName}
                            {review.createdAt ? ` · ${new Date(review.createdAt).toLocaleDateString()}` : ''}
                          </p>
                        </article>
                      ))}
                    </div>
                  </div>
                ) : (
                  <p>Ratings and reviews will appear here after customers purchase and review this product.</p>
                )}
              </AccordionSection>
            </div>
          </div>
        </div>
      </section>

      {/* Related Products */}
      {relatedProducts.length > 0 && (
        <FeaturedProducts
          title="You May Also Like"
          products={relatedProducts}
          viewAllHref={`/${product.category}`}
        />
      )}

      {/* Size Guide Modal */}
      <AnimatePresence>
        {showSizeGuide && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-foreground/40 z-50"
              onClick={() => setShowSizeGuide(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-lg bg-card p-8 z-50 shadow-mega"
            >
              <h2 className="font-serif text-xl mb-6">Size Guide</h2>
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="py-2 text-left font-medium">Size</th>
                    <th className="py-2 text-left font-medium">Chest (cm)</th>
                    <th className="py-2 text-left font-medium">Waist (cm)</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    { size: 'XS', chest: '86-91', waist: '71-76' },
                    { size: 'S', chest: '91-96', waist: '76-81' },
                    { size: 'M', chest: '96-101', waist: '81-86' },
                    { size: 'L', chest: '101-106', waist: '86-91' },
                    { size: 'XL', chest: '106-111', waist: '91-96' },
                  ].map((row) => (
                    <tr key={row.size} className="border-b border-border-light">
                      <td className="py-3">{row.size}</td>
                      <td className="py-3">{row.chest}</td>
                      <td className="py-3">{row.waist}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <Button
                variant="outline"
                className="mt-6 w-full"
                onClick={() => setShowSizeGuide(false)}
              >
                Close
              </Button>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <FitIntelligence
        isOpen={showFit}
        onClose={() => setShowFit(false)}
        sizes={product.sizes}
        tailoredFitMeasurements={product.tailoredFitMeasurements}
        onRecommend={(s) => { setRecommendedSize(s); setSelectedSize(s); }}
      />
      <VirtualTryOn
        isOpen={showTryOn}
        onClose={() => setShowTryOn(false)}
        productImage={product.images[0]}
        productName={product.name}
      />
    </Layout>
  );
}
