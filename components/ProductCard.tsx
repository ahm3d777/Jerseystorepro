import React, { useState, useEffect } from 'react';
import { Product } from '../types';
import { CURRENCY_SYMBOL, AVAILABLE_SIZES, getProductMicroSpec } from '../constants';
import { Skeleton } from './UI';
import { useStore } from '../context/StoreContext';
import { Heart, ShoppingBag } from 'lucide-react';

interface ProductCardProps {
  product: Product;
}

export const ProductCardSkeleton = () => (
  <div className="rounded-xl bg-surface-charcoal border border-surface-border p-4 shadow-lg flex flex-col">
    <Skeleton className="aspect-[4/5] w-full rounded-lg" />
    <div className="mt-4 space-y-2.5">
      <div className="flex justify-between items-center">
        <Skeleton className="h-3 w-24 rounded" />
        <Skeleton className="h-3 w-12 rounded" />
      </div>
      <Skeleton className="h-5 w-4/5 rounded" />
      <div className="flex gap-1.5 pt-1">
        {[...Array(5)].map((_, i) => (
          <Skeleton key={i} className="w-6 h-6 rounded" />
        ))}
      </div>
      <div className="flex justify-between items-center pt-3">
        <Skeleton className="h-6 w-20 rounded" />
        <Skeleton className="h-9 w-9 rounded-lg" />
      </div>
    </div>
  </div>
);

export const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
  const { navigateTo, toggleWishlist, wishlist } = useStore();
  const isLiked = wishlist.includes(product.id);
  const [imgSrc, setImgSrc] = useState(product.image);
  const [hasError, setHasError] = useState(false);

  const spec = getProductMicroSpec(product);
  const discountPct =
    product.originalPrice && product.originalPrice > product.price
      ? Math.round(100 - (product.price / product.originalPrice) * 100)
      : null;

  useEffect(() => {
    setImgSrc(product.image);
    setHasError(false);
  }, [product.image]);

  const handleImageError = () => {
    if (!hasError) {
      setHasError(true);
      const bg = product.color || '141418';
      const text = ['F7B5CD', 'FCD116', 'FFFFFF'].includes(bg) ? '000000' : 'FFFFFF';
      setImgSrc(`https://placehold.co/600x750/${bg}/${text}?text=${encodeURIComponent(product.team)}`);
    }
  };

  const handleWishlistClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    toggleWishlist(product.id);
  };

  const editionBadgeClasses: Record<typeof spec.badgeVariant, string> = {
    crimson: 'bg-primary-container text-on-primary-container',
    gold: 'bg-secondary text-on-secondary',
    'charcoal-gold': 'bg-surface-charcoal-elevated/95 text-secondary border border-surface-border',
    'charcoal-tertiary': 'bg-surface-charcoal-elevated/95 text-tertiary border border-surface-border'
  };

  const isPrimaryCta = product.isPlayerEdition || Boolean(product.originalPrice) || product.type === 'Special';

  return (
    <div
      onClick={() => navigateTo('product', product)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          navigateTo('product', product);
        }
      }}
      className="group relative flex flex-col rounded-xl bg-surface-charcoal border border-surface-border hover:border-primary-container/50 p-4 shadow-lg hover:shadow-2xl transition-all duration-300 cursor-pointer h-full"
    >
      {/* Image Stage */}
      <div className="relative w-full aspect-[4/5] rounded-lg overflow-hidden bg-surface-container-lowest shrink-0">
        <img
          src={imgSrc}
          alt={product.name}
          onError={handleImageError}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />

        {/* Top-Left Edition & Status Badges */}
        <div className="absolute top-3 left-3 flex flex-wrap items-center gap-1.5 z-10 pr-10">
          <span
            className={`px-2 py-0.5 rounded font-label-caps text-label-caps uppercase font-bold shadow-sm ${editionBadgeClasses[spec.badgeVariant]}`}
          >
            {spec.editionBadge}
          </span>
          {discountPct && (
            <span className="px-2 py-0.5 rounded bg-surface-charcoal/90 text-secondary font-label-caps text-label-caps font-bold border border-surface-border/60">
              -{discountPct}%
            </span>
          )}
          {product.status === 'out-of-stock' && (
            <span className="px-2 py-0.5 rounded bg-error-container text-on-error-container font-label-caps text-label-caps uppercase font-bold">
              SOLD OUT
            </span>
          )}
          {product.status === 'pre-order' && !discountPct && (
            <span className="px-2 py-0.5 rounded bg-surface-charcoal/90 text-tertiary font-label-caps text-label-caps uppercase font-bold">
              PRE-ORDER
            </span>
          )}
          {product.status === 'low-stock' && product.stock !== undefined && (
            <span className="px-2 py-0.5 rounded bg-surface-charcoal/90 text-primary font-label-caps text-label-caps uppercase font-bold">
              {product.stock} LEFT
            </span>
          )}
        </div>

        {/* Wishlist Action */}
        <button
          type="button"
          aria-label={isLiked ? 'Remove from wishlist' : 'Add to wishlist'}
          onClick={handleWishlistClick}
          className={`absolute top-3 right-3 z-20 w-8 h-8 rounded-full bg-surface-charcoal/85 backdrop-blur-md border border-surface-border/60 flex items-center justify-center transition-colors ${
            isLiked ? 'text-primary-container' : 'text-on-surface hover:text-primary'
          }`}
        >
          <Heart size={15} fill={isLiked ? 'currentColor' : 'none'} />
        </button>

        {/* Bottom Floating Micro-Spec Bar */}
        <div className="absolute bottom-3 left-3 right-3 px-2.5 py-1.5 rounded-md bg-surface-container-lowest/85 backdrop-blur-md border border-white/5 flex items-center justify-between text-on-surface-variant gap-2">
          <span
            className={`font-label-caps text-[10px] tracking-wider uppercase truncate ${
              spec.badgeVariant === 'charcoal-tertiary' ? 'text-tertiary' : 'text-secondary'
            }`}
          >
            {spec.specLeft}
          </span>
          <span
            className={`font-label-caps text-[10px] shrink-0 ${
              spec.specRightTone === 'tertiary'
                ? 'text-tertiary'
                : spec.specRightTone === 'secondary'
                  ? 'text-secondary'
                  : 'text-text-muted'
            }`}
          >
            {spec.specRight}
          </span>
        </div>
      </div>

      {/* Product Metadata Cluster */}
      <div className="flex flex-col flex-grow mt-4">
        <div className="flex items-center justify-between text-text-muted mb-1">
          <span className="font-label-caps text-label-caps uppercase tracking-wider text-secondary truncate">
            ✦ {spec.displayClub || product.team}
          </span>
          <span className="font-label-caps text-label-caps shrink-0">
            {spec.displaySeason || product.season || '2025/26'}
          </span>
        </div>

        <h3 className="font-headline-md text-title-sm font-bold text-on-surface tracking-tight group-hover:text-primary transition-colors truncate">
          {product.name}
        </h3>

        {/* Sizes Row */}
        <div className="flex items-center gap-1.5 mt-3">
          {AVAILABLE_SIZES.map((size) => {
            const label = size === 'XXL' ? '2XL' : size;
            const isOut =
              product.status === 'out-of-stock' ||
              Boolean(spec.outOfStockSizes && spec.outOfStockSizes.includes(size));
            return (
              <span
                key={size}
                className={`w-6 h-6 rounded flex items-center justify-center font-label-caps text-[10px] ${
                  isOut
                    ? 'bg-surface-container-high text-on-surface-variant line-through opacity-60'
                    : 'bg-surface-container text-on-surface font-semibold'
                }`}
              >
                {label}
              </span>
            );
          })}
        </div>

        {/* Pricing & Action Footer */}
        <div className="flex items-center justify-between mt-4 pt-3 bg-surface-charcoal-elevated/40 border-t border-surface-border/50 -mx-4 -mb-4 px-4 py-3 rounded-b-xl mt-auto">
          <div className="flex items-baseline gap-2 min-w-0">
            <span className="font-headline-md text-headline-md text-on-surface font-bold whitespace-nowrap">
              {CURRENCY_SYMBOL} {product.price.toLocaleString()}
            </span>
            {product.originalPrice ? (
              <span className="font-body-sm text-body-sm text-text-muted line-through whitespace-nowrap">
                {CURRENCY_SYMBOL} {product.originalPrice.toLocaleString()}
              </span>
            ) : spec.priceSubtext ? (
              <span
                className={`font-body-sm text-body-sm truncate ${
                  spec.priceSubtextTone === 'secondary' ? 'text-secondary font-semibold' : 'text-text-muted'
                }`}
              >
                {spec.priceSubtext}
              </span>
            ) : null}
          </div>

          <span
            aria-hidden="true"
            className={`w-9 h-9 rounded-lg flex items-center justify-center transition-colors shadow-md shrink-0 ${
              isPrimaryCta
                ? 'bg-primary-container group-hover:bg-crimson-vibrant text-on-primary-container'
                : 'bg-surface-container-high group-hover:bg-primary-container text-on-surface group-hover:text-on-primary-container'
            }`}
          >
            <ShoppingBag size={16} />
          </span>
        </div>
      </div>
    </div>
  );
};
