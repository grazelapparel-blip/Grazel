import { Link } from 'react-router-dom';
import { HelpCircle, User, LogOut } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

const utilityLinks = [
  { label: 'Help', href: '/help', icon: HelpCircle },
  // { label: 'Orders & Returns', href: '/orders', icon: Package },
];

export function UtilityBar() {
  const { user, signOut } = useAuth();

  return (
    <div className="h-9 bg-background-cream/95 backdrop-blur-md border-b border-border-light text-[11px] select-none">
      <div className="container h-full flex items-center justify-between">
        {/* Left side - Utility Links */}
        <nav className="flex items-center gap-6">
          {utilityLinks.map((link) => {
            const IconComponent = link.icon;
            return (
              <Link
                key={link.href}
                to={link.href}
                className="flex items-center gap-1.5 text-muted-foreground hover:text-primary transition-colors font-medium tracking-wide"
              >
                <IconComponent className="h-3.5 w-3.5 text-muted-foreground/80" />
                <span>{link.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Right side - User Account & Auth */}
        {user ? (
          <div className="flex items-center gap-3.5 text-muted-foreground">
            <Link
              to="/auth"
              className="flex items-center gap-1.5 text-foreground font-semibold hover:text-primary transition-colors tracking-wide"
            >
              <User className="h-3.5 w-3.5 text-primary" />
              <span>{user.name || user.email}</span>
            </Link>
            <span className="text-border-light">|</span>
            <button
              type="button"
              onClick={signOut}
              className="flex items-center gap-1 text-muted-foreground hover:text-red-700 transition-colors font-medium tracking-wide"
            >
              <LogOut className="h-3 w-3" />
              <span>Sign Out</span>
            </button>
          </div>
        ) : (
          <Link
            to="/auth"
            className="flex items-center gap-1.5 text-muted-foreground hover:text-primary transition-colors font-medium tracking-wide"
          >
            <User className="h-3.5 w-3.5" />
            <span>Sign In</span>
          </Link>
        )}
      </div>
    </div>
  );
}
