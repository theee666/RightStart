'use client';

import { useEffect } from 'react';
import { chunkRecoveryUrl, freshPageUrl } from '@/lib/chunk-recovery';

export function PageFailure({ error }: { error: Error & { digest?: string } }) {
  useEffect(() => {
    try {
      const url = chunkRecoveryUrl(error, window.location.href, window.sessionStorage);
      if (url) window.location.replace(url);
    } catch { /* Manual recovery remains available when browser storage is disabled. */ }
  }, [error]);
  return (
    <section style={{ maxWidth: 520, margin: '80px auto', padding: 28, color: '#233f60', background: '#fff', border: '1px solid #e1e7ef', borderRadius: 16, fontFamily: 'system-ui, sans-serif' }}>
      <strong style={{ fontSize: 22 }}>RightStart</strong>
      <h1 style={{ fontSize: 24, margin: '24px 0 12px' }}>页面暂时无法加载</h1>
      <p style={{ color: '#60738a', lineHeight: 1.8 }}>网络中断或网站更新可能导致页面资源加载失败。请重新加载，或返回首页继续使用。</p>
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginTop: 24 }}>
        <button onClick={() => window.location.replace(freshPageUrl(window.location.href))} style={{ border: 0, borderRadius: 8, padding: '12px 20px', background: '#233f60', color: '#fff', cursor: 'pointer', fontSize: 15 }}>重新加载页面</button>
        <button onClick={() => window.location.assign(freshPageUrl(new URL('/', window.location.href).href))} style={{ border: '1px solid #d9e1ec', borderRadius: 8, padding: '12px 20px', background: '#fff', color: '#233f60', cursor: 'pointer', fontSize: 15 }}>返回首页</button>
      </div>
    </section>
  );
}
