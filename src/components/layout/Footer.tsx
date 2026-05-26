import { Link } from 'react-router-dom';
import { Instagram, Facebook, Twitter } from 'lucide-react';

const footerLinks = {
  help: {
    title: 'Customer Service',
    links: [
      { label: 'Contact Us', href: '/help' },
      { label: 'Shipping Information', href: '/shipping' },
      { label: 'Returns & Exchanges', href: '/returns' },
      { label: 'Size Guide', href: '/size-guide' },
      { label: 'FAQ', href: '/faq' },
    ],
  },
  company: {
    title: 'About Grazel',
    links: [
      { label: 'Our Story', href: '/about' },
      { label: 'Sustainability', href: '/sustainability' },
      { label: 'Careers', href: '/careers' },
      { label: 'Press', href: '/press' },
    ],
  },
  legal: {
    title: 'Legal',
    links: [
      { label: 'Terms of Service', href: '/terms' },
      { label: 'Privacy Policy', href: '/privacy' },
      { label: 'Cookie Policy', href: '/cookies' },
    ],
  },
};

export function Footer() {
  return (
    <footer className="bg-background-cream border-t border-border">
      {/* Main Footer */}
      <div className="container py-16 lg:py-20">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-12 lg:gap-8">
          {/* Brand */}
          <div className="lg:col-span-2">
            <Link to="/" className="font-serif text-2xl tracking-[0.05em] text-foreground">
              GRAZEL
            </Link>
            <p className="mt-4 text-sm text-muted-foreground max-w-xs leading-relaxed">
              Timeless elegance crafted from the finest materials. 
              Each piece tells a story of quality and refinement.
            </p>

            {/* Newsletter */}
            <div className="mt-8">
              <p className="text-xs uppercase tracking-[0.15em] text-foreground mb-4">
                Subscribe to our newsletter
              </p>
              <form className="flex gap-3">
                <input
                  type="email"
                  placeholder="Enter your email"
                  className="flex-1 bg-transparent border-b border-border py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors"
                />
                <button
                  type="submit"
                  className="text-xs uppercase tracking-[0.1em] text-primary hover:text-primary-hover transition-colors font-medium"
                >
                  Subscribe
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
                  <li key={link.href}>
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
            © 2024 Grazel. All rights reserved.
          </p>

          {/* Social Links */}
          <div className="flex items-center gap-5">
            <a
              href="https://instagram.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-muted-foreground hover:text-primary transition-colors"
            >
              <Instagram className="h-4 w-4" />
            </a>
            <a
              href="https://facebook.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-muted-foreground hover:text-primary transition-colors"
            >
              <Facebook className="h-4 w-4" />
            </a>
            <a
              href="https://twitter.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-muted-foreground hover:text-primary transition-colors"
            >
              <Twitter className="h-4 w-4" />
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
