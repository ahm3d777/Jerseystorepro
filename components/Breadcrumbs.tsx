import React from 'react';
import { ChevronRight, Home, MoreHorizontal, ArrowLeft } from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { PageView, Product } from '../types';
import { shopPath, spaClick } from '../lib/navigation';

interface BreadcrumbItem {
  label: string;
  view?: PageView;
  product?: Product;
  /** For `view: 'shop'` — which category the crumb opens */
  category?: string;
}

const hrefFor = (item: BreadcrumbItem) => {
  switch (item.view) {
    case 'shop':
      return shopPath(item.category ?? 'All');
    case 'product':
      return item.product ? `/product/${encodeURIComponent(item.product.id)}` : '/shop';
    case 'cart':
      return '/cart';
    case 'wishlist':
      return '/wishlist';
    case 'home':
      return '/';
    default:
      return undefined;
  }
};

interface BreadcrumbsProps {
  items: BreadcrumbItem[];
  className?: string;
}

export const Breadcrumbs: React.FC<BreadcrumbsProps> = ({ items, className = '' }) => {
  const { navigateTo, setCategory } = useStore();
  const maxItems = 4;
  const isTruncated = items.length > maxItems;

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.label,
      ...(hrefFor(item) || index === items.length - 1
        ? { item: window.location.origin + (index === items.length - 1 ? window.location.pathname : hrefFor(item)) }
        : {})
    }))
  };

  const handleNavigation = (item: BreadcrumbItem) => {
    if (!item.view) return;
    if (item.view === 'shop') setCategory(item.category ?? 'All');
    navigateTo(item.view, item.product);
  };

  const renderItems = () => {
    if (!isTruncated) return items;
    return [
      items[0],
      { label: '...', isSeparator: true },
      items[items.length - 2],
      items[items.length - 1]
    ];
  };

  return (
    <nav aria-label="Breadcrumb" className={`flex flex-col gap-3 ${className}`}>
      <script type="application/ld+json">{JSON.stringify(jsonLd)}</script>

      {/* Mobile Back Button */}
      <div className="lg:hidden">
        {items.length > 0 && (
          <a
            href={(items.length > 1 && hrefFor(items[items.length - 2])) || '/'}
            onClick={spaClick(() =>
              items.length > 1 && items[items.length - 2].view
                ? handleNavigation(items[items.length - 2])
                : navigateTo('home')
            )}
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-surface-charcoal border border-surface-border font-label-caps text-label-caps uppercase tracking-widest text-text-muted hover:text-on-surface transition-colors group"
          >
            <ArrowLeft size={14} className="group-hover:-translate-x-0.5 transition-transform text-primary-container" />
            <span>Back to {items.length > 1 && items[items.length - 2].view ? items[items.length - 2].label : 'Home'}</span>
          </a>
        )}
      </div>

      {/* Desktop Breadcrumb Trail */}
      <ol className="hidden lg:flex items-center flex-wrap gap-1.5 list-none">
        <li className="flex items-center">
          <a
            href="/"
            onClick={spaClick(() => navigateTo('home'))}
            className="p-1.5 rounded-lg text-text-muted hover:text-on-surface hover:bg-surface-charcoal transition-all flex items-center justify-center"
            aria-label="Home"
          >
            <Home size={14} />
          </a>
          <ChevronRight size={12} className="mx-1.5 text-surface-container-highest" aria-hidden />
        </li>

        {renderItems().map((item, index, array) => {
          const isLast = index === array.length - 1;
          const isSeparator = (item as { isSeparator?: boolean }).isSeparator;

          if (isSeparator) {
            return (
              <li key="ellipsis" className="flex items-center">
                <span className="p-1 text-text-muted">
                  <MoreHorizontal size={14} />
                </span>
                <ChevronRight size={12} className="mx-1.5 text-surface-container-highest" aria-hidden />
              </li>
            );
          }

          return (
            <li key={`${item.label}-${index}`} className="flex items-center">
              {isLast ? (
                <span
                  className="font-label-caps text-label-caps uppercase tracking-wider text-on-surface bg-surface-charcoal border border-surface-border px-2.5 py-1 rounded-md"
                  aria-current="page"
                >
                  {item.label}
                </span>
              ) : (
                <>
                  <a
                    href={hrefFor(item)}
                    onClick={spaClick(() => handleNavigation(item))}
                    className="font-label-caps text-label-caps uppercase tracking-wider text-text-muted hover:text-on-surface px-2 py-1 rounded-md hover:bg-surface-charcoal transition-all"
                  >
                    {item.label}
                  </a>
                  <ChevronRight size={12} className="mx-1.5 text-surface-container-highest" aria-hidden />
                </>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
};
