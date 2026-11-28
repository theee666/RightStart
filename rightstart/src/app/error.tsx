'use client';

import { PageFailure } from '@/components/page-failure';

export default function ErrorPage({ error }: { error: Error & { digest?: string } }) {
  return <PageFailure error={error} />;
}
