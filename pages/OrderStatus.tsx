import React, { useCallback, useEffect, useState } from 'react';
import { useStore } from '../context/StoreContext';
import { Button, Skeleton } from '../components/UI';
import { CURRENCY_SYMBOL } from '../constants';
import { CheckCircle, XCircle, Clock, Package, Truck, Home, ArrowRight, Loader2, Copy, RefreshCw } from 'lucide-react';
import { ApiError, getOrder, retryPayment } from '../lib/api';
import type { PublicOrder } from '../types';

const METHOD_LABEL = { bkash: 'bKash', sslcommerz: 'SSLCommerz', cod: 'Cash on Delivery' } as const;
const STEPS = [
  { key: 'confirmed', label: 'Confirmed', icon: CheckCircle },
  { key: 'processing', label: 'Packing', icon: Package },
  { key: 'shipped', label: 'On the way', icon: Truck },
  { key: 'delivered', label: 'Delivered', icon: Home },
] as const;

function readRoute() {
  const id = decodeURIComponent(window.location.pathname.split('/')[2] ?? '');
  const params = new URLSearchParams(window.location.search);
  return { id, token: params.get('t') ?? '', payment: params.get('payment') };
}

const formatDate = (s: string) =>
  new Date(s.replace(' ', 'T') + 'Z').toLocaleString('en-GB', { timeZone: 'Asia/Dhaka', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });

export const OrderStatus = () => {
  const { navigateTo, showNotification } = useStore();
  const [{ id, token, payment }] = useState(readRoute);
  const [order, setOrder] = useState<PublicOrder | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [paying, setPaying] = useState(false);

  const load = useCallback(() => {
    getOrder(id, token)
      .then(setOrder)
      .catch((e) => setError(e instanceof ApiError && e.status === 404 ? 'We could not find this order. Check the link from your confirmation.' : 'Could not load your order. Please refresh.'));
  }, [id, token]);

  useEffect(() => {
    window.scrollTo(0, 0);
    load();
  }, [load]);

  // Bookmarkable: remember the latest order on this device.
  useEffect(() => {
    if (order) try { localStorage.setItem('pk_last_order', JSON.stringify({ id, token })); } catch { /* ignore */ }
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
      <div className="min-h-[70vh] flex flex-col items-center justify-center text-center px-6">
        <XCircle size={48} className="text-gray-300 mb-6" strokeWidth={1.5} />
        <h1 className="text-2xl font-heading font-black text-brand-dark uppercase mb-3">Order not found</h1>
        <p className="text-gray-500 text-sm mb-8 max-w-sm">{error}</p>
        <Button onClick={() => navigateTo('shop')} variant="black">Continue Shopping</Button>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16 space-y-6">
        <Skeleton className="h-28 w-28 rounded-full mx-auto" />
        <Skeleton className="h-10 w-2/3 mx-auto rounded" />
        <Skeleton className="h-64 w-full rounded-2xl" />
      </div>
    );
  }

  const paid = order.paymentStatus === 'paid';
  const awaitingPayment = order.status === 'pending_payment';
  const cancelled = order.status === 'cancelled';
  const failedNow = awaitingPayment && (payment === 'failed' || payment === 'cancelled' || order.paymentStatus === 'failed' || order.paymentStatus === 'cancelled');

  const hero = cancelled
    ? { icon: <XCircle size={56} className="text-gray-400" strokeWidth={1.5} />, bg: 'bg-gray-100', tag: 'Cancelled', title: 'Order Cancelled' }
    : awaitingPayment
      ? failedNow
        ? { icon: <XCircle size={56} className="text-brand-crimson" strokeWidth={1.5} />, bg: 'bg-red-50', tag: payment === 'cancelled' || order.paymentStatus === 'cancelled' ? 'Payment cancelled' : 'Payment failed', title: 'Payment Not Completed' }
        : { icon: <Clock size={56} className="text-amber-500" strokeWidth={1.5} />, bg: 'bg-amber-50', tag: 'Awaiting payment', title: 'Complete Your Payment' }
      : { icon: <CheckCircle size={56} className="text-green-500" strokeWidth={1.5} />, bg: 'bg-green-50', tag: paid ? 'Payment successful' : 'Cash on Delivery', title: 'Order Confirmed' };

  const stepIndex = STEPS.findIndex((s) => s.key === order.status);

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10 md:py-16 animate-fade-in">
      <div className="text-center mb-10">
        <div className={`w-28 h-28 ${hero.bg} rounded-full flex items-center justify-center mx-auto mb-8 animate-slide-up`}>{hero.icon}</div>
        <div className="inline-block px-4 py-1.5 rounded-full bg-gray-50 border border-gray-100 mb-5">
          <span className="text-xs font-bold uppercase tracking-widest text-gray-500">{hero.tag}</span>
        </div>
        <h1 className="text-3xl md:text-5xl font-heading font-black text-brand-dark mb-4 tracking-tight leading-none">{hero.title}</h1>
        <button
          onClick={() => { navigator.clipboard?.writeText(order.id); showNotification('Order ID copied', 'info'); }}
          className="inline-flex items-center gap-2 text-gray-400 font-medium hover:text-brand-dark"
        >
          Order ID <span className="text-brand-dark font-mono font-bold">{order.id}</span> <Copy size={14} />
        </button>

        {awaitingPayment && (
          <div className="mt-8 max-w-md mx-auto">
            <p className="text-gray-500 text-sm mb-6 leading-relaxed">
              {failedNow
                ? 'No money was taken. Your items are reserved for a short while — try again below.'
                : `We're holding your items. Finish paying with ${METHOD_LABEL[order.paymentMethod]} to confirm the order.`}
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button onClick={pay} disabled={paying} variant="black" className="whitespace-nowrap">
                {paying ? <Loader2 size={16} className="animate-spin" /> : <RefreshCw size={16} />} {failedNow ? 'Try again' : 'Pay now'} · {CURRENCY_SYMBOL}{order.total.toLocaleString()}
              </Button>
              <Button onClick={load} variant="outline" className="whitespace-nowrap">Refresh status</Button>
            </div>
          </div>
        )}
        {!awaitingPayment && !cancelled && (
          <p className="text-gray-500 mt-6 max-w-lg mx-auto leading-relaxed">
            Thank you, {order.customer.name.split(' ')[0]}! We'll call <span className="text-brand-dark font-semibold">{order.customer.phone}</span> before
            dispatch. Delivery inside Dhaka takes 1–2 days, 3–5 days elsewhere.
          </p>
        )}
      </div>

      {!awaitingPayment && !cancelled && (
        <div className="bg-white border border-gray-100 rounded-2xl p-6 mb-8 shadow-sm">
          <div className="grid grid-cols-4 gap-2">
            {STEPS.map((s, i) => {
              const Icon = s.icon;
              const reached = i <= stepIndex;
              return (
                <div key={s.key} className="flex flex-col items-center text-center gap-2">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${reached ? 'bg-brand-dark text-white' : 'bg-gray-100 text-gray-300'}`}>
                    <Icon size={18} />
                  </div>
                  <span className={`text-[9px] sm:text-[10px] font-black uppercase tracking-widest ${reached ? 'text-brand-dark' : 'text-gray-300'}`}>{s.label}</span>
                </div>
              );
            })}
          </div>
          <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden mt-5">
            <div className="h-full bg-brand-dark rounded-full transition-all duration-700" style={{ width: `${((stepIndex + 1) / STEPS.length) * 100}%` }} />
          </div>
        </div>
      )}

      <div className="grid md:grid-cols-5 gap-6">
        <div className="md:col-span-3 self-start bg-gray-50 border border-gray-100 rounded-2xl p-6">
          <h2 className="font-heading font-black text-sm uppercase tracking-widest text-brand-dark mb-4">Items</h2>
          <div className="space-y-4">
            {order.items.map((item, i) => (
              <div key={i} className="flex gap-4 items-center">
                <img src={item.image} alt="" className="w-14 h-16 object-cover rounded-lg bg-gray-200" />
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-bold text-brand-dark truncate">{item.name}</div>
                  <div className="text-[11px] text-gray-500">
                    Size {item.size} × {item.quantity}
                    {item.customization && ` · ${item.customization.name ?? ''} ${item.customization.number ?? ''}`}
                  </div>
                </div>
                <div className="font-sport font-bold text-brand-dark">{CURRENCY_SYMBOL}{(item.unitPrice * item.quantity).toLocaleString()}</div>
              </div>
            ))}
          </div>
          <div className="border-t border-gray-200 mt-6 pt-4 space-y-2 text-sm">
            <Line label="Subtotal" value={order.subtotal} />
            <Line label="Shipping" value={order.shippingFee} free />
            {order.codFee > 0 && <Line label="COD handling" value={order.codFee} />}
            <div className="flex justify-between font-heading font-black text-xl text-brand-dark pt-3 border-t border-gray-200">
              <span>Total</span><span className="font-sport">{CURRENCY_SYMBOL}{order.total.toLocaleString()}</span>
            </div>
          </div>
        </div>

        <div className="md:col-span-2 space-y-6">
          <div className="bg-white border border-gray-100 rounded-2xl p-6 text-sm">
            <h2 className="font-heading font-black text-sm uppercase tracking-widest text-brand-dark mb-4">Payment</h2>
            <div className="flex justify-between mb-2"><span className="text-gray-500">Method</span><span className="font-semibold">{METHOD_LABEL[order.paymentMethod]}</span></div>
            <div className="flex justify-between mb-2">
              <span className="text-gray-500">Status</span>
              <span className={`font-semibold capitalize ${paid ? 'text-green-600' : 'text-amber-600'}`}>{order.paymentMethod === 'cod' && !paid ? 'Pay on delivery' : order.paymentStatus}</span>
            </div>
            {order.trxId && <div className="flex justify-between gap-3"><span className="text-gray-500">Transaction</span><span className="font-mono text-xs break-all text-right">{order.trxId}</span></div>}
          </div>
          <div className="bg-white border border-gray-100 rounded-2xl p-6 text-sm">
            <h2 className="font-heading font-black text-sm uppercase tracking-widest text-brand-dark mb-4">Deliver to</h2>
            <p className="font-semibold text-brand-dark">{order.customer.name}</p>
            <p className="text-gray-500">{order.customer.phone}</p>
            <p className="text-gray-500 mt-2">{order.customer.address}, {order.customer.district}</p>
          </div>
          <div className="bg-white border border-gray-100 rounded-2xl p-6 text-sm">
            <h2 className="font-heading font-black text-sm uppercase tracking-widest text-brand-dark mb-4">Timeline</h2>
            <ol className="space-y-3">
              {order.timeline.slice().reverse().map((e, i) => (
                <li key={i} className="flex gap-3">
                  <span className={`mt-1.5 w-2 h-2 rounded-full shrink-0 ${i === 0 ? 'bg-brand-crimson' : 'bg-gray-300'}`} />
                  <div><div className="text-brand-dark">{e.message}</div><div className="text-[11px] text-gray-400">{formatDate(e.at)}</div></div>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 justify-center mt-12">
        <Button onClick={() => navigateTo('home')} variant="outline" className="min-w-[160px]">Return Home</Button>
        <Button onClick={() => navigateTo('shop')} variant="black" className="min-w-[160px]">Continue Shopping <ArrowRight size={16} /></Button>
      </div>
    </div>
  );
};

const Line: React.FC<{ label: string; value: number; free?: boolean }> = ({ label, value, free }) => (
  <div className="flex justify-between text-gray-500">
    <span>{label}</span>
    <span className="font-sport text-brand-dark">{free && value === 0 ? 'FREE' : `${CURRENCY_SYMBOL}${value.toLocaleString()}`}</span>
  </div>
);
