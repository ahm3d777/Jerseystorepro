import React, { useMemo, useState } from 'react';
import { useStore } from '../context/StoreContext';
import { Button } from '../components/UI';
import { Breadcrumbs } from '../components/Breadcrumbs';
import { CURRENCY_SYMBOL } from '../constants';
import {
  Trash2,
  ShoppingBag,
  ArrowRight,
  Lock,
  CheckCircle,
  Smartphone,
  CreditCard,
  Banknote,
  Loader2,
  FlaskConical,
  ArrowLeft
} from 'lucide-react';
import {
  BD_DISTRICTS,
  COD_FEE,
  FREE_SHIPPING_THRESHOLD,
  computeTotals,
  isCustomized,
  normalizeBdPhone,
  unitPrice
} from '../shared/pricing';
import { ApiError, placeOrder } from '../lib/api';
import type { CheckoutCustomer, GatewayMode, PaymentMethod } from '../types';

const METHODS: { id: PaymentMethod; title: string; detail: string; icon: React.ReactNode }[] = [
  {
    id: 'bkash',
    title: 'bKash Instant Wallet',
    detail: 'Pay instantly via bKash tokenized checkout or EMI',
    icon: <Smartphone size={18} />
  },
  {
    id: 'sslcommerz',
    title: 'Card / Mobile Banking',
    detail: 'Visa, Mastercard, Amex, Nagad, Rocket & more — via SSLCommerz',
    icon: <CreditCard size={18} />
  },
  {
    id: 'cod',
    title: 'Cash on Delivery',
    detail: `Pay the courier on doorstep arrival · +${CURRENCY_SYMBOL}${COD_FEE} handling`,
    icon: <Banknote size={18} />
  }
];

const ModeTag: React.FC<{ mode?: GatewayMode }> = ({ mode }) =>
  mode === 'sandbox' || mode === 'mock' ? (
    <span className="inline-flex items-center gap-1 font-label-caps text-[9px] uppercase tracking-wider px-2 py-0.5 rounded-full bg-secondary/20 text-secondary border border-secondary/30">
      <FlaskConical size={10} /> {mode === 'sandbox' ? 'Sandbox' : 'Test Mode'}
    </span>
  ) : null;

const EMPTY_CUSTOMER: CheckoutCustomer = {
  name: '',
  phone: '',
  email: '',
  district: 'Dhaka',
  address: '',
  note: ''
};

function validate(c: CheckoutCustomer): Partial<Record<keyof CheckoutCustomer, string>> {
  const e: Partial<Record<keyof CheckoutCustomer, string>> = {};
  if (c.name.trim().length < 2) e.name = 'Enter your full name';
  if (!normalizeBdPhone(c.phone)) e.phone = 'Enter a valid BD mobile number, e.g. 017XXXXXXXX';
  if (c.email.trim() && !/^\S+@\S+\.\S+$/.test(c.email.trim())) e.email = 'Enter a valid email or leave empty';
  if (c.address.trim().length < 8) e.address = 'Enter house, road, and area details';
  return e;
}

const Field: React.FC<{ label: string; error?: string; children: React.ReactNode; className?: string }> = ({
  label,
  error,
  children,
  className = ''
}) => (
  <div className={className}>
    <label className="block font-label-caps text-[10px] uppercase text-text-muted tracking-widest mb-2">{label}</label>
    {children}
    {error && <p className="font-body-sm text-body-sm text-primary-container font-semibold mt-1.5">{error}</p>}
  </div>
);

const inputCls = (err?: string) =>
  `w-full rounded-lg bg-surface-charcoal-elevated border px-3.5 py-3 font-body-md text-body-md text-on-surface placeholder:text-text-muted focus:outline-none transition-colors ${
    err ? 'border-primary-container' : 'border-surface-border focus:border-primary-container'
  }`;

export const Cart = () => {
  const { cart, removeFromCart, updateQuantity, navigateTo, clearCart, config, showNotification } = useStore();
  const [step, setStep] = useState<'cart' | 'checkout'>(() =>
    window.location.pathname === '/checkout' ? 'checkout' : 'cart'
  );
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

  const lines = cart.map((i) => ({
    unitPrice: unitPrice(i.price, isCustomized(i.customization)),
    quantity: i.quantity
  }));
  const totals = computeTotals(lines, paymentMethod);

  const goTo = (s: 'cart' | 'checkout') => {
    setStep(s);
    window.history.pushState(null, '', s === 'checkout' ? '/checkout' : '/cart');
    window.scrollTo(0, 0);
  };

  const set =
    (k: keyof CheckoutCustomer) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
      setCustomer((c) => ({ ...c, [k]: e.target.value }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setTouched(true);
    setServerError(null);
    if (Object.keys(errors).length) return;

    setSubmitting(true);
    try {
      try {
        const { note, ...rest } = customer;
        localStorage.setItem('pk_customer', JSON.stringify(rest));
      } catch {
        /* ignore */
      }

      const res = await placeOrder({
        items: cart.map((i) => ({
          productId: i.id,
          size: i.selectedSize,
          quantity: i.quantity,
          ...(isCustomized(i.customization) ? { customization: i.customization } : {})
        })),
        customer,
        paymentMethod
      });
      clearCart();
      window.location.assign(res.redirectUrl);
    } catch (err) {
      const msg =
        err instanceof ApiError
          ? err.message
          : 'Could not reach the store. Check your connection and try again.';
      setServerError(msg);
      showNotification(msg, 'error');
      setSubmitting(false);
    }
  };

  if (cart.length === 0) {
    return (
      <div className="min-h-[65vh] flex flex-col items-center justify-center text-center px-6 animate-fade-in">
        <div className="w-20 h-20 bg-surface-charcoal border border-surface-border rounded-2xl flex items-center justify-center mb-6 shadow-lg">
          <ShoppingBag size={28} className="text-primary-container" />
        </div>
        <h2 className="font-headline-xl text-headline-lg text-on-surface mb-3 uppercase tracking-tight">
          Your Match Bag Is Empty
        </h2>
        <p className="font-body-md text-body-md text-text-muted mb-8 max-w-sm">
          Explore our 2025/26 Player Edition drops and commemorative archives to build your matchday kit.
        </p>
        <Button onClick={() => navigateTo('shop')} variant="primary" className="px-10">
          <span>Explore Match Vault</span>
          <ArrowRight size={16} />
        </Button>
      </div>
    );
  }

  const CheckoutProgress = () => (
    <div className="flex items-center justify-center gap-3 sm:gap-4 mb-10">
      {(['Bag', 'Dispatch Details', 'Settlement'] as const).map((label, i) => {
        const active = (step === 'cart' && i === 0) || (step === 'checkout' && i === 1);
        const done = step === 'checkout' && i === 0;
        return (
          <React.Fragment key={label}>
            {i > 0 && (
              <div
                className={`h-0.5 w-8 sm:w-14 ${
                  done || (step === 'checkout' && i === 1) ? 'bg-primary-container' : 'bg-surface-border'
                }`}
              />
            )}
            <div className="flex flex-col items-center gap-2">
              <div
                className={`w-9 h-9 rounded-full flex items-center justify-center font-label-caps text-label-caps border ${
                  active
                    ? 'bg-primary-container border-primary-container text-on-primary-container shadow-lg'
                    : done
                      ? 'bg-secondary border-secondary text-on-secondary'
                      : 'bg-surface-charcoal border-surface-border text-text-muted'
                }`}
              >
                {done ? <CheckCircle size={16} /> : i + 1}
              </div>
              <span
                className={`font-label-caps text-[10px] uppercase tracking-widest ${
                  active ? 'text-on-surface' : 'text-text-muted'
                }`}
              >
                {label}
              </span>
            </div>
          </React.Fragment>
        );
      })}
    </div>
  );

  const Summary = ({ compact = false }: { compact?: boolean }) => (
    <div className="border-t border-surface-border pt-5 space-y-3">
      <Row label="Subtotal" value={`${CURRENCY_SYMBOL} ${totals.subtotal.toLocaleString()}`} />
      <Row
        label="Insured Courier"
        value={
          totals.shippingFee === 0 ? (
            <span className="text-secondary font-bold">FREE</span>
          ) : (
            `${CURRENCY_SYMBOL} ${totals.shippingFee}`
          )
        }
      />
      {totals.codFee > 0 && <Row label="COD Handling" value={`${CURRENCY_SYMBOL} ${totals.codFee}`} />}
      {!compact && totals.shippingFee > 0 && (
        <p className="font-body-sm text-[11px] text-text-muted">
          Free shipping across Bangladesh on orders above {CURRENCY_SYMBOL}{' '}
          {FREE_SHIPPING_THRESHOLD.toLocaleString()}
        </p>
      )}
      <div className="flex justify-between items-baseline font-headline-md text-headline-md text-on-surface pt-4 border-t border-surface-border mt-4">
        <span className="font-label-caps text-label-caps uppercase text-text-muted">Total Payable</span>
        <span className="font-bold text-secondary">
          {CURRENCY_SYMBOL} {totals.total.toLocaleString()}
        </span>
      </div>
    </div>
  );

  if (step === 'checkout') {
    const cta =
      paymentMethod === 'cod'
        ? 'Confirm Consignment'
        : `Pay with ${paymentMethod === 'bkash' ? 'bKash' : 'SSLCommerz'}`;
    return (
      <div className="py-4 md:py-6 animate-fade-in">
        <div className="mb-6">
          <Breadcrumbs items={[{ label: 'Bag', view: 'cart' as const }, { label: 'Checkout' }]} />
        </div>

        <CheckoutProgress />

        <form noValidate onSubmit={submit} className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-8 order-2 lg:order-1 bg-surface-charcoal border border-surface-border rounded-2xl p-6 sm:p-8 shadow-xl">
            <button
              type="button"
              onClick={() => goTo('cart')}
              className="inline-flex items-center gap-2 font-label-caps text-label-caps uppercase text-text-muted hover:text-on-surface mb-6"
            >
              <ArrowLeft size={14} className="text-primary-container" />
              <span>Modify Bag</span>
            </button>

            <div className="flex items-center justify-between mb-6 pb-4 border-b border-surface-border">
              <h1 className="font-headline-xl text-headline-lg text-on-surface uppercase tracking-tight">
                Consignment &amp; Delivery
              </h1>
              <div className="flex items-center gap-1.5 text-secondary bg-secondary/15 border border-secondary/30 px-3 py-1 rounded-full font-label-caps text-[10px]">
                <Lock size={12} /> ENCRYPTED CHECKOUT
              </div>
            </div>

            <div className="space-y-8">
              <section className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <Field label="Recipient Full Name" error={shownErrors.name} className="md:col-span-2">
                  <input
                    autoComplete="name"
                    value={customer.name}
                    onChange={set('name')}
                    className={inputCls(shownErrors.name)}
                    placeholder="Enter your full name"
                  />
                </Field>
                <Field label="Bangladesh Mobile Number" error={shownErrors.phone}>
                  <input
                    type="tel"
                    inputMode="tel"
                    autoComplete="tel"
                    value={customer.phone}
                    onChange={set('phone')}
                    className={inputCls(shownErrors.phone)}
                    placeholder="01XXXXXXXXX"
                  />
                </Field>
                <Field label="Email (Optional)" error={shownErrors.email}>
                  <input
                    type="email"
                    autoComplete="email"
                    value={customer.email}
                    onChange={set('email')}
                    className={inputCls(shownErrors.email)}
                    placeholder="For digital provenance receipt"
                  />
                </Field>
                <Field label="Delivery District">
                  <select
                    value={customer.district}
                    onChange={set('district')}
                    className={`${inputCls()} cursor-pointer`}
                  >
                    {BD_DISTRICTS.map((d) => (
                      <option key={d}>{d}</option>
                    ))}
                  </select>
                </Field>
                <Field label="Street Address & Area" error={shownErrors.address} className="md:col-span-2">
                  <input
                    autoComplete="street-address"
                    value={customer.address}
                    onChange={set('address')}
                    className={inputCls(shownErrors.address)}
                    placeholder="House, Road, Block/Sector, Thana (e.g. Banani Road 11)"
                  />
                </Field>
                <Field label="Courier Instructions (Optional)" className="md:col-span-2">
                  <input
                    value={customer.note}
                    onChange={set('note')}
                    maxLength={300}
                    className={inputCls()}
                    placeholder="e.g. Call before arrival at gate"
                  />
                </Field>
              </section>

              <section>
                <h2 className="font-label-caps text-label-caps uppercase tracking-widest text-on-surface mb-4">
                  Select Settlement Method
                </h2>
                <div className="grid grid-cols-1 gap-3" role="radiogroup">
                  {METHODS.map((m) => {
                    const active = paymentMethod === m.id;
                    return (
                      <label
                        key={m.id}
                        className={`flex items-center gap-4 p-4 border transition-all cursor-pointer rounded-xl ${
                          active
                            ? 'border-primary-container bg-surface-charcoal-elevated shadow-md'
                            : 'border-surface-border bg-surface-charcoal hover:border-outline'
                        }`}
                      >
                        <input
                          type="radio"
                          name="payment"
                          className="accent-primary-container w-4 h-4"
                          checked={active}
                          onChange={() => setPaymentMethod(m.id)}
                        />
                        <div
                          className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${
                            active
                              ? 'bg-primary-container text-on-primary-container'
                              : 'bg-surface-charcoal-elevated text-text-muted'
                          }`}
                        >
                          {m.icon}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap mb-0.5">
                            <span className="font-headline-md text-label-numeric font-bold uppercase text-on-surface">
                              {m.title}
                            </span>
                            {m.id !== 'cod' && <ModeTag mode={config?.payments[m.id]} />}
                          </div>
                          <div className="font-body-sm text-body-sm text-text-muted">{m.detail}</div>
                        </div>
                      </label>
                    );
                  })}
                </div>
              </section>

              {serverError && (
                <div
                  className="p-4 rounded-xl bg-error-container/30 border border-error/40 font-body-sm text-body-sm text-error font-semibold"
                  role="alert"
                >
                  {serverError}
                </div>
              )}

              <Button type="submit" fullWidth disabled={submitting} variant="primary" className="h-14">
                {submitting ? (
                  <>
                    <Loader2 size={18} className="animate-spin" /> Processing Consignment…
                  </>
                ) : (
                  <>
                    <span>
                      {cta} — {CURRENCY_SYMBOL} {totals.total.toLocaleString()}
                    </span>
                    <ArrowRight size={17} />
                  </>
                )}
              </Button>
            </div>
          </div>

          <div className="lg:col-span-4 order-1 lg:order-2">
            <div className="bg-surface-charcoal p-6 sm:p-7 lg:sticky lg:top-[calc(var(--header-h,7rem)+1rem)] border border-surface-border rounded-2xl shadow-xl">
              <h3 className="font-headline-md text-title-sm font-bold mb-5 text-on-surface uppercase tracking-tight">
                Vault Consignment Summary
              </h3>
              <div className="space-y-3 mb-6 max-h-[32vh] overflow-y-auto pr-1 no-scrollbar">
                {cart.map((item) => (
                  <div
                    key={item.cartId}
                    className="flex justify-between gap-3 py-3 border-b border-surface-border/60 last:border-0"
                  >
                    <div className="flex-1 min-w-0">
                      <span className="font-headline-md text-body-md font-bold text-on-surface block truncate">
                        {item.name}
                      </span>
                      <span className="font-label-caps text-[10px] text-text-muted uppercase">
                        Size {item.selectedSize === 'XXL' ? '2XL' : item.selectedSize} × {item.quantity}
                        {isCustomized(item.customization) &&
                          ` · ${item.customization!.name} #${item.customization!.number}`}
                      </span>
                    </div>
                    <span className="font-headline-md text-body-md font-bold text-on-surface shrink-0">
                      {CURRENCY_SYMBOL}{' '}
                      {(unitPrice(item.price, isCustomized(item.customization)) * item.quantity).toLocaleString()}
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
    <div className="py-4 md:py-6 animate-fade-in">
      <div className="mb-6">
        <Breadcrumbs items={[{ label: 'Shopping Bag', view: 'cart' as const }]} />
      </div>

      <div className="flex items-end justify-between mb-8">
        <div>
          <span className="font-label-caps text-label-caps uppercase text-secondary tracking-widest">
            SELECTED FIXTURES
          </span>
          <h1 className="font-headline-xl text-headline-xl-mobile sm:text-headline-xl text-on-surface uppercase tracking-tight">
            Your Bag <span className="text-primary-container">({cart.length})</span>
          </h1>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-8 space-y-4">
          {cart.map((item) => (
            <div
              key={item.cartId}
              className="flex gap-4 sm:gap-5 p-4 rounded-2xl bg-surface-charcoal border border-surface-border shadow-md hover:border-primary-container/40 transition-colors"
            >
              <div
                onClick={() => navigateTo('product', item)}
                className="w-24 h-32 sm:w-28 sm:h-36 bg-surface-container-lowest rounded-xl overflow-hidden shrink-0 cursor-pointer border border-surface-border"
              >
                <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
              </div>
              <div className="flex-1 flex flex-col justify-between py-0.5 min-w-0">
                <div>
                  <div className="flex justify-between items-start gap-2 mb-1">
                    <div>
                      <span className="font-label-caps text-[10px] uppercase text-secondary block">
                        ✦ {item.team}
                      </span>
                      <h3
                        onClick={() => navigateTo('product', item)}
                        className="font-headline-md text-title-sm font-bold text-on-surface hover:text-primary truncate cursor-pointer"
                      >
                        {item.name}
                      </h3>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeFromCart(item.cartId)}
                      aria-label="Remove item"
                      className="text-text-muted hover:text-primary-container p-1.5 rounded-lg hover:bg-surface-charcoal-elevated transition-colors shrink-0"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>

                  <div className="font-label-caps text-label-caps uppercase text-text-muted mb-2">
                    Size {item.selectedSize === 'XXL' ? '2XL' : item.selectedSize}
                    {item.status === 'pre-order' && <span className="ml-2 text-secondary">• Pre-Order</span>}
                    {item.status === 'low-stock' && item.stock !== undefined && (
                      <span className="ml-2 text-primary">• Only {item.stock} Left</span>
                    )}
                  </div>

                  {isCustomized(item.customization) && (
                    <div className="inline-flex items-center gap-1.5 font-label-caps text-[10px] bg-primary-container/15 border border-primary-container/30 px-2.5 py-1 text-primary rounded-md uppercase">
                      <span>
                        Custom Print: {item.customization!.name} #{item.customization!.number}
                      </span>
                    </div>
                  )}
                </div>

                <div className="flex justify-between items-end pt-3">
                  <div className="flex items-center border border-surface-border h-9 rounded-lg px-1 bg-surface-charcoal-elevated">
                    <button
                      type="button"
                      onClick={() => updateQuantity(item.cartId, -1)}
                      aria-label="Decrease quantity"
                      className="w-7 h-full text-text-muted hover:text-on-surface font-bold"
                    >
                      -
                    </button>
                    <span className="px-2.5 font-label-numeric text-body-sm font-bold min-w-[28px] text-center text-on-surface">
                      {item.quantity}
                    </span>
                    <button
                      type="button"
                      onClick={() => updateQuantity(item.cartId, 1)}
                      aria-label="Increase quantity"
                      className="w-7 h-full text-text-muted hover:text-on-surface font-bold"
                    >
                      +
                    </button>
                  </div>
                  <div className="font-headline-md text-headline-md font-bold text-on-surface">
                    {CURRENCY_SYMBOL}{' '}
                    {(unitPrice(item.price, isCustomized(item.customization)) * item.quantity).toLocaleString()}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="lg:col-span-4">
          <div className="bg-surface-charcoal p-6 sm:p-8 rounded-2xl border border-surface-border shadow-xl lg:sticky lg:top-[calc(var(--header-h,7rem)+1rem)]">
            <h3 className="font-headline-md text-title-sm font-bold mb-5 text-on-surface uppercase tracking-tight">
              Order Summary
            </h3>
            <div className="mb-6">
              <Summary />
            </div>
            <Button fullWidth onClick={() => goTo('checkout')} variant="primary" className="h-14">
              <span>Proceed to Checkout</span>
              <ArrowRight size={18} />
            </Button>
            <div className="mt-5 flex flex-wrap justify-center gap-2 font-label-caps text-[10px] uppercase text-text-muted">
              <span className="text-primary">bKash</span>·<span className="text-secondary">Nagad</span>·
              <span>VISA</span>·<span>Mastercard</span>·<span>COD</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const Row: React.FC<{ label: string; value: React.ReactNode }> = ({ label, value }) => (
  <div className="flex justify-between items-center font-label-caps text-label-caps uppercase text-text-muted">
    <span>{label}</span>
    <span className="text-on-surface font-label-numeric text-body-md font-bold">{value}</span>
  </div>
);
