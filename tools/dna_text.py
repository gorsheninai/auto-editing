#!/usr/bin/env python3
"""Стиль монтажа тремя слоями: dna.json ⇄ текст, который читает и правит человек (тот же формат на пульте).

python3 tools/dna_text.py dna.json            → печатает текст
python3 tools/dna_text.py --parse стиль.txt   → печатает dna.json из текста

Формат текста — три раздела, одна строка на пункт, поля через « | »:
ЯДРО (держать всегда)
Название | правило
ПРИЁМЫ (брать по смыслу)
КОД · Название | что это | когда | как часто | длина | звук
СТРУКТУРА
Часть (где) | правило
ДИАПАЗОНЫ
спикер 1,5–4 с; вставка 0,7–2 с; серия 0,2–0,6 с
"""
import json, re, sys

SEP = ' | '

def to_text(d):
    L = [f"Стиль «{d.get('name', '')}»", '', 'ЯДРО (держать в каждом ролике)']
    L += [f"{c['name']}{SEP}{c['rule']}" for c in d['core']]
    L += ['', 'ПРИЁМЫ (брать по смыслу текста, не все сразу)']
    L += [f"{t['code']} · {t['name']}{SEP}{t['what']}{SEP}когда: {t['when']}{SEP}{t['freq']}{SEP}{t.get('len', '')}{SEP}звук: {t.get('sfx') or 'нет'}" for t in d['techniques']]
    L += ['', 'СТРУКТУРА']
    L += [f"{s['part']} ({s['span']}){SEP}{s['rule']}" for s in d['structure']]
    r = d.get('ranges') or {}
    f = lambda k: '–'.join(str(x).replace('.', ',') for x in r[k])
    L += ['', 'ДИАПАЗОНЫ', '; '.join(x for x in [r.get('speaker') and f'спикер {f("speaker")} с', r.get('insert') and f'вставка {f("insert")} с', r.get('burst') and f'серия {f("burst")} с'] if x)]
    if d.get('choices'): L += ['', 'ВЫБОР ШАБЛОНА', '; '.join(f'{k}: {v}' for k, v in d['choices'].items())]
    if d.get('varies'): L += ['', 'МЕНЯЕТСЯ ОТ РОЛИКА К РОЛИКУ', d['varies']]
    return '\n'.join(L)

def from_text(txt):
    d = {'core': [], 'techniques': [], 'structure': [], 'ranges': {}}; sec = None
    for line in txt.splitlines():
        s = line.strip()
        if not s: continue
        m = re.match(r'Стиль «(.*)»', s)
        if m: d['name'] = m.group(1); continue
        up = s.split(' (')[0].upper()
        if up in ('ЯДРО', 'ПРИЁМЫ', 'СТРУКТУРА', 'ДИАПАЗОНЫ', 'ВЫБОР ШАБЛОНА', 'МЕНЯЕТСЯ ОТ РОЛИКА К РОЛИКУ') and s.split(' (')[0].isupper(): sec = up; continue
        p = [x.strip() for x in s.split('|')]
        if sec == 'ЯДРО': d['core'].append({'name': p[0], 'rule': ' | '.join(p[1:])})
        elif sec == 'ПРИЁМЫ':
            code, _, name = p[0].partition('·')
            g = lambda i: p[i] if len(p) > i else ''
            d['techniques'].append({'code': code.strip().upper(), 'name': name.strip(), 'what': g(1), 'when': re.sub(r'^когда:\s*', '', g(2)),
                                    'freq': g(3), 'len': g(4), 'sfx': re.sub(r'^звук:\s*', '', g(5)).replace('нет', '')})
        elif sec == 'СТРУКТУРА':
            m = re.match(r'(.*?)\s*\((.*)\)$', p[0])
            d['structure'].append({'part': m.group(1) if m else p[0], 'span': m.group(2) if m else '', 'rule': ' | '.join(p[1:])})
        elif sec == 'ДИАПАЗОНЫ':
            for k, w in (('speaker', 'спикер'), ('insert', 'вставка'), ('burst', 'серия')):
                m = re.search(w + r'\s*([\d,\.]+)\s*[–-]\s*([\d,\.]+)', s)
                if m: d['ranges'][k] = [float(m.group(1).replace(',', '.')), float(m.group(2).replace(',', '.'))]
        elif sec == 'ВЫБОР ШАБЛОНА':
            d['choices'] = dict(x.split(': ', 1) for x in s.split('; ') if ': ' in x)
        elif sec == 'МЕНЯЕТСЯ ОТ РОЛИКА К РОЛИКУ': d['varies'] = (d.get('varies', '') + ' ' + s).strip()
    return d

if __name__ == '__main__':
    a = sys.argv[1:]
    if a and a[0] == '--parse': print(json.dumps(from_text(open(a[1]).read()), ensure_ascii=False, indent=1))
    elif a: print(to_text(json.load(open(a[0]))))
    else: print(__doc__)
