#!/usr/bin/env python3
"""Собирает library/INDEX.md — короткий указатель по library/CATALOG.md: раздел, код, суть в одну строку.
Запускать после каждой правки CATALOG.md:  python3 tools/catalog_index.py"""
import pathlib, re
HEAD = {'Код', 'Имя', 'Сцена', 'Ролик', 'Code'}
root = pathlib.Path(__file__).resolve().parent.parent
src = (root / 'library' / 'CATALOG.md').read_text(encoding='utf-8').splitlines()
out = ['# Указатель блоков (собран из CATALOG.md скриптом tools/catalog_index.py — руками не править)',
       'Полное описание и формат записи блока: Grep по коду в library/CATALOG.md.', '']
for line in src:
    if line.startswith('#'):
        out.append('#' + line.split(' (')[0] if line.startswith('##') else line); continue
    if not line.startswith('|'): continue
    cells = [c.strip().strip('`') for c in line.strip().strip('|').split('|')]
    if len(cells) < 2 or set(cells[1]) <= set('-: ') or cells[0] in HEAD: continue
    cut = lambda t, n: (t[:n].rstrip() + '…') if len(t) > n else t
    when = f' · для: {cut(cells[2], 45)}' if len(cells) > 2 and cells[2] else ''
    out.append(f'- {cells[0]} — {cut(cells[1], 60)}{when}')
(root / 'library' / 'INDEX.md').write_text('\n'.join(out) + '\n', encoding='utf-8')
print('library/INDEX.md:', sum(1 for l in out if l.startswith('- ')), 'блоков')
