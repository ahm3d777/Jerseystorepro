import React, { useCallback, useEffect, useState } from 'react';
import { LayoutDashboard, ShoppingCart, Shirt, LogOut, ExternalLink, Loader2, Menu, X } from 'lucide-react';
import { adminApi } from './api';
import { ApiError } from '../lib/api';
import { Dashboard } from './Dashboard';
import { Orders } from './Orders';
import { OrderDetailView } from './OrderDetail';
import { Products } from './Products';
import { inputCls } from './ui';

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

const Login: React.FC<{ onDone: (email: string) => void }> = ({ onDone }) => {
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
    <div className="min-h-screen bg-slate-950 flex items-center justify-center px-4">
      <form onSubmit={submit} className="w-full max-w-sm bg-white rounded-2xl p-8 shadow-2xl">
        <div className="font-heading font-black text-2xl tracking-tighter mb-1">
          PREMIUM<span className="text-brand-crimson">KITS</span>
        </div>
        <p className="text-sm text-slate-500 mb-8">Store admin</p>
        <label htmlFor="admin-email" className="block text-xs font-semibold text-slate-600 mb-1.5">Email</label>
        <input id="admin-email" className={`${inputCls} mb-4`} type="email" autoComplete="username" value={email} onChange={(e) => setEmail(e.target.value)} required />
        <label htmlFor="admin-password" className="block text-xs font-semibold text-slate-600 mb-1.5">Password</label>
        <input id="admin-password" className={`${inputCls} mb-6`} type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} required />
        {error && <p className="text-sm text-red-600 mb-4" role="alert">{error}</p>}
        <button disabled={busy} className="w-full h-10 rounded-lg bg-slate-900 text-white text-sm font-semibold hover:bg-slate-700 disabled:opacity-60 flex items-center justify-center gap-2">
          {busy && <Loader2 size={16} className="animate-spin" />} Sign in
        </button>
      </form>
    </div>
  );
};

const NAV = [
  { href: '/admin', label: 'Dashboard', icon: LayoutDashboard, match: (p: string) => p === '/admin' || p === '/admin/' },
  { href: '/admin/orders', label: 'Orders', icon: ShoppingCart, match: (p: string) => p.startsWith('/admin/orders') },
  { href: '/admin/products', label: 'Products', icon: Shirt, match: (p: string) => p.startsWith('/admin/products') },
];

export default function AdminApp() {
  const [user, setUser] = useState<string | null | undefined>(undefined);
  const [path, nav] = useAdminPath();
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    document.title = 'Admin · PremiumKits';
    adminApi.me().then((r) => setUser(r.email)).catch(() => setUser(null));
  }, []);

  if (user === undefined) return <div className="min-h-screen bg-slate-950" />;
  if (user === null) return <Login onDone={setUser} />;

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
    <nav className="flex flex-col h-full">
      <div className="px-6 py-6 font-heading font-black text-xl tracking-tighter text-white">
        PREMIUM<span className="text-brand-crimson">KITS</span>
        <div className="text-[10px] tracking-[0.3em] text-slate-500 font-bold mt-1">ADMIN</div>
      </div>
      <div className="flex-1 px-3 space-y-1">
        {NAV.map((n) => {
          const Icon = n.icon;
          const active = n.match(pathname);
          return (
            <a
              key={n.href}
              href={n.href}
              onClick={(e) => { e.preventDefault(); nav(n.href); setMenuOpen(false); }}
              className={`flex items-center gap-3 px-3 h-10 rounded-lg text-sm font-medium transition ${active ? 'bg-white/10 text-white' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}
            >
              <Icon size={18} /> {n.label}
            </a>
          );
        })}
      </div>
      <div className="p-3 border-t border-white/10 space-y-1">
        <a href="/" target="_blank" rel="noreferrer" className="flex items-center gap-3 px-3 h-10 rounded-lg text-sm text-slate-400 hover:text-white hover:bg-white/5">
          <ExternalLink size={18} /> View store
        </a>
        <button
          onClick={async () => { await adminApi.logout().catch(() => {}); setUser(null); }}
          className="w-full flex items-center gap-3 px-3 h-10 rounded-lg text-sm text-slate-400 hover:text-white hover:bg-white/5"
        >
          <LogOut size={18} /> Sign out
        </button>
        <div className="px-3 pt-2 text-[11px] text-slate-500 truncate">{user}</div>
      </div>
    </nav>
  );

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900">
      <aside className="hidden lg:block fixed inset-y-0 left-0 w-60 bg-slate-950">{sidebar}</aside>
      {menuOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div className="w-64 bg-slate-950">{sidebar}</div>
          <button aria-label="Close menu" className="flex-1 bg-black/40" onClick={() => setMenuOpen(false)} />
        </div>
      )}
      <div className="lg:pl-60">
        <div className="lg:hidden sticky top-0 z-40 flex items-center justify-between h-14 px-4 bg-slate-950 text-white">
          <button aria-label="Open menu" onClick={() => setMenuOpen(true)}>{menuOpen ? <X /> : <Menu />}</button>
          <span className="font-heading font-black tracking-tighter">PREMIUM<span className="text-brand-crimson">KITS</span></span>
          <span className="w-6" />
        </div>
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-10">{page}</main>
      </div>
    </div>
  );
}
