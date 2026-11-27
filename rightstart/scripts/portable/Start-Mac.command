#!/bin/bash
cd -- "$(dirname -- "$0")" || exit 1
case "$(uname -m)" in
  arm64) runtime="runtime/mac-arm64/node" ;;
  x86_64) runtime="runtime/mac-x64/node" ;;
  *) echo "Unsupported Mac CPU."; read -r -p "Press Return to close..."; exit 1 ;;
esac
chmod u+x "$runtime"
"./$runtime" launch.mjs "$@"
result=$?
if [ "$result" -ne 0 ]; then
  echo "If macOS blocked Node, allow it in System Settings > Privacy & Security, then try again."
  read -r -p "Press Return to close..."
fi
exit "$result"
