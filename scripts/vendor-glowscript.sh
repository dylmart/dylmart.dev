#!/usr/bin/env bash
# Vendor the GlowScript 3.2 runtime (MIT) at a pinned upstream commit.
set -euo pipefail
cd "$(dirname "$0")/.."
SHA=c0c969825a33
RAW="https://raw.githubusercontent.com/vpython/glowscript/$SHA"
DEST=public/glowscript/3.2
mkdir -p "$DEST"
curl -fsSL "$RAW/lib/jquery/2.1/jquery.min.js"           -o "$DEST/jquery.min.js"
curl -fsSL "$RAW/lib/jquery/2.1/jquery-ui.custom.min.js" -o "$DEST/jquery-ui.custom.min.js"
curl -fsSL "$RAW/css/redmond/2.1/jquery-ui.custom.css"   -o "$DEST/jquery-ui.custom.css"
curl -fsSL "$RAW/css/ide.css"                            -o "$DEST/ide.css"
curl -fsSL "$RAW/package/glow.3.2.min.js"                -o "$DEST/glow.3.2.min.js"
curl -fsSL "$RAW/package/RSrun.3.2.min.js"               -o "$DEST/RSrun.3.2.min.js"
curl -fsSL "$RAW/LICENSE.txt"                            -o "$DEST/LICENSE.txt"
# Compiler is a BUILD tool only — keep it out of public/
mkdir -p vendor
curl -fsSL "$RAW/package/RScompiler.3.2.min.js"          -o "vendor/RScompiler.3.2.min.js"
ls -la "$DEST" vendor
