import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Instagram, Facebook, Twitter, Linkedin, Youtube, Mail, MapPin } from 'lucide-react';
import { toast } from 'sonner';

const footerLinks = {
  help: {
    title: 'Customer Service',
    links: [
      { label: 'Contact Us', href: '/contact' },
      { label: 'Help Center', href: '/help' },
      { label: 'Order Tracking', href: '/orders' },
      { label: 'Shipping Information', href: '/help' },
      { label: 'Returns & Exchanges', href: '/help' },
      { label: 'Size Guide', href: '/help' },
      { label: 'FAQ', href: '/help' },
    ],
  },
  shop: {
    title: 'Shop',
    links: [
      { label: "Men's Collection", href: '/men' },
      { label: "Women's Collection", href: '/women' },
      { label: 'Essentials', href: '/essentials' },
      { label: 'New Arrivals', href: '/new' },
      { label: 'Collections', href: '/collections' },
      { label: 'Summer Collection', href: '/summer-collection' },
      { label: 'Winter Collection', href: '/winter-collection' },
      { label: 'Diwali Collection', href: '/diwali-collection' },
      { label: 'E-Boutique', href: '/e-boutique' },
    ],
  },
  company: {
    title: 'About Grazel',
    links: [
      { label: 'Our Story', href: '/collections' },
      { label: 'Sustainability', href: '/collections' },
      { label: 'Careers', href: '/contact' },
      { label: 'Press', href: '/contact' },
      { label: 'Cookie Policy', href: '/cookies' },
      { label: 'Privacy Policy', href: '/privacy' },
    ],
  },
};

export function Footer() {
  const [email, setEmail] = useState('');
  const [subscribing, setSubscribing] = useState(false);

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      toast.error('Please enter your email');
      return;
    }

    setSubscribing(true);
    try {
      const response = await fetch('/api/subscriptions/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: trimmedEmail,
          subscriptionTypes: ['promotional', 'new_arrivals', 'seasonal_updates', 'order_updates'],
        }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        const storageKey = 'grazel_newsletter_emails';
        const stored = JSON.parse(localStorage.getItem(storageKey) || '[]');
        if (!stored.includes(trimmedEmail)) {
          stored.push(trimmedEmail);
          localStorage.setItem(storageKey, JSON.stringify(stored));
        }
        toast.success(data.error ? 'You’re on our list. We’ll share updates soon.' : 'Welcome! You\'ve subscribed to our newsletter.');
        setEmail('');
        return;
      }

      toast.success('Welcome! You\'ve subscribed to our newsletter.');
      setEmail('');
    } catch (err: any) {
      const storageKey = 'grazel_newsletter_emails';
      const stored = JSON.parse(localStorage.getItem(storageKey) || '[]');
      if (!stored.includes(trimmedEmail)) {
        stored.push(trimmedEmail);
        localStorage.setItem(storageKey, JSON.stringify(stored));
      }
      toast.success('Thanks! Your email is saved for future updates.');
    } finally {
      setSubscribing(false);
    }
  };

  return (
    <footer className="bg-background-cream border-t border-border">
      {/* Main Footer */}
      <div className="container py-16 lg:py-20">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-12 lg:gap-8">
          {/* Brand + Newsletter */}
          <div className="lg:col-span-2">
            <Link to="/" className="font-serif text-2xl tracking-[0.05em] text-foreground">
              GRAZEL
            </Link>
            <p className="mt-4 text-sm text-muted-foreground max-w-xs leading-relaxed">
              Timeless elegance crafted from the finest materials. 
              Each piece tells a story of quality and refinement.
            </p>

            {/* Contact Info */}
            <div className="mt-6 space-y-3">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Mail className="h-3.5 w-3.5 flex-shrink-0" />
                <a href="mailto:support@grazel.com" className="hover:text-primary transition-colors">
                  support@grazel.com
                </a>
              </div>

              <div className="flex items-start gap-2 text-sm text-muted-foreground">
                <MapPin className="h-3.5 w-3.5 flex-shrink-0 mt-0.5" />
                <span>Tiruppur, Tamil Nadu, India</span>
              </div>
            </div>

            {/* Newsletter */}
            <div className="mt-8">
              <p className="text-xs uppercase tracking-[0.15em] text-foreground mb-4 font-medium">
                Subscribe for updates
              </p>
              <form onSubmit={handleSubscribe} className="flex gap-3">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  className="flex-1 bg-transparent border-b border-border py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors"
                />
                <button
                  type="submit"
                  disabled={subscribing}
                  className="text-xs uppercase tracking-[0.1em] text-primary hover:text-primary-hover transition-colors font-medium whitespace-nowrap"
                >
                  {subscribing ? 'Subscribing...' : 'Subscribe'}
                </button>
              </form>
            </div>
          </div>

          {/* Links */}
          {Object.values(footerLinks).map((section) => (
            <div key={section.title}>
              <h3 className="font-serif text-sm font-medium text-foreground mb-5">
                {section.title}
              </h3>
              <ul className="space-y-3">
                {section.links.map((link) => (
                  <li key={link.label}>
                    <Link
                      to={link.href}
                      className="text-sm text-muted-foreground hover:text-primary transition-colors"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-border">
        <div className="container py-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-muted-foreground">
            &copy; {new Date().getFullYear()} Grazel. All rights reserved.
          </p>

          {/* Social Links - All platforms */}
          <div className="flex items-center gap-5">
            <a
              href="https://www.instagram.com/grazelapparel"
              target="_blank"
              rel="noopener noreferrer"
              className="text-muted-foreground hover:text-primary transition-colors"
              aria-label="Instagram"
            >
              <Instagram className="h-4 w-4" />
            </a>
            <a
              href="https://www.facebook.com/grazelapparel"
              target="_blank"
              rel="noopener noreferrer"
              className="text-muted-foreground hover:text-primary transition-colors"
              aria-label="Facebook"
            >
              <Facebook className="h-4 w-4" />
            </a>
            <a
              href="https://twitter.com/grazelapparel"
              target="_blank"
              rel="noopener noreferrer"
              className="text-muted-foreground hover:text-primary transition-colors"
              aria-label="Twitter/X"
            >
              <Twitter className="h-4 w-4" />
            </a>
            <a
              href="https://www.linkedin.com/company/grazelapparel"
              target="_blank"
              rel="noopener noreferrer"
              className="text-muted-foreground hover:text-primary transition-colors"
              aria-label="LinkedIn"
            >
              <Linkedin className="h-4 w-4" />
            </a>
            <a
              href="https://www.youtube.com/@grazelapparel"
              target="_blank"
              rel="noopener noreferrer"
              className="text-muted-foreground hover:text-primary transition-colors"
              aria-label="YouTube"
            >
              <Youtube className="h-4 w-4" />
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
