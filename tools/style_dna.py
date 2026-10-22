#!/usr/bin/env python3
"""Стиль монтажа тремя слоями — сравнением референсов между собой, а не усреднением.

python3 tools/style_dna.py work/an*/report.json -o dna_raw.json [--timeline]

ЯДРО — параметры, которые у всех референсов почти совпадают (разброс мал): по ним стиль узнаётся, держать всегда.
ПРИЁМЫ — что встречается не везде или по-разному: каждый приём с частотой, местом в ролике (хук / середина / финал)
         и словами, на которые он пришёлся (по ним Claude пишет правило «когда»).
СТРУКТУРА — как устроен ролик во времени: хук (первые 3 с), середина, финал (последние 12 %): плотность склеек,
         доля вставок, какие приёмы где; диапазоны длин планов (p25–p75), а не одна точка.
--timeline печатает ленту событий каждого референса со словами — для чтения глазами.
Текстовые правила «когда», названия и коды блоков дописываются в dna.json (см. tools/dna_text.py).
"""
import json, sys, collections
import numpy as np

HOOK_S, FINAL_SHARE = 3.0, 0.12
INSERT = ('broll', 'graphic', 'screenshot', 'card_black', 'card_white', 'person')

def words_at(r, t, a=0.3, b=1.2):
    return ' '.join(w['w'].lower() for w in r.get('words', []) if t - a <= w['s'] <= t + b)

def part(r, t):
    if t < HOOK_S: return 'hook'
    if t > r['duration'] * (1 - FINAL_SHARE): return 'final'
    return 'middle'

def events(r):
    """Все приёмы ролика: время, приём, подробность, слова."""
    ev = []
    sh = r['shots']
    for i, s in enumerate(sh):
        if s['type'] in INSERT: ev.append((s['s'], f"insert_{s['type']}", f"{s['len']:.2f}s"))
        if s.get('bw'): ev.append((s['s'], 'bw', s['type']))
        if i and s['type'] == 'speaker' and sh[i - 1]['type'] == 'speaker' and s.get('face') and sh[i - 1].get('face'):
            k = s['face']['h'] / max(1e-3, sh[i - 1]['face']['h'])
            if k > 1.15 or k < 1 / 1.15: ev.append((s['s'], 'crop_in' if k > 1 else 'crop_out', f'x{k:.2f}'))
        cam = s.get('camera') or {}
        if abs(cam.get('zoom_per_s') or 0) > 0.012: ev.append((s['s'], 'cam_zoom', f"{cam['zoom_per_s']:+.3f}/s {s['type']}"))
    for b in r['rhythm'].get('bursts', []): ev.append((b['s'], 'burst', f"{b['n']} кадров по {b['avg_len']:.2f}s"))
    for tr in r['transitions']['list']:
        if tr['type'] != 'hard': ev.append((tr['t'], f"tr_{tr['type']}", f"{tr['frames']} кадр."))
    sub_y = r['text']['subtitle'].get('y_rel_median') or 0.6
    for t in r['text'].get('titles', []):
        key = abs(t['y_rel'] - sub_y) < 0.08 and t['words'] <= 1 and t['dur'] < 1.0
        anim = (t.get('anim_in') or {}).get('kind', '?')
        ev.append((t['t_in'], 'keyword' if key else 'title', f"«{t['text']}» {(t.get('xh_px') or t.get('h_px') or 0):.0f}px {anim}"))
    for x in r['audio'].get('sfx', []):
        nxt = next((s['type'] for s in sh if s['s'] >= x['t'] - 0.1), '?')
        ev.append((x['t'], f"sfx_{x['kind']}", f"{x['level_rel_voice_db']:+.0f}dB {'на склейке→' + nxt if x['on_cut'] else 'не на склейке'}"))
    ev.sort()
    # слить заголовки, идущие подряд (одна надпись из нескольких слов)
    out = []
    for e in ev:
        if out and e[1] == 'title' and out[-1][1] == 'title' and e[0] - out[-1][0] < 0.6:
            out[-1] = (out[-1][0], 'title', out[-1][2] + ' + ' + e[2]); continue
        out.append(e)
    return [{'t': round(t, 2), 'kind': k, 'info': i, 'part': part(r, t), 'words': words_at(r, t)} for t, k, i in out]

def core_params(r):
    sh = r['shots']; sub = r['text']['subtitle']; g = r['grade_speaker']; a = r['audio']
    sp = [s for s in sh if s['type'] == 'speaker']; ins = [s for s in sh if s['type'] != 'speaker']
    anim = collections.Counter(sub.get('anim') or []).most_common(1)
    return {
        'грейд: яркость спикера': g['L'], 'грейд: контраст': g['C'], 'грейд: насыщенность': g['S'],
        'грейд: тёплые света': g['warm_hi'], 'грейд: виньетка (меньше — темнее углы)': g['vign'], 'грейд: зерно': g['grain'],
        'ч/б планов, доля': sum(1 for s in sh if s.get('bw')) / max(1, len(sh)),
        'спикер: доля времени': r['composition']['speaker_share'], 'спикер: размер лица': r['composition']['speaker_face_h_median'],
        'склеек в минуту': r['rhythm']['cuts_per_min'], 'жёстких склеек, доля': r['transitions']['share'].get('hard', 0),
        'склейка на начале слова, доля': r['rhythm'].get('cut_on_word_share'),
        'план спикера, с': float(np.median([s['len'] for s in sp])) if sp else None,
        'вставка, с': float(np.median([s['len'] for s in ins])) if ins else None,
        'субтитр: высота строчных, px': float(np.median([e['xh_px'] for e in r['text']['events'] if e['role'] == 'subtitle' and e.get('xh_px')] or [0])) or None,
        'субтитр: высота на экране (0 верх, 1 низ)': sub.get('y_rel_median'), 'субтитр: слов на экране': sub.get('words_median'),
        'субтитр: регистр': sub.get('case'), 'субтитр: появление': anim[0][0] if anim else None,
        'громкость, LUFS': a.get('lufs'), 'подложка под голосом': 'есть' if a.get('music_likely') else 'нет',
        'эффектов в минуту': a.get('sfx_per_min'), 'темп речи, слов/мин': (a.get('speech') or {}).get('wpm'),
    }

def ranges(reps):
    sp = sum([[s['len'] for s in r['shots'] if s['type'] == 'speaker'] for r in reps], [])
    ins = sum([[s['len'] for s in r['shots'] if s['type'] != 'speaker'] for r in reps], [])
    q = lambda x: [round(float(np.percentile(x, 25)), 2), round(float(np.percentile(x, 75)), 2)] if x else None
    return {'план спикера, с (p25–p75)': q(sp), 'вставка, с (p25–p75)': q(ins)}

def structure(reps, evs):
    out = {}
    for p in ('hook', 'middle', 'final'):
        cuts, dur, ins_t, kinds = 0, 0.0, 0.0, collections.Counter()
        for r, ev in zip(reps, evs):
            a, b = {'hook': (0, HOOK_S), 'middle': (HOOK_S, r['duration'] * (1 - FINAL_SHARE)), 'final': (r['duration'] * (1 - FINAL_SHARE), r['duration'])}[p]
            dur += b - a; cuts += sum(1 for c in r['rhythm']['cuts'] if a <= c < b)
            ins_t += sum(max(0, min(b, s['e']) - max(a, s['s'])) for s in r['shots'] if s['type'] != 'speaker')
            kinds.update(e['kind'] for e in ev if e['part'] == p)
        out[p] = {'склеек в минуту': round(60 * cuts / max(dur, 1e-3), 1), 'доля вставок': round(ins_t / max(dur, 1e-3), 2),
                  'приёмы (всего по референсам)': dict(kinds.most_common())}
    out['начало'] = [r['shots'][0]['type'] for r in reps]; out['конец'] = [r['shots'][-1]['type'] for r in reps]
    return out

def main():
    a = sys.argv[1:]; out = a[a.index('-o') + 1] if '-o' in a else 'dna_raw.json'
    paths = [p for p in a if p.endswith('.json') and p != out]; reps = [json.load(open(p)) for p in paths]
    evs = [events(r) for r in reps]
    # ядро: у всех референсов почти одинаково
    per = [core_params(r) for r in reps]; core, varies = {}, {}
    for k in per[0]:
        vals = [p[k] for p in per]
        if any(v is None for v in vals): continue
        if isinstance(vals[0], str):
            (core if len(set(vals)) == 1 else varies)[k] = vals; continue
        m = float(np.mean(vals)); spread = (max(vals) - min(vals)) / (abs(m) + 1e-6)
        tol = 0.35 if 'доля' in k or 'с' == k[-1] else 0.25
        (core if spread <= tol else varies)[k] = {'по референсам': [round(v, 3) for v in vals], 'середина': round(m, 3), 'разброс': round(spread, 2)}
    # приёмы: в скольких референсах есть, как часто, где
    tech = {}
    for kind in sorted({e['kind'] for ev in evs for e in ev}):
        rows = [[e for e in ev if e['kind'] == kind] for ev in evs]
        tot_min = sum(r['duration'] for r in reps) / 60
        tech[kind] = {'есть в референсах': sum(1 for x in rows if x), 'из': len(reps), 'в минуту': round(sum(map(len, rows)) / tot_min, 1),
                      'где': dict(collections.Counter(e['part'] for x in rows for e in x)),
                      'примеры': [f"{e['t']}s [{e['part']}] {e['info']} — «{e['words']}»" for x in rows for e in x[:4]][:8]}
    dna = {'refs': [r['file'] for r in reps], 'core': core, 'varies': varies, 'ranges': ranges(reps), 'techniques': tech, 'structure': structure(reps, evs)}
    json.dump(dna, open(out, 'w'), ensure_ascii=False, indent=1)
    print('ЯДРО (совпадает у всех):'); [print(f'  {k}: {v}') for k, v in core.items()]
    print('МЕНЯЕТСЯ:'); [print(f'  {k}: {v}') for k, v in varies.items()]
    print('ДИАПАЗОНЫ:', dna['ranges'])
    print('ПРИЁМЫ:'); [print(f"  {k}: {v['есть в референсах']}/{v['из']}, {v['в минуту']}/мин, где {v['где']}") for k, v in tech.items()]
    print('СТРУКТУРА:', json.dumps(dna['structure'], ensure_ascii=False))
    if '--timeline' in a:
        for r, ev in zip(reps, evs):
            print(f"\n=== {r['file']} ({r['duration']} с)")
            for e in ev: print(f"  {e['t']:6.2f} {e['part']:6s} {e['kind']:18s} {e['info'][:60]:60s} «{e['words'][:60]}»")

if __name__ == '__main__':
    main()
