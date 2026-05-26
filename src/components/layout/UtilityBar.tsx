import { Link } from 'react-router-dom';
import { MapPin, HelpCircle, Package, User } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

const utilityLinks = [
  { label: 'Help', href: '/help', icon: HelpCircle },
  { label: 'Orders & Returns', href: '/orders', icon: Package },
];

export function UtilityBar() {
  const { user, signOut } = useAuth();

  return (
    <div className="h-10 bg-background-cream border-b border-border-light">
      <div className="container h-full flex items-center justify-between">
        {/* Left side - Utility Links */}
        <nav className="flex items-center gap-8">
          {utilityLinks.map((link) => (
            <Link
              key={link.href}
              to={link.href}
              className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              <link.icon className="h-3.5 w-3.5" />
              <span>{link.label}</span>
            </Link>
          ))}
        </nav>

        {/* Right side - Account */}
        {user ? (
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <Link
              to="/auth"
              className="flex items-center gap-1.5 hover:text-foreground transition-colors"
            >
              <User className="h-3.5 w-3.5" />
              <span>{user.name || user.email}</span>
            </Link>
            <button
              type="button"
              onClick={signOut}
              className="hover:text-foreground transition-colors"
            >
              Sign Out
            </button>
          </div>
        ) : (
          <Link
            to="/auth"
            className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            <User className="h-3.5 w-3.5" />
            <span>Sign In</span>
          </Link>
        )}
      </div>
    </div>
  );
}
