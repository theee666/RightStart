'use client';

import type { AnchorHTMLAttributes } from 'react';
import Link from './site-link';

const warmed = new Map<string, { ready: boolean }>();

function warmArticle(href: string) {
  // Only public article documents; no API calls, user questions, or automatic retry loops.
  if (!/^\/knowledge\/[a-z0-9-]+$/.test(href) || warmed.has(href) || warmed.size >= 8) return;
  const connection = (navigator as Navigator & { connection?: { saveData?: boolean; effectiveType?: string } }).connection;
  if (connection?.saveData || /(^|-)2g$/.test(connection?.effectiveType || '')) return;
  const state = { ready: false };
  warmed.set(href, state);
  const link = document.createElement('link');
  link.rel = 'prefetch';
  link.as = 'document';
  link.href = href;
  link.onload = () => { state.ready = true; };
  document.head.appendChild(link);
}

/** Prefer a ready document cache; immediate clicks retain the smaller client-navigation payload. */
export function ArticleLink({ href = '', onPointerEnter, onFocus, onTouchStart, ...props }: AnchorHTMLAttributes<HTMLAnchorElement>) {
  return (
    <Link
      {...props}
      href={href}
      onNavigate={(e) => {
        if (warmed.get(href)?.ready) {
          e.preventDefault();
          window.location.assign(href);
        }
      }}
      onPointerEnter={(e) => { onPointerEnter?.(e); warmArticle(href); }}
      onFocus={(e) => { onFocus?.(e); warmArticle(href); }}
      onTouchStart={(e) => { onTouchStart?.(e); warmArticle(href); }}
    />
  );
}
