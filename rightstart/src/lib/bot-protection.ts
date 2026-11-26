import 'server-only';
import { checkBotId } from 'botid/server';

export async function browserVerified(): Promise<boolean> {
  // Local preview keeps working without Vercel's challenge infrastructure.
  if (process.env.VERCEL !== '1') return true;
  try {
    const verification = await checkBotId({ advancedOptions: { checkLevel: 'basic' } });
    return !verification.isBot;
  } catch {
    // Fail closed before any Dify request, without logging request bodies or credentials.
    return false;
  }
}
