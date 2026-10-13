import React, { useEffect, useState } from 'react';
import { ArrowLeft, Phone, RefreshCw, Loader2 } from 'lucide-react';
import { adminApi, type OrderDetail } from './api';
import type { AdminNav } from './AdminApp';
import { ApiError } from '../lib/api';
import { Btn, Card, Pill, taka, fmtDate, inputCls, textareaCls, METHOD_LABEL, STATUS_LABEL } from './ui';

const NEXT: Record<string, string[]> = {
  pending_payment: ['cancelled'],
  confirmed: ['processing', 'shipped', 'cancelled'],
  processing: ['shipped', 'cancelled'],
  shipped: ['delivered', 'cancelled'],
  delivered: [],
  cancelled: []
};

export const OrderDetailView: React.FC<{ id: string; nav: AdminNav; onAuthError: (e: unknown) => void }> = ({
  id,
  nav,
  onAuthError
}) => {
  const [d, setD] = useState<OrderDetail | null>(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState<string | null>(null);
  const [note, setNote] = useState('');
  const [adminNote, setAdminNote] = useState('');
  const [flash, setFlash] = useState('');

  const load = () =>
    adminApi
      .order(id)
      .then((r) => {
        setD(r);
        setAdminNote(r.order.admin_note ?? '');
      })
      .catch((e) => {
        onAuthError(e);
        setError(e instanceof ApiError ? e.message : 'Failed to load');
      });

  useEffect(() => {
    load();
  }, [id]);

  const act = async (key: string, fn: () => Promise<unknown>, ok: string) => {
    setBusy(key);
    setError('');
    setFlash('');
    try {
      await fn();
      setFlash(ok);
      await load();
    } catch (e) {
      onAuthError(e);
      setError(e instanceof ApiError ? e.message : 'Action failed');
    } finally {
      setBusy(null);
    }
  };

  if (!d) return <div className="text-sm text-text-muted">{error || 'Loading order…'}</div>;
  const o = d.order;
  const next = NEXT[o.status] ?? [];

  return (
    <div className="space-y-6">
      <button
        type="button"
        onClick={() => nav('/admin/orders')}
        className="inline-flex items-center gap-1.5 font-label-caps text-label-caps uppercase text-text-muted hover:text-on-surface"
      >
        <ArrowLeft size={15} className="text-primary-container" /> Orders
      </button>

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold font-mono text-on-surface">{o.id}</h1>
          <p className="text-sm text-text-muted mt-1">
            Placed {fmtDate(o.created_at)} · {METHOD_LABEL[o.payment_method]}
          </p>
        </div>
        <div className="flex gap-2">
          <Pill value={o.status} />
          <Pill
            value={o.payment_status}
            label={o.payment_status === 'unpaid' && o.payment_method === 'cod' ? 'COD · unpaid' : undefined}
          />
        </div>
      </div>

      {error && (
        <div
          className="rounded-xl bg-error-container/30 border border-error/40 text-error text-sm px-4 py-3"
          role="alert"
        >
          {error}
        </div>
      )}
      {flash && (
        <div className="rounded-xl bg-secondary/15 border border-secondary/30 text-secondary text-sm px-4 py-3">
          {flash}
        </div>
      )}

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card title="Consignment Items">
            <div className="divide-y divide-surface-border -my-3">
              {d.items.map((i) => (
                <div key={i.id} className="flex items-center gap-4 py-3">
                  <img
                    src={i.image}
                    alt=""
                    className="w-12 h-14 object-cover rounded bg-surface-container-lowest border border-surface-border"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold text-on-surface truncate">{i.product_name}</div>
                    <div className="text-xs text-text-muted">
                      Size {i.size} · Qty {i.quantity}
                      {(i.custom_name || i.custom_number) && (
                        <>
                          {' '}
                          · Print: <b className="text-secondary">{i.custom_name} {i.custom_number}</b> ({i.custom_font})
                        </>
                      )}
                    </div>
                  </div>
                  <div className="text-sm tabular-nums text-text-muted">
                    {taka(i.unit_price)} × {i.quantity}
                  </div>
                  <div className="w-20 text-right text-sm font-semibold tabular-nums text-on-surface">
                    {taka(i.unit_price * i.quantity)}
                  </div>
                </div>
              ))}
            </div>
            <div className="border-t border-surface-border mt-3 pt-4 space-y-1.5 text-sm">
              <Row k="Subtotal" v={taka(o.subtotal)} />
              <Row k="Shipping" v={o.shipping_fee ? taka(o.shipping_fee) : 'Free'} />
              {o.cod_fee > 0 && <Row k="COD handling" v={taka(o.cod_fee)} />}
              <div className="flex justify-between font-bold text-base pt-2 text-on-surface">
                <span>Total</span>
                <span className="tabular-nums text-secondary">{taka(o.total)}</span>
              </div>
            </div>
          </Card>

          <Card title="Payment Attempts">
            {d.payments.length === 0 && (
              <p className="text-sm text-text-muted">
                {o.payment_method === 'cod' ? 'Cash on Delivery — collected by the rider.' : 'No attempts yet.'}
              </p>
            )}
            <div className="space-y-3">
              {d.payments.map((p) => (
                <div key={p.id} className="rounded-xl border border-surface-border bg-surface-charcoal-elevated p-4">
                  <div className="flex flex-wrap items-center gap-3 justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-sm text-on-surface">
                        {METHOD_LABEL[p.provider] ?? p.provider}
                      </span>
                      <Pill value={p.status} />
                      <span className="text-xs text-text-muted">{fmtDate(p.created_at)}</span>
                    </div>
                    {p.status !== 'completed' && o.payment_status !== 'paid' && (
                      <Btn
                        tone="ghost"
                        className="h-8 text-xs"
                        disabled={busy !== null}
                        onClick={() =>
                          act(
                            `recheck-${p.id}`,
                            async () => {
                              const r = await adminApi.recheckPayment(p.id);
                              if (!r.completed) {
                                throw new ApiError('Gateway reports this payment is not completed', 200);
                              }
                            },
                            'Payment confirmed by gateway'
                          )
                        }
                      >
                        {busy === `recheck-${p.id}` ? (
                          <Loader2 size={14} className="animate-spin" />
                        ) : (
                          <RefreshCw size={14} />
                        )}{' '}
                        Re-check with gateway
                      </Btn>
                    )}
                  </div>
                  <dl className="grid sm:grid-cols-3 gap-x-4 gap-y-1 mt-3 text-xs">
                    <div>
                      <dt className="text-text-muted">Reference</dt>
                      <dd className="font-mono break-all text-on-surface">{p.provider_ref}</dd>
                    </div>
                    <div>
                      <dt className="text-text-muted">Transaction ID</dt>
                      <dd className="font-mono break-all text-on-surface">{p.trx_id ?? '—'}</dd>
                    </div>
                    <div>
                      <dt className="text-text-muted">Amount</dt>
                      <dd className="tabular-nums text-secondary font-semibold">{taka(p.amount)}</dd>
                    </div>
                  </dl>
                  <details className="mt-3">
                    <summary className="text-xs text-text-muted cursor-pointer select-none">
                      Raw gateway response
                    </summary>
                    <pre className="mt-2 text-[11px] bg-surface-container-lowest border border-surface-border rounded p-3 overflow-x-auto max-h-60 text-on-surface">
                      {JSON.stringify(p.raw, null, 2)}
                    </pre>
                  </details>
                </div>
              ))}
            </div>
          </Card>

          <Card title="Consignment Timeline">
            <ol className="space-y-3">
              {d.events
                .slice()
                .reverse()
                .map((e) => (
                  <li key={e.id} className="flex gap-3 text-sm">
                    <span className="mt-1.5 w-2 h-2 rounded-full bg-primary-container shrink-0" />
                    <div className="flex-1">
                      <div className="text-on-surface">{e.message}</div>
                      <div className="text-xs text-text-muted">
                        {fmtDate(e.created_at)} · {e.actor}
                      </div>
                    </div>
                  </li>
                ))}
            </ol>
          </Card>
        </div>

        <div className="space-y-6">
          <Card title="Update Status">
            {next.length === 0 ? (
              <p className="text-sm text-text-muted">
                This order is {STATUS_LABEL[o.status].toLowerCase()} — no further changes.
              </p>
            ) : (
              <div className="space-y-3">
                <input
                  className={inputCls}
                  placeholder="Note for timeline (optional, e.g. courier & tracking no.)"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  maxLength={200}
                />
                <div className="flex flex-wrap gap-2">
                  {next.map((s) => (
                    <Btn
                      key={s}
                      tone={s === 'cancelled' ? 'danger' : 'primary'}
                      disabled={busy !== null}
                      onClick={() => {
                        if (
                          s === 'cancelled' &&
                          !confirm(
                            `Cancel ${o.id}? Reserved stock will be released.${
                              o.payment_status === 'paid'
                                ? ' The customer has paid — refund from the gateway merchant panel.'
                                : ''
                            }`
                          )
                        )
                          return;
                        act(
                          s,
                          () => adminApi.updateOrder(o.id, { status: s, note: note.trim() || undefined }),
                          `Marked as ${STATUS_LABEL[s].toLowerCase()}`
                        ).then(() => setNote(''));
                      }}
                    >
                      {busy === s && <Loader2 size={14} className="animate-spin" />}
                      {s === 'cancelled' ? 'Cancel order' : `Mark ${STATUS_LABEL[s].toLowerCase()}`}
                    </Btn>
                  ))}
                </div>
                {o.status === 'pending_payment' && (
                  <p className="text-xs text-text-muted">Online orders can be fulfilled once payment is confirmed.</p>
                )}
              </div>
            )}
          </Card>

          <Card title="Customer">
            <div className="text-sm space-y-1">
              <div className="font-semibold text-on-surface">{o.customer_name}</div>
              <a
                href={`tel:${o.customer_phone}`}
                className="inline-flex items-center gap-1.5 text-secondary hover:underline"
              >
                <Phone size={14} /> {o.customer_phone}
              </a>
              {o.customer_email && <div className="text-text-muted">{o.customer_email}</div>}
              <div className="pt-2 text-on-surface">{o.address}</div>
              <div className="text-text-muted">{o.district}</div>
              {o.note && (
                <div className="mt-3 rounded-lg bg-secondary/15 border border-secondary/30 text-secondary text-xs p-3">
                  “{o.note}”
                </div>
              )}
            </div>
          </Card>

          <Card title="Internal Note">
            <textarea
              className={`${textareaCls} h-24`}
              value={adminNote}
              onChange={(e) => setAdminNote(e.target.value)}
              placeholder="Only visible to admins"
              maxLength={1000}
            />
            <Btn
              tone="ghost"
              className="mt-3"
              disabled={busy !== null || adminNote === (o.admin_note ?? '')}
              onClick={() => act('note', () => adminApi.updateOrder(o.id, { adminNote }), 'Note saved')}
            >
              Save note
            </Btn>
          </Card>
        </div>
      </div>
    </div>
  );
};

const Row: React.FC<{ k: string; v: string }> = ({ k, v }) => (
  <div className="flex justify-between text-text-muted">
    <span>{k}</span>
    <span className="tabular-nums text-on-surface">{v}</span>
  </div>
);
