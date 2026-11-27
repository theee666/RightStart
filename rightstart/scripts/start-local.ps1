$ErrorActionPreference = 'Stop'
Set-Location -LiteralPath (Split-Path -Parent $PSScriptRoot)
$portableNode = Join-Path (Get-Location) '.work/node-v22.23.5-win-x64'
if (-not (Test-Path -LiteralPath (Join-Path $portableNode 'node.exe'))) {
    $portableNode = Join-Path (Split-Path -Parent (Get-Location).Path) '.work/node-v22.23.5-win-x64'
}
if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
    if (-not (Test-Path -LiteralPath (Join-Path $portableNode 'node.exe'))) {
        throw 'Install Node.js 22 LTS or newer, then run npm install and npm run dev.'
    }
    $env:PATH = "$portableNode;$env:PATH"
}
$env:npm_config_cache = Join-Path (Get-Location) '.work/npm-cache'
$env:NEXT_TELEMETRY_DISABLED = '1'
if (-not (Test-Path -LiteralPath 'node_modules')) { & npm.cmd ci }
& npm.cmd run dev
