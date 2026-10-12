import React, { useMemo, useState } from 'react';
import { useStore } from '../context/StoreContext';
import { Button } from '../components/UI';
import { Breadcrumbs } from '../components/Breadcrumbs';
import { CURRENCY_SYMBOL } from '../constants';
import { Trash2, ShoppingBag, ArrowRight, Lock, CheckCircle, Smartphone, CreditCard, Banknote, Loader2, FlaskConical } from 'lucide-react';
import { BD_DISTRICTS, COD_FEE, FREE_SHIPPING_THRESHOLD, computeTotals, isCustomized, normalizeBdPhone, unitPrice } from '../shared/pricing';
import { ApiError, placeOrder } from '../lib/api';
import type { CheckoutCustomer, GatewayMode, PaymentMethod } from '../types';

const METHODS: { id: PaymentMethod; title: string; detail: string; icon: React.ReactNode }[] = [
  { id: 'bkash', title: 'bKash', detail: 'Pay instantly from your bKash wallet', icon: <Smartphone size={18} /> },
  { id: 'sslcommerz', title: 'Card / Mobile Banking', detail: 'Visa, Mastercard, Amex, Nagad, Rocket & more — via SSLCommerz', icon: <CreditCard size={18} /> },
  { id: 'cod', title: 'Cash on Delivery', detail: `Pay the rider on delivery · +${CURRENCY_SYMBOL}${COD_FEE} handling`, icon: <Banknote size={18} /> },
];

const ModeTag: React.FC<{ mode?: GatewayMode }> = ({ mode }) =>
  mode === 'sandbox' || mode === 'mock' ? (
    <span className="inline-flex items-center gap-1 text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
      <FlaskConical size={10} /> {mode === 'sandbox' ? 'Sandbox' : 'Test mode'}
    </span>
  ) : null;

const EMPTY_CUSTOMER: CheckoutCustomer = { name: '', phone: '', email: '', district: 'Dhaka', address: '', note: '' };

function validate(c: CheckoutCustomer): Partial<Record<keyof CheckoutCustomer, string>> {
  const e: Partial<Record<keyof CheckoutCustomer, string>> = {};
  if (c.name.trim().length < 2) e.name = 'Enter your full name';
  if (!normalizeBdPhone(c.phone)) e.phone = 'Enter a valid mobile number, e.g. 017XXXXXXXX';
  if (c.email.trim() && !/^\S+@\S+\.\S+$/.test(c.email.trim())) e.email = 'Enter a valid email or leave it empty';
  if (c.address.trim().length < 8) e.address = 'Enter house, road and area';
  return e;
}

const Field: React.FC<{ label: string; error?: string; children: React.ReactNode; className?: string }> = ({ label, error, children, className = '' }) => (
  <div className={className}>
    <label className="block text-[9px] font-black uppercase text-gray-400 tracking-widest mb-2">{label}</label>
    {children}
    {error && <p className="text-[11px] text-brand-crimson font-semibold mt-1.5">{error}</p>}
  </div>
);

const inputCls = (err?: string) =>
  `w-full border-b py-3 text-sm focus:outline-none bg-transparent transition-colors ${err ? 'border-brand-crimson' : 'border-gray-200 focus:border-brand-dark'}`;

export const Cart = () => {
  const { cart, removeFromCart, updateQuantity, navigateTo, clearCart, config, showNotification } = useStore();
  const [step, setStep] = useState<'cart' | 'checkout'>(() => (window.location.pathname === '/checkout' ? 'checkout' : 'cart'));
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('bkash');
  const [customer, setCustomer] = useState<CheckoutCustomer>(() => {
    try {
      return { ...EMPTY_CUSTOMER, ...JSON.parse(localStorage.getItem('pk_customer') || '{}') };
    } catch {
      return EMPTY_CUSTOMER;
    }
  });
  const [touched, setTouched] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const errors = useMemo(() => validate(customer), [customer]);
  const shownErrors = touched ? errors : {};

  const lines = cart.map((i) => ({ unitPrice: unitPrice(i.price, isCustomized(i.customization)), quantity: i.quantity }));
  const totals = computeTotals(lines, paymentMethod);

  const goTo = (s: 'cart' | 'checkout') => {
    setStep(s);
    window.history.pushState(null, '', s === 'checkout' ? '/checkout' : '/cart');
    window.scrollTo(0, 0);
  };

  const set = (k: keyof CheckoutCustomer) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setCustomer((c) => ({ ...c, [k]: e.target.value }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setTouched(true);
    setServerError(null);
    if (Object.keys(errors).length) return;

    setSubmitting(true);
    try {
      try {
        // Remember delivery details for next time (not payment info).
        const { note, ...rest } = customer;
        localStorage.setItem('pk_customer', JSON.stringify(rest));
      } catch { /* ignore */ }

      const res = await placeOrder({
        items: cart.map((i) => ({
          productId: i.id,
          size: i.selectedSize,
          quantity: i.quantity,
          ...(isCustomized(i.customization) ? { customization: i.customization } : {}),
        })),
        customer,
        paymentMethod,
      });
      clearCart();
      // Gateway page (bKash / SSLCommerz) or our own order page for COD.
      window.location.assign(res.redirectUrl);
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : 'Could not reach the store. Check your connection and try again.';
      setServerError(msg);
      showNotification(msg, 'error');
      setSubmitting(false);
    }
  };

  if (cart.length === 0) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center text-center px-6 animate-fade-in">
        <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mb-6">
          <ShoppingBag size={28} className="text-gray-300" />
        </div>
        <h2 className="text-2xl font-heading font-black text-brand-dark mb-3 uppercase tracking-tighter">Empty Bag</h2>
        <p className="text-gray-500 text-sm mb-8 max-w-xs leading-relaxed">Your shopping bag is currently empty. Explore our latest premium kits.</p>
        <Button onClick={() => navigateTo('shop')} variant="black" className="px-10 rounded-full">Browse Shop</Button>
      </div>
    );
  }

  const CheckoutProgress = () => (
    <div className="flex items-center justify-center gap-3 sm:gap-4 mb-10 scale-90 sm:scale-100">
      {(['Bag', 'Details', 'Payment'] as const).map((label, i) => {
        const active = (step === 'cart' && i === 0) || (step === 'checkout' && i === 1);
        const done = step === 'checkout' && i === 0;
        return (
          <React.Fragment key={label}>
            {i > 0 && <div className={`h-[1px] w-6 sm:w-12 ${done || (step === 'checkout' && i === 1) ? 'bg-green-500' : 'bg-gray-200'}`} />}
            <div className="flex flex-col items-center gap-2">
              <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center font-bold text-xs ${active ? 'bg-brand-dark text-white shadow-xl' : done ? 'bg-green-500 text-white' : 'bg-gray-100 text-gray-400'}`}>
                {done ? <CheckCircle size={16} /> : i + 1}
              </div>
              <span className={`text-[8px] font-black uppercase tracking-[0.2em] ${active ? 'text-brand-dark' : 'text-gray-400'}`}>{label}</span>
            </div>
          </React.Fragment>
        );
      })}
    </div>
  );

  const Summary = ({ compact = false }: { compact?: boolean }) => (
    <div className="border-t border-gray-200 pt-6 space-y-3">
      <Row label="Subtotal" value={`${CURRENCY_SYMBOL}${totals.subtotal.toLocaleString()}`} />
      <Row label="Shipping" value={totals.shippingFee === 0 ? <span className="text-green-600">FREE</span> : `${CURRENCY_SYMBOL}${totals.shippingFee}`} />
      {totals.codFee > 0 && <Row label="COD handling" value={`${CURRENCY_SYMBOL}${totals.codFee}`} />}
      {!compact && totals.shippingFee > 0 && (
        <p className="text-[10px] text-gray-400">Free delivery on orders above {CURRENCY_SYMBOL}{FREE_SHIPPING_THRESHOLD.toLocaleString()}</p>
      )}
      <div className="flex justify-between font-heading font-black text-2xl text-brand-dark pt-5 border-t border-gray-200 mt-5">
        <span>TOTAL</span>
        <span className="font-sport">{CURRENCY_SYMBOL}{totals.total.toLocaleString()}</span>
      </div>
    </div>
  );

  if (step === 'checkout') {
    const cta = paymentMethod === 'cod' ? 'Place Order' : `Pay with ${paymentMethod === 'bkash' ? 'bKash' : 'SSLCommerz'}`;
    return (
      <div className="max-w-6xl mx-auto px-4 md:px-6 py-6 md:py-8 animate-fade-in">
        <div className="mb-6">
          <Breadcrumbs items={[{ label: 'Bag', view: 'cart' as const }, { label: 'Checkout' }]} />
        </div>

        <CheckoutProgress />

        <form noValidate onSubmit={submit} className="flex flex-col lg:flex-row gap-10">
          <div className="flex-1 order-2 lg:order-1">
            <button type="button" onClick={() => goTo('cart')} className="text-[9px] font-black uppercase tracking-widest text-gray-400 hover:text-brand-dark mb-8 flex items-center gap-2">
              ← Edit Bag
            </button>
            <div className="flex items-center justify-between mb-8">
              <h1 className="text-2xl sm:text-3xl font-heading font-black text-brand-dark uppercase tracking-tighter">Delivery Details</h1>
              <div className="flex items-center gap-1.5 text-green-600 bg-green-50 px-3 py-1 rounded text-[8px] font-black">
                <Lock size={12} /> SECURE
              </div>
            </div>

            <div className="space-y-10">
              <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Field label="Full Name" error={shownErrors.name} className="md:col-span-2">
                  <input autoComplete="name" value={customer.name} onChange={set('name')} className={inputCls(shownErrors.name)} placeholder="Your full name" />
                </Field>
                <Field label="Mobile Number" error={shownErrors.phone}>
                  <input type="tel" inputMode="tel" autoComplete="tel" value={customer.phone} onChange={set('phone')} className={inputCls(shownErrors.phone)} placeholder="01XXXXXXXXX" />
                </Field>
                <Field label="Email (optional)" error={shownErrors.email}>
                  <input type="email" autoComplete="email" value={customer.email} onChange={set('email')} className={inputCls(shownErrors.email)} placeholder="For your receipt" />
                </Field>
                <Field label="District">
                  <select value={customer.district} onChange={set('district')} className={`${inputCls()} cursor-pointer`}>
                    {BD_DISTRICTS.map((d) => <option key={d}>{d}</option>)}
                  </select>
                </Field>
                <Field label="Full Address" error={shownErrors.address} className="md:col-span-2">
                  <input autoComplete="street-address" value={customer.address} onChange={set('address')} className={inputCls(shownErrors.address)} placeholder="House, Road, Area, Thana" />
                </Field>
                <Field label="Order note (optional)" className="md:col-span-2">
                  <input value={customer.note} onChange={set('note')} maxLength={300} className={inputCls()} placeholder="e.g. Call before delivery" />
                </Field>
              </section>

              <section>
                <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-brand-dark mb-4">Payment Method</h2>
                <div className="grid grid-cols-1 gap-3" role="radiogroup">
                  {METHODS.map((m) => (
                    <label
                      key={m.id}
                      className={`flex items-center gap-4 p-4 border transition-all cursor-pointer rounded-xl ${paymentMethod === m.id ? 'border-brand-dark bg-gray-50 shadow-sm' : 'border-gray-100 hover:border-gray-300'}`}
                    >
                      <input type="radio" name="payment" className="accent-brand-dark w-4 h-4" checked={paymentMethod === m.id} onChange={() => setPaymentMethod(m.id)} />
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${paymentMethod === m.id ? 'bg-brand-dark text-white' : 'bg-gray-100 text-gray-500'}`}>{m.icon}</div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <span className="font-heading font-black text-sm uppercase text-brand-dark leading-none">{m.title}</span>
                          {m.id !== 'cod' && <ModeTag mode={config?.payments[m.id]} />}
                        </div>
                        <div className="text-[11px] text-gray-500 leading-snug">{m.detail}</div>
                      </div>
                    </label>
                  ))}
                </div>
                {paymentMethod !== 'cod' && (
                  <p className="text-[11px] text-gray-400 mt-3 leading-relaxed">
                    You'll be redirected to the secure {paymentMethod === 'bkash' ? 'bKash' : 'SSLCommerz'} payment page and brought back here once payment is complete.
                  </p>
                )}
              </section>

              {serverError && (
                <div className="p-4 rounded-xl bg-red-50 border border-red-100 text-sm text-brand-crimson font-semibold" role="alert">{serverError}</div>
              )}

              <Button type="submit" fullWidth disabled={submitting} variant="black" className="h-16 text-xs sm:text-sm rounded-full shadow-2xl">
                {submitting ? <><Loader2 size={18} className="animate-spin" /> Processing…</> : <>{cta} — {CURRENCY_SYMBOL}{totals.total.toLocaleString()}</>}
              </Button>
            </div>
          </div>

          <div className="lg:w-1/3 order-1 lg:order-2">
            <div className="bg-gray-50 p-6 sm:p-8 lg:sticky top-24 border border-gray-100 rounded-2xl">
              <h3 className="font-heading font-black text-lg mb-6 text-brand-dark uppercase tracking-tight">Summary</h3>
              <div className="space-y-4 mb-6 max-h-[30vh] overflow-y-auto pr-2 no-scrollbar">
                {cart.map((item) => (
                  <div key={item.cartId} className="flex justify-between gap-4 text-xs py-3 border-b border-gray-200/50 last:border-0">
                    <div className="flex-1 pr-4 min-w-0">
                      <span className="text-brand-dark font-bold block uppercase tracking-tight truncate">{item.name}</span>
                      <span className="text-[9px] text-gray-400 font-bold uppercase tracking-widest">
                        Size {item.selectedSize} × {item.quantity}
                        {isCustomized(item.customization) && ` · ${item.customization!.name} ${item.customization!.number}`}
                      </span>
                    </div>
                    <span className="font-sport font-bold text-brand-dark">
                      {CURRENCY_SYMBOL}{(unitPrice(item.price, isCustomized(item.customization)) * item.quantity).toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>
              <Summary compact />
            </div>
          </div>
        </form>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 md:py-8 animate-fade-in">
      <div className="mb-6">
        <Breadcrumbs items={[{ label: 'Shopping Bag', view: 'cart' as const }]} />
      </div>

      <h1 className="text-2xl sm:text-5xl font-heading font-black mb-8 text-center text-brand-dark uppercase tracking-tighter">
        Your Bag <span className="text-brand-crimson">({cart.length})</span>
      </h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        <div className="lg:col-span-2 space-y-4">
          {cart.map((item) => (
            <div key={item.cartId} className="flex gap-4 p-3 border-b border-gray-50 last:border-0 hover:bg-gray-50/50 transition-colors rounded-xl">
              <div className="w-20 h-28 sm:w-28 sm:h-36 bg-gray-100 rounded-lg overflow-hidden shrink-0">
                <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
              </div>
              <div className="flex-1 flex flex-col justify-between py-1 min-w-0">
                <div>
                  <div className="flex justify-between items-start gap-2 mb-1">
                    <h3 className="font-heading font-bold text-brand-dark text-sm sm:text-lg truncate uppercase tracking-tight">{item.name}</h3>
                    <button onClick={() => removeFromCart(item.cartId)} aria-label="Remove" className="text-gray-300 hover:text-brand-crimson p-1 transition-colors shrink-0 active:scale-90">
                      <Trash2 size={16} />
                    </button>
                  </div>
                  <div className="text-[9px] sm:text-xs font-bold uppercase tracking-widest text-gray-400 mb-2">
                    Size {item.selectedSize}
                    {item.status === 'pre-order' && <span className="ml-2 text-brand-gold">Pre-order</span>}
                    {item.status === 'low-stock' && item.stock !== undefined && <span className="ml-2 text-brand-crimson">Only {item.stock} left</span>}
                  </div>
                  {isCustomized(item.customization) && (
                    <div className="text-[8px] font-black bg-brand-crimson/10 inline-block px-2 py-1 text-brand-crimson rounded uppercase tracking-[0.1em]">
                      {item.customization!.name} • {item.customization!.number}
                    </div>
                  )}
                </div>

                <div className="flex justify-between items-end">
                  <div className="flex items-center border border-gray-100 h-8 rounded-full px-1 bg-white">
                    <button onClick={() => updateQuantity(item.cartId, -1)} aria-label="Decrease" className="w-7 h-full text-gray-400 font-bold active:bg-gray-100 rounded-l-full">-</button>
                    <span className="px-2 text-[10px] font-black min-w-[24px] text-center text-brand-dark">{item.quantity}</span>
                    <button onClick={() => updateQuantity(item.cartId, 1)} aria-label="Increase" className="w-7 h-full text-gray-400 font-bold active:bg-gray-100 rounded-r-full">+</button>
                  </div>
                  <div className="font-sport font-bold text-base sm:text-lg text-brand-dark">
                    {CURRENCY_SYMBOL}{(unitPrice(item.price, isCustomized(item.customization)) * item.quantity).toLocaleString()}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="lg:col-span-1">
          <div className="bg-gray-50 p-6 sm:p-8 rounded-2xl border border-gray-100 shadow-sm lg:sticky lg:top-24">
            <h3 className="font-heading font-black text-lg mb-6 text-brand-dark uppercase tracking-tight">Summary</h3>
            <div className="mb-8">
              <Summary />
            </div>
            <Button fullWidth onClick={() => goTo('checkout')} variant="black" className="h-16 text-xs sm:text-sm rounded-full shadow-2xl">
              Proceed to Checkout <ArrowRight size={18} />
            </Button>
            <div className="mt-6 flex flex-wrap justify-center gap-2 text-[9px] font-bold uppercase tracking-widest text-gray-400">
              <span>bKash</span>·<span>Cards</span>·<span>Nagad</span>·<span>Rocket</span>·<span>COD</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const Row: React.FC<{ label: string; value: React.ReactNode }> = ({ label, value }) => (
  <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest text-gray-400">
    <span>{label}</span>
    <span className="text-brand-dark font-sport">{value}</span>
  </div>
);
