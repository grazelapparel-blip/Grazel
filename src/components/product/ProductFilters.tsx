import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronDown, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { FilterState } from '@/types/product';
import { colors, categories, priceRanges } from '@/data/products';

interface ProductFiltersProps {
  category: 'men' | 'women' | 'essentials';
  filters: FilterState;
  onFilterChange: (filters: FilterState) => void;
  isMobile?: boolean;
  isOpen?: boolean;
  onClose?: () => void;
}

export function ProductFilters({
  category,
  filters,
  onFilterChange,
  isMobile = false,
  isOpen = true,
  onClose,
}: ProductFiltersProps) {
  const [expandedSections, setExpandedSections] = useState<string[]>([
    'subcategory',
    'size',
    'color',
    'fabric',
  ]);

  const categoryData = categories[category];

  const toggleSection = (section: string) => {
    setExpandedSections((prev) =>
      prev.includes(section)
        ? prev.filter((s) => s !== section)
        : [...prev, section]
    );
  };

  const toggleFilter = (type: keyof FilterState, value: string) => {
    const current = filters[type] as string[];
    const updated = current.includes(value)
      ? current.filter((v) => v !== value)
      : [...current, value];
    onFilterChange({ ...filters, [type]: updated });
  };

  const clearAllFilters = () => {
    onFilterChange({
      category: [],
      subcategory: [],
      color: [],
      fabric: [],
      fit: [],
      size: [],
      priceRange: [0, 10000],
      availability: false,
    });
  };

  const activeFilterCount =
    filters.subcategory.length +
    filters.color.length +
    filters.fabric.length +
    filters.fit.length +
    filters.size.length;

  const FilterSection = ({
    title,
    id,
    children,
  }: {
    title: string;
    id: string;
    children: React.ReactNode;
  }) => (
    <div className="border-b border-border-light py-4">
      <button
        onClick={() => toggleSection(id)}
        className="w-full flex items-center justify-between text-sm font-medium text-foreground"
      >
        <span>{title}</span>
        <ChevronDown
          className={`h-4 w-4 transition-transform ${
            expandedSections.includes(id) ? 'rotate-180' : ''
          }`}
        />
      </button>
      <AnimatePresence mode="wait">
        {expandedSections.includes(id) && (
          <motion.div
            key={`filter-${id}`}
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.15, ease: 'easeOut' }}
            layout
            className="overflow-hidden"
          >
            <div className="pt-4 space-y-3">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );

  const FilterCheckbox = ({
    label,
    checked,
    onChange,
  }: {
    label: string;
    checked: boolean;
    onChange: () => void;
  }) => (
    <label className="flex items-center gap-3 cursor-pointer group">
      <div
        className={`w-4 h-4 border transition-all ${
          checked
            ? 'border-primary bg-primary shadow-sm'
            : 'border-border group-hover:border-primary/60'
        }`}
      >
        {checked && <Check className="h-3 w-3 text-primary-foreground" />}
      </div>
      <span className={`text-sm transition-colors ${checked ? 'text-foreground font-medium' : 'text-foreground group-hover:text-primary/80'}`}>{label}</span>
    </label>
  );

  const filterContent = (
    <>
      {/* Header (Mobile) */}
      {isMobile && (
        <div className="flex items-center justify-between px-6 py-5 border-b border-border">
          <h2 className="font-serif text-lg">Filters</h2>
          <Button variant="icon" size="icon-sm" onClick={onClose}>
            <X className="h-5 w-5" />
          </Button>
        </div>
      )}

      {/* Filter Content */}
      <div className={isMobile ? 'flex-1 overflow-y-auto px-6 py-4' : ''}>
        {/* Active Filters */}
        {activeFilterCount > 0 && (
          <div className="flex items-center justify-between py-4 border-b border-border-light">
            <span className="text-sm text-muted-foreground">
              {activeFilterCount} filter{activeFilterCount > 1 ? 's' : ''} active
            </span>
            <button
              onClick={clearAllFilters}
              className="text-sm text-primary hover:text-primary-hover transition-colors"
            >
              Clear all
            </button>
          </div>
        )}

        {/* Categories */}
        <FilterSection title="Category" id="subcategory">
          {categoryData.subcategories.map((sub) => (
            <FilterCheckbox
              key={sub}
              label={sub}
              checked={filters.subcategory.includes(sub.toLowerCase())}
              onChange={() => toggleFilter('subcategory', sub.toLowerCase())}
            />
          ))}
        </FilterSection>

        {/* Sizes */}
        <FilterSection title="Size" id="size">
          <div className="flex flex-wrap gap-2">
            {['XS', 'S', 'M', 'L', 'XL', 'XXL'].map((size) => (
              <button
                key={size}
                onClick={() => toggleFilter('size', size)}
                className={`px-3 py-2 text-xs border transition-colors ${
                  filters.size.includes(size)
                    ? 'border-primary text-primary bg-primary/5'
                    : 'border-border hover:border-primary'
                }`}
              >
                {size}
              </button>
            ))}
          </div>
        </FilterSection>

        {/* Colors */}
        <FilterSection title="Color" id="color">
          {colors.slice(0, 8).map((color) => (
            <FilterCheckbox
              key={color}
              label={color}
              checked={filters.color.includes(color.toLowerCase())}
              onChange={() => toggleFilter('color', color.toLowerCase())}
            />
          ))}
        </FilterSection>

        {/* Fabrics */}
        <FilterSection title="Fabric" id="fabric">
          {categoryData.fabrics.map((fabric) => (
            <FilterCheckbox
              key={fabric}
              label={fabric}
              checked={filters.fabric.includes(fabric.toLowerCase())}
              onChange={() => toggleFilter('fabric', fabric.toLowerCase())}
            />
          ))}
        </FilterSection>

        {/* Fit */}
        <FilterSection title="Fit" id="fit">
          {categoryData.fits.map((fit) => (
            <FilterCheckbox
              key={fit}
              label={fit}
              checked={filters.fit.includes(fit.toLowerCase())}
              onChange={() => toggleFilter('fit', fit.toLowerCase())}
            />
          ))}
        </FilterSection>

        {/* Price Range */}
        <FilterSection title="Price" id="price">
          {priceRanges.map(([min, max]) => (
            <FilterCheckbox
              key={`${min}-${max}`}
              label={`₹${min.toLocaleString('en-IN')} - ₹${max.toLocaleString('en-IN')}`}
              checked={
                filters.priceRange[0] === min && filters.priceRange[1] === max
              }
              onChange={() =>
                onFilterChange({ ...filters, priceRange: [min, max] })
              }
            />
          ))}
        </FilterSection>

        {/* Availability */}
        <FilterSection title="Availability" id="availability">
          <label className="flex items-center gap-3 cursor-pointer group">
            <div
              className={`w-4 h-4 border transition-all ${
                filters.availability
                  ? 'border-primary bg-primary shadow-sm'
                  : 'border-border group-hover:border-primary/60'
              }`}
              onClick={() => onFilterChange({ ...filters, availability: !filters.availability })}
            >
              {filters.availability && <Check className="h-3 w-3 text-primary-foreground" />}
            </div>
            <span 
              onClick={() => onFilterChange({ ...filters, availability: !filters.availability })}
              className={`text-sm transition-colors cursor-pointer ${filters.availability ? 'text-foreground font-medium' : 'text-foreground group-hover:text-primary/80'}`}
            >
              In Stock Only
            </span>
          </label>
        </FilterSection>
      </div>

      {/* Footer (Mobile) */}
      {isMobile && (
        <div className="border-t border-border px-6 py-6 space-y-3">
          <Button variant="add" onClick={onClose}>
            Apply Filters
          </Button>
          <Button
            variant="outline"
            className="w-full"
            onClick={clearAllFilters}
          >
            Clear All
          </Button>
        </div>
      )}
    </>
  );

  if (isMobile) {
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

            {/* Drawer */}
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ duration: 0.3, ease: 'easeOut' }}
              className="fixed top-0 left-0 h-full w-full max-w-sm bg-card z-50 flex flex-col"
            >
              {filterContent}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    );
  }

  return <div className="sticky top-[96px]">{filterContent}</div>;
}
