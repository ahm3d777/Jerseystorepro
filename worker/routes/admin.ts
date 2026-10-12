import { Hono } from 'hono';
import { z } from 'zod';
import type { AppEnv } from '../env';
import { login, logout, requireAdmin } from '../lib/auth';
import { badRequest, notFound } from '../lib/http';
import { getOrder, getOrderDetail, setStatus, event, markPaid, type PaymentRow } from '../lib/orders';
import { toProduct, LOW_STOCK_THRESHOLD } from '../lib/products';
import { recheckBkash, recheckSslcz } from '../payments';
import { ORDER_STATUSES } from '../../shared/pricing';
import { LEAGUES, JERSEY_TYPES } from '../../shared/catalog';

const productSchema = z.object({
  id: z.string().trim().regex(/^[a-z0-9-]{1,40}$/i, 'ID: letters, numbers and dashes only').optional(),
  name: z.string().trim().min(3).max(120),
  price: z.number().int().min(0).max(1_000_000),
  originalPrice: z.number().int().min(0).max(1_000_000).nullable().optional(),
  image: z.string().url(),
  gallery: z.array(z.string().url()).max(8).default([]),
  category: z.enum(['Club', 'National']),
  team: z.string().trim().min(2).max(60),
  league: z.enum(LEAGUES as [string, ...string[]]),
  type: z.enum(JERSEY_TYPES as [string, ...string[]]),
  isPlayerEdition: z.boolean().default(false),
  isPreorder: z.boolean().default(false),
  isActive: z.boolean().default(true),
  stock: z.number().int().min(0).max(100_000),
  description: z.string().trim().max(2000).default(''),
  season: z.string().trim().max(20).optional().nullable(),
  color: z.string().trim().regex(/^[0-9a-f]{6}$/i, 'Color must be a 6-digit hex without #').optional().nullable(),
});

const parse = <S extends z.ZodTypeAny>(schema: S, data: unknown): z.output<S> => {
  const r = schema.safeParse(data);
  if (!r.success) throw badRequest(`${r.error.issues[0].path.join('.')}: ${r.error.issues[0].message}`);
  return r.data;
};

const protectedRoutes = new Hono<AppEnv>()
  .use('*', requireAdmin)

  .get('/me', (c) => c.json({ email: c.get('admin') }))

  .get('/stats', async (c) => {
    const db = c.env.DB;
    const [totals, today, byStatus, byMethod, daily, lowStock, recent] = await db.batch([
      db.prepare(`SELECT COUNT(*) AS orders, COALESCE(SUM(CASE WHEN payment_status='paid' THEN total END),0) AS revenue,
                    COALESCE(AVG(CASE WHEN status!='cancelled' THEN total END),0) AS aov FROM orders`),
      db.prepare(`SELECT COUNT(*) AS orders, COALESCE(SUM(CASE WHEN payment_status='paid' THEN total END),0) AS revenue
                  FROM orders WHERE date(created_at, '+6 hours') = date('now', '+6 hours')`),
      db.prepare(`SELECT status, COUNT(*) AS n FROM orders GROUP BY status`),
      db.prepare(`SELECT payment_method AS method, COUNT(*) AS n, COALESCE(SUM(CASE WHEN payment_status='paid' THEN total END),0) AS revenue
                  FROM orders WHERE status != 'cancelled' GROUP BY payment_method`),
      db.prepare(`SELECT date(created_at, '+6 hours') AS day, COUNT(*) AS orders,
                    COALESCE(SUM(CASE WHEN payment_status='paid' THEN total END),0) AS revenue
                  FROM orders WHERE created_at >= datetime('now', '-14 days') GROUP BY day ORDER BY day`),
      db.prepare(`SELECT id, name, stock, image FROM products WHERE is_active=1 AND is_preorder=0 AND stock <= ? ORDER BY stock`).bind(LOW_STOCK_THRESHOLD),
      db.prepare(`SELECT id, customer_name, total, status, payment_method, payment_status, created_at FROM orders ORDER BY created_at DESC LIMIT 6`),
    ]);
    return c.json({
      totals: totals.results[0],
      today: today.results[0],
      byStatus: Object.fromEntries((byStatus.results as any[]).map((r) => [r.status, r.n])),
      byMethod: byMethod.results,
      daily: daily.results,
      lowStock: lowStock.results,
      recent: recent.results,
    });
  })

  .get('/orders', async (c) => {
    const status = c.req.query('status');
    const method = c.req.query('method');
    const q = c.req.query('q')?.trim();
    const page = Math.max(1, Number(c.req.query('page') ?? 1));
    const pageSize = 20;

    const where: string[] = [];
    const args: unknown[] = [];
    if (status && (ORDER_STATUSES as readonly string[]).includes(status)) { where.push('status = ?'); args.push(status); }
    if (method) { where.push('payment_method = ?'); args.push(method); }
    if (q) {
      where.push('(id LIKE ? OR customer_name LIKE ? OR customer_phone LIKE ?)');
      args.push(`%${q}%`, `%${q}%`, `%${q}%`);
    }
    const clause = where.length ? `WHERE ${where.join(' AND ')}` : '';
    const [rows, count] = await c.env.DB.batch([
      c.env.DB.prepare(
        `SELECT o.id, o.customer_name, o.customer_phone, o.district, o.total, o.status, o.payment_method, o.payment_status, o.created_at,
           (SELECT SUM(quantity) FROM order_items WHERE order_id = o.id) AS items
         FROM orders o ${clause} ORDER BY o.created_at DESC LIMIT ? OFFSET ?`,
      ).bind(...args, pageSize, (page - 1) * pageSize),
      c.env.DB.prepare(`SELECT COUNT(*) AS n FROM orders ${clause}`).bind(...args),
    ]);
    return c.json({ orders: rows.results, total: (count.results[0] as any).n, page, pageSize });
  })

  .get('/orders/:id', async (c) => {
    const d = await getOrderDetail(c.env.DB, c.req.param('id'));
    if (!d) throw notFound('Order not found');
    return c.json({ ...d, payments: d.payments.map((p) => ({ ...p, raw: p.raw ? JSON.parse(p.raw) : null })) });
  })

  .patch('/orders/:id', async (c) => {
    const body = parse(
      z.object({ status: z.enum(ORDER_STATUSES).optional(), adminNote: z.string().max(1000).optional(), note: z.string().max(200).optional() }),
      await c.req.json(),
    );
    const order = await getOrder(c.env.DB, c.req.param('id'));
    if (!order) throw notFound('Order not found');
    if (body.status) await setStatus(c.env.DB, order, body.status, `admin:${c.get('admin')}`, body.note);
    if (body.adminNote !== undefined) {
      await c.env.DB.prepare(`UPDATE orders SET admin_note = ?, updated_at = datetime('now') WHERE id = ?`).bind(body.adminNote, order.id).run();
    }
    return c.json({ ok: true });
  })

  /** Ask the gateway for the truth about an attempt (e.g. customer closed the tab before the redirect). */
  .post('/payments/:id/recheck', async (c) => {
    const p = await c.env.DB.prepare('SELECT * FROM payments WHERE id = ?').bind(Number(c.req.param('id'))).first<PaymentRow>();
    if (!p || !p.provider_ref) throw notFound('Payment not found');
    const v = p.provider === 'bkash' ? await recheckBkash(c.env, p.provider_ref) : await recheckSslcz(c.env, p.provider_ref);
    if (v.completed) {
      const r = await markPaid(c.env.DB, p, v, `admin:${c.get('admin')}`);
      return c.json({ completed: true, ...r });
    }
    await event(c.env.DB, p.order_id, `Payment re-checked with gateway: not completed`, `admin:${c.get('admin')}`).run();
    return c.json({ completed: false, raw: v.raw });
  })

  .get('/products', async (c) => {
    const { results } = await c.env.DB.prepare('SELECT * FROM products ORDER BY is_active DESC, CAST(id AS INTEGER), id').all();
    return c.json(results.map(toProduct));
  })

  .post('/products', async (c) => {
    const p = parse(productSchema, await c.req.json());
    const id = p.id || crypto.randomUUID().slice(0, 8);
    const exists = await c.env.DB.prepare('SELECT 1 FROM products WHERE id = ?').bind(id).first();
    if (exists) throw badRequest(`Product ID "${id}" already exists`);
    await c.env.DB.prepare(
      `INSERT INTO products (id, name, price, original_price, image, gallery, category, team, league, type,
         is_player_edition, is_preorder, is_active, stock, description, season, color)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    ).bind(id, p.name, p.price, p.originalPrice ?? null, p.image, JSON.stringify(p.gallery.length ? p.gallery : [p.image]),
      p.category, p.team, p.league, p.type, +p.isPlayerEdition, +p.isPreorder, +p.isActive, p.stock, p.description,
      p.season ?? null, p.color?.toUpperCase() ?? null).run();
    return c.json(toProduct(await c.env.DB.prepare('SELECT * FROM products WHERE id = ?').bind(id).first()), 201);
  })

  .put('/products/:id', async (c) => {
    const id = c.req.param('id');
    const p = parse(productSchema, await c.req.json());
    const r = await c.env.DB.prepare(
      `UPDATE products SET name=?, price=?, original_price=?, image=?, gallery=?, category=?, team=?, league=?, type=?,
         is_player_edition=?, is_preorder=?, is_active=?, stock=?, description=?, season=?, color=?, updated_at=datetime('now')
       WHERE id = ?`,
    ).bind(p.name, p.price, p.originalPrice ?? null, p.image, JSON.stringify(p.gallery.length ? p.gallery : [p.image]),
      p.category, p.team, p.league, p.type, +p.isPlayerEdition, +p.isPreorder, +p.isActive, p.stock, p.description,
      p.season ?? null, p.color?.toUpperCase() ?? null, id).run();
    if (!r.meta.changes) throw notFound('Product not found');
    return c.json(toProduct(await c.env.DB.prepare('SELECT * FROM products WHERE id = ?').bind(id).first()));
  })

  /** Soft delete: past orders keep referencing the product. */
  .delete('/products/:id', async (c) => {
    const r = await c.env.DB.prepare(`UPDATE products SET is_active = 0, updated_at = datetime('now') WHERE id = ?`).bind(c.req.param('id')).run();
    if (!r.meta.changes) throw notFound('Product not found');
    return c.json({ ok: true });
  });

export const adminRoutes = new Hono<AppEnv>()
  .post('/login', async (c) => {
    const body = parse(z.object({ email: z.string().max(200), password: z.string().max(200) }), await c.req.json().catch(() => ({})));
    return c.json(await login(c, body.email, body.password));
  })
  .post('/logout', (c) => {
    logout(c);
    return c.json({ ok: true });
  })
  .route('/', protectedRoutes);
