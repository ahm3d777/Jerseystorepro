import React, { createContext, useContext, useState, ReactNode, useEffect, useCallback, useMemo, useRef } from 'react';
import { Product, CartItem, PageView, StoreConfig } from '../types';
import { MOCK_PRODUCTS } from '../constants';
import { getConfig, getProducts } from '../lib/api';
import { isCustomized, unitPrice } from '../shared/pricing';
import { categoryFromSlug, categoryLabel, normalizeCategory, shopPath } from '../lib/navigation';

export type ThemeMode = 'dark' | 'light';

interface Notification {
  message: string;
  type: 'success' | 'info' | 'error';
  id: number;
}

interface StoreContextType {
  // Theme (Dark Luxury from DESIGN.md by default, switchable to Light Editorial)
  theme: ThemeMode;
  toggleTheme: () => void;

  // Catalogue (live from the API, seed data as offline fallback)
  products: Product[];
  productsLoading: boolean;
  config: StoreConfig | null;

  // Navigation (kept in sync with the URL so pages are linkable and the back button works)
  currentPage: PageView;
  currentProduct: Product | null;
  navigateTo: (page: PageView, product?: Product) => void;

  // Shop Filter & Search
  activeCategory: string;
  setCategory: (category: string) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;

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
    /* storage unavailable (private mode) */
  }
};

export function matchesCategoryFilter(product: Product, category: string): boolean {
  if (!category || category === 'All' || category === 'All Drops') return true;
  if (category === 'Player ADV' || category === 'Player ADV Tier') return Boolean(product.isPlayerEdition);
  if (category === 'Dhaka Stock') return product.status === 'in-stock' || product.status === 'low-stock';
  if (category === 'Retro Heritage' || category === 'Retro 90s') {
    return product.type === 'Special' || ['3', '5', '7', '10'].includes(product.id);
  }
  if (category === 'Vault / Drops') {
    return (
      product.type === 'Special' ||
      product.status === 'pre-order' ||
      product.status === 'low-stock' ||
      Boolean(product.originalPrice)
    );
  }
  return product.league === category;
}

interface ParsedLocation {
  page: PageView;
  productId?: string;
  category: string;
  query: string;
}

function parseLocation(): ParsedLocation {
  const path = window.location.pathname.replace(/\/+$/, '') || '/';
  const params = new URLSearchParams(window.location.search);
  const base = { category: 'All', query: '' };
  if (path === '/shop') {
    return { page: 'shop', category: categoryFromSlug(params.get('category')), query: params.get('q') ?? '' };
  }
  if (path === '/cart' || path === '/checkout') return { ...base, page: 'cart' };
  if (path === '/wishlist') return { ...base, page: 'wishlist' };
  if (path.startsWith('/order/')) return { ...base, page: 'order' };
  const m = path.match(/^\/product\/([^/]+)$/);
  if (m) return { ...base, page: 'product', productId: decodeURIComponent(m[1]) };
  return { ...base, page: 'home' };
}

const pathFor = (page: PageView, product: Product | null | undefined, category: string, query: string) =>
  ({
    home: '/',
    shop: shopPath(category, query),
    cart: '/cart',
    wishlist: '/wishlist',
    order: window.location.pathname + window.location.search,
    product: product ? `/product/${encodeURIComponent(product.id)}` : '/shop'
  })[page];

const currentUrl = () => window.location.pathname + window.location.search;

/** Scroll instantly (the global smooth-scroll would otherwise animate every page change). */
const jumpTo = (y: number) => window.scrollTo({ top: y, left: 0, behavior: 'instant' as ScrollBehavior });

const BRAND_TITLE = 'PREMIUM KITS — Authentic Football Jerseys in Bangladesh';

export const StoreProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const initial = useMemo(parseLocation, []);
  const [theme, setTheme] = useState<ThemeMode>(() => readStorage<ThemeMode>('pk_theme', 'dark'));
  const [currentPage, setCurrentPage] = useState<PageView>(initial.page);
  const [currentProductId, setCurrentProductId] = useState<string | null>(initial.productId ?? null);
  const [activeCategory, setActiveCategory] = useState<string>(initial.category);
  const [searchQuery, setSearchQueryState] = useState<string>(initial.query);

  // Latest values for code that sets several of these in one click (e.g. setCategory → navigateTo).
  const pageRef = useRef<PageView>(initial.page);
  const categoryRef = useRef(initial.category);
  const queryRef = useRef(initial.query);

  const [products, setProducts] = useState<Product[]>(MOCK_PRODUCTS);
  const [productsLoading, setProductsLoading] = useState(true);
  const [config, setConfig] = useState<StoreConfig | null>(null);

  const [cart, setCart] = useState<CartItem[]>(() => readStorage('pk_cart', []));
  const [wishlist, setWishlist] = useState<string[]>(() => readStorage('pk_wishlist', []));
  const [notifications, setNotifications] = useState<Notification[]>([]);

  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    writeStorage('pk_theme', theme);
  }, [theme]);

  const toggleTheme = useCallback(() => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  }, []);

  useEffect(() => writeStorage('pk_cart', cart), [cart]);
  useEffect(() => writeStorage('pk_wishlist', wishlist), [wishlist]);

  // Load the live catalogue + payment config, while blending local studio fallback images if needed.
  useEffect(() => {
    let cancelled = false;
    Promise.all([getProducts(), getConfig()])
      .then(([live, cfg]) => {
        if (cancelled) return;
        const enriched = live.map((item) => {
          const seedMatch = MOCK_PRODUCTS.find((m) => m.id === item.id);
          if (!seedMatch) return item;
          const mergedGallery = Array.from(new Set([...(seedMatch.gallery ?? []), ...(item.gallery ?? [])]));
          return {
            ...item,
            image: seedMatch.image || item.image,
            gallery: mergedGallery.length > 0 ? mergedGallery : item.gallery
          };
        });
        setProducts(enriched);
        setConfig(cfg);
        setCart((prev) =>
          prev
            .filter((item) => enriched.some((p) => p.id === item.id))
            .map((item) => ({
              ...item,
              ...enriched.find((p) => p.id === item.id)!,
              cartId: item.cartId,
              selectedSize: item.selectedSize,
              quantity: item.quantity,
              customization: item.customization
            }))
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

  // We restore scroll ourselves: the browser would try before React has rendered the page.
  useEffect(() => {
    if ('scrollRestoration' in window.history) window.history.scrollRestoration = 'manual';
  }, []);

  // Back / forward buttons.
  useEffect(() => {
    const onPop = (e: PopStateEvent) => {
      const loc = parseLocation();
      pageRef.current = loc.page;
      categoryRef.current = loc.category;
      queryRef.current = loc.query;
      setCurrentPage(loc.page);
      setActiveCategory(loc.category);
      setSearchQueryState(loc.query);
      if (loc.productId) setCurrentProductId(loc.productId);

      const y = typeof e.state?.scrollY === 'number' ? e.state.scrollY : 0;
      // Re-apply once the page (and any skeleton → content swap) has rendered.
      requestAnimationFrame(() => jumpTo(y));
      if (y > 0) setTimeout(() => jumpTo(y), 400);
    };
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);

  const currentProduct = useMemo(
    () => products.find((p) => p.id === currentProductId) ?? null,
    [products, currentProductId]
  );

  /** Push a new history entry, remembering where the user was scrolled on the current one. */
  const pushUrl = useCallback((path: string) => {
    if (path === currentUrl()) return;
    window.history.replaceState({ ...(window.history.state ?? {}), scrollY: window.scrollY }, '');
    window.history.pushState({ scrollY: 0 }, '', path);
  }, []);

  const navigateTo = useCallback(
    (page: PageView, product?: Product) => {
      if (product) setCurrentProductId(product.id);
      pageRef.current = page;
      setCurrentPage(page);
      pushUrl(pathFor(page, product, categoryRef.current, queryRef.current));
      jumpTo(0);
    },
    [pushUrl]
  );

  const setCategory = useCallback(
    (category: string) => {
      const next = normalizeCategory(category);
      categoryRef.current = next;
      setActiveCategory(next);
      // Changing category on the shop page is a navigation of its own (back button returns to the previous one).
      if (pageRef.current === 'shop') pushUrl(shopPath(next, queryRef.current));
    },
    [pushUrl]
  );

  const setSearchQuery = useCallback((query: string) => {
    queryRef.current = query;
    setSearchQueryState(query);
    // Typing shouldn't create a history entry per keystroke — just keep the URL shareable.
    if (pageRef.current === 'shop') {
      window.history.replaceState(window.history.state, '', shopPath(categoryRef.current, query));
    }
  }, []);

  // Descriptive tab titles for each page.
  useEffect(() => {
    const titles: Record<PageView, string> = {
      home: BRAND_TITLE,
      shop:
        (searchQuery.trim()
          ? `“${searchQuery.trim()}” in ${categoryLabel(activeCategory)}`
          : activeCategory === 'All'
            ? 'Shop All Jerseys'
            : categoryLabel(activeCategory)) + ' · PREMIUM KITS',
      product: currentProduct ? `${currentProduct.name} · PREMIUM KITS` : 'Jersey · PREMIUM KITS',
      cart: 'Your Bag · PREMIUM KITS',
      wishlist: 'Wishlist · PREMIUM KITS',
      order: 'Order Status · PREMIUM KITS'
    };
    document.title = titles[currentPage];
  }, [currentPage, activeCategory, searchQuery, currentProduct]);

  const removeNotification = useCallback((id: number) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  }, []);

  const showNotification = useCallback(
    (message: string, type: Notification['type'] = 'success') => {
      const id = Date.now() + Math.random();
      setNotifications((prev) => [...prev, { message, type, id }]);
      setTimeout(() => removeNotification(id), 3500);
    },
    [removeNotification]
  );

  const addToCart = (
    product: Product,
    size: string,
    customization?: { name: string; number: string; font: string }
  ) => {
    if (product.status === 'out-of-stock') {
      showNotification(`${product.name} is sold out`, 'error');
      return;
    }
    const newItem: CartItem = {
      ...product,
      cartId: Math.random().toString(36).slice(2, 11),
      selectedSize: size,
      quantity: 1,
      customization: isCustomized(customization) ? customization : undefined
    };
    setCart((prev) => [...prev, newItem]);
    showNotification(`Added ${product.name} (${size}) to bag`);
  };

  const removeFromCart = (cartId: string) => {
    setCart((prev) => prev.filter((item) => item.cartId !== cartId));
  };

  const updateQuantity = (cartId: string, delta: number) => {
    setCart((prev) =>
      prev.map((item) => {
        if (item.cartId !== cartId) return item;
        const maxForProduct =
          item.isPreorder || item.stock === undefined ? 10 : Math.max(1, Math.min(10, item.stock));
        return { ...item, quantity: Math.min(maxForProduct, Math.max(1, item.quantity + delta)) };
      })
    );
  };

  const clearCart = () => setCart([]);

  const toggleWishlist = (productId: string) => {
    setWishlist((prev) => {
      const isRemoving = prev.includes(productId);
      showNotification(isRemoving ? 'Removed from Wishlist' : 'Saved to Wishlist', 'info');
      return isRemoving ? prev.filter((id) => id !== productId) : [...prev, productId];
    });
  };

  const cartTotal = cart.reduce(
    (acc, item) => acc + unitPrice(item.price, isCustomized(item.customization)) * item.quantity,
    0
  );
  const cartCount = cart.reduce((acc, item) => acc + item.quantity, 0);

  return (
    <StoreContext.Provider
      value={{
        theme,
        toggleTheme,
        products,
        productsLoading,
        config,
        currentPage,
        currentProduct,
        navigateTo,
        activeCategory,
        setCategory,
        searchQuery,
        setSearchQuery,
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
        removeNotification
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
