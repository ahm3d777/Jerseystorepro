/**
 * SSLCommerz Hosted Payment (v4) client.
 * Docs: https://developer.sslcommerz.com/doc/v4/
 *
 * Flow: init session (get GatewayPageURL) -> customer pays (card / mobile banking / net banking) ->
 * SSLCommerz POSTs the browser to success_url / fail_url / cancel_url and calls ipn_url server-to-server.
 * We never trust the POSTed fields: every success is re-checked with the Validation API using val_id.
 */
import type { Env } from '../env';
import { fetchJson, GatewayError } from '../lib/http';

export const SSLCZ_SANDBOX_URL = 'https://sandbox.sslcommerz.com';
export const SSLCZ_LIVE_URL = 'https://securepay.sslcommerz.com';

export function sslczConfigured(env: Env) {
  return Boolean(env.SSLCZ_STORE_ID && env.SSLCZ_STORE_PASSWD);
}

const base = (env: Env) => (env.PAYMENT_MODE === 'live' ? SSLCZ_LIVE_URL : SSLCZ_SANDBOX_URL);

export interface SslczInit {
  tranId: string;
  amount: number;
  successUrl: string;
  failUrl: string;
  cancelUrl: string;
  ipnUrl: string;
  customer: { name: string; email?: string | null; phone: string; address: string; city: string };
  productName: string;
  itemCount: number;
}

export async function initSession(env: Env, p: SslczInit): Promise<{ sessionKey: string; redirectUrl: string; raw: any }> {
  const form = new URLSearchParams({
    store_id: env.SSLCZ_STORE_ID!,
    store_passwd: env.SSLCZ_STORE_PASSWD!,
    total_amount: p.amount.toFixed(2),
    currency: 'BDT',
    tran_id: p.tranId,
    success_url: p.successUrl,
    fail_url: p.failUrl,
    cancel_url: p.cancelUrl,
    ipn_url: p.ipnUrl,
    cus_name: p.customer.name,
    cus_email: p.customer.email || 'customer@example.com',
    cus_phone: p.customer.phone,
    cus_add1: p.customer.address,
    cus_city: p.customer.city,
    cus_country: 'Bangladesh',
    shipping_method: 'Courier',
    ship_name: p.customer.name,
    ship_add1: p.customer.address,
    ship_city: p.customer.city,
    ship_postcode: '1000',
    ship_country: 'Bangladesh',
    num_of_item: String(p.itemCount),
    product_name: p.productName.slice(0, 250),
    product_category: 'Apparel',
    product_profile: 'physical-goods',
  });
  const body = await fetchJson(`${base(env)}/gwprocess/v4/api.php`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: form,
  });
  if (body.status !== 'SUCCESS' || !body.GatewayPageURL) {
    throw new GatewayError(body.failedreason || 'Could not start SSLCommerz session', body);
  }
  return { sessionKey: body.sessionkey, redirectUrl: body.GatewayPageURL, raw: body };
}

export interface SslczValidation {
  valid: boolean;
  tranId?: string;
  amount?: number;
  bankTranId?: string;
  cardType?: string;
  raw: any;
}

const toValidation = (body: any): SslczValidation => ({
  valid: body?.status === 'VALID' || body?.status === 'VALIDATED',
  tranId: body?.tran_id,
  amount: body?.amount !== undefined ? Number(body.amount) : undefined,
  bankTranId: body?.bank_tran_id,
  cardType: body?.card_type,
  raw: body,
});

/** Authoritative check for a val_id received on success_url / ipn_url. */
export async function validate(env: Env, valId: string): Promise<SslczValidation> {
  const qs = new URLSearchParams({
    val_id: valId,
    store_id: env.SSLCZ_STORE_ID!,
    store_passwd: env.SSLCZ_STORE_PASSWD!,
    format: 'json',
  });
  return toValidation(await fetchJson(`${base(env)}/validator/api/validationserverAPI.php?${qs}`, { method: 'GET' }));
}

/** Look up a transaction by our tran_id (used by the admin "re-check payment" action). */
export async function queryByTranId(env: Env, tranId: string): Promise<SslczValidation> {
  const qs = new URLSearchParams({
    tran_id: tranId,
    store_id: env.SSLCZ_STORE_ID!,
    store_passwd: env.SSLCZ_STORE_PASSWD!,
    format: 'json',
  });
  const body = await fetchJson(`${base(env)}/validator/api/merchantTransIDvalidationAPI.php?${qs}`, { method: 'GET' });
  const hit = (body?.element ?? []).find((e: any) => e.status === 'VALID' || e.status === 'VALIDATED');
  return hit ? toValidation(hit) : { valid: false, tranId, raw: body };
}
