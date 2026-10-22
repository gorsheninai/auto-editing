#!/usr/bin/env python3
"""Сборка ролика по спецификации стиля шаблона — одной командой после pult_to_story.py.

python3 tools/spec_build.py <reel_dir> [--src исходник.mp4] [--spec style_spec.json] [--no-grade]

Нужно: <reel>/src/story.json (из pult_to_story.py) и спецификация (<reel>/style_spec.json — её пишет pult_to_story,
если у проекта есть spec; или --spec). Делает по порядку:
 1. --src: вырезает паузы без ускорения (скорость из story.json, у шаблонов со спецификацией 1.0) → public/avatar.mp4;
 2. распознаёт речь (tools/asr.py) и переносит сегменты на реальные тайминги слов — иначе рассинхрон;
 3. ритм спикера: длинные планы A режутся по началам слов на куски ≈ engine.shots.speakerMedian, крупность чередуется
    (engine.crop: base ↔ jump); хук-заголовок на первом плане, если у референсов есть заголовки;
 4. грейд спикера под референс с тоном кожи (tools/grade_match.py) → public/avatar_graded.mp4;
 5. звуки (tools/make_sfx.py) и их громкость к голосу (tools/sound_levels.py) → levels.json;
 6. tools/apply_spec.py: субтитры, ключевые слова, только жёсткие склейки, план эффектов, подложка, камера и зерно во вставках.
Дальше: рендер и замкнутая проверка (tools/ref_analyze.py out.mp4 → tools/compare_spec.py).
"""
import json, os, re, subprocess, sys, tempfile

HERE = os.path.dirname(os.path.abspath(__file__))
STOP = set('и а в на с по к о у за из от не но что это как то же ли бы я ты мы вы он она они его её их для до так уже ещё или если чтобы когда тоже там тут вот все всё очень просто'.split())
bare = lambda w: re.sub(r'[^а-яёa-z0-9-]', '', w.lower())

def run(*cmd, out=None):
    print('→', ' '.join(str(c) for c in cmd), flush=True)
    r = subprocess.run([str(c) for c in cmd], capture_output=out is not None, text=True)
    if r.returncode: sys.exit(f'ошибка: {cmd[1] if len(cmd) > 1 else cmd[0]}')
    return r.stdout if out is not None else None

def remap(rows, old, new):
    """Перенести сегменты на новые тайминги: по индексам слов (wi), иначе по ближайшему по времени слову."""
    same = len(old) == len(new)
    def idx_at(t):
        return min(range(len(old)), key=lambda i: abs(old[i]['s'] - t)) if old else 0
    for r in rows:
        a, b = r.get('wi') or [idx_at(r['s']), max(idx_at(r['s']), idx_at(r['e'] - 0.05))]
        if not same:  # число слов разошлось — переводим долей позиции
            k = len(new) / max(1, len(old)); a, b = int(a * k), min(len(new) - 1, int(round((b + 1) * k)) - 1)
        r['wi'] = [a, max(a, b)]
    rows.sort(key=lambda r: r['wi'][0])
    for i, r in enumerate(rows):
        a, b = r['wi']
        r['s'] = 0.0 if i == 0 else round(new[a]['s'], 3)
        nxt = rows[i + 1]['wi'][0] if i + 1 < len(rows) else None
        r['e'] = round(new[nxt]['s'], 3) if nxt is not None else round(new[b]['e'] + 0.3, 3)
        r['text'] = ' '.join(w['w'] for w in new[a:b + 1])

def rhythm(rows, W, E):
    """Планы спикера длиной как у референса, смена крупности на каждой склейке спикер→спикер."""
    med = E['shots'].get('speakerMedian') or 2.2; crop = E.get('crop') or {}
    base, jump = crop.get('base', 1.0), crop.get('jump', 1.0)
    out = []
    for r in rows:
        if r['mode'] != 'A' or r['e'] - r['s'] < med * 1.6:
            out.append(r); continue
        a, b = r['wi']; n = max(1, round((r['e'] - r['s']) / med)); cut = [a]
        for k in range(1, n):  # начала слов, ближайшие к равным долям; не рвать между словом и запятой-хвостом
            t = r['s'] + (r['e'] - r['s']) * k / n
            # ближе к равной доле, но склейка после знака препинания предпочтительнее (штраф 0,5 с за разрыв фразы)
            j = min(range(cut[-1] + 1, b + 1), key=lambda i: abs(W[i]['s'] - t) + (0 if re.search(r'[.,!?:;…—]$', W[i - 1]['w']) else 0.5), default=None)
            if j is not None and j > cut[-1] and j <= b: cut.append(j)
        for k, c in enumerate(cut):
            d = cut[k + 1] - 1 if k + 1 < len(cut) else b
            piece = {**{x: y for x, y in r.items() if x not in ('hook', 'stack')}, 'wi': [c, d]}
            if k == 0:
                for x in ('hook',): (x in r) and piece.update({x: r[x]})
            if k == len(cut) - 1 and 'stack' in r: piece['stack'] = r['stack']
            out.append(piece)
    # времена кусков и чередование крупности
    for i, r in enumerate(out):
        a, b = r['wi']; r['s'] = 0.0 if i == 0 else round(W[a]['s'], 3)
        r['e'] = round(W[out[i + 1]['wi'][0]]['s'], 3) if i + 1 < len(out) else round(W[b]['e'] + 0.3, 3)
        r['text'] = ' '.join(w['w'] for w in W[a:b + 1])
    prev = None   # крупность чередуется по планам спикера, вставки между ними не сбрасывают счёт (как у референсов)
    for r in out:
        if r['mode'] != 'A': continue
        r['crop'] = jump if prev == base else base
        prev = r['crop']
    return out

def trim_inserts(rows, W, E):
    """Доля спикера и длина вставок как у референса: длинная вставка оставляет ≈ insertMedian, хвост уходит спикеру."""
    ins = E['shots'].get('insertMedian') or 1.5; want = E['shots'].get('speakerShare') or 0
    total = lambda: sum(r['e'] - r['s'] for r in rows) or 1
    share = lambda: sum(r['e'] - r['s'] for r in rows if r['mode'] == 'A') / total()
    for r in sorted([r for r in rows if r['mode'] != 'A'], key=lambda r: r['s'] - r['e']):
        if share() >= want - 0.05: break
        a, b = r['wi']
        if r['e'] - r['s'] < ins * 1.6 or b <= a: continue
        cut = min(range(a + 1, b + 1), key=lambda i: abs(W[i]['s'] - (r['s'] + ins)))
        tail = {'s': W[cut]['s'], 'e': r['e'], 'mode': 'A', 'kind': 'speaker', 'wi': [cut, b], 'note': '', 'text': ''}
        r['wi'] = [a, cut - 1]; r['e'] = W[cut]['s']; rows.insert(rows.index(r) + 1, tail)
    if share() < want - 0.1:
        print(f'! доля спикера {share():.0%} при {want:.0%} у референса — в раскадровке слишком много вставок')

def hook(rows, W, spec):
    """Хук-заголовок из размытия на первом плане спикера, если у референсов есть заголовки."""
    t = (spec['engine'].get('title') or {})
    if not t.get('perMin') or not rows or rows[0]['mode'] != 'A' or rows[0].get('hook'): return
    a, b = rows[0]['wi']; ws = [bare(w['w']) for w in W[a:b + 1]]
    top = next((w for w in ws if w in STOP or len(w) <= 4), ws[0])
    big = [w for w in sorted([w for w in ws if w not in STOP and len(w) >= 4], key=len, reverse=True)[:2]]
    big = sorted(big, key=ws.index)
    if big: rows[0]['hook'] = {'top': top, 'big': big}

def main():
    a = sys.argv[1:]
    if not a: print(__doc__); sys.exit(1)
    reel = a[0]; pub = os.path.join(reel, 'public'); sp = os.path.join(reel, 'src', 'story.json')
    specp = a[a.index('--spec') + 1] if '--spec' in a else os.path.join(reel, 'style_spec.json')
    if not os.path.exists(specp): sys.exit(f'нет спецификации {specp}: у шаблона нет глубокого разбора')
    spec = json.load(open(specp)); E = spec['engine']; st = json.load(open(sp)); S = st['settings']
    # 1. вырезка пауз (скорость как в проекте; у шаблона со спецификацией — 1.0)
    av = os.path.join(pub, 'avatar.mp4')
    if '--src' in a:
        run('python3', f'{HERE}/cut_pauses.py', a[a.index('--src') + 1], av, '-38', '0.12', S.get('speed') or 1.0)
    if not os.path.exists(av): sys.exit(f'нет {av}: передай --src исходник.mp4')
    # 2. реальные тайминги слов
    old = st['words']; scr = tempfile.NamedTemporaryFile('w', suffix='.txt', delete=False); scr.write(' '.join(w['w'] for w in old)); scr.close()
    wj = os.path.join(reel, 'src', 'words.json')
    run('python3', f'{HERE}/asr.py', av, wj, '--script', scr.name)
    new = json.load(open(wj)); remap(st['rows'], old, new); st['words'] = new
    st['duration'] = round(max(new[-1]['e'] + 0.45, st['rows'][-1]['e']), 2)
    # 3. ритм и хук
    trim_inserts(st['rows'], new, E); st['rows'] = rhythm(st['rows'], new, E); hook(st['rows'], new, spec)
    json.dump(st, open(sp, 'w'), ensure_ascii=False, indent=1)
    # 4. грейд спикера
    graded = os.path.join(pub, 'avatar_graded.mp4')
    gj = os.path.splitext(av)[0] + '.grade.json'   # грейд уже подобран под эту же цель и этот же файл — не пересчитывать
    fresh = os.path.exists(graded) and os.path.exists(gj) and os.path.getmtime(graded) > os.path.getmtime(av) and \
        all(abs(json.load(open(gj))['target'].get(k, 0) - v) < 1e-6 for k, v in spec['grade_speaker'].items() if isinstance(v, (int, float)))
    if '--no-grade' not in a and not fresh: run('python3', f'{HERE}/grade_match.py', av, specp, '--apply', graded)
    # 5. звуки и громкость
    run('python3', f'{HERE}/make_sfx.py', pub)
    lv = os.path.join(reel, 'levels.json')
    open(lv, 'w').write(run('python3', f'{HERE}/sound_levels.py', av, os.path.join(pub, 'sfx'), specp, out=True))
    # 6. применить спецификацию
    cmd = ['python3', f'{HERE}/apply_spec.py', reel, specp, '--levels', lv]
    if os.path.exists(graded) and '--no-grade' not in a: cmd += ['--avatar', 'avatar_graded.mp4']
    run(*cmd)
    st = json.load(open(sp)); R = st['rows']; dur = st['duration']
    sp_share = sum(r['e'] - r['s'] for r in R if r['mode'] == 'A') / dur
    print(f"\nготово: {len(R)} планов за {dur} с, {60 * (len(R) - 1) / dur:.1f} склеек/мин (реф {spec['rhythm']['cuts_per_min']}), "
          f"доля спикера {sp_share:.0%} (реф {E['shots']['speakerShare']:.0%})")
    need = [f"{i + 1}: {r['mode']}/{r.get('kind')} «{r['text'][:40]}»" for i, r in enumerate(R) if r['mode'] != 'A' and not r.get('scene') and not r.get('media')]
    if need: print('сцены, которые нужно сделать (замены — spec.substitutes):\n  ' + '\n  '.join(need))
    print(f'дальше: COMP=Story tools/render.sh {reel} out.mp4 → tools/ref_analyze.py out.mp4 work/an_out --lang ru → tools/compare_spec.py work/an_out/report.json {specp}')

if __name__ == '__main__':
    main()
