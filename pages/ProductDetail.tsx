
import React, { useState, useEffect, useCallback } from 'react';
import { useStore } from '../context/StoreContext';
import { Button, Badge, Reveal, Skeleton } from '../components/UI';
import { Breadcrumbs } from '../components/Breadcrumbs';
import { CURRENCY_SYMBOL, AVAILABLE_SIZES, FONT_STYLES } from '../constants';
import { isCustomized, unitPrice } from '../shared/pricing';
import { Check, Star, Truck, Shield, Ruler, Share2, Heart, ChevronLeft, ChevronRight, ShoppingBag, Droplets, Thermometer, Wind } from 'lucide-react';

const ProductDetailSkeleton = () => (
  <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 md:py-8">
    <Skeleton className="h-4 w-48 mb-8 rounded" />
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-24">
      <div className="lg:col-span-7 space-y-4 md:space-y-6">
        <Skeleton className="aspect-[4/5] w-full rounded-lg" />
        <div className="grid grid-cols-4 gap-2 md:gap-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="aspect-square rounded-lg" />
          ))}
        </div>
      </div>
      <div className="lg:col-span-5 space-y-6 md:space-y-8">
        <div className="space-y-4">
          <Skeleton className="h-4 w-32 rounded" />
          <Skeleton className="h-10 md:h-12 w-full rounded" />
          <Skeleton className="h-10 md:h-12 w-3/4 rounded" />
        </div>
        <Skeleton className="h-12 md:h-16 w-1/2 rounded" />
        <Skeleton className="h-24 md:h-32 w-full rounded" />
      </div>
    </div>
  </div>
);

export const ProductDetail = () => {
  const { currentProduct, addToCart, navigateTo, toggleWishlist, wishlist, productsLoading } = useStore();
  const [selectedSize, setSelectedSize] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [customization, setCustomization] = useState<{name: string, number: string, font: string}>({
    name: '',
    number: '',
    font: FONT_STYLES[0]
  });
  const [isCustomizing, setIsCustomizing] = useState(false);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [failedImages, setFailedImages] = useState<Set<number>>(new Set());
  const [showStickyBar, setShowStickyBar] = useState(false);

  useEffect(() => {
    window.scrollTo(0, 0);
    setActiveImageIndex(0);
    setFailedImages(new Set());
    
    setIsLoading(true);
    const timer = setTimeout(() => setIsLoading(false), 800);

    const handleScroll = () => {
      setShowStickyBar(window.scrollY > 450);
    };

    window.addEventListener('scroll', handleScroll);
    return () => {
      clearTimeout(timer);
      window.removeEventListener('scroll', handleScroll);
    };
  }, [currentProduct?.id]);

  if (!currentProduct) {
    if (productsLoading) return <div className="bg-white min-h-screen pt-4 md:pt-8"><ProductDetailSkeleton /></div>;
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center text-center px-6">
        <h1 className="text-2xl font-heading font-black text-brand-dark uppercase mb-3">Jersey not found</h1>
        <p className="text-gray-500 text-sm mb-8">This product may have been removed from the store.</p>
        <Button onClick={() => navigateTo('shop')} variant="black">Browse Shop</Button>
      </div>
    );
  }

  const soldOut = currentProduct.status === 'out-of-stock';

  const isWishlisted = wishlist.includes(currentProduct.id);
  const totalPrice = unitPrice(currentProduct.price, isCustomizing && isCustomized(customization));
  const gallery = currentProduct.gallery && currentProduct.gallery.length > 0 
    ? currentProduct.gallery 
    : [currentProduct.image, currentProduct.image, currentProduct.image, currentProduct.image];

  const getSafeImage = (src: string, index: number) => {
    if (failedImages.has(index)) {
      const bg = currentProduct.color || '1e293b';
      const text = ['F7B5CD', 'FCD116', 'FFFFFF'].includes(bg) ? '000000' : 'FFFFFF';
      return `https://placehold.co/800x1000/${bg}/${text}?text=${encodeURIComponent(currentProduct.team)}+View+${index + 1}&font=oswald`;
    }
    return src;
  };

  const nextImage = useCallback(() => {
    setActiveImageIndex(prev => (prev + 1) % gallery.length);
  }, [gallery.length]);

  const prevImage = useCallback(() => {
    setActiveImageIndex(prev => (prev - 1 + gallery.length) % gallery.length);
  }, [gallery.length]);

  const handleAddToCart = () => {
    if (!selectedSize) {
      const sizeSelector = document.getElementById('size-selector');
      if (sizeSelector) {
        sizeSelector.scrollIntoView({ behavior: 'smooth', block: 'center' });
        sizeSelector.classList.add('animate-pulse');
        setTimeout(() => sizeSelector.classList.remove('animate-pulse'), 1500);
      }
      return;
    }
    addToCart(currentProduct, selectedSize, isCustomizing ? customization : undefined);
  };

  if (isLoading) return <div className="bg-white min-h-screen pt-4 md:pt-8"><ProductDetailSkeleton /></div>;

  return (
    <div className="bg-white min-h-screen pb-24 md:pb-32 pt-4 md:pt-8 animate-fade-in relative">
      
      {/* Mobile Sticky CTA Bar */}
      <div 
        className={`lg:hidden fixed bottom-0 left-0 right-0 z-[110] bg-white/98 backdrop-blur-2xl border-t border-gray-100 px-5 py-4 pb-10 shadow-[0_-10px_40px_rgba(0,0,0,0.1)] transition-all duration-500 ease-[cubic-bezier(0.23,1,0.32,1)] ${
          showStickyBar ? 'translate-y-0 opacity-100' : 'translate-y-full opacity-0 pointer-events-none'
        }`}
      >
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          <div className="flex flex-col min-w-0">
            <span className="text-[8px] font-black text-gray-400 uppercase tracking-[0.1em] truncate mb-0.5">
              {selectedSize ? `Size ${selectedSize}` : 'Select Size'}
            </span>
            <span className="text-lg font-sport font-black text-brand-dark tracking-tight">
              {CURRENCY_SYMBOL}{totalPrice.toLocaleString()}
            </span>
          </div>
          <button 
            onClick={handleAddToCart}
            disabled={soldOut}
            className="flex-1 h-14 disabled:opacity-40 disabled:pointer-events-none bg-brand-dark text-white font-heading font-bold text-[10px] uppercase tracking-[0.2em] shadow-xl hover:bg-brand-crimson active:scale-95 transition-all flex items-center justify-center gap-3 rounded-full group"
          >
            <ShoppingBag size={18} />
            <span>{soldOut ? 'SOLD OUT' : 'ADD TO BAG'}</span>
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8 mb-6">
        <Breadcrumbs items={[{ label: 'Shop', view: 'shop' as const }, { label: currentProduct.name }]} />
      </div>

      <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-20">
          
          <div className="lg:col-span-7 space-y-4 md:space-y-6">
            <div className="aspect-[4/5] bg-gray-50 relative group overflow-hidden shadow-2xl rounded-xl">
               <img 
                src={getSafeImage(gallery[activeImageIndex], activeImageIndex)} 
                alt={currentProduct.name} 
                className="w-full h-full object-cover" 
               />
               
               <div className="absolute inset-y-0 left-0 right-0 flex items-center justify-between px-3 md:px-4 pointer-events-none">
                  <button onClick={(e) => { e.stopPropagation(); prevImage(); }} className="p-2.5 sm:p-3 bg-white/90 backdrop-blur rounded-full shadow-lg pointer-events-auto active:scale-90 transition-transform"><ChevronLeft size={20} /></button>
                  <button onClick={(e) => { e.stopPropagation(); nextImage(); }} className="p-2.5 sm:p-3 bg-white/90 backdrop-blur rounded-full shadow-lg pointer-events-auto active:scale-90 transition-transform"><ChevronRight size={20} /></button>
               </div>

               {isCustomizing && customization.number && (
                 <div className="absolute inset-0 flex items-center justify-center bg-black/30 backdrop-blur-sm z-20 animate-fade-in">
                    <div className="bg-white shadow-2xl p-6 md:p-8 text-center min-w-[200px] md:min-w-[240px] rounded-xl border-t-4 border-brand-crimson scale-90 md:scale-100">
                      <p className="text-[8px] md:text-[10px] text-gray-400 uppercase tracking-widest mb-4">Preview</p>
                      <div className="font-sport font-bold text-7xl md:text-8xl text-brand-dark mb-2">{customization.number}</div>
                      <div className="font-heading font-bold text-xl md:text-2xl uppercase text-brand-dark tracking-widest truncate">{customization.name || 'NAME'}</div>
                    </div>
                 </div>
               )}
            </div>
            
            <div className="grid grid-cols-4 gap-2 md:gap-4 overflow-x-auto no-scrollbar py-2">
              {gallery.map((img, i) => (
                <button 
                    key={i} 
                    className={`aspect-square bg-gray-50 cursor-pointer border-2 rounded-lg transition-all ${activeImageIndex === i ? 'border-brand-dark ring-2 ring-brand-dark/10' : 'border-transparent opacity-60'}`}
                    onClick={() => setActiveImageIndex(i)}
                >
                  <img src={getSafeImage(img, i)} alt={`Thumbnail ${i + 1}`} className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          </div>

          <div className="lg:col-span-5 self-start space-y-8">
            <Reveal delay={0.1}>
              <div className="space-y-3">
                 <div className="flex justify-between items-start">
                    <h2 className="text-[9px] md:text-xs font-black text-brand-crimson uppercase tracking-[0.2em]">{currentProduct.team} • {currentProduct.season}</h2>
                    <button className="text-gray-300 p-2 hover:bg-gray-50 rounded-full active:scale-90 transition-all"><Share2 size={18} /></button>
                 </div>
                 <h1 className="text-3xl md:text-5xl font-heading font-black text-brand-dark leading-tight tracking-tight uppercase">{currentProduct.name}</h1>
                 <div className="flex items-center gap-3">
                    <div className="flex items-center text-brand-gold text-[10px]">
                      {[...Array(5)].map((_, i) => <Star key={i} size={12} fill={i < Math.floor(currentProduct.rating) ? "currentColor" : "none"} className={i < Math.floor(currentProduct.rating) ? "" : "text-gray-200"} />)}
                    </div>
                    <span className="text-gray-400 text-[9px] font-bold uppercase tracking-widest border-l border-gray-100 pl-3">{currentProduct.reviews} Verified Reviews</span>
                 </div>
              </div>
            </Reveal>

            <Reveal delay={0.2}>
              <div className="flex items-baseline gap-3 border-b border-gray-50 pb-6">
                <span className="text-3xl md:text-4xl font-sport font-bold text-brand-dark">{CURRENCY_SYMBOL}{totalPrice.toLocaleString()}</span>
                {currentProduct.originalPrice && <span className="text-lg text-gray-300 line-through font-sport">{CURRENCY_SYMBOL}{currentProduct.originalPrice.toLocaleString()}</span>}
              </div>
            </Reveal>

            <Reveal delay={0.3}>
              <div className="space-y-6">
                <p className="text-gray-500 leading-relaxed text-sm md:text-base font-light">
                  {currentProduct.description}
                </p>

                <div className="grid grid-cols-2 gap-3">
                   <div className="flex items-center gap-3 p-3 bg-gray-50/50 rounded-lg border border-gray-100">
                      <Wind size={14} className="text-brand-crimson" />
                      <div className="flex flex-col">
                         <span className="text-[8px] font-bold text-gray-400 uppercase tracking-widest">Cooling</span>
                         <span className="text-[10px] font-bold text-brand-dark">ADV Tech</span>
                      </div>
                   </div>
                   <div className="flex items-center gap-3 p-3 bg-gray-50/50 rounded-lg border border-gray-100">
                      <Droplets size={14} className="text-blue-500" />
                      <div className="flex flex-col">
                         <span className="text-[8px] font-bold text-gray-400 uppercase tracking-widest">Wicking</span>
                         <span className="text-[10px] font-bold text-brand-dark">Quick-Dry</span>
                      </div>
                   </div>
                </div>
              </div>
            </Reveal>

            <Reveal delay={0.4}>
              <div className="space-y-4" id="size-selector">
                <div className="flex justify-between items-center">
                  <span className="text-[10px] font-black uppercase tracking-widest text-brand-dark">Select Size</span>
                  <button className="text-gray-400 text-[10px] uppercase font-bold tracking-widest border-b border-gray-100">
                    Size Guide
                  </button>
                </div>
                <div className="grid grid-cols-5 gap-2">
                  {AVAILABLE_SIZES.map(size => (
                    <button
                      key={size}
                      onClick={() => setSelectedSize(size)}
                      className={`h-11 sm:h-12 border transition-all text-xs font-bold rounded-lg ${selectedSize === size ? 'border-brand-dark bg-brand-dark text-white shadow-lg scale-105' : 'border-gray-100 text-gray-500 active:bg-gray-50'}`}
                    >
                      {size}
                    </button>
                  ))}
                </div>
              </div>
            </Reveal>

            <Reveal delay={0.5}>
              <div className={`p-4 sm:p-6 border rounded-xl transition-all ${isCustomizing ? 'border-brand-dark bg-gray-50/50' : 'border-gray-100'}`}>
                <div className="flex items-center justify-between cursor-pointer" onClick={() => setIsCustomizing(!isCustomizing)}>
                  <div className="flex items-center gap-3">
                    <div className={`w-5 h-5 border flex items-center justify-center rounded ${isCustomizing ? 'bg-brand-dark border-brand-dark text-white' : 'border-gray-300 bg-white'}`}>
                      {isCustomizing && <Check size={12} />}
                    </div>
                    <span className="font-heading font-bold text-xs uppercase tracking-wider text-brand-dark">Customization</span>
                  </div>
                  <span className="text-xs font-bold text-brand-dark font-sport">+৳800</span>
                </div>

                <div className={`grid transition-all duration-300 overflow-hidden ${isCustomizing ? 'grid-rows-[1fr] opacity-100 mt-5 pt-5 border-t border-gray-100' : 'grid-rows-[0fr] opacity-0'}`}>
                  <div className="min-h-0 space-y-4">
                    <div>
                      <label className="block text-[8px] font-bold uppercase tracking-widest text-gray-400 mb-2">Name</label>
                      <input type="text" maxLength={12} placeholder="PLAYER NAME" value={customization.name} onChange={e => setCustomization({...customization, name: e.target.value.toUpperCase()})} className="w-full bg-white border border-gray-100 p-3 text-sm uppercase font-heading focus:ring-1 focus:ring-brand-dark outline-none tracking-widest rounded-lg" />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[8px] font-bold uppercase tracking-widest text-gray-400 mb-2">Number</label>
                        <input type="number" max={99} placeholder="10" value={customization.number} onChange={e => setCustomization({...customization, number: e.target.value})} className="w-full bg-white border border-gray-100 p-3 text-sm font-sport focus:ring-1 focus:ring-brand-dark outline-none text-center rounded-lg" />
                      </div>
                      <div>
                        <label className="block text-[8px] font-bold uppercase tracking-widest text-gray-400 mb-2">Font Style</label>
                        <select value={customization.font} onChange={e => setCustomization({...customization, font: e.target.value})} className="w-full bg-white border border-gray-100 p-3 text-sm appearance-none outline-none font-bold text-gray-700 rounded-lg">
                          {FONT_STYLES.map(f => <option key={f} value={f}>{f}</option>)}
                        </select>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </Reveal>

            <Reveal delay={0.6}>
              <div className="flex gap-3 pt-4">
                <Button onClick={handleAddToCart} disabled={soldOut} fullWidth variant="primary" className="h-14 sm:h-16 text-xs sm:text-lg flex-1 rounded-full">
                  {soldOut ? 'Sold Out' : <>{currentProduct.status === 'pre-order' ? 'Pre-order' : 'Add to Cart'} — {CURRENCY_SYMBOL}{totalPrice.toLocaleString()}</>}
                </Button>
                <button onClick={() => toggleWishlist(currentProduct.id)} className={`h-14 w-14 sm:h-16 sm:w-16 flex items-center justify-center border rounded-full transition-all active:scale-90 ${isWishlisted ? 'bg-red-50 border-brand-crimson text-brand-crimson' : 'border-gray-100 text-gray-300'}`}>
                  <Heart size={20} fill={isWishlisted ? "currentColor" : "none"} />
                </button>
              </div>
            </Reveal>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-4">
                 <Reveal delay={0.7} className="w-full">
                   <div className="p-4 bg-gray-50 rounded-xl space-y-2 border border-gray-100 flex items-center gap-4 sm:flex-col sm:items-start sm:gap-2">
                     <Shield className="text-brand-dark shrink-0" size={18} />
                     <div>
                        <h4 className="font-bold text-[10px] text-brand-dark uppercase tracking-widest">Certified Gear</h4>
                        <p className="text-[9px] text-gray-400 leading-tight">100% Authentic Quality</p>
                     </div>
                   </div>
                 </Reveal>
                 <Reveal delay={0.8} className="w-full">
                   <div className="p-4 bg-gray-50 rounded-xl space-y-2 border border-gray-100 flex items-center gap-4 sm:flex-col sm:items-start sm:gap-2">
                     <Truck className="text-brand-dark shrink-0" size={18} />
                     <div>
                        <h4 className="font-bold text-[10px] text-brand-dark uppercase tracking-widest">Fast Delivery</h4>
                        <p className="text-[9px] text-gray-400 leading-tight">3-5 Day Nationwide</p>
                     </div>
                   </div>
                 </Reveal>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
