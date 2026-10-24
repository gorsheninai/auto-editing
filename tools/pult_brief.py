#!/usr/bin/env python3
"""Короткая выжимка проекта или шаблона пульта для чата вместо чтения JSON целиком.

  ArtifactData get projects/<id> с out_dir=work/db  →  python3 tools/pult_brief.py work/db/projects/<id>.json
  --full ПОЛЕ  — вывести одно поле целиком (например --full styleAnalysis)

Большие поля (gptPrompt, assetPlan, words, segs, sbRows, refs) не печатаются: скрипты (pult_to_story.py и др.)
читают их из файла сами. Печатается только то, что нужно для решений.
"""
import json, sys

def unwrap(d):
    while isinstance(d, dict) and 'data' in d and isinstance(d['data'], (dict, list)) and len(d) <= 3: d = d['data']
    return d

HEAVY = {'gptPrompt', 'assetPlan', 'words', 'segs', 'sbRows', 'refs', 'storyboard', 'spec', 'timing', 'mediaList', 'mediaPack', 'stylePacks'}
LONG = {'script': 4000, 'styleAnalysis': 1500, 'dna': 1500, 'rules': 2500, 'recipe': 800, 'passport': 600}

a = sys.argv[1:]
if not a: sys.exit(__doc__)
d = unwrap(json.load(open(a[0], encoding='utf-8')))
if '--full' in a:
    v = d.get(a[a.index('--full') + 1]); print(v if isinstance(v, str) else json.dumps(v, ensure_ascii=False, indent=1)); sys.exit()
def short(v, n):
    s = v if isinstance(v, str) else json.dumps(v, ensure_ascii=False)
    return s if len(s) <= n else s[:n] + f' …[ещё {len(s) - n} симв., --full]'
pk = d.get('mediaPack') or {}
if pk.get('parts'): print(f"пакет материалов: части {', '.join(pk['parts'])}; файлов {len(pk.get('files') or [])}; не вошло: {'; '.join(pk.get('skipped') or []) or 'нет'}")
for k, v in d.items():
    if v in (None, '', [], {}): continue
    if k in HEAVY:
        n = len(v) if isinstance(v, (list, dict)) else len(str(v))
        print(f'{k}: [{n} {"эл." if isinstance(v,(list,dict)) else "симв."} — в файле]'); continue
    print(f'{k}: {short(v, LONG.get(k, 300))}')
rows = d.get('sbRows') or []
if rows:
    print(f'\nраскадровка: {len(rows)} сегментов')
    for i, r in enumerate(rows):
        if isinstance(r, dict):
            print(f"{i+1}. {r.get('mode','?')} {r.get('kind','')} — {short(r.get('note') or r.get('text') or '', 110)}")
