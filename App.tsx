import React, { useState, useEffect, lazy, Suspense } from 'react';
import { StoreProvider, useStore } from './context/StoreContext';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { Home } from './pages/Home';
import { Shop } from './pages/Shop';
import { ProductDetail } from './pages/ProductDetail';
import { Cart } from './pages/Cart';
import { Wishlist } from './pages/Wishlist';
import { OrderStatus } from './pages/OrderStatus';
import { NotificationContainer } from './components/UI';

const SplashScreen = () => (
  <div
    className="fixed inset-0 z-[300] bg-[#131315] flex flex-col items-center justify-center animate-fade-out"
    style={{ animationDelay: '0.85s', pointerEvents: 'none' }}
  >
    <div className="relative mb-10">
      <div className="absolute -inset-12 bg-primary-container/25 blur-[90px] rounded-full animate-pulse-slow" />
      <div className="absolute -inset-16 bg-secondary/15 blur-[110px] rounded-full animate-float" />
      <div className="relative w-28 h-28 md:w-32 md:h-32 rounded-2xl bg-[#1c1c22] border border-[#27272e] flex items-center justify-center z-10 shadow-2xl">
        <svg
          viewBox="0 0 64 64"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-20 h-20 drop-shadow-[0_0_24px_rgba(225,29,72,0.45)]"
        >
          <defs>
            <linearGradient id="crest-gradient" x1="32" y1="0" x2="32" y2="64" gradientUnits="userSpaceOnUse">
              <stop stopColor="#e11d48" />
              <stop offset="0.55" stopColor="#920028" />
              <stop offset="1" stopColor="#141418" />
            </linearGradient>
          </defs>
          <path
            d="M32 2L58 14V34C58 50 46 60 32 64C18 60 6 50 6 34V14L32 2Z"
            fill="url(#crest-gradient)"
            stroke="#e9c349"
            strokeWidth="1"
            strokeOpacity="0.4"
          />
          <g className="animate-fade-in">
            <path
              d="M23 18V46M23 18H35C39 18 42 20 42 24.5C42 29 39 31 35 31H23"
              stroke="#fffaf9"
              strokeWidth="4"
              strokeLinecap="square"
              strokeLinejoin="miter"
            />
            <path d="M33 31L43 46" stroke="#e9c349" strokeWidth="4" strokeLinecap="square" />
          </g>
        </svg>
      </div>
    </div>

    <div className="flex flex-col items-center gap-1.5 mb-10 text-center px-6">
      <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#141418] border border-[#27272e] mb-2">
        <span className="w-1.5 h-1.5 rounded-full bg-secondary animate-pulse" />
        <span className="font-label-caps text-[10px] uppercase tracking-[0.25em] text-secondary">
          DHAKA MATCH ARCHIVE
        </span>
      </div>
      <h1 className="font-display-hero text-3xl md:text-4xl tracking-tight leading-none text-[#f8fafc] uppercase">
        PREMIUM <span className="text-primary-container">KITS</span>
      </h1>
      <p className="font-label-caps text-label-caps text-gold-muted uppercase tracking-[0.35em]">
        AUTHENTIC PERFORMANCE 2025/26
      </p>
    </div>

    <div className="relative w-56 md:w-64">
      <div className="h-1 w-full bg-[#27272e] rounded-full overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-primary-container via-crimson-vibrant to-secondary w-full origin-left animate-load-progress"
          style={{ animationDuration: '0.85s' }}
        />
      </div>
    </div>
  </div>
);

const MainContent = () => {
  const { currentPage } = useStore();
  const renderPage = () => {
    switch (currentPage) {
      case 'home':
        return <Home />;
      case 'shop':
        return <Shop />;
      case 'product':
        return <ProductDetail />;
      case 'cart':
        return <Cart />;
      case 'wishlist':
        return <Wishlist />;
      case 'order':
        return <OrderStatus />;
      default:
        return <Home />;
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background font-body-md text-on-surface antialiased selection:bg-primary-container selection:text-on-primary-container transition-colors duration-300">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-[200] focus:px-4 focus:py-2 focus:rounded-lg focus:bg-primary-container focus:text-on-primary-container focus:font-label-caps focus:text-xs focus:uppercase"
      >
        Skip to content
      </a>
      <Navbar />
      <NotificationContainer />
      <main id="main" className="w-full pt-4 md:pt-6 bg-background max-w-7xl mx-auto px-margin-mobile lg:px-margin min-h-screen flex-grow">
        {renderPage()}
      </main>
      <Footer />
    </div>
  );
};

// Admin panel is code-split so shoppers never download it.
const AdminApp = lazy(() => import('./admin/AdminApp'));

const App = () => {
  if (window.location.pathname.startsWith('/admin')) {
    return (
      <Suspense fallback={<div className="min-h-screen bg-background" />}>
        <AdminApp />
      </Suspense>
    );
  }
  return <Storefront />;
};

const Storefront = () => {
  // Show the luxury splash screen once per session (and skip when returning from a payment gateway).
  const [loading, setLoading] = useState(() => {
    if (window.location.pathname.startsWith('/order/')) return false;
    try {
      if (sessionStorage.getItem('pk_splash_seen') === '1') return false;
      sessionStorage.setItem('pk_splash_seen', '1');
    } catch {
      /* ignore */
    }
    return true;
  });

  useEffect(() => {
    if (!loading) return;
    const timer = setTimeout(() => setLoading(false), 1050);
    return () => clearTimeout(timer);
  }, [loading]);

  return (
    <StoreProvider>
      {loading && <SplashScreen />}
      <div className={loading ? 'opacity-0' : 'opacity-100 transition-opacity duration-500'}>
        <MainContent />
      </div>
    </StoreProvider>
  );
};

export default App;
