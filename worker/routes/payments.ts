import { Hono } from 'hono';
import { html } from 'hono/html';
import type { AppEnv } from '../env';
import { findPayment, getOrder, markPaid, markPaymentFailed, label } from '../lib/orders';
import { confirmBkash, confirmSslcz, gatewayMode } from '../payments';
import { notFound } from '../lib/http';

const orderPage = async (db: D1Database, orderId: string, extra = '') => {
  const order = await getOrder(db, orderId);
  return order ? `/order/${order.id}?t=${order.access_token}${extra}` : '/';
};

async function readForm(c: any): Promise<Record<string, string>> {
  const ct = c.req.header('content-type') ?? '';
  if (ct.includes('application/json')) return c.req.json();
  const body = await c.req.parseBody();
  return Object.fromEntries(Object.entries(body).map(([k, v]) => [k, String(v)]));
}

export const paymentRoutes = new Hono<AppEnv>()
  /* ---------------------------------------------------------------- bKash */
  .get('/bkash/callback', async (c) => {
    const paymentID = c.req.query('paymentID') ?? '';
    const status = c.req.query('status');
    const payment = await findPayment(c.env.DB, 'bkash', paymentID);
    if (!payment) return c.redirect('/?payment=unknown', 303);
    if (payment.status === 'completed') return c.redirect(await orderPage(c.env.DB, payment.order_id, '&payment=success'), 303);

    if (status !== 'success') {
      await markPaymentFailed(c.env.DB, payment, status === 'cancel' ? 'cancelled' : 'failed', { callbackStatus: status });
      return c.redirect(await orderPage(c.env.DB, payment.order_id, `&payment=${status === 'cancel' ? 'cancelled' : 'failed'}`), 303);
    }

    try {
      const v = await confirmBkash(c.env, paymentID, payment.amount);
      if (v.completed) {
        const r = await markPaid(c.env.DB, payment, v);
        return c.redirect(await orderPage(c.env.DB, payment.order_id, r.ok ? '&payment=success' : '&payment=failed'), 303);
      }
      await markPaymentFailed(c.env.DB, payment, 'failed', v.raw);
    } catch (err) {
      console.error('bKash execute error', err);
      // Leave the attempt as "initiated" so an admin can re-check it against bKash.
    }
    return c.redirect(await orderPage(c.env.DB, payment.order_id, '&payment=failed'), 303);
  })

  /* ----------------------------------------------------------- SSLCommerz */
  .post('/sslcommerz/success', async (c) => {
    const f = await readForm(c);
    const payment = await findPayment(c.env.DB, 'sslcommerz', f.tran_id ?? '');
    if (!payment) return c.redirect('/?payment=unknown', 303);
    if (payment.status === 'completed') return c.redirect(await orderPage(c.env.DB, payment.order_id, '&payment=success'), 303);
    try {
      const v = await confirmSslcz(c.env, f.val_id ?? '', payment.provider_ref!, payment.amount);
      if (v.completed) {
        const r = await markPaid(c.env.DB, payment, v);
        return c.redirect(await orderPage(c.env.DB, payment.order_id, r.ok ? '&payment=success' : '&payment=failed'), 303);
      }
      await markPaymentFailed(c.env.DB, payment, 'failed', v.raw);
    } catch (err) {
      console.error('SSLCommerz validation error', err);
    }
    return c.redirect(await orderPage(c.env.DB, payment.order_id, '&payment=failed'), 303);
  })

  .post('/sslcommerz/fail', async (c) => {
    const f = await readForm(c);
    const payment = await findPayment(c.env.DB, 'sslcommerz', f.tran_id ?? '');
    if (!payment) return c.redirect('/?payment=unknown', 303);
    await markPaymentFailed(c.env.DB, payment, 'failed', f);
    return c.redirect(await orderPage(c.env.DB, payment.order_id, '&payment=failed'), 303);
  })

  .post('/sslcommerz/cancel', async (c) => {
    const f = await readForm(c);
    const payment = await findPayment(c.env.DB, 'sslcommerz', f.tran_id ?? '');
    if (!payment) return c.redirect('/?payment=unknown', 303);
    await markPaymentFailed(c.env.DB, payment, 'cancelled', f);
    return c.redirect(await orderPage(c.env.DB, payment.order_id, '&payment=cancelled'), 303);
  })

  /** Server-to-server Instant Payment Notification — the safety net if the customer closes the tab. */
  .post('/sslcommerz/ipn', async (c) => {
    const f = await readForm(c);
    const payment = await findPayment(c.env.DB, 'sslcommerz', f.tran_id ?? '');
    if (!payment) return c.text('unknown tran_id', 404);
    if (f.status !== 'VALID' || !f.val_id) {
      await markPaymentFailed(c.env.DB, payment, f.status === 'CANCELLED' ? 'cancelled' : 'failed', f);
      return c.text('recorded');
    }
    const v = await confirmSslcz(c.env, f.val_id, payment.provider_ref!, payment.amount);
    if (!v.completed) return c.text('invalid', 400);
    const r = await markPaid(c.env.DB, payment, v, 'gateway (IPN)');
    return c.text(r.ok ? 'ok' : 'amount mismatch', r.ok ? 200 : 400);
  })

  /* ------------------------------------------------- Built-in simulator */
  .get('/mock', async (c) => {
    const provider = c.req.query('provider') as 'bkash' | 'sslcommerz';
    const ref = c.req.query('ref') ?? '';
    if (!['bkash', 'sslcommerz'].includes(provider) || gatewayMode(c.env, provider) !== 'mock') throw notFound();
    const payment = await findPayment(c.env.DB, provider, ref);
    if (!payment || payment.status !== 'initiated') throw notFound('Payment session expired');

    const isBkash = provider === 'bkash';
    const cb = (s: string) => `/api/payments/bkash/callback?paymentID=${encodeURIComponent(ref)}&status=${s}`;
    const accent = isBkash ? '#E2136E' : '#1C64F2';

    const button = (text: string, kind: 'success' | 'fail' | 'cancel', primary = false) =>
      isBkash
        ? html`<a class="btn ${primary ? 'primary' : ''}" href="${cb(kind === 'fail' ? 'failure' : kind)}">${text}</a>`
        : html`<form method="post" action="/api/payments/sslcommerz/${kind}">
            <input type="hidden" name="tran_id" value="${ref}" />
            <input type="hidden" name="val_id" value="${kind === 'success' ? `MOCKVAL-${ref}` : ''}" />
            <input type="hidden" name="status" value="${kind === 'success' ? 'VALID' : kind === 'fail' ? 'FAILED' : 'CANCELLED'}" />
            <button class="btn ${primary ? 'primary' : ''}">${text}</button>
          </form>`;

    return c.html(html`<!doctype html>
      <html lang="en"><head><meta charset="utf-8" /><meta name="viewport" content="width=device-width,initial-scale=1" />
      <title>Payment simulator</title>
      <style>
        *{box-sizing:border-box}body{margin:0;min-height:100vh;display:grid;place-items:center;background:#0f172a;font-family:system-ui,sans-serif;color:#0f172a;padding:16px}
        .card{background:#fff;border-radius:16px;max-width:380px;width:100%;overflow:hidden;box-shadow:0 30px 60px rgba(0,0,0,.4)}
        .head{background:${accent};color:#fff;padding:20px 24px}.head small{opacity:.8;letter-spacing:.12em;text-transform:uppercase;font-size:11px}
        .head h1{margin:6px 0 0;font-size:20px}.body{padding:24px}.row{display:flex;justify-content:space-between;font-size:14px;margin-bottom:10px;color:#475569}
        .amt{font-size:32px;font-weight:800;margin:8px 0 20px;color:#0f172a}.btn{display:block;width:100%;text-align:center;padding:14px;border-radius:10px;border:1px solid #e2e8f0;background:#fff;font-weight:700;font-size:14px;color:#0f172a;text-decoration:none;cursor:pointer;margin-top:10px}
        .btn.primary{background:${accent};border-color:${accent};color:#fff}.note{font-size:12px;color:#64748b;background:#f8fafc;border-radius:8px;padding:10px 12px;margin-top:18px;line-height:1.5}
      </style></head>
      <body><div class="card">
        <div class="head"><small>Sandbox simulator</small><h1>${label(provider)} test payment</h1></div>
        <div class="body">
          <div class="row"><span>Order</span><b>${payment.order_id}</b></div>
          <div class="row"><span>Reference</span><span>${ref}</span></div>
          <div class="amt">৳${payment.amount.toLocaleString('en-US')}</div>
          ${button('Simulate successful payment', 'success', true)}
          ${button('Simulate failed payment', 'fail')}
          ${button('Cancel payment', 'cancel')}
          <div class="note">No real ${label(provider)} credentials are configured, so this simulator stands in for the gateway.
          It calls the same callback endpoints the real sandbox does. Add credentials to <code>.dev.vars</code> to use the real ${label(provider)} sandbox.</div>
        </div></div></body></html>`);
  });
