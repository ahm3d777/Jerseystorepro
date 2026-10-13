import React, { useState, useEffect, useMemo } from 'react';
import { useStore, matchesCategoryFilter } from '../context/StoreContext';
import { ProductCard, ProductCardSkeleton } from '../components/ProductCard';
import { Breadcrumbs } from '../components/Breadcrumbs';
import { CURRENCY_SYMBOL } from '../constants';
import { SlidersHorizontal, Search, X } from 'lucide-react';
import { SHOP_CATEGORIES, categoryLabel } from '../lib/navigation';


type SortOption = 'featured' | 'price-asc' | 'price-desc' | 'rating';

export const Shop = () => {
  const { activeCategory, setCategory, products, productsLoading, searchQuery, setSearchQuery } = useStore();
  const [priceRange, setPriceRange] = useState<number>(3000);
  const [sortBy, setSortBy] = useState<SortOption>('featured');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setIsLoading(true);
    const timer = setTimeout(() => setIsLoading(false), 320);
    return () => clearTimeout(timer);
  }, [activeCategory, searchQuery]);

  const filteredProducts = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    const list = products.filter((p) => {
      if (!matchesCategoryFilter(p, activeCategory)) return false;
      if (p.price > priceRange) return false;
      if (q) {
        const hay = `${p.name} ${p.team} ${p.league} ${p.description ?? ''}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });

    if (sortBy === 'price-asc') return [...list].sort((a, b) => a.price - b.price);
    if (sortBy === 'price-desc') return [...list].sort((a, b) => b.price - a.price);
    if (sortBy === 'rating') return [...list].sort((a, b) => b.rating - a.rating);
    return list;
  }, [products, activeCategory, priceRange, searchQuery, sortBy]);

  const breadcrumbItems = [
    { label: 'Shop Vault', view: 'shop' as const, category: 'All' },
    ...(activeCategory !== 'All' ? [{ label: categoryLabel(activeCategory) }] : [])
  ];

  return (
    <div className="min-h-screen py-4 md:py-6 animate-fade-in">
      <div className="mb-6">
        <Breadcrumbs items={breadcrumbItems} />
      </div>

      {/* Editorial Header Banner */}
      <div className="rounded-2xl bg-surface-charcoal border border-surface-border p-6 sm:p-10 mb-8 relative overflow-hidden shadow-xl">
        <div className="absolute -top-24 -right-24 w-72 h-72 bg-primary-container/15 rounded-full blur-[110px] pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-surface-charcoal-elevated border border-surface-border mb-3">
              <span className="w-2 h-2 rounded-full bg-primary-container animate-pulse" />
              <span className="font-label-caps text-label-caps uppercase text-secondary tracking-widest">
                DHAKA VAULT INVENTORY
              </span>
            </div>
            <h1 className="font-headline-xl text-headline-xl-mobile sm:text-headline-xl uppercase tracking-tight text-on-surface">
              {activeCategory === 'All' ? 'ALL MATCH COLLECTIONS' : categoryLabel(activeCategory)}
            </h1>
            <p className="font-body-md text-body-md text-text-muted max-w-xl mt-1">
              Authentic 2025/26 club and national kits with verified NFC serial tags and player-issue weave metrics.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <span className="px-3.5 py-2 rounded-xl bg-surface-charcoal-elevated border border-surface-border font-label-caps text-label-caps uppercase text-on-surface">
              {filteredProducts.length} {filteredProducts.length === 1 ? 'Fixture' : 'Fixtures'} Available
            </span>
          </div>
        </div>
      </div>

      {/* Sticky Filter & Controls Bar */}
      <div className="sticky top-[calc(var(--header-h,5rem)+0.5rem)] z-30 rounded-xl bg-surface-charcoal/95 backdrop-blur-xl border border-surface-border p-4 mb-8 shadow-lg">
        <div className="flex flex-col gap-4">
          {/* Category Pills */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
            {SHOP_CATEGORIES.map(({ id, label }) => {
              const active = activeCategory === id;
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => setCategory(id)}
                  aria-pressed={active}
                  className={
                    active
                      ? 'px-4 py-2 rounded-lg bg-primary-container text-on-primary-container font-label-caps text-label-caps uppercase tracking-wider font-bold shadow-md whitespace-nowrap transition-colors'
                      : 'px-4 py-2 rounded-lg bg-surface-charcoal-elevated hover:bg-surface-container-high text-on-surface-variant hover:text-on-surface border border-surface-border font-label-caps text-label-caps uppercase tracking-wider font-semibold whitespace-nowrap transition-colors'
                  }
                >
                  {id === 'All' ? 'All' : label}
                </button>
              );
            })}
          </div>

          {/* Search, Price Slider & Sort Row */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pt-2 border-t border-surface-border/60">
            {/* Inline Search Input */}
            <div className="relative flex-1 max-w-sm">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Filter by club, player, or kit spec..."
                className="w-full pl-9 pr-8 py-2 rounded-lg bg-surface-charcoal-elevated border border-surface-border font-body-sm text-body-sm text-on-surface placeholder:text-text-muted focus:outline-none focus:border-primary-container"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-text-muted hover:text-on-surface"
                  aria-label="Clear search"
                >
                  <X size={14} />
                </button>
              )}
            </div>

            <div className="flex flex-wrap items-center justify-between md:justify-end gap-4">
              {/* Budget Range Slider */}
              <div className="flex items-center gap-3 min-w-[220px]">
                <span className="font-label-caps text-label-caps uppercase text-text-muted">Max Budget:</span>
                <input
                  type="range"
                  min="1000"
                  max="3000"
                  step="100"
                  value={priceRange}
                  onChange={(e) => setPriceRange(Number(e.target.value))}
                  className="w-28 sm:w-36 accent-primary-container h-1.5 bg-surface-container-high rounded-lg cursor-pointer"
                />
                <span className="font-headline-md text-label-numeric font-bold text-secondary whitespace-nowrap">
                  {CURRENCY_SYMBOL} {priceRange.toLocaleString()}
                </span>
              </div>

              {/* Sort Dropdown */}
              <div className="flex items-center gap-2">
                <SlidersHorizontal size={14} className="text-primary-container" />
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as SortOption)}
                  aria-label="Sort products"
                  className="bg-surface-charcoal-elevated border border-surface-border rounded-lg px-3 py-1.5 font-label-caps text-label-caps uppercase text-on-surface focus:outline-none focus:border-primary-container cursor-pointer"
                >
                  <option value="featured">Sort: Featured Vault</option>
                  <option value="price-asc">Price: Low to High</option>
                  <option value="price-desc">Price: High to Low</option>
                  <option value="rating">Top Collector Rating</option>
                </select>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Product Grid */}
      <div className="min-h-[400px]">
        {isLoading || productsLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[...Array(8)].map((_, i) => (
              <ProductCardSkeleton key={i} />
            ))}
          </div>
        ) : filteredProducts.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {filteredProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-20 text-center rounded-2xl bg-surface-charcoal border border-surface-border px-4">
            <div className="w-16 h-16 bg-surface-charcoal-elevated border border-surface-border rounded-full flex items-center justify-center mb-4">
              <Search className="text-text-muted" size={24} />
            </div>
            <h3 className="font-headline-md text-headline-md font-bold text-on-surface mb-2 uppercase">
              No Matching Fixtures Found
            </h3>
            <p className="font-body-md text-body-md text-text-muted mb-6 max-w-md">
              No kits matched your current filter combination. Try raising the maximum budget or resetting your search
              criteria.
            </p>
            <button
              type="button"
              onClick={() => {
                setCategory('All');
                setPriceRange(3000);
                setSearchQuery('');
                setSortBy('featured');
              }}
              className="px-7 py-3 bg-primary-container hover:bg-crimson-vibrant text-on-primary-container font-label-caps text-label-caps font-bold uppercase tracking-widest rounded-full transition-colors shadow-lg"
            >
              Reset Vault Filters
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
