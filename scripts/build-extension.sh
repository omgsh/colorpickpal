#!/usr/bin/env bash
# Build extension/ → public/color-picker-pro.zip
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
SRC="$ROOT/extension"
OUT="$ROOT/public/color-picker-pro.zip"

mkdir -p "$ROOT/public"
rm -f "$OUT"
( cd "$SRC" && nix run nixpkgs#zip -- -r "$OUT" . >/dev/null )

echo "Built $OUT"
