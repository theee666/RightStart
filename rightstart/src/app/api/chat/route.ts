import { NextResponse } from 'next/server';
import { z } from 'zod';
import { allowed, difyConfig, getParameters, noStore, originAllowed, session } from '@/lib/dify';
import { publicDifyStream } from '@/lib/public-dify-stream';
import { browserVerified } from '@/lib/bot-protection';
export const runtime = 'nodejs';
export const maxDuration = 300;
const schema = z
  .object({
    query: z.string().trim().min(1).max(12000),
    conversation_id: z.union([z.uuid(), z.literal('')]).optional(),
  })
  .strict();
export async function POST(request: Request) {
  if (!originAllowed(request))
    return NextResponse.json({ error: '请求来源验证失败。' }, { status: 403, headers: noStore });
  try {
    const user = await session();
    if (!user?.authorized)
      return NextResponse.json({ error: '请先验证访问权限。' }, { status: 401, headers: noStore });
    if (!(await browserVerified()))
      return NextResponse.json({ error: '访问验证未通过，请刷新页面并使用正常浏览器重试。' }, { status: 403, headers: noStore });
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'local';
    if (!allowed(`chat:${user.id}`, 12) || !allowed(`ip:${ip}`, 40))
      return NextResponse.json(
        { error: '请求较频繁，请一分钟后再试。' },
        { status: 429, headers: { ...noStore, 'Retry-After': '60' } },
      );
    if (Number(request.headers.get('content-length') || 0) > 60000)
      return NextResponse.json(
        { error: '内容过长，请精简后提交。' },
        { status: 413, headers: noStore },
      );
    const text = await request.text();
    if (text.length > 16000)
      return NextResponse.json(
        { error: '内容过长，请精简后提交。' },
        { status: 413, headers: noStore },
      );
    let json;
    try {
      json = JSON.parse(text);
    } catch {
      return NextResponse.json({ error: '请求格式错误。' }, { status: 400, headers: noStore });
    }
    const parsed = schema.safeParse(json);
    if (!parsed.success)
      return NextResponse.json(
        { error: '请输入 1–12000 字的问题，并使用有效会话。' },
        { status: 400, headers: noStore },
      );
    const parameters = await getParameters();
    const form = parameters.user_input_form;
    if (
      Array.isArray(form) &&
      form.some((item) =>
        Object.values(item as Record<string, unknown>).some(
          (v) => v && typeof v === 'object' && (v as { required?: boolean }).required,
        ),
      )
    )
      return NextResponse.json(
        { error: '线上应用新增了必填变量，与当前工作流包不一致，请管理员重新核对参数。' },
        { status: 409, headers: noStore },
      );
    const { url, headers } = difyConfig();
    const response = await fetch(`${url}/chat-messages`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        inputs: {},
        query: parsed.data.query,
        response_mode: 'streaming',
        user: `rightstart-${user.id}`,
        conversation_id: parsed.data.conversation_id || '',
        auto_generate_name: false,
      }),
      signal: AbortSignal.any([request.signal, AbortSignal.timeout(270000)]),
      cache: 'no-store',
    });
    if (!response.ok || !response.body) {
      const error =
        response.status === 401
          ? 'Dify 密钥无效，请联系项目管理员。'
          : response.status === 429
            ? 'AI 服务额度或频率受限，请稍后再试。'
            : response.status === 404
              ? '对话已不可用，请新建会话。'
              : 'AI 服务暂时不可用，请稍后重试。';
      return NextResponse.json(
        { error },
        { status: response.status === 429 ? 429 : 502, headers: noStore },
      );
    }
    if (!response.headers.get('content-type')?.includes('text/event-stream'))
      return NextResponse.json(
        { error: 'Dify 未返回预期的流式数据，请检查应用配置。' },
        { status: 502, headers: noStore },
      );
    return new Response(publicDifyStream(response.body), {
      headers: {
        ...noStore,
        'Content-Type': 'text/event-stream; charset=utf-8',
        'X-Accel-Buffering': 'no',
      },
    });
  } catch (error) {
    const message =
      error instanceof Error && /配置|密钥|应用配置|HTTPS/.test(error.message)
        ? error.message
        : 'AI 连接中断或超时，请稍后重试。';
    return NextResponse.json({ error: message }, { status: 503, headers: noStore });
  }
}
