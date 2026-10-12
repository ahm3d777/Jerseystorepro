-- Core schema for PremiumKits store (Cloudflare D1 / SQLite)
-- Money is stored as integer BDT (no paisa needed for jersey pricing).

CREATE TABLE products (
  id               TEXT PRIMARY KEY,
  name             TEXT NOT NULL,
  price            INTEGER NOT NULL CHECK (price >= 0),
  original_price   INTEGER,
  image            TEXT NOT NULL,
  gallery          TEXT NOT NULL DEFAULT '[]',   -- JSON array of image URLs
  category         TEXT NOT NULL,
  team             TEXT NOT NULL,
  league           TEXT NOT NULL,
  type             TEXT NOT NULL,
  is_player_edition INTEGER NOT NULL DEFAULT 0,
  is_preorder      INTEGER NOT NULL DEFAULT 0,
  stock            INTEGER NOT NULL DEFAULT 0 CHECK (stock >= 0),
  rating           REAL NOT NULL DEFAULT 0,
  reviews          INTEGER NOT NULL DEFAULT 0,
  description      TEXT NOT NULL DEFAULT '',
  season           TEXT,
  color            TEXT,
  is_active        INTEGER NOT NULL DEFAULT 1,
  created_at       TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at       TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE orders (
  id               TEXT PRIMARY KEY,              -- human friendly, e.g. PK-7F3K9Q
  access_token     TEXT NOT NULL,                 -- lets the customer view their order without an account
  status           TEXT NOT NULL,                 -- pending_payment | confirmed | processing | shipped | delivered | cancelled
  payment_method   TEXT NOT NULL,                 -- bkash | sslcommerz | cod
  payment_status   TEXT NOT NULL DEFAULT 'unpaid',-- unpaid | paid | failed | cancelled | refunded
  customer_name    TEXT NOT NULL,
  customer_phone   TEXT NOT NULL,
  customer_email   TEXT,
  district         TEXT NOT NULL,
  address          TEXT NOT NULL,
  note             TEXT,
  subtotal         INTEGER NOT NULL,
  shipping_fee     INTEGER NOT NULL,
  cod_fee          INTEGER NOT NULL DEFAULT 0,
  total            INTEGER NOT NULL,
  stock_committed  INTEGER NOT NULL DEFAULT 0,    -- 1 once stock has been deducted for this order
  admin_note       TEXT,
  created_at       TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at       TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX idx_orders_created ON orders(created_at DESC);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_phone ON orders(customer_phone);

CREATE TABLE order_items (
  id               INTEGER PRIMARY KEY AUTOINCREMENT,
  order_id         TEXT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id       TEXT NOT NULL,
  product_name     TEXT NOT NULL,                 -- snapshot at purchase time
  image            TEXT NOT NULL,
  size             TEXT NOT NULL,
  quantity         INTEGER NOT NULL CHECK (quantity > 0),
  unit_price       INTEGER NOT NULL,              -- includes customisation fee
  custom_name      TEXT,
  custom_number    TEXT,
  custom_font      TEXT
);
CREATE INDEX idx_items_order ON order_items(order_id);

-- One row per gateway attempt. Raw gateway responses are kept for audit/disputes.
CREATE TABLE payments (
  id               INTEGER PRIMARY KEY AUTOINCREMENT,
  order_id         TEXT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  provider         TEXT NOT NULL,                 -- bkash | sslcommerz | mock
  provider_ref     TEXT,                          -- bKash paymentID / SSLCommerz sessionkey
  trx_id           TEXT,                          -- bKash trxID / SSLCommerz bank_tran_id
  amount           INTEGER NOT NULL,
  status           TEXT NOT NULL,                 -- initiated | completed | failed | cancelled
  raw              TEXT,                          -- last JSON payload from the gateway
  created_at       TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at       TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX idx_payments_order ON payments(order_id);
CREATE UNIQUE INDEX idx_payments_ref ON payments(provider, provider_ref);

CREATE TABLE order_events (
  id               INTEGER PRIMARY KEY AUTOINCREMENT,
  order_id         TEXT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  message          TEXT NOT NULL,
  actor            TEXT NOT NULL DEFAULT 'system',-- system | customer | admin | gateway
  created_at       TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX idx_events_order ON order_events(order_id);
