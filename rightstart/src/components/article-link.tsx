'use client';

import type { AnchorHTMLAttributes } from 'react';
import Link from './site-link';
// Keep one navigation path. Document prefetches can retain HTML from a previous deployment.
export function ArticleLink({ href = '', ...props }: AnchorHTMLAttributes<HTMLAnchorElement>) {
  return <Link {...props} href={href} />;
}
