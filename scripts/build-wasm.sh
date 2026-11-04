#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
if ! command -v emcc >/dev/null; then echo 'Emscripten (emcc) fehlt. Bitte emsdk installieren und emsdk_env.sh laden.' >&2; exit 1; fi
emcc wasm/codec.c -O3 -s STANDALONE_WASM=1 -Wl,--no-entry -Wl,--export=crc16_update -Wl,--export=xor_byte -o wasm/codec.wasm
printf 'Emscripten WASM: %s Bytes\n' "$(wc -c <wasm/codec.wasm)"
