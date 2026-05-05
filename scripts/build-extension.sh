#!/usr/bin/env bash
# Build extension/ → public/color-picker-pro.zip
# Substitutes WEB_APP_URL and VERIFY_ENDPOINT placeholders into popup.js.
set -euo pipefail

WEB_APP_URL="${WEB_APP_URL:-https://id-preview--166a2656-f064-47e5-88cf-5022855244cc.lovable.app}"
VERIFY_ENDPOINT="${VERIFY_ENDPOINT:-https://eyzktcbgdndrlnqygjky.supabase.co/functions/v1/verify-license}"

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
SRC="$ROOT/extension"
BUILD="$ROOT/.extension-build"
OUT="$ROOT/public/color-picker-pro.zip"

rm -rf "$BUILD"
mkdir -p "$BUILD"
cp -r "$SRC"/* "$BUILD"/

# Substitute placeholders
sed -i "s|__WEB_APP_URL__|$WEB_APP_URL|g" "$BUILD/popup.js"
sed -i "s|__VERIFY_ENDPOINT__|$VERIFY_ENDPOINT|g" "$BUILD/popup.js"

mkdir -p "$ROOT/public"
rm -f "$OUT"
( cd "$BUILD" && nix run nixpkgs#zip -- -r "$OUT" . >/dev/null )

rm -rf "$BUILD"
echo "Built $OUT"
