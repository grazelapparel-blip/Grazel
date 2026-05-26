import { Link } from 'react-router-dom';
import { Trash2, ShoppingBag } from 'lucide-react';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { useCart } from '@/context/CartContext';
import { useProducts } from '@/context/ProductContext';
import { FeaturedProducts } from '@/components/home/FeaturedProducts';

export function WishlistPage() {
  const { wishlist, removeFromWishlist, addToCart } = useCart();
  const { products } = useProducts();

  const suggestedProducts = products
    .filter((p) => !wishlist.some((w) => w.product.id === p.id))
    .slice(0, 4);

  return (
    <Layout>
      <div className="container py-12 lg:py-20">
        <h1 className="font-serif text-4xl text-foreground text-center mb-12">
          Wishlist
        </h1>

        {wishlist.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-muted-foreground mb-6">
              Your wishlist is empty
            </p>
            <Link to="/">
              <Button variant="outline">Continue Shopping</Button>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {wishlist.map(({ product }) => (
              <div key={product.id} className="group">
                <Link to={`/product/${product.id}`}>
                  <div className="aspect-[3/4] bg-secondary overflow-hidden mb-4 relative">
                    <img
                      src={product.images[0]}
                      alt={product.name}
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                    />
                  </div>
                </Link>
                <div className="space-y-2">
                  <Link
                    to={`/product/${product.id}`}
                    className="text-sm text-foreground hover:text-primary transition-colors block"
                  >
                    {product.name}
                  </Link>
                  <p className="text-sm text-muted-foreground">{product.fabric}</p>
                  {product.isPreOrder && (
                    <p className="text-[11px] uppercase tracking-[0.12em] text-primary">
                      {product.preOrderMessage || 'Pre-order available'}
                    </p>
                  )}
                  <p className="text-sm text-foreground">₹{product.price}</p>
                  <div className="flex gap-2 pt-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1 text-xs"
                      onClick={() => {
                        addToCart(product, product.sizes[0]);
                        removeFromWishlist(product.id);
                      }}
                    >
                      <ShoppingBag className="h-3 w-3 mr-1" />
                      {product.isPreOrder ? 'Pre-order' : 'Add to Bag'}
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      onClick={() => removeFromWishlist(product.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {suggestedProducts.length > 0 && (
        <FeaturedProducts
          title="You May Also Like"
          products={suggestedProducts}
        />
      )}
    </Layout>
  );
}
