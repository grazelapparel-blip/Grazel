import { Link } from 'react-router-dom';
import { Tag, ShoppingBag } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface BundleProduct {
  id: string;
  name: string;
  description: string;
  bundleType: 'pair' | 'combo' | 'buy_more_save_more';
  productIds: string[];
  bundlePrice: number;
  originalPrice: number;
  discountPercentage: number;
  savingsAmount: number;
  images: string[];
  seasonalCategory?: string;
}

interface BundleCardProps {
  bundle: BundleProduct;
}

export function BundleCard({ bundle }: BundleCardProps) {
  const savings = bundle.originalPrice - bundle.bundlePrice;

  return (
    <div className="group bg-card border-2 border-primary/20 hover:border-primary/40 transition-all">
      {/* Image */}
      <div className="aspect-[4/3] bg-secondary overflow-hidden relative">
        <img
          src={bundle.images[0] || '/placeholder.svg'}
          alt={bundle.name}
          className="w-full h-full object-cover"
        />
        {/* Savings Badge */}
        <div className="absolute top-3 left-3 bg-primary text-primary-foreground px-3 py-1.5 text-xs font-bold uppercase tracking-wider">
          Save ₹{savings}
        </div>
        {bundle.discountPercentage > 0 && (
          <div className="absolute top-3 right-3 bg-red-600 text-white px-2 py-1 text-xs font-bold">
            {bundle.discountPercentage}% OFF
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-5 space-y-3">
        <div className="flex items-center gap-2">
          <Tag className="h-4 w-4 text-primary" />
          <span className="text-[10px] uppercase tracking-[0.15em] text-primary font-semibold">
            {bundle.bundleType === 'pair' ? 'Pair Bundle' : bundle.bundleType === 'combo' ? 'Combo Deal' : 'Multi-Save Offer'}
          </span>
        </div>

        <h3 className="font-serif text-lg text-foreground group-hover:text-primary transition-colors">
          {bundle.name}
        </h3>

        <p className="text-sm text-muted-foreground line-clamp-2">
          {bundle.description}
        </p>

        {/* Pricing */}
        <div className="flex items-center gap-3">
          <span className="text-xl font-semibold text-foreground">₹{bundle.bundlePrice}</span>
          <span className="text-sm text-muted-foreground line-through">₹{bundle.originalPrice}</span>
          <span className="text-xs text-green-700 bg-green-50 border border-green-200 px-2 py-0.5 font-medium">
            Save ₹{savings}
          </span>
        </div>

        <Button variant="add" className="w-full gap-2">
          <ShoppingBag className="h-4 w-4" /> Add Bundle to Bag
        </Button>
      </div>
    </div>
  );
}
