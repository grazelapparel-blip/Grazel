import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, Heart, User, ShoppingBag, Menu } from 'lucide-react';
import { AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { UtilityBar } from './UtilityBar';
import { MegaMenu } from './MegaMenu';
import { SearchOverlay } from './SearchOverlay';
import { CartDrawer } from './CartDrawer';
import { MobileMenu } from './MobileMenu';
import { mainNavItems, megaMenuData } from '@/data/navigation';
import { useCart } from '@/context/CartContext';

export function Header() {
  const [activeMenu, setActiveMenu] = useState<string | null>(null);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { cartCount, wishlist } = useCart();

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
      {/* Utility Bar - Cream background, hidden on mobile */}
      <div className="hidden lg:block">
        <UtilityBar />
      </div>

      {/* Main Header - White background */}
      <header className="sticky top-0 z-40 bg-card border-b border-border">
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

            <Link to="/auth" className="hidden sm:block">
              <Button variant="icon" size="icon" aria-label="Account">
                <User className="h-5 w-5" />
              </Button>
            </Link>

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
