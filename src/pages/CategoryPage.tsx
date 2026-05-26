import { useState, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { SlidersHorizontal, Grid2X2, Grid3X3, LayoutGrid, ChevronDown } from 'lucide-react';
import { Layout } from '@/components/layout/Layout';
import { ProductGrid } from '@/components/product/ProductGrid';
import { ProductFilters } from '@/components/product/ProductFilters';
import { Button } from '@/components/ui/button';
import { useProducts } from '@/context/ProductContext';
import { categories } from '@/data/products';
import { FilterState, SortOption } from '@/types/product';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface CategoryPageProps {
  category: 'men' | 'women' | 'essentials';
}

const sortOptions: { value: SortOption; label: string }[] = [
  { value: 'new', label: 'New Arrivals' },
  { value: 'bestsellers', label: 'Bestsellers' },
  { value: 'price-asc', label: 'Price: Low to High' },
  { value: 'price-desc', label: 'Price: High to Low' },
];

export function CategoryPage({ category }: CategoryPageProps) {
  const { products } = useProducts();
  const [searchParams] = useSearchParams();
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [sortBy, setSortBy] = useState<SortOption>('new');
  const [columns, setColumns] = useState<2 | 3 | 4>(4);
  const [filters, setFilters] = useState<FilterState>({
    category: [],
    subcategory: [],
    color: [],
    fabric: [],
    fit: [],
    size: [],
    priceRange: [0, 10000],
    availability: false,
  });

  const categoryData = categories[category];

  // Filter products
  const filteredProducts = useMemo(() => {
    let result = products.filter((p) => p.category === category);

    if (filters.subcategory.length > 0) {
      result = result.filter((p) =>
        filters.subcategory.includes(p.subcategory.toLowerCase())
      );
    }

    if (filters.color.length > 0) {
      result = result.filter((p) =>
        filters.color.includes(p.color.toLowerCase())
      );
    }

    if (filters.fabric.length > 0) {
      result = result.filter((p) =>
        filters.fabric.includes(p.fabric.toLowerCase())
      );
    }

    if (filters.fit.length > 0) {
      result = result.filter((p) =>
        filters.fit.includes(p.fit.toLowerCase())
      );
    }

    if (filters.size.length > 0) {
      result = result.filter((p) =>
        p.sizes.some((s) => filters.size.includes(s))
      );
    }

    result = result.filter(
      (p) => p.price >= filters.priceRange[0] && p.price <= filters.priceRange[1]
    );

    switch (sortBy) {
      case 'new':
        result = result.sort((a, b) => (b.isNew ? 1 : 0) - (a.isNew ? 1 : 0));
        break;
      case 'bestsellers':
        result = result.sort(
          (a, b) => (b.isBestSeller ? 1 : 0) - (a.isBestSeller ? 1 : 0)
        );
        break;
      case 'price-asc':
        result = result.sort((a, b) => a.price - b.price);
        break;
      case 'price-desc':
        result = result.sort((a, b) => b.price - a.price);
        break;
    }

    return result;
  }, [category, filters, sortBy]);

  const activeFilterCount =
    filters.subcategory.length +
    filters.color.length +
    filters.fabric.length +
    filters.fit.length +
    filters.size.length;

  return (
    <Layout>
      {/* Page Header - Cream background */}
      <section className="py-14 lg:py-20 bg-background-cream">
        <div className="container">
          <h1 className="font-serif text-4xl lg:text-5xl text-foreground text-center">
            {categoryData.name}
          </h1>
          <p className="mt-4 text-sm text-muted-foreground text-center max-w-md mx-auto">
            Discover our curated collection of refined pieces, crafted from the finest materials
          </p>
        </div>
      </section>

      {/* Toolbar - White background */}
      <section className="py-4 border-b border-border sticky top-[60px] bg-card z-30">
        <div className="container flex items-center justify-between">
          {/* Left - Filter button (mobile) */}
          <Button
            variant="outline"
            size="sm"
            className="lg:hidden flex items-center gap-2 border-border"
            onClick={() => setIsFilterOpen(true)}
          >
            <SlidersHorizontal className="h-4 w-4" />
            <span className="text-xs uppercase tracking-wide">Filters</span>
            {activeFilterCount > 0 && (
              <span className="text-xs text-primary">({activeFilterCount})</span>
            )}
          </Button>

          {/* Center - Product count */}
          <p className="text-xs text-muted-foreground uppercase tracking-wide hidden lg:block">
            {filteredProducts.length} product{filteredProducts.length !== 1 ? 's' : ''}
          </p>

          {/* Right - Sort & Grid controls */}
          <div className="flex items-center gap-4">
            {/* Grid Toggle (desktop) */}
            <div className="hidden lg:flex items-center gap-1 border-r border-border pr-4">
              <Button
                variant="icon"
                size="icon-sm"
                onClick={() => setColumns(2)}
                className={columns === 2 ? 'text-primary' : 'text-muted-foreground'}
              >
                <Grid2X2 className="h-4 w-4" />
              </Button>
              <Button
                variant="icon"
                size="icon-sm"
                onClick={() => setColumns(3)}
                className={columns === 3 ? 'text-primary' : 'text-muted-foreground'}
              >
                <Grid3X3 className="h-4 w-4" />
              </Button>
              <Button
                variant="icon"
                size="icon-sm"
                onClick={() => setColumns(4)}
                className={columns === 4 ? 'text-primary' : 'text-muted-foreground'}
              >
                <LayoutGrid className="h-4 w-4" />
              </Button>
            </div>

            {/* Sort Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="flex items-center gap-2">
                  <span className="text-xs uppercase tracking-wide">
                    Sort: {sortOptions.find((o) => o.value === sortBy)?.label}
                  </span>
                  <ChevronDown className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48 bg-card">
                {sortOptions.map((option) => (
                  <DropdownMenuItem
                    key={option.value}
                    onClick={() => setSortBy(option.value)}
                    className={sortBy === option.value ? 'text-primary' : ''}
                  >
                    {option.label}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </section>

      {/* Main Content - Cream background */}
      <section className="py-10 lg:py-14 bg-background-cream">
        <div className="container">
          <div className="flex gap-14">
            {/* Desktop Filters */}
            <aside className="hidden lg:block w-60 flex-shrink-0">
              <ProductFilters
                category={category}
                filters={filters}
                onFilterChange={setFilters}
              />
            </aside>

            {/* Product Grid */}
            <div className="flex-1">
              {filteredProducts.length > 0 ? (
                <ProductGrid products={filteredProducts} columns={columns} />
              ) : (
                <div className="text-center py-20">
                  <p className="text-muted-foreground mb-6">
                    No products found matching your filters
                  </p>
                  <Button
                    variant="outline"
                    className="border-primary text-primary hover:bg-primary hover:text-primary-foreground"
                    onClick={() =>
                      setFilters({
                        category: [],
                        subcategory: [],
                        color: [],
                        fabric: [],
                        fit: [],
                        size: [],
                        priceRange: [0, 10000],
                        availability: false,
                      })
                    }
                  >
                    Clear Filters
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Mobile Filters */}
      <ProductFilters
        category={category}
        filters={filters}
        onFilterChange={setFilters}
        isMobile
        isOpen={isFilterOpen}
        onClose={() => setIsFilterOpen(false)}
      />
    </Layout>
  );
}
