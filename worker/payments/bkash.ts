/**
 * bKash Tokenized Checkout (v1.2.0-beta) client.
 * Docs: https://developer.bka.sh/docs/tokenized-checkout-overview
 *
 * Flow: grant token -> create payment (get bkashURL) -> customer pays on bKash page ->
 * bKash redirects to callbackURL?paymentID=..&status=success|failure|cancel -> execute payment.
 * If execute times out, query payment status before deciding (bKash recommends this).
 */
import type { Env } from '../env';
import { fetchJson, GatewayError } from '../lib/http';

export const BKASH_SANDBOX_URL = 'https://tokenized.sandbox.bka.sh/v1.2.0-beta';

export interface BkashResult {
  completed: boolean;
  trxId?: string;
  amount?: number;
  invoice?: string;
  raw: any;
}

// Grant tokens are valid for 1 hour; cache per isolate to avoid hammering the grant endpoint.
let tokenCache: { token: string; expiresAt: number; key: string } | null = null;

export function bkashConfigured(env: Env) {
  return Boolean(env.BKASH_APP_KEY && env.BKASH_APP_SECRET && env.BKASH_USERNAME && env.BKASH_PASSWORD);
}

const base = (env: Env) => (env.BKASH_BASE_URL || BKASH_SANDBOX_URL).replace(/\/$/, '');

async function grantToken(env: Env): Promise<string> {
  const key = `${base(env)}|${env.BKASH_APP_KEY}`;
  if (tokenCache && tokenCache.key === key && tokenCache.expiresAt > Date.now() + 60_000) return tokenCache.token;

  const body = await fetchJson(`${base(env)}/tokenized/checkout/token/grant`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      username: env.BKASH_USERNAME!,
      password: env.BKASH_PASSWORD!,
    },
    body: JSON.stringify({ app_key: env.BKASH_APP_KEY, app_secret: env.BKASH_APP_SECRET }),
  });
  if (!body.id_token) throw new GatewayError('bKash authentication failed', body);
  tokenCache = { token: body.id_token, key, expiresAt: Date.now() + Number(body.expires_in ?? 3600) * 1000 };
  return body.id_token;
}

async function call(env: Env, path: string, payload: Record<string, unknown>) {
  const token = await grantToken(env);
  return fetchJson(`${base(env)}/tokenized/checkout/${path}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      Authorization: token,
      'X-APP-Key': env.BKASH_APP_KEY!,
    },
    body: JSON.stringify(payload),
  });
}

export async function createPayment(
  env: Env,
  p: { amount: number; invoice: string; payerReference: string; callbackURL: string },
): Promise<{ paymentID: string; redirectUrl: string; raw: any }> {
  const body = await call(env, 'create', {
    mode: '0011', // checkout without agreement
    payerReference: p.payerReference,
    callbackURL: p.callbackURL,
    amount: p.amount.toFixed(2),
    currency: 'BDT',
    intent: 'sale',
    merchantInvoiceNumber: p.invoice,
  });
  if (body.statusCode !== '0000' || !body.bkashURL) {
    throw new GatewayError(body.statusMessage || 'Could not start bKash payment', body);
  }
  return { paymentID: body.paymentID, redirectUrl: body.bkashURL, raw: body };
}

const toResult = (body: any): BkashResult => ({
  completed: body?.statusCode === '0000' && body?.transactionStatus === 'Completed',
  trxId: body?.trxID,
  amount: body?.amount !== undefined ? Number(body.amount) : undefined,
  invoice: body?.merchantInvoiceNumber,
  raw: body,
});

export async function queryPayment(env: Env, paymentID: string): Promise<BkashResult> {
  return toResult(await call(env, 'payment/status', { paymentID }));
}

/** Execute after a successful callback. Falls back to a status query if execute itself fails. */
export async function executePayment(env: Env, paymentID: string): Promise<BkashResult> {
  try {
    const result = toResult(await call(env, 'execute', { paymentID }));
    if (result.completed) return result;
    // e.g. 2117 "Payment execution already been called before" — the query tells the truth.
    const q = await queryPayment(env, paymentID).catch(() => null);
    return q?.completed ? q : result;
  } catch (err) {
    return queryPayment(env, paymentID);
  }
}

/** Test hook */
export const _resetBkashTokenCache = () => (tokenCache = null);
