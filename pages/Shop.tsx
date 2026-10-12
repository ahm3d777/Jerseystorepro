
import React, { useState, useEffect } from 'react';
import { useStore } from '../context/StoreContext';
import { ProductCard, ProductCardSkeleton } from '../components/ProductCard';
import { Breadcrumbs } from '../components/Breadcrumbs';
import { Filter, ChevronDown, SlidersHorizontal, Search } from 'lucide-react';

export const Shop = () => {
  const { activeCategory, setCategory, products, productsLoading } = useStore();
  const [priceRange, setPriceRange] = useState<number>(3000);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setIsLoading(true);
    const timer = setTimeout(() => setIsLoading(false), 800);
    return () => clearTimeout(timer);
  }, [activeCategory]);

  const filteredProducts = products.filter(p => {
    if (activeCategory !== 'All' && p.league !== activeCategory) return false;
    if (p.price > priceRange) return false;
    return true;
  });

  const breadcrumbItems = [
    { label: 'Shop All', view: 'shop' as const },
    ...(activeCategory !== 'All' ? [{ label: activeCategory }] : [])
  ];

  return (
    <div className="bg-white min-h-screen py-6 md:py-8 animate-fade-in">
      <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8">
        
        <div className="mb-6 md:mb-8">
          <Breadcrumbs items={breadcrumbItems} />
        </div>

        <div className="flex flex-col items-center text-center mb-8 md:mb-16">
          <h1 className="text-3xl md:text-5xl font-heading font-black text-brand-dark mb-3 md:mb-4 tracking-tighter uppercase">
            {activeCategory === 'All' ? 'Collections' : activeCategory}
          </h1>
          <p className="text-gray-500 text-sm md:text-base max-w-lg mx-auto leading-relaxed px-4">Elite jerseys from the world's top leagues and national teams.</p>
        </div>

        {/* Improved Mobile Sticky Filter Bar */}
        <div className="sticky top-[58px] md:top-20 z-30 bg-white/95 backdrop-blur-xl py-3 md:py-4 border-b border-gray-100 mb-8 md:mb-12 shadow-sm -mx-4 px-4 md:mx-0 md:px-0">
          <div className="flex flex-col gap-4">
            
            <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar -mx-4 px-4">
              {['All', 'La Liga', 'Premier League', 'Serie A', 'International'].map(league => (
                <button
                  key={league}
                  onClick={() => setCategory(league)}
                  className={`px-4 md:px-5 py-2 rounded-full text-[10px] md:text-xs font-bold uppercase tracking-widest whitespace-nowrap transition-all border ${
                    activeCategory === league 
                      ? 'bg-brand-dark text-white border-brand-dark shadow-md' 
                      : 'bg-white text-gray-500 border-gray-100 hover:border-brand-dark'
                  }`}
                >
                  {league}
                </button>
              ))}
            </div>

            <div className="flex items-center justify-between gap-4">
               <div className="flex items-center gap-3 flex-1 max-w-xs">
                  <span className="text-[9px] md:text-xs font-black uppercase tracking-widest text-gray-400">Budget:</span>
                  <div className="relative flex-1 flex items-center">
                    <input 
                        type="range" 
                        min="500" 
                        max="4000" 
                        step="100" 
                        value={priceRange}
                        onChange={(e) => setPriceRange(Number(e.target.value))}
                        className="w-full accent-brand-dark h-1 bg-gray-100 rounded-lg appearance-none cursor-pointer"
                    />
                  </div>
                  <span className="font-bold font-sport text-brand-dark text-xs md:text-sm whitespace-nowrap">৳{priceRange.toLocaleString()}</span>
               </div>
               
               <button className="flex items-center gap-1.5 text-[9px] md:text-xs font-black uppercase tracking-widest hover:text-brand-crimson transition-colors border border-gray-100 px-3 py-1.5 rounded-full">
                 <SlidersHorizontal size={12} /> Sort
               </button>
            </div>
          </div>
        </div>

        <div className="min-h-[400px]">
          {isLoading || productsLoading ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-3 md:gap-x-6 gap-y-8 md:gap-y-12">
              {[...Array(8)].map((_, i) => (
                <ProductCardSkeleton key={i} />
              ))}
            </div>
          ) : filteredProducts.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-3 md:gap-x-6 gap-y-8 md:gap-y-12">
              {filteredProducts.map(product => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-20 text-center animate-fade-in px-4">
              <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4">
                <Search className="text-gray-300" />
              </div>
              <h3 className="text-xl font-heading font-bold text-brand-dark mb-2 uppercase">No matches found</h3>
              <p className="text-gray-400 text-sm mb-6">Try adjusting your budget or selecting a different category.</p>
              <button 
                onClick={() => {setCategory('All'); setPriceRange(3000);}}
                className="px-8 py-3 bg-brand-dark text-white text-[10px] font-bold uppercase tracking-widest rounded-full"
              >
                Reset Filters
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
