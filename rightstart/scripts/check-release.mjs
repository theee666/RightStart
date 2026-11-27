import { existsSync, readFileSync, readdirSync, realpathSync, writeFileSync, mkdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const output = path.join(root, '.work', 'release-files.txt');
const rootFiles = [
  'AGENTS.md', '.env.example', '.gitignore', '.prettierrc.json', '.vercelignore',
  'next.config.ts', 'package.json', 'package-lock.json', 'postcss.config.mjs',
  'README.md', 'tsconfig.json', 'tsconfig.tests.json', 'vercel.json',
];
const candidates = [...rootFiles];
for (const dir of ['src', 'scripts', 'tests', 'docs']) {
  const walk = (relative) => {
    const absolute = path.join(root, relative);
    if (realpathSync(absolute) !== absolute) throw new Error(`Refusing symlink: ${relative}`);
    for (const entry of readdirSync(absolute, { withFileTypes: true })) {
      if (entry.name === '__pycache__' || entry.name.endsWith('.pyc')) continue;
      const next = path.posix.join(relative.replaceAll(path.sep, '/'), entry.name);
      if (entry.isSymbolicLink()) throw new Error(`Refusing symlink: ${next}`);
      if (entry.isDirectory()) walk(next);
      else if (entry.isFile()) candidates.push(next);
    }
  };
  walk(dir);
}

const files = [...new Set(candidates)].filter((relative) => existsSync(path.join(root, relative)));
const secretNames = ['DIFY_API_KEY', 'SESSION_SECRET', 'SITE_ACCESS_CODE', 'HEALTHCHECK_TOKEN', 'VERCEL_TOKEN', 'GITHUB_TOKEN', 'GH_TOKEN'];
const secrets = new Set(secretNames.map((name) => process.env[name]?.trim()).filter((value) => value && value.length >= 8));
const envPath = path.join(root, '.env.local');
if (existsSync(envPath)) {
  for (const line of readFileSync(envPath, 'utf8').split(/\r?\n/)) {
    const match = line.match(/^\s*(DIFY_API_KEY|SESSION_SECRET|SITE_ACCESS_CODE|HEALTHCHECK_TOKEN)\s*=\s*(.*?)\s*$/);
    const value = match?.[2]?.replace(/^(['"])(.*)\1$/, '$2');
    if (value && value.length >= 8) secrets.add(value);
  }
}

const scanFiles = [...files.map((relative) => path.join(root, relative))];
const publicDir = path.join(root, '.next', 'static');
if (existsSync(publicDir)) {
  const walkStatic = (absolute) => {
    for (const entry of readdirSync(absolute, { withFileTypes: true })) {
      const full = path.join(absolute, entry.name);
      if (entry.isDirectory()) walkStatic(full);
      else if (entry.isFile()) scanFiles.push(full);
    }
  };
  walkStatic(publicDir);
}

const leaks = [];
for (const filename of scanFiles) {
  const content = readFileSync(filename);
  for (const secret of secrets) if (content.includes(Buffer.from(secret))) leaks.push(path.relative(root, filename));
}
if (leaks.length) throw new Error(`Secret scan failed in ${[...new Set(leaks)].join(', ')}`);

mkdirSync(path.dirname(output), { recursive: true });
writeFileSync(output, `${files.map((file) => file.replaceAll('\\', '/')).join('\n')}\n`, 'utf8');
console.log(`Release manifest ready: ${files.length} files. Secret scan passed; .env.local, .work, DIFY_TXT, build output and original documents excluded.`);
