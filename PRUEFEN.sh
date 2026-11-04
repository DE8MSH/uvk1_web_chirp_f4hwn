#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")"
echo '=== UV-K1 Web CHIRP F4HWN: Linux-Bauvoraussetzungen ==='
for tool in python3 node sha256sum; do
 if command -v "$tool" >/dev/null; then echo "[ OK ] $tool: $(command -v "$tool")"; else echo "[FEHLT] $tool" >&2; exit 1; fi
done
for file in index.html full-editor.html app.js f4hwn.js wasm/codec.c wasm/codec.wasm site.json.gz scripts/make-site.py tests/test.mjs; do
 test -s "$file" || { echo "[FEHLT] $file" >&2; exit 1; }
done
if command -v emcc >/dev/null; then echo "[ OK ] Emscripten: $(command -v emcc)";else echo '[INFO] emcc fehlt. Das mitgelieferte WASM läuft; zum Neubauen mit Emscripten emsdk installieren.';fi
node tests/test.mjs
