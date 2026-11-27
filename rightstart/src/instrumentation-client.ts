import { initBotId } from 'botid/client/core';

// Build-time, non-secret flag derived by next.config.ts from the hosting environment.
if (process.env.NEXT_PUBLIC_BOT_PROTECTION === 'true') {
  initBotId({
    protect: [
      { path: '/api/chat', method: 'POST', advancedOptions: { checkLevel: 'basic' } },
      { path: '/api/session', method: 'POST', advancedOptions: { checkLevel: 'basic' } },
    ],
  });
}
