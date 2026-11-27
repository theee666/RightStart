'use client';

import NextLink, { useLinkStatus } from 'next/link';
import type { ComponentProps } from 'react';

function NavigationPending() {
  const { pending } = useLinkStatus();
  return pending ? (
    <span className="navigation-pending" role="status" aria-label="正在打开页面" />
  ) : null;
}

/** EdgeOne currently returns full RSC pages for segment prefetches, causing retry loops.
 * Keep client navigation, but fetch routes on demand until the adapter supports that protocol.
 */
export default function SiteLink({ children, ...props }: ComponentProps<typeof NextLink>) {
  return (
    <NextLink {...props} prefetch={false}>
      {children}
      <NavigationPending />
    </NextLink>
  );
}
