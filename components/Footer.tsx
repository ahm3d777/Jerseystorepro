import React, { useState } from 'react';
import { ArrowRight } from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { lastOrderPath } from '../lib/navigation';

export const Footer = () => {
  const { navigateTo, setCategory, showNotification } = useStore();
  const [email, setEmail] = useState('');

  const handleNav = (category: string) => {
    setCategory(category);
    navigateTo('shop');
  };

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !email.includes('@')) {
      showNotification('Please enter a valid email address', 'error');
      return;
    }
    showNotification('Added to the Banani Vault drop roster!', 'success');
    setEmail('');
  };

  return (
    <footer className="w-full bg-surface-container-lowest border-t border-surface-border mt-space-3xl">
      <div className="max-w-7xl mx-auto px-margin-mobile lg:px-margin pt-space-2xl pb-space-xl">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-space-xl mb-space-2xl">
          {/* Brand Column (2 cols on desktop) */}
          <div className="lg:col-span-2 flex flex-col gap-space-md">
            <button
              type="button"
              onClick={() => navigateTo('home')}
              className="flex items-center gap-space-sm w-fit text-left group"
            >
              <div className="w-8 h-8 rounded-lg bg-surface-charcoal-elevated border border-surface-border group-hover:bg-primary-container transition-colors flex items-center justify-center">
                <span className="font-headline-md text-headline-md font-bold text-primary group-hover:text-on-primary-container">
                  PK
                </span>
              </div>
              <span className="font-headline-md text-title-sm font-bold tracking-tight text-on-surface">
                PREMIUM KITS BANGLADESH
              </span>
            </button>
            <p className="font-body-md text-body-md text-on-surface-variant max-w-sm">
              Bangladesh&apos;s premier destination for match-issue and authentic club apparel. Certified match-spec
              weaves, player typography customization, and historical archive jerseys direct to Dhaka and nationwide.
            </p>
            <div className="flex items-center gap-space-sm mt-space-xs">
              <span className="font-label-caps text-label-caps text-gold-muted">
                ✦ AUTHORIZED AUTHENTICITY CERTIFIED
              </span>
            </div>
          </div>

          {/* Shop Vault Links */}
          <div className="flex flex-col gap-space-sm">
            <span className="font-label-caps text-label-caps uppercase text-on-surface tracking-wider font-bold">
              Shop Vault
            </span>
            <ul className="flex flex-col gap-space-xs font-body-sm text-body-sm text-on-surface-variant">
              <li>
                <button
                  type="button"
                  onClick={() => handleNav('All')}
                  className="hover:text-on-surface transition-colors text-left"
                >
                  2025/26 New Arrivals
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => handleNav('Player ADV')}
                  className="hover:text-on-surface transition-colors text-left"
                >
                  Player Issue ADV Kits
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => handleNav('Retro Heritage')}
                  className="hover:text-on-surface transition-colors text-left"
                >
                  Retro Archive (1990-2010)
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => handleNav('Vault / Drops')}
                  className="hover:text-on-surface transition-colors text-left"
                >
                  Limited Vault Editions
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => handleNav('International')}
                  className="hover:text-on-surface transition-colors text-left"
                >
                  National Team Editions
                </button>
              </li>
            </ul>
          </div>

          {/* Support & Spec Links */}
          <div className="flex flex-col gap-space-sm">
            <span className="font-label-caps text-label-caps uppercase text-on-surface tracking-wider font-bold">
              Support &amp; Spec
            </span>
            <ul className="flex flex-col gap-space-xs font-body-sm text-body-sm text-on-surface-variant">
              <li>
                <button
                  type="button"
                  onClick={() => {
                    navigateTo('home');
                    setTimeout(() => {
                      document.getElementById('player-adv-section')?.scrollIntoView({ behavior: 'smooth' });
                    }, 100);
                  }}
                  className="hover:text-on-surface transition-colors text-left"
                >
                  Fabric &amp; Sizing Matrix
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => {
                    const path = lastOrderPath();
                    if (path) {
                      window.history.pushState(null, '', path);
                      navigateTo('order');
                      return;
                    }
                    showNotification('Place an order or open your confirmation link to track live dispatch.', 'info');
                  }}
                  className="hover:text-on-surface transition-colors text-left"
                >
                  Track Your Consignment
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() =>
                    showNotification('Every kit includes an encrypted holographic NFC serial tag.', 'info')
                  }
                  className="hover:text-on-surface transition-colors text-left"
                >
                  Authenticity Verification
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() =>
                    showNotification('Same-day dispatch across Gulshan, Banani, Dhanmondi & Uttara.', 'info')
                  }
                  className="hover:text-on-surface transition-colors text-left"
                >
                  Dhaka Same-Day Delivery
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => showNotification('VIP Concierge: WhatsApp +880 1700-000000 (10am–10pm BD)', 'info')}
                  className="hover:text-on-surface transition-colors text-left"
                >
                  VIP Concierge Support
                </button>
              </li>
            </ul>
          </div>

          {/* Drop Access Newsletter */}
          <div className="flex flex-col gap-space-sm">
            <span className="font-label-caps text-label-caps uppercase text-on-surface tracking-wider font-bold">
              Drop Access
            </span>
            <p className="font-body-sm text-body-sm text-on-surface-variant">
              Subscribe for micro-run alerts and restricted vault restocks.
            </p>
            <form onSubmit={handleSubscribe} className="flex flex-col gap-space-xs mt-space-xs">
              <input
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-surface-charcoal border border-surface-border px-space-sm py-2 rounded-lg font-body-sm text-body-sm text-on-surface placeholder:text-on-surface-variant focus:outline-none focus:ring-1 focus:ring-primary-container"
                placeholder="Enter your email"
                type="email"
              />
              <button
                className="w-full bg-primary-container hover:bg-crimson-vibrant text-on-primary-container font-label-caps text-label-caps uppercase tracking-wider py-2.5 rounded-lg transition-colors flex items-center justify-center gap-space-xs"
                type="submit"
              >
                <span>Join The Roster</span>
                <ArrowRight size={14} />
              </button>
            </form>
          </div>
        </div>

        {/* Bottom Payment & Copyright Bar */}
        <div className="pt-space-lg flex flex-col md:flex-row items-center justify-between gap-space-md bg-surface-container-low border border-surface-border p-space-md rounded-xl">
          <div className="flex flex-wrap items-center justify-center gap-space-md">
            <span className="font-label-caps text-label-caps text-on-surface-variant uppercase">Secured Payments:</span>
            <div className="flex items-center gap-space-sm">
              <span className="font-label-caps text-label-caps px-2.5 py-1 rounded bg-surface-charcoal border border-surface-border text-primary font-bold">
                bKash
              </span>
              <span className="font-label-caps text-label-caps px-2.5 py-1 rounded bg-surface-charcoal border border-surface-border text-secondary font-bold">
                Nagad
              </span>
              <span className="font-label-caps text-label-caps px-2.5 py-1 rounded bg-surface-charcoal border border-surface-border text-on-surface font-bold">
                VISA
              </span>
              <span className="font-label-caps text-label-caps px-2.5 py-1 rounded bg-surface-charcoal border border-surface-border text-on-surface font-bold">
                Mastercard
              </span>
            </div>
          </div>
          <div className="font-body-sm text-body-sm text-on-surface-variant text-center md:text-right">
            © 2025–2026 Premium Kits Bangladesh. All Rights Reserved. Engineered for matchday perfection.
          </div>
        </div>
      </div>
    </footer>
  );
};
