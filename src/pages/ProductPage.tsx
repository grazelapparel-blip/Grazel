import { useEffect, useMemo, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Heart, Minus, Plus, ChevronDown, ChevronRight, Ruler, Sparkles, Star, ShieldCheck, X } from 'lucide-react';
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

interface SizeGuideRow {
  id: string;
  size_code: string;
  measurements: Record<string, string>;
  unit: 'cm' | 'inches';
}

function convertToInches(cm: string): string {
  const parts = cm.split('-');
  if (parts.length === 2) {
    const min = Math.round(parseInt(parts[0]) / 2.54);
    const max = Math.round(parseInt(parts[1]) / 2.54);
    return `${min}-${max}`;
  }
  return cm;
}

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
  const [sizeUnit, setSizeUnit] = useState<'cm' | 'inches'>('cm');
  const [reviews, setReviews] = useState<ProductReview[]>([]);
  const [sizeGuideRows, setSizeGuideRows] = useState<SizeGuideRow[]>([]);
  const [loadingSizeGuide, setLoadingSizeGuide] = useState(false);

  // Scroll to top on every product navigation
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, [id]);

  useEffect(() => {
    if (!id) return;

    const loadReviews = async () => {
      try {
        const response = await fetch(`/api/reviews?productId=${id}`);
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

  useEffect(() => {
    if (!product) return;

    const loadSizeGuide = async () => {
      const productType = product.fitType && product.fitType !== 'none' ? product.fitType : 'other';
      setLoadingSizeGuide(true);
      try {
        const response = await fetch(`/api/size-guides?productType=${productType}&unit=cm`);
        if (!response.ok) throw new Error('Failed to load size guide');
        const data = await response.json();
        setSizeGuideRows(data);
      } catch (err) {
        console.error('Error loading size guide:', err);
        setSizeGuideRows([]);
      } finally {
        setLoadingSizeGuide(false);
      }
    };

    loadSizeGuide();
  }, [product?.id, product?.fitType]);

  const averageRating = useMemo(() => {
    if (reviews.length === 0) return 0;
    return reviews.reduce((total, review) => total + review.rating, 0) / reviews.length;
  }, [reviews]);

  // Rating distribution
  const ratingDistribution = useMemo(() => {
    const dist = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    reviews.forEach((r) => {
      const key = Math.round(r.rating) as keyof typeof dist;
      if (key >= 1 && key <= 5) dist[key]++;
    });
    return dist;
  }, [reviews]);

  // Check return eligibility (simulated - product is returnable if not customized)
  const isCustomized = product?.fitType && product.fitType !== 'none';
  const returnWindowDays = product?.returnWindowDays || 7;

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
        className="w-full flex items-center justify-between text-sm font-medium text-foreground py-4"
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
            <div className="pb-4 text-sm text-muted-foreground leading-relaxed">
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
                src={product.images[0] || '/placeholder.svg'}
                alt={product.name}
                className="w-full h-full object-cover"
              />
            </div>
            {product.images.length > 1 && (
              <div className="grid grid-cols-4 gap-2">
                {product.images.slice(1, 5).map((img, idx) => (
                  <div key={idx} className="aspect-[3/4] bg-secondary overflow-hidden">
                    <img src={img} alt="" className="w-full h-full object-cover" />
                  </div>
                ))}
              </div>
            )}
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
              <div className="flex items-center gap-3 mt-3">
                <span className="text-lg text-foreground font-medium">₹{product.price}</span>
                {product.originalPrice && product.originalPrice > product.price && (
                  <>
                    <span className="text-sm text-muted-foreground line-through">
                      ₹{product.originalPrice}
                    </span>
                    <span className="text-xs text-green-700 bg-green-50 border border-green-200 px-2 py-0.5">
                      {Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)}% OFF
                    </span>
                  </>
                )}
              </div>
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
                  className="flex items-center gap-1 text-sm font-medium text-primary hover:text-primary/80 transition-colors"
                >
                  <Ruler className="h-4 w-4" />
                  <span>View Size Guide</span>
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
                <p className="mt-2 text-xs text-primary font-medium">
                  Curate My Fit recommends size {recommendedSize}
                </p>
              )}

              {/* Curate My Fit + Try-On row */}
              <div className="mt-4 rounded-none border border-primary/20 bg-primary/5 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs uppercase tracking-[0.2em] text-primary font-semibold">Curate My Fit</p>
                    <p className="mt-1 text-sm text-muted-foreground">Get a tailored size recommendation using your preferred measurements.</p>
                  </div>
                  <button
                    onClick={() => setShowFit(true)}
                    className="inline-flex flex-shrink-0 items-center justify-center gap-2 rounded-none border border-primary bg-primary px-4 py-2.5 text-xs font-semibold uppercase tracking-[0.15em] text-primary-foreground transition-colors hover:bg-primary/90"
                  >
                    Curate My Fit
                  </button>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3 mt-4">
                {false && (
                  <button
                    onClick={() => setShowTryOn(true)}
                    className="flex items-center justify-center gap-2 py-3.5 border border-border hover:border-primary hover:text-primary text-xs uppercase tracking-[0.15em] transition-colors"
                  >
                    <Sparkles className="h-3.5 w-3.5" /> Virtual Try-On
                  </button>
                )}
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

            {/* Return Policy Banner — Luxury Brand Color Gradient */}
            <div className={`border p-4 text-sm transition-all shadow-sm ${
              isCustomized
                ? 'border-amber-500/30 bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-amber-600/10'
                : 'border-primary/20 bg-gradient-to-r from-primary/10 via-primary/5 to-amber-900/10'
            }`}>
              <div className="flex items-start gap-3">
                <ShieldCheck className={`h-5 w-5 flex-shrink-0 mt-0.5 ${isCustomized ? 'text-amber-700' : 'text-primary'}`} />
                <div>
                  <p className={`font-serif font-semibold text-sm tracking-wide ${isCustomized ? 'text-amber-900' : 'text-primary'}`}>
                    {isCustomized ? 'Customized Product — No Returns' : '7-Day Return Available'}
                  </p>
                  <p className={`text-xs mt-1 leading-relaxed ${isCustomized ? 'text-amber-800/80' : 'text-foreground/80'}`}>
                    {isCustomized
                      ? 'This product is made to your specifications and cannot be returned or exchanged.'
                      : 'You can return this product within 7 days of delivery. Items must be unworn with original tags attached.'}
                  </p>
                </div>
              </div>
            </div>

            {/* Accordions */}
            <div className="divide-y divide-border">
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
                      Standard delivery: 3-5 business days
                    </p>
                    <p className="mb-2">Express delivery: 1-2 business days</p>
                    <p>
                      {isCustomized
                        ? 'Customized products cannot be returned.'
                        : `Returns are accepted within ${returnWindowDays} days of delivery. Items must be unworn with tags attached.`
                      }
                    </p>
                  </>
                )}
              </AccordionSection>

              <AccordionSection id="reviews" title={`Ratings & Reviews (${reviews.length})`}>
                {reviews.length > 0 ? (
                  <div className="space-y-6">
                    {/* Rating Summary */}
                    <div className="flex items-start gap-6">
                      <div className="text-center">
                        <span className="font-serif text-4xl text-foreground">{averageRating.toFixed(1)}</span>
                        <div className="flex items-center gap-0.5 mt-1 text-primary justify-center">
                          {[1, 2, 3, 4, 5].map((value) => (
                            <Star
                              key={value}
                              className={`h-3.5 w-3.5 ${averageRating >= value - 0.25 ? 'fill-current' : ''}`}
                            />
                          ))}
                        </div>
                        <p className="mt-1 text-xs text-muted-foreground">
                          {reviews.length} review{reviews.length > 1 ? 's' : ''}
                        </p>
                      </div>
                      {/* Rating Breakdown */}
                      <div className="flex-1 space-y-1.5">
                        {([5, 4, 3, 2, 1] as const).map((star) => {
                          const count = ratingDistribution[star];
                          const total = reviews.length;
                          const pct = total > 0 ? (count / total) * 100 : 0;
                          return (
                            <div key={star} className="flex items-center gap-2 text-xs">
                              <span className="w-4 text-muted-foreground">{star}</span>
                              <Star className="h-3 w-3 text-primary fill-current" />
                              <div className="flex-1 h-2 bg-secondary rounded-full overflow-hidden">
                                <div
                                  className="h-full bg-primary rounded-full transition-all duration-500"
                                  style={{ width: `${pct}%` }}
                                />
                              </div>
                              <span className="w-8 text-right text-muted-foreground">{count}</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Review List */}
                    <div className="space-y-5">
                      {reviews.map((review) => (
                        <article key={review.id} className="border-t border-border-light pt-5">
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <div className="flex items-center gap-1 text-primary">
                              {[1, 2, 3, 4, 5].map((value) => (
                                <Star
                                  key={value}
                                  className={`h-3.5 w-3.5 ${review.rating >= value ? 'fill-current' : ''}`}
                                />
                              ))}
                            </div>
                            <span className="text-[11px] uppercase tracking-[0.12em] text-green-700 bg-green-50 px-2 py-0.5 border border-green-200">
                              Verified purchase
                            </span>
                          </div>
                          {review.title && (
                            <h3 className="mt-2 text-sm font-medium text-foreground">{review.title}</h3>
                          )}
                          {review.comment && <p className="mt-2 text-sm text-muted-foreground">{review.comment}</p>}
                          <p className="mt-2 text-xs text-muted-foreground">
                            {review.customerName}
                            {review.createdAt ? ` · ${new Date(review.createdAt).toLocaleDateString()}` : ''}
                          </p>
                        </article>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-6">
                    <Star className="h-10 w-10 mx-auto text-muted-foreground mb-3 opacity-40" />
                    <p className="text-sm text-muted-foreground">No reviews yet.</p>
                    <p className="text-xs text-muted-foreground mt-1">Be the first to review this product after purchase.</p>
                  </div>
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

      {/* Enhanced Size Guide Modal */}
      <AnimatePresence>
        {showSizeGuide && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 z-[45]"
              onClick={() => setShowSizeGuide(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[90%] max-w-lg bg-background-cream border-2 border-foreground p-6 z-50 shadow-2xl max-h-[85vh] overflow-y-auto rounded-sm"
            >
              <div className="flex items-center justify-between mb-6 pb-4 border-b border-border">
                <div>
                  <h2 className="font-serif text-xl font-semibold text-foreground">Size Guide</h2>
                  <p className="text-xs text-muted-foreground mt-1">{product.name}</p>
                </div>
                <button onClick={() => setShowSizeGuide(false)} className="text-muted-foreground hover:text-foreground transition-colors p-1">
                  <X className="h-6 w-6" />
                </button>
              </div>

              {/* Unit Toggle */}
              <div className="flex items-center gap-3 mb-6">
                <span className="text-xs uppercase tracking-[0.15em] text-muted-foreground">Unit:</span>
                <button
                  onClick={() => setSizeUnit('cm')}
                  className={`px-4 py-2 text-xs border transition-colors ${
                    sizeUnit === 'cm' ? 'border-primary text-primary bg-primary/5' : 'border-border hover:border-primary'
                  }`}
                >
                  CM
                </button>
                <button
                  onClick={() => setSizeUnit('inches')}
                  className={`px-4 py-2 text-xs border transition-colors ${
                    sizeUnit === 'inches' ? 'border-primary text-primary bg-primary/5' : 'border-border hover:border-primary'
                  }`}
                >
                  Inches
                </button>
              </div>

              {/* Measurement Chart — admin-managed rows only */}
              <div className="overflow-x-auto mb-8">
                {loadingSizeGuide ? (
                  <p className="text-sm text-muted-foreground py-8 text-center">Loading size guide...</p>
                ) : sizeGuideRows.length === 0 ? (
                  <div className="text-center py-8 bg-muted/30 border border-border p-4">
                    <p className="text-sm text-muted-foreground">
                      Size guide has not been set up for this product yet.
                    </p>
                  </div>
                ) : (
                  (() => {
                    const fieldKeys = Array.from(
                      new Set(sizeGuideRows.flatMap((row) => Object.keys(row.measurements || {})))
                    );
                    return (
                      <div className="border border-border bg-card">
                        <table className="w-full text-sm border-collapse">
                          <thead>
                            <tr className="bg-muted/50 border-b border-border">
                              <th className="py-3 px-3 text-left font-semibold text-foreground">Size</th>
                              {fieldKeys.map((key) => (
                                <th key={key} className="py-3 px-3 text-left font-semibold text-foreground capitalize">{key}</th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {sizeGuideRows.map((row, idx) => {
                              const unit = sizeUnit === 'inches' ? 'in' : 'cm';
                              return (
                                <tr key={row.id} className={`border-b border-border-light ${idx % 2 === 0 ? 'bg-background-cream/40' : ''}`}>
                                  <td className="py-3 px-3 font-medium text-foreground">{row.size_code}</td>
                                  {fieldKeys.map((key) => {
                                    const raw = row.measurements?.[key];
                                    if (!raw) return <td key={key} className="py-3 px-3 text-muted-foreground">—</td>;
                                    const value = sizeUnit === 'inches' ? convertToInches(raw) : raw;
                                    return <td key={key} className="py-3 px-3 text-foreground">{value} {unit}</td>;
                                  })}
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    );
                  })()
                )}
              </div>

              {/* Measurement Guide Illustration */}
              <div className="mb-6">
                <h3 className="text-xs uppercase tracking-[0.2em] font-semibold text-foreground mb-4">How to Measure</h3>
                <div className="space-y-3 text-xs">
                  <div className="bg-primary/5 border border-primary/20 rounded-sm p-3">
                    <p className="font-semibold text-foreground mb-1">Measurement Guide</p>
                    <p className="text-muted-foreground">Measure in a relaxed standing position, keeping the tape level and snug without pulling tight.</p>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="bg-muted/20 p-3 border border-border">
                      <p className="font-semibold text-foreground mb-1">Chest</p>
                      <p className="text-muted-foreground text-xs leading-relaxed">Measure around the fullest part of your chest, keeping the tape level under your arms.</p>
                    </div>
                    <div className="bg-muted/20 p-3 border border-border">
                      <p className="font-semibold text-foreground mb-1">Waist</p>
                      <p className="text-muted-foreground text-xs leading-relaxed">Measure around your natural waistline, typically just above your belly button.</p>
                    </div>
                    <div className="bg-muted/20 p-3 border border-border">
                      <p className="font-semibold text-foreground mb-1">Hip</p>
                      <p className="text-muted-foreground text-xs leading-relaxed">Measure around the fullest part of your hips, about 20cm below your waist.</p>
                    </div>
                    <div className="bg-muted/20 p-3 border border-border">
                      <p className="font-semibold text-foreground mb-1">Shoulder</p>
                      <p className="text-muted-foreground text-xs leading-relaxed">Measure across your back from the edge of one shoulder to the other.</p>
                    </div>
                  </div>
                </div>
              </div>

              <Button
                variant="outline"
                className="mt-8 w-full py-3 text-sm uppercase tracking-wider font-medium border-2 border-foreground hover:bg-foreground hover:text-background-cream transition-colors"
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
