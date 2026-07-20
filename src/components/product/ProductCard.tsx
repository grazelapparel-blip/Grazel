import { Link } from 'react-router-dom';
import { Heart, ShoppingBag } from 'lucide-react';
import { Product } from '@/types/product';
import { useCart } from '@/context/CartContext';

interface ProductCardProps {
  product: Product;
}

function getStatusBadge(product: Product): { label: string; color: string } | null {
  if (product.isBestSeller) return { label: 'BEST SELLER', color: 'bg-[#9E3B0E]/45 border-amber-500/30 text-white' };
  if (product.isPreOrder) return { label: 'PRE-ORDER', color: 'bg-primary/45 border-primary/30 text-white' };
  if (product.isNew) return { label: 'NEW ARRIVAL', color: 'bg-slate-900/45 border-slate-700/30 text-white' };
  const stock = product.stock_quantity ?? (product as any).stockQuantity ?? null;
  if (stock !== null && stock === 0) return { label: 'SOLD OUT', color: 'bg-red-900/45 border-red-700/30 text-white' };
  if (stock !== null && stock <= 5 && stock > 0) return { label: 'LOW STOCK', color: 'bg-amber-800/45 border-amber-600/30 text-white' };
  return null;
}

export function ProductCard({ product }: ProductCardProps) {
  const { addToWishlist, removeFromWishlist, isInWishlist } = useCart();
  const inWishlist = isInWishlist(product.id);

  const handleWishlistClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (inWishlist) {
      removeFromWishlist(product.id);
    } else {
      addToWishlist(product);
    }
  };

  const badge = getStatusBadge(product);

  return (
    <div className="product-card group relative">
      <Link to={`/product/${product.id}`} className="block">
        {/* Image Container */}
        <div className="product-card-image relative aspect-[3/4] bg-secondary/40 mb-3 overflow-hidden border border-border/40">
          <img
            src={product.images[0]}
            alt={product.name}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          />

          {/* Status Badge — top left (40-50% opacity, 4px border-radius, font-weight: 500 medium, high contrast) */}
          {badge && (
            <div
              className={`absolute top-2.5 left-2.5 z-20 px-2.5 py-0.5 text-[9px] sm:text-[10px] font-medium uppercase tracking-[0.08em] rounded-[4px] backdrop-blur-md border shadow-xs transition-opacity duration-200 drop-shadow-sm ${badge.color}`}
            >
              {badge.label}
            </div>
          )}

          {/* Discount Badge — top left if no status badge */}
          {product.discount && product.discount > 0 && !badge && (
            <div className="absolute top-2.5 left-2.5 z-20 bg-red-700/45 border border-red-500/30 text-white px-2.5 py-0.5 text-[9px] sm:text-[10px] font-medium uppercase tracking-[0.08em] rounded-[4px] backdrop-blur-md shadow-xs drop-shadow-sm">
              {product.discount}% OFF
            </div>
          )}

          {/* Wishlist Button — top right */}
          <button
            type="button"
            onClick={handleWishlistClick}
            aria-label="Add to Wishlist"
            className={`absolute top-2.5 right-2.5 z-20 w-8 h-8 flex items-center justify-center bg-white/95 hover:bg-white text-foreground shadow-md border border-black/5 rounded-[4px] transition-all duration-200 ${
              inWishlist ? 'text-primary opacity-100 ring-1 ring-primary/30' : 'opacity-90 group-hover:opacity-100 hover:scale-105'
            }`}
          >
            <Heart className={`h-4 w-4 ${inWishlist ? 'fill-primary text-primary' : 'text-foreground/90'}`} />
          </button>

          {/* Hover Overlay Scrim */}
          <div className="absolute inset-0 bg-foreground/0 group-hover:bg-foreground/10 transition-colors duration-300 pointer-events-none z-10" />

          {/* Quick View Bar — slides up on hover */}
          <div className="absolute bottom-0 inset-x-0 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out z-20">
            <div className="bg-white/95 backdrop-blur-md border-t border-black/10 px-4 py-2.5 flex items-center justify-center gap-2 text-[10px] font-bold uppercase tracking-[0.15em] text-foreground shadow-lg">
              <ShoppingBag className="h-3.5 w-3.5" />
              View Product
            </div>
          </div>
        </div>

        {/* Product Info */}
        <div className="space-y-1 px-0.5">
          <h3 className="text-sm font-medium text-foreground truncate group-hover:text-primary transition-colors">
            {product.name}
          </h3>
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-foreground">₹{product.price}</span>
            {product.originalPrice && (
              <span className="text-xs text-muted-foreground line-through">
                ₹{product.originalPrice}
              </span>
            )}
            {product.discount && product.discount > 0 && (
              <span className="text-[10px] text-red-700 font-bold">{product.discount}% off</span>
            )}
          </div>
        </div>
      </Link>
    </div>
  );
}
