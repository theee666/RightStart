@echo off
setlocal
cd /d "%~dp0"
if not exist "runtime\win-x64\node.exe" (
  echo Runtime missing. Extract the entire ZIP before starting.
  pause
  exit /b 1
)
"runtime\win-x64\node.exe" "launch.mjs" %*
if errorlevel 1 pause
