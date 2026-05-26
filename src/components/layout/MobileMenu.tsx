import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronDown, ChevronRight, Search, User, MapPin, HelpCircle, Package } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { megaMenuData, mainNavItems } from '@/data/navigation';
import { useAuth } from '@/context/AuthContext';

interface MobileMenuProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenSearch: () => void;
}

export function MobileMenu({ isOpen, onClose, onOpenSearch }: MobileMenuProps) {
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);
  const { user, signOut } = useAuth();

  const toggleCategory = (category: string) => {
    setExpandedCategory(expandedCategory === category ? null : category);
  };

  const handleSearchClick = () => {
    onClose();
    onOpenSearch();
  };

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

          {/* Menu Panel */}
          <motion.div
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
            className="fixed top-0 left-0 h-full w-full max-w-sm bg-card z-50 flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-5 border-b border-border">
              <Link to="/" onClick={onClose} className="font-serif text-xl tracking-wide">
                GRAZEL
              </Link>
              <Button variant="icon" size="icon-sm" onClick={onClose}>
                <X className="h-5 w-5" />
              </Button>
            </div>

            {/* Search */}
            <button
              onClick={handleSearchClick}
              className="flex items-center gap-3 px-6 py-4 border-b border-border text-muted-foreground hover:text-foreground transition-colors"
            >
              <Search className="h-4 w-4" />
              <span className="text-sm">Search</span>
            </button>

            {/* Navigation */}
            <nav className="flex-1 overflow-y-auto">
              <ul className="py-2">
                {mainNavItems.map((item) => {
                  const menuData = megaMenuData[item.label.toLowerCase()];
                  const hasSubmenu = !!menuData;

                  return (
                    <li key={item.href}>
                      {hasSubmenu ? (
                        <>
                          <button
                            onClick={() => toggleCategory(item.label)}
                            className="w-full flex items-center justify-between px-6 py-4 text-foreground hover:text-primary transition-colors"
                          >
                            <span className="text-sm font-medium tracking-wide">
                              {item.label}
                            </span>
                            <ChevronDown
                              className={`h-4 w-4 transition-transform ${
                                expandedCategory === item.label ? 'rotate-180' : ''
                              }`}
                            />
                          </button>

                          <AnimatePresence>
                            {expandedCategory === item.label && menuData && (
                              <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                transition={{ duration: 0.2 }}
                                className="overflow-hidden bg-secondary/50"
                              >
                                {menuData.columns.map((column) => (
                                  <div key={column.title} className="px-6 py-4">
                                    <p className="text-xs uppercase tracking-wider text-muted-foreground mb-3">
                                      {column.title}
                                    </p>
                                    <ul className="space-y-3">
                                      {column.items.map((subItem) => (
                                        <li key={subItem.href}>
                                          <Link
                                            to={subItem.href}
                                            onClick={onClose}
                                            className="flex items-center justify-between text-sm text-foreground hover:text-primary transition-colors"
                                          >
                                            <span>{subItem.label}</span>
                                            <ChevronRight className="h-3 w-3 text-muted-foreground" />
                                          </Link>
                                        </li>
                                      ))}
                                    </ul>
                                  </div>
                                ))}
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </>
                      ) : (
                        <Link
                          to={item.href}
                          onClick={onClose}
                          className="block px-6 py-4 text-sm font-medium tracking-wide text-foreground hover:text-primary transition-colors"
                        >
                          {item.label}
                        </Link>
                      )}
                    </li>
                  );
                })}
              </ul>
            </nav>

            {/* Footer Links */}
            <div className="border-t border-border px-6 py-6 space-y-4">
              {user ? (
                <div className="flex items-center justify-between gap-3 text-sm text-muted-foreground">
                  <Link
                    to="/auth"
                    onClick={onClose}
                    className="flex min-w-0 items-center gap-3 hover:text-foreground transition-colors"
                  >
                    <User className="h-4 w-4 shrink-0" />
                    <span className="truncate">{user.name || user.email}</span>
                  </Link>
                  <button
                    type="button"
                    onClick={() => {
                      signOut();
                      onClose();
                    }}
                    className="shrink-0 hover:text-foreground transition-colors"
                  >
                    Sign Out
                  </button>
                </div>
              ) : (
                <Link
                  to="/auth"
                  onClick={onClose}
                  className="flex items-center gap-3 text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  <User className="h-4 w-4" />
                  <span>Sign In / Register</span>
                </Link>
              )}
              <Link
                to="/stores"
                onClick={onClose}
                className="flex items-center gap-3 text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                
              </Link>
              <Link
                to="/help"
                onClick={onClose}
                className="flex items-center gap-3 text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                <HelpCircle className="h-4 w-4" />
                <span>Help</span>
              </Link>
              <Link
                to="/orders"
                onClick={onClose}
                className="flex items-center gap-3 text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                <Package className="h-4 w-4" />
                <span>Orders & Returns</span>
              </Link>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
