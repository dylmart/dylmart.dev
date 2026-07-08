#!/usr/bin/env bash
# Build and publish dylmart.dev to the home server's web root (Phase 1 parking).
set -euo pipefail
cd "$(dirname "$0")/.."

WEBROOT=/srv/http/dylmart

if [[ ! -d "$WEBROOT" || ! -w "$WEBROOT" ]]; then
  echo "ERROR: $WEBROOT missing or not writable. One-time setup (run as Dylan):"
  echo "  sudo mkdir -p $WEBROOT && sudo chown $USER: $WEBROOT"
  exit 1
fi

npm run build
[[ -n "$(ls -A dist 2>/dev/null)" ]] || { echo "ERROR: dist/ is empty, aborting deploy"; exit 1; }
rsync -a --delete dist/ "$WEBROOT"/
echo "Deployed → http://$(hostname):8099/ (tailnet/LAN)"
