'use client';

import { PageFailure } from '@/components/page-failure';

export default function GlobalError({ error }: { error: Error & { digest?: string } }) {
  return <html lang="zh-CN"><body style={{ margin: 0, padding: '1px 16px', background: '#f8fafc' }}><PageFailure error={error} /></body></html>;
}
