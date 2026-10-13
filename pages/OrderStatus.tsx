import React, { useCallback, useEffect, useState } from 'react';
import { useStore } from '../context/StoreContext';
import { Button, Skeleton } from '../components/UI';
import { CURRENCY_SYMBOL } from '../constants';
import {
  CheckCircle,
  XCircle,
  Clock,
  Package,
  Truck,
  Home,
  ArrowRight,
  Loader2,
  Copy,
  RefreshCw
} from 'lucide-react';
import { ApiError, getOrder, retryPayment } from '../lib/api';
import type { PublicOrder } from '../types';

const METHOD_LABEL = { bkash: 'bKash', sslcommerz: 'SSLCommerz', cod: 'Cash on Delivery' } as const;
const STEPS = [
  { key: 'confirmed', label: 'Confirmed', icon: CheckCircle },
  { key: 'processing', label: 'Vault Packing', icon: Package },
  { key: 'shipped', label: 'In Transit', icon: Truck },
  { key: 'delivered', label: 'Delivered', icon: Home }
] as const;

function readRoute() {
  const id = decodeURIComponent(window.location.pathname.split('/')[2] ?? '');
  const params = new URLSearchParams(window.location.search);
  return { id, token: params.get('t') ?? '', payment: params.get('payment') };
}

const formatDate = (s: string) =>
  new Date(s.replace(' ', 'T') + 'Z').toLocaleString('en-GB', {
    timeZone: 'Asia/Dhaka',
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit'
  });

export const OrderStatus = () => {
  const { navigateTo, showNotification } = useStore();
  const [{ id, token, payment }] = useState(readRoute);
  const [order, setOrder] = useState<PublicOrder | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [paying, setPaying] = useState(false);

  const load = useCallback(() => {
    getOrder(id, token)
      .then(setOrder)
      .catch((e) =>
        setError(
          e instanceof ApiError && e.status === 404
            ? 'We could not find this consignment. Check the link from your confirmation.'
            : 'Could not load your consignment status. Please refresh.'
        )
      );
  }, [id, token]);

  useEffect(() => {
    window.scrollTo(0, 0);
    load();
  }, [load]);

  useEffect(() => {
    if (order) {
      try {
        localStorage.setItem('pk_last_order', JSON.stringify({ id, token }));
      } catch {
        /* ignore */
      }
    }
  }, [order, id, token]);

  const pay = async () => {
    setPaying(true);
    try {
      const { redirectUrl } = await retryPayment(id, token);
      window.location.assign(redirectUrl);
    } catch (e) {
      showNotification(e instanceof ApiError ? e.message : 'Payment could not be started', 'error');
      setPaying(false);
    }
  };

  if (error) {
    return (
      <div className="min-h-[65vh] flex flex-col items-center justify-center text-center px-6">
        <XCircle size={48} className="text-primary-container mb-6" strokeWidth={1.5} />
        <h1 className="font-headline-xl text-headline-lg text-on-surface uppercase mb-3">Consignment Not Found</h1>
        <p className="font-body-md text-body-md text-text-muted mb-8 max-w-sm">{error}</p>
        <Button onClick={() => navigateTo('shop')} variant="primary">
          Continue Shopping
        </Button>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="max-w-3xl mx-auto py-12 space-y-6">
        <Skeleton className="h-24 w-24 rounded-2xl mx-auto" />
        <Skeleton className="h-10 w-2/3 mx-auto rounded-lg" />
        <Skeleton className="h-64 w-full rounded-2xl" />
      </div>
    );
  }

  const paid = order.paymentStatus === 'paid';
  const awaitingPayment = order.status === 'pending_payment';
  const cancelled = order.status === 'cancelled';
  const failedNow =
    awaitingPayment &&
    (payment === 'failed' ||
      payment === 'cancelled' ||
      order.paymentStatus === 'failed' ||
      order.paymentStatus === 'cancelled');

  const hero = cancelled
    ? {
        icon: <XCircle size={48} className="text-text-muted" strokeWidth={1.5} />,
        bg: 'bg-surface-charcoal-elevated border-surface-border',
        tag: 'Cancelled',
        title: 'Consignment Cancelled'
      }
    : awaitingPayment
      ? failedNow
        ? {
            icon: <XCircle size={48} className="text-primary-container" strokeWidth={1.5} />,
            bg: 'bg-primary-container/15 border-primary-container/40',
            tag:
              payment === 'cancelled' || order.paymentStatus === 'cancelled'
                ? 'Settlement Cancelled'
                : 'Settlement Failed',
            title: 'Payment Not Completed'
          }
        : {
            icon: <Clock size={48} className="text-secondary" strokeWidth={1.5} />,
            bg: 'bg-secondary/15 border-secondary/40',
            tag: 'Awaiting Settlement',
            title: 'Complete Your Payment'
          }
      : {
          icon: <CheckCircle size={48} className="text-secondary" strokeWidth={1.5} />,
          bg: 'bg-secondary/15 border-secondary/40',
          tag: paid ? 'Settlement Verified' : 'Cash on Delivery Confirmed',
          title: 'Consignment Confirmed'
        };

  const stepIndex = STEPS.findIndex((s) => s.key === order.status);

  return (
    <div className="max-w-4xl mx-auto py-6 md:py-12 animate-fade-in">
      <div className="text-center mb-10 bg-surface-charcoal border border-surface-border rounded-2xl p-8 shadow-xl">
        <div
          className={`w-24 h-24 ${hero.bg} border rounded-2xl flex items-center justify-center mx-auto mb-6 animate-slide-up`}
        >
          {hero.icon}
        </div>
        <div className="inline-block px-4 py-1 rounded-full bg-surface-charcoal-elevated border border-surface-border mb-4">
          <span className="font-label-caps text-label-caps uppercase tracking-widest text-secondary">{hero.tag}</span>
        </div>
        <h1 className="font-headline-xl text-headline-xl-mobile sm:text-headline-xl text-on-surface mb-3 uppercase tracking-tight">
          {hero.title}
        </h1>
        <button
          type="button"
          onClick={() => {
            navigator.clipboard?.writeText(order.id);
            showNotification('Consignment ID copied', 'info');
          }}
          className="inline-flex items-center gap-2 font-label-caps text-label-caps text-text-muted hover:text-on-surface bg-surface-charcoal-elevated px-3.5 py-1.5 rounded-lg border border-surface-border"
        >
          <span>CONSIGNMENT ID:</span>
          <span className="text-primary font-bold">{order.id}</span>
          <Copy size={13} />
        </button>

        {awaitingPayment && (
          <div className="mt-6 max-w-md mx-auto">
            <p className="font-body-md text-body-md text-text-muted mb-6">
              {failedNow
                ? 'No funds were deducted. Your vault allocation is reserved briefly — retry below.'
                : `We are holding your vault allocation. Complete payment via ${METHOD_LABEL[order.paymentMethod]} to dispatch.`}
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button onClick={pay} disabled={paying} variant="primary" className="whitespace-nowrap">
                {paying ? <Loader2 size={16} className="animate-spin" /> : <RefreshCw size={16} />}{' '}
                {failedNow ? 'Retry Payment' : 'Pay Now'} · {CURRENCY_SYMBOL} {order.total.toLocaleString()}
              </Button>
              <Button onClick={load} variant="outline" className="whitespace-nowrap">
                Refresh Status
              </Button>
            </div>
          </div>
        )}
        {!awaitingPayment && !cancelled && (
          <p className="font-body-md text-body-md text-text-muted mt-5 max-w-lg mx-auto">
            Thank you, <span className="text-on-surface font-semibold">{order.customer.name.split(' ')[0]}</span>! Our
            Banani Vault concierge will call{' '}
            <span className="text-secondary font-semibold">{order.customer.phone}</span> prior to dispatch.
          </p>
        )}
      </div>

      {!awaitingPayment && !cancelled && (
        <div className="bg-surface-charcoal border border-surface-border rounded-2xl p-6 mb-8 shadow-lg">
          <div className="grid grid-cols-4 gap-2">
            {STEPS.map((s, i) => {
              const Icon = s.icon;
              const reached = i <= stepIndex;
              return (
                <div key={s.key} className="flex flex-col items-center text-center gap-2">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center border ${
                      reached
                        ? 'bg-primary-container border-primary-container text-on-primary-container'
                        : 'bg-surface-charcoal-elevated border-surface-border text-text-muted'
                    }`}
                  >
                    <Icon size={18} />
                  </div>
                  <span
                    className={`font-label-caps text-[10px] uppercase tracking-wider ${
                      reached ? 'text-on-surface' : 'text-text-muted'
                    }`}
                  >
                    {s.label}
                  </span>
                </div>
              );
            })}
          </div>
          <div className="h-1.5 w-full bg-surface-container-highest rounded-full overflow-hidden mt-5">
            <div
              className="h-full bg-gradient-to-r from-primary-container to-secondary rounded-full transition-all duration-700"
              style={{ width: `${((stepIndex + 1) / STEPS.length) * 100}%` }}
            />
          </div>
        </div>
      )}

      <div className="grid md:grid-cols-5 gap-6">
        <div className="md:col-span-3 self-start bg-surface-charcoal border border-surface-border rounded-2xl p-6 shadow-lg">
          <h2 className="font-label-caps text-label-caps uppercase tracking-widest text-secondary mb-4">
            Consignment Items
          </h2>
          <div className="space-y-4">
            {order.items.map((item, i) => (
              <div key={i} className="flex gap-4 items-center">
                <img
                  src={item.image}
                  alt={item.name}
                  className="w-14 h-16 object-cover rounded-lg bg-surface-container-lowest border border-surface-border"
                />
                <div className="flex-1 min-w-0">
                  <div className="font-headline-md text-body-md font-bold text-on-surface truncate">{item.name}</div>
                  <div className="font-label-caps text-[10px] text-text-muted uppercase">
                    Size {item.size} × {item.quantity}
                    {item.customization && ` · ${item.customization.name ?? ''} #${item.customization.number ?? ''}`}
                  </div>
                </div>
                <div className="font-headline-md text-body-md font-bold text-on-surface">
                  {CURRENCY_SYMBOL} {(item.unitPrice * item.quantity).toLocaleString()}
                </div>
              </div>
            ))}
          </div>
          <div className="border-t border-surface-border mt-6 pt-4 space-y-2 font-body-sm text-body-sm">
            <Line label="Subtotal" value={order.subtotal} />
            <Line label="Shipping" value={order.shippingFee} free />
            {order.codFee > 0 && <Line label="COD Handling" value={order.codFee} />}
            <div className="flex justify-between font-headline-md text-title-sm font-bold text-on-surface pt-3 border-t border-surface-border">
              <span>Total</span>
              <span className="text-secondary">
                {CURRENCY_SYMBOL} {order.total.toLocaleString()}
              </span>
            </div>
          </div>
        </div>

        <div className="md:col-span-2 space-y-6">
          <div className="bg-surface-charcoal border border-surface-border rounded-2xl p-6 font-body-sm text-body-sm shadow-lg">
            <h2 className="font-label-caps text-label-caps uppercase tracking-widest text-secondary mb-4">
              Settlement
            </h2>
            <div className="flex justify-between mb-2">
              <span className="text-text-muted">Method</span>
              <span className="font-semibold text-on-surface">{METHOD_LABEL[order.paymentMethod]}</span>
            </div>
            <div className="flex justify-between mb-2">
              <span className="text-text-muted">Status</span>
              <span className={`font-semibold capitalize ${paid ? 'text-secondary' : 'text-primary'}`}>
                {order.paymentMethod === 'cod' && !paid ? 'Pay on delivery' : order.paymentStatus}
              </span>
            </div>
            {order.trxId && (
              <div className="flex justify-between gap-3">
                <span className="text-text-muted">Transaction</span>
                <span className="font-mono text-xs break-all text-right text-on-surface">{order.trxId}</span>
              </div>
            )}
          </div>

          <div className="bg-surface-charcoal border border-surface-border rounded-2xl p-6 font-body-sm text-body-sm shadow-lg">
            <h2 className="font-label-caps text-label-caps uppercase tracking-widest text-secondary mb-4">
              Dispatch Address
            </h2>
            <p className="font-semibold text-on-surface">{order.customer.name}</p>
            <p className="text-text-muted">{order.customer.phone}</p>
            <p className="text-text-muted mt-2">
              {order.customer.address}, {order.customer.district}
            </p>
          </div>

          <div className="bg-surface-charcoal border border-surface-border rounded-2xl p-6 font-body-sm text-body-sm shadow-lg">
            <h2 className="font-label-caps text-label-caps uppercase tracking-widest text-secondary mb-4">
              Consignment Log
            </h2>
            <ol className="space-y-3">
              {order.timeline
                .slice()
                .reverse()
                .map((e, i) => (
                  <li key={i} className="flex gap-3">
                    <span
                      className={`mt-1.5 w-2 h-2 rounded-full shrink-0 ${
                        i === 0 ? 'bg-primary-container' : 'bg-surface-container-highest'
                      }`}
                    />
                    <div>
                      <div className="text-on-surface">{e.message}</div>
                      <div className="text-[11px] text-text-muted">{formatDate(e.at)}</div>
                    </div>
                  </li>
                ))}
            </ol>
          </div>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 justify-center mt-10">
        <Button onClick={() => navigateTo('home')} variant="outline" className="min-w-[160px]">
          Return Home
        </Button>
        <Button onClick={() => navigateTo('shop')} variant="primary" className="min-w-[160px]">
          <span>Continue Shopping</span>
          <ArrowRight size={16} />
        </Button>
      </div>
    </div>
  );
};

const Line: React.FC<{ label: string; value: number; free?: boolean }> = ({ label, value, free }) => (
  <div className="flex justify-between text-text-muted">
    <span>{label}</span>
    <span className="font-label-numeric font-bold text-on-surface">
      {free && value === 0 ? 'FREE' : `${CURRENCY_SYMBOL} ${value.toLocaleString()}`}
    </span>
  </div>
);
