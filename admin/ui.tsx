import React from 'react';

export const taka = (n: number) => `৳${Math.round(n).toLocaleString('en-US')}`;

export const fmtDate = (s: string, withTime = true) =>
  new Date(s.replace(' ', 'T') + 'Z').toLocaleString('en-GB', {
    timeZone: 'Asia/Dhaka',
    day: 'numeric',
    month: 'short',
    ...(withTime ? { hour: '2-digit', minute: '2-digit' } : {})
  });

export const STATUS_LABEL: Record<string, string> = {
  pending_payment: 'Awaiting payment',
  confirmed: 'Confirmed',
  processing: 'Processing',
  shipped: 'Shipped',
  delivered: 'Delivered',
  cancelled: 'Cancelled'
};
export const METHOD_LABEL: Record<string, string> = { bkash: 'bKash', sslcommerz: 'SSLCommerz', cod: 'COD' };

const TONE: Record<string, string> = {
  pending_payment: 'bg-secondary/15 text-secondary border-secondary/30',
  confirmed: 'bg-tertiary-container/30 text-tertiary border-tertiary/30',
  processing: 'bg-tertiary-container/40 text-tertiary border-tertiary/40',
  shipped: 'bg-primary-container/20 text-primary border-primary-container/30',
  delivered: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
  cancelled: 'bg-surface-charcoal-elevated text-text-muted border-surface-border',
  paid: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
  completed: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
  unpaid: 'bg-surface-charcoal-elevated text-text-muted border-surface-border',
  initiated: 'bg-surface-charcoal-elevated text-text-muted border-surface-border',
  failed: 'bg-primary-container/20 text-primary-container border-primary-container/40',
  refunded: 'bg-surface-charcoal-elevated text-text-muted border-surface-border'
};

export const Pill: React.FC<{ value: string; label?: string }> = ({ value, label }) => (
  <span
    className={`inline-flex items-center px-2.5 py-0.5 rounded-full font-label-caps text-[10px] uppercase border whitespace-nowrap ${
      TONE[value] ?? TONE.unpaid
    }`}
  >
    {label ?? STATUS_LABEL[value] ?? value.replace(/_/g, ' ')}
  </span>
);

export const Card: React.FC<{
  title?: React.ReactNode;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}> = ({ title, action, children, className = '' }) => (
  <section className={`bg-surface-charcoal rounded-2xl border border-surface-border shadow-lg ${className}`}>
    {title && (
      <header className="flex items-center justify-between px-5 py-4 border-b border-surface-border">
        <h2 className="font-headline-md text-label-numeric font-bold uppercase tracking-wider text-on-surface">
          {title}
        </h2>
        {action}
      </header>
    )}
    <div className="p-5">{children}</div>
  </section>
);

export const Btn: React.FC<
  React.ButtonHTMLAttributes<HTMLButtonElement> & { tone?: 'primary' | 'ghost' | 'danger' }
> = ({ tone = 'primary', className = '', ...p }) => (
  <button
    {...p}
    className={`inline-flex items-center justify-center gap-2 h-9 px-4 rounded-lg font-label-caps text-label-caps uppercase tracking-wider transition disabled:opacity-50 disabled:cursor-not-allowed ${
      tone === 'primary'
        ? 'bg-primary-container text-on-primary-container hover:bg-crimson-vibrant shadow-md'
        : tone === 'danger'
          ? 'bg-error-container/30 text-error border border-error/40 hover:bg-error-container/50'
          : 'bg-surface-charcoal-elevated text-on-surface border border-surface-border hover:bg-surface-container-high'
    } ${className}`}
  />
);

export const inputCls =
  'w-full h-9 px-3 rounded-lg bg-surface-charcoal-elevated border border-surface-border focus:border-primary-container outline-none text-sm text-on-surface placeholder:text-text-muted';
export const textareaCls =
  'w-full px-3 py-2 rounded-lg bg-surface-charcoal-elevated border border-surface-border focus:border-primary-container outline-none text-sm text-on-surface placeholder:text-text-muted resize-y';
