import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { MegaMenuData } from '@/data/navigation';

interface MegaMenuProps {
  data: MegaMenuData;
  onClose: () => void;
}

export function MegaMenu({ data, onClose }: MegaMenuProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -4 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -4 }}
      transition={{ duration: 0.2, ease: 'easeOut' }}
      className="absolute top-full left-0 w-full bg-background-cream border-b border-border shadow-lg z-50"
      onMouseLeave={onClose}
    >
      <div className="container py-12">
        <div className="grid grid-cols-5 gap-0">
          {/* Menu Columns */}
          {data.columns.map((column, index) => (
            <div
              key={column.title}
              className={`pr-10 ${index < data.columns.length - 1 ? 'mega-menu-column' : ''}`}
            >
              <h3 className="font-serif text-sm font-medium text-foreground mb-5 tracking-wide">
                {column.title}
              </h3>
              <ul className="space-y-3">
                {column.items.map((item) => (
                  <li key={item.href}>
                    <Link
                      to={item.href}
                      onClick={onClose}
                      className="text-sm text-muted-foreground hover:text-primary transition-colors"
                    >
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}

          {/* Featured Image - Calm, no hover effects */}
          {data.featured && (
            <div className="pl-10">
              <Link
                to={data.featured.href}
                onClick={onClose}
                className="block"
              >
                <div className="aspect-[3/4] bg-card overflow-hidden mb-4">
                  <img
                    src={data.featured.image}
                    alt={data.featured.title}
                    className="w-full h-full object-cover"
                  />
                </div>
                <p className="font-serif text-sm text-foreground">
                  {data.featured.title}
                </p>
              </Link>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
