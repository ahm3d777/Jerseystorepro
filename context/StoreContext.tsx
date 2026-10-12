import React, { createContext, useContext, useState, ReactNode, useEffect, useCallback, useMemo } from 'react';
import { Product, CartItem, PageView, StoreConfig } from '../types';
import { MOCK_PRODUCTS } from '../constants';
import { getConfig, getProducts } from '../lib/api';
import { isCustomized, unitPrice } from '../shared/pricing';

interface Notification {
  message: string;
  type: 'success' | 'info' | 'error';
  id: number;
}

interface StoreContextType {
  // Catalogue (live from the API, seed data as offline fallback)
  products: Product[];
  productsLoading: boolean;
  config: StoreConfig | null;

  // Navigation (kept in sync with the URL so pages are linkable and the back button works)
  currentPage: PageView;
  currentProduct: Product | null;
  navigateTo: (page: PageView, product?: Product) => void;

  // Shop Filter
  activeCategory: string;
  setCategory: (category: string) => void;

  // Cart
  cart: CartItem[];
  addToCart: (product: Product, size: string, customization?: { name: string; number: string; font: string }) => void;
  removeFromCart: (cartId: string) => void;
  updateQuantity: (cartId: string, delta: number) => void;
  cartTotal: number;
  cartCount: number;
  clearCart: () => void;

  // Wishlist
  wishlist: string[];
  toggleWishlist: (productId: string) => void;

  // UI
  notifications: Notification[];
  showNotification: (message: string, type?: Notification['type']) => void;
  removeNotification: (id: number) => void;
}

const StoreContext = createContext<StoreContextType | undefined>(undefined);

const readStorage = <T,>(key: string, fallback: T): T => {
  try {
    const saved = localStorage.getItem(key);
    return saved ? JSON.parse(saved) : fallback;
  } catch {
    return fallback;
  }
};

const writeStorage = (key: string, value: unknown) => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* storage unavailable (private mode) — cart just won't persist */
  }
};

function parseLocation(): { page: PageView; productId?: string } {
  const path = window.location.pathname.replace(/\/+$/, '') || '/';
  if (path === '/shop') return { page: 'shop' };
  if (path === '/cart' || path === '/checkout') return { page: 'cart' };
  if (path === '/wishlist') return { page: 'wishlist' };
  if (path.startsWith('/order/')) return { page: 'order' };
  const m = path.match(/^\/product\/([^/]+)$/);
  if (m) return { page: 'product', productId: decodeURIComponent(m[1]) };
  return { page: 'home' };
}

const pathFor = (page: PageView, product?: Product | null) =>
  ({
    home: '/',
    shop: '/shop',
    cart: '/cart',
    wishlist: '/wishlist',
    order: window.location.pathname + window.location.search,
    product: product ? `/product/${encodeURIComponent(product.id)}` : '/shop',
  })[page];

export const StoreProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const initial = useMemo(parseLocation, []);
  const [currentPage, setCurrentPage] = useState<PageView>(initial.page);
  const [currentProductId, setCurrentProductId] = useState<string | null>(initial.productId ?? null);
  const [activeCategory, setActiveCategory] = useState<string>('All');

  const [products, setProducts] = useState<Product[]>(MOCK_PRODUCTS);
  const [productsLoading, setProductsLoading] = useState(true);
  const [config, setConfig] = useState<StoreConfig | null>(null);

  const [cart, setCart] = useState<CartItem[]>(() => readStorage('pk_cart', []));
  const [wishlist, setWishlist] = useState<string[]>(() => readStorage('pk_wishlist', []));
  const [notifications, setNotifications] = useState<Notification[]>([]);

  useEffect(() => writeStorage('pk_cart', cart), [cart]);
  useEffect(() => writeStorage('pk_wishlist', wishlist), [wishlist]);

  // Load the live catalogue + payment config.
  useEffect(() => {
    let cancelled = false;
    Promise.all([getProducts(), getConfig()])
      .then(([live, cfg]) => {
        if (cancelled) return;
        setProducts(live);
        setConfig(cfg);
        // Keep cart prices/stock in sync with the server so displayed totals match what will be charged.
        setCart((prev) =>
          prev
            .filter((item) => live.some((p) => p.id === item.id))
            .map((item) => ({ ...item, ...live.find((p) => p.id === item.id)!, cartId: item.cartId, selectedSize: item.selectedSize, quantity: item.quantity, customization: item.customization })),
        );
      })
      .catch(() => {
        /* API unreachable (e.g. static preview) — keep seed catalogue */
      })
      .finally(() => !cancelled && setProductsLoading(false));
    return () => {
      cancelled = true;
    };
  }, []);

  // Back / forward buttons.
  useEffect(() => {
    const onPop = () => {
      const loc = parseLocation();
      setCurrentPage(loc.page);
      if (loc.productId) setCurrentProductId(loc.productId);
    };
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);

  const currentProduct = useMemo(() => products.find((p) => p.id === currentProductId) ?? null, [products, currentProductId]);

  const navigateTo = useCallback((page: PageView, product?: Product) => {
    window.scrollTo(0, 0);
    if (product) setCurrentProductId(product.id);
    setCurrentPage(page);
    const path = pathFor(page, product);
    if (path !== window.location.pathname + window.location.search) window.history.pushState(null, '', path);
  }, []);

  const removeNotification = useCallback((id: number) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  }, []);

  const showNotification = useCallback((message: string, type: Notification['type'] = 'success') => {
    const id = Date.now() + Math.random();
    setNotifications((prev) => [...prev, { message, type, id }]);
    setTimeout(() => removeNotification(id), 3500);
  }, [removeNotification]);

  const addToCart = (product: Product, size: string, customization?: { name: string; number: string; font: string }) => {
    if (product.status === 'out-of-stock') {
      showNotification(`${product.name} is sold out`, 'error');
      return;
    }
    const newItem: CartItem = {
      ...product,
      cartId: Math.random().toString(36).slice(2, 11),
      selectedSize: size,
      quantity: 1,
      customization: isCustomized(customization) ? customization : undefined,
    };
    setCart((prev) => [...prev, newItem]);
    showNotification(`Added ${product.name} to cart`);
  };

  const removeFromCart = (cartId: string) => {
    setCart((prev) => prev.filter((item) => item.cartId !== cartId));
  };

  const updateQuantity = (cartId: string, delta: number) => {
    setCart((prev) =>
      prev.map((item) => {
        if (item.cartId !== cartId) return item;
        const maxForProduct = item.isPreorder || item.stock === undefined ? 10 : Math.max(1, Math.min(10, item.stock));
        return { ...item, quantity: Math.min(maxForProduct, Math.max(1, item.quantity + delta)) };
      }),
    );
  };

  const clearCart = () => setCart([]);

  const toggleWishlist = (productId: string) => {
    setWishlist((prev) => {
      const isRemoving = prev.includes(productId);
      showNotification(isRemoving ? `Removed from Wishlist` : `Added to Wishlist`, 'info');
      return isRemoving ? prev.filter((id) => id !== productId) : [...prev, productId];
    });
  };

  const cartTotal = cart.reduce((acc, item) => acc + unitPrice(item.price, isCustomized(item.customization)) * item.quantity, 0);
  const cartCount = cart.reduce((acc, item) => acc + item.quantity, 0);

  return (
    <StoreContext.Provider
      value={{
        products,
        productsLoading,
        config,
        currentPage,
        currentProduct,
        navigateTo,
        activeCategory,
        setCategory: setActiveCategory,
        cart,
        addToCart,
        removeFromCart,
        updateQuantity,
        cartTotal,
        cartCount,
        clearCart,
        wishlist,
        toggleWishlist,
        notifications,
        showNotification,
        removeNotification,
      }}
    >
      {children}
    </StoreContext.Provider>
  );
};

export const useStore = () => {
  const context = useContext(StoreContext);
  if (!context) throw new Error('useStore must be used within StoreProvider');
  return context;
};
