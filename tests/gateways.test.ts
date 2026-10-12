import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import * as bkash from '../worker/payments/bkash';
import * as sslcz from '../worker/payments/sslcommerz';
import { gatewayMode, startPayment } from '../worker/payments';
import { GatewayError } from '../worker/lib/http';
import type { Env } from '../worker/env';

const env = {
  BKASH_BASE_URL: 'https://bkash.test/v1.2.0-beta',
  BKASH_APP_KEY: 'key', BKASH_APP_SECRET: 'secret', BKASH_USERNAME: 'user', BKASH_PASSWORD: 'pass',
  SSLCZ_STORE_ID: 'store', SSLCZ_STORE_PASSWD: 'storepass',
} as Env;

const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status });
let calls: { url: string; init: RequestInit }[] = [];

function mockFetch(handler: (url: string, init: RequestInit) => Response | Promise<Response>) {
  vi.stubGlobal('fetch', vi.fn(async (url: string, init: RequestInit) => {
    calls.push({ url, init });
    return handler(url, init);
  }));
}

beforeEach(() => { calls = []; bkash._resetBkashTokenCache(); });
afterEach(() => vi.unstubAllGlobals());

describe('gateway mode', () => {
  it('falls back to the simulator when credentials are missing', () => {
    expect(gatewayMode({} as Env, 'bkash')).toBe('mock');
    expect(gatewayMode(env, 'bkash')).toBe('sandbox');
    expect(gatewayMode({ ...env, PAYMENT_MODE: 'mock' }, 'sslcommerz')).toBe('mock');
  });

  it('simulator returns a relative redirect so it works behind any origin', async () => {
    const r = await startPayment({} as Env, 'bkash', {
      orderId: 'PK-1', attemptRef: 'PK-1-AB', amount: 100, origin: 'http://x',
      customer: { name: 'A', phone: '01712345678', address: 'addr', district: 'Dhaka' }, productName: 'Kit', itemCount: 1,
    });
    expect(r.redirectUrl).toMatch(/^\/api\/payments\/mock\?provider=bkash&ref=MOCKBK/);
  });
});

describe('bKash tokenized checkout', () => {
  it('grants a token once, then creates a payment with the right headers and body', async () => {
    mockFetch((url) =>
      url.endsWith('/token/grant')
        ? json({ id_token: 'tok', expires_in: 3600 })
        : json({ statusCode: '0000', paymentID: 'PAY1', bkashURL: 'https://pay.bkash.test/PAY1' }),
    );
    const r = await bkash.createPayment(env, { amount: 1430, invoice: 'PK-1-AB', payerReference: '01712345678', callbackURL: 'https://shop/cb' });
    await bkash.createPayment(env, { amount: 1, invoice: 'PK-2-AB', payerReference: '0', callbackURL: 'https://shop/cb' });

    expect(r).toMatchObject({ paymentID: 'PAY1', redirectUrl: 'https://pay.bkash.test/PAY1' });
    expect(calls.filter((c) => c.url.endsWith('/token/grant'))).toHaveLength(1); // cached
    const grant = calls[0];
    expect((grant.init.headers as any).username).toBe('user');
    expect(JSON.parse(grant.init.body as string)).toEqual({ app_key: 'key', app_secret: 'secret' });
    const create = calls[1];
    expect(create.url).toBe('https://bkash.test/v1.2.0-beta/tokenized/checkout/create');
    expect((create.init.headers as any).Authorization).toBe('tok');
    expect((create.init.headers as any)['X-APP-Key']).toBe('key');
    expect(JSON.parse(create.init.body as string)).toMatchObject({ mode: '0011', amount: '1430.00', currency: 'BDT', intent: 'sale', merchantInvoiceNumber: 'PK-1-AB' });
  });

  it('throws a GatewayError when bKash rejects the create call', async () => {
    mockFetch((url) => (url.endsWith('/token/grant') ? json({ id_token: 'tok' }) : json({ statusCode: '2023', statusMessage: 'Insufficient Balance' })));
    await expect(bkash.createPayment(env, { amount: 1, invoice: 'x', payerReference: 'x', callbackURL: 'x' })).rejects.toThrow(GatewayError);
  });

  it('reports a completed execute with trxID and amount', async () => {
    mockFetch((url) =>
      url.endsWith('/token/grant') ? json({ id_token: 'tok' }) : json({ statusCode: '0000', transactionStatus: 'Completed', trxID: 'TRX9', amount: '1430.00' }),
    );
    expect(await bkash.executePayment(env, 'PAY1')).toMatchObject({ completed: true, trxId: 'TRX9', amount: 1430 });
  });

  it('falls back to a status query when execute fails (e.g. timeout)', async () => {
    mockFetch((url) => {
      if (url.endsWith('/token/grant')) return json({ id_token: 'tok' });
      if (url.endsWith('/execute')) return new Response('gateway timeout', { status: 504 });
      return json({ statusCode: '0000', transactionStatus: 'Completed', trxID: 'TRXQ', amount: '50' });
    });
    const r = await bkash.executePayment(env, 'PAY1');
    expect(r).toMatchObject({ completed: true, trxId: 'TRXQ' });
    expect(calls.some((c) => c.url.endsWith('/payment/status'))).toBe(true);
  });
});

describe('SSLCommerz', () => {
  it('initialises a session with store credentials and callback URLs', async () => {
    mockFetch(() => json({ status: 'SUCCESS', GatewayPageURL: 'https://sandbox.sslcommerz.com/pay/abc', sessionkey: 'SESS' }));
    const r = await sslcz.initSession(env, {
      tranId: 'PK-1-AB', amount: 2200, successUrl: 's', failUrl: 'f', cancelUrl: 'c', ipnUrl: 'i',
      customer: { name: 'A', phone: '01712345678', address: 'addr', city: 'Dhaka' }, productName: 'Kit', itemCount: 1,
    });
    expect(r).toMatchObject({ sessionKey: 'SESS', redirectUrl: 'https://sandbox.sslcommerz.com/pay/abc' });
    expect(calls[0].url).toBe('https://sandbox.sslcommerz.com/gwprocess/v4/api.php');
    const form = new URLSearchParams(calls[0].init.body as string);
    expect(Object.fromEntries(form)).toMatchObject({ store_id: 'store', total_amount: '2200.00', currency: 'BDT', tran_id: 'PK-1-AB', ipn_url: 'i' });
  });

  it('surfaces the failure reason from a rejected init', async () => {
    mockFetch(() => json({ status: 'FAILED', failedreason: 'Store Credential Error' }));
    await expect(
      sslcz.initSession(env, { tranId: 't', amount: 1, successUrl: '', failUrl: '', cancelUrl: '', ipnUrl: '', customer: { name: '', phone: '', address: '', city: '' }, productName: '', itemCount: 1 }),
    ).rejects.toThrow('Store Credential Error');
  });

  it('treats VALID and VALIDATED as paid and passes back amount + tran_id', async () => {
    mockFetch(() => json({ status: 'VALIDATED', tran_id: 'PK-1-AB', amount: '2200.00', bank_tran_id: 'BANK1' }));
    const v = await sslcz.validate(env, 'VAL1');
    expect(v).toMatchObject({ valid: true, tranId: 'PK-1-AB', amount: 2200, bankTranId: 'BANK1' });
    expect(calls[0].url).toContain('val_id=VAL1');
  });

  it('rejects invalid transactions', async () => {
    mockFetch(() => json({ status: 'INVALID_TRANSACTION' }));
    expect((await sslcz.validate(env, 'BAD')).valid).toBe(false);
  });
});
