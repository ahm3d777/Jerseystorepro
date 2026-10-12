import { Hono } from 'hono';
import { HTTPException } from 'hono/http-exception';
import { secureHeaders } from 'hono/secure-headers';
import type { AppEnv, Env } from './env';
import { publicRoutes } from './routes/public';
import { paymentRoutes } from './routes/payments';
import { adminRoutes } from './routes/admin';
import { expireStaleOrders } from './lib/orders';

const app = new Hono<AppEnv>();

app.use('/api/*', secureHeaders({ contentSecurityPolicy: undefined, crossOriginResourcePolicy: false }));
app.use('/api/*', async (c, next) => {
  await next();
  if (!c.res.headers.has('Cache-Control')) c.res.headers.set('Cache-Control', 'no-store');
});

app.route('/api', publicRoutes);
app.route('/api/payments', paymentRoutes);
app.route('/api/admin', adminRoutes);

app.get('/api/health', (c) => c.json({ ok: true }));
app.all('/api/*', (c) => c.json({ error: 'Not found' }, 404));

// Everything else is the React SPA (served by Workers Static Assets, SPA fallback in wrangler.jsonc).
app.all('*', (c) => c.env.ASSETS.fetch(c.req.raw));

app.onError((err, c) => {
  if (err instanceof HTTPException) return c.json({ error: err.message }, err.status);
  console.error(err);
  return c.json({ error: 'Something went wrong. Please try again.' }, 500);
});

export default {
  fetch: app.fetch,
  async scheduled(_controller: ScheduledController, env: Env, ctx: ExecutionContext) {
    ctx.waitUntil(expireStaleOrders(env).then((n) => n && console.log(`expired ${n} unpaid orders`)));
  },
} satisfies ExportedHandler<Env>;

export { app };
