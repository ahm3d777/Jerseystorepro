import { HTTPException } from 'hono/http-exception';

export const badRequest = (message: string) => new HTTPException(400, { message });
export const notFound = (message = 'Not found') => new HTTPException(404, { message });
export const conflict = (message: string) => new HTTPException(409, { message });
export const unauthorized = (message = 'Unauthorized') => new HTTPException(401, { message });

/** Error thrown when a payment gateway call fails. Message is safe to show to customers. */
export class GatewayError extends Error {
  constructor(message: string, public detail?: unknown) {
    super(message);
    this.name = 'GatewayError';
  }
}

export async function fetchJson<T = any>(url: string, init: RequestInit, timeoutMs = 20000): Promise<T> {
  const res = await fetch(url, { ...init, signal: AbortSignal.timeout(timeoutMs) });
  const text = await res.text();
  let body: any;
  try {
    body = JSON.parse(text);
  } catch {
    throw new GatewayError(`Gateway returned non-JSON response (HTTP ${res.status})`, text.slice(0, 500));
  }
  if (!res.ok) throw new GatewayError(`Gateway HTTP ${res.status}`, body);
  return body as T;
}
