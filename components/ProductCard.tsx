
import React, { useState, useEffect } from 'react';
import { Product } from '../types';
import { CURRENCY_SYMBOL } from '../constants';
import { Badge, Skeleton } from './UI';
import { useStore } from '../context/StoreContext';
import { Heart, Eye, ShoppingBag, ArrowUpRight, Zap } from 'lucide-react';

interface ProductCardProps {
  product: Product;
}

export const ProductCardSkeleton = () => (
  <div className="bg-white rounded-lg sm:rounded-xl border border-gray-100 overflow-hidden">
    <Skeleton className="aspect-[3/4] w-full" />
    <div className="p-3 sm:p-5 space-y-2 sm:space-y-3">
      <div className="flex justify-between items-center">
        <Skeleton className="h-3 w-12 rounded-sm" />
        <Skeleton className="h-2 w-8 rounded-sm" />
      </div>
      <Skeleton className="h-5 w-3/4 rounded-sm" />
      <div className="flex justify-between items-center pt-1">
        <Skeleton className="h-5 w-16 rounded-sm" />
        <Skeleton className="h-7 w-7 rounded-full" />
      </div>
    </div>
  </div>
);

export const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
  const { navigateTo, toggleWishlist, wishlist } = useStore();
  const isLiked = wishlist.includes(product.id);
  const [imgSrc, setImgSrc] = useState(product.image);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    setImgSrc(product.image);
    setHasError(false);
  }, [product.image]);

  const handleImageError = () => {
    if (!hasError) {
      setHasError(true);
      const bg = product.color || '1e293b';
      const text = ['F7B5CD', 'FCD116', 'FFFFFF'].includes(bg) ? '000000' : 'FFFFFF';
      setImgSrc(`https://placehold.co/600x800/${bg}/${text}?text=${encodeURIComponent(product.team)}`);
    }
  };

  const handleWishlistClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    toggleWishlist(product.id);
  };

  return (
    <div 
      className="group relative bg-white cursor-pointer rounded-lg sm:rounded-2xl border border-gray-100 hover:border-brand-crimson/40 hover:shadow-xl transition-all duration-500 overflow-hidden flex flex-col h-full active:scale-[0.98]"
      onClick={() => navigateTo('product', product)}
    >
      <div className="relative aspect-[3/4] overflow-hidden bg-gray-50 shrink-0">
        <div className="absolute inset-0 bg-brand-crimson/0 group-hover:bg-brand-crimson/5 transition-colors duration-700"></div>

        <div className="absolute top-0 left-0 z-20 flex flex-col gap-1.5 p-2 sm:p-4">
          {product.isPlayerEdition && (
            <span className="bg-brand-dark text-brand-gold text-[7px] sm:text-[9px] font-black uppercase tracking-wider px-1.5 sm:px-2.5 py-1 rounded shadow-lg border border-brand-gold/20">
              Player
            </span>
          )}
          {product.status === 'out-of-stock' && (
            <span className="bg-gray-900/80 text-white text-[7px] sm:text-[9px] font-bold uppercase tracking-wider px-1.5 sm:px-2.5 py-1 rounded shadow-lg">
              Sold Out
            </span>
          )}
          {product.status === 'pre-order' && (
            <span className="bg-brand-gold text-white text-[7px] sm:text-[9px] font-bold uppercase tracking-wider px-1.5 sm:px-2.5 py-1 rounded shadow-lg">
              Pre-order
            </span>
          )}
          {product.status === 'low-stock' && product.stock !== undefined && (
            <span className="bg-white text-brand-crimson text-[7px] sm:text-[9px] font-bold uppercase tracking-wider px-1.5 sm:px-2.5 py-1 rounded shadow-lg">
              Only {product.stock} left
            </span>
          )}
          {product.originalPrice && (
            <span className="bg-brand-crimson text-white text-[7px] sm:text-[9px] font-bold uppercase tracking-wider px-1.5 sm:px-2.5 py-1 rounded shadow-lg">
              Save {(100 - (product.price / product.originalPrice * 100)).toFixed(0)}%
            </span>
          )}
        </div>

        <button 
          onClick={handleWishlistClick}
          className="absolute top-2 right-2 sm:top-4 sm:right-4 z-30 w-8 h-8 sm:w-11 sm:h-11 flex items-center justify-center rounded-full bg-white/80 backdrop-blur-md border border-white/40 text-brand-dark shadow-sm transition-all hover:bg-brand-crimson hover:text-white active:scale-90"
        >
          {/* Combined multiple className attributes into one */}
          <Heart size={14} fill={isLiked ? "currentColor" : "none"} className={`sm:w-5 sm:h-5 ${isLiked ? "text-white" : "text-brand-dark"}`} />
        </button>

        <img 
          src={imgSrc} 
          alt={product.name} 
          onError={handleImageError}
          className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105"
        />
        
        {/* Mobile Quick Tap Indicator (Subtle) */}
        <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-brand-dark/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"></div>
      </div>

      <div className="flex flex-col flex-grow p-3 sm:p-6 bg-white relative z-10">
        <div className="flex justify-between items-center mb-1.5 sm:mb-3">
            <div className="flex items-center gap-1">
               <Zap size={8} className="text-brand-gold fill-brand-gold sm:w-2.5 sm:h-2.5" />
               <div className="text-[7px] sm:text-[9px] font-black tracking-widest text-brand-gold uppercase truncate max-w-[80px] sm:max-w-none">
                  {product.team}
               </div>
            </div>
            <div className="text-[7px] sm:text-[9px] text-gray-400 font-bold uppercase tracking-widest">{product.season || '25/26'}</div>
        </div>
        
        <h3 className="font-heading font-bold text-brand-dark text-xs sm:text-base leading-tight group-hover:text-brand-crimson transition-colors duration-300 line-clamp-2 mb-3 sm:mb-4 flex-grow">
          {product.name}
        </h3>
        
        <div className="flex items-center justify-between pt-2 sm:pt-4 border-t border-gray-50 mt-auto">
          <div className="flex items-baseline gap-1 sm:gap-2">
            <span className="text-sm sm:text-xl font-bold font-sport text-brand-dark">
                {CURRENCY_SYMBOL}{product.price.toLocaleString()}
            </span>
            {product.originalPrice && (
                <span className="text-[9px] sm:text-xs text-gray-300 line-through font-sport">
                {product.originalPrice.toLocaleString()}
                </span>
            )}
          </div>
          
          <div className="w-7 h-7 sm:w-10 sm:h-10 rounded-full bg-gray-50 flex items-center justify-center text-gray-400 group-hover:bg-brand-dark group-hover:text-white transition-all duration-300">
             <ShoppingBag size={12} className="sm:w-[18px] sm:h-[18px]" />
          </div>
        </div>
      </div>
    </div>
  );
};
