import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import {
  ShoppingBag,
  Search,
  Menu,
  X,
  Heart,
  ChevronRight,
  Sun,
  Moon,
  ArrowUpRight,
  Lock,
  Truck,
  PackageSearch,
  CornerDownLeft,
  Wallet
} from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { CURRENCY_SYMBOL } from '../constants';
import { FREE_SHIPPING_THRESHOLD } from '../shared/pricing';
import { SHOP_CATEGORIES, ShopCategory, lastOrderPath, shopPath, spaClick } from '../lib/navigation';
import { Product } from '../types';

const FREE_DELIVERY_LABEL = `${CURRENCY_SYMBOL}${FREE_SHIPPING_THRESHOLD.toLocaleString('en-US')}`;
const QUICK_SEARCHES = ['Barcelona', 'Real Madrid', 'Argentina', 'Messi', 'Retro'];
const PRIMARY_LINKS = SHOP_CATEGORIES.filter((c) => !c.tone || c.tone === 'default');
const STOCK_LINK = SHOP_CATEGORIES.find((c) => c.tone === 'stock')!;
const VAULT_LINK = SHOP_CATEGORIES.find((c) => c.tone === 'vault')!;

const isMac = typeof navigator !== 'undefined' && /Mac|iPhone|iPad/.test(navigator.platform || navigator.userAgent);

/** Locks page scroll while an overlay is open, without the layout jumping when the scrollbar disappears. */
function useScrollLock(locked: boolean) {
  useEffect(() => {
    if (!locked) return;
    const { body, documentElement } = document;
    const scrollbar = window.innerWidth - documentElement.clientWidth;
    const prev = { overflow: body.style.overflow, paddingRight: body.style.paddingRight };
    body.style.overflow = 'hidden';
    if (scrollbar > 0) body.style.paddingRight = `${scrollbar}px`;
    return () => {
      body.style.overflow = prev.overflow;
      body.style.paddingRight = prev.paddingRight;
    };
  }, [locked]);
}

/** Keeps Tab / Shift+Tab inside `container`, closes on Escape and hands focus back to the opener. */
function useDialogFocus(open: boolean, container: React.RefObject<HTMLElement | null>, onClose: () => void) {
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    if (!open) return;
    const opener = document.activeElement as HTMLElement | null;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onCloseRef.current();
        return;
      }
      if (e.key !== 'Tab' || !container.current) return;
      const nodes = container.current.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), input:not([disabled]), [tabindex]:not([tabindex="-1"])'
      );
      const focusable = (Array.prototype.slice.call(nodes) as HTMLElement[]).filter((el) => el.offsetParent !== null);
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      // Return focus to whatever opened the dialog (if it is still on the page).
      if (opener && document.contains(opener)) opener.focus({ preventScroll: true });
    };
  }, [open, container]);
}

/* -------------------------------------------------------------------------- */

export const Navbar = () => {
  const {
    theme,
    toggleTheme,
    navigateTo,
    cartCount,
    cartTotal,
    wishlist,
    currentPage,
    setCategory,
    activeCategory,
    products,
    searchQuery,
    setSearchQuery,
    showNotification
  } = useStore();

  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const headerRef = useRef<HTMLElement>(null);
  const menuButtonRef = useRef<HTMLButtonElement>(null);

  const onShop = currentPage === 'shop';
  const isCategoryActive = (c: ShopCategory) => onShop && activeCategory === c.id;

  // Elevation once the page scrolls under the header.
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Publish the header's height so sticky elements on pages (shop filters, order summary) sit right below it.
  useEffect(() => {
    const el = headerRef.current;
    if (!el) return;
    const publish = () => document.documentElement.style.setProperty('--header-h', `${el.offsetHeight}px`);
    publish();
    const ro = new ResizeObserver(publish);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // ⌘K / Ctrl+K opens search from anywhere; "/" too, when not typing in a field.
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      const typing = target.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName);
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setMenuOpen(false);
        setSearchOpen((prev) => !prev);
      } else if (e.key === '/' && !typing && !e.metaKey && !e.ctrlKey && !e.altKey) {
        e.preventDefault();
        setMenuOpen(false);
        setSearchOpen(true);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  // Close the drawer if the viewport grows into the desktop layout.
  useEffect(() => {
    const mq = window.matchMedia('(min-width: 1024px)');
    const onChange = () => mq.matches && setMenuOpen(false);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  // Any navigation closes overlays.
  useEffect(() => {
    setMenuOpen(false);
    setSearchOpen(false);
  }, [currentPage, activeCategory]);

  const goToCategory = useCallback(
    (category: string, query = '') => {
      setCategory(category);
      setSearchQuery(query);
      navigateTo('shop');
      setMenuOpen(false);
    },
    [setCategory, setSearchQuery, navigateTo]
  );

  const goTo = (page: 'home' | 'cart' | 'wishlist') => {
    setMenuOpen(false);
    navigateTo(page);
  };

  const trackOrder = () => {
    setMenuOpen(false);
    const path = lastOrderPath();
    if (!path) {
      showNotification('No recent order on this device — open the link from your order confirmation.', 'info');
      return;
    }
    window.history.pushState(null, '', path);
    navigateTo('order');
  };

  const openSearch = () => {
    setMenuOpen(false);
    setSearchOpen(true);
  };

  const iconButton =
    'relative inline-flex items-center justify-center w-10 h-10 rounded-xl border border-surface-border bg-surface-container-lowest/80 text-on-surface hover:bg-surface-charcoal-elevated hover:border-primary-container/50 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-container focus-visible:ring-offset-2 focus-visible:ring-offset-surface-charcoal';

  return (
    <>
      {/* ── Announcement bar (scrolls away; the header below stays pinned) ── */}
      <div
        role="region"
        aria-label="Store information"
        className="bg-surface-container-lowest border-b border-surface-border/80 text-[11px] tracking-wide text-text-muted"
      >
        <div className="max-w-7xl mx-auto h-8 px-4 sm:px-6 lg:px-8 flex items-center justify-center md:justify-between gap-4">
          <p className="flex items-center gap-2 min-w-0">
            <Truck size={13} className="text-secondary shrink-0" aria-hidden />
            <span className="truncate">
              Free delivery on orders over <strong className="text-on-surface font-semibold">{FREE_DELIVERY_LABEL}</strong>
              <span className="hidden sm:inline"> · Cash on Delivery in all 64 districts</span>
            </span>
          </p>
          <div className="hidden md:flex items-center gap-4 shrink-0">
            <span className="hidden lg:flex items-center gap-1.5">
              <Wallet size={13} className="text-secondary" aria-hidden />
              bKash · Nagad · Rocket · Cards
            </span>
            <span className="hidden lg:inline text-surface-container-highest" aria-hidden>
              |
            </span>
            <button
              type="button"
              onClick={trackOrder}
              className="flex items-center gap-1.5 text-on-surface/90 hover:text-secondary transition-colors rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-container"
            >
              <PackageSearch size={13} aria-hidden />
              Track order
            </button>
          </div>
        </div>
      </div>

      {/* ── Pinned header ── */}
      <header
        ref={headerRef}
        className="sticky top-0 z-50 px-2.5 sm:px-4 lg:px-6 pt-2 pb-1 pointer-events-none"
      >
        <div
          className={`max-w-7xl mx-auto pointer-events-auto rounded-2xl border bg-surface-charcoal/90 backdrop-blur-xl backdrop-saturate-150 transition-shadow duration-300 ${
            scrolled
              ? 'border-surface-border shadow-[0_12px_32px_-8px_rgba(0,0,0,0.45)]'
              : 'border-surface-border/80 shadow-[0_6px_24px_-10px_rgba(0,0,0,0.35)]'
          }`}
        >
          {/* Row 1: brand · search · actions */}
          <div className="flex items-center gap-2 sm:gap-3 px-3 sm:px-4 lg:px-5 h-16">
            <a
              href="/"
              onClick={spaClick(() => goTo('home'))}
              aria-label="Premium Kits — home"
              className="flex items-center gap-2.5 shrink-0 group rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-container"
            >
              <span className="relative w-10 h-10 rounded-xl bg-surface-container-lowest border border-surface-border flex items-center justify-center group-hover:border-primary-container/60 transition-colors">
                <span className="font-display-hero font-black text-lg tracking-tighter text-on-surface group-hover:text-primary-container transition-colors">
                  PK
                </span>
                <span className="absolute bottom-1 right-1 w-1.5 h-1.5 bg-primary-container rounded-full shadow-[0_0_8px_#e11d48]" />
              </span>
              <span className="flex flex-col max-[359px]:hidden">
                <span className="font-headline-md text-sm font-black tracking-tight text-on-surface uppercase leading-none">
                  Premium Kits
                </span>
                <span className="font-label-caps text-[9px] sm:text-[10px] font-bold tracking-widest text-secondary uppercase leading-none mt-1">
                  Authentic Gear
                </span>
              </span>
            </a>

            {/* Search field (tablet & up) */}
            <button
              type="button"
              onClick={openSearch}
              aria-label="Search jerseys"
              aria-haspopup="dialog"
              className="hidden md:flex flex-1 max-w-md mx-auto items-center gap-2.5 h-10 pl-3.5 pr-2 rounded-full bg-surface-container-lowest/90 border border-surface-border text-text-muted hover:text-on-surface hover:border-primary-container/50 transition-colors group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-container"
            >
              <Search size={15} className="shrink-0 group-hover:text-primary-container transition-colors" aria-hidden />
              <span className="flex-1 min-w-0 text-left truncate font-body-sm text-body-sm">
                {searchQuery ? (
                  <span className="text-on-surface">{searchQuery}</span>
                ) : (
                  'Search clubs, nations, players…'
                )}
              </span>
              <kbd className="hidden lg:inline-flex items-center px-1.5 py-0.5 text-[10px] font-mono text-text-muted bg-surface-charcoal border border-surface-border rounded">
                {isMac ? '⌘K' : 'Ctrl K'}
              </kbd>
            </button>

            <div className="ml-auto md:ml-0 flex items-center gap-1.5 sm:gap-2 shrink-0">
              <button type="button" onClick={openSearch} aria-label="Search jerseys" className={`md:hidden ${iconButton}`}>
                <Search size={18} />
              </button>

              <button
                type="button"
                onClick={toggleTheme}
                aria-label={theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}
                title={theme === 'dark' ? 'Light theme' : 'Dark theme'}
                className={`hidden sm:inline-flex ${iconButton}`}
              >
                {theme === 'dark' ? <Sun size={17} className="text-secondary" /> : <Moon size={17} />}
              </button>

              <a
                href="/wishlist"
                onClick={spaClick(() => goTo('wishlist'))}
                aria-label={`Wishlist${wishlist.length ? `, ${wishlist.length} saved` : ''}`}
                aria-current={currentPage === 'wishlist' ? 'page' : undefined}
                className={`hidden sm:inline-flex ${iconButton} ${currentPage === 'wishlist' ? 'border-primary-container/60' : ''}`}
              >
                <Heart
                  size={17}
                  fill={wishlist.length > 0 ? 'currentColor' : 'none'}
                  className={wishlist.length > 0 ? 'text-primary-container' : ''}
                />
                {wishlist.length > 0 && <CountBadge count={wishlist.length} />}
              </a>

              <a
                href="/cart"
                onClick={spaClick(() => goTo('cart'))}
                aria-label={`Shopping bag, ${cartCount} ${cartCount === 1 ? 'item' : 'items'}`}
                aria-current={currentPage === 'cart' ? 'page' : undefined}
                className={`${iconButton} lg:w-auto lg:px-3 lg:gap-2 ${currentPage === 'cart' ? 'border-primary-container/60' : ''}`}
              >
                <ShoppingBag size={17} />
                <span className="hidden lg:inline text-xs font-mono font-bold whitespace-nowrap">
                  {CURRENCY_SYMBOL} {cartTotal.toLocaleString('en-US')}
                </span>
                {cartCount > 0 && <CountBadge count={cartCount} glow />}
              </a>

              <button
                ref={menuButtonRef}
                type="button"
                onClick={() => setMenuOpen(true)}
                aria-label="Open menu"
                aria-haspopup="dialog"
                aria-expanded={menuOpen}
                aria-controls="mobile-nav"
                className={`lg:hidden ${iconButton}`}
              >
                <Menu size={19} />
              </button>
            </div>
          </div>

          {/* Row 2: categories (desktop) */}
          <nav aria-label="Shop categories" className="hidden lg:block border-t border-surface-border/70">
            <div className="flex items-center gap-2 xl:gap-3 px-2.5 xl:px-4 h-12">
              <ul className="flex items-center gap-0.5 min-w-0 overflow-x-auto no-scrollbar">
                {PRIMARY_LINKS.map((c) => {
                  const active = isCategoryActive(c);
                  return (
                    <li key={c.id} className="shrink-0">
                      <a
                        href={shopPath(c.id)}
                        onClick={spaClick(() => goToCategory(c.id))}
                        aria-current={active ? 'page' : undefined}
                        className={`relative flex items-center gap-1.5 h-9 px-2 xl:px-3 rounded-lg font-label-caps text-[11px] uppercase tracking-wide xl:tracking-wider whitespace-nowrap transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-container ${
                          active
                            ? 'bg-primary-container text-on-primary-container font-bold'
                            : 'text-on-surface/80 hover:text-on-surface hover:bg-surface-charcoal-elevated'
                        }`}
                      >
                        {c.label}
                        {c.badge && (
                          <span
                            className={`px-1.5 py-0.5 rounded text-[8px] font-bold tracking-normal leading-none ${
                              active ? 'bg-surface-container-lowest text-secondary' : 'bg-primary-container text-on-primary-container'
                            }`}
                          >
                            {c.badge}
                          </span>
                        )}
                      </a>
                    </li>
                  );
                })}
              </ul>

              <div className="ml-auto flex items-center gap-1 xl:gap-2 shrink-0">
                <a
                  href={shopPath(STOCK_LINK.id)}
                  onClick={spaClick(() => goToCategory(STOCK_LINK.id))}
                  aria-current={isCategoryActive(STOCK_LINK) ? 'page' : undefined}
                  className={`flex items-center gap-1.5 h-9 px-2 xl:px-3 rounded-lg font-label-caps text-[11px] uppercase tracking-wide xl:tracking-wider whitespace-nowrap transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-container ${
                    isCategoryActive(STOCK_LINK)
                      ? 'bg-emerald-500/15 text-emerald-500 font-bold'
                      : 'text-on-surface/80 hover:text-on-surface hover:bg-surface-charcoal-elevated'
                  }`}
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" aria-hidden />
                  {STOCK_LINK.label}
                </a>
                <a
                  href={shopPath(VAULT_LINK.id)}
                  onClick={spaClick(() => goToCategory(VAULT_LINK.id))}
                  aria-current={isCategoryActive(VAULT_LINK) ? 'page' : undefined}
                  className={`flex items-center gap-1.5 h-9 px-2.5 xl:px-3 rounded-lg border font-label-caps text-[11px] uppercase tracking-wide xl:tracking-wider whitespace-nowrap transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary ${
                    isCategoryActive(VAULT_LINK)
                      ? 'bg-secondary text-on-secondary border-secondary font-bold'
                      : 'border-secondary/40 bg-secondary/10 text-secondary hover:bg-secondary hover:text-on-secondary'
                  }`}
                >
                  <Lock size={12} aria-hidden />
                  {VAULT_LINK.label}
                </a>
              </div>
            </div>
          </nav>
        </div>
      </header>

      <SearchDialog
        open={searchOpen}
        onClose={() => setSearchOpen(false)}
        products={products}
        initialQuery={searchQuery}
        onSubmitQuery={(q) => {
          setSearchOpen(false);
          goToCategory('All', q);
        }}
        onPickCategory={(c) => {
          setSearchOpen(false);
          goToCategory(c);
        }}
        onPickProduct={(p) => {
          setSearchOpen(false);
          navigateTo('product', p);
        }}
      />

      <MobileDrawer
        open={menuOpen}
        onClose={() => setMenuOpen(false)}
        isCategoryActive={isCategoryActive}
        onCategory={goToCategory}
        onSearch={openSearch}
        onHome={() => goTo('home')}
        onWishlist={() => goTo('wishlist')}
        onCart={() => goTo('cart')}
        onTrackOrder={trackOrder}
        wishlistCount={wishlist.length}
        cartCount={cartCount}
        currentPage={currentPage}
        theme={theme}
        toggleTheme={toggleTheme}
      />
    </>
  );
};

/* -------------------------------------------------------------------------- */

const CountBadge = ({ count, glow = false }: { count: number; glow?: boolean }) => (
  <span
    key={count /* re-mount → replays the pop animation whenever the count changes */}
    aria-hidden
    className={`absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] px-1 rounded-full bg-primary-container text-on-primary-container text-[10px] font-bold leading-none flex items-center justify-center ring-2 ring-surface-charcoal animate-badge-pop ${
      glow ? 'shadow-[0_0_12px_rgba(225,29,72,0.5)]' : ''
    }`}
  >
    {count > 99 ? '99+' : count}
  </span>
);

/* -------------------------------------------------------------------------- */

interface SearchDialogProps {
  open: boolean;
  onClose: () => void;
  products: Product[];
  initialQuery: string;
  onSubmitQuery: (q: string) => void;
  onPickCategory: (category: string) => void;
  onPickProduct: (p: Product) => void;
}

const SearchDialog = ({
  open,
  onClose,
  products,
  initialQuery,
  onSubmitQuery,
  onPickCategory,
  onPickProduct
}: SearchDialogProps) => {
  const [query, setQuery] = useState(initialQuery);
  const [highlight, setHighlight] = useState(-1);
  const panelRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useScrollLock(open);
  useDialogFocus(open, panelRef, onClose);

  useEffect(() => {
    if (!open) return;
    setQuery(initialQuery);
    setHighlight(-1);
    // Wait a frame so the input is visible before focusing (focus on hidden elements is ignored).
    const id = requestAnimationFrame(() => inputRef.current?.select());
    return () => cancelAnimationFrame(id);
  }, [open, initialQuery]);

  const trimmed = query.trim();
  const results = useMemo(() => {
    const q = trimmed.toLowerCase();
    if (!q) return products.slice(0, 4);
    return products
      .filter((p) => `${p.name} ${p.team} ${p.league} ${p.description ?? ''}`.toLowerCase().includes(q))
      .slice(0, 6);
  }, [trimmed, products]);

  const matchingCategories = useMemo(
    () =>
      trimmed
        ? SHOP_CATEGORIES.filter((c) => c.id !== 'All' && c.label.toLowerCase().includes(trimmed.toLowerCase()))
        : [],
    [trimmed]
  );

  useEffect(() => setHighlight(-1), [trimmed]);

  const submit = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (highlight >= 0 && results[highlight]) onPickProduct(results[highlight]);
    else onSubmitQuery(trimmed);
  };

  const onInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlight((h) => (results.length ? (h + 1) % results.length : -1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlight((h) => (results.length ? (h <= 0 ? results.length - 1 : h - 1) : -1));
    }
  };

  return createPortal(
    <div
      className={`fixed inset-0 z-[150] flex items-start justify-center px-3 sm:px-4 pt-[max(1rem,8vh)] ${
        open ? 'opacity-100 visible' : 'opacity-0 invisible pointer-events-none'
      }`}
      // Visibility flips immediately on open (so the input can take focus) and only after the fade on close.
      style={{ transition: open ? 'opacity 200ms' : 'opacity 200ms, visibility 0s linear 200ms' }}
      aria-hidden={!open}
    >
      <div className="absolute inset-0 bg-background/80 backdrop-blur-xl" onClick={onClose} />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label="Search jerseys"
        className={`relative w-full max-w-2xl max-h-[min(640px,calc(100dvh-2rem))] flex flex-col rounded-2xl bg-surface-charcoal border border-surface-border shadow-2xl overflow-hidden transition-transform duration-200 ${
          open ? 'translate-y-0 scale-100' : '-translate-y-2 scale-[0.98]'
        }`}
      >
        <form onSubmit={submit} role="search" className="flex items-center gap-3 px-4 sm:px-5 h-16 border-b border-surface-border shrink-0">
          <Search size={20} className="text-primary-container shrink-0" aria-hidden />
          <input
            ref={inputRef}
            type="search"
            enterKeyHint="search"
            autoComplete="off"
            spellCheck={false}
            placeholder="Search clubs, nations, players…"
            aria-label="Search jerseys"
            aria-controls="search-results"
            aria-activedescendant={highlight >= 0 ? `search-result-${highlight}` : undefined}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={onInputKeyDown}
            tabIndex={open ? 0 : -1}
            className="flex-1 min-w-0 bg-transparent font-headline-md text-base sm:text-title-sm text-on-surface placeholder:text-text-muted focus:outline-none [&::-webkit-search-cancel-button]:hidden"
          />
          {query && (
            <button
              type="button"
              onClick={() => {
                setQuery('');
                inputRef.current?.focus();
              }}
              tabIndex={open ? 0 : -1}
              className="text-text-muted hover:text-on-surface font-label-caps text-[10px] uppercase px-2 py-1 rounded-md bg-surface-charcoal-elevated border border-surface-border"
            >
              Clear
            </button>
          )}
          <button
            type="button"
            onClick={onClose}
            tabIndex={open ? 0 : -1}
            className="inline-flex items-center justify-center w-9 h-9 rounded-lg bg-surface-charcoal-elevated text-text-muted hover:text-on-surface border border-surface-border transition-colors"
            aria-label="Close search"
          >
            <X size={17} />
          </button>
        </form>

        <div className="p-4 sm:p-5 space-y-5 overflow-y-auto overscroll-contain">
          {!trimmed && (
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-label-caps text-[10px] uppercase tracking-widest text-text-muted mr-1">Popular</span>
              {QUICK_SEARCHES.map((tag) => (
                <button
                  key={tag}
                  type="button"
                  tabIndex={open ? 0 : -1}
                  onClick={() => {
                    setQuery(tag);
                    inputRef.current?.focus();
                  }}
                  className="px-3 py-1.5 rounded-full bg-surface-charcoal-elevated hover:bg-primary-container text-on-surface hover:text-on-primary-container border border-surface-border font-label-caps text-[11px] uppercase transition-colors"
                >
                  {tag}
                </button>
              ))}
            </div>
          )}

          {matchingCategories.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {matchingCategories.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  tabIndex={open ? 0 : -1}
                  onClick={() => onPickCategory(c.id)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-surface-border bg-surface-charcoal-elevated hover:border-primary-container/60 text-on-surface font-label-caps text-[11px] uppercase transition-colors"
                >
                  Browse {c.label}
                  <ChevronRight size={13} className="text-primary-container" />
                </button>
              ))}
            </div>
          )}

          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="font-label-caps text-[11px] uppercase tracking-wider text-secondary" aria-live="polite">
                {trimmed ? `${results.length ? results.length : 'No'} matching ${results.length === 1 ? 'jersey' : 'jerseys'}` : 'Featured'}
              </span>
              <button
                type="button"
                tabIndex={open ? 0 : -1}
                onClick={() => onSubmitQuery(trimmed)}
                className="font-label-caps text-[11px] uppercase text-primary-container hover:underline flex items-center gap-1"
              >
                {trimmed ? 'See all results' : 'Browse the shop'}
                <ArrowUpRight size={13} />
              </button>
            </div>

            {results.length === 0 ? (
              <p className="py-8 text-center text-text-muted font-body-sm text-body-sm">
                Nothing matched “{trimmed}”. Try a club, nation or league.
              </p>
            ) : (
              <ul id="search-results" role="listbox" aria-label="Search results" className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {results.map((item, i) => (
                  <li key={item.id} role="presentation">
                    <a
                      id={`search-result-${i}`}
                      role="option"
                      aria-selected={i === highlight}
                      href={`/product/${encodeURIComponent(item.id)}`}
                      tabIndex={open ? 0 : -1}
                      onClick={spaClick(() => onPickProduct(item))}
                      onMouseEnter={() => setHighlight(i)}
                      className={`flex items-center gap-3.5 p-2.5 rounded-xl border text-left transition-colors group ${
                        i === highlight
                          ? 'bg-surface-charcoal-elevated border-primary-container/60'
                          : 'bg-surface-charcoal-elevated/60 border-surface-border'
                      }`}
                    >
                      <img
                        src={item.image}
                        alt=""
                        loading="lazy"
                        className="w-12 h-14 object-cover rounded-lg bg-surface-container-lowest shrink-0"
                      />
                      <span className="min-w-0 flex-1">
                        <span className="block font-label-caps text-[10px] uppercase text-secondary truncate">{item.team}</span>
                        <span className="block font-headline-md text-body-md font-bold text-on-surface truncate">{item.name}</span>
                        <span className="block font-label-numeric text-body-sm font-bold text-text-muted">
                          {CURRENCY_SYMBOL} {item.price.toLocaleString('en-US')}
                        </span>
                      </span>
                    </a>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        <div className="hidden sm:flex items-center gap-4 px-5 h-10 border-t border-surface-border text-[11px] text-text-muted shrink-0">
          <span className="flex items-center gap-1.5">
            <kbd className="px-1.5 py-0.5 rounded border border-surface-border font-mono text-[10px]">↑</kbd>
            <kbd className="px-1.5 py-0.5 rounded border border-surface-border font-mono text-[10px]">↓</kbd>
            to move
          </span>
          <span className="flex items-center gap-1.5">
            <kbd className="px-1.5 py-0.5 rounded border border-surface-border font-mono text-[10px] inline-flex">
              <CornerDownLeft size={10} />
            </kbd>
            to open
          </span>
          <span className="flex items-center gap-1.5">
            <kbd className="px-1.5 py-0.5 rounded border border-surface-border font-mono text-[10px]">Esc</kbd>
            to close
          </span>
        </div>
      </div>
    </div>,
    document.body
  );
};

/* -------------------------------------------------------------------------- */

interface MobileDrawerProps {
  open: boolean;
  onClose: () => void;
  isCategoryActive: (c: ShopCategory) => boolean;
  onCategory: (category: string) => void;
  onSearch: () => void;
  onHome: () => void;
  onWishlist: () => void;
  onCart: () => void;
  onTrackOrder: () => void;
  wishlistCount: number;
  cartCount: number;
  currentPage: string;
  theme: 'dark' | 'light';
  toggleTheme: () => void;
}

const MobileDrawer = ({
  open,
  onClose,
  isCategoryActive,
  onCategory,
  onSearch,
  onHome,
  onWishlist,
  onCart,
  onTrackOrder,
  wishlistCount,
  cartCount,
  currentPage,
  theme,
  toggleTheme
}: MobileDrawerProps) => {
  const panelRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);

  useScrollLock(open);
  useDialogFocus(open, panelRef, onClose);

  useEffect(() => {
    if (!open) return;
    const id = requestAnimationFrame(() => closeRef.current?.focus());
    return () => cancelAnimationFrame(id);
  }, [open]);

  const tab = open ? 0 : -1;
  const row =
    'flex items-center justify-between w-full min-h-[44px] px-3.5 rounded-xl text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-container';

  return createPortal(
    <div
      className={`fixed inset-0 z-[145] lg:hidden ${open ? 'visible' : 'invisible'}`}
      style={{ transition: open ? 'none' : 'visibility 0s linear 300ms' }}
      aria-hidden={!open}
    >
      <div
        className={`absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-300 ${open ? 'opacity-100' : 'opacity-0'}`}
        onClick={onClose}
      />
      <div
        id="mobile-nav"
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label="Menu"
        className={`absolute inset-y-0 right-0 w-[88%] max-w-sm flex flex-col bg-surface-charcoal border-l border-surface-border shadow-2xl transition-transform duration-300 ease-out ${
          open ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between gap-3 px-4 h-16 border-b border-surface-border shrink-0">
          <a
            href="/"
            tabIndex={tab}
            onClick={spaClick(onHome)}
            className="flex items-center gap-2.5 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-container"
          >
            <span className="relative w-9 h-9 rounded-xl bg-surface-container-lowest border border-surface-border flex items-center justify-center">
              <span className="font-display-hero text-base font-black text-on-surface tracking-tighter">PK</span>
              <span className="absolute bottom-1 right-1 w-1.5 h-1.5 rounded-full bg-primary-container" />
            </span>
            <span className="font-headline-md text-sm font-black text-on-surface tracking-tight uppercase">Premium Kits</span>
          </a>
          <button
            ref={closeRef}
            type="button"
            tabIndex={tab}
            onClick={onClose}
            className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-surface-charcoal-elevated text-on-surface border border-surface-border focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-container"
            aria-label="Close menu"
          >
            <X size={18} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto overscroll-contain px-4 py-4 space-y-5">
          {/* Search shortcut */}
          <button
            type="button"
            tabIndex={tab}
            onClick={onSearch}
            className="flex items-center gap-2.5 w-full h-11 px-3.5 rounded-xl bg-surface-container-lowest border border-surface-border text-text-muted text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-container"
          >
            <Search size={16} aria-hidden />
            Search clubs, nations, players…
          </button>

          {/* Bag · wishlist · order tracking — kept above the fold */}
          <div>
            <h2 className="font-label-caps text-[10px] uppercase tracking-widest text-text-muted px-1 mb-2">Your account</h2>
            <ul className="grid grid-cols-3 gap-2">
              {[
                { label: 'Bag', icon: ShoppingBag, href: '/cart', onClick: onCart, count: cartCount, active: currentPage === 'cart' },
                { label: 'Wishlist', icon: Heart, href: '/wishlist', onClick: onWishlist, count: wishlistCount, active: currentPage === 'wishlist' },
                { label: 'Track order', icon: PackageSearch, href: null, onClick: onTrackOrder, count: 0, active: currentPage === 'order' }
              ].map(({ label, icon: Icon, href, onClick, count, active }) => {
                const cls = `relative flex flex-col items-center justify-center gap-1.5 h-16 rounded-xl border text-[10px] font-label-caps uppercase tracking-wide transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-container ${
                  active
                    ? 'border-primary-container/60 bg-surface-charcoal-elevated text-on-surface'
                    : 'border-surface-border bg-surface-charcoal-elevated/60 text-on-surface hover:bg-surface-charcoal-elevated'
                }`;
                const inner = (
                  <>
                    <Icon size={18} aria-hidden />
                    {label}
                    {count > 0 && (
                      <span className="absolute top-2 right-2 min-w-[18px] h-[18px] px-1 rounded-full bg-primary-container text-on-primary-container text-[10px] font-bold flex items-center justify-center">
                        {count}
                      </span>
                    )}
                  </>
                );
                return (
                  <li key={label}>
                    {href ? (
                      <a href={href} tabIndex={tab} onClick={spaClick(onClick)} aria-current={active ? 'page' : undefined} className={cls}>
                        {inner}
                      </a>
                    ) : (
                      <button type="button" tabIndex={tab} onClick={onClick} className={`w-full ${cls}`}>
                        {inner}
                      </button>
                    )}
                  </li>
                );
              })}
            </ul>
          </div>

          {/* Categories */}
          <nav aria-label="Shop categories">
            <h2 className="font-label-caps text-[10px] uppercase tracking-widest text-text-muted px-1 mb-2">Shop</h2>
            <ul className="space-y-0.5">
              {SHOP_CATEGORIES.map((c) => {
                const active = isCategoryActive(c);
                const tone =
                  c.tone === 'vault'
                    ? active
                      ? 'bg-secondary text-on-secondary border border-secondary'
                      : 'border border-secondary/40 bg-secondary/10 text-secondary'
                    : active
                      ? 'bg-primary-container text-on-primary-container'
                      : 'text-on-surface hover:bg-surface-charcoal-elevated';
                return (
                  <li key={c.id} className={c.tone === 'vault' ? 'pt-2' : ''}>
                    <a
                      href={shopPath(c.id)}
                      tabIndex={tab}
                      onClick={spaClick(() => onCategory(c.id))}
                      aria-current={active ? 'page' : undefined}
                      className={`${row} ${tone}`}
                    >
                      <span className="flex items-center gap-2 font-headline-md text-sm font-bold uppercase tracking-wider">
                        {c.tone === 'vault' && <Lock size={14} aria-hidden />}
                        {c.tone === 'stock' && <span className="w-2 h-2 rounded-full bg-emerald-500" aria-hidden />}
                        {c.label}
                        {c.badge && (
                          <span className="px-1.5 py-0.5 rounded bg-secondary text-on-secondary text-[9px] font-bold leading-none">
                            {c.badge}
                          </span>
                        )}
                      </span>
                      <ChevronRight size={16} className={active ? '' : 'text-text-muted'} aria-hidden />
                    </a>
                  </li>
                );
              })}
            </ul>
          </nav>

        </div>

        {/* Footer */}
        <div className="px-4 py-4 border-t border-surface-border bg-surface-container-lowest space-y-3 shrink-0 pb-[max(1rem,env(safe-area-inset-bottom))]">
          <div className="flex items-center gap-2 text-xs text-text-muted">
            <Truck size={14} className="text-secondary shrink-0" aria-hidden />
            Free delivery over {FREE_DELIVERY_LABEL} · COD nationwide
          </div>
          <button
            type="button"
            tabIndex={tab}
            onClick={toggleTheme}
            className="flex items-center justify-between w-full h-11 px-3.5 rounded-xl bg-surface-charcoal border border-surface-border text-on-surface text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-container"
          >
            <span>Theme</span>
            <span className="flex items-center gap-2 font-label-caps text-[11px] uppercase">
              {theme === 'dark' ? (
                <>
                  <Moon size={14} /> Dark
                </>
              ) : (
                <>
                  <Sun size={14} className="text-secondary" /> Light
                </>
              )}
            </span>
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};
