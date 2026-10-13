import React, { useEffect, useState, useMemo } from 'react';
import { useStore, matchesCategoryFilter } from '../context/StoreContext';
import { ProductCard, ProductCardSkeleton } from '../components/ProductCard';
import { ASSETS } from '../assets/images';
import { CURRENCY_SYMBOL } from '../constants';
import {
  ArrowRight,
  ShieldCheck,
  Wallet,
  QrCode,
  Truck,
  Award,
  Wind,
  Gauge,
  Snowflake,
  Shield,
  History,
  Timer,
  ShoppingBag,
  Sparkles,
  Rocket,
  RefreshCw,
  X,
  CheckCircle2
} from 'lucide-react';

const HOME_FILTER_TABS = [
  { label: 'All Drops', value: 'All Drops' },
  { label: 'La Liga', value: 'La Liga' },
  { label: 'Premier League', value: 'Premier League' },
  { label: 'International', value: 'International' },
  { label: 'Retro 90s', value: 'Retro 90s' }
];

export const Home = () => {
  const { navigateTo, setCategory, products, productsLoading } = useStore();
  const [selectedTab, setSelectedTab] = useState<string>('All Drops');
  const [stockRemaining, setStockRemaining] = useState(12);
  const [totalSeconds, setTotalSeconds] = useState(2 * 3600 + 14 * 60 + 58);
  const [heroBgIndex, setHeroBgIndex] = useState(0);
  const [showOriginModal, setShowOriginModal] = useState(false);

  // Mix both studio arena background from code.html and original stadium photography
  const heroBackgrounds = [
    ASSETS.UI.HERO_STUDIO_ARENA,
    ASSETS.UI.HERO_BG,
    ASSETS.UI.HERO_BG_ALT
  ];

  useEffect(() => {
    const heroInterval = setInterval(() => {
      setHeroBgIndex((prev) => (prev + 1) % heroBackgrounds.length);
    }, 6000);

    const countdownInterval = setInterval(() => {
      setTotalSeconds((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);

    const stockInterval = setInterval(() => {
      setStockRemaining((prev) => Math.max(4, prev - (Math.random() > 0.92 ? 1 : 0)));
    }, 9000);

    return () => {
      clearInterval(heroInterval);
      clearInterval(countdownInterval);
      clearInterval(stockInterval);
    };
  }, [heroBackgrounds.length]);

  const formattedCountdown = useMemo(() => {
    const hours = String(Math.floor(totalSeconds / 3600)).padStart(2, '0');
    const minutes = String(Math.floor((totalSeconds % 3600) / 60)).padStart(2, '0');
    const seconds = String(totalSeconds % 60).padStart(2, '0');
    return `${hours} : ${minutes} : ${seconds}`;
  }, [totalSeconds]);

  const displayedProducts = useMemo(() => {
    const filtered = products.filter((p) => matchesCategoryFilter(p, selectedTab));
    return (filtered.length > 0 ? filtered : products).slice(0, 4);
  }, [products, selectedTab]);

  const specialJersey = useMemo(
    () => products.find((p) => p.id === '10' || p.type === 'Special') || products[0],
    [products]
  );

  return (
    <div className="flex flex-col w-full animate-fade-in">
      {/* Proof of Origin Modal for Commemorative Section */}
      {showOriginModal && (
        <div
          className="fixed inset-0 z-[150] bg-black/75 backdrop-blur-md flex items-center justify-center p-4"
          onClick={() => setShowOriginModal(false)}
        >
          <div
            className="w-full max-w-lg rounded-2xl bg-surface-charcoal border border-surface-border p-6 sm:p-8 shadow-2xl space-y-5"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-surface-border pb-4">
              <div className="flex items-center gap-2.5">
                <span className="px-2.5 py-1 rounded bg-secondary/20 text-secondary font-label-caps text-label-caps uppercase font-bold">
                  NFC PROVENANCE
                </span>
                <span className="font-label-caps text-label-caps text-text-muted">BATCH #042 / 100</span>
              </div>
              <button
                type="button"
                onClick={() => setShowOriginModal(false)}
                className="p-1.5 rounded-lg bg-surface-charcoal-elevated text-text-muted hover:text-on-surface"
                aria-label="Close modal"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-3">
              <h3 className="font-headline-md text-headline-md font-bold text-on-surface uppercase tracking-tight">
                Messi MVP 2025 Vault Certificate
              </h3>
              <p className="font-body-md text-body-md text-text-muted">
                Every commemorative jersey in our Banani Vault is authenticated with an encrypted holographic NFC tag
                and manufacturer lot number.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 text-left">
              <div className="p-3.5 rounded-xl bg-surface-charcoal-elevated border border-surface-border">
                <div className="font-label-caps text-[10px] uppercase text-text-muted">CHASSIS WEAVE</div>
                <div className="font-headline-md text-body-md font-bold text-on-surface mt-0.5">
                  132g Match Jacquard
                </div>
              </div>
              <div className="p-3.5 rounded-xl bg-surface-charcoal-elevated border border-surface-border">
                <div className="font-label-caps text-[10px] uppercase text-text-muted">SERIAL REGISTRY</div>
                <div className="font-headline-md text-body-md font-bold text-secondary mt-0.5">PK-BD-2025-042</div>
              </div>
              <div className="p-3.5 rounded-xl bg-surface-charcoal-elevated border border-surface-border">
                <div className="font-label-caps text-[10px] uppercase text-text-muted">TYPOGRAPHY</div>
                <div className="font-headline-md text-body-md font-bold text-on-surface mt-0.5">
                  Heat-Bonded Gold #10
                </div>
              </div>
              <div className="p-3.5 rounded-xl bg-surface-charcoal-elevated border border-surface-border">
                <div className="font-label-caps text-[10px] uppercase text-text-muted">INSPECTION HUB</div>
                <div className="font-headline-md text-body-md font-bold text-tertiary mt-0.5">Banani Vault, Dhaka</div>
              </div>
            </div>

            <div className="flex items-center justify-between pt-2">
              <div className="flex items-center gap-2 text-secondary font-label-caps text-label-caps uppercase">
                <CheckCircle2 size={16} />
                <span>Verified Match-Issue Grade</span>
              </div>
              <button
                type="button"
                onClick={() => {
                  setShowOriginModal(false);
                  if (specialJersey) navigateTo('product', specialJersey);
                }}
                className="px-5 py-2.5 rounded-full bg-primary-container hover:bg-crimson-vibrant text-on-primary-container font-label-caps text-label-caps uppercase font-bold transition-colors"
              >
                Inspect Jersey
              </button>
            </div>
          </div>
        </div>
      )}

      {/* HERO SECTION */}
      <section className="relative w-full rounded-2xl overflow-hidden -mt-4 pt-16 pb-20 px-6 sm:px-12 flex flex-col items-center justify-center text-center shadow-2xl bg-[#0e0e10] border border-surface-border">
        {/* Atmospheric Ambient Glows */}
        <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-[720px] h-[380px] bg-primary-container/15 rounded-full blur-[130px] pointer-events-none" />
        <div className="absolute -bottom-20 right-10 w-[420px] h-[320px] bg-secondary/10 rounded-full blur-[100px] pointer-events-none" />

        {/* Blended Background Hero Texture Overlay (Crossfading code.html Studio Arena & Stadium Night) */}
        {heroBackgrounds.map((bgUrl, idx) => (
          <div
            key={bgUrl}
            className={`absolute inset-0 bg-cover bg-center mix-blend-screen pointer-events-none transition-opacity duration-1000 ${
              heroBgIndex === idx ? 'opacity-35' : 'opacity-0'
            }`}
            style={{ backgroundImage: `url('${bgUrl}')` }}
          />
        ))}
        <div className="absolute inset-0 bg-gradient-to-t from-[#0e0e10] via-[#0e0e10]/80 to-transparent pointer-events-none" />

        {/* Editorial Pre-header Pill */}
        <div className="relative z-10 inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#141418]/90 border border-[#27272e] backdrop-blur-md shadow-md mb-6">
          <span className="w-2 h-2 rounded-full bg-secondary animate-pulse" />
          <span className="font-label-caps text-label-caps uppercase text-secondary tracking-widest">
            OFFICIAL 2025/26 PRO FIXTURE DROP
          </span>
          <span className="text-[#353437]">•</span>
          <span className="font-label-caps text-label-caps text-[#e5bdbe]">DHAKA ARCHIVE</span>
        </div>

        {/* High-Impact Editorial Heading */}
        <div className="relative z-10 max-w-4xl mx-auto flex flex-col items-center gap-2">
          <span className="font-label-caps text-label-caps text-primary uppercase tracking-[0.25em]">
            AUTHENTIC PERFORMANCE 2025/26
          </span>
          <h1 className="font-display-hero text-display-hero-mobile sm:text-display-hero uppercase tracking-tighter text-[#f8fafc] leading-tight">
            ENGINEERED FOR{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-container via-crimson-vibrant to-secondary">
              EXCELLENCE.
            </span>
          </h1>
          <p className="font-body-lg text-body-md sm:text-body-lg text-[#94a3b8] max-w-2xl mt-4 leading-relaxed">
            Sourced directly from Europe&apos;s elite clubs. Authentic match-issue materials engineered for elite
            athletes, crafted for discerning collectors across Bangladesh.
          </p>
        </div>

        {/* Action CTAs */}
        <div className="relative z-10 flex flex-wrap items-center justify-center gap-4 mt-8">
          <button
            type="button"
            onClick={() => {
              setCategory('All');
              navigateTo('shop');
            }}
            className="group flex items-center gap-3 px-8 py-3.5 rounded-full bg-primary-container hover:bg-crimson-vibrant text-on-primary-container font-headline-md text-label-numeric font-bold transition-all shadow-lg hover:shadow-primary-container/30 active:scale-95"
          >
            <span>EXPLORE NEW ARRIVALS</span>
            <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
          </button>
          <a
            href="#player-adv-section"
            className="flex items-center gap-2 px-7 py-3.5 rounded-full bg-[#1c1c22]/90 hover:bg-[#141418] text-[#e5e1e4] border border-[#27272e] font-headline-md text-label-numeric font-semibold backdrop-blur-md shadow-md transition-all active:scale-95"
          >
            <ShieldCheck size={19} className="text-secondary" />
            <span>EXPLORE MATCH VAULT</span>
          </a>
        </div>

        {/* Micro-spec Feature Bar */}
        <div className="relative z-10 mt-14 w-full max-w-5xl grid grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="flex items-center gap-3 p-3 rounded-xl bg-[#141418]/75 border border-[#27272e] backdrop-blur-sm shadow-sm">
            <div className="w-9 h-9 rounded-lg bg-primary-container/20 flex items-center justify-center text-primary shrink-0">
              <ShieldCheck size={19} />
            </div>
            <div className="flex flex-col text-left min-w-0">
              <span className="font-label-caps text-label-caps uppercase text-[#f8fafc] font-bold truncate">
                100% MATCH-SPEC
              </span>
              <span className="font-body-sm text-body-sm text-[#94a3b8] truncate">Authentic Kit Guarantee</span>
            </div>
          </div>

          <div className="flex items-center gap-3 p-3 rounded-xl bg-[#141418]/75 border border-[#27272e] backdrop-blur-sm shadow-sm">
            <div className="w-9 h-9 rounded-lg bg-secondary/20 flex items-center justify-center text-secondary shrink-0">
              <Wallet size={19} />
            </div>
            <div className="flex flex-col text-left min-w-0">
              <span className="font-label-caps text-label-caps uppercase text-[#f8fafc] font-bold truncate">
                BKASH &amp; NAGAD EMI
              </span>
              <span className="font-body-sm text-body-sm text-[#94a3b8] truncate">Instant 0% flexible plans</span>
            </div>
          </div>

          <div className="flex items-center gap-3 p-3 rounded-xl bg-[#141418]/75 border border-[#27272e] backdrop-blur-sm shadow-sm">
            <div className="w-9 h-9 rounded-lg bg-tertiary-container/30 flex items-center justify-center text-tertiary shrink-0">
              <QrCode size={19} />
            </div>
            <div className="flex flex-col text-left min-w-0">
              <span className="font-label-caps text-label-caps uppercase text-[#f8fafc] font-bold truncate">
                HOLOGRAPHIC NFC
              </span>
              <span className="font-body-sm text-body-sm text-[#94a3b8] truncate">Numbered serial tags</span>
            </div>
          </div>

          <div className="flex items-center gap-3 p-3 rounded-xl bg-[#141418]/75 border border-[#27272e] backdrop-blur-sm shadow-sm">
            <div className="w-9 h-9 rounded-lg bg-primary-container/20 flex items-center justify-center text-primary shrink-0">
              <Truck size={19} />
            </div>
            <div className="flex flex-col text-left min-w-0">
              <span className="font-label-caps text-label-caps uppercase text-[#f8fafc] font-bold truncate">
                EXPRESS 48H
              </span>
              <span className="font-body-sm text-body-sm text-[#94a3b8] truncate">Direct delivery across BD</span>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION: TRENDING KITS (WEEKLY DROP) */}
      <section className="mt-space-3xl flex flex-col w-full" id="trending-drops">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
          <div className="flex flex-col">
            <div className="flex items-center gap-2 mb-2">
              <span className="w-2.5 h-2.5 rounded-full bg-primary-container animate-ping" />
              <span className="font-label-caps text-label-caps text-primary-container uppercase tracking-widest font-bold">
                WEEKLY VAULT ALLOCATION
              </span>
            </div>
            <h2 className="font-headline-xl text-headline-xl-mobile sm:text-headline-xl uppercase tracking-tight text-on-surface">
              TRENDING FIXTURES
            </h2>
            <p className="font-body-md text-body-md text-text-muted">
              Matchday heat ready for immediate dispatch from our Banani Vault.
            </p>
          </div>

          {/* Category Filter Pills */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2 md:pb-0 scrollbar-none">
            {HOME_FILTER_TABS.map((tab) => {
              const active = selectedTab === tab.value;
              return (
                <button
                  key={tab.value}
                  type="button"
                  onClick={() => setSelectedTab(tab.value)}
                  className={
                    active
                      ? 'px-4 py-2 rounded-lg bg-primary-container text-on-primary-container font-label-caps text-label-caps uppercase tracking-wider font-bold shadow-md whitespace-nowrap transition-colors'
                      : 'px-4 py-2 rounded-lg bg-surface-charcoal hover:bg-surface-charcoal-elevated text-on-surface-variant hover:text-on-surface border border-surface-border font-label-caps text-label-caps uppercase tracking-wider font-semibold whitespace-nowrap transition-colors'
                  }
                >
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* 4-Card Luxury Product Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {productsLoading
            ? [...Array(4)].map((_, i) => <ProductCardSkeleton key={i} />)
            : displayedProducts.map((product) => <ProductCard key={product.id} product={product} />)}
        </div>

        <div className="mt-8 flex justify-center">
          <button
            type="button"
            onClick={() => {
              setCategory(selectedTab === 'All Drops' ? 'All' : selectedTab);
              navigateTo('shop');
            }}
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-surface-charcoal hover:bg-surface-charcoal-elevated border border-surface-border font-label-caps text-label-caps uppercase tracking-widest text-on-surface transition-colors"
          >
            <span>View Full {selectedTab === 'All Drops' ? 'Catalog' : selectedTab} Collection</span>
            <ArrowRight size={14} className="text-primary-container" />
          </button>
        </div>
      </section>

      {/* SECTION: PLAYER EDITION ADV TIER (SIGNATURE SPOTLIGHT) */}
      <section
        className="mt-space-3xl relative rounded-2xl bg-surface-charcoal border border-surface-border overflow-hidden shadow-2xl"
        id="player-adv-section"
      >
        <div className="absolute -top-32 -left-32 w-96 h-96 bg-primary-container/20 rounded-full blur-[140px] pointer-events-none" />
        <div className="grid grid-cols-1 lg:grid-cols-12 items-center p-8 lg:p-14 gap-12 relative z-10">
          {/* Left Column: Technical Breakdown */}
          <div className="lg:col-span-7 flex flex-col gap-6">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-surface-charcoal-elevated border border-surface-border text-secondary w-fit shadow-inner">
              <Award size={15} />
              <span className="font-label-caps text-label-caps uppercase tracking-wider font-bold">
                ELITE PERFORMANCE TIER
              </span>
            </div>

            <div className="flex flex-col gap-2">
              <h2 className="font-display-hero-mobile lg:font-display-hero text-display-hero-mobile lg:text-display-hero uppercase tracking-tight text-on-surface leading-none">
                PLAYER EDITION <span className="text-primary-container">ADV</span>
              </h2>
              <p className="font-body-lg text-body-lg text-text-muted max-w-xl">
                Engineered for the 90-minute matchday environment. Our Player Edition kits feature the exact technical
                specifications worn by professionals on the pitch, imported directly for collectors.
              </p>
            </div>

            {/* Spec Metric Meters */}
            <div className="flex flex-col gap-4 mt-2">
              <div className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between font-label-caps text-label-caps uppercase">
                  <span className="text-on-surface flex items-center gap-2">
                    <Wind size={15} className="text-tertiary" />
                    Breathability &amp; Air Circulation
                  </span>
                  <span className="text-secondary font-bold">100% THERMAL MATCH</span>
                </div>
                <div className="w-full h-2 rounded-full bg-surface-container-highest overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-tertiary-container to-tertiary w-full rounded-full" />
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between font-label-caps text-label-caps uppercase">
                  <span className="text-on-surface flex items-center gap-2">
                    <Gauge size={15} className="text-primary" />
                    Chassis Weight
                  </span>
                  <span className="text-primary font-bold">ULTRALIGHT (&lt;140G)</span>
                </div>
                <div className="w-full h-2 rounded-full bg-surface-container-highest overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-primary-container to-crimson-vibrant w-[92%] rounded-full" />
                </div>
              </div>
            </div>

            {/* Technical Badges Split */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-2">
              <div className="flex items-start gap-3 p-4 rounded-xl bg-surface-charcoal-elevated/70 border border-surface-border shadow-sm">
                <div className="w-10 h-10 rounded-lg bg-surface-container flex items-center justify-center text-secondary shrink-0">
                  <Snowflake size={18} />
                </div>
                <div className="flex flex-col">
                  <span className="font-headline-md text-label-numeric font-bold text-on-surface">
                    DRI-FIT ADV COOLING
                  </span>
                  <span className="font-body-sm text-body-sm text-text-muted">
                    Targeted heat-mapping open jacquard weave for zero sweat drag.
                  </span>
                </div>
              </div>

              <div className="flex items-start gap-3 p-4 rounded-xl bg-surface-charcoal-elevated/70 border border-surface-border shadow-sm">
                <div className="w-10 h-10 rounded-lg bg-surface-container flex items-center justify-center text-primary shrink-0">
                  <Shield size={18} />
                </div>
                <div className="flex flex-col">
                  <span className="font-headline-md text-label-numeric font-bold text-on-surface">
                    HEAT-APPLIED CREST
                  </span>
                  <span className="font-body-sm text-body-sm text-text-muted">
                    Zero-friction flexible silicone shields preventing skin abrasion.
                  </span>
                </div>
              </div>
            </div>

            <div className="pt-2">
              <button
                type="button"
                onClick={() => {
                  setCategory('Player ADV');
                  navigateTo('shop');
                }}
                className="inline-flex items-center gap-3 px-8 py-3.5 rounded-full bg-primary-container hover:bg-crimson-vibrant text-on-primary-container font-headline-md text-label-numeric font-bold transition-all shadow-lg hover:shadow-primary-container/20"
              >
                <span>EXPLORE ELITE COLLECTION</span>
                <ArrowRight size={18} />
              </button>
            </div>
          </div>

          {/* Right Column: Visual Stage with Floating Tech Chip */}
          <div className="lg:col-span-5 relative flex items-center justify-center">
            <div className="relative w-full aspect-[4/5] rounded-2xl overflow-hidden shadow-2xl bg-[#0e0e10] border border-surface-border">
              <img
                src={ASSETS.UI.PLAYER_ADV_STUDIO}
                alt="Lionel Messi in official Argentina 10 Player Edition jersey"
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#141418] via-transparent to-transparent" />

              {/* Bottom Floating Specs Tag */}
              <div className="absolute bottom-6 left-6 right-6 p-4 rounded-xl bg-[#1c1c22]/90 border border-[#27272e] backdrop-blur-md shadow-xl flex items-center gap-4">
                <div className="w-12 h-12 rounded-lg bg-[#141418] flex items-center justify-center text-primary-container shrink-0">
                  <svg className="w-8 h-8 -rotate-90" viewBox="0 0 36 36">
                    <circle
                      className="text-[#353437]"
                      cx="18"
                      cy="18"
                      fill="none"
                      r="14"
                      stroke="currentColor"
                      strokeWidth="3"
                    />
                    <circle
                      className="text-primary-container"
                      cx="18"
                      cy="18"
                      fill="none"
                      r="14"
                      stroke="currentColor"
                      strokeDasharray="88"
                      strokeDashoffset="15"
                      strokeWidth="3"
                    />
                  </svg>
                </div>
                <div className="flex flex-col">
                  <span className="font-label-caps text-label-caps uppercase text-secondary font-bold">
                    PERFORMANCE KNIT
                  </span>
                  <span className="font-body-sm text-body-sm text-[#f8fafc]">Archival textured moisture matrix</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION: GOLDEN ERA RETRO VAULT */}
      <section className="mt-space-3xl rounded-2xl bg-gradient-to-br from-surface-charcoal via-surface-charcoal-elevated to-surface-charcoal border border-surface-border p-8 lg:p-12 relative overflow-hidden shadow-2xl">
        <div className="absolute -right-24 top-1/2 -translate-y-1/2 w-96 h-96 bg-secondary/15 rounded-full blur-[140px] pointer-events-none" />
        <div className="flex flex-col lg:flex-row items-center justify-between gap-10 relative z-10">
          <div className="flex flex-col max-w-2xl gap-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-secondary/20 text-secondary w-fit">
              <History size={15} />
              <span className="font-label-caps text-label-caps uppercase tracking-wider font-bold">
                RETRO GOLDEN ERA
              </span>
            </div>
            <h2 className="font-headline-xl text-headline-xl-mobile sm:text-headline-xl uppercase tracking-tight text-on-surface leading-tight">
              GOLDEN <span className="text-secondary">ERA RETRO</span> VAULT
            </h2>
            <p className="font-body-lg text-body-lg text-text-muted">
              Iconic 1998 and 2002 silhouettes restored with modern match cooling technology. Archival accuracy meets
              elite performance with velvet badge detailing and vintage collar geometry.
            </p>

            {/* Drop Countdown & Units Left Widget */}
            <div className="flex flex-wrap items-center gap-6 mt-4 p-4 rounded-xl bg-surface-charcoal/90 border border-surface-border w-fit">
              <div className="flex items-center gap-3">
                <Timer size={22} className="text-secondary" />
                <div className="flex flex-col">
                  <span className="font-label-caps text-[10px] uppercase text-text-muted">NEXT VAULT LOCK</span>
                  <span className="font-headline-md text-label-numeric font-bold text-on-surface tracking-wider">
                    {formattedCountdown}
                  </span>
                </div>
              </div>
              <div className="w-px h-8 bg-surface-container-highest hidden sm:block" />
              <div className="flex flex-col gap-1">
                <div className="flex items-center justify-between gap-4 font-label-caps text-[10px] uppercase">
                  <span className="text-text-muted">BANGLADESH ALLOCATION</span>
                  <span className="text-secondary font-bold">{stockRemaining} UNITS LEFT</span>
                </div>
                <div className="w-40 h-1.5 rounded-full bg-surface-container-highest overflow-hidden">
                  <div
                    className="h-full bg-secondary rounded-full transition-all duration-700"
                    style={{ width: `${Math.max(15, (stockRemaining / 40) * 100)}%` }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Action Button & Retro Visual Teaser */}
          <div className="flex flex-col items-center sm:items-end gap-6 w-full lg:w-auto">
            <div
              onClick={() => {
                setCategory('Retro Heritage');
                navigateTo('shop');
              }}
              className="w-full sm:w-80 h-44 rounded-xl overflow-hidden shadow-xl bg-[#0e0e10] border border-surface-border relative group cursor-pointer"
            >
              <img
                src={ASSETS.UI.RETRO_VAULT_STUDIO}
                alt="Classic vintage football jerseys folded neatly in collector presentation case"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#141418]/85 to-transparent" />
              <span className="absolute bottom-3 left-3 font-label-caps text-label-caps text-[#f8fafc] uppercase font-bold tracking-wider">
                RESTOCKED ARCHIVES (1998-2006)
              </span>
            </div>
            <button
              type="button"
              onClick={() => {
                setCategory('Retro Heritage');
                navigateTo('shop');
              }}
              className="w-full sm:w-auto flex items-center justify-center gap-3 px-8 py-4 rounded-full bg-secondary hover:bg-secondary-fixed text-on-secondary font-headline-md text-label-numeric font-bold transition-all shadow-lg hover:shadow-secondary/20 active:scale-95"
            >
              <span>EXPLORE RETRO DROP</span>
              <ArrowRight size={18} />
            </button>
          </div>
        </div>
      </section>

      {/* SECTION: COMMEMORATIVE HIGHLIGHT (THE MVP LEGACY) */}
      <section className="mt-space-3xl rounded-2xl bg-surface-charcoal border border-surface-border overflow-hidden shadow-2xl relative">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center p-8 lg:p-12 relative z-10">
          {/* Left Visual Card with Player Graphic */}
          <div className="lg:col-span-5 relative">
            <div
              onClick={() => specialJersey && navigateTo('product', specialJersey)}
              className="relative w-full aspect-[4/3] rounded-xl overflow-hidden shadow-2xl bg-[#0e0e10] border border-surface-border cursor-pointer group"
            >
              <img
                src={ASSETS.UI.MVP_LEGACY_STUDIO}
                alt="Messi MVP 2025 Commemorative Jersey"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
              {/* Holographic Badge Overlay */}
              <div className="absolute top-4 left-4 px-3 py-1 rounded bg-[#141418]/90 border border-[#27272e] backdrop-blur-md flex items-center gap-1.5 shadow-md">
                <Sparkles size={14} className="text-secondary" />
                <span className="font-label-caps text-label-caps text-secondary font-bold">DROP #042 / 100</span>
              </div>
              <div className="absolute bottom-4 left-4 right-4 py-2 px-4 rounded-lg bg-[#0e0e10]/90 border border-[#27272e] backdrop-blur-md text-center">
                <span className="font-headline-md text-title-sm font-bold tracking-wider text-[#f8fafc]">
                  MESSI MVP 2025 VAULT
                </span>
              </div>
            </div>
          </div>

          {/* Right Column Content */}
          <div className="lg:col-span-7 flex flex-col gap-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary-container/20 text-primary-container w-fit">
              <span className="font-label-caps text-label-caps uppercase tracking-wider font-bold">
                ✦ COMMEMORATIVE EDITION
              </span>
            </div>
            <div className="flex flex-col gap-2">
              <h2 className="font-headline-xl text-headline-xl-mobile sm:text-headline-xl uppercase tracking-tight text-on-surface">
                THE <span className="text-primary-container">MVP</span> LEGACY.
              </h2>
              <p className="font-body-lg text-body-lg text-text-muted">
                A celebration of unmatched football mastery. Featuring official player-spec heat-bonded championship
                lettering, metallic micro-crests, and holographic serial certification.
              </p>
            </div>

            {/* Spec Indicators */}
            <div className="flex flex-wrap items-center gap-6 py-2">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-secondary" />
                <span className="font-label-caps text-label-caps uppercase text-on-surface font-semibold">
                  ELITE GRADE FABRIC
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-primary-container" />
                <span className="font-label-caps text-label-caps uppercase text-on-surface font-semibold">
                  LIMITED MICRO-BATCH
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-tertiary" />
                <span className="font-label-caps text-label-caps uppercase text-on-surface font-semibold">
                  NFC CERTIFIED
                </span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 pt-2">
              <button
                type="button"
                onClick={() => specialJersey && navigateTo('product', specialJersey)}
                className="flex items-center justify-center gap-3 px-8 py-4 rounded-full bg-primary-container hover:bg-crimson-vibrant text-on-primary-container font-headline-md text-label-numeric font-bold transition-all shadow-lg hover:shadow-primary-container/30 active:scale-95"
              >
                <span>
                  SECURE MVP KIT — {CURRENCY_SYMBOL} {(specialJersey?.price ?? 2080).toLocaleString()}
                </span>
                <ShoppingBag size={17} />
              </button>
              <button
                type="button"
                onClick={() => setShowOriginModal(true)}
                className="flex items-center justify-center gap-2 px-6 py-4 rounded-full bg-surface-charcoal-elevated hover:bg-surface-container-high border border-surface-border text-on-surface font-headline-md text-label-numeric font-semibold transition-colors"
              >
                <span>View Proof of Origin</span>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION: TRUST & AUTHENTICITY BENTO */}
      <section className="mt-space-3xl mb-space-2xl grid grid-cols-1 md:grid-cols-3 gap-6 w-full">
        <div className="flex flex-col gap-4 p-8 rounded-2xl bg-surface-charcoal border border-surface-border shadow-lg hover:bg-surface-charcoal-elevated transition-colors">
          <div className="w-12 h-12 rounded-xl bg-primary-container/20 flex items-center justify-center text-primary-container">
            <ShieldCheck size={26} />
          </div>
          <div className="flex flex-col gap-1">
            <h3 className="font-headline-md text-title-sm font-bold uppercase tracking-tight text-on-surface">
              CERTIFIED AUTHENTICITY
            </h3>
            <p className="font-body-md text-body-md text-text-muted">
              Every kit comes with an encrypted holographic tag. Scan on arrival via your smartphone to inspect
              manufacturer serials and match provenance.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setShowOriginModal(true)}
            className="mt-auto pt-2 flex items-center gap-1 text-primary-container font-label-caps text-label-caps uppercase font-bold w-fit hover:underline"
          >
            <span>ZERO KNOCK-OFF POLICY</span>
            <ArrowRight size={14} />
          </button>
        </div>

        <div className="flex flex-col gap-4 p-8 rounded-2xl bg-surface-charcoal border border-surface-border shadow-lg hover:bg-surface-charcoal-elevated transition-colors">
          <div className="w-12 h-12 rounded-xl bg-secondary/20 flex items-center justify-center text-secondary">
            <Rocket size={26} />
          </div>
          <div className="flex flex-col gap-1">
            <h3 className="font-headline-md text-title-sm font-bold uppercase tracking-tight text-on-surface">
              FAST EXPRESS SHIPPING
            </h3>
            <p className="font-body-md text-body-md text-text-muted">
              Same-day dispatch for Dhaka Metro (Gulshan, Banani, Dhanmondi, Uttara). Standard nationwide delivery
              within 48 hours via premium insured couriers.
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              setCategory('All');
              navigateTo('shop');
            }}
            className="mt-auto pt-2 flex items-center gap-1 text-secondary font-label-caps text-label-caps uppercase font-bold w-fit hover:underline"
          >
            <span>INSURED PACKAGING</span>
            <ArrowRight size={14} />
          </button>
        </div>

        <div className="flex flex-col gap-4 p-8 rounded-2xl bg-surface-charcoal border border-surface-border shadow-lg hover:bg-surface-charcoal-elevated transition-colors">
          <div className="w-12 h-12 rounded-xl bg-tertiary-container/30 flex items-center justify-center text-tertiary">
            <RefreshCw size={26} />
          </div>
          <div className="flex flex-col gap-1">
            <h3 className="font-headline-md text-title-sm font-bold uppercase tracking-tight text-on-surface">
              PERFECT FIT GUARANTEE
            </h3>
            <p className="font-body-md text-body-md text-text-muted">
              Match-player cuts fit slimmer than fan editions. We provide painless 7-day doorstep size swaps across
              Bangladesh so your jersey sits with matchday precision.
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              setCategory('Player ADV');
              navigateTo('shop');
            }}
            className="mt-auto pt-2 flex items-center gap-1 text-tertiary font-label-caps text-label-caps uppercase font-bold w-fit hover:underline"
          >
            <span>7-DAY EASY EXCHANGE</span>
            <ArrowRight size={14} />
          </button>
        </div>
      </section>
    </div>
  );
};
