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
import collections, json, os, re, subprocess, sys, tempfile

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

NUMW = re.compile(r'\d|^(ноль|один|одна|два|две|три|четыре|пять|шесть|семь|восемь|девять|десять|\w*надцать|двадцать|тридцать|сорок|пятьдесят|шестьдесят|семьдесят|восемьдесят|девяносто|сто|двести|триста|\w*сот|тысяч\w*|миллион\w*|миллиард\w*|полтор\w*|процент\w*)$')
PUNCT_END, PUNCT_MID = re.compile(r'[.!?…]$'), re.compile(r'[,;:—]$')

def nums(txt):
    """«1,5–2,5 с» → (1.5, 2.5)"""
    v = [float(x.replace(',', '.')) for x in re.findall(r'\d+(?:[.,]\d+)?', txt or '')]
    return (v[0], v[1]) if len(v) >= 2 else ((v[0], v[0]) if v else None)

def tech_len(dna, code, kind='insert'):
    t = next((t for t in (dna or {}).get('techniques', []) if t['code'] == code), None)
    return nums(t.get('len')) if t and nums(t.get('len')) else tuple((dna or {}).get('ranges', {}).get(kind) or (0.7, 2.0))

def pick_keys(rows, W, dna):
    """Какие слова крупно: из описания сегмента («слово» в кавычках), числа для NUM, главное слово для KEY/WORD."""
    if not dna: return
    for r in rows:
        tech = r.get('tech') or []; a, b = r['wi']; idx = list(range(a, b + 1)); keys = set()
        quoted = [bare(q) for q in re.findall(r'[«"]([^»"]+)[»"]', r.get('note', ''))]
        for q in quoted:
            for i in idx:
                if bare(W[i]['w']) and (bare(W[i]['w']) == q or (len(q) >= 5 and bare(W[i]['w'])[:5] == q[:5])): keys.add(i)
        if 'NUM' in tech: keys |= {i for i in idx if NUMW.search(bare(W[i]['w']))}
        if not keys and set(tech) & {'KEY', 'WORD', 'NUM'}:
            cand = [i for i in idx if bare(W[i]['w']) not in STOP and len(bare(W[i]['w'])) >= 4]
            if cand: keys.add(max(cand, key=lambda i: len(bare(W[i]['w']))))
        if keys: r['keys'] = sorted(keys)

def rhythm(rows, W, E, dna=None):
    """Планы спикера в диапазоне стиля, резка по фразам (конец предложения лучше запятой, запятая лучше середины);
    смена крупности на каждой склейке спикер→спикер и после вставки."""
    med = E['shots'].get('speakerMedian') or 2.2; crop = E.get('crop') or {}
    lo, hi = tuple((dna or {}).get('ranges', {}).get('speaker') or (med * 0.7, med * 1.6))
    base, jump = crop.get('base', 1.0), crop.get('jump', 1.0)
    out = []
    for r in rows:
        if r['mode'] != 'A' or r['e'] - r['s'] <= hi:
            out.append(r); continue
        a, b = r['wi']; cut = [a]; end_t = W[b]['e']
        while True:
            st = W[cut[-1]]['s']
            if end_t - st <= hi: break
            cand = [j for j in range(cut[-1] + 1, b + 1) if lo <= W[j]['s'] - st <= hi and end_t - W[j]['s'] >= lo * 0.8]
            if not cand: cand = [min(range(cut[-1] + 1, b + 1), key=lambda j: abs(W[j]['s'] - st - (lo + hi) / 2))]
            score = lambda j: (0 if PUNCT_END.search(W[j - 1]['w']) else 0.35 if PUNCT_MID.search(W[j - 1]['w']) else 1) + abs(W[j]['s'] - st - (lo + hi) / 2) / (hi - lo + 1e-6) * 0.3
            j = min(cand, key=score)
            if j <= cut[-1] or j > b: break
            cut.append(j)
        for k, c in enumerate(cut):
            d = cut[k + 1] - 1 if k + 1 < len(cut) else b
            piece = {**{x: y for x, y in r.items() if x not in ('hook', 'stack', 'keys', 'tech')}, 'wi': [c, d]}
            if k == 0 and 'hook' in r: piece['hook'] = r['hook']
            if k == len(cut) - 1 and 'stack' in r: piece['stack'] = r['stack']
            if r.get('keys'): piece['keys'] = [i for i in r['keys'] if c <= i <= d]
            if r.get('tech'): piece['tech'] = [t for t in r['tech'] if t not in ('HOOK',) or k == 0] + (['CROP'] if k else [])
            out.append(piece)
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

def trim_inserts(rows, W, E, dna=None):
    """Длина вставок по стилю: со словарём приёмов — каждая вставка не длиннее своего приёма (WORD 0,7–2 с, LIST, BURST…),
    хвост уходит спикеру; без словаря — по доле спикера референса."""
    ins = E['shots'].get('insertMedian') or 1.5; want = E['shots'].get('speakerShare') or 0
    total = lambda: sum(r['e'] - r['s'] for r in rows) or 1
    share = lambda: sum(r['e'] - r['s'] for r in rows if r['mode'] == 'A') / total()
    for r in sorted([r for r in rows if r['mode'] != 'A'], key=lambda r: r['s'] - r['e']):
        code = next((t for t in (r.get('tech') or []) if t in ('BURST', 'LIST', 'CARD', 'WORD')), 'WORD')
        lo, hi = tech_len(dna, code) if dna else (ins, ins * 1.6)
        if not dna and share() >= want - 0.05: break
        a, b = r['wi']
        if r['e'] - r['s'] <= hi or b <= a: continue
        target = r['s'] + (lo + hi) / 2 if dna else r['s'] + ins
        cut = min(range(a + 1, b + 1), key=lambda i: abs(W[i]['s'] - target) + (0 if W[i]['s'] - r['s'] <= hi else 9))
        tail = {'s': W[cut]['s'], 'e': r['e'], 'mode': 'A', 'kind': 'speaker', 'wi': [cut, b], 'note': '', 'text': ''}
        if r.get('keys'): tail['keys'] = [i for i in r['keys'] if i >= cut]; r['keys'] = [i for i in r['keys'] if i < cut]
        k = rows.index(r); nxt = rows[k + 1] if k + 1 < len(rows) else None
        r['wi'] = [a, cut - 1]; r['e'] = W[cut]['s']
        lo_sp = ((dna or {}).get('ranges', {}).get('speaker') or [1.0])[0]
        if nxt and nxt['mode'] == 'A' and tail['e'] - tail['s'] < lo_sp:   # короткий хвост не отдельным планом — присоединить к следующему плану спикера
            nxt['wi'] = [cut, nxt['wi'][1]]; nxt['s'] = tail['s']
            if tail.get('keys'): nxt['keys'] = sorted(set(nxt.get('keys') or []) | set(tail['keys']))
        else: rows.insert(k + 1, tail)
    if share() < want - 0.1:
        print(f'! доля спикера {share():.0%} при {want:.0%} у референса — в раскадровке слишком много вставок')

def hook(rows, W, spec, dna=None):
    """Хук-заголовок из размытия на первом плане спикера: по приёму HOOK из словаря (или по заголовкам референса без словаря)."""
    if dna:
        if not any(t['code'] == 'HOOK' for t in dna.get('techniques', [])): return
        r0 = next((r for r in rows if 'HOOK' in (r.get('tech') or [])), None) or (rows[0] if rows and rows[0]['mode'] == 'A' else None)
        if not r0 or r0['mode'] != 'A' or r0.get('hook') or r0['s'] > 3.0: return
    else:
        t = (spec['engine'].get('title') or {})
        if not t.get('perMin') or not rows or rows[0]['mode'] != 'A' or rows[0].get('hook'): return
        r0 = rows[0]
    a, b = r0['wi']; ws = [bare(w['w']) for w in W[a:b + 1]]
    keyw = [bare(W[i]['w']) for i in (r0.get('keys') or [])]
    top = next((w for w in ws if w in STOP or len(w) <= 4), ws[0])
    big = keyw[:2] or [w for w in sorted([w for w in ws if w not in STOP and len(w) >= 4], key=len, reverse=True)[:2]]
    big = sorted(big, key=ws.index)
    if big: r0['hook'] = {'top': top, 'big': big}; r0.setdefault('tech', []); 'HOOK' in r0['tech'] or r0['tech'].append('HOOK')

def apply_dna(sp, dna, levels):
    """После apply_spec: приёмы словаря → ключевые слова по номерам, ч/б, звуки по приёмам (а не «N в минуту»)."""
    st = json.load(open(sp)); R, S = st['rows'], st['settings']
    keys = sorted({i for r in R for i in (r.get('keys') or []) if not r.get('hook')})
    if keys: S.setdefault('subStyle', {})['keyIdx'] = keys
    for r in R:
        if 'BW' in (r.get('tech') or []): r['grade'] = 'чб'
    sfx_of = {t['code']: (t.get('sfx') or '').strip() for t in dna.get('techniques', [])}
    plan = []
    for i, r in enumerate(R):
        if i == 0: continue
        for code in r.get('tech') or []:
            k = sfx_of.get(code)
            if k in ('whoosh', 'hit'):
                plan.append({'t': round(max(0, r['s'] - (0.15 if k == 'whoosh' else 0)), 3), 'src': f'sfx/{k}.wav', 'vol': levels.get(k, 0.3)}); break
    if any(sfx_of.values()): S['sfxList'] = plan; S['sfx'] = True
    json.dump(st, open(sp, 'w'), ensure_ascii=False, indent=1)
    used = collections.Counter(c for r in R for c in (r.get('tech') or []))
    print('приёмы:', dict(used), '| крупных слов:', len(keys), '| звуков по приёмам:', len(plan))
    need = {'WORD': 'вставка-слово: сцена, картинка или видео', 'LIST': 'TxtNumberTitle', 'BURST': 'MBurst', 'CARD': 'CardWord'}
    for i, r in enumerate(R):
        for c in r.get('tech') or []:
            if c in need and r['mode'] != 'A' and not r.get('scene') and not r.get('media'):
                print(f'! {i + 1} {c} «{r["text"][:40]}» — нужна {need[c]}')
    unknown = {c for c in used if c not in sfx_of}
    if unknown: print('! коды не из словаря стиля:', unknown)

def main():
    a = sys.argv[1:]
    if not a: print(__doc__); sys.exit(1)
    reel = a[0]; pub = os.path.join(reel, 'public'); sp = os.path.join(reel, 'src', 'story.json')
    specp = a[a.index('--spec') + 1] if '--spec' in a else os.path.join(reel, 'style_spec.json')
    if not os.path.exists(specp): sys.exit(f'нет спецификации {specp}: у шаблона нет глубокого разбора')
    spec = json.load(open(specp)); E = spec['engine']; st = json.load(open(sp)); S = st['settings']
    dp = os.path.join(reel, 'style_dna.json'); dna = json.load(open(dp)) if os.path.exists(dp) else None   # стиль тремя слоями (если есть)
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
    pick_keys(st['rows'], new, dna); trim_inserts(st['rows'], new, E, dna); st['rows'] = rhythm(st['rows'], new, E, dna); hook(st['rows'], new, spec, dna)
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
    if dna: apply_dna(sp, dna, json.load(open(lv)))
    st = json.load(open(sp)); R = st['rows']; dur = st['duration']
    sp_share = sum(r['e'] - r['s'] for r in R if r['mode'] == 'A') / dur
    print(f"\nготово: {len(R)} планов за {dur} с, {60 * (len(R) - 1) / dur:.1f} склеек/мин (реф {spec['rhythm']['cuts_per_min']}), "
          f"доля спикера {sp_share:.0%} (реф {E['shots']['speakerShare']:.0%})")
    need = [f"{i + 1}: {r['mode']}/{r.get('kind')} «{r['text'][:40]}»" for i, r in enumerate(R) if r['mode'] != 'A' and not r.get('scene') and not r.get('media')]
    if need: print('сцены, которые нужно сделать (замены — spec.substitutes):\n  ' + '\n  '.join(need))
    print(f'дальше: COMP=Story tools/render.sh {reel} out.mp4 → tools/ref_analyze.py out.mp4 work/an_out --lang ru → tools/compare_dna.py {reel} out.mp4 work/an_out/report.json')

if __name__ == '__main__':
    main()
