#!/usr/bin/env python3
"""Проверка ролика по стилю тремя слоями: ядро (цифры), приёмы (словарь, частота, без повторов подряд), структура.

python3 tools/compare_dna.py <reel_dir> <out.mp4> <work/an_out/report.json>

Ядро — цифрами через compare_spec.py (кегль субтитров — по кадрам). Приёмы и структура — по src/story.json
(какие приёмы стоят на сегментах) и style_dna.json шаблона.
"""
import json, os, re, subprocess, sys

def per_min_range(freq):
    m = re.search(r'(\d+)\s*[–-]\s*(\d+)\s*в минуту', freq or '')
    return (int(m.group(1)), int(m.group(2))) if m else None

def max_count(freq):
    m = re.search(r'(\d+)\s*[–-]\s*(\d+)\s*раз', freq or '') or re.search(r'(\d+)\s*раз', freq or '')
    return int(m.groups()[-1]) if m else None

def main():
    reel, video, report = sys.argv[1:4]
    here = os.path.dirname(os.path.abspath(__file__))
    st = json.load(open(os.path.join(reel, 'src', 'story.json'))); dna = json.load(open(os.path.join(reel, 'style_dna.json')))
    R, dur = st['rows'], st['duration']
    print('ЯДРО — цифры референсов')
    out = subprocess.run(['python3', f'{here}/compare_spec.py', report, os.path.join(reel, 'style_spec.json'), '--video', video, '--story', os.path.join(reel, 'src', 'story.json')], capture_output=True, text=True).stdout
    print('  ' + out.strip().replace('\n', '\n  '))
    rows, ok = [], 0
    def check(name, good, detail): rows.append((name, good, detail))
    vocab = {t['code']: t for t in dna['techniques']}
    used = [c for r in R for c in (r.get('tech') or [])]
    check('приёмы только из словаря стиля', all(c in vocab for c in used), ', '.join(sorted(set(used) - set(vocab))) or 'все из словаря')
    rep = [(i + 1, c) for i in range(1, len(R)) for c in (R[i].get('tech') or []) if c not in ('KEY', 'CROP') and c in (R[i - 1].get('tech') or [])]
    check('один приём не два раза подряд', not rep, '; '.join(f'{i}: {c}' for i, c in rep) or 'нет повторов')
    ins_run = [i + 1 for i in range(1, len(R)) if R[i]['mode'] != 'A' and R[i - 1]['mode'] != 'A' and 'BURST' not in (R[i].get('tech') or []) + (R[i - 1].get('tech') or [])]
    check('вставки разделены спикером (кроме серии)', not ins_run, ', '.join(map(str, ins_run)) or 'да')
    for code, t in vocab.items():
        n = used.count(code); pm = per_min_range(t.get('freq')); mx = max_count(t.get('freq'))
        if pm and dur >= 20:
            v = n / dur * 60; check(f'{code}: {t["freq"][:40]}', pm[0] * 0.5 <= v <= pm[1] * 1.5, f'{n} шт., {v:.1f}/мин')
        elif mx is not None:
            check(f'{code}: {t["freq"][:40]}', n <= mx, f'{n} шт.')
    # структура
    if 'HOOK' in vocab:
        h = next((r for r in R if r.get('hook')), None)
        check('хук в первые 3 с', bool(h) and h['s'] < 3, f"{h['s']:.1f} с" if h else 'нет хука')
    fin = [r for r in R if r['e'] > dur * 0.88]
    if any('только спикер' in s['rule'] for s in dna['structure'] if 'инал' in s['part']):
        check('финал — только спикер', all(r['mode'] == 'A' for r in fin), f"{sum(r['mode'] != 'A' for r in fin)} вставок в финале")
    rg = dna.get('ranges') or {}
    if rg.get('speaker'):
        lo, hi = rg['speaker']; sp = [r['e'] - r['s'] for r in R if r['mode'] == 'A'][1:-1] or [r['e'] - r['s'] for r in R if r['mode'] == 'A']
        share = sum(lo * 0.8 <= x <= hi * 1.1 for x in sp) / max(1, len(sp))
        check(f'план спикера {lo}–{hi} с', share >= 0.7, f'{share:.0%} планов в диапазоне')
    if rg.get('insert'):
        lo, hi = rg['insert']; ins = [r['e'] - r['s'] for r in R if r['mode'] != 'A' and not set(r.get('tech') or []) & {'BURST', 'LIST', 'CARD'}]
        if ins:
            share = sum(lo * 0.8 <= x <= hi * 1.1 for x in ins) / len(ins)
            check(f'вставка {lo}–{hi} с', share >= 0.7, f'{share:.0%} вставок в диапазоне')
    print('\nПРИЁМЫ И СТРУКТУРА')
    for name, good, detail in rows:
        ok += good; print(f'  {"✓" if good else "✗"} {name:45s} {detail}')
    print(f'  в норме {ok} из {len(rows)}')

if __name__ == '__main__':
    main()
