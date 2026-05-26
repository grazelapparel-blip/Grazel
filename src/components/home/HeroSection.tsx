import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';

interface HeroSectionProps {
  title: string;
  subtitle?: string;
  image: string;
  cta?: {
    label: string;
    href: string;
  };
  secondaryCta?: {
    label: string;
    href: string;
  };
  align?: 'left' | 'center' | 'right';
  height?: 'full' | 'large' | 'medium';
  overlay?: boolean;
}

export function HeroSection({
  title,
  subtitle,
  image,
  cta,
  secondaryCta,
  align = 'center',
  height = 'large',
  overlay = true,
}: HeroSectionProps) {
  const heightClasses = {
    full: 'min-h-screen',
    large: 'min-h-[80vh]',
    medium: 'min-h-[60vh]',
  };

  const alignClasses = {
    left: 'items-start text-left',
    center: 'items-center text-center',
    right: 'items-end text-right',
  };

  return (
    <section
      className={`relative ${heightClasses[height]} flex items-center justify-center overflow-hidden`}
    >
      {/* Background Image - Static, no Ken Burns */}
      <div className="absolute inset-0">
        <img
          src={image}
          alt=""
          className="w-full h-full object-cover"
        />
        {overlay && (
          <div className="absolute inset-0 bg-gradient-to-t from-foreground/40 via-foreground/15 to-foreground/5" />
        )}
      </div>

      {/* Content */}
      <div className={`relative z-10 container flex flex-col ${alignClasses[align]} px-6`}>
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2, ease: 'easeOut' }}
          className="font-serif text-4xl md:text-5xl lg:text-6xl text-white tracking-wide max-w-3xl leading-[1.15]"
        >
          {title}
        </motion.h1>

        {subtitle && (
          <motion.p
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4, ease: 'easeOut' }}
            className="mt-6 text-base md:text-lg text-white/80 max-w-lg font-light"
          >
            {subtitle}
          </motion.p>
        )}

        {(cta || secondaryCta) && (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.6, ease: 'easeOut' }}
            className="mt-10 flex flex-col sm:flex-row gap-4"
          >
            {cta && (
              <Link to={cta.href}>
                <Button variant="hero" className="bg-primary text-primary-foreground hover:bg-primary-hover">
                  {cta.label}
                </Button>
              </Link>
            )}
            {secondaryCta && (
              <Link to={secondaryCta.href}>
                <Button variant="hero-outline" className="border-white/70 text-white hover:bg-white/10 hover:border-white">
                  {secondaryCta.label}
                </Button>
              </Link>
            )}
          </motion.div>
        )}
      </div>
    </section>
  );
}
