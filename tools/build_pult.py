#!/usr/bin/env python3
"""Собирает pult/pult.html из частей pult/src/*.html (по порядку имён).

Части — это пульт, разрезанный по разделам кода, без изменений.
Править нужную часть, потом:  python3 tools/build_pult.py
и публиковать pult/pult.html как раньше (Artifact с url пульта).

--check  только проверить, что pult.html совпадает со сборкой (ничего не пишет).
"""
import pathlib, sys

root = pathlib.Path(__file__).resolve().parent.parent
src = sorted((root / 'pult' / 'src').glob('*.html'))
out = root / 'pult' / 'pult.html'
built = ''.join(p.read_text(encoding='utf-8') for p in src)

if '--check' in sys.argv:
    same = out.exists() and out.read_text(encoding='utf-8') == built
    print('pult.html совпадает со сборкой' if same else 'pult.html отличается от сборки: запусти tools/build_pult.py')
    sys.exit(0 if same else 1)

out.write_text(built, encoding='utf-8')
print(f'pult/pult.html собран из {len(src)} частей, {len(built.encode())} байт')
