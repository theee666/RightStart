import { chunkRecoveryUrl } from './lib/chunk-recovery';

function recover(error: unknown) {
  try {
    const url = chunkRecoveryUrl(error, window.location.href, window.sessionStorage);
    if (url) window.location.replace(url);
  } catch { /* A disabled storage API must never prevent the application from starting. */ }
}

window.addEventListener('unhandledrejection', (event) => recover(event.reason));
window.addEventListener('error', (event) => {
  const target = event.target;
  const src = target instanceof HTMLScriptElement ? target.src
    : target instanceof HTMLLinkElement && target.rel === 'stylesheet' ? target.href : '';
  if (src) {
    const url = new URL(src, window.location.href);
    if (url.origin === window.location.origin && url.pathname.startsWith('/_next/static/'))
      recover(new Error('ChunkLoadError'));
  } else if (event instanceof ErrorEvent) recover(event.error);
}, true);
