import type { D1Database } from '@cloudflare/workers-types';
import { defaultProfile, type StudioProfile } from '../src/lib/profile';
export type Env = {
  CMS_DB?: D1Database; ADMIN_PASSWORD_HASH?: string; GROQ_API_KEY?: string;
  GROQ_MODEL?: string; RATE_LIMIT_SALT?: string; CHAT_DAILY_LIMIT?: string;
  SITE_URL?: string;
};
export type Context = { request: Request; env: Env };
export class HttpError extends Error {
  constructor(public status: number, public code: string, message: string) { super(message); }
}
export const json = (data: unknown, status = 200, headers: HeadersInit = {}) => new Response(JSON.stringify(data), {
  status, headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store',
    'X-Content-Type-Options': 'nosniff', ...headers },
});
export function db(env: Env): D1Database {
  if (!env.CMS_DB) throw new HttpError(503, 'NOT_CONFIGURED', 'The database has not been connected.');
  return env.CMS_DB;
}
export function sameOrigin(request: Request) {
  if (request.headers.get('Origin') !== new URL(request.url).origin) throw new HttpError(403, 'ORIGIN_DENIED', 'Request origin is not allowed.');
}
export async function bodyJson(request: Request, max = 18000): Promise<Record<string, unknown>> {
  if (!request.headers.get('Content-Type')?.startsWith('application/json')) throw new HttpError(415, 'INVALID_CONTENT_TYPE', 'Use application/json.');
  if (!request.body) throw new HttpError(400, 'INVALID_BODY', 'A request body is required.');
  const reader = request.body.getReader();
  const chunks: Uint8Array[] = []; let total = 0;
  try {
    for (;;) {
      const result = await reader.read(); if (result.done) break;
      total += result.value.byteLength;
      if (total > max) { await reader.cancel(); throw new HttpError(413, 'BODY_TOO_LARGE', 'The request is too large.'); }
      chunks.push(result.value);
    }
  } finally { reader.releaseLock(); }
  const bytes = new Uint8Array(total); let offset = 0;
  for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.byteLength; }
  try {
    const value = JSON.parse(new TextDecoder().decode(bytes));
    if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error();
    return value;
  } catch { throw new HttpError(400, 'INVALID_BODY', 'Invalid JSON object.'); }
}
export function textField(data: Record<string, unknown>, key: string, max: number, min = 0) {
  const value = data[key];
  if (typeof value !== 'string' || value.trim().length < min || value.length > max)
    throw new HttpError(400, 'INVALID_FIELD', `Check ${key} (maximum ${max} characters).`);
  return value.trim();
}
export const hex = (bytes: ArrayBuffer) => Array.from(new Uint8Array(bytes), (byte) => byte.toString(16).padStart(2, '0')).join('');
export async function hash(value: string) { return hex(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value))); }
export async function limit(env: Env, request: Request, scope: string, maximum: number, seconds: number) {
  const salt = env.RATE_LIMIT_SALT || env.ADMIN_PASSWORD_HASH;
  if (!salt) throw new HttpError(503, 'NOT_CONFIGURED', 'Rate limiting has not been configured.');
  const now = Math.floor(Date.now() / 1000);
  const identity = scope === 'chat-global' ? 'global' : request.headers.get('CF-Connecting-IP') || 'local';
  const key = await hash(salt + ':' + scope + ':' + identity + ':' + Math.floor(now / seconds));
  const database = db(env);
  const result = await database.prepare('INSERT INTO rate_limits (bucket, hits, expires_at) VALUES (?, 1, ?) ON CONFLICT(bucket) DO UPDATE SET hits = hits + 1 RETURNING hits')
    .bind(key, now + seconds * 2).first<{ hits: number }>();
  await database.prepare('DELETE FROM rate_limits WHERE expires_at < ?').bind(now).run();
  if (!result || result.hits > maximum) throw new HttpError(429, 'RATE_LIMITED', 'Please try again later.');
}
export async function verifyPassword(password: string, record: string) {
  const parts = record.split('$');
  if (parts.length !== 4 || parts[0] !== 'pbkdf2-sha256' || parts[1] !== '100000' || !/^[a-f0-9]{32}$/.test(parts[2]) || !/^[a-f0-9]{64}$/.test(parts[3])) return false;
  const salt = Uint8Array.from(parts[2].match(/../g)!, (pair) => parseInt(pair, 16));
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(password), 'PBKDF2', false, ['deriveBits']);
  const digest = hex(await crypto.subtle.deriveBits({ name: 'PBKDF2', hash: 'SHA-256', salt, iterations: 100000 }, key, 256));
  let diff = 0; for (let i = 0; i < digest.length; i++) diff |= digest.charCodeAt(i) ^ parts[3].charCodeAt(i);
  return diff === 0;
}
export function sessionToken(request: Request) {
  const cookie = request.headers.get('Cookie')?.split(';').map((s) => s.trim()).find((s) => s.startsWith('vfx_session='));
  const value = cookie?.slice('vfx_session='.length) || '';
  return /^[a-f0-9]{64}$/.test(value) ? value : '';
}
export async function requireAdmin(request: Request, env: Env) {
  const token = sessionToken(request);
  if (!token) throw new HttpError(401, 'UNAUTHORIZED', 'Please sign in.');
  const row = await db(env).prepare('SELECT token_hash FROM sessions WHERE token_hash = ? AND expires_at > ?')
    .bind(await hash(token), Math.floor(Date.now() / 1000)).first();
  if (!row) throw new HttpError(401, 'UNAUTHORIZED', 'Your session has expired.');
}
export function cookie(request: Request, token: string, age: number) {
  return `vfx_session=${token}; Path=/; HttpOnly; SameSite=Strict; Max-Age=${age}${new URL(request.url).protocol === 'https:' ? '; Secure' : ''}`;
}
export async function getProfile(env: Env): Promise<StudioProfile> {
  if (!env.CMS_DB) return { ...defaultProfile };
  const row = await env.CMS_DB.prepare("SELECT value FROM settings WHERE key = 'profile'").first<{ value: string }>();
  if (!row) return { ...defaultProfile };
  try { return { ...defaultProfile, ...JSON.parse(row.value) }; } catch { return { ...defaultProfile }; }
}
export type Post = {
  id: string; slug: string; title_en: string; title_fa: string;
  excerpt_en: string; excerpt_fa: string; body_en: string; body_fa: string;
  tags: string; status: 'draft' | 'published'; revision: number;
  created_at: string; updated_at: string; published_at: string | null;
};
export function validatePost(data: Record<string, unknown>) {
  const slug = textField(data, 'slug', 100, 1);
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) throw new HttpError(400, 'INVALID_SLUG', 'Use lowercase English letters, numbers, and hyphens for the slug.');
  const status = data.status;
  if (status !== 'draft' && status !== 'published') throw new HttpError(400, 'INVALID_STATUS', 'Choose draft or published.');
  const result = {
    slug, title_en: textField(data, 'title_en', 120, 3), title_fa: textField(data, 'title_fa', 120),
    excerpt_en: textField(data, 'excerpt_en', 300), excerpt_fa: textField(data, 'excerpt_fa', 300),
    body_en: textField(data, 'body_en', 25000), body_fa: textField(data, 'body_fa', 25000),
    tags: textField(data, 'tags', 160), status,
  };
  if (status === 'published' && (result.body_en.length < 40 || result.excerpt_en.length < 20)) throw new HttpError(400, 'INCOMPLETE_POST', 'A published post needs English content (40+ characters) and a summary (20+ characters).');
  const partialFa = result.title_fa || result.body_fa || result.excerpt_fa;
  if (status === 'published' && partialFa && (!result.title_fa || result.body_fa.length < 40 || result.excerpt_fa.length < 20))
    throw new HttpError(400, 'INCOMPLETE_TRANSLATION', 'Complete all Persian fields or leave all three empty.');
  return result;
}
