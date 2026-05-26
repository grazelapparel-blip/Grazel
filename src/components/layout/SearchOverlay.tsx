import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, X, TrendingUp, Clock } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useProducts } from '@/context/ProductContext';

interface SearchOverlayProps {
  isOpen: boolean;
  onClose: () => void;
}

const popularSearches = [
  'Cashmere sweater',
  'Wool blazer',
  'Silk dress',
  'Linen trousers',
  'Cotton shirt',
];

const recentSearches = [
  'Navy blazer',
  'White shirt',
];

export function SearchOverlay({ isOpen, onClose }: SearchOverlayProps) {
  const { products } = useProducts();
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<typeof products>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  useEffect(() => {
    if (query.length > 1) {
      const filtered = products.filter(
        (p) =>
          p.name.toLowerCase().includes(query.toLowerCase()) ||
          p.fabric.toLowerCase().includes(query.toLowerCase()) ||
          p.category.toLowerCase().includes(query.toLowerCase())
      );
      setSuggestions(filtered.slice(0, 5));
    } else {
      setSuggestions([]);
    }
  }, [query]);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-foreground/40 z-50"
            onClick={onClose}
          />

          {/* Search Panel */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            className="fixed top-0 left-0 right-0 bg-card z-50 shadow-mega"
          >
            <div className="container py-8">
              {/* Search Input */}
              <div className="relative mb-8">
                <Search className="absolute left-0 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <input
                  ref={inputRef}
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search for products, fabrics, collections..."
                  className="w-full bg-transparent border-b border-border py-4 pl-8 pr-12 text-lg font-light placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors"
                />
                <Button
                  variant="icon"
                  size="icon-sm"
                  onClick={onClose}
                  className="absolute right-0 top-1/2 -translate-y-1/2"
                >
                  <X className="h-5 w-5" />
                </Button>
              </div>

              {/* Search Results or Suggestions */}
              <div className="grid grid-cols-3 gap-12">
                {/* Popular Searches */}
                <div>
                  <div className="flex items-center gap-2 text-muted-foreground mb-4">
                    <TrendingUp className="h-4 w-4" />
                    <span className="text-xs uppercase tracking-wider">Popular Searches</span>
                  </div>
                  <ul className="space-y-3">
                    {popularSearches.map((term) => (
                      <li key={term}>
                        <button
                          onClick={() => setQuery(term)}
                          className="text-sm text-foreground hover:text-primary transition-colors"
                        >
                          {term}
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Recent Searches */}
                <div>
                  <div className="flex items-center gap-2 text-muted-foreground mb-4">
                    <Clock className="h-4 w-4" />
                    <span className="text-xs uppercase tracking-wider">Recent Searches</span>
                  </div>
                  <ul className="space-y-3">
                    {recentSearches.map((term) => (
                      <li key={term}>
                        <button
                          onClick={() => setQuery(term)}
                          className="text-sm text-foreground hover:text-primary transition-colors"
                        >
                          {term}
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Product Suggestions */}
                <div>
                  {suggestions.length > 0 && (
                    <>
                      <p className="text-xs uppercase tracking-wider text-muted-foreground mb-4">
                        Products
                      </p>
                      <ul className="space-y-4">
                        {suggestions.map((product) => (
                          <li key={product.id}>
                            <Link
                              to={`/product/${product.id}`}
                              onClick={onClose}
                              className="flex items-center gap-4 group"
                            >
                              <div className="w-12 h-16 bg-secondary flex-shrink-0 overflow-hidden">
                                <img
                                  src={product.images[0]}
                                  alt={product.name}
                                  className="w-full h-full object-cover"
                                />
                              </div>
                              <div>
                                <p className="text-sm text-foreground group-hover:text-primary transition-colors">
                                  {product.name}
                                </p>
                                <p className="text-sm text-muted-foreground">
                                  ₹{product.price}
                                </p>
                              </div>
                            </Link>
                          </li>
                        ))}
                      </ul>
                    </>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
