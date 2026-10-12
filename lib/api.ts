import type { CheckoutCustomer, PaymentMethod, Product, PublicOrder, StoreConfig } from '../types';

export class ApiError extends Error {
  constructor(message: string, public status: number, public fields?: Record<string, string[]>) {
    super(message);
  }
}

export async function api<T>(path: string, init: RequestInit = {}): Promise<T> {
  const res = await fetch(`/api${path}`, {
    credentials: 'same-origin',
    ...init,
    headers: { ...(init.body ? { 'Content-Type': 'application/json' } : {}), ...init.headers },
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new ApiError(body.error || `Request failed (${res.status})`, res.status, body.fields);
  return body as T;
}

export const getProducts = () => api<Product[]>('/products');
export const getConfig = () => api<StoreConfig>('/config');

export interface OrderPayload {
  items: { productId: string; size: string; quantity: number; customization?: { name: string; number: string; font: string } }[];
  customer: CheckoutCustomer;
  paymentMethod: PaymentMethod;
}

export const placeOrder = (payload: OrderPayload) =>
  api<{ orderId: string; token: string; redirectUrl: string }>('/orders', { method: 'POST', body: JSON.stringify(payload) });

export const getOrder = (id: string, token: string) => api<PublicOrder>(`/orders/${encodeURIComponent(id)}?t=${encodeURIComponent(token)}`);

export const retryPayment = (id: string, token: string) =>
  api<{ redirectUrl: string }>(`/orders/${encodeURIComponent(id)}/pay?t=${encodeURIComponent(token)}`, { method: 'POST' });
