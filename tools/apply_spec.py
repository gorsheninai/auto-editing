#!/usr/bin/env python3
"""Применить спецификацию стиля к story.json: субтитры, ключевые слова, звук (план эффектов и громкости),
камера во вставках, зерно, смена крупности спикера, только жёсткие склейки, грейд спикера.

python3 tools/apply_spec.py <reel_dir> <style_spec.json> [--levels levels.json] [--avatar avatar_graded.mp4]

levels.json — вывод tools/sound_levels.py (громкость эффектов и подложки под голос этого ролика).
"""
import json, os, re, sys

STOP = set('и а в на с по к о у за из от не но что это как то же ли бы я ты мы вы он она они его её их для до так уже ещё или если чтобы когда тоже там тут вот все всё очень просто который которая которые этот эта эти'.split())
bare = lambda w: re.sub(r'[^а-яёa-z0-9]', '', w.lower())

def main():
    a = sys.argv[1:]; reel, spec = a[0], json.load(open(a[1]))
    lv = json.load(open(a[a.index('--levels') + 1])) if '--levels' in a else {}
    sp = os.path.join(reel, 'src', 'story.json'); st = json.load(open(sp)); E = spec['engine']; S = st['settings']
    W, R = st['words'], st['rows']; dur = st['duration']
    # субтитры
    sub = E['subtitle']
    S['subAnim'] = {'style': 'SubTom'}; S['subWords'] = sub.get('words', 1)
    S['subStyle'] = {'fontSize': sub['fontSize'], 'top': sub['top'], 'color': sub['color'], 'case': sub['case'], 'leadMs': sub.get('leadMs', 0), 'keyScale': E['keywords']['scale'] or 2.2}
    # ключевые слова: по частоте референса, самые «смысловые» (длинные, не служебные), равномерно, вне хука/стопки
    busy = [(r['s'], r['e']) for r in R if r.get('hook') or r.get('stack')]
    cand = [w for w in W if bare(w['w']) not in STOP and len(bare(w['w'])) >= 5 and not any(s <= w['s'] < e for s, e in busy)]
    n = max(1, round(E['keywords']['perMin'] * dur / 60))
    keys, last = [], -9.0
    for w in sorted(cand, key=lambda w: -len(bare(w['w']))):
        if len(keys) >= n: break
        if all(abs(w['s'] - k['s']) > 1.2 for k in keys): keys.append(w)
    S['subStyle']['keywords'] = [bare(k['w']) for k in sorted(keys, key=lambda k: k['s'])]
    # склейки только жёсткие, шторки выкл.
    S['wipe'] = False
    for r in R:
        r.pop('tr', None)
        if r['mode'] != 'A' and not (r.get('scene') or '').startswith(('Card', 'Txt')): r['clean'] = True  # у референсов текст только субтитром — сцены без своих подписей
    # звук: план эффектов по частоте и уровню референса
    cuts = [(r['s'], i) for i, r in enumerate(R) if i > 0]
    snd = E['sound']; sfx = []
    nw = max(1 if snd.get('whooshPerMin', 0) > 2 else 0, round(snd.get('whooshPerMin', 0) * dur / 60))
    into_insert = [c for c in cuts if R[c[1]]['mode'] == 'C' and R[c[1] - 1]['mode'] != 'C']
    for t, i in (into_insert or cuts)[:nw]: sfx.append({'t': round(max(0, t - 0.15), 3), 'src': 'sfx/whoosh.wav', 'vol': lv.get('whoosh', 0.3)})
    nh = round(snd.get('hitShare', 0) * len(cuts))
    used = {round(x['t'] + 0.15, 3) for x in sfx}
    pref = [c for c in cuts if (R[c[1]].get('stack') or R[c[1]].get('scene') in ('CardWords', 'CardWord', 'TxtNumberTitle')) and round(c[0], 3) not in used]
    for t, i in (pref + [c for c in cuts if round(c[0], 3) not in used and c not in pref])[:nh]: sfx.append({'t': round(t, 3), 'src': 'sfx/hit.wav', 'vol': lv.get('hit', 0.3)})
    S['sfxList'] = sorted(sfx, key=lambda x: x['t']); S['sfx'] = True
    if snd.get('music'): S['music'] = 'sfx/bed_kino.wav'; S['musicVolume'] = lv.get('music', 0.1)
    else: S.pop('music', None)
    # вставки: камера и зерно
    S['insertZoomPerS'] = round(max(0.004, E['insertCamera']['zoomPerS'] or 0), 4); S['insertGrain'] = 0.07 if (spec['grade_speaker'].get('grain') or 0) > 0.8 else 0
    # спикер: грейд запечён в файл, наезды выкл., ускорения нет
    if '--avatar' in a: S['avatar'] = a[a.index('--avatar') + 1]
    S['punch'] = False
    for r in R:
        if r['mode'] == 'A': r.pop('grade', None)
    json.dump(st, open(sp, 'w'), ensure_ascii=False, indent=1)
    print('ключевые:', S['subStyle']['keywords']); print('звуки:', S['sfxList']); print('подложка:', S.get('musicVolume'))

if __name__ == '__main__':
    main()
