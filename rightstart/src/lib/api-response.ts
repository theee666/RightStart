export function assertApplicationResponse(response: Response, expected: 'json' | 'stream' = 'json') {
  const contentType = response.headers.get('content-type') || '';
  if (response.headers.has('x-eop-msg')) {
    throw new Error('腾讯云预览校验未通过或已过期，请从 Makers 控制台重新打开完整预览链接；长期访问请使用已绑定的正式域名。');
  }
  if (expected === 'stream' && response.ok) {
    if (contentType.includes('text/event-stream')) return;
    throw new Error('AI 接口未返回流式数据，请检查腾讯云 API 路由与代理配置。');
  }
  if (contentType.includes('application/json')) return;
  throw new Error(`服务未返回预期的接口数据（HTTP ${response.status}）。请检查腾讯云预览权限、Next.js 全栈部署及 API 路由。`);
}
