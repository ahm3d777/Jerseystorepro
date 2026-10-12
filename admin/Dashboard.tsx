import React, { useEffect, useMemo, useState } from 'react';
import { AlertTriangle } from 'lucide-react';
import { adminApi, type Stats } from './api';
import type { AdminNav } from './AdminApp';
import { Card, Pill, taka, fmtDate, METHOD_LABEL } from './ui';

const Tile: React.FC<{ label: string; value: string; sub?: string }> = ({ label, value, sub }) => (
  <div className="bg-white rounded-xl ring-1 ring-slate-200 p-5">
    <div className="text-xs font-medium text-slate-500">{label}</div>
    <div className="text-2xl font-bold text-slate-900 mt-1 tabular-nums">{value}</div>
    {sub && <div className="text-xs text-slate-500 mt-1">{sub}</div>}
  </div>
);

/** 14-day paid revenue — single series, so no legend; the card title names it. */
const RevenueBars: React.FC<{ daily: Stats['daily'] }> = ({ daily }) => {
  const [hover, setHover] = useState<number | null>(null);
  const days = useMemo(() => {
    const byDay = new Map<string, Stats['daily'][number]>(daily.map((d) => [d.day, d]));
    const out: { day: string; revenue: number; orders: number }[] = [];
    const now = new Date(Date.now() + 6 * 3600_000); // Asia/Dhaka
    for (let i = 13; i >= 0; i--) {
      const d = new Date(now.getTime() - i * 86400_000).toISOString().slice(0, 10);
      out.push({ day: d, revenue: byDay.get(d)?.revenue ?? 0, orders: byDay.get(d)?.orders ?? 0 });
    }
    return out;
  }, [daily]);
  const max = Math.max(1, ...days.map((d) => d.revenue));

  return (
    <div>
      <div className="relative h-48 flex items-end gap-[2px]" onMouseLeave={() => setHover(null)}>
        {days.map((d, i) => (
          <div key={d.day} className="relative flex-1 h-full flex items-end cursor-default" onMouseEnter={() => setHover(i)}>
            <div
              className={`w-full rounded-t ${hover === i ? 'bg-brand-crimson' : 'bg-slate-800'} transition-colors`}
              style={{ height: d.revenue ? `${Math.max(2, (d.revenue / max) * 100)}%` : '1px', opacity: d.revenue ? 1 : 0.25 }}
            />
            {hover === i && (
              <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 z-10 whitespace-nowrap rounded-lg bg-slate-900 text-white text-xs px-3 py-2 shadow-lg pointer-events-none">
                <div className="font-semibold">{fmtDate(d.day + ' 00:00:00', false)}</div>
                <div className="tabular-nums">{taka(d.revenue)} · {d.orders} order{d.orders === 1 ? '' : 's'}</div>
              </div>
            )}
          </div>
        ))}
      </div>
      <div className="flex justify-between text-[11px] text-slate-400 mt-2 border-t border-slate-100 pt-2">
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

  if (!stats) return <div className="text-sm text-slate-500">Loading dashboard…</div>;
  const toShip = (stats.byStatus.confirmed ?? 0) + (stats.byStatus.processing ?? 0);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Dashboard</h1>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Tile label="Revenue (paid)" value={taka(stats.totals.revenue)} sub={`${taka(stats.today.revenue)} today`} />
        <Tile label="Orders" value={String(stats.totals.orders)} sub={`${stats.today.orders} today`} />
        <Tile label="To fulfil" value={String(toShip)} sub="Confirmed + processing" />
        <Tile label="Avg. order value" value={taka(stats.totals.aov)} />
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <Card title="Paid revenue · last 14 days" className="lg:col-span-2">
          <RevenueBars daily={stats.daily} />
        </Card>
        <Card title="By payment method">
          <table className="w-full text-sm">
            <thead><tr className="text-left text-xs text-slate-500"><th className="font-medium pb-2">Method</th><th className="font-medium pb-2 text-right">Orders</th><th className="font-medium pb-2 text-right">Paid</th></tr></thead>
            <tbody>
              {stats.byMethod.length === 0 && <tr><td colSpan={3} className="text-slate-400 py-2">No orders yet</td></tr>}
              {stats.byMethod.map((m) => (
                <tr key={m.method} className="border-t border-slate-100">
                  <td className="py-2.5 font-medium">{METHOD_LABEL[m.method] ?? m.method}</td>
                  <td className="py-2.5 text-right tabular-nums">{m.n}</td>
                  <td className="py-2.5 text-right tabular-nums">{taka(m.revenue)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {(stats.byStatus.pending_payment ?? 0) > 0 && (
            <p className="text-xs text-slate-500 mt-4">{stats.byStatus.pending_payment} order(s) awaiting online payment — auto-cancelled if unpaid.</p>
          )}
        </Card>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <Card
          title="Recent orders"
          className="lg:col-span-2"
          action={<button className="text-xs font-semibold text-slate-600 hover:text-slate-900" onClick={() => nav('/admin/orders')}>View all →</button>}
        >
          <div className="-mx-5 -my-5 divide-y divide-slate-100">
            {stats.recent.length === 0 && <p className="px-5 py-6 text-sm text-slate-400">No orders yet.</p>}
            {stats.recent.map((o) => (
              <button key={o.id} onClick={() => nav(`/admin/orders/${o.id}`)} className="w-full flex items-center gap-4 px-5 py-3 text-left hover:bg-slate-50">
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold font-mono">{o.id}</div>
                  <div className="text-xs text-slate-500 truncate">{o.customer_name} · {fmtDate(o.created_at)}</div>
                </div>
                <span className="hidden sm:inline text-xs text-slate-500">{METHOD_LABEL[o.payment_method]}</span>
                <Pill value={o.status} />
                <span className="w-20 text-right text-sm font-semibold tabular-nums">{taka(o.total)}</span>
              </button>
            ))}
          </div>
        </Card>
        <Card title={<span className="flex items-center gap-2"><AlertTriangle size={16} className="text-amber-500" /> Low stock</span>}>
          <div className="space-y-3">
            {stats.lowStock.length === 0 && <p className="text-sm text-slate-400">All products well stocked.</p>}
            {stats.lowStock.map((p) => (
              <div key={p.id} className="flex items-center gap-3">
                <img src={p.image} alt="" className="w-9 h-11 object-cover rounded bg-slate-100" />
                <div className="flex-1 text-sm truncate">{p.name}</div>
                <span className={`text-sm font-semibold tabular-nums ${p.stock === 0 ? 'text-red-600' : 'text-amber-600'}`}>{p.stock === 0 ? 'Out' : `${p.stock} left`}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
};
