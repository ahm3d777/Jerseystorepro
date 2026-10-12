import React from 'react';

export const taka = (n: number) => `৳${Math.round(n).toLocaleString('en-US')}`;

export const fmtDate = (s: string, withTime = true) =>
  new Date(s.replace(' ', 'T') + 'Z').toLocaleString('en-GB', {
    timeZone: 'Asia/Dhaka', day: 'numeric', month: 'short', ...(withTime ? { hour: '2-digit', minute: '2-digit' } : {}),
  });

export const STATUS_LABEL: Record<string, string> = {
  pending_payment: 'Awaiting payment', confirmed: 'Confirmed', processing: 'Processing',
  shipped: 'Shipped', delivered: 'Delivered', cancelled: 'Cancelled',
};
export const METHOD_LABEL: Record<string, string> = { bkash: 'bKash', sslcommerz: 'SSLCommerz', cod: 'COD' };

const TONE: Record<string, string> = {
  pending_payment: 'bg-amber-50 text-amber-700 ring-amber-200',
  confirmed: 'bg-blue-50 text-blue-700 ring-blue-200',
  processing: 'bg-indigo-50 text-indigo-700 ring-indigo-200',
  shipped: 'bg-violet-50 text-violet-700 ring-violet-200',
  delivered: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
  cancelled: 'bg-slate-100 text-slate-500 ring-slate-200',
  paid: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
  completed: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
  unpaid: 'bg-slate-50 text-slate-600 ring-slate-200',
  initiated: 'bg-slate-50 text-slate-600 ring-slate-200',
  failed: 'bg-red-50 text-red-700 ring-red-200',
  refunded: 'bg-slate-100 text-slate-600 ring-slate-200',
};

export const Pill: React.FC<{ value: string; label?: string }> = ({ value, label }) => (
  <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-semibold ring-1 ring-inset whitespace-nowrap ${TONE[value] ?? TONE.unpaid}`}>
    {label ?? STATUS_LABEL[value] ?? value.replace(/_/g, ' ')}
  </span>
);

export const Card: React.FC<{ title?: React.ReactNode; action?: React.ReactNode; children: React.ReactNode; className?: string }> = ({ title, action, children, className = '' }) => (
  <section className={`bg-white rounded-xl ring-1 ring-slate-200 ${className}`}>
    {title && (
      <header className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
        <h2 className="text-sm font-semibold text-slate-900">{title}</h2>
        {action}
      </header>
    )}
    <div className="p-5">{children}</div>
  </section>
);

export const Btn: React.FC<React.ButtonHTMLAttributes<HTMLButtonElement> & { tone?: 'primary' | 'ghost' | 'danger' }> = ({ tone = 'primary', className = '', ...p }) => (
  <button
    {...p}
    className={`inline-flex items-center justify-center gap-2 h-9 px-4 rounded-lg text-sm font-semibold transition disabled:opacity-50 disabled:cursor-not-allowed ${
      tone === 'primary' ? 'bg-slate-900 text-white hover:bg-slate-700' : tone === 'danger' ? 'bg-white text-red-600 ring-1 ring-red-200 hover:bg-red-50' : 'bg-white text-slate-700 ring-1 ring-slate-200 hover:bg-slate-50'
    } ${className}`}
  />
);

export const inputCls = 'w-full h-9 px-3 rounded-lg ring-1 ring-slate-200 focus:ring-2 focus:ring-slate-900 outline-none text-sm bg-white';
export const textareaCls = 'w-full px-3 py-2 rounded-lg ring-1 ring-slate-200 focus:ring-2 focus:ring-slate-900 outline-none text-sm bg-white resize-y';
