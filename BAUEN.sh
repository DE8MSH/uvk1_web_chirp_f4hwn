#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")"
bash PRUEFEN.sh
if command -v emcc >/dev/null; then bash scripts/build-wasm.sh;fi
python3 scripts/make-site.py
node tests/test.mjs
sha256sum site.json.gz wasm/codec.wasm
printf '\n[ OK ] index.html + site.json.gz + wasm/codec.wasm für GitHub Pages bereit.\n'
