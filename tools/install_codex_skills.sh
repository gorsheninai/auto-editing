#!/usr/bin/env bash
# Ставит навыки студии в Codex для всех папок (~/.agents/skills), а не только для этого репозитория.
# Внутри репозитория Codex и так видит .agents/skills — скрипт нужен, чтобы вызывать навыки из других проектов.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
DEST="${CODEX_SKILLS_DIR:-$HOME/.agents/skills}"
mkdir -p "$DEST"
for d in "$ROOT"/.agents/skills/*/; do
  n="$(basename "$d")"; rm -rf "$DEST/$n"; cp -r "$d" "$DEST/$n"; echo "• $n"
done
echo "Готово: навыки в $DEST. Перезапусти codex."
