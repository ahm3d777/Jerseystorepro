/**
 * Single source of truth for storefront navigation: the shop categories shown in the
 * navbar, mobile drawer and shop filter pills, plus the URL format for /shop.
 */
import type React from 'react';

export interface ShopCategory {
  /** Value understood by `matchesCategoryFilter` */
  id: string;
  label: string;
  slug: string;
  badge?: string;
  /** Visual treatment in the navbar */
  tone?: 'default' | 'stock' | 'vault';
}

export const SHOP_CATEGORIES: ShopCategory[] = [
  { id: 'All', label: 'Shop All', slug: '' },
  { id: 'Premier League', label: 'Premier League', slug: 'premier-league' },
  { id: 'La Liga', label: 'La Liga', slug: 'la-liga' },
  { id: 'Serie A', label: 'Serie A', slug: 'serie-a' },
  { id: 'International', label: 'International', slug: 'international' },
  { id: 'Retro Heritage', label: 'Retro Heritage', slug: 'retro' },
  { id: 'Player ADV', label: 'Player ADV', slug: 'player-adv', badge: 'PRO' },
  { id: 'Dhaka Stock', label: 'Ready to Ship', slug: 'ready-to-ship', tone: 'stock' },
  { id: 'Vault / Drops', label: 'Vault / Drops', slug: 'vault', tone: 'vault' }
];

/** Older/alternate names used around the app, mapped to their canonical category. */
const ALIASES: Record<string, string> = {
  'All Drops': 'All',
  'Retro 90s': 'Retro Heritage',
  'Player ADV Tier': 'Player ADV'
};

export const normalizeCategory = (category: string | null | undefined): string => {
  if (!category) return 'All';
  const canonical = ALIASES[category] ?? category;
  return SHOP_CATEGORIES.some((c) => c.id === canonical) ? canonical : 'All';
};

export const categoryLabel = (category: string) =>
  SHOP_CATEGORIES.find((c) => c.id === normalizeCategory(category))?.label ?? 'Shop All';

export const categoryFromSlug = (slug: string | null) =>
  SHOP_CATEGORIES.find((c) => c.slug && c.slug === slug)?.id ?? 'All';

/** `/shop`, `/shop?category=la-liga`, `/shop?category=la-liga&q=messi` */
export const shopPath = (category = 'All', query = '') => {
  const params = new URLSearchParams();
  const slug = SHOP_CATEGORIES.find((c) => c.id === normalizeCategory(category))?.slug;
  if (slug) params.set('category', slug);
  if (query.trim()) params.set('q', query.trim());
  const qs = params.toString();
  return qs ? `/shop?${qs}` : '/shop';
};

/** Path of the most recent order placed in this browser, if any. */
export const lastOrderPath = (): string | null => {
  try {
    const saved = localStorage.getItem('pk_last_order');
    if (!saved) return null;
    const { id, token } = JSON.parse(saved);
    return id ? `/order/${encodeURIComponent(id)}?t=${encodeURIComponent(token || '')}` : null;
  } catch {
    return null;
  }
};

/**
 * Turns an <a href> into an in-app link: plain left clicks run `action`, while
 * ctrl/cmd/shift/middle clicks keep the browser's default (open in new tab, etc.).
 */
export const spaClick = (action: () => void) => (e: React.MouseEvent<HTMLAnchorElement>) => {
  if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
  e.preventDefault();
  action();
};
