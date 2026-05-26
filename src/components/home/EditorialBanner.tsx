import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface EditorialBannerProps {
  title: string;
  subtitle?: string;
  description?: string;
  image: string;
  cta?: {
    label: string;
    href: string;
  };
  layout?: 'left' | 'right';
}

export function EditorialBanner({
  title,
  subtitle,
  description,
  image,
  cta,
  layout = 'left',
}: EditorialBannerProps) {
  return (
    <section className="py-20 lg:py-28 bg-card">
      <div className="container">
        <div
          className={`grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center ${
            layout === 'right' ? 'lg:flex-row-reverse' : ''
          }`}
        >
          {/* Image */}
          <div className={`order-1 ${layout === 'right' ? 'lg:order-2' : 'lg:order-1'}`}>
            <div className="aspect-[4/5] overflow-hidden bg-secondary">
              <img
                src={image}
                alt={title}
                className="w-full h-full object-cover"
              />
            </div>
          </div>

          {/* Content */}
          <div className={`order-2 ${layout === 'right' ? 'lg:order-1' : 'lg:order-2'} lg:px-6`}>
            {subtitle && (
              <p className="text-xs uppercase tracking-[0.2em] text-primary mb-4">
                {subtitle}
              </p>
            )}
            <h2 className="font-serif text-3xl lg:text-4xl text-foreground leading-tight">
              {title}
            </h2>
            {description && (
              <p className="mt-6 text-muted-foreground leading-relaxed max-w-md">
                {description}
              </p>
            )}
            {cta && (
              <Link to={cta.href} className="inline-block mt-8">
                <Button variant="outline" className="flex items-center gap-2 border-primary text-primary hover:bg-primary hover:text-primary-foreground">
                  {cta.label}
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
