import { NextResponse } from 'next/server';
import { allowed, difyConfig, noStore, originAllowed, same, session } from '@/lib/dify';
import { browserVerified } from '@/lib/bot-protection';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function configuration() {
  let difyUrlValid = false;
  try {
    const url = new URL(process.env.DIFY_API_URL || 'https://api.dify.ai/v1');
    difyUrlValid = url.protocol === 'https:' && !url.username && !url.password && !url.search && !url.hash;
  } catch {}
  return {
    difyKeyPresent: !!process.env.DIFY_API_KEY?.trim(),
    difyUrlValid,
    sessionSecretValid: (process.env.SESSION_SECRET?.length || 0) >= 32,
  };
}

// Readiness only: no external calls, values, cookies, request headers or secrets in this response.
export function GET() {
  const checks = configuration();
  const ready = Object.values(checks).every(Boolean);
  return NextResponse.json({ service: 'rightstart', ready, checks,
    nodeMajor: Number(process.versions.node.split('.')[0]),
    botIdEnabled: process.env.VERCEL === '1',
  }, {
    status: ready ? 200 : 503, headers: noStore,
  });
}

// Optional admin bearer token works even when a broken SESSION_SECRET prevents login.
// Otherwise, require an authorized same-origin browser session and the existing bot guard.
export async function POST(request: Request) {
  const token = process.env.HEALTHCHECK_TOKEN?.trim();
  const bearer = request.headers.get('authorization')?.replace(/^Bearer /, '');
  const admin = !!token && token.length >= 32 && !!bearer && same(token, bearer);
  if (!admin) {
    if (!originAllowed(request))
      return NextResponse.json({ error: '请求来源验证失败。' }, { status: 403, headers: noStore });
    try {
      if (!(await session())?.authorized || !(await browserVerified()))
        return NextResponse.json({ error: '需要已验证的会话。' }, { status: 401, headers: noStore });
    } catch {
      return NextResponse.json({ error: '会话配置尚未完成，请先检查 GET /api/health。' }, { status: 503, headers: noStore });
    }
  }
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'local';
  if (!allowed(`health:${ip}`, 2))
    return NextResponse.json({ error: '检查频率受限。' }, { status: 429, headers: { ...noStore, 'Retry-After': '60' } });
  if (!Object.values(configuration()).every(Boolean)) return GET();
  try {
    const { url, headers } = difyConfig();
    const checks = await Promise.all(['info', 'parameters'].map(async (endpoint) => {
      const response = await fetch(`${url}/${endpoint}`, {
        headers, cache: 'no-store', redirect: 'error', signal: AbortSignal.timeout(12000),
      });
      // Return only diagnostics, never upstream text, prompts, authorization headers or variables.
      if (!response.ok) return { endpoint, httpStatus: response.status, ok: false };
      const body = await response.json();
      return { endpoint, httpStatus: response.status, ok: true,
        ...(endpoint === 'info' ? { chatflow: body.mode === 'advanced-chat' } :
          { requiredInputs: Array.isArray(body.user_input_form) && body.user_input_form.some(
            (item: Record<string, unknown>) => Object.values(item).some((v) => v && typeof v === 'object' && (v as { required?: boolean }).required),
          ) }),
      };
    }));
    const ok = checks.every((c) => c.ok);
    return NextResponse.json({ reachable: true, checks }, { status: ok ? 200 : 502, headers: noStore });
  } catch {
    return NextResponse.json({ reachable: false, error: 'Dify 网络连接、TLS、返回格式或超时异常。' }, { status: 502, headers: noStore });
  }
}
