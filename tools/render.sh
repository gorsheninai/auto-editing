#!/bin/bash
# usage: tools/render.sh <project_dir> <out.mp4> [--3d]
# композиция: COMP=Story tools/render.sh … (по умолчанию Reel — ручные сцены из Scenes.tsx)
cd "$1"
EXTRA=""; [ "$3" == "--3d" ] && EXTRA="--gl=swangle --timeout=120000"
ENTRY=src/index.ts; [ "$COMP" == "Story" ] && [ -f src/story/entry.ts ] && ENTRY=src/story/entry.ts  # Story — отдельная точка входа
# браузер: версия в /opt/pw-browsers меняется с образом — берём любую найденную headless_shell, иначе обычный chromium
BROWSER=$(ls -d /opt/pw-browsers/chromium_headless_shell-*/*/headless_shell /opt/pw-browsers/chromium_headless_shell-*/*/chrome-headless-shell 2>/dev/null | sort -V | tail -1)
[ -z "$BROWSER" ] && BROWSER=/opt/pw-browsers/chromium
# прогресс рендера — сотни строк; в чат идёт только итог, полный лог в render.log
npx remotion render $ENTRY "${COMP:-Reel}" "$2" \
  --browser-executable="$BROWSER" \
  --concurrency=2 --codec=h264 --crf=18 $EXTRA > render.log 2>&1
code=$?
grep -iE "error|warn" render.log | tail -15
tail -3 render.log
exit $code
