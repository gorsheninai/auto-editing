#!/usr/bin/env python3
"""Проект пульта → src/story.json + src/words.json для композиции Story.

usage: python3 tools/pult_to_story.py project.json <reel_dir> [--anims textanims.json]

project.json — документ projects/<id> (ArtifactData get, сохранённый в файл; обёртка {data:…} допускается).
textanims.json — список документов textanims (ArtifactData list), нужен, если выбраны анимации текста.
Папка ролика с Диска (подпапки 01_персонаж … 06_мои_вставки) копируется в <reel_dir>/public/media/ как есть; файл ищется по имени в любой подпапке, расширение можно не писать.
"""
import json, os, re, sys, glob

def unwrap(d):
    while isinstance(d, dict) and 'data' in d and isinstance(d['data'], (dict, list)) and len(d) <= 3:
        d = d['data']
    return d

def main():
    a = sys.argv[1:]
    if len(a) < 2: print(__doc__); sys.exit(1)
    proj = unwrap(json.load(open(a[0])))
    reel = a[1]
    anims = []
    if '--anims' in a:
        raw = unwrap(json.load(open(a[a.index('--anims') + 1])))
        items = raw if isinstance(raw, list) else raw.get('docs') or raw.get('items') or list(raw.values())
        for it in items:
            it = unwrap(it)
            if isinstance(it, dict): anims.append(it)
    # коды блоков библиотеки (template/src/blocks/codes.json)
    here = os.path.dirname(os.path.abspath(__file__))
    cj = os.path.join(here, '..', 'template', 'src', 'blocks', 'codes.json')
    CODES = json.load(open(cj)) if os.path.exists(cj) else {}
    group = {c: g for g, cs in CODES.items() for c in cs}
    def anim(aid):
        if not aid or aid == 'static': return None
        if group.get(aid) == 'subtitle': return {'style': aid}          # готовый стиль субтитров (SubKaraoke…)
        for x in anims:
            if aid in (x.get('id'), x.get('_id'), x.get('docId'), x.get('name')):
                return {'style': x['style']} if x.get('style') else (x.get('params') or None)
        print(f'! анимация {aid} не найдена в textanims — субтитры будут статичные'); return None

    words = proj.get('words') or []
    if not words: sys.exit('В проекте нет words — сначала «Отправить» видео аватара на пульте')
    rows = proj.get('sbRows') or []
    if not rows: sys.exit('В проекте нет sbRows — сначала раскадровка на пульте')
    media_dir = os.path.join(reel, 'public', 'media')
    # папка ролика с Диска копируется в public/media как есть: подпапки 01_персонаж … 06_мои_вставки
    have = {}
    for fp in glob.glob(os.path.join(media_dir, '**', '*'), recursive=True):
        if os.path.isfile(fp): have.setdefault(os.path.basename(fp), os.path.relpath(fp, os.path.join(reel, 'public')))
    def find_media(name):
        if not name: return None
        name = os.path.basename(name.strip())
        if name in have: return have[name]
        stem = os.path.splitext(name)[0].lower()
        for f, rel in have.items():
            if os.path.splitext(f)[0].lower() == stem: return rel
        return None

    warn, out = [], []
    for i, r in enumerate(rows):
        mode = (r.get('mode') or 'B').upper()
        kind = r.get('kind') or ('speaker' if mode == 'A' else 'l2d')
        row = {'s': float(r.get('s', 0)), 'e': float(r.get('e', 0)), 'text': r.get('text', ''), 'mode': mode, 'kind': kind,
               'note': r.get('note', '')}
        if mode == 'B': row['win'] = r.get('win') or proj.get('win') or 'popout'
        if r.get('scene'): row['scene'] = r['scene']
        # коды блоков в описании: сцена — код в начале («MBars: я — 3 | они — 30»), переход, эффект, пометки — где угодно
        note = row['note']
        lead = re.match(r'\s*([A-Z][A-Za-z0-9]+)\b', note)
        if not row.get('scene') and lead and group.get(lead.group(1)) == 'scene': row['scene'] = lead.group(1)
        for c in re.findall(r'\b([A-Z][A-Za-z0-9]+)\b', note):
            g = group.get(c)
            if g == 'transition' and i > 0: row['tr'] = c
            elif g == 'fx':
                row['fx'] = c
                m = re.search(re.escape(c) + r'\s*:\s*([^|;\n]+)', note)
                if m: row['fxText'] = m.group(1).strip()
            elif g == 'overlay':   # координаты по умолчанию — центр; текст — после «Код:» до | или ;
                m = re.search(re.escape(c) + r'\s*:\s*([^|;\n]+)', note)
                o = {'code': c}
                if m: o['text'] = m.group(1).strip()
                row.setdefault('ov', []).append(o)
        for k in ('tr', 'fx', 'ov', 'marks'):
            if r.get(k): row[k] = r[k]
        if r.get('frame'): row['frame'] = r['frame']
        elif r.get('picType') in ('product', 'poster', 'painting'): row['frame'] = r['picType']
        elif r.get('picType') in ('screenshot', 'news'): row['frame'] = 'phone' if r['picType'] == 'screenshot' else 'window'
        if kind in ('gen', 'media'):
            name = r.get('media') or (f'pic_{i + 1}' if kind == 'gen' else '')
            m = find_media(name)
            if m: row['media'] = m
            else: warn.append(f'{i + 1}: нет файла «{name or "?"}» в public/media ({kind})')
        if kind == 'l2d' and not row.get('scene'):
            if r.get('layer'): row['layer'] = r['layer']
            else: warn.append(f'{i + 1}: 2D-сцена «{row["text"][:40]}» — собрать слоями (layer) или своей сценой в registry.tsx')
        if kind in ('motion', 'd3') and not row.get('scene'):
            warn.append(f'{i + 1}: {kind} «{row["text"][:40]}» — нужна сцена в registry.tsx (пока кинетический текст)')
        out.append(row)
    out.sort(key=lambda x: x['s'])
    out[0]['s'] = 0.0
    dur = round(max(words[-1]['e'] + 0.45, out[-1]['e']), 2)
    st = {
        'fps': 30, 'duration': dur, 'words': words, 'rows': out,
        'settings': {
            'bg': proj.get('bg') or 'светлая', 'win': proj.get('win') or 'popout',
            'subWords': int(proj.get('subWords') or 2), 'subColor': proj.get('subColor') or None,
            'subAnim': anim(proj.get('subAnim')), 'titleAnim': anim(proj.get('titleAnim')),
            'speed': proj.get('speed'), 'avatar': 'avatar.mp4', 'avatarCut': 'avatar_cut.webm',
        },
    }
    if proj.get('punch'): st['settings']['punch'] = True
    if proj.get('progress'): st['settings']['progress'] = True
    if 'градиент' in (proj.get('bg') or '') or proj.get('backdrop') == 'BgGrain': st['settings']['backdrop'] = 'BgGrain'
    if proj.get('accent'): st['settings']['accent'] = proj['accent']
    if proj.get('passport'): st['settings']['passport'] = proj['passport']
    if proj.get('sfx'): st['settings']['sfx'] = True                      # звуки по рецепту: вжух/удар/поп (public/sfx из tools/make_sfx.py)
    if proj.get('music'): st['settings']['music'] = proj['music']; st['settings']['musicVolume'] = proj.get('musicVolume', 0.12)
    if proj.get('keywords') and st['settings'].get('subAnim'): st['settings']['subAnim']['keywords'] = proj['keywords']  # стилевой паспорт шаблона: цвета, шрифты, форма, движение
    os.makedirs(os.path.join(reel, 'src'), exist_ok=True)
    json.dump(st, open(os.path.join(reel, 'src', 'story.json'), 'w'), ensure_ascii=False, indent=1)
    json.dump(words, open(os.path.join(reel, 'src', 'words.json'), 'w'), ensure_ascii=False)
    modes = {m: sum(r['e'] - r['s'] for r in out if r['mode'] == m) for m in 'ABC'}
    tot = sum(modes.values()) or 1
    print(f'story.json: {len(out)} сегментов, {dur} с; A {modes["A"]/tot:.0%} / B {modes["B"]/tot:.0%} / C {modes["C"]/tot:.0%}')
    for w in warn: print('!', w)

if __name__ == '__main__':
    main()
