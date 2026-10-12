import type { Context, Next } from 'hono';
import { getCookie, setCookie, deleteCookie } from 'hono/cookie';
import { sign, verify } from 'hono/jwt';
import type { AppEnv, Env } from '../env';
import { unauthorized } from './http';

const COOKIE = 'pk_admin';
const SESSION_HOURS = 12;

const encoder = new TextEncoder();
async function sha256(value: string) {
  return new Uint8Array(await crypto.subtle.digest('SHA-256', encoder.encode(value)));
}

/** Constant-time comparison (hash first so lengths always match). */
async function safeEqual(a: string, b: string) {
  const [ha, hb] = await Promise.all([sha256(a), sha256(b)]);
  let diff = 0;
  for (let i = 0; i < ha.length; i++) diff |= ha[i] ^ hb[i];
  return diff === 0;
}

function assertConfigured(env: Env) {
  if (!env.ADMIN_EMAIL || !env.ADMIN_PASSWORD || !env.JWT_SECRET || env.JWT_SECRET.length < 32) {
    throw unauthorized('Admin login is not configured. Set ADMIN_EMAIL, ADMIN_PASSWORD and JWT_SECRET (32+ chars).');
  }
}

export async function login(c: Context<AppEnv>, email: string, password: string) {
  assertConfigured(c.env);
  // Evaluate both comparisons every time so timing doesn't reveal which field was wrong.
  const [emailOk, passOk] = await Promise.all([
    safeEqual(email.trim().toLowerCase(), c.env.ADMIN_EMAIL!.toLowerCase()),
    safeEqual(password, c.env.ADMIN_PASSWORD!),
  ]);
  const ok = emailOk && passOk;
  if (!ok) {
    await new Promise((r) => setTimeout(r, 400)); // slow down guessing
    throw unauthorized('Invalid email or password');
  }
  const exp = Math.floor(Date.now() / 1000) + SESSION_HOURS * 3600;
  const token = await sign({ sub: c.env.ADMIN_EMAIL, role: 'admin', exp }, c.env.JWT_SECRET!, 'HS256');
  setCookie(c, COOKIE, token, {
    httpOnly: true,
    secure: new URL(c.req.url).protocol === 'https:',
    sameSite: 'Strict',
    path: '/api/admin',
    maxAge: SESSION_HOURS * 3600,
  });
  return { email: c.env.ADMIN_EMAIL };
}

export function logout(c: Context<AppEnv>) {
  deleteCookie(c, COOKIE, { path: '/api/admin' });
}

export async function requireAdmin(c: Context<AppEnv>, next: Next) {
  assertConfigured(c.env);
  const token = getCookie(c, COOKIE);
  if (!token) throw unauthorized();
  try {
    const payload = await verify(token, c.env.JWT_SECRET!, 'HS256');
    if (payload.role !== 'admin') throw new Error('bad role');
    c.set('admin', String(payload.sub));
  } catch {
    throw unauthorized('Session expired');
  }
  await next();
}
