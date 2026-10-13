import React, { useCallback, useEffect, useState } from 'react';
import {
  LayoutDashboard,
  ShoppingCart,
  Shirt,
  LogOut,
  ExternalLink,
  Loader2,
  Menu,
  X,
  Sun,
  Moon
} from 'lucide-react';
import { adminApi } from './api';
import { ApiError } from '../lib/api';
import { Dashboard } from './Dashboard';
import { Orders } from './Orders';
import { OrderDetailView } from './OrderDetail';
import { Products } from './Products';
import { inputCls } from './ui';
import type { ThemeMode } from '../context/StoreContext';

export type AdminNav = (path: string) => void;

const useAdminPath = (): [string, AdminNav] => {
  const [path, setPath] = useState(window.location.pathname + window.location.search);
  useEffect(() => {
    const onPop = () => setPath(window.location.pathname + window.location.search);
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);
  const nav = useCallback((p: string) => {
    window.history.pushState(null, '', p);
    setPath(p);
    window.scrollTo(0, 0);
  }, []);
  return [path, nav];
};

const readAdminTheme = (): ThemeMode => {
  try {
    const saved = localStorage.getItem('pk_theme');
    return saved ? (JSON.parse(saved) as ThemeMode) : 'dark';
  } catch {
    return 'dark';
  }
};

const Login: React.FC<{ onDone: (email: string) => void; theme: ThemeMode; toggleTheme: () => void }> = ({
  onDone,
  theme,
  toggleTheme
}) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      onDone((await adminApi.login(email, password)).email);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Login failed');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-on-surface flex items-center justify-center px-4 relative">
      <button
        type="button"
        onClick={toggleTheme}
        className="absolute top-6 right-6 inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-surface-charcoal border border-surface-border font-label-caps text-label-caps uppercase text-on-surface"
      >
        {theme === 'dark' ? (
          <>
            <Sun size={14} className="text-secondary" />
            <span>Light Theme</span>
          </>
        ) : (
          <>
            <Moon size={14} className="text-primary-container" />
            <span>Dark Luxury</span>
          </>
        )}
      </button>

      <form
        onSubmit={submit}
        className="w-full max-w-sm bg-surface-charcoal border border-surface-border rounded-2xl p-8 shadow-2xl"
      >
        <div className="flex items-center gap-2.5 mb-2">
          <div className="w-9 h-9 rounded-lg bg-primary-container flex items-center justify-center">
            <span className="font-headline-md text-label-numeric font-bold text-on-primary-container">PK</span>
          </div>
          <div>
            <div className="font-headline-md text-title-sm font-bold tracking-tight text-on-surface leading-none">
              PREMIUM KITS
            </div>
            <div className="font-label-caps text-[10px] text-secondary uppercase tracking-widest mt-0.5">
              VAULT ADMIN CONSOLE
            </div>
          </div>
        </div>
        <p className="font-body-sm text-body-sm text-text-muted mb-6">Sign in to manage orders, inventory, and drops.</p>
        <label htmlFor="admin-email" className="block font-label-caps text-[10px] uppercase text-text-muted mb-1.5">
          Email
        </label>
        <input
          id="admin-email"
          className={`${inputCls} mb-4`}
          type="email"
          autoComplete="username"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <label htmlFor="admin-password" className="block font-label-caps text-[10px] uppercase text-text-muted mb-1.5">
          Password
        </label>
        <input
          id="admin-password"
          className={`${inputCls} mb-6`}
          type="password"
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        {error && (
          <p className="font-body-sm text-body-sm text-primary-container mb-4" role="alert">
            {error}
          </p>
        )}
        <button
          disabled={busy}
          className="w-full h-11 rounded-lg bg-primary-container hover:bg-crimson-vibrant text-on-primary-container font-headline-md text-label-numeric font-bold uppercase tracking-wider disabled:opacity-60 flex items-center justify-center gap-2 transition-colors shadow-lg"
        >
          {busy && <Loader2 size={16} className="animate-spin" />} Sign In
        </button>
      </form>
    </div>
  );
};

const NAV = [
  { href: '/admin', label: 'Dashboard', icon: LayoutDashboard, match: (p: string) => p === '/admin' || p === '/admin/' },
  { href: '/admin/orders', label: 'Orders', icon: ShoppingCart, match: (p: string) => p.startsWith('/admin/orders') },
  { href: '/admin/products', label: 'Products', icon: Shirt, match: (p: string) => p.startsWith('/admin/products') }
];

export default function AdminApp() {
  const [user, setUser] = useState<string | null | undefined>(undefined);
  const [path, nav] = useAdminPath();
  const [menuOpen, setMenuOpen] = useState(false);
  const [theme, setTheme] = useState<ThemeMode>(readAdminTheme);

  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    try {
      localStorage.setItem('pk_theme', JSON.stringify(theme));
    } catch {
      /* ignore */
    }
  }, [theme]);

  const toggleTheme = useCallback(() => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  }, []);

  useEffect(() => {
    document.title = 'Vault Admin · Premium Kits Bangladesh';
    adminApi
      .me()
      .then((r) => setUser(r.email))
      .catch(() => setUser(null));
  }, []);

  if (user === undefined) return <div className="min-h-screen bg-background" />;
  if (user === null) return <Login onDone={setUser} theme={theme} toggleTheme={toggleTheme} />;

  const pathname = path.split('?')[0];
  const orderMatch = pathname.match(/^\/admin\/orders\/([^/]+)$/);
  const onAuthError = (e: unknown) => {
    if (e instanceof ApiError && e.status === 401) setUser(null);
  };

  let page: React.ReactNode;
  if (orderMatch) page = <OrderDetailView id={decodeURIComponent(orderMatch[1])} nav={nav} onAuthError={onAuthError} />;
  else if (pathname.startsWith('/admin/orders')) page = <Orders path={path} nav={nav} onAuthError={onAuthError} />;
  else if (pathname.startsWith('/admin/products')) page = <Products onAuthError={onAuthError} />;
  else page = <Dashboard nav={nav} onAuthError={onAuthError} />;

  const sidebar = (
    <nav className="flex flex-col h-full bg-surface-container-lowest border-r border-surface-border text-on-surface">
      <div className="px-6 py-6 flex items-center gap-3 border-b border-surface-border">
        <div className="w-9 h-9 rounded-lg bg-primary-container flex items-center justify-center shrink-0">
          <span className="font-headline-md text-label-numeric font-bold text-on-primary-container">PK</span>
        </div>
        <div>
          <div className="font-headline-md text-label-numeric font-bold tracking-tight text-on-surface leading-none">
            PREMIUM KITS
          </div>
          <div className="font-label-caps text-[10px] tracking-[0.25em] text-secondary font-bold mt-1">
            VAULT ADMIN
          </div>
        </div>
      </div>

      <div className="flex-1 px-3 py-4 space-y-1.5">
        {NAV.map((n) => {
          const Icon = n.icon;
          const active = n.match(pathname);
          return (
            <a
              key={n.href}
              href={n.href}
              onClick={(e) => {
                e.preventDefault();
                nav(n.href);
                setMenuOpen(false);
              }}
              className={`flex items-center gap-3 px-3.5 h-10 rounded-xl font-label-caps text-label-caps uppercase tracking-wider transition-colors ${
                active
                  ? 'bg-primary-container text-on-primary-container font-bold shadow-md'
                  : 'text-text-muted hover:text-on-surface hover:bg-surface-charcoal-elevated'
              }`}
            >
              <Icon size={17} /> {n.label}
            </a>
          );
        })}
      </div>

      <div className="p-3 border-t border-surface-border space-y-1.5">
        {/* Theme Toggle Button */}
        <button
          type="button"
          onClick={toggleTheme}
          className="w-full flex items-center justify-between px-3.5 h-10 rounded-xl bg-surface-charcoal hover:bg-surface-charcoal-elevated border border-surface-border font-label-caps text-label-caps uppercase text-on-surface transition-colors"
        >
          <span className="flex items-center gap-2.5">
            {theme === 'dark' ? (
              <Sun size={16} className="text-secondary" />
            ) : (
              <Moon size={16} className="text-primary-container" />
            )}
            <span>{theme === 'dark' ? 'Light Mode' : 'Dark Luxury'}</span>
          </span>
          <span className="text-[9px] text-text-muted">SWITCH</span>
        </button>

        <a
          href="/"
          target="_blank"
          rel="noreferrer"
          className="flex items-center gap-3 px-3.5 h-10 rounded-xl font-body-sm text-body-sm text-text-muted hover:text-on-surface hover:bg-surface-charcoal"
        >
          <ExternalLink size={16} /> View Storefront
        </a>
        <button
          type="button"
          onClick={async () => {
            await adminApi.logout().catch(() => {});
            setUser(null);
          }}
          className="w-full flex items-center gap-3 px-3.5 h-10 rounded-xl font-body-sm text-body-sm text-text-muted hover:text-primary-container hover:bg-surface-charcoal"
        >
          <LogOut size={16} /> Sign Out
        </button>
        <div className="px-3.5 pt-1 text-[11px] text-text-muted truncate">{user}</div>
      </div>
    </nav>
  );

  return (
    <div className="min-h-screen bg-background font-body-md text-on-surface transition-colors duration-300">
      <aside className="hidden lg:block fixed inset-y-0 left-0 w-64">{sidebar}</aside>
      {menuOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div className="w-64">{sidebar}</div>
          <button
            type="button"
            aria-label="Close menu"
            className="flex-1 bg-black/60 backdrop-blur-sm"
            onClick={() => setMenuOpen(false)}
          />
        </div>
      )}
      <div className="lg:pl-64">
        <div className="lg:hidden sticky top-0 z-40 flex items-center justify-between h-14 px-4 bg-surface-container-lowest border-b border-surface-border text-on-surface">
          <button type="button" aria-label="Open menu" onClick={() => setMenuOpen(true)}>
            {menuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
          <span className="font-headline-md text-label-numeric font-bold tracking-tight">
            PREMIUM <span className="text-primary-container">KITS</span> ADMIN
          </span>
          <button
            type="button"
            onClick={toggleTheme}
            aria-label="Toggle theme"
            className="p-1.5 rounded-lg bg-surface-charcoal border border-surface-border"
          >
            {theme === 'dark' ? (
              <Sun size={16} className="text-secondary" />
            ) : (
              <Moon size={16} className="text-primary-container" />
            )}
          </button>
        </div>
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-10">{page}</main>
      </div>
    </div>
  );
}
