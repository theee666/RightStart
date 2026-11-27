'use client';

import type { AnchorHTMLAttributes } from 'react';

const warmed = new Set<string>();

function warmArticle(href: string) {
  // Only public article documents; no API calls, user questions, or automatic retry loops.
  if (!/^\/knowledge\/[a-z0-9-]+$/.test(href) || warmed.has(href) || warmed.size >= 8) return;
  const connection = (navigator as Navigator & { connection?: { saveData?: boolean; effectiveType?: string } }).connection;
  if (connection?.saveData || /(^|-)2g$/.test(connection?.effectiveType || '')) return;
  warmed.add(href);
  const link = document.createElement('link');
  link.rel = 'prefetch';
  link.as = 'document';
  link.href = href;
  document.head.appendChild(link);
}

/** Public policy documents use the browser's document cache, avoiding the broken RSC prefetch path. */
export function ArticleLink({ href = '', onPointerEnter, onFocus, onTouchStart, ...props }: AnchorHTMLAttributes<HTMLAnchorElement>) {
  return (
    <a
      {...props}
      href={href}
      onPointerEnter={(e) => { onPointerEnter?.(e); warmArticle(href); }}
      onFocus={(e) => { onFocus?.(e); warmArticle(href); }}
      onTouchStart={(e) => { onTouchStart?.(e); warmArticle(href); }}
    />
  );
}
