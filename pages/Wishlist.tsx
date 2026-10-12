
import React from 'react';
import { useStore } from '../context/StoreContext';
import { ProductCard } from '../components/ProductCard';
import { Breadcrumbs } from '../components/Breadcrumbs';
import { Button } from '../components/UI';
import { Heart, ArrowRight } from 'lucide-react';

export const Wishlist = () => {
  const { wishlist, navigateTo, products } = useStore();

  const wishlistedProducts = products.filter(p => wishlist.includes(p.id));

  const breadcrumbs = [
    { label: 'Wishlist', view: 'wishlist' as const }
  ];

  if (wishlist.length === 0) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center text-center px-4 animate-fade-in py-20">
        <div className="w-24 h-24 bg-red-50 rounded-full flex items-center justify-center mb-6">
          <Heart size={40} className="text-brand-crimson" fill="currentColor" fillOpacity={0.2} />
        </div>
        <h2 className="text-3xl font-heading font-bold text-brand-dark mb-4">Your Wishlist is Empty</h2>
        <p className="text-gray-500 mb-8 max-w-md leading-relaxed">
          Keep track of your favorite kits. Tap the heart icon on any product to add it here.
        </p>
        <Button onClick={() => navigateTo('shop')} variant="black">
          Browse Collection <ArrowRight size={16} />
        </Button>
      </div>
    );
  }

  return (
    <div className="bg-white min-h-screen py-8 animate-fade-in">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Breadcrumbs */}
        <div className="mb-8">
            <Breadcrumbs items={breadcrumbs} />
        </div>

        <div className="flex flex-col items-center text-center mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-1 rounded-full bg-red-50 text-brand-crimson text-xs font-bold uppercase tracking-widest mb-4">
            <Heart size={12} fill="currentColor" /> {wishlist.length} Items Saved
          </div>
          <h1 className="text-4xl md:text-5xl font-heading font-bold text-brand-dark">
            My Favourites
          </h1>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-6 gap-y-12">
          {wishlistedProducts.map(product => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </div>
    </div>
  );
};
