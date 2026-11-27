'use client';

import NextLink from 'next/link';
import type { ComponentProps } from 'react';

/** EdgeOne currently returns full RSC pages for segment prefetches, causing retry loops.
 * Keep client navigation, but fetch routes on demand until the adapter supports that protocol.
 */
export default function SiteLink({ children, ...props }: ComponentProps<typeof NextLink>) {
  return (
    <NextLink {...props} prefetch={false}>
      {children}
    </NextLink>
  );
}
