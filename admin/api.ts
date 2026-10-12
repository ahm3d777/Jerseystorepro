import { api } from '../lib/api';
import type { Product } from '../types';

export interface AdminOrderRow {
  id: string;
  customer_name: string;
  customer_phone: string;
  district: string;
  total: number;
  status: string;
  payment_method: string;
  payment_status: string;
  created_at: string;
  items: number;
}

export interface Stats {
  totals: { orders: number; revenue: number; aov: number };
  today: { orders: number; revenue: number };
  byStatus: Record<string, number>;
  byMethod: { method: string; n: number; revenue: number }[];
  daily: { day: string; orders: number; revenue: number }[];
  lowStock: { id: string; name: string; stock: number; image: string }[];
  recent: AdminOrderRow[];
}

export interface OrderDetail {
  order: Record<string, any>;
  items: Record<string, any>[];
  payments: { id: number; provider: string; provider_ref: string; trx_id: string | null; amount: number; status: string; raw: unknown; created_at: string }[];
  events: { id: number; message: string; actor: string; created_at: string }[];
}

export const adminApi = {
  me: () => api<{ email: string }>('/admin/me'),
  login: (email: string, password: string) => api<{ email: string }>('/admin/login', { method: 'POST', body: JSON.stringify({ email, password }) }),
  logout: () => api('/admin/logout', { method: 'POST' }),
  stats: () => api<Stats>('/admin/stats'),
  orders: (q: Record<string, string>) => api<{ orders: AdminOrderRow[]; total: number; page: number; pageSize: number }>(`/admin/orders?${new URLSearchParams(q)}`),
  order: (id: string) => api<OrderDetail>(`/admin/orders/${encodeURIComponent(id)}`),
  updateOrder: (id: string, body: { status?: string; note?: string; adminNote?: string }) =>
    api(`/admin/orders/${encodeURIComponent(id)}`, { method: 'PATCH', body: JSON.stringify(body) }),
  recheckPayment: (paymentId: number) => api<{ completed: boolean }>(`/admin/payments/${paymentId}/recheck`, { method: 'POST' }),
  products: () => api<Product[]>('/admin/products'),
  createProduct: (p: unknown) => api<Product>('/admin/products', { method: 'POST', body: JSON.stringify(p) }),
  updateProduct: (id: string, p: unknown) => api<Product>(`/admin/products/${encodeURIComponent(id)}`, { method: 'PUT', body: JSON.stringify(p) }),
  archiveProduct: (id: string) => api(`/admin/products/${encodeURIComponent(id)}`, { method: 'DELETE' }),
};
