import 'server-only';
import { createHmac, randomBytes, timingSafeEqual } from 'node:crypto';
import { cookies } from 'next/headers';
const fallbackSecret = randomBytes(32).toString('hex');
function secret() {
  const value = process.env.SESSION_SECRET;
  if (process.env.NODE_ENV === 'production' && (!value || value.length < 32))
    throw new Error('服务端 SESSION_SECRET 尚未配置。');
  return value && value.length >= 32 ? value : fallbackSecret;
}
export function sign(value: string) {
  return createHmac('sha256', secret()).update(value).digest('hex');
}
export function same(a: string, b: string) {
  const x = Buffer.from(a),
    y = Buffer.from(b);
  return x.length === y.length && timingSafeEqual(x, y);
}
export async function session() {
  const token = (await cookies()).get('rs_session')?.value;
  if (!token) return null;
  const [id, expiry, auth, signature] = token.split('.');
  if (
    !id ||
    !expiry ||
    !auth ||
    !signature ||
    !same(sign(`${id}.${expiry}.${auth}`), signature) ||
    Number(expiry) < Date.now()
  )
    return null;
  return { id, authorized: !process.env.SITE_ACCESS_CODE || auth === 'yes' };
}
export function originAllowed(request: Request) {
  const origin = request.headers.get('origin');
  if (!origin || request.headers.get('sec-fetch-site') === 'cross-site') return false;
  try {
    const source = new URL(origin);
    const target = new URL(request.url);
    const host = request.headers.get('host') || target.host;
    const forwardedProtocol = request.headers.get('x-forwarded-proto')?.split(',')[0]?.trim();
    const protocol = forwardedProtocol ? `${forwardedProtocol}:` : target.protocol;
    return (
      ['http:', 'https:'].includes(source.protocol) &&
      source.host === host &&
      source.protocol === protocol
    );
  } catch {
    return false;
  }
}
const buckets = new Map<string, { count: number; reset: number }>();
export function allowed(key: string, limit = 15) {
  const now = Date.now();
  for (const [k, v] of buckets) if (v.reset < now) buckets.delete(k);
  const entry = buckets.get(key) ?? { count: 0, reset: now + 60000 };
  if (buckets.size >= 5000 && !buckets.has(key)) return false;
  entry.count++;
  buckets.set(key, entry);
  return entry.count <= limit;
}
export function difyConfig() {
  const key = process.env.DIFY_API_KEY?.trim();
  if (!key) throw new Error('AI 服务尚未配置。请由项目管理员填写 .env.local 中的 DIFY_API_KEY。');
  const url = (process.env.DIFY_API_URL || 'https://api.dify.ai/v1').replace(/\/$/, '');
  if (new URL(url).protocol !== 'https:') throw new Error('Dify API 必须使用 HTTPS。');
  return { url, headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' } };
}
let cache: { until: number; value: Record<string, unknown> } | undefined;
export async function getParameters() {
  if (cache && cache.until > Date.now()) return cache.value;
  const { url, headers } = difyConfig();
  const response = await fetch(`${url}/parameters`, {
    headers,
    cache: 'no-store',
    signal: AbortSignal.timeout(15000),
  });
  if (!response.ok)
    throw new Error(
      response.status === 401
        ? 'Dify 密钥验证失败，请管理员检查配置。'
        : '无法读取 Dify 应用配置，请稍后重试。',
    );
  const value = await response.json();
  cache = { value, until: Date.now() + 60000 };
  return value as Record<string, unknown>;
}
export const noStore = { 'Cache-Control': 'no-store' };
