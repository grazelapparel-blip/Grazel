import { useMemo, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { ArrowLeft, CheckCircle2, Star, AlertCircle } from 'lucide-react';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { useProducts } from '@/context/ProductContext';
import { checkReturnEligibility, getReturnEligibilityMessage } from '@/lib/returnPolicy';
import { toast } from 'sonner';

type ReviewDraft = {
  rating: number;
  title: string;
  comment: string;
};

type ReviewItem = {
  id: string;
  productId: string;
  productName: string;
  price: number;
  size: string;
  quantity: number;
  image?: string;
  returnWindowDays?: number;
};

const saveLocalReview = (review: any) => {
  const stored = localStorage.getItem('grazel_reviews');
  const existing = stored ? JSON.parse(stored) : [];
  const withoutDuplicate = existing.filter(
    (item: any) => item.orderId !== review.orderId || item.orderItemId !== review.orderItemId
  );
  localStorage.setItem('grazel_reviews', JSON.stringify([review, ...withoutDuplicate]));
};

export function ReviewOrderPage() {
  const navigate = useNavigate();
  const { state } = useLocation();
  const { products } = useProducts();
  const order = (state as any)?.order;
  const [drafts, setDrafts] = useState<Record<string, ReviewDraft>>({});
  const [submittedItems, setSubmittedItems] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState<string | null>(null);

  const items: ReviewItem[] = useMemo(() => {
    if (!order?.items) return [];

    return order.items.map((item: any) => {
      const productId = item.productId?.toString?.() || item.productId || item.product_id || '';
      const matchedProduct = products.find((product) => product.id === productId || product.name === item.productName);

      return {
        id: item.id || item._id || `${productId}-${item.size}`,
        productId,
        productName: item.productName || item.product_name,
        price: item.price,
        size: item.size,
        quantity: item.quantity,
        image: matchedProduct?.images?.[0],
        returnWindowDays: matchedProduct?.returnWindowDays || 30,
      };
    });
  }, [order, products]);

  const updateDraft = (itemId: string, next: Partial<ReviewDraft>) => {
    setDrafts((prev) => ({
      ...prev,
      [itemId]: {
        rating: prev[itemId]?.rating || 0,
        title: prev[itemId]?.title || '',
        comment: prev[itemId]?.comment || '',
        ...next,
      },
    }));
  };

  const submitReview = async (item: ReviewItem) => {
    const draft = drafts[item.id];
    if (!draft?.rating) {
      toast.error('Please choose a star rating first');
      return;
    }

    setSubmitting(item.id);
    const reviewPayload = {
      productId: item.productId,
      productName: item.productName,
      orderId: order.id,
      orderItemId: item.id,
      customerName: order.customerName || order.customer_name,
      rating: draft.rating,
      title: draft.title,
      comment: draft.comment,
      createdAt: new Date().toISOString(),
    };

    try {
      const response = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(reviewPayload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to save review');
      }

      const savedReview = await response.json();
      saveLocalReview(savedReview);
      setSubmittedItems((prev) => [...prev, item.id]);
      toast.success('Review submitted. Thank you for sharing your experience.');
    } catch (err: any) {
      saveLocalReview({ id: `${order.id}-${item.id}`, ...reviewPayload });
      setSubmittedItems((prev) => [...prev, item.id]);
      toast.success('Review saved on this device. It will show locally.');
    } finally {
      setSubmitting(null);
    }
  };

  if (!order) {
    return (
      <Layout>
        <div className="container py-20 text-center">
          <h1 className="font-serif text-3xl text-foreground">No recent purchase found</h1>
          <p className="mt-3 text-sm text-muted-foreground">
            Complete checkout to rate and review the products you purchased.
          </p>
          <Button className="mt-8" onClick={() => navigate('/')}>
            Continue Shopping
          </Button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="min-h-[calc(100vh-60px)] bg-background-cream py-16">
        <div className="container max-w-5xl">
          <Link
            to="/"
            className="group mb-8 inline-flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
            Continue Shopping
          </Link>

          <div className="mb-10">
            <div className="mb-4 inline-flex items-center gap-2 border border-green-200 bg-green-50 px-3 py-2 text-xs uppercase tracking-[0.15em] text-green-700">
              <CheckCircle2 className="h-4 w-4" />
              Order placed
            </div>
            <h1 className="font-serif text-3xl lg:text-4xl text-foreground">Rate your purchase</h1>
            <p className="mt-3 max-w-2xl text-sm text-muted-foreground">
              Share stars and a short review for each product so other shoppers can decide with confidence.
            </p>
          </div>

          <div className="space-y-6">
            {items.map((item) => {
              const draft = drafts[item.id] || { rating: 0, title: '', comment: '' };
              const isSubmitted = submittedItems.includes(item.id);
              const returnEligibility = checkReturnEligibility(order.createdAt, item.returnWindowDays || 30);
              const returnMessage = getReturnEligibilityMessage(
                returnEligibility.daysLeft,
                returnEligibility.isEligible,
                returnEligibility.deadlineFormatted
              );

              return (
                <section key={item.id} className="bg-card border border-border p-5 sm:p-6 shadow-mega">
                  <div className="grid gap-5 md:grid-cols-[120px_1fr]">
                    <div className="h-40 w-full bg-secondary md:h-36">
                      <img
                        src={item.image || '/placeholder.svg'}
                        alt={item.productName}
                        className="h-full w-full object-cover"
                      />
                    </div>
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <h2 className="font-serif text-xl text-foreground">{item.productName}</h2>
                          <p className="mt-1 text-xs text-muted-foreground">
                            Size {item.size} · Qty {item.quantity} · ₹{item.price}
                          </p>
                        </div>
                        <div className="flex flex-col items-end gap-2">
                          {isSubmitted && (
                            <span className="border border-green-200 bg-green-50 px-3 py-1.5 text-xs uppercase tracking-[0.14em] text-green-700">
                              Reviewed
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Return Eligibility Status */}
                      <div className={`mt-4 px-3 py-2.5 rounded text-xs ${
                        returnEligibility.isEligible
                          ? 'bg-blue-50 border border-blue-200 text-blue-700'
                          : 'bg-red-50 border border-red-200 text-red-700'
                      }`}>
                        <div className="flex items-start gap-2">
                          <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                          <div>
                            <p className="font-medium">{returnEligibility.isEligible ? 'Return Eligible' : 'Return Expired'}</p>
                            <p className="mt-0.5 opacity-90">{returnMessage}</p>
                          </div>
                        </div>
                      </div>

                      <div className="mt-5 flex items-center gap-2" aria-label="Choose rating">
                        {[1, 2, 3, 4, 5].map((value) => (
                          <button
                            key={value}
                            type="button"
                            onClick={() => updateDraft(item.id, { rating: value })}
                            disabled={isSubmitted}
                            className="text-primary transition-transform hover:scale-110 disabled:hover:scale-100"
                            aria-label={`${value} star${value > 1 ? 's' : ''}`}
                          >
                            <Star className={`h-7 w-7 ${draft.rating >= value ? 'fill-current' : ''}`} />
                          </button>
                        ))}
                        <span className="ml-2 text-sm text-muted-foreground">
                          {draft.rating ? `${draft.rating} out of 5` : 'Tap to rate'}
                        </span>
                      </div>

                      <div className="mt-5 grid gap-4">
                        <input
                          value={draft.title}
                          onChange={(event) => updateDraft(item.id, { title: event.target.value })}
                          disabled={isSubmitted}
                          maxLength={120}
                          placeholder="Review title"
                          className="w-full border border-border bg-background-cream px-4 py-3 text-sm outline-none focus:border-primary disabled:opacity-60"
                        />
                        <textarea
                          value={draft.comment}
                          onChange={(event) => updateDraft(item.id, { comment: event.target.value })}
                          disabled={isSubmitted}
                          maxLength={1000}
                          rows={4}
                          placeholder="What did you like about the product?"
                          className="w-full resize-none border border-border bg-background-cream px-4 py-3 text-sm outline-none focus:border-primary disabled:opacity-60"
                        />
                      </div>

                      <div className="mt-5 flex flex-wrap gap-3">
                        <Button
                          onClick={() => submitReview(item)}
                          disabled={isSubmitted || submitting === item.id}
                        >
                          {submitting === item.id ? 'Submitting...' : isSubmitted ? 'Review Submitted' : 'Submit Review'}
                        </Button>
                        {returnEligibility.isEligible && (
                          <Button
                            variant="outline"
                            className="border border-blue-200 text-blue-700 hover:bg-blue-50"
                            onClick={() => {
                              toast.info(`Return request initiated for ${item.productName}`);
                            }}
                          >
                            Request Return
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                </section>
              );
            })}
          </div>
        </div>
      </div>
    </Layout>
  );
}
