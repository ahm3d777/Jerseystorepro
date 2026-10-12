# PremiumKits — Football Jersey Store for Bangladesh

A full-stack e-commerce store for authentic football jerseys, built for the Bangladeshi market:
**bKash** and **SSLCommerz** online payments (sandbox), **Cash on Delivery**, server-side order
management, stock control and an **admin panel** — deployed as a single Cloudflare Worker.

| | |
|---|---|
| **Frontend** | React 19, TypeScript, Vite, Tailwind CSS |
| **Backend** | Cloudflare Workers, Hono, Zod |
| **Database** | Cloudflare D1 (SQLite) with versioned migrations |
| **Payments** | bKash Tokenized Checkout · SSLCommerz Hosted Payment (v4) · COD |
| **Quality** | Vitest unit tests, strict TS on the Worker, GitHub Actions CI |

---

## Features

**Storefront**
- Catalogue served from D1 with live stock (`In stock`, `Only 3 left`, `Sold out`, `Pre-order`)
- Jersey customisation (name + number, +৳800) priced identically on client and server
- Checkout with Bangladeshi phone validation, all 64 districts, saved delivery details
- Three payment methods: **bKash**, **Card / Mobile Banking via SSLCommerz** (Visa, Mastercard, Nagad, Rocket…), **Cash on Delivery** (+৳50)
- Order page with payment result, delivery tracker, timeline and **retry payment** if a payment failed or was cancelled
- Shareable URLs (`/shop`, `/product/:id`, `/cart`, `/order/:id`) with working back button

**Payments — built the way gateways expect**
- Amounts are **always computed on the server** from the database; the browser never sends a price
- Every success is **re-verified with the gateway** (bKash *execute* → *query* fallback; SSLCommerz Validation API) before an order is marked paid
- Gateway-reported amount must match the order total, otherwise the payment is rejected and logged
- **Idempotent** callbacks — the redirect and SSLCommerz IPN can arrive in any order, any number of times
- Each attempt stored with the raw gateway response for audits and disputes
- **Built-in payment simulator**: any gateway without credentials falls back to a local simulator that calls the same callback endpoints, so the full flow works on a fresh clone

**Inventory**
- Stock is reserved **atomically** when an order is placed (a `CHECK (stock >= 0)` constraint rolls back the whole transaction if someone else bought the last unit)
- A Cron Trigger auto-cancels unpaid online orders after 30 minutes and returns their stock
- Cancelling an order from the admin panel releases its stock

**Admin panel** (`/admin`)
- Dashboard: paid revenue, today's orders, orders to fulfil, average order value, 14-day revenue chart, payment-method split, low-stock alerts
- Orders: filter by status / payment method, search by order ID, name or phone, pagination
- Order detail: items with print customisation, payment attempts with transaction IDs and raw responses, **re-check payment with gateway**, status workflow (Confirmed → Processing → Shipped → Delivered / Cancelled) with timeline notes, internal notes
- Products: add / edit / hide products, inline stock editing
- Secure session: HttpOnly, SameSite=Strict signed JWT cookie, constant-time credential check

---

## Architecture

```
Browser ──► Cloudflare Worker (worker/index.ts)
             ├─ /api/products, /api/orders ......... public API (Hono + Zod)
             ├─ /api/payments/bkash/callback ....... bKash redirect → execute → verify
             ├─ /api/payments/sslcommerz/* ......... success / fail / cancel / IPN → validate
             ├─ /api/payments/mock ................. simulator (only when no credentials)
             ├─ /api/admin/* ....................... JWT-protected admin API
             ├─ scheduled() ........................ releases stock of unpaid orders
             └─ everything else .................... React SPA from Workers Static Assets
                         │
                         ▼
                  Cloudflare D1: products · orders · order_items · payments · order_events
```

```
├── App.tsx, pages/, components/, context/   Storefront (React)
├── admin/                                  Admin panel (lazy-loaded chunk)
├── lib/api.ts                              Typed API client
├── shared/                                 Pricing rules & catalogue constants used by BOTH client and Worker
├── worker/
│   ├── index.ts                            Worker entry: routes, error handling, cron
│   ├── routes/                             public.ts · payments.ts · admin.ts
│   ├── payments/                           bkash.ts · sslcommerz.ts · index.ts (mode selection + simulator)
│   └── lib/                                orders.ts (order state machine) · auth.ts · products.ts
├── migrations/                             D1 schema + seed catalogue
└── tests/                                  Vitest: pricing + gateway clients (mocked HTTP)
```

### Order & payment lifecycle

```
             ┌──────────── COD ────────────► confirmed ─► processing ─► shipped ─► delivered (cash collected → paid)
place order ─┤
             └─ bKash / SSLCommerz ─► pending_payment ──(gateway verified)──► confirmed ─► …
                                          │   ▲
                              failed /    │   │ retry payment
                              cancelled ──┘───┘
                                          │
                                          └─(unpaid 30 min, cron)──► cancelled, stock released
```

---

## Running locally

Requires Node.js 20+.

```bash
npm install
cp .dev.vars.example .dev.vars        # then set JWT_SECRET (openssl rand -hex 32) and an admin password
npm run db:migrate:local              # creates the local D1 database and seeds 12 products
npm run dev                           # Vite on :3000 + Worker on :8787
```

- Store: http://localhost:3000
- Admin: http://localhost:3000/admin (email / password from `.dev.vars`)

With no gateway credentials, checkout uses the **payment simulator** — choose *Simulate successful payment*,
*failed* or *cancel* to exercise every path.

### Using the real sandboxes

**bKash** — get Tokenized Checkout sandbox credentials from the [bKash developer portal](https://developer.bka.sh)
and fill `BKASH_APP_KEY`, `BKASH_APP_SECRET`, `BKASH_USERNAME`, `BKASH_PASSWORD` in `.dev.vars`.
bKash's sandbox provides test wallet numbers with a fixed OTP and PIN (listed in their docs).

**SSLCommerz** — register a free sandbox store at https://developer.sslcommerz.com/registration/ and set
`SSLCZ_STORE_ID` and `SSLCZ_STORE_PASSWD`. Use the test cards and mobile-banking test accounts shown on the
sandbox payment page.

Each gateway switches independently: as soon as its credentials exist, it talks to the real sandbox;
the checkout page shows a **Sandbox** badge. To test the SSLCommerz IPN locally, expose the dev server with a
tunnel (e.g. `cloudflared tunnel --url http://localhost:3000`) and set `APP_URL` to the tunnel URL.

### Tests

```bash
npm test          # unit tests (pricing rules, bKash & SSLCommerz clients with mocked HTTP)
npm run typecheck # storefront + Worker
```

---

## Deploying to Cloudflare

```bash
npx wrangler login
npx wrangler d1 create premiumkits            # copy the database_id into wrangler.jsonc
npm run db:migrate:remote

npx wrangler secret put ADMIN_EMAIL
npx wrangler secret put ADMIN_PASSWORD
npx wrangler secret put JWT_SECRET            # 32+ random characters
# optional, per gateway:
npx wrangler secret put BKASH_APP_KEY         # …and BKASH_APP_SECRET, BKASH_USERNAME, BKASH_PASSWORD
npx wrangler secret put SSLCZ_STORE_ID        # …and SSLCZ_STORE_PASSWD

npm run deploy
```

**Going live:** set `PAYMENT_MODE=live` in `wrangler.jsonc`, point `BKASH_BASE_URL` at bKash's production
URL and replace sandbox credentials with the live ones issued after merchant onboarding.

---

## Configuration

| Variable | Purpose |
|---|---|
| `PAYMENT_MODE` | `sandbox` (default), `live`, or `mock` (force simulator for both gateways) |
| `APP_URL` | Public origin for gateway callback URLs (defaults to the request origin) |
| `BKASH_BASE_URL`, `BKASH_APP_KEY`, `BKASH_APP_SECRET`, `BKASH_USERNAME`, `BKASH_PASSWORD` | bKash Tokenized Checkout |
| `SSLCZ_STORE_ID`, `SSLCZ_STORE_PASSWD` | SSLCommerz store |
| `ADMIN_EMAIL`, `ADMIN_PASSWORD`, `JWT_SECRET` | Admin login |
| `PENDING_ORDER_TTL_MIN` | Minutes an unpaid online order holds stock (default 30) |

## Business rules

| Rule | Value |
|---|---|
| Name & number printing | +৳800 per jersey |
| Delivery | ৳100, free when subtotal is above ৳2,000 |
| Cash on Delivery handling | +৳50 |
| Max quantity per line | 10 |

All defined once in [`shared/pricing.ts`](shared/pricing.ts).

## Roadmap

- SMS order confirmation (e.g. SSL Wireless / BulkSMSBD)
- Courier integration (Pathao / Steadfast / RedX) for tracking numbers
- Refunds through the bKash and SSLCommerz refund APIs from the admin panel
- Customer accounts and order history

## License

MIT
