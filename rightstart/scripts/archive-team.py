"""Finalize the private portable folder and preserve Mac executable permissions in ZIP."""
import hashlib
import json
import pathlib
import zipfile

root = pathlib.Path(__file__).resolve().parent.parent
folder = root / '.work' / 'RightStart-Team'
archive = folder.with_suffix('.zip')
report = folder / 'validation.json'
if not report.exists():
    raise SystemExit('Run the portable checks and write validation.json before archiving.')

# Check that local credentials have exactly the intended destination.
values = {}
for line in (root / '.env.local').read_text(encoding='utf-8-sig').splitlines():
    key, separator, value = line.partition('=')
    if separator and key in ['DIFY_API_KEY', 'SESSION_SECRET'] and len(value.strip()) >= 16:
        values[key] = value.strip().strip('"\'').encode()
for filename in folder.rglob('*'):
    if not filename.is_file():
        continue
    relative = filename.relative_to(folder).as_posix()
    if filename.is_symlink() or filename.name in ['github-token.txt', '.session-secret']:
        raise ValueError(f'Unexpected private or linked file: {relative}')
    data = filename.read_bytes()
    for name, value in values.items():
        if value in data and not (name == 'DIFY_API_KEY' and relative == 'app/.env.local'):
            raise ValueError(f'Unexpected credential destination: {relative}')

with zipfile.ZipFile(archive, 'w', compression=zipfile.ZIP_DEFLATED, compresslevel=6, allowZip64=True) as bundle:
    for filename in sorted(folder.rglob('*')):
        if not filename.is_file():
            continue
        relative = filename.relative_to(folder).as_posix()
        name = f'{folder.name}/{relative}'
        info = zipfile.ZipInfo(name)
        info.create_system = 3
        executable = relative == 'Start-Mac.command' or (relative.startswith('runtime/mac-') and filename.name == 'node')
        mode = 0o755 if executable else (0o600 if filename.name == '.env.local' else 0o644)
        info.external_attr = (0o100000 | mode) << 16
        info.compress_type = zipfile.ZIP_DEFLATED
        bundle.writestr(info, filename.read_bytes(), compress_type=zipfile.ZIP_DEFLATED, compresslevel=6)

with zipfile.ZipFile(archive) as bundle:
    assert bundle.testzip() is None, 'ZIP CRC check failed'
    for name in ['Start-Mac.command', 'runtime/mac-arm64/node', 'runtime/mac-x64/node']:
        assert (bundle.getinfo(f'{folder.name}/{name}').external_attr >> 16) & 0o111
    assert f'{folder.name}/app/.env.local' in bundle.namelist()
checksum = hashlib.sha256(archive.read_bytes()).hexdigest()
archive.with_suffix('.zip.sha256').write_text(f'{checksum}  {archive.name}\n', encoding='ascii')
print(json.dumps({'archive': archive.name, 'sizeMB': round(archive.stat().st_size / 1024 / 1024, 1),
                  'sha256': checksum, 'crcCheck': 'passed', 'macExecutablePermissions': 'passed',
                  'credentialDestinations': 'passed'}, indent=2))
