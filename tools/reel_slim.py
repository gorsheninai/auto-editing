#!/usr/bin/env python3
"""Убирает из папки ролика файлы, которые точно совпадают с template/ (копии шаблона).

  python3 tools/reel_slim.py reels/NN-name      — удалить копии (после рендера, перед коммитом)
  python3 tools/reel_slim.py reels/NN-name --restore — вернуть шаблон в папку, не трогая свои файлы ролика
  python3 tools/reel_slim.py --all              — пройти все ролики

Свои файлы ролика (story.json, свои сцены, изменённые блоки) остаются. Восстановленный ролик
собирается так же, как раньше: файлы, совпадавшие с шаблоном, и сейчас совпадают с ним.
"""
import pathlib, shutil, sys

root = pathlib.Path(__file__).resolve().parent.parent
tpl = root / 'template'
SKIP = {'node_modules', '.git'}

def tpl_files():
    for p in tpl.rglob('*'):
        if p.is_file() and not SKIP & set(p.relative_to(tpl).parts):
            yield p.relative_to(tpl)

def slim(reel):
    n = size = 0
    for rel in tpl_files():
        q = reel / rel
        if q.is_file() and q.read_bytes() == (tpl / rel).read_bytes():
            size += q.stat().st_size; q.unlink(); n += 1
    for d in sorted((p for p in reel.rglob('*') if p.is_dir()), key=lambda p: -len(p.parts)):
        if not any(d.iterdir()): d.rmdir()
    print(f'{reel.name}: убрано {n} копий шаблона, {size // 1024} КБ')

def restore(reel):
    n = 0
    for rel in tpl_files():
        q = reel / rel
        if not q.exists():
            q.parent.mkdir(parents=True, exist_ok=True); shutil.copy2(tpl / rel, q); n += 1
    print(f'{reel.name}: из шаблона возвращено {n} файлов; дальше npm ci')

args = [a for a in sys.argv[1:] if not a.startswith('--')]
reels = sorted((root / 'reels').iterdir()) if '--all' in sys.argv else [pathlib.Path(a).resolve() for a in args]
if not reels: sys.exit(__doc__)
for r in reels:
    if r.is_dir(): (restore if '--restore' in sys.argv else slim)(r)
