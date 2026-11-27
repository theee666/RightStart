import { randomUUID } from 'node:crypto';
import { NextResponse } from 'next/server';
import { allowed, noStore, originAllowed, same, session, sign } from '@/lib/dify';
import { browserVerified } from '@/lib/bot-protection';
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export async function GET() {
  try {
    // Validate the signing secret even on the first visit, before a cookie exists.
    sign('configuration-check');
    const s = await session();
    return NextResponse.json(
      {
        configured: !!process.env.DIFY_API_KEY?.trim(),
        requiresCode: !!process.env.SITE_ACCESS_CODE && !s?.authorized,
        hasSession: !!s,
      },
      { headers: noStore },
    );
  } catch {
    return NextResponse.json(
      { error: '服务端会话配置尚未完成。' },
      { status: 503, headers: noStore },
    );
  }
}
export async function POST(request: Request) {
  if (!originAllowed(request))
    return NextResponse.json({ error: '请求来源验证失败。' }, { status: 403 });
  if (!(await browserVerified()))
    return NextResponse.json({ error: '访问验证未通过，请刷新页面并使用正常浏览器重试。' }, { status: 403, headers: noStore });
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'local';
  if (!allowed(`auth:${ip}`, 10))
    return NextResponse.json(
      { error: '尝试次数较多，请一分钟后重试。' },
      { status: 429, headers: { ...noStore, 'Retry-After': '60' } },
    );
  if (Number(request.headers.get('content-length') || 0) > 2048)
    return NextResponse.json({ error: '请求过大。' }, { status: 413 });
  let body;
  try {
    const text = await request.text();
    if (text.length > 2048) throw Error();
    body = JSON.parse(text);
  } catch {
    return NextResponse.json({ error: '请求格式不正确。' }, { status: 400 });
  }
  if (!body || typeof body !== 'object' || Array.isArray(body))
    return NextResponse.json({ error: '请求格式不正确。' }, { status: 400, headers: noStore });
  if (
    process.env.SITE_ACCESS_CODE &&
    (typeof body.code !== 'string' || !same(body.code, process.env.SITE_ACCESS_CODE))
  )
    return NextResponse.json({ error: '访问码不正确。' }, { status: 401, headers: noStore });
  try {
    const old = await session();
    const id = old?.id || randomUUID();
    const base = `${id}.${Date.now() + 86400000}.yes`;
    const response = NextResponse.json({ ok: true }, { headers: noStore });
    response.cookies.set('rs_session', `${base}.${sign(base)}`, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 86400,
      path: '/',
    });
    return response;
  } catch {
    return NextResponse.json(
      { error: '服务端会话配置尚未完成。' },
      { status: 503, headers: noStore },
    );
  }
}
