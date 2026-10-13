import React, { useEffect, useState } from 'react';
import { Search } from 'lucide-react';
import { adminApi, type AdminOrderRow } from './api';
import type { AdminNav } from './AdminApp';
import { Btn, Pill, taka, fmtDate, inputCls, STATUS_LABEL, METHOD_LABEL } from './ui';

const STATUSES = ['', 'pending_payment', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'];

export const Orders: React.FC<{ path: string; nav: AdminNav; onAuthError: (e: unknown) => void }> = ({
  path,
  nav,
  onAuthError
}) => {
  const params = new URLSearchParams(path.split('?')[1] ?? '');
  const status = params.get('status') ?? '';
  const method = params.get('method') ?? '';
  const q = params.get('q') ?? '';
  const page = Number(params.get('page') ?? 1);

  const [data, setData] = useState<{ orders: AdminOrderRow[]; total: number; pageSize: number } | null>(null);
  const [search, setSearch] = useState(q);

  useEffect(() => {
    setData(null);
    adminApi.orders(Object.fromEntries(params)).then(setData).catch(onAuthError);
  }, [path]);

  const update = (patch: Record<string, string>) => {
    const next = new URLSearchParams({ status, method, q, ...patch });
    if (!('page' in patch)) next.delete('page');
    for (const [k, v] of [...next]) if (!v) next.delete(k);
    nav(`/admin/orders${next.toString() ? `?${next}` : ''}`);
  };

  const pages = data ? Math.max(1, Math.ceil(data.total / data.pageSize)) : 1;

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between gap-4 flex-wrap">
        <div>
          <span className="font-label-caps text-label-caps uppercase text-secondary tracking-widest">
            DISPATCH LEDGER
          </span>
          <h1 className="font-headline-xl text-headline-lg uppercase text-on-surface">Consignment Orders</h1>
        </div>
        {data && (
          <span className="font-label-caps text-label-caps uppercase text-text-muted">
            {data.total} order{data.total === 1 ? '' : 's'}
          </span>
        )}
      </div>

      <div className="flex flex-wrap gap-2">
        {STATUSES.map((s) => (
          <button
            key={s || 'all'}
            type="button"
            onClick={() => update({ status: s })}
            className={`h-8 px-3.5 rounded-full font-label-caps text-label-caps uppercase border transition-colors ${
              status === s
                ? 'bg-primary-container text-on-primary-container border-primary-container font-bold shadow-sm'
                : 'bg-surface-charcoal text-text-muted border-surface-border hover:text-on-surface'
            }`}
          >
            {s ? STATUS_LABEL[s] : 'All'}
          </button>
        ))}
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <form
          className="relative flex-1"
          onSubmit={(e) => {
            e.preventDefault();
            update({ q: search.trim() });
          }}
        >
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
          <input
            className={`${inputCls} pl-9`}
            placeholder="Search order ID, recipient name, or phone"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </form>
        <select
          className={`${inputCls} sm:w-48`}
          value={method}
          onChange={(e) => update({ method: e.target.value })}
        >
          <option value="">All payment methods</option>
          <option value="bkash">bKash</option>
          <option value="sslcommerz">SSLCommerz</option>
          <option value="cod">Cash on Delivery</option>
        </select>
      </div>

      <div className="bg-surface-charcoal rounded-2xl border border-surface-border overflow-x-auto shadow-lg">
        <table className="w-full text-sm min-w-[760px]">
          <thead className="bg-surface-charcoal-elevated text-left font-label-caps text-[10px] uppercase text-text-muted border-b border-surface-border">
            <tr>
              <th className="px-4 py-3">Order</th>
              <th className="px-4 py-3">Customer</th>
              <th className="px-4 py-3">Payment</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3 text-right">Total</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-surface-border">
            {!data && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-text-muted">
                  Loading…
                </td>
              </tr>
            )}
            {data?.orders.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-text-muted">
                  No orders match these filters.
                </td>
              </tr>
            )}
            {data?.orders.map((o) => (
              <tr
                key={o.id}
                onClick={() => nav(`/admin/orders/${o.id}`)}
                className="hover:bg-surface-charcoal-elevated cursor-pointer transition-colors"
              >
                <td className="px-4 py-3">
                  <div className="font-mono font-semibold text-on-surface">{o.id}</div>
                  <div className="text-xs text-text-muted">
                    {fmtDate(o.created_at)} · {o.items} item{o.items === 1 ? '' : 's'}
                  </div>
                </td>
                <td className="px-4 py-3">
                  <div className="font-medium text-on-surface">{o.customer_name}</div>
                  <div className="text-xs text-text-muted">
                    {o.customer_phone} · {o.district}
                  </div>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium text-text-muted w-20">{METHOD_LABEL[o.payment_method]}</span>
                    <Pill value={o.payment_status} />
                  </div>
                </td>
                <td className="px-4 py-3">
                  <Pill value={o.status} />
                </td>
                <td className="px-4 py-3 text-right font-semibold tabular-nums text-on-surface">{taka(o.total)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {pages > 1 && (
        <div className="flex items-center justify-end gap-2">
          <Btn tone="ghost" disabled={page <= 1} onClick={() => update({ page: String(page - 1) })}>
            Previous
          </Btn>
          <span className="text-sm text-text-muted">
            Page {page} of {pages}
          </span>
          <Btn tone="ghost" disabled={page >= pages} onClick={() => update({ page: String(page + 1) })}>
            Next
          </Btn>
        </div>
      )}
    </div>
  );
};
