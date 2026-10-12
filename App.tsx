
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

interface FootballIconProps {
  className?: string;
}

const FootballIcon: React.FC<FootballIconProps> = ({ className = "text-brand-dark" }) => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <circle cx="12" cy="12" r="10"></circle>
    <path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20"></path>
    <path d="M2 12h20"></path>
    <path d="M12 2v20"></path>
  </svg>
);

const SplashScreen = () => (
  <div className="fixed inset-0 z-[300] bg-brand-dark flex flex-col items-center justify-center animate-fade-out" style={{ animationDelay: '1.2s', pointerEvents: 'none' }}>
    <div className="relative mb-14">
       <div className="absolute inset-0 bg-brand-crimson blur-[120px] opacity-20 animate-pulse-slow"></div>
       <div className="absolute -inset-20 bg-brand-gold blur-[150px] opacity-10 animate-float"></div>
       <div className="relative w-44 h-44 md:w-52 md:h-52 flex items-center justify-center z-10">
          <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full drop-shadow-[0_0_30px_rgba(212,13,54,0.4)]">
              <defs>
                <linearGradient id="crest-gradient" x1="32" y1="0" x2="32" y2="64" gradientUnits="userSpaceOnUse">
                  <stop stopColor="#D40D36" />
                  <stop offset="0.5" stopColor="#A50044" />
                  <stop offset="1" stopColor="#050505" />
                </linearGradient>
              </defs>
              <path d="M32 2L58 14V34C58 50 46 60 32 64C18 60 6 50 6 34V14L32 2Z" fill="url(#crest-gradient)" stroke="white" strokeWidth="0.5" strokeOpacity="0.2" />
              <g className="animate-fade-in" style={{ animationDelay: '0.3s' }}>
                <path d="M24 18V46M24 18H36C40 18 43 20 43 24.5C43 29 40 31 36 31H24" stroke="white" strokeWidth="4" strokeLinecap="square" strokeLinejoin="miter" />
                <path d="M34 31L44 46" stroke="#CFA238" strokeWidth="4" strokeLinecap="square" />
              </g>
              <path d="M32 5L34 9H30L32 5Z" fill="#CFA238" className="animate-pulse" />
          </svg>
       </div>
    </div>
    <div className="flex flex-col items-center gap-1 mb-16 text-center px-6">
      <h1 className="font-heading font-black text-4xl md:text-5xl tracking-[0.15em] leading-none text-white drop-shadow-lg uppercase">
        PREMIUM<span className="text-brand-crimson">KITS</span>
      </h1>
      <div className="flex items-center gap-4 mt-4 w-full justify-center">
         <div className="h-[1px] flex-1 bg-gradient-to-r from-transparent to-brand-gold/40"></div>
         <p className="text-brand-gold text-[9px] md:text-[10px] uppercase tracking-[0.6em] font-bold opacity-80 whitespace-nowrap">
           ESTABLISHED 2025
         </p>
         <div className="h-[1px] flex-1 bg-gradient-to-l from-transparent to-brand-gold/40"></div>
      </div>
    </div>
    <div className="relative w-64 md:w-80">
      <div className="h-[2px] w-full bg-white/5 rounded-full overflow-hidden">
        <div className="h-full bg-gradient-to-r from-brand-crimson via-brand-gold to-brand-crimson w-full origin-left animate-load-progress" style={{ animationDuration: '1.2s' }}></div>
      </div>
      <div className="absolute top-1/2 w-6 h-6 text-white animate-ball-roll" style={{ animationDuration: '1.2s' }}>
        <FootballIcon className="text-white drop-shadow-2xl" />
      </div>
    </div>
  </div>
);

const MainContent = () => {
  const { currentPage } = useStore();
  const renderPage = () => {
    switch (currentPage) {
      case 'home': return <Home />;
      case 'shop': return <Shop />;
      case 'product': return <ProductDetail />;
      case 'cart': return <Cart />;
      case 'wishlist': return <Wishlist />;
      case 'order': return <OrderStatus />;
      default: return <Home />;
    }
  };

  return (
    <div className="min-h-screen flex flex-col font-sans text-brand-dark bg-white selection:bg-brand-crimson selection:text-white">
      <Navbar />
      <NotificationContainer />
      <main className={`flex-grow ${currentPage === 'home' ? 'pt-0' : 'pt-20 lg:pt-24'}`}>
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
      <Suspense fallback={<div className="min-h-screen bg-slate-950" />}>
        <AdminApp />
      </Suspense>
    );
  }
  return <Storefront />;
};

const Storefront = () => {
  // Skip the splash when returning from a payment gateway.
  const [loading, setLoading] = useState(() => !window.location.pathname.startsWith('/order/'));
  useEffect(() => {
    if (!loading) return;
    const timer = setTimeout(() => setLoading(false), 1400);
    return () => clearTimeout(timer);
  }, []);

  return (
    <StoreProvider>
      {loading && <SplashScreen />}
      <div className={loading ? 'opacity-0' : 'opacity-100 transition-opacity duration-700'}>
        <MainContent />
      </div>
    </StoreProvider>
  );
};

export default App;
