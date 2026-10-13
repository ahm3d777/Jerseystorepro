import React from 'react';
import { useStore } from '../context/StoreContext';
import { ProductCard } from '../components/ProductCard';
import { Breadcrumbs } from '../components/Breadcrumbs';
import { Button } from '../components/UI';
import { Heart, ArrowRight } from 'lucide-react';

export const Wishlist = () => {
  const { wishlist, navigateTo, products } = useStore();
  const wishlistedProducts = products.filter((p) => wishlist.includes(p.id));

  const breadcrumbs = [{ label: 'Saved Vault', view: 'wishlist' as const }];

  if (wishlist.length === 0) {
    return (
      <div className="min-h-[65vh] flex flex-col items-center justify-center text-center px-4 animate-fade-in py-16">
        <div className="w-20 h-20 bg-surface-charcoal border border-surface-border rounded-2xl flex items-center justify-center mb-6 shadow-lg">
          <Heart size={32} className="text-primary-container" fill="currentColor" fillOpacity={0.25} />
        </div>
        <h2 className="font-headline-xl text-headline-lg text-on-surface mb-3 uppercase">Your Saved Vault Is Empty</h2>
        <p className="font-body-md text-body-md text-text-muted mb-8 max-w-md leading-relaxed">
          Curate your personal shortlist of match-grade and commemorative kits by tapping the heart icon on any
          fixture.
        </p>
        <Button onClick={() => navigateTo('shop')} variant="primary">
          <span>Explore Match Vault</span>
          <ArrowRight size={16} />
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-4 md:py-6 animate-fade-in">
      <div className="mb-6">
        <Breadcrumbs items={breadcrumbs} />
      </div>

      <div className="rounded-2xl bg-surface-charcoal border border-surface-border p-6 sm:p-10 mb-8 flex flex-col sm:flex-row sm:items-end justify-between gap-4 shadow-xl">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary-container/20 text-primary-container font-label-caps text-label-caps uppercase mb-3">
            <Heart size={12} fill="currentColor" /> {wishlist.length} Saved {wishlist.length === 1 ? 'Kit' : 'Kits'}
          </div>
          <h1 className="font-headline-xl text-headline-xl-mobile sm:text-headline-xl text-on-surface uppercase tracking-tight">
            Collector Shortlist
          </h1>
        </div>
        <Button onClick={() => navigateTo('shop')} variant="secondary">
          <span>Continue Exploring</span>
          <ArrowRight size={15} />
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {wishlistedProducts.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </div>
  );
};
