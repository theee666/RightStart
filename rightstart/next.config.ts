import type { NextConfig } from 'next';
const config: NextConfig = {
  ...(process.env.RIGHTSTART_PORTABLE === '1' ? { output: 'standalone' as const } : {}),
  poweredByHeader: false,
  // Reuse public page payloads on repeat navigation; authenticated API responses stay no-store.
  experimental: { staleTimes: { dynamic: 300, static: 300 } },
  env: { NEXT_PUBLIC_BOT_PROTECTION: process.env.VERCEL === '1' ? 'true' : 'false' },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
        ],
      },
    ];
  },
};
export default config;
