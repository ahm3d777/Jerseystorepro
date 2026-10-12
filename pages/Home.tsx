
import React, { useEffect, useState } from 'react';
import { useStore } from '../context/StoreContext';
import { Button, Reveal } from '../components/UI';
import { ProductCard, ProductCardSkeleton } from '../components/ProductCard';
import { ASSETS } from '../assets/images';
import { ArrowRight, ShieldCheck, Truck, Clock, Flame, Star, ChevronRight, Users, CheckCircle, Sparkles, Zap, Activity, Cpu, Layers, Trophy, Timer, Thermometer, Wind, Target, CreditCard, RefreshCw, Gauge, Fingerprint } from 'lucide-react';

const MarqueeItem = () => (
  <div className="flex items-center gap-12 md:gap-24 shrink-0">
    <span className="flex items-center gap-3 md:gap-4 group-hover:text-brand-gold transition-colors duration-500">
      <Star size={16} className="text-brand-gold fill-brand-gold animate-pulse" />
      <span className="font-heading font-black text-white tracking-widest">Free Shipping Over ৳2,000</span>
    </span>
    <span className="text-white/30 text-2xl font-light">/</span>
    <span className="flex items-center gap-3 md:gap-4">
      <ShieldCheck size={18} className="text-brand-gold" />
      <span className="font-heading font-black text-white tracking-widest">Authentic Kit Guarantee</span>
    </span>
    <span className="text-white/30 text-2xl font-light">/</span>
    <span className="flex items-center gap-3 md:gap-4">
      <CreditCard size={18} className="text-brand-gold" />
      <span className="font-heading font-black text-white tracking-widest">bKash EMI Available</span>
    </span>
    <span className="text-white/30 text-2xl font-light">/</span>
    <span className="flex items-center gap-3 md:gap-4">
      <RefreshCw size={18} className="text-brand-gold animate-spin-slow" />
      <span className="font-heading font-black text-white tracking-widest">Premium Returns Policy</span>
    </span>
    <span className="text-white/30 text-2xl font-light">/</span>
  </div>
);

export const Home = () => {
  const { navigateTo, setCategory, products } = useStore();
  const [isVisible, setIsVisible] = useState(false);
  const [isLoadingFeatured, setIsLoadingFeatured] = useState(true);
  const [stockRemaining, setStockRemaining] = useState(12);
  const [currentHeroIndex, setCurrentHeroIndex] = useState(0);

  const heroImages = [ASSETS.UI.HERO_BG, ASSETS.UI.HERO_BG_ALT];

  useEffect(() => {
    setIsVisible(true);
    const timer = setTimeout(() => setIsLoadingFeatured(false), 1200);
    
    const heroTimer = setInterval(() => {
      setCurrentHeroIndex(prev => (prev + 1) % heroImages.length);
    }, 5000);

    const stockTimer = setInterval(() => {
      setStockRemaining(prev => Math.max(2, prev - (Math.random() > 0.9 ? 1 : 0)));
    }, 8000);

    return () => {
      clearTimeout(timer);
      clearInterval(heroTimer);
      clearInterval(stockTimer);
    };
  }, []);

  const featuredProducts = products.slice(0, 4);
  const specialJersey = products.find(p => p.type === 'Special') || products[0];

  return (
    <div className="animate-fade-in overflow-hidden">
      
      {/* Cinematic Hero Section */}
      <section className="relative h-[85vh] md:h-screen min-h-[550px] w-full overflow-hidden flex items-center justify-center bg-brand-dark">
        <div className="absolute inset-0 z-0">
          {heroImages.map((img, index) => (
            <div 
              key={index}
              className={`absolute inset-0 transition-all duration-[2500ms] md:duration-[3000ms] ease-in-out transform ${
                currentHeroIndex === index 
                  ? 'opacity-60 scale-105 md:scale-110 translate-x-0 blur-0' 
                  : 'opacity-0 scale-115 md:scale-125 translate-x-10 md:translate-x-20 blur-sm'
              }`}
            >
              <img 
                src={img} 
                alt={`Hero Background ${index + 1}`} 
                className="w-full h-full object-cover"
              />
            </div>
          ))}
          <div className="absolute inset-0 bg-gradient-to-t from-brand-dark via-brand-dark/40 to-transparent z-10"></div>
          <div className="absolute inset-0 bg-brand-dark/20 mix-blend-multiply z-10"></div>
        </div>
        
        <div className={`relative z-20 text-center max-w-6xl px-4 md:px-4 flex flex-col items-center transition-all duration-1000 ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-10 md:translate-y-20 opacity-0'}`}>
          <div className="mb-5 md:mb-8 animate-float">
             <span className="inline-flex items-center gap-2 md:gap-3 py-1.5 md:py-2 px-4 md:px-6 border border-white/10 rounded-full bg-white/5 backdrop-blur-xl text-white text-[9px] md:text-xs font-bold uppercase tracking-[0.15em] md:tracking-[0.25em] shadow-2xl">
                <Star size={10} className="text-brand-gold fill-brand-gold" />
                <span>Official 2025/26 Season</span>
                <Star size={10} className="text-brand-gold fill-brand-gold" />
             </span>
          </div>

          <h1 className="text-4xl sm:text-5xl md:text-8xl lg:text-9xl font-heading font-black text-white mb-6 tracking-tighter leading-[1.1] md:leading-[0.9]">
            <span className="block text-outline opacity-40 select-none uppercase text-3xl sm:text-4xl md:text-7xl lg:text-8xl">Authentic</span>
            <span className="text-transparent bg-clip-text bg-gradient-to-b from-white via-white to-gray-400 drop-shadow-2xl uppercase">
              Performance
            </span>
          </h1>
          
          <p className="text-sm sm:text-base md:text-xl text-gray-300 mb-8 md:mb-10 max-w-2xl mx-auto font-light leading-relaxed px-4 sm:px-0">
            Sourced directly from Europe's elite clubs. Engineered for the athlete, designed for the fan.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 md:gap-6 justify-center w-full max-w-xs sm:max-w-none">
            <Button onClick={() => navigateTo('shop')} variant="primary" className="w-full sm:min-w-[200px] border-none shadow-xl h-14 md:h-12 text-[10px] sm:text-xs">
              Shop New Arrivals
            </Button>
            <Button onClick={() => navigateTo('shop')} variant="outline" className="w-full sm:min-w-[200px] text-white border-white/20 backdrop-blur-sm h-14 md:h-12 text-[10px] sm:text-xs">
              Explore Collections
            </Button>
          </div>
        </div>

        <div className="absolute bottom-6 md:bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 animate-bounce opacity-30 z-20">
           <div className="w-[1px] h-6 md:h-12 bg-gradient-to-b from-white to-transparent"></div>
        </div>
      </section>

      {/* Improved Marquee Strip */}
      <div className="marquee-container bg-gradient-to-r from-brand-crimson via-brand-crimsonDark to-brand-crimson py-4 md:py-6 overflow-hidden relative z-20 group select-none shadow-[0_4px_30px_rgba(212,13,54,0.3)] border-y border-white/5">
        <div className="absolute inset-0 glass-shimmer opacity-10 pointer-events-none"></div>
        <div className="flex w-[200%] animate-marquee whitespace-nowrap items-center text-[10px] md:text-xs uppercase tracking-[0.2em]">
            <MarqueeItem />
            <MarqueeItem />
        </div>
      </div>

      {/* Trending Section */}
      <section className="py-12 md:py-24 bg-brand-offWhite relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8 relative z-10">
          <Reveal>
            <div className="flex flex-row justify-between items-end mb-8 md:mb-12 gap-4">
              <div>
                <span className="flex items-center gap-2 text-brand-crimson font-bold text-[9px] md:text-xs uppercase tracking-[0.2em] mb-2">
                   <div className="w-5 md:w-8 h-[2px] bg-brand-crimson"></div>
                   Weekly Drop
                </span>
                <h2 className="text-2xl sm:text-3xl md:text-5xl font-heading font-bold text-brand-dark">Trending</h2>
              </div>
              <button onClick={() => navigateTo('shop')} className="group flex items-center gap-1.5 text-[9px] sm:text-xs font-bold uppercase tracking-widest text-gray-400 hover:text-brand-crimson transition-all mb-1">
                View All <ChevronRight size={14} className="group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          </Reveal>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-x-3 md:gap-x-6 gap-y-6 md:gap-y-12 mb-12 md:mb-20">
            {isLoadingFeatured ? (
              [...Array(4)].map((_, i) => (
                <ProductCardSkeleton key={i} />
              ))
            ) : (
              featuredProducts.map((product, idx) => (
                <Reveal key={product.id} delay={idx * 0.1}>
                  <ProductCard product={product} />
                </Reveal>
              ))
            )}
          </div>

          {/* PLAYER EDITION: PERFORMANCE TIER SECTION */}
          <Reveal>
            <div className="relative w-full rounded-2xl md:rounded-[40px] overflow-hidden bg-brand-dark shadow-2xl mb-12 md:mb-24">
               {/* Technical Background */}
               <div className="absolute inset-0 opacity-40">
                  <img 
                    src={ASSETS.UI.PLAYER_EDITION_IMMERSION} 
                    alt="Player Edition Background" 
                    className="w-full h-full object-cover mix-blend-overlay scale-110 grayscale-[0.2]"
                  />
               </div>
               <div className="absolute inset-0 bg-gradient-to-r from-brand-dark via-brand-dark/80 to-transparent z-10"></div>
               
               <div className="relative z-20 grid grid-cols-1 lg:grid-cols-2 p-8 md:p-20 items-center gap-12">
                  <div className="space-y-8">
                     <div>
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-gold/10 border border-brand-gold/30 text-brand-gold text-[10px] font-black uppercase tracking-[0.3em] mb-6">
                           <Trophy size={14} fill="currentColor" /> ELITE PERFORMANCE TIER
                        </div>
                        <h2 className="text-4xl md:text-7xl font-heading font-black text-white leading-[0.9] tracking-tighter uppercase mb-6">
                           PLAYER <br/>
                           <span className="text-transparent bg-clip-text bg-gradient-to-b from-white via-white/80 to-gray-500">EDITION ADV</span>
                        </h2>
                        <p className="text-gray-400 text-sm md:text-lg max-w-lg leading-relaxed font-light">
                           Engineered for the match-day environment. Our Player Edition kits feature the exact same specifications worn by professionals on the pitch.
                        </p>
                     </div>

                     <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        <div className="space-y-3">
                           <div className="flex justify-between items-end">
                              <span className="text-[10px] font-bold text-white uppercase tracking-widest flex items-center gap-2">
                                 <Wind size={14} className="text-brand-gold" /> Breathability
                              </span>
                              <span className="text-brand-gold text-[10px] font-bold">100%</span>
                           </div>
                           <div className="h-1 bg-white/10 rounded-full overflow-hidden">
                              <div className="h-full bg-brand-gold w-full animate-pulse"></div>
                           </div>
                        </div>
                        <div className="space-y-3">
                           <div className="flex justify-between items-end">
                              <span className="text-[10px] font-bold text-white uppercase tracking-widest flex items-center gap-2">
                                 <Zap size={14} className="text-brand-gold" /> Weight
                              </span>
                              <span className="text-brand-gold text-[10px] font-bold">Ultralight</span>
                           </div>
                           <div className="h-1 bg-white/10 rounded-full overflow-hidden">
                              <div className="h-full bg-brand-gold w-[95%]"></div>
                           </div>
                        </div>
                     </div>

                     <div className="flex flex-wrap gap-4 pt-4">
                        <div className="flex items-center gap-3 bg-white/5 border border-white/10 px-4 py-3 rounded-xl backdrop-blur-md">
                           <Layers size={18} className="text-brand-gold" />
                           <div className="flex flex-col">
                              <span className="text-[9px] font-black text-white uppercase tracking-widest leading-none mb-1">Dri-FIT ADV</span>
                              <span className="text-[8px] text-gray-500 uppercase font-bold tracking-widest">Active Cooling</span>
                           </div>
                        </div>
                        <div className="flex items-center gap-3 bg-white/5 border border-white/10 px-4 py-3 rounded-xl backdrop-blur-md">
                           <Fingerprint size={18} className="text-brand-gold" />
                           <div className="flex flex-col">
                              <span className="text-[9px] font-black text-white uppercase tracking-widest leading-none mb-1">HEAT-APPLIED</span>
                              <span className="text-[8px] text-gray-500 uppercase font-bold tracking-widest">Zero-Friction Crest</span>
                           </div>
                        </div>
                     </div>

                     <Button 
                        onClick={() => { setCategory('All'); navigateTo('shop'); }} 
                        variant="primary" 
                        className="h-16 px-10 rounded-full shadow-2xl shadow-brand-crimson/30"
                     >
                        Explore Elite Collection <ChevronRight size={18} />
                     </Button>
                  </div>

                  <div className="relative hidden lg:flex items-center justify-center">
                     <div className="absolute inset-0 bg-brand-crimson/20 blur-[150px] rounded-full"></div>
                     <div className="relative group perspective-1000">
                        <img 
                           src={ASSETS.PRODUCTS.MESSI_MVP_2025} 
                           alt="Technical View" 
                           className="w-full max-w-md rounded-2xl shadow-[0_40px_80px_rgba(0,0,0,0.8)] border border-white/10 group-hover:scale-[1.02] transition-transform duration-700"
                        />
                        <div className="absolute -bottom-6 -right-6 bg-white p-6 rounded-2xl shadow-2xl border border-gray-100 animate-float-delayed">
                           <Gauge size={32} className="text-brand-crimson mb-2" />
                           <div className="text-[10px] font-black text-brand-dark uppercase tracking-widest mb-1">Performance Knit</div>
                           <div className="text-[8px] text-gray-400 font-bold uppercase tracking-widest">Archival Textured Grid</div>
                        </div>
                     </div>
                  </div>
               </div>
            </div>
          </Reveal>

          {/* Limited Edition Drop CTA Card */}
          <Reveal>
            <div className="relative group w-full aspect-[16/10] sm:aspect-[16/9] md:aspect-[21/9] min-h-[380px] sm:min-h-[400px] md:min-h-[500px] bg-brand-dark rounded-xl sm:rounded-2xl md:rounded-3xl overflow-hidden shadow-[0_20px_60px_rgba(0,0,0,0.5)] border border-white/10 mb-12 md:mb-20">
              <div className="absolute inset-0 z-0 overflow-hidden">
                <img 
                  src={ASSETS.UI.RETRO_BG}
                  alt="Golden Era Pitch"
                  className="w-full h-full object-cover opacity-50 animate-zoom-in-slow scale-110"
                />
                <div className="absolute inset-0 bg-gradient-to-r from-brand-dark via-brand-dark/95 sm:via-brand-dark/90 to-transparent"></div>
              </div>

              <div className="relative z-10 h-full flex flex-col justify-center p-6 sm:p-10 md:p-16 lg:p-24 max-w-full md:max-w-3xl">
                <div className="flex items-center gap-2 mb-6 sm:mb-8">
                   <div className="flex items-center gap-1.5 bg-brand-crimson px-2 sm:px-3 py-1 rounded-sm shadow-[0_0_20px_rgba(212,13,54,0.4)]">
                      <div className="w-1 h-1 bg-white rounded-full animate-pulse"></div>
                      <span className="text-white text-[8px] sm:text-[9px] font-black uppercase tracking-[0.3em]">RETRO</span>
                   </div>
                   <span className="text-brand-gold text-[8px] sm:text-[9px] font-bold uppercase tracking-[0.2em] border-l border-white/20 pl-2">GOLDEN ERA</span>
                </div>
                
                <h2 className="text-3xl sm:text-5xl md:text-8xl font-heading font-black text-white mb-4 sm:mb-6 leading-[0.9] tracking-tighter uppercase">
                   GOLDEN <br/>
                   <span className="text-transparent bg-clip-text bg-gradient-to-b from-brand-gold via-brand-goldLight to-brand-gold drop-shadow-xl">ERA RETRO</span>
                </h2>
                
                <p className="text-gray-400 text-xs sm:text-sm md:text-lg mb-8 sm:mb-10 max-w-md leading-relaxed font-light">
                   Iconic 1998 silhouette restored with modern ADV cooling technology. Archival accuracy meets elite performance.
                </p>

                <div className="flex flex-col sm:flex-row items-center gap-6 sm:gap-12">
                   <button 
                    onClick={() => navigateTo('product', specialJersey)}
                    className="group relative h-14 sm:h-16 md:h-24 w-full sm:w-auto px-8 sm:px-12 md:px-20 bg-brand-gold text-brand-dark font-heading font-black text-xs sm:text-sm md:text-2xl uppercase tracking-widest rounded-full shadow-2xl active:scale-95 overflow-hidden flex items-center justify-center transition-all"
                   >
                     <span className="relative z-10 flex items-center gap-3">
                       Explore Drop <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                     </span>
                     <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-500"></div>
                   </button>
                   
                   <div className="flex items-center gap-6 sm:gap-4">
                      <div className="flex items-center gap-2 text-white">
                        <Timer size={20} className="text-brand-gold md:w-6 md:h-6" />
                        <div className="flex flex-col">
                          <span className="text-[8px] font-bold text-gray-500 uppercase tracking-widest leading-none mb-1">Time Left</span>
                          <span className="text-xs sm:text-sm md:text-base font-sport font-bold text-white tracking-[0.05em]">02 : 14 : 58</span>
                        </div>
                      </div>

                      <div className="flex flex-col gap-1 min-w-[100px] sm:min-w-[120px]">
                        <div className="flex justify-between text-[8px] font-bold uppercase tracking-widest text-gray-400">
                          <span>Units</span>
                          <span className="text-brand-gold">{stockRemaining}</span>
                        </div>
                        <div className="h-1 w-full bg-white/10 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-brand-gold shadow-[0_0_8px_#CFA238] transition-all duration-1000" 
                            style={{ width: `${(stockRemaining / 40) * 100}%` }}
                          ></div>
                        </div>
                      </div>
                   </div>
                </div>
              </div>
            </div>
          </Reveal>

          {/* Special Edition Card */}
          <Reveal>
            <div className="relative w-full rounded-xl sm:rounded-2xl md:rounded-3xl overflow-hidden bg-brand-dark p-0.5 shadow-2xl">
              <div className="relative bg-[#0A0A0C] rounded-[calc(0.75rem-1px)] sm:rounded-[calc(1.5rem-2px)] grid grid-cols-1 lg:grid-cols-12 overflow-hidden border border-white/5">
                
                {/* Background Image for MVP Section */}
                <div className="absolute inset-0 z-0 opacity-20">
                    <img src={ASSETS.UI.MVP_BG} alt="MVP Background" className="w-full h-full object-cover mix-blend-screen" />
                </div>

                <div className="lg:col-span-5 relative h-64 sm:h-80 md:h-[500px] overflow-hidden bg-[#0D0D10]/50 backdrop-blur-sm z-10">
                    <div className="absolute inset-0 flex items-center justify-center p-6 z-10">
                      <div className="relative group scale-90 sm:scale-100">
                        <img 
                          src={specialJersey.image} 
                          alt={specialJersey.name}
                          className="w-full max-w-[200px] sm:max-w-[280px] md:max-w-[320px] drop-shadow-[0_20px_40px_rgba(212,13,54,0.4)] animate-float"
                        />
                        <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 whitespace-nowrap bg-white text-brand-dark font-heading font-black text-[10px] sm:text-xs md:text-xl px-4 sm:px-6 md:px-10 py-2 sm:py-3 md:py-4 rounded-sm shadow-xl z-30 border-b-2 md:border-b-4 border-brand-crimson">
                          MESSI MVP 2025
                        </div>
                      </div>
                    </div>
                </div>

                <div className="lg:col-span-7 p-6 sm:p-10 md:p-16 flex flex-col justify-center items-start relative z-10">
                   <div className="inline-flex items-center gap-2 text-brand-gold font-bold text-[9px] md:text-xs uppercase tracking-[0.2em] mb-6 bg-brand-gold/10 px-3 md:px-5 py-1.5 md:py-2 rounded-full border border-brand-gold/20 backdrop-blur-md">
                      <Sparkles size={12} fill="currentColor" /> 
                      COMMEMORATIVE
                   </div>
                   
                   <h2 className="text-3xl sm:text-4xl md:text-7xl font-heading font-black text-white mb-6 leading-none tracking-tighter uppercase">
                      THE <span className="text-brand-crimson">MVP</span> <br className="hidden sm:block" />
                      LEGACY.
                   </h2>

                   <p className="text-gray-400 text-xs sm:text-sm md:text-lg mb-8 max-w-xl leading-relaxed font-light">
                      A celebration of excellence featuring official player-spec performance fabric and archival details.
                   </p>

                   <div className="grid grid-cols-2 gap-4 sm:gap-6 mb-8 w-full max-w-lg">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-brand-crimson backdrop-blur-sm">
                           <Zap size={14} />
                        </div>
                        <span className="text-white font-bold text-[10px] sm:text-xs uppercase tracking-wider">Elite Grade</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-brand-gold backdrop-blur-sm">
                           <Trophy size={14} />
                        </div>
                        <span className="text-white font-bold text-[10px] sm:text-xs uppercase tracking-wider">Limited Drop</span>
                      </div>
                   </div>

                   <Button 
                    onClick={() => navigateTo('product', specialJersey)} 
                    variant="primary" 
                    className="h-14 sm:h-16 w-full sm:w-auto px-8 sm:px-12 text-xs sm:text-sm md:text-lg shadow-xl"
                   >
                     Secure MVP Kit — ৳{specialJersey.price.toLocaleString()}
                   </Button>
                </div>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* Trust Badges */}
      <section className="py-12 md:py-24 bg-brand-dark px-4">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 md:gap-8">
            {[
                { icon: ShieldCheck, title: "Certified", desc: "Verified holographic tags on every jersey." },
                { icon: Truck, title: "Fast Shipping", desc: "Express logistics to your doorstep." },
                { icon: Flame, title: "Authentic", desc: "Official match-grade performance fabrics." }
            ].map((feature, i) => (
                <Reveal key={i} delay={i * 0.1}>
                  <div className="p-6 md:p-10 rounded-xl bg-white/5 border border-white/10 flex items-center sm:flex-col sm:text-center gap-4 sm:gap-6">
                      <div className="w-10 h-10 sm:w-16 sm:h-16 bg-white/5 rounded-xl flex items-center justify-center text-white shrink-0">
                          <feature.icon size={20} className="sm:w-8 sm:h-8" />
                      </div>
                      <div>
                        <h3 className="font-heading font-bold text-xs sm:text-xl uppercase tracking-wider text-white mb-1 sm:mb-4">{feature.title}</h3>
                        <p className="text-[10px] sm:text-sm text-gray-400 leading-tight sm:leading-relaxed">{feature.desc}</p>
                      </div>
                  </div>
                </Reveal>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};
