#!/bin/bash
# Ставит всё, что нужно для подготовки и рендера ролика. Повторный запуск — секунда.
# bash tools/setup.sh        (reel_prep и reel_go вызывают его сами)
# bash tools/setup.sh --force
set -e
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
MARK="$HOME/.reel_setup_ok"
SIG="$(md5sum "$0" | cut -c1-12)"
if [[ "$1" != "--force" && -f "$MARK" && "$(cat "$MARK")" == "$SIG" && -d "$ROOT/template/node_modules" ]]; then
  echo "setup: всё уже стоит"; exit 0
fi
log(){ echo "setup: $*"; }

# 1. Python-модули (ставятся только недостающие)
need=()
chk(){ python3 -c "import $1" 2>/dev/null || need+=("$2"); }
chk numpy numpy
chk PIL pillow
chk scipy scipy
chk cv2 opencv-python-headless
chk onnxruntime onnxruntime
chk rembg rembg
chk librosa librosa
chk sherpa_onnx sherpa-onnx
if (( ${#need[@]} )); then
  log "ставлю ${need[*]}"
  python3 -m pip install -q --break-system-packages "${need[@]}" 2>&1 | grep -v -i "warning\|notice" | tail -3 || true
fi

# 2. Модель распознавания речи (tools/asr.py)
ASR="$HOME/asr/sherpa-onnx-zipformer-ru-2024-09-18"
if [[ ! -f "$ASR/tokens.txt" ]]; then
  log "качаю модель распознавания речи"
  mkdir -p "$HOME/asr" && cd "$HOME/asr"
  curl -sSL -o zf.tar.bz2 https://github.com/k2-fsa/sherpa-onnx/releases/download/asr-models/sherpa-onnx-zipformer-ru-2024-09-18.tar.bz2
  tar xjf zf.tar.bz2 && rm -f zf.tar.bz2
  cd "$ROOT"
fi

# 3. Модели вырезки фона (предметы и спикер)
python3 - <<'E' 2>&1 | grep -v -i "warn\|download\|%" | tail -2 || true
import contextlib, io
from rembg import new_session
with contextlib.redirect_stderr(io.StringIO()), contextlib.redirect_stdout(io.StringIO()):
    for m in ('isnet-general-use', 'u2net_human_seg'): new_session(m)
E

# 4. Пакеты Remotion (общие для всех роликов)
if [[ ! -d "$ROOT/template/node_modules" ]]; then
  log "npm ci в template"
  (cd "$ROOT/template" && npm ci --no-audit --no-fund --loglevel=error 2>&1 | tail -3)
fi

# проверка
python3 -c "import numpy, PIL, scipy, cv2, rembg, librosa, sherpa_onnx" && command -v ffmpeg >/dev/null && command -v node >/dev/null
echo "$SIG" > "$MARK"
log "готово"
