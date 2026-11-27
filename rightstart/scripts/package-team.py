"""Package an already-built standalone site with verified, portable Node runtimes.

Run with Python after RIGHTSTART_PORTABLE=1 next build.
--include-dify explicitly includes the local Dify API key in this private team bundle.
"""
import argparse
import base64
import concurrent.futures
import hashlib
import io
import json
import pathlib
import shutil
import tarfile
import urllib.request
import zipfile

root = pathlib.Path(__file__).resolve().parent.parent
parser = argparse.ArgumentParser()
parser.add_argument('--include-dify', action='store_true')
args = parser.parse_args()
output = root / '.work' / 'RightStart-Team'
cache = root / '.work' / 'portable-downloads'
cache.mkdir(parents=True, exist_ok=True)
if output.exists():
    raise SystemExit('Output already exists; choose a new output directory before repackaging.')

def download(url, destination):
    if not destination.exists():
        with urllib.request.urlopen(url, timeout=60) as response:
            destination.write_bytes(response.read())
    return destination.read_bytes()

version = '22.23.5'
base = f'https://nodejs.org/dist/v{version}'
with urllib.request.urlopen(f'{base}/SHASUMS256.txt', timeout=30) as response:
    checksums = dict(reversed(line.split()) for line in response.read().decode().splitlines() if line.strip())

def node_runtime(platform):
    archive = f'node-v{version}-{platform}.tar.gz'
    data = download(f'{base}/{archive}', cache / archive)
    if hashlib.sha256(data).hexdigest() != checksums[archive]:
        raise ValueError(f'Node checksum mismatch: {platform}')
    target = output / 'runtime' / ('mac-arm64' if platform.endswith('arm64') else 'mac-x64')
    target.mkdir(parents=True)
    with tarfile.open(fileobj=io.BytesIO(data)) as tar:
        for source, name in [('bin/node', 'node'), ('LICENSE', 'LICENSE'), ('README.md', 'README.md')]:
            member = tar.extractfile(f'node-v{version}-{platform}/{source}')
            (target / name).write_bytes(member.read())
    print(f'Verified Node.js {platform}', flush=True)

app = output / 'app'
shutil.copytree(root / '.next' / 'standalone', app)
# Never let a generated build accidentally carry credentials into an uncontrolled location.
for filename in app.glob('.env*'):
    filename.unlink()
shutil.copytree(root / '.next' / 'static', app / '.next' / 'static')
if (root / 'public').exists():
    shutil.copytree(root / 'public', app / 'public')
for item in app.rglob('*'):
    if item.is_symlink():
        raise ValueError(f'Non-portable symlink in app: {item.relative_to(app)}')

win_archive = root / '.work' / f'node-v{version}-win-x64.zip'
win_data = win_archive.read_bytes()
if hashlib.sha256(win_data).hexdigest() != checksums[win_archive.name]:
    raise ValueError('Windows Node checksum mismatch')
win = output / 'runtime' / 'win-x64'
win.mkdir(parents=True)
with zipfile.ZipFile(io.BytesIO(win_data)) as archive:
    for filename in ['node.exe', 'LICENSE', 'README.md']:
        (win / filename).write_bytes(archive.read(f'node-v{version}-win-x64/{filename}'))
print('Verified Node.js win-x64', flush=True)

sharp = json.loads((root / 'node_modules' / 'sharp' / 'package.json').read_text())
def sharp_runtime(name):
    package_version = sharp['optionalDependencies'][name]
    with urllib.request.urlopen(f'https://registry.npmjs.org/{name}/{package_version}', timeout=30) as response:
        metadata = json.load(response)
    data = download(metadata['dist']['tarball'], cache / f'{name.split("/")[-1]}-{package_version}.tgz')
    integrity = 'sha512-' + base64.b64encode(hashlib.sha512(data).digest()).decode()
    if metadata['dist']['integrity'] != integrity:
        raise ValueError(f'Package integrity mismatch: {name}')
    destination = app / 'node_modules' / name
    destination.mkdir(parents=True)
    with tarfile.open(fileobj=io.BytesIO(data)) as tar:
        for member in tar.getmembers():
            if not member.isfile():
                if not member.isdir():
                    raise ValueError('Unexpected link in downloaded package')
                continue
            relative = pathlib.PurePosixPath(member.name)
            if relative.parts[0] != 'package' or '..' in relative.parts:
                raise ValueError('Unsafe package path')
            target = destination.joinpath(*relative.parts[1:])
            target.parent.mkdir(parents=True, exist_ok=True)
            target.write_bytes(tar.extractfile(member).read())
    print(f'Verified {name}', flush=True)

with concurrent.futures.ThreadPoolExecutor(max_workers=6) as pool:
    jobs = [pool.submit(node_runtime, p) for p in ['darwin-arm64', 'darwin-x64']]
    jobs += [pool.submit(sharp_runtime, f'@img/{p}-{arch}')
             for p in ['sharp-darwin', 'sharp-libvips-darwin'] for arch in ['arm64', 'x64']]
    for job in jobs:
        job.result()

source = output / 'source'
source.mkdir()
files = ['AGENTS.md', '.env.example', '.gitignore', '.prettierrc.json', '.vercelignore',
         'next.config.ts', 'package.json', 'package-lock.json', 'postcss.config.mjs',
         'README.md', 'tsconfig.json', 'tsconfig.tests.json', 'vercel.json']
for filename in files:
    shutil.copy2(root / filename, source / filename)
for directory in ['src', 'scripts', 'tests']:
    shutil.copytree(root / directory, source / directory)
for filename in ['launch.mjs', 'Start-Windows.cmd', 'Start-Mac.command', '使用说明.txt']:
    data = (root / 'scripts' / 'portable' / filename).read_text(encoding='utf-8')
    (output / filename).write_bytes(data.replace('\r\n', '\n').encode('utf-8') if filename.endswith(('.command', '.mjs'))
                                     else data.replace('\r\n', '\n').replace('\n', '\r\n').encode('utf-8'))

configuration = {}
for line in (root / '.env.local').read_text(encoding='utf-8-sig').splitlines():
    name, separator, value = line.partition('=')
    if separator and name.strip() in ['DIFY_API_KEY', 'DIFY_API_URL']:
        configuration[name.strip()] = value.strip()
if not args.include_dify:
    configuration['DIFY_API_KEY'] = ''
(app / '.env.local').write_text('\n'.join([
    '# Private team configuration. Do not publish.',
    f'DIFY_API_KEY={configuration.get("DIFY_API_KEY", "")}',
    f'DIFY_API_URL={configuration.get("DIFY_API_URL", "https://api.dify.ai/v1")}',
    'SITE_ACCESS_CODE=', '',
]), encoding='utf-8')
print(f'Portable folder ready: {output.name}. Dify included: {args.include_dify}', flush=True)
