/**
 * Order lifecycle: creation (with atomic stock reservation), payment attempts,
 * payment confirmation, failure, cancellation and expiry. All state transitions live here
 * so HTTP handlers, gateway callbacks, the admin panel and the cron share one set of rules.
 */
import type { Env } from '../env';
import { computeTotals, isCustomized, unitPrice, type PaymentMethod, type OrderStatus } from '../../shared/pricing';
import { newOrderId, randomCode, randomToken } from './ids';
import { badRequest, conflict, notFound } from './http';
import { startPayment, type Provider } from '../payments';

export interface OrderRow {
  id: string;
  access_token: string;
  status: OrderStatus;
  payment_method: PaymentMethod;
  payment_status: string;
  customer_name: string;
  customer_phone: string;
  customer_email: string | null;
  district: string;
  address: string;
  note: string | null;
  subtotal: number;
  shipping_fee: number;
  cod_fee: number;
  total: number;
  stock_committed: number;
  admin_note: string | null;
  created_at: string;
  updated_at: string;
}

export interface PaymentRow {
  id: number;
  order_id: string;
  provider: string;
  provider_ref: string | null;
  trx_id: string | null;
  amount: number;
  status: string;
  raw: string | null;
  created_at: string;
}

export interface NewOrderInput {
  items: { productId: string; size: string; quantity: number; customization?: { name: string; number: string; font: string } }[];
  customer: { name: string; phone: string; email?: string; district: string; address: string; note?: string };
  paymentMethod: PaymentMethod;
}

export const event = (db: D1Database, orderId: string, message: string, actor = 'system') =>
  db.prepare('INSERT INTO order_events (order_id, message, actor) VALUES (?, ?, ?)').bind(orderId, message, actor);

export async function getOrder(db: D1Database, id: string) {
  return db.prepare('SELECT * FROM orders WHERE id = ?').bind(id).first<OrderRow>();
}

export async function getOrderDetail(db: D1Database, id: string) {
  const order = await getOrder(db, id);
  if (!order) return null;
  const [items, payments, events] = await db.batch([
    db.prepare('SELECT * FROM order_items WHERE order_id = ? ORDER BY id').bind(id),
    db.prepare('SELECT * FROM payments WHERE order_id = ? ORDER BY id').bind(id),
    db.prepare('SELECT * FROM order_events WHERE order_id = ? ORDER BY id').bind(id),
  ]);
  return { order, items: items.results as any[], payments: payments.results as PaymentRow[], events: events.results as any[] };
}

/** Validates the cart against the live catalogue, prices it server-side and reserves stock atomically. */
export async function createOrder(db: D1Database, input: NewOrderInput): Promise<OrderRow> {
  const ids = [...new Set(input.items.map((i) => i.productId))];
  const { results: products } = await db
    .prepare(`SELECT * FROM products WHERE is_active = 1 AND id IN (${ids.map(() => '?').join(',')})`)
    .bind(...ids)
    .all<any>();
  const byId = new Map(products.map((p) => [p.id, p]));

  const lines = input.items.map((item) => {
    const p = byId.get(item.productId);
    if (!p) throw badRequest(`A product in your bag is no longer available`);
    const customized = isCustomized(item.customization);
    return { item, product: p, unitPrice: unitPrice(p.price, customized), quantity: item.quantity, customized };
  });

  // Aggregate quantity per product (same jersey in two sizes draws from one stock pool).
  const qtyByProduct = new Map<string, number>();
  for (const l of lines) qtyByProduct.set(l.product.id, (qtyByProduct.get(l.product.id) ?? 0) + l.quantity);
  for (const [pid, qty] of qtyByProduct) {
    const p = byId.get(pid);
    if (!p.is_preorder && p.stock < qty) {
      throw conflict(p.stock === 0 ? `${p.name} is sold out` : `Only ${p.stock} left of ${p.name}`);
    }
  }

  const totals = computeTotals(lines, input.paymentMethod);
  const id = newOrderId();
  const status: OrderStatus = input.paymentMethod === 'cod' ? 'confirmed' : 'pending_payment';
  const c = input.customer;

  const statements = [
    db
      .prepare(
        `INSERT INTO orders (id, access_token, status, payment_method, payment_status, customer_name, customer_phone,
          customer_email, district, address, note, subtotal, shipping_fee, cod_fee, total, stock_committed)
         VALUES (?, ?, ?, ?, 'unpaid', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)`,
      )
      .bind(id, randomToken(), status, input.paymentMethod, c.name, c.phone, c.email || null, c.district, c.address,
        c.note || null, totals.subtotal, totals.shippingFee, totals.codFee, totals.total),
    ...lines.map((l) =>
      db
        .prepare(
          `INSERT INTO order_items (order_id, product_id, product_name, image, size, quantity, unit_price, custom_name, custom_number, custom_font)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        )
        .bind(id, l.product.id, l.product.name, l.product.image, l.item.size, l.quantity, l.unitPrice,
          l.customized ? l.item.customization!.name || null : null,
          l.customized ? l.item.customization!.number || null : null,
          l.customized ? l.item.customization!.font || null : null),
    ),
    // CHECK (stock >= 0) makes the whole batch roll back if a concurrent order took the last unit.
    ...[...qtyByProduct].map(([pid, qty]) =>
      db.prepare('UPDATE products SET stock = stock - ?, updated_at = datetime(\'now\') WHERE id = ? AND is_preorder = 0').bind(qty, pid),
    ),
    event(db, id, input.paymentMethod === 'cod' ? 'Order placed — Cash on Delivery' : `Order placed — awaiting ${label(input.paymentMethod)} payment`, 'customer'),
  ];

  try {
    await db.batch(statements);
  } catch (err: any) {
    if (String(err?.message).includes('CHECK constraint')) throw conflict('Some items just sold out. Please review your bag.');
    throw err;
  }
  return (await getOrder(db, id))!;
}

export const label = (m: string) => ({ bkash: 'bKash', sslcommerz: 'SSLCommerz', cod: 'Cash on Delivery', mock: 'Simulator' } as Record<string, string>)[m] ?? m;

/** Starts a gateway session for an unpaid online order and records the attempt. */
export async function beginPayment(env: Env, order: OrderRow, origin: string): Promise<string> {
  if (order.payment_method === 'cod') throw badRequest('Cash on Delivery orders do not need online payment');
  if (order.payment_status === 'paid') throw conflict('This order is already paid');
  if (order.status !== 'pending_payment') throw conflict('This order can no longer be paid online');

  const db = env.DB;
  const { results: items } = await db.prepare('SELECT product_name, quantity FROM order_items WHERE order_id = ?').bind(order.id).all<any>();
  const attemptRef = `${order.id}-${randomCode(4)}`;
  const provider = order.payment_method as Provider;

  const r = await startPayment(env, provider, {
    orderId: order.id,
    attemptRef,
    amount: order.total,
    origin,
    customer: { name: order.customer_name, email: order.customer_email, phone: order.customer_phone, address: order.address, district: order.district },
    productName: items.map((i) => `${i.product_name} x${i.quantity}`).join(', '),
    itemCount: items.reduce((s, i) => s + i.quantity, 0),
  });

  await db.batch([
    db
      .prepare(`INSERT INTO payments (order_id, provider, provider_ref, amount, status, raw) VALUES (?, ?, ?, ?, 'initiated', ?)`)
      .bind(order.id, provider, r.providerRef, order.total, JSON.stringify(r.raw)),
    db.prepare(`UPDATE orders SET payment_status = 'unpaid', updated_at = datetime('now') WHERE id = ?`).bind(order.id),
    event(db, order.id, `${label(provider)} payment started`, 'customer'),
  ]);
  return r.redirectUrl;
}

export async function findPayment(db: D1Database, provider: string, ref: string) {
  return db.prepare('SELECT * FROM payments WHERE provider = ? AND provider_ref = ?').bind(provider, ref).first<PaymentRow>();
}

/**
 * Idempotent: gateway redirect and IPN can arrive in any order or twice.
 * Refuses to mark paid if the gateway-reported amount doesn't match what we charged.
 */
export async function markPaid(db: D1Database, payment: PaymentRow, v: { amount?: number; trxId?: string; raw: unknown }, actor = 'gateway') {
  const order = await getOrder(db, payment.order_id);
  if (!order) throw notFound('Order not found');
  if (order.payment_status === 'paid') return { ok: true, already: true };

  if (v.amount !== undefined && Math.round(v.amount) !== order.total) {
    await db.batch([
      db.prepare(`UPDATE payments SET status = 'failed', raw = ?, updated_at = datetime('now') WHERE id = ?`).bind(JSON.stringify(v.raw), payment.id),
      event(db, order.id, `Payment amount mismatch: gateway reported ৳${v.amount}, expected ৳${order.total}. Not marked as paid.`, actor),
    ]);
    return { ok: false, reason: 'amount_mismatch' };
  }

  const statements = [
    db.prepare(`UPDATE payments SET status = 'completed', trx_id = ?, raw = ?, updated_at = datetime('now') WHERE id = ?`)
      .bind(v.trxId ?? null, JSON.stringify(v.raw), payment.id),
    db.prepare(
      `UPDATE orders SET payment_status = 'paid',
         status = CASE WHEN status IN ('pending_payment', 'cancelled') THEN 'confirmed' ELSE status END,
         updated_at = datetime('now') WHERE id = ? AND payment_status != 'paid'`,
    ).bind(order.id),
    event(db, order.id, `Payment received via ${label(payment.provider)}${v.trxId ? ` (TrxID ${v.trxId})` : ''}`, actor),
  ];
  // Late payment for an order the cron already expired: take the stock again (may go to 0, never negative).
  if (!order.stock_committed) statements.push(...(await reserveStatements(db, order.id)));
  await db.batch(statements);
  return { ok: true };
}

export async function markPaymentFailed(db: D1Database, payment: PaymentRow, status: 'failed' | 'cancelled', raw: unknown, actor = 'gateway') {
  if (payment.status === 'completed' || payment.status === status) return;
  await db.batch([
    db.prepare(`UPDATE payments SET status = ?, raw = ?, updated_at = datetime('now') WHERE id = ? AND status != 'completed'`)
      .bind(status, JSON.stringify(raw), payment.id),
    db.prepare(`UPDATE orders SET payment_status = ?, updated_at = datetime('now') WHERE id = ? AND payment_status != 'paid'`)
      .bind(status, payment.order_id),
    event(db, payment.order_id, `${label(payment.provider)} payment ${status === 'cancelled' ? 'cancelled by customer' : 'failed'}`, actor),
  ]);
}

async function itemQuantities(db: D1Database, orderId: string) {
  const { results } = await db
    .prepare('SELECT product_id, SUM(quantity) AS qty FROM order_items WHERE order_id = ? GROUP BY product_id')
    .bind(orderId)
    .all<{ product_id: string; qty: number }>();
  return results;
}

/** Guarded inside SQL so a payment landing mid-batch can never cause stock to be returned for a live order. */
async function releaseStatements(db: D1Database, orderId: string) {
  const guard = `EXISTS (SELECT 1 FROM orders WHERE id = ? AND status = 'cancelled' AND stock_committed = 1)`;
  return [
    ...(await itemQuantities(db, orderId)).map((r) =>
      db.prepare(`UPDATE products SET stock = stock + ?, updated_at = datetime('now') WHERE id = ? AND is_preorder = 0 AND ${guard}`)
        .bind(r.qty, r.product_id, orderId),
    ),
    db.prepare(`UPDATE orders SET stock_committed = 0 WHERE id = ? AND status = 'cancelled'`).bind(orderId),
  ];
}

async function reserveStatements(db: D1Database, orderId: string) {
  return [
    ...(await itemQuantities(db, orderId)).map((r) =>
      db.prepare(`UPDATE products SET stock = MAX(stock - ?, 0), updated_at = datetime('now') WHERE id = ? AND is_preorder = 0`).bind(r.qty, r.product_id),
    ),
    db.prepare('UPDATE orders SET stock_committed = 1 WHERE id = ?').bind(orderId),
  ];
}

/** Admin status change. Cancelling releases reserved stock; delivering a COD order marks it paid. */
export async function setStatus(db: D1Database, order: OrderRow, next: OrderStatus, actor: string, note?: string) {
  if (order.status === next) return;
  if (order.status === 'cancelled') throw conflict('Cancelled orders cannot be reopened');
  if (next === 'pending_payment') throw badRequest('Cannot move an order back to pending payment');
  if (order.payment_method !== 'cod' && order.payment_status !== 'paid' && next !== 'cancelled') {
    throw conflict('Online orders must be paid before they can be fulfilled');
  }

  const statements: D1PreparedStatement[] = [
    db.prepare(`UPDATE orders SET status = ?, updated_at = datetime('now') WHERE id = ?`).bind(next, order.id),
    event(db, order.id, `Status changed: ${order.status} → ${next}${note ? ` — ${note}` : ''}`, actor),
  ];
  if (next === 'cancelled' && order.stock_committed) statements.push(...(await releaseStatements(db, order.id)));
  if (next === 'cancelled' && order.payment_status === 'paid') {
    statements.push(event(db, order.id, 'Order was paid — issue a refund from the gateway merchant panel', 'system'));
  }
  if (next === 'delivered' && order.payment_method === 'cod' && order.payment_status !== 'paid') {
    statements.push(
      db.prepare(`UPDATE orders SET payment_status = 'paid' WHERE id = ?`).bind(order.id),
      event(db, order.id, 'Cash collected on delivery', actor),
    );
  }
  await db.batch(statements);
}

/** Cron: cancel online orders that were never paid and give their stock back. */
export async function expireStaleOrders(env: Env) {
  const ttl = Number(env.PENDING_ORDER_TTL_MIN ?? 30);
  const { results } = await env.DB
    .prepare(`SELECT * FROM orders WHERE status = 'pending_payment' AND payment_status != 'paid' AND created_at < datetime('now', ?)`)
    .bind(`-${ttl} minutes`)
    .all<OrderRow>();
  for (const order of results) {
    const statements = [
      env.DB.prepare(`UPDATE orders SET status = 'cancelled', updated_at = datetime('now') WHERE id = ? AND payment_status != 'paid'`).bind(order.id),
      event(env.DB, order.id, `Auto-cancelled: unpaid after ${ttl} minutes, stock released`),
    ];
    if (order.stock_committed) statements.push(...(await releaseStatements(env.DB, order.id)));
    await env.DB.batch(statements);
  }
  return results.length;
}
