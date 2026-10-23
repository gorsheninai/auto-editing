#!/bin/bash
# usage: tools/render.sh <project_dir> <out.mp4> [--3d]
# композиция: COMP=Story tools/render.sh … (по умолчанию Reel — ручные сцены из Scenes.tsx)
cd "$1"
EXTRA=""; [ "$3" == "--3d" ] && EXTRA="--gl=swangle --timeout=120000"
ENTRY=src/index.ts; [ "$COMP" == "Story" ] && [ -f src/story/entry.ts ] && ENTRY=src/story/entry.ts  # Story — отдельная точка входа
# прогресс рендера — сотни строк; в чат идёт только итог, полный лог в render.log
npx remotion render $ENTRY "${COMP:-Reel}" "$2" \
  --browser-executable=/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell \
  --concurrency=2 --codec=h264 --crf=18 $EXTRA > render.log 2>&1
code=$?
grep -iE "error|warn" render.log | tail -15
tail -3 render.log
exit $code
