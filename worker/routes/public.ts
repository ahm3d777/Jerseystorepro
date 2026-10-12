import { Hono } from 'hono';
import { z } from 'zod';
import type { AppEnv } from '../env';
import { toProduct } from '../lib/products';
import { badRequest, notFound, GatewayError } from '../lib/http';
import { beginPayment, createOrder, getOrder, getOrderDetail, event } from '../lib/orders';
import { gatewayMode } from '../payments';
import { BD_DISTRICTS, MAX_QTY_PER_LINE, normalizeBdPhone, PAYMENT_METHODS } from '../../shared/pricing';
import { AVAILABLE_SIZES, FONT_STYLES } from '../../shared/catalog';

export const origin = (c: { env: AppEnv['Bindings']; req: { url: string } }) =>
  (c.env.APP_URL || new URL(c.req.url).origin).replace(/\/$/, '');

const orderSchema = z.object({
  items: z
    .array(
      z.object({
        productId: z.string().min(1).max(64),
        size: z.enum(AVAILABLE_SIZES as [string, ...string[]]),
        quantity: z.number().int().min(1).max(MAX_QTY_PER_LINE),
        customization: z
          .object({
            name: z.string().trim().max(12).regex(/^[A-Za-z .'-]*$/, 'Name can only contain letters'),
            number: z.string().trim().regex(/^\d{0,2}$/, 'Number must be 0–99'),
            font: z.enum(FONT_STYLES as [string, ...string[]]),
          })
          .optional(),
      }),
    )
    .min(1, 'Your bag is empty')
    .max(20),
  customer: z.object({
    name: z.string().trim().min(2, 'Enter your full name').max(80),
    phone: z.string().trim().transform((v, ctx) => {
      const n = normalizeBdPhone(v);
      if (!n) ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Enter a valid Bangladeshi mobile number (01XXXXXXXXX)' });
      return n ?? v;
    }),
    email: z.string().trim().email('Enter a valid email').max(120).optional().or(z.literal('').transform(() => undefined)),
    district: z.enum(BD_DISTRICTS as [string, ...string[]], { errorMap: () => ({ message: 'Choose your district' }) }),
    address: z.string().trim().min(8, 'Enter your full delivery address').max(300),
    note: z.string().trim().max(300).optional(),
  }),
  paymentMethod: z.enum(PAYMENT_METHODS as [string, ...string[]]),
});

export const publicRoutes = new Hono<AppEnv>()
  .get('/config', (c) =>
    c.json({
      payments: { bkash: gatewayMode(c.env, 'bkash'), sslcommerz: gatewayMode(c.env, 'sslcommerz'), cod: 'live' },
    }),
  )

  .get('/products', async (c) => {
    const { results } = await c.env.DB.prepare('SELECT * FROM products WHERE is_active = 1 ORDER BY CAST(id AS INTEGER), id').all();
    c.header('Cache-Control', 'public, max-age=30');
    return c.json(results.map(toProduct));
  })

  .get('/products/:id', async (c) => {
    const row = await c.env.DB.prepare('SELECT * FROM products WHERE id = ? AND is_active = 1').bind(c.req.param('id')).first();
    if (!row) throw notFound('Product not found');
    return c.json(toProduct(row));
  })

  .post('/orders', async (c) => {
    const parsed = orderSchema.safeParse(await c.req.json().catch(() => null));
    if (!parsed.success) {
      return c.json({ error: parsed.error.issues[0]?.message ?? 'Invalid order', fields: parsed.error.flatten().fieldErrors }, 400);
    }
    const input = parsed.data as any;
    const order = await createOrder(c.env.DB, input);
    const orderUrl = `/order/${order.id}?t=${order.access_token}`;

    if (order.payment_method === 'cod') return c.json({ orderId: order.id, token: order.access_token, redirectUrl: orderUrl }, 201);

    try {
      const redirectUrl = await beginPayment(c.env, order, origin(c));
      return c.json({ orderId: order.id, token: order.access_token, redirectUrl }, 201);
    } catch (err) {
      // Order exists and holds stock; customer can retry from the order page until it expires.
      console.error('payment init failed', err instanceof GatewayError ? err.detail : err);
      await event(c.env.DB, order.id, `Could not reach payment gateway: ${(err as Error).message}`).run();
      return c.json({ orderId: order.id, token: order.access_token, redirectUrl: `${orderUrl}&payment=error` }, 201);
    }
  })

  .get('/orders/:id', async (c) => {
    const detail = await getOrderDetail(c.env.DB, c.req.param('id'));
    if (!detail || detail.order.access_token !== c.req.query('t')) throw notFound('Order not found');
    const { order, items, payments, events } = detail;
    const paid = payments.find((p) => p.status === 'completed');
    return c.json({
      id: order.id,
      status: order.status,
      paymentMethod: order.payment_method,
      paymentStatus: order.payment_status,
      trxId: paid?.trx_id ?? null,
      customer: { name: order.customer_name, phone: order.customer_phone, email: order.customer_email, district: order.district, address: order.address },
      subtotal: order.subtotal,
      shippingFee: order.shipping_fee,
      codFee: order.cod_fee,
      total: order.total,
      createdAt: order.created_at,
      items: items.map((i) => ({
        name: i.product_name, image: i.image, size: i.size, quantity: i.quantity, unitPrice: i.unit_price,
        customization: i.custom_name || i.custom_number ? { name: i.custom_name, number: i.custom_number, font: i.custom_font } : null,
      })),
      timeline: events.filter((e) => e.actor !== 'admin' || e.message.startsWith('Status')).map((e) => ({ message: e.message, at: e.created_at })),
    });
  })

  /** Retry payment for an unpaid online order. */
  .post('/orders/:id/pay', async (c) => {
    const order = await getOrder(c.env.DB, c.req.param('id'));
    if (!order || order.access_token !== c.req.query('t')) throw notFound('Order not found');
    try {
      return c.json({ redirectUrl: await beginPayment(c.env, order, origin(c)) });
    } catch (err) {
      if (err instanceof GatewayError) {
        console.error('payment retry failed', err.detail);
        throw badRequest(`Payment gateway is not responding (${err.message}). Please try again shortly.`);
      }
      throw err;
    }
  });
