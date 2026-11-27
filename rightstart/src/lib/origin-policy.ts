// Exact public origins only. Never trust arbitrary X-Forwarded-Host values or suffix matches.
export const deploymentOrigins = [
  'https://rightstart.zh-cn.edgeone.cool',
  'https://rightst.asia',
];

export function originAllowedFor(request: Request, configuredOrigins = ''): boolean {
  const value = request.headers.get('origin');
  if (!value || request.headers.get('sec-fetch-site') === 'cross-site') return false;
  try {
    const source = new URL(value);
    if (!['https:', 'http:'].includes(source.protocol) || value !== source.origin) return false;
    const trusted = [...deploymentOrigins, ...configuredOrigins.split(',').map((s) => s.trim())];
    if (trusted.some((entry) => {
      if (!entry) return false;
      try {
        const url = new URL(entry);
        return url.protocol === 'https:' && !url.username && !url.password &&
          url.pathname === '/' && !url.search && !url.hash && url.origin === source.origin;
      } catch { return false; }
    })) return true;

    // Normal direct hosting: keep the original same-origin check.
    const target = new URL(request.url);
    const host = request.headers.get('host') || target.host;
    const forwardedProtocol = request.headers.get('x-forwarded-proto')?.split(',')[0]?.trim();
    const protocol = forwardedProtocol ? `${forwardedProtocol}:` : target.protocol;
    return source.host === host && source.protocol === protocol;
  } catch { return false; }
}
