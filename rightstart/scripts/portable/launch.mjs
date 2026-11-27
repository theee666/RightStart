import { spawn } from 'node:child_process';
import { createServer } from 'node:net';
import { randomBytes } from 'node:crypto';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.dirname(fileURLToPath(import.meta.url));
const app = path.join(root, 'app');
const url = 'http://127.0.0.1:3000';
const configuration = path.join(app, '.env.local');
if (!existsSync(configuration)) throw new Error('Missing app/.env.local. Please extract the entire ZIP again.');
process.loadEnvFile(configuration);
// Each computer receives a new session signing key on first launch.
const secretFile = path.join(app, '.session-secret');
if (!existsSync(secretFile)) writeFileSync(secretFile, randomBytes(32).toString('hex'), { mode: 0o600 });
const sessionSecret = readFileSync(secretFile, 'utf8').trim();
if (sessionSecret.length < 32) throw new Error('Invalid app/.session-secret. Delete that file and start again.');

const probe = createServer();
try {
  await new Promise((resolve, reject) => {
    probe.once('error', reject);
    probe.listen(3000, '127.0.0.1', resolve);
  });
  await new Promise(resolve => probe.close(resolve));
} catch {
  console.error('Port 3000 is in use. Close the other local website or the previous RightStart window, then retry.');
  process.exit(1);
}

const env = { ...process.env, NODE_ENV: 'production', PORT: '3000', HOSTNAME: '127.0.0.1',
  VERCEL: '0', NEXT_TELEMETRY_DISABLED: '1', SESSION_SECRET: sessionSecret };
delete env.NODE_OPTIONS;
delete env.__NEXT_PRIVATE_STANDALONE_CONFIG;
const child = spawn(process.execPath, ['server.js'], { cwd: app, env, stdio: 'inherit', windowsHide: true });
let stopping = false;
function stop() {
  if (stopping) return;
  stopping = true;
  child.kill('SIGTERM');
}
process.on('SIGINT', stop);
process.on('SIGTERM', stop);
child.on('error', error => { console.error(error.message); process.exitCode = 1; });
child.on('exit', code => { process.exit(code ?? (stopping ? 0 : 1)); });

for (let attempt = 0; attempt < 120; attempt++) {
  if (child.exitCode !== null) break;
  try {
    const response = await fetch(`${url}/api/session`, { signal: AbortSignal.timeout(1000) });
    if (response.ok) {
      console.log(`\nRightStart is ready: ${url}/\nKeep this window open. Press Ctrl+C to stop.\n`);
      if (!process.argv.includes('--no-browser')) {
        const command = process.platform === 'win32' ? 'powershell.exe' : 'open';
        const args = process.platform === 'win32'
          ? ['-NoProfile', '-NonInteractive', '-Command', `Start-Process '${url}/'`]
          : [`${url}/`];
        const browser = spawn(command, args, { stdio: 'ignore', windowsHide: true });
        browser.on('error', () => console.log(`Open ${url}/ in your browser.`));
        browser.unref();
      }
      break;
    }
  } catch { /* Server is still starting. */ }
  if (attempt === 119) { console.error('Startup timed out. See the error above.'); stop(); process.exitCode = 1; }
  await new Promise(resolve => setTimeout(resolve, 500));
}
