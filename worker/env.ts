export interface Env {
  DB: D1Database;
  ASSETS: Fetcher;

  /** Public origin used to build gateway callback URLs. Falls back to the request origin. */
  APP_URL?: string;
  /** "sandbox" (default) talks to real bKash / SSLCommerz sandboxes. "mock" uses the built-in simulator for both. */
  PAYMENT_MODE?: 'sandbox' | 'live' | 'mock';

  BKASH_BASE_URL?: string;
  BKASH_APP_KEY?: string;
  BKASH_APP_SECRET?: string;
  BKASH_USERNAME?: string;
  BKASH_PASSWORD?: string;

  SSLCZ_STORE_ID?: string;
  SSLCZ_STORE_PASSWD?: string;

  ADMIN_EMAIL?: string;
  ADMIN_PASSWORD?: string;
  JWT_SECRET?: string;

  /** Minutes an unpaid online order holds stock before the cron releases it. */
  PENDING_ORDER_TTL_MIN?: string;
}

export type AppEnv = { Bindings: Env; Variables: { admin?: string } };
