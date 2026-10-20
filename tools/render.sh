#!/bin/bash
# usage: tools/render.sh <project_dir> <out.mp4> [--3d]
# композиция: COMP=Story tools/render.sh … (по умолчанию Reel — ручные сцены из Scenes.tsx)
cd "$1"
EXTRA=""; [ "$3" == "--3d" ] && EXTRA="--gl=swangle --timeout=120000"
npx remotion render src/index.ts "${COMP:-Reel}" "$2" \
  --browser-executable=/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell \
  --concurrency=2 --codec=h264 --crf=18 $EXTRA
