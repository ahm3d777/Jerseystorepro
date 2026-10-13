import React, { useState, useEffect, useCallback } from 'react';
import { useStore } from '../context/StoreContext';
import { Button, Reveal, Skeleton } from '../components/UI';
import { Breadcrumbs } from '../components/Breadcrumbs';
import { CURRENCY_SYMBOL, AVAILABLE_SIZES, FONT_STYLES, getProductMicroSpec } from '../constants';
import { isCustomized, unitPrice } from '../shared/pricing';
import {
  Check,
  Star,
  Truck,
  Shield,
  Share2,
  Heart,
  ChevronLeft,
  ChevronRight,
  ShoppingBag,
  Droplets,
  Wind,
  Ruler,
  X,
  QrCode
} from 'lucide-react';

const ProductDetailSkeleton = () => (
  <div className="py-4 md:py-8">
    <Skeleton className="h-5 w-48 mb-8 rounded" />
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-16">
      <div className="lg:col-span-7 space-y-4">
        <Skeleton className="aspect-[4/5] w-full rounded-2xl" />
        <div className="grid grid-cols-4 gap-3">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="aspect-square rounded-xl" />
          ))}
        </div>
      </div>
      <div className="lg:col-span-5 space-y-6">
        <Skeleton className="h-5 w-36 rounded" />
        <Skeleton className="h-12 w-full rounded" />
        <Skeleton className="h-12 w-1/2 rounded" />
        <Skeleton className="h-28 w-full rounded-xl" />
      </div>
    </div>
  </div>
);

export const ProductDetail = () => {
  const { currentProduct, addToCart, navigateTo, toggleWishlist, wishlist, productsLoading, showNotification } =
    useStore();
  const [selectedSize, setSelectedSize] = useState<string>('L');
  const [isLoading, setIsLoading] = useState(true);
  const [customization, setCustomization] = useState<{ name: string; number: string; font: string }>({
    name: '',
    number: '',
    font: FONT_STYLES[0]
  });
  const [isCustomizing, setIsCustomizing] = useState(false);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [failedImages, setFailedImages] = useState<Set<number>>(new Set());
  const [showStickyBar, setShowStickyBar] = useState(false);
  const [showSizeGuide, setShowSizeGuide] = useState(false);

  useEffect(() => {
    window.scrollTo(0, 0);
    setActiveImageIndex(0);
    setFailedImages(new Set());
    setSelectedSize('L');

    setIsLoading(true);
    const timer = setTimeout(() => setIsLoading(false), 350);

    const handleScroll = () => {
      setShowStickyBar(window.scrollY > 420);
    };

    window.addEventListener('scroll', handleScroll);
    return () => {
      clearTimeout(timer);
      window.removeEventListener('scroll', handleScroll);
    };
  }, [currentProduct?.id]);

  if (!currentProduct) {
    if (productsLoading) return <ProductDetailSkeleton />;
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center text-center px-6">
        <h1 className="font-headline-xl text-headline-lg text-on-surface uppercase mb-3">Fixture Not Found</h1>
        <p className="font-body-md text-body-md text-text-muted mb-8">
          This jersey may have been archived from our Banani Vault.
        </p>
        <Button onClick={() => navigateTo('shop')} variant="primary">
          Explore Vault Catalog
        </Button>
      </div>
    );
  }

  const spec = getProductMicroSpec(currentProduct);
  const soldOut = currentProduct.status === 'out-of-stock';
  const isWishlisted = wishlist.includes(currentProduct.id);
  const totalPrice = unitPrice(currentProduct.price, isCustomizing && isCustomized(customization));
  const gallery =
    currentProduct.gallery && currentProduct.gallery.length > 0
      ? currentProduct.gallery
      : [currentProduct.image, currentProduct.image, currentProduct.image, currentProduct.image];

  const getSafeImage = (src: string, index: number) => {
    if (failedImages.has(index)) {
      const bg = currentProduct.color || '141418';
      const text = ['F7B5CD', 'FCD116', 'FFFFFF'].includes(bg) ? '000000' : 'FFFFFF';
      return `https://placehold.co/800x1000/${bg}/${text}?text=${encodeURIComponent(currentProduct.team)}+View+${index + 1}&font=oswald`;
    }
    return src;
  };

  const nextImage = useCallback(() => {
    setActiveImageIndex((prev) => (prev + 1) % gallery.length);
  }, [gallery.length]);

  const prevImage = useCallback(() => {
    setActiveImageIndex((prev) => (prev - 1 + gallery.length) % gallery.length);
  }, [gallery.length]);

  const handleAddToCart = () => {
    if (!selectedSize) {
      const sizeSelector = document.getElementById('size-selector');
      if (sizeSelector) {
        sizeSelector.scrollIntoView({ behavior: 'smooth', block: 'center' });
        sizeSelector.classList.add('animate-pulse');
        setTimeout(() => sizeSelector.classList.remove('animate-pulse'), 1500);
      }
      showNotification('Please select a jersey size first', 'info');
      return;
    }
    addToCart(currentProduct, selectedSize, isCustomizing ? customization : undefined);
  };

  const handleShare = () => {
    navigator.clipboard?.writeText(window.location.href);
    showNotification('Product link copied to clipboard', 'info');
  };

  if (isLoading) return <ProductDetailSkeleton />;

  return (
    <div className="pb-24 md:pb-32 pt-2 md:pt-4 animate-fade-in relative">
      {/* Size Guide Modal */}
      {showSizeGuide && (
        <div
          className="fixed inset-0 z-[150] bg-black/75 backdrop-blur-md flex items-center justify-center p-4"
          onClick={() => setShowSizeGuide(false)}
        >
          <div
            className="w-full max-w-xl rounded-2xl bg-surface-charcoal border border-surface-border p-6 sm:p-8 shadow-2xl space-y-5"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-surface-border pb-4">
              <div className="flex items-center gap-2">
                <Ruler size={18} className="text-secondary" />
                <h3 className="font-headline-md text-title-sm font-bold text-on-surface uppercase">
                  Match &amp; Stadium Sizing Matrix (Inches)
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowSizeGuide(false)}
                className="p-1.5 rounded-lg bg-surface-charcoal-elevated text-text-muted hover:text-on-surface"
              >
                <X size={18} />
              </button>
            </div>
            <p className="font-body-sm text-body-sm text-text-muted">
              Player Edition ADV kits feature an athletic slim-cut silhouette. If you prefer a relaxed fit on a Player
              Edition jersey, we recommend ordering one size up.
            </p>
            <div className="overflow-x-auto rounded-xl border border-surface-border">
              <table className="w-full text-left font-body-sm text-body-sm">
                <thead className="bg-surface-charcoal-elevated text-secondary font-label-caps text-label-caps uppercase">
                  <tr>
                    <th className="px-4 py-3">Size</th>
                    <th className="px-4 py-3">Chest (in)</th>
                    <th className="px-4 py-3">Length (in)</th>
                    <th className="px-4 py-3">Fit Profile</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-border text-on-surface">
                  <tr>
                    <td className="px-4 py-2.5 font-bold">S</td>
                    <td className="px-4 py-2.5">37 – 39&quot;</td>
                    <td className="px-4 py-2.5">27.5&quot;</td>
                    <td className="px-4 py-2.5 text-text-muted">Athletic Tailored</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-2.5 font-bold">M</td>
                    <td className="px-4 py-2.5">39 – 41&quot;</td>
                    <td className="px-4 py-2.5">28.5&quot;</td>
                    <td className="px-4 py-2.5 text-text-muted">Athletic Tailored</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-2.5 font-bold">L</td>
                    <td className="px-4 py-2.5">41 – 43&quot;</td>
                    <td className="px-4 py-2.5">29.5&quot;</td>
                    <td className="px-4 py-2.5 text-text-muted">Standard Match</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-2.5 font-bold">XL</td>
                    <td className="px-4 py-2.5">43 – 45.5&quot;</td>
                    <td className="px-4 py-2.5">30.5&quot;</td>
                    <td className="px-4 py-2.5 text-text-muted">Relaxed Pitch</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-2.5 font-bold">2XL (XXL)</td>
                    <td className="px-4 py-2.5">46 – 48.5&quot;</td>
                    <td className="px-4 py-2.5">31.5&quot;</td>
                    <td className="px-4 py-2.5 text-text-muted">Full Collector Cut</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Mobile Sticky CTA Bar */}
      <div
        className={`lg:hidden fixed bottom-0 left-0 right-0 z-[110] bg-surface-charcoal/95 backdrop-blur-2xl border-t border-surface-border px-5 py-4 pb-8 shadow-2xl transition-all duration-300 ${
          showStickyBar ? 'translate-y-0 opacity-100' : 'translate-y-full opacity-0 pointer-events-none'
        }`}
      >
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          <div className="flex flex-col min-w-0">
            <span className="font-label-caps text-[10px] text-secondary uppercase tracking-widest truncate">
              {selectedSize ? `Size ${selectedSize === 'XXL' ? '2XL' : selectedSize}` : 'Select Size'}
            </span>
            <span className="font-headline-md text-headline-md font-bold text-on-surface">
              {CURRENCY_SYMBOL} {totalPrice.toLocaleString()}
            </span>
          </div>
          <button
            type="button"
            onClick={handleAddToCart}
            disabled={soldOut}
            className="flex-1 h-12 disabled:opacity-40 disabled:pointer-events-none bg-primary-container hover:bg-crimson-vibrant text-on-primary-container font-headline-md text-label-numeric font-bold uppercase tracking-wider shadow-lg active:scale-95 transition-all flex items-center justify-center gap-2.5 rounded-full"
          >
            <ShoppingBag size={17} />
            <span>{soldOut ? 'SOLD OUT' : 'ADD TO BAG'}</span>
          </button>
        </div>
      </div>

      <div className="mb-6">
        <Breadcrumbs
          items={[
            { label: 'Shop Vault', view: 'shop' as const, category: 'All' },
            { label: currentProduct.league, view: 'shop' as const, category: currentProduct.league },
            { label: currentProduct.name }
          ]}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-14">
        {/* Left Column: Blended Studio + Lifestyle Gallery */}
        <div className="lg:col-span-7 space-y-4">
          <div className="aspect-[4/5] bg-surface-container-lowest border border-surface-border relative group overflow-hidden shadow-2xl rounded-2xl">
            <img
              src={getSafeImage(gallery[activeImageIndex], activeImageIndex)}
              alt={currentProduct.name}
              onError={() => setFailedImages((prev) => new Set(prev).add(activeImageIndex))}
              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-[1.03]"
            />

            {/* Top Badges */}
            <div className="absolute top-4 left-4 flex items-center gap-2 z-10">
              <span className="px-3 py-1 rounded bg-primary-container text-on-primary-container font-label-caps text-label-caps uppercase font-bold shadow-md">
                {spec.editionBadge}
              </span>
              <span className="px-3 py-1 rounded bg-surface-charcoal/90 border border-surface-border text-secondary font-label-caps text-label-caps uppercase font-bold backdrop-blur-md">
                {spec.specLeft}
              </span>
            </div>

            {/* Gallery Prev/Next Controls */}
            <div className="absolute inset-y-0 left-0 right-0 flex items-center justify-between px-4 pointer-events-none">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  prevImage();
                }}
                aria-label="Previous image"
                className="p-2.5 bg-surface-charcoal/85 hover:bg-primary-container text-on-surface hover:text-on-primary-container border border-surface-border backdrop-blur-md rounded-full shadow-lg pointer-events-auto active:scale-90 transition-all"
              >
                <ChevronLeft size={20} />
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  nextImage();
                }}
                aria-label="Next image"
                className="p-2.5 bg-surface-charcoal/85 hover:bg-primary-container text-on-surface hover:text-on-primary-container border border-surface-border backdrop-blur-md rounded-full shadow-lg pointer-events-auto active:scale-90 transition-all"
              >
                <ChevronRight size={20} />
              </button>
            </div>

            {/* Live Jersey Typography Customization Preview Overlay */}
            {isCustomizing && (customization.number || customization.name) && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/55 backdrop-blur-sm z-20 animate-fade-in">
                <div className="bg-surface-charcoal border-2 border-primary-container shadow-2xl p-6 md:p-8 text-center min-w-[220px] md:min-w-[260px] rounded-2xl">
                  <p className="font-label-caps text-[10px] text-secondary uppercase tracking-widest mb-3">
                    ✦ OFFICIAL {customization.font} PRINT PREVIEW
                  </p>
                  <div className="font-display-hero text-6xl md:text-7xl text-on-surface tracking-tighter mb-2">
                    {customization.number || '10'}
                  </div>
                  <div className="font-headline-md text-title-sm font-bold uppercase text-primary tracking-[0.2em] truncate">
                    {customization.name || 'PLAYER NAME'}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Thumbnail Strip */}
          <div className="grid grid-cols-4 gap-3 overflow-x-auto no-scrollbar py-1">
            {gallery.map((img, i) => (
              <button
                key={i}
                type="button"
                className={`aspect-square bg-surface-charcoal rounded-xl overflow-hidden border-2 transition-all ${
                  activeImageIndex === i
                    ? 'border-primary-container ring-2 ring-primary-container/25 opacity-100'
                    : 'border-surface-border opacity-60 hover:opacity-90'
                }`}
                onClick={() => setActiveImageIndex(i)}
              >
                <img
                  src={getSafeImage(img, i)}
                  alt={`${currentProduct.name} view ${i + 1}`}
                  onError={() => setFailedImages((prev) => new Set(prev).add(i))}
                  className="w-full h-full object-cover"
                />
              </button>
            ))}
          </div>
        </div>

        {/* Right Column: Specifications & Purchase Controls */}
        <div className="lg:col-span-5 self-start space-y-6 bg-surface-charcoal border border-surface-border rounded-2xl p-6 sm:p-8 shadow-xl">
          <Reveal delay={0.05}>
            <div className="space-y-2.5">
              <div className="flex justify-between items-center">
                <span className="font-label-caps text-label-caps text-secondary uppercase tracking-widest">
                  ✦ {spec.displayClub || currentProduct.team} • {currentProduct.season || '2025/26'}
                </span>
                <button
                  type="button"
                  onClick={handleShare}
                  aria-label="Share product"
                  className="text-text-muted hover:text-on-surface p-2 bg-surface-charcoal-elevated rounded-lg border border-surface-border transition-colors"
                >
                  <Share2 size={16} />
                </button>
              </div>

              <h1 className="font-headline-xl text-headline-xl-mobile sm:text-headline-lg uppercase text-on-surface tracking-tight leading-tight">
                {currentProduct.name}
              </h1>

              <div className="flex items-center gap-3 pt-1">
                <div className="flex items-center gap-1 text-secondary">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      size={13}
                      fill={i < Math.floor(currentProduct.rating) ? 'currentColor' : 'none'}
                      className={i < Math.floor(currentProduct.rating) ? 'text-secondary' : 'text-surface-container-highest'}
                    />
                  ))}
                </div>
                <span className="font-label-caps text-label-caps text-text-muted uppercase border-l border-surface-border pl-3">
                  {currentProduct.rating.toFixed(1)} ({currentProduct.reviews} Collector Reviews)
                </span>
              </div>
            </div>
          </Reveal>

          {/* Price Block */}
          <Reveal delay={0.1}>
            <div className="flex items-baseline gap-3 border-y border-surface-border py-5">
              <span className="font-display-hero text-3xl sm:text-4xl font-bold text-on-surface">
                {CURRENCY_SYMBOL} {totalPrice.toLocaleString()}
              </span>
              {currentProduct.originalPrice && (
                <span className="font-headline-md text-title-sm text-text-muted line-through">
                  {CURRENCY_SYMBOL} {currentProduct.originalPrice.toLocaleString()}
                </span>
              )}
              <span className="ml-auto px-2.5 py-1 rounded bg-secondary/15 text-secondary font-label-caps text-[10px] uppercase font-bold">
                bKash / Nagad EMI
              </span>
            </div>
          </Reveal>

          {/* Description & Micro-Specs */}
          <Reveal delay={0.15}>
            <div className="space-y-4">
              <p className="font-body-md text-body-md text-text-muted leading-relaxed">{currentProduct.description}</p>

              <div className="grid grid-cols-2 gap-3">
                <div className="flex items-center gap-3 p-3 bg-surface-charcoal-elevated rounded-xl border border-surface-border">
                  <Wind size={16} className="text-primary-container shrink-0" />
                  <div className="flex flex-col min-w-0">
                    <span className="font-label-caps text-[10px] text-text-muted uppercase">WEAVE TECH</span>
                    <span className="font-label-caps text-label-caps text-on-surface truncate">{spec.specLeft}</span>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 bg-surface-charcoal-elevated rounded-xl border border-surface-border">
                  <Droplets size={16} className="text-tertiary shrink-0" />
                  <div className="flex flex-col min-w-0">
                    <span className="font-label-caps text-[10px] text-text-muted uppercase">CHASSIS CUT</span>
                    <span className="font-label-caps text-label-caps text-on-surface truncate">{spec.specRight}</span>
                  </div>
                </div>
              </div>
            </div>
          </Reveal>

          {/* Size Selector */}
          <Reveal delay={0.2}>
            <div className="space-y-3" id="size-selector">
              <div className="flex justify-between items-center">
                <span className="font-label-caps text-label-caps uppercase text-on-surface">
                  Select Match Size
                </span>
                <button
                  type="button"
                  onClick={() => setShowSizeGuide(true)}
                  className="inline-flex items-center gap-1 font-label-caps text-label-caps uppercase text-secondary hover:underline"
                >
                  <Ruler size={13} />
                  <span>Size Matrix</span>
                </button>
              </div>
              <div className="grid grid-cols-5 gap-2">
                {AVAILABLE_SIZES.map((size) => {
                  const label = size === 'XXL' ? '2XL' : size;
                  const active = selectedSize === size;
                  return (
                    <button
                      key={size}
                      type="button"
                      onClick={() => setSelectedSize(size)}
                      className={`h-11 rounded-lg font-label-caps text-label-caps transition-all border ${
                        active
                          ? 'bg-primary-container border-primary-container text-on-primary-container font-bold shadow-md scale-[1.03]'
                          : 'bg-surface-charcoal-elevated border-surface-border text-on-surface hover:border-primary'
                      }`}
                    >
                      {label}
                    </button>
                  );
                })}
              </div>
            </div>
          </Reveal>

          {/* Official Player Typography Customization */}
          <Reveal delay={0.25}>
            <div
              className={`p-4 sm:p-5 border rounded-xl transition-all ${
                isCustomizing
                  ? 'border-primary-container bg-surface-charcoal-elevated'
                  : 'border-surface-border bg-surface-charcoal-elevated/50'
              }`}
            >
              <div
                className="flex items-center justify-between cursor-pointer"
                onClick={() => setIsCustomizing(!isCustomizing)}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-5 h-5 border flex items-center justify-center rounded ${
                      isCustomizing
                        ? 'bg-primary-container border-primary-container text-on-primary-container'
                        : 'border-surface-border bg-surface-charcoal'
                    }`}
                  >
                    {isCustomizing && <Check size={12} />}
                  </div>
                  <span className="font-label-caps text-label-caps uppercase text-on-surface">
                    Official Player Name &amp; Number Print
                  </span>
                </div>
                <span className="font-label-numeric text-label-numeric font-bold text-secondary">+৳800</span>
              </div>

              <div
                className={`grid transition-all duration-300 overflow-hidden ${
                  isCustomizing
                    ? 'grid-rows-[1fr] opacity-100 mt-4 pt-4 border-t border-surface-border'
                    : 'grid-rows-[0fr] opacity-0'
                }`}
              >
                <div className="min-h-0 space-y-4">
                  <div>
                    <label className="block font-label-caps text-[10px] uppercase text-text-muted mb-1.5">
                      Jersey Back Name
                    </label>
                    <input
                      type="text"
                      maxLength={12}
                      placeholder="E.G. MESSI / YAMAL"
                      value={customization.name}
                      onChange={(e) => setCustomization({ ...customization, name: e.target.value.toUpperCase() })}
                      className="w-full bg-surface-charcoal border border-surface-border p-3 font-headline-md text-body-md text-on-surface uppercase focus:border-primary-container outline-none tracking-widest rounded-lg"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block font-label-caps text-[10px] uppercase text-text-muted mb-1.5">
                        Squad Number
                      </label>
                      <input
                        type="number"
                        min={1}
                        max={99}
                        placeholder="10"
                        value={customization.number}
                        onChange={(e) => setCustomization({ ...customization, number: e.target.value })}
                        className="w-full bg-surface-charcoal border border-surface-border p-3 font-headline-md text-body-md text-on-surface focus:border-primary-container outline-none text-center rounded-lg"
                      />
                    </div>
                    <div>
                      <label className="block font-label-caps text-[10px] uppercase text-text-muted mb-1.5">
                        Typography Spec
                      </label>
                      <select
                        value={customization.font}
                        onChange={(e) => setCustomization({ ...customization, font: e.target.value })}
                        className="w-full bg-surface-charcoal border border-surface-border p-3 font-body-sm text-body-sm font-semibold text-on-surface focus:border-primary-container outline-none rounded-lg"
                      >
                        {FONT_STYLES.map((f) => (
                          <option key={f} value={f}>
                            {f}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </Reveal>

          {/* Primary Purchase CTA & Wishlist */}
          <Reveal delay={0.3}>
            <div className="flex gap-3 pt-2">
              <Button
                onClick={handleAddToCart}
                disabled={soldOut}
                fullWidth
                variant="primary"
                className="h-14 flex-1"
              >
                <ShoppingBag size={18} />
                <span>
                  {soldOut
                    ? 'Sold Out'
                    : `${currentProduct.status === 'pre-order' ? 'Pre-Order Allocation' : 'Add to Bag'} — ${CURRENCY_SYMBOL} ${totalPrice.toLocaleString()}`}
                </span>
              </Button>
              <button
                type="button"
                onClick={() => toggleWishlist(currentProduct.id)}
                aria-label="Toggle wishlist"
                className={`h-14 w-14 flex items-center justify-center border rounded-full transition-all active:scale-90 shrink-0 ${
                  isWishlisted
                    ? 'bg-primary-container/20 border-primary-container text-primary-container'
                    : 'bg-surface-charcoal-elevated border-surface-border text-text-muted hover:text-on-surface'
                }`}
              >
                <Heart size={20} fill={isWishlisted ? 'currentColor' : 'none'} />
              </button>
            </div>
          </Reveal>

          {/* Authenticity & Delivery Guarantees */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
            <div className="p-3.5 bg-surface-charcoal-elevated rounded-xl border border-surface-border flex items-center gap-3">
              <QrCode className="text-secondary shrink-0" size={18} />
              <div>
                <h4 className="font-label-caps text-[10px] text-on-surface uppercase">NFC Serial Verified</h4>
                <p className="font-body-sm text-[11px] text-text-muted">100% Match-Spec Guarantee</p>
              </div>
            </div>
            <div className="p-3.5 bg-surface-charcoal-elevated rounded-xl border border-surface-border flex items-center gap-3">
              <Truck className="text-tertiary shrink-0" size={18} />
              <div>
                <h4 className="font-label-caps text-[10px] text-on-surface uppercase">48H Express BD</h4>
                <p className="font-body-sm text-[11px] text-text-muted">Same-Day Dhaka Metro</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
