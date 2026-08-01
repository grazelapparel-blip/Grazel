import { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Search, Heart, User, ShoppingBag, Menu, HelpCircle, Package, LogOut } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { MegaMenu } from './MegaMenu';
import { SearchOverlay } from './SearchOverlay';
import { CartDrawer } from './CartDrawer';
import { MobileMenu } from './MobileMenu';
import { mainNavItems, megaMenuData } from '@/data/navigation';
import { useCart } from '@/context/CartContext';
import { useAuth } from '@/context/AuthContext';

export function Header() {
  const [activeMenu, setActiveMenu] = useState<string | null>(null);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isAccountMenuOpen, setIsAccountMenuOpen] = useState(false);
  const { cartCount, wishlist } = useCart();
  const { user, signOut } = useAuth();
  const accountMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isAccountMenuOpen) return;
    const handleClickOutside = (event: MouseEvent) => {
      if (accountMenuRef.current && !accountMenuRef.current.contains(event.target as Node)) {
        setIsAccountMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isAccountMenuOpen]);

  const handleMenuEnter = (label: string) => {
    const menuKey = label.toLowerCase();
    if (megaMenuData[menuKey]) {
      setActiveMenu(menuKey);
    }
  };

  const handleMenuLeave = () => {
    setActiveMenu(null);
  };

  return (
    <>
      {/* Sticky Header Wrapper — keeps Main Header fixed at top on scroll */}
      <header className="sticky top-0 z-40 bg-card border-b border-border shadow-sm">
        <div className="container h-[60px] flex items-center justify-between">
          {/* Left - Mobile Menu + Logo */}
          <div className="flex items-center gap-4">
            {/* Mobile Menu Button */}
            <Button
              variant="icon"
              size="icon-sm"
              className="lg:hidden"
              onClick={() => setIsMobileMenuOpen(true)}
            >
              <Menu className="h-5 w-5" />
            </Button>

            {/* Logo - Serif */}
            <Link to="/" className="font-serif text-xl lg:text-2xl tracking-[0.05em] text-foreground">
              GRAZEL
            </Link>
          </div>

          {/* Center - Navigation (Desktop) */}
          <nav className="hidden lg:flex items-center gap-10">
            {mainNavItems.map((item) => (
              <div
                key={item.href}
                onMouseEnter={() => handleMenuEnter(item.label)}
                className="relative"
              >
                <Link
                  to={item.href}
                  className={`nav-underline py-5 text-sm tracking-wide transition-colors ${
                    activeMenu === item.label.toLowerCase()
                      ? 'text-primary'
                      : 'text-foreground hover:text-primary'
                  }`}
                >
                  {item.label}
                </Link>
              </div>
            ))}
          </nav>

          {/* Right - Icons */}
          <div className="flex items-center gap-1 lg:gap-3">
            <Link to="/search">
              <Button
                variant="icon"
                size="icon"
                aria-label="Search"
              >
                <Search className="h-5 w-5" />
              </Button>
            </Link>

            <Link to="/wishlist" className="hidden sm:block">
              <Button variant="icon" size="icon" aria-label="Wishlist" className="relative">
                <Heart className="h-5 w-5" />
                {wishlist.length > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 h-4 w-4 text-[10px] font-medium bg-primary text-primary-foreground rounded-full flex items-center justify-center">
                    {wishlist.length}
                  </span>
                )}
              </Button>
            </Link>

            <div className="relative hidden sm:block" ref={accountMenuRef}>
              <Button
                variant="icon"
                size="icon"
                aria-label="Account menu"
                onClick={() => setIsAccountMenuOpen((open) => !open)}
              >
                <User className="h-5 w-5" />
              </Button>

              <AnimatePresence>
                {isAccountMenuOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.15 }}
                    className="absolute right-0 top-full mt-2 w-56 bg-card border border-border shadow-mega z-50 py-2"
                  >
                    {user ? (
                      <>
                        <div className="px-4 py-2 text-sm text-foreground font-medium truncate">
                          {user.name || user.email}
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            signOut();
                            setIsAccountMenuOpen(false);
                          }}
                          className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-muted-foreground hover:text-red-700 hover:bg-secondary/50 transition-colors"
                        >
                          <LogOut className="h-4 w-4" />
                          <span>Sign Out</span>
                        </button>
                      </>
                    ) : (
                      <Link
                        to="/auth"
                        onClick={() => setIsAccountMenuOpen(false)}
                        className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-foreground font-medium hover:bg-secondary/50 transition-colors"
                      >
                        <User className="h-4 w-4" />
                        <span>Sign In / Sign Up</span>
                      </Link>
                    )}
                    <div className="my-1 border-t border-border-light" />
                    <Link
                      to="/help"
                      onClick={() => setIsAccountMenuOpen(false)}
                      className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-muted-foreground hover:text-foreground hover:bg-secondary/50 transition-colors"
                    >
                      <HelpCircle className="h-4 w-4" />
                      <span>Help</span>
                    </Link>
                    <Link
                      to="/orders"
                      onClick={() => setIsAccountMenuOpen(false)}
                      className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-muted-foreground hover:text-foreground hover:bg-secondary/50 transition-colors"
                    >
                      <Package className="h-4 w-4" />
                      <span>Orders & Returns</span>
                    </Link>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <Button
              variant="icon"
              size="icon"
              onClick={() => setIsCartOpen(true)}
              aria-label="Cart"
              className="relative"
            >
              <ShoppingBag className="h-5 w-5" />
              {cartCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 h-4 w-4 text-[10px] font-medium bg-primary text-primary-foreground rounded-full flex items-center justify-center">
                  {cartCount}
                </span>
              )}
            </Button>
          </div>
        </div>

        {/* Mega Menu - Cream background */}
        <AnimatePresence>
          {activeMenu && megaMenuData[activeMenu] && (
            <MegaMenu
              data={megaMenuData[activeMenu]}
              onClose={handleMenuLeave}
            />
          )}
        </AnimatePresence>
      </header>

      {/* Search Overlay */}
      <SearchOverlay isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />

      {/* Cart Drawer */}
      <CartDrawer isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />

      {/* Mobile Menu */}
      <MobileMenu
        isOpen={isMobileMenuOpen}
        onClose={() => setIsMobileMenuOpen(false)}
        onOpenSearch={() => setIsSearchOpen(true)}
      />
    </>
  );
}
