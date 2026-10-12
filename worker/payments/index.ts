/**
 * Gateway facade. Decides per provider whether to talk to the real sandbox or the built-in
 * simulator, so the whole checkout works on a fresh clone with zero credentials.
 */
import type { Env } from '../env';
import * as bkash from './bkash';
import * as sslcz from './sslcommerz';
import { randomCode } from '../lib/ids';

export type Provider = 'bkash' | 'sslcommerz';
export type GatewayMode = 'mock' | 'sandbox' | 'live';

export function gatewayMode(env: Env, provider: Provider): GatewayMode {
  if (env.PAYMENT_MODE === 'mock') return 'mock';
  const configured = provider === 'bkash' ? bkash.bkashConfigured(env) : sslcz.sslczConfigured(env);
  if (!configured) return 'mock';
  return env.PAYMENT_MODE === 'live' ? 'live' : 'sandbox';
}

export interface StartPaymentInput {
  orderId: string;
  attemptRef: string; // unique per attempt: used as bKash invoice / SSLCommerz tran_id
  amount: number;
  origin: string;
  customer: { name: string; email?: string | null; phone: string; address: string; district: string };
  productName: string;
  itemCount: number;
}

export interface StartPaymentResult {
  providerRef: string; // what the gateway will send back to us: bKash paymentID / SSLCommerz tran_id
  redirectUrl: string;
  raw: unknown;
}

export async function startPayment(env: Env, provider: Provider, p: StartPaymentInput): Promise<StartPaymentResult> {
  const mode = gatewayMode(env, provider);

  if (provider === 'bkash') {
    if (mode === 'mock') {
      const ref = `MOCKBK${randomCode(12)}`;
      return { providerRef: ref, redirectUrl: `/api/payments/mock?provider=bkash&ref=${ref}`, raw: { mock: true } };
    }
    const r = await bkash.createPayment(env, {
      amount: p.amount,
      invoice: p.attemptRef,
      payerReference: p.customer.phone,
      callbackURL: `${p.origin}/api/payments/bkash/callback`,
    });
    return { providerRef: r.paymentID, redirectUrl: r.redirectUrl, raw: r.raw };
  }

  const tranId = p.attemptRef;
  if (mode === 'mock') {
    return { providerRef: tranId, redirectUrl: `/api/payments/mock?provider=sslcommerz&ref=${tranId}`, raw: { mock: true } };
  }
  const r = await sslcz.initSession(env, {
    tranId,
    amount: p.amount,
    successUrl: `${p.origin}/api/payments/sslcommerz/success`,
    failUrl: `${p.origin}/api/payments/sslcommerz/fail`,
    cancelUrl: `${p.origin}/api/payments/sslcommerz/cancel`,
    ipnUrl: `${p.origin}/api/payments/sslcommerz/ipn`,
    customer: { ...p.customer, city: p.customer.district },
    productName: p.productName,
    itemCount: p.itemCount,
  });
  return { providerRef: tranId, redirectUrl: r.redirectUrl, raw: { ...r.raw, sessionkey: r.sessionKey } };
}

/** Normalised result of "did the money actually arrive?" */
export interface Verification {
  completed: boolean;
  amount?: number;
  trxId?: string;
  raw: unknown;
}

export async function confirmBkash(env: Env, paymentID: string, expectedAmount: number): Promise<Verification> {
  if (gatewayMode(env, 'bkash') === 'mock') {
    return { completed: true, amount: expectedAmount, trxId: `MOCKTRX${randomCode(8)}`, raw: { mock: true, paymentID } };
  }
  const r = await bkash.executePayment(env, paymentID);
  return { completed: r.completed, amount: r.amount, trxId: r.trxId, raw: r.raw };
}

export async function recheckBkash(env: Env, paymentID: string): Promise<Verification> {
  if (gatewayMode(env, 'bkash') === 'mock') return { completed: false, raw: { mock: true, note: 'Simulator has no remote state' } };
  const r = await bkash.queryPayment(env, paymentID);
  return { completed: r.completed, amount: r.amount, trxId: r.trxId, raw: r.raw };
}

export async function confirmSslcz(env: Env, valId: string, tranId: string, expectedAmount: number): Promise<Verification> {
  if (gatewayMode(env, 'sslcommerz') === 'mock') {
    const ok = valId === `MOCKVAL-${tranId}`;
    return { completed: ok, amount: expectedAmount, trxId: ok ? `MOCKBANK${randomCode(8)}` : undefined, raw: { mock: true, valId } };
  }
  const r = await sslcz.validate(env, valId);
  return { completed: r.valid && r.tranId === tranId, amount: r.amount, trxId: r.bankTranId, raw: r.raw };
}

export async function recheckSslcz(env: Env, tranId: string): Promise<Verification> {
  if (gatewayMode(env, 'sslcommerz') === 'mock') return { completed: false, raw: { mock: true, note: 'Simulator has no remote state' } };
  const r = await sslcz.queryByTranId(env, tranId);
  return { completed: r.valid, amount: r.amount, trxId: r.bankTranId, raw: r.raw };
}
