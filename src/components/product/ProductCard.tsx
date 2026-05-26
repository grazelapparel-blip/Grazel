import { Link } from 'react-router-dom';
import { Heart } from 'lucide-react';
import { Product } from '@/types/product';
import { useCart } from '@/context/CartContext';
import { Button } from '@/components/ui/button';

interface ProductCardProps {
  product: Product;
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

  return (
    <div className="product-card group">
      <Link to={`/product/${product.id}`}>
        {/* Image Container - White background */}
        <div className="product-card-image relative aspect-[3/4] bg-card mb-4 overflow-hidden">
          <img
            src={product.images[0]}
            alt={product.name}
            className="w-full h-full object-cover"
          />

          {/* Badges - Restrained */}
          <div className="absolute top-3 left-3 flex flex-col gap-2 z-10">
            {product.isNew && (
              <span className="px-2 py-1 text-[10px] uppercase tracking-[0.1em] bg-foreground text-card font-medium">
                New
              </span>
            )}
            {product.isBestSeller && (
              <span className="px-2 py-1 text-[10px] uppercase tracking-[0.1em] bg-primary text-primary-foreground font-medium">
                Bestseller
              </span>
            )}
            {product.isPreOrder && (
              <span className="px-2 py-1 text-[10px] uppercase tracking-[0.1em] bg-blue-700 text-white font-medium">
                Pre-order
              </span>
            )}
          </div>

          {/* Wishlist Button - Appears on hover */}
          <Button
            variant="icon"
            size="icon-sm"
            onClick={handleWishlistClick}
            className={`absolute top-3 right-3 bg-card opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-10 ${
              inWishlist ? 'text-primary opacity-100' : 'text-foreground'
            }`}
          >
            <Heart className={`h-4 w-4 ${inWishlist ? 'fill-current' : ''}`} />
          </Button>

          {/* Quick Add - Shows on hover */}
          <div className="absolute bottom-0 left-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-10">
            <div className="flex gap-1 justify-center">
              {product.sizes.slice(0, 5).map((size) => (
                <span
                  key={size}
                  className="w-8 h-8 flex items-center justify-center text-xs font-medium bg-card hover:bg-primary hover:text-primary-foreground transition-colors cursor-pointer"
                >
                  {size}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Product Info */}
        <div className="space-y-1">
          <h3 className="text-sm text-foreground group-hover:text-primary transition-colors">
            {product.name}
          </h3>
          <p className="text-xs text-muted-foreground">{product.fabric}</p>
          {product.isPreOrder && (
            <p className="text-[11px] uppercase tracking-[0.12em] text-primary">
              {product.preOrderMessage || 'Pre-order available'}
            </p>
          )}
          <div className="flex items-center gap-2 pt-1">
            <span className="text-sm text-primary font-medium">₹{product.price}</span>
            {product.originalPrice && (
              <span className="text-sm text-muted-foreground line-through">
                ₹{product.originalPrice}
              </span>
            )}
          </div>
        </div>
      </Link>
    </div>
  );
}
