import type { NextConfig } from 'next';
import { createHash } from 'node:crypto';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

// Hash source/config only: never include environment variables or local secrets.
function sourceVersion() {
  const hash = createHash('sha256');
  function add(relative: string) {
    const path = join(__dirname, relative);
    if (statSync(path).isDirectory()) {
      for (const name of readdirSync(path).sort()) add(`${relative}/${name}`);
    } else {
      hash.update(relative).update('\0').update(readFileSync(path, 'utf8').replace(/\r\n/g, '\n')).update('\0');
    }
  }
  // The hosting adapter can rewrite next.config.ts during a build. Hash stable inputs instead.
  for (const file of ['src', 'edgeone.json', 'package.json', 'package-lock.json']) add(file);
  return `rs-${hash.digest('hex').slice(0, 16)}`;
}
const deploymentId = process.env.NEXT_DEPLOYMENT_ID || sourceVersion();
const config: NextConfig = {
  ...(process.env.RIGHTSTART_PORTABLE === '1' ? { output: 'standalone' as const } : {}),
  poweredByHeader: false,
  deploymentId,
  env: { NEXT_PUBLIC_BOT_PROTECTION: process.env.VERCEL === '1' ? 'true' : 'false' },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Nextjs-Deployment-Id', value: deploymentId },
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
