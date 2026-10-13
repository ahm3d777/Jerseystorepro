import React, { useEffect, useMemo, useState } from 'react';
import { AlertTriangle } from 'lucide-react';
import { adminApi, type Stats } from './api';
import type { AdminNav } from './AdminApp';
import { Card, Pill, taka, fmtDate, METHOD_LABEL } from './ui';

const Tile: React.FC<{ label: string; value: string; sub?: string }> = ({ label, value, sub }) => (
  <div className="bg-surface-charcoal rounded-2xl border border-surface-border p-5 shadow-lg">
    <div className="font-label-caps text-label-caps uppercase text-text-muted">{label}</div>
    <div className="font-headline-xl text-headline-lg font-bold text-on-surface mt-1.5 tabular-nums">{value}</div>
    {sub && <div className="font-body-sm text-body-sm text-secondary mt-1">{sub}</div>}
  </div>
);

const RevenueBars: React.FC<{ daily: Stats['daily'] }> = ({ daily }) => {
  const [hover, setHover] = useState<number | null>(null);
  const days = useMemo(() => {
    const byDay = new Map<string, Stats['daily'][number]>(daily.map((d) => [d.day, d]));
    const out: { day: string; revenue: number; orders: number }[] = [];
    const now = new Date(Date.now() + 6 * 3600_000);
    for (let i = 13; i >= 0; i--) {
      const d = new Date(now.getTime() - i * 86400_000).toISOString().slice(0, 10);
      out.push({ day: d, revenue: byDay.get(d)?.revenue ?? 0, orders: byDay.get(d)?.orders ?? 0 });
    }
    return out;
  }, [daily]);
  const max = Math.max(1, ...days.map((d) => d.revenue));

  return (
    <div>
      <div className="relative h-48 flex items-end gap-1" onMouseLeave={() => setHover(null)}>
        {days.map((d, i) => (
          <div
            key={d.day}
            className="relative flex-1 h-full flex items-end cursor-default"
            onMouseEnter={() => setHover(i)}
          >
            <div
              className={`w-full rounded-t ${
                hover === i ? 'bg-crimson-vibrant' : 'bg-primary-container'
              } transition-colors`}
              style={{
                height: d.revenue ? `${Math.max(4, (d.revenue / max) * 100)}%` : '2px',
                opacity: d.revenue ? 1 : 0.25
              }}
            />
            {hover === i && (
              <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 z-10 whitespace-nowrap rounded-lg bg-surface-charcoal-elevated border border-surface-border text-on-surface text-xs px-3 py-2 shadow-xl pointer-events-none">
                <div className="font-semibold text-secondary">{fmtDate(d.day + ' 00:00:00', false)}</div>
                <div className="tabular-nums">
                  {taka(d.revenue)} · {d.orders} order{d.orders === 1 ? '' : 's'}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
      <div className="flex justify-between font-label-caps text-[10px] uppercase text-text-muted mt-3 border-t border-surface-border pt-2">
        <span>{fmtDate(days[0].day + ' 00:00:00', false)}</span>
        <span>Today</span>
      </div>
    </div>
  );
};

export const Dashboard: React.FC<{ nav: AdminNav; onAuthError: (e: unknown) => void }> = ({ nav, onAuthError }) => {
  const [stats, setStats] = useState<Stats | null>(null);
  useEffect(() => {
    adminApi.stats().then(setStats).catch(onAuthError);
  }, []);

  if (!stats) return <div className="text-sm text-text-muted">Loading vault metrics…</div>;
  const toShip = (stats.byStatus.confirmed ?? 0) + (stats.byStatus.processing ?? 0);

  return (
    <div className="space-y-6">
      <div>
        <span className="font-label-caps text-label-caps uppercase text-secondary tracking-widest">
          BANANI VAULT TELEMETRY
        </span>
        <h1 className="font-headline-xl text-headline-lg uppercase text-on-surface">Executive Dashboard</h1>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Tile label="Revenue (Paid)" value={taka(stats.totals.revenue)} sub={`${taka(stats.today.revenue)} today`} />
        <Tile label="Total Orders" value={String(stats.totals.orders)} sub={`${stats.today.orders} today`} />
        <Tile label="To Fulfil" value={String(toShip)} sub="Confirmed + processing" />
        <Tile label="Avg. Order Value" value={taka(stats.totals.aov)} />
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <Card title="Paid Revenue · Last 14 Days" className="lg:col-span-2">
          <RevenueBars daily={stats.daily} />
        </Card>
        <Card title="By Settlement Method">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left font-label-caps text-[10px] uppercase text-text-muted">
                <th className="pb-2">Method</th>
                <th className="pb-2 text-right">Orders</th>
                <th className="pb-2 text-right">Paid</th>
              </tr>
            </thead>
            <tbody>
              {stats.byMethod.length === 0 && (
                <tr>
                  <td colSpan={3} className="text-text-muted py-2">
                    No orders yet
                  </td>
                </tr>
              )}
              {stats.byMethod.map((m) => (
                <tr key={m.method} className="border-t border-surface-border">
                  <td className="py-2.5 font-semibold text-on-surface">{METHOD_LABEL[m.method] ?? m.method}</td>
                  <td className="py-2.5 text-right tabular-nums text-text-muted">{m.n}</td>
                  <td className="py-2.5 text-right tabular-nums font-semibold text-secondary">{taka(m.revenue)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {(stats.byStatus.pending_payment ?? 0) > 0 && (
            <p className="text-xs text-text-muted mt-4">
              {stats.byStatus.pending_payment} order(s) awaiting online payment — auto-cancelled if unpaid.
            </p>
          )}
        </Card>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <Card
          title="Recent Consignments"
          className="lg:col-span-2"
          action={
            <button
              type="button"
              className="font-label-caps text-label-caps uppercase text-primary-container hover:underline"
              onClick={() => nav('/admin/orders')}
            >
              View all →
            </button>
          }
        >
          <div className="-mx-5 -my-5 divide-y divide-surface-border">
            {stats.recent.length === 0 && <p className="px-5 py-6 text-sm text-text-muted">No orders yet.</p>}
            {stats.recent.map((o) => (
              <button
                key={o.id}
                type="button"
                onClick={() => nav(`/admin/orders/${o.id}`)}
                className="w-full flex items-center gap-4 px-5 py-3.5 text-left hover:bg-surface-charcoal-elevated transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold font-mono text-on-surface">{o.id}</div>
                  <div className="text-xs text-text-muted truncate">
                    {o.customer_name} · {fmtDate(o.created_at)}
                  </div>
                </div>
                <span className="hidden sm:inline text-xs text-text-muted">{METHOD_LABEL[o.payment_method]}</span>
                <Pill value={o.status} />
                <span className="w-20 text-right text-sm font-semibold tabular-nums text-on-surface">
                  {taka(o.total)}
                </span>
              </button>
            ))}
          </div>
        </Card>
        <Card
          title={
            <span className="flex items-center gap-2">
              <AlertTriangle size={16} className="text-secondary" /> Low Vault Allocation
            </span>
          }
        >
          <div className="space-y-3">
            {stats.lowStock.length === 0 && <p className="text-sm text-text-muted">All products well stocked.</p>}
            {stats.lowStock.map((p) => (
              <div key={p.id} className="flex items-center gap-3">
                <img
                  src={p.image}
                  alt=""
                  className="w-9 h-11 object-cover rounded bg-surface-container-lowest border border-surface-border"
                />
                <div className="flex-1 text-sm text-on-surface truncate">{p.name}</div>
                <span
                  className={`font-label-caps text-label-caps tabular-nums ${
                    p.stock === 0 ? 'text-primary-container' : 'text-secondary'
                  }`}
                >
                  {p.stock === 0 ? 'Out' : `${p.stock} left`}
                </span>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
};
