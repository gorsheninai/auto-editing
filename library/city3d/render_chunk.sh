#!/bin/bash
# render_chunk.sh a-b out.mp4 — 3D-слой 720×1280, программный рендер
cd "${REEL:-.}"
B=$(ls -d /opt/pw-browsers/chromium_headless_shell-*/*/chrome-headless-shell | tail -1)
npx remotion render work/bundle City3D "$2" --frames=$1 --browser-executable=$B --gl=swangle --timeout=120000 \
  --concurrency=2 --codec=h264 --crf=12 --props='{"sh":false,"aa":true}' > "$2.log" 2>&1
echo "code=$? $(tail -1 "$2.log")"
