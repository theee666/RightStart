type RetryStorage = { getItem(key: string): string | null; setItem(key: string, value: string): void };
const retryKey = 'rightstart:chunk-retry-at';

export function isChunkLoadFailure(error: unknown): boolean {
  const text = typeof error === 'string' ? error : error && typeof error === 'object'
    ? `${(error as { name?: unknown }).name || ''} ${(error as { message?: unknown }).message || ''}` : '';
  return /ChunkLoadError|CSS_CHUNK_LOAD_FAILED|Loading (?:CSS )?chunk .+ failed|Failed to load (?:CSS )?chunk|(?:Failed to fetch|error loading) dynamically imported module|Importing a module script failed/i.test(text);
}

export function freshPageUrl(href: string, now = Date.now()): string {
  const url = new URL(href);
  url.searchParams.set('_rs_reload', now.toString(36));
  return url.href;
}

/** Retry only broken app chunks, at most once per minute/tab. Store no message or input content. */
export function chunkRecoveryUrl(error: unknown, href: string, storage: RetryStorage, now = Date.now()): string | null {
  if (!isChunkLoadFailure(error)) return null;
  try {
    const last = Number(storage.getItem(retryKey));
    if (Number.isFinite(last) && last > 0 && last <= now && now - last < 60000) return null;
    const url = freshPageUrl(href, now);
    storage.setItem(retryKey, String(now));
    return url;
  } catch {
    // Without working tab storage, automatic reloads cannot be bounded safely.
    return null;
  }
}
