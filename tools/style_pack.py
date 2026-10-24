#!/usr/bin/env python3
"""Стилевой пакет: стиль референса в коде (docs/style-pack.md).

  python3 tools/style_pack.py measure ВИДЕО [--from С --to ПО]
      цифры видео: склеек в минуту, средняя яркость и насыщенность, контраст, LUFS → JSON.
  python3 tools/style_pack.py side РЕФ.mp4 НАШ.mp4 -o side.jpg [--t 1.2,3.4,…] [--n 6] [--crop w:h:x:y]
      лист «референс сверху / наш снизу» в одни и те же секунды (или крупно вырезанный кусок кадра: --crop).
  python3 tools/style_pack.py strip ВИДЕО -o strip.jpg --from С --to ПО [--every 1] [--crop w:h:x:y]
      кадры подряд на одном листе — посмотреть анимацию покадрово (вход слова, переход, наезд).
      (--crop в формате ffmpeg crop: ширина:высота:x:y — например 1080:500:0:1300 для полосы субтитров)
  python3 tools/style_pack.py build ПАПКА -o pack.json
      папка пакета (pack.tsx + помощники .tsx/.ts + style.json) → один pack.json для пульта; проверка имён и слотов.
  python3 tools/style_pack.py testreel СЫРОЕ.mp4 ПАПКА --pack pack.json [--dur 15] [--words words.json] [--rows A:0-2.5,C:2.5-4,…] [--no-hook]
      тестовый ролик для сверки: папка из шаблона, видео 1080×1920, слова (tools/asr.py), раскадровка (по умолчанию
      A, A, C-кинетика по 2,5 с, хук на первом сегменте), пакет, рендер → ПАПКА/test.mp4.
  python3 tools/style_pack.py install pack.json РОЛИК
      пакет → РОЛИК/src/story/pack/ (вызывает reel_prep, этап pack).
  python3 tools/style_pack.py check РОЛИК out.mp4 [--sheet эталон.jpg]
      сверка готового ролика с пакетом: цифры против pack.check и лист «эталон / наш» → work/style_check.jpg.
      Код выхода 2 и строки «Не сошлось», если цифры вне диапазонов.

style.json пакета: {"name", "version", "summary", "settings": {...поверх settings ролика},
  "check": {"cutsPerMin": [мин, макс], "luma": [..], "sat": [..], "contrast": [..]}, "slots": [...],
  "fonts": [{"family": "Bebas", "weight": "400", "style": "normal", "file": "bebas-400.woff2"}]}.
Шрифты пакета — файлы .woff2 в ПАПКА/fonts/ (взять из npm: npm pack @fontsource/<имя>); build кладёт их в pack.json,
install — в РОЛИК/public/fonts/pack/, загружает их код пакета сам (pack/fonts.ts). Шрифты шаблона (blocks/style.ts FONT_LIB) есть всегда.
"""
import glob, json, os, re, shutil, subprocess, sys

NAME_OK = re.compile(r'^[A-Za-z][A-Za-z0-9_-]*\.(tsx|ts|json)$')
RESERVED = {'index.tsx', 'types.ts'}
SLOTS = ['Captions', 'Title', 'Hook', 'Camera', 'Cut', 'Overlay', 'Top', 'scenes']
MAX_BYTES = 3_000_000
HERE = os.path.dirname(os.path.abspath(__file__)); ROOT = os.path.dirname(HERE); TPL = os.path.join(ROOT, 'template')


def sh(cmd):
    return subprocess.run([str(c) for c in cmd], capture_output=True, text=True)


def opt(a, k, d=None):
    return a[a.index(k) + 1] if k in a and a.index(k) + 1 < len(a) else d


def duration(v):
    r = sh(['ffprobe', '-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', v])
    try: return float(r.stdout.strip())
    except ValueError: return 0.0


# ---------- цифры видео ----------
def measure(v, t0=None, t1=None):
    d = duration(v); t0 = t0 or 0.0; t1 = min(t1 or d, d); span = max(0.1, t1 - t0)
    cut = ['-ss', f'{t0}', '-t', f'{span}']
    r = sh(['ffmpeg', '-v', 'info', '-nostats', *cut, '-i', v, '-vf', "scale=270:480,select='gt(scene,0.32)',showinfo", '-an', '-f', 'null', '-'])
    cuts = [float(x) for x in re.findall(r'pts_time:([\d.]+)', r.stderr)]
    cuts = [c for i, c in enumerate(cuts) if i == 0 or c - cuts[i - 1] > 0.3]
    r = sh(['ffmpeg', '-v', 'error', *cut, '-i', v, '-vf', 'fps=2,scale=270:480,signalstats,metadata=print:file=-', '-an', '-f', 'null', '-'])
    vals = {k: [float(x) for x in re.findall(rf'signalstats\.{k}=([\d.]+)', r.stdout)] for k in ('YAVG', 'SATAVG', 'YLOW', 'YHIGH')}
    avg = lambda xs: round(sum(xs) / len(xs), 1) if xs else None
    lu = sh(['ffmpeg', '-v', 'info', '-nostats', *cut, '-i', v, '-af', 'ebur128', '-f', 'null', '-'])
    m = re.findall(r'I:\s+(-?[\d.]+) LUFS', lu.stderr)
    lo, hi = avg(vals['YLOW']), avg(vals['YHIGH'])
    return {'span': round(span, 1), 'cuts': len(cuts), 'cutsPerMin': round(len(cuts) / (span / 60), 1),
            'luma': avg(vals['YAVG']), 'sat': avg(vals['SATAVG']), 'contrast': round(hi - lo, 1) if lo is not None and hi is not None else None,
            'lufs': float(m[-1]) if m else None}


# ---------- листы ----------
def grab(v, t, out, w, h, crop=None):
    vf = (f'crop={crop},' if crop else '') + f'scale={w}:{h}:force_original_aspect_ratio=decrease,pad={w}:{h}:(ow-iw)/2:(oh-ih)/2:black'
    vf += f",drawtext=text='{t:.2f}s':x=8:y=8:fontsize=20:fontcolor=white:box=1:boxcolor=black@0.6"
    r = sh(['ffmpeg', '-y', '-v', 'error', '-ss', f'{t:.3f}', '-i', v, '-frames:v', '1', '-vf', vf, out])
    if r.returncode:  # без drawtext (нет шрифта)
        sh(['ffmpeg', '-y', '-v', 'error', '-ss', f'{t:.3f}', '-i', v, '-frames:v', '1', '-vf', vf.split(',drawtext')[0], out])
    return os.path.exists(out)


def tile(paths, cols, out):
    rows = (len(paths) + cols - 1) // cols
    ins = []
    for p in paths: ins += ['-i', p]
    # xstack: координаты в ширинах и высотах первой картинки (все одного размера)
    lay = '|'.join(f"{'+'.join(['w0'] * (k % cols)) or '0'}_{'+'.join(['h0'] * (k // cols)) or '0'}" for k in range(len(paths)))
    r = sh(['ffmpeg', '-y', '-v', 'error', *ins, '-filter_complex', f'xstack=inputs={len(paths)}:layout={lay}:fill=black', '-frames:v', '1', out])
    if r.returncode: raise SystemExit('ffmpeg xstack: ' + r.stderr.strip()[-300:])
    return rows


def side(a):
    ref, ours = a[0], a[1]; out = opt(a, '-o', 'side.jpg'); crop = opt(a, '--crop')
    ts = [float(x) for x in opt(a, '--t', '').split(',') if x.strip()]
    if not ts:
        n = int(opt(a, '--n', '6')); d = min(duration(ref), duration(ours)) or 1
        ts = [d * (k + 0.5) / n for k in range(n)]
    tmp = out + '.parts'; os.makedirs(tmp, exist_ok=True)
    w, h = (360, 640) if not crop else (480, 270)
    top = [os.path.join(tmp, f'r{k}.png') for k in range(len(ts))]; bot = [os.path.join(tmp, f'o{k}.png') for k in range(len(ts))]
    for k, t in enumerate(ts):
        grab(ref, t, top[k], w, h, crop); grab(ours, t, bot[k], w, h, crop)
    tile(top + bot, len(ts), out); shutil.rmtree(tmp, ignore_errors=True)
    print(f'{out}: сверху референс, снизу наш; секунды {", ".join(f"{t:.2f}" for t in ts)}')


def strip(a):
    v = a[0]; out = opt(a, '-o', 'strip.jpg'); crop = opt(a, '--crop')
    t0, t1 = float(opt(a, '--from', '0')), float(opt(a, '--to', '1')); ev = int(opt(a, '--every', '1'))
    fps = 30.0
    r = sh(['ffprobe', '-v', 'error', '-select_streams', 'v', '-show_entries', 'stream=r_frame_rate', '-of', 'csv=p=0', v])
    try: n_, d_ = r.stdout.strip().split('/'); fps = float(n_) / float(d_)
    except Exception: pass
    ts = []; t = t0
    while t <= t1 + 1e-6 and len(ts) < 36: ts.append(t); t += ev / fps
    tmp = out + '.parts'; os.makedirs(tmp, exist_ok=True)
    w, h = (240, 427) if not crop else (360, 200)
    ps = [os.path.join(tmp, f'{k}.png') for k in range(len(ts))]
    for k, t in enumerate(ts): grab(v, t, ps[k], w, h, crop)
    tile(ps, min(6, len(ps)), out); shutil.rmtree(tmp, ignore_errors=True)
    print(f'{out}: {len(ts)} кадров с {t0:.2f} по {ts[-1]:.2f} с, шаг {ev} кадр. ({fps:.0f} к/с)')


# ---------- пакет ----------
def build(a):
    d = a[0]; out = opt(a, '-o', 'pack.json')
    sty = json.load(open(os.path.join(d, 'style.json'), encoding='utf-8')) if os.path.exists(os.path.join(d, 'style.json')) else {}
    files = {}
    for p in sorted(glob.glob(os.path.join(d, '*'))):
        n = os.path.basename(p)
        if n in ('style.json',) or os.path.isdir(p) or not n.endswith(('.tsx', '.ts')): continue
        if n in RESERVED: raise SystemExit(f'{n}: имя занято шаблоном — переименуй')
        if not NAME_OK.match(n): raise SystemExit(f'{n}: имя файла только латиница, цифры, _ и -')
        files[n] = open(p, encoding='utf-8').read()
    if 'pack.tsx' not in files: raise SystemExit('нет pack.tsx: он экспортирует PACK_SLOTS')
    if not re.search(r'export\s+const\s+PACK_SLOTS\b', files['pack.tsx']): raise SystemExit('pack.tsx не экспортирует PACK_SLOTS')
    slots = [s for s in SLOTS if re.search(rf'\b{s}\s*[:,}}]', files['pack.tsx'].split('PACK_SLOTS', 1)[1])]
    for n, src in files.items():
        for m in re.findall(r"from\s+'(\.[^']+)'", src):
            if m.startswith('../') and not m.startswith(('../types', '../../blocks', '../../remocn', '../theme', '../fonts')):
                print(f'! {n}: импорт {m} вне пакета — проверь, что он есть в шаблоне')
    fonts = []
    for f in sty.get('fonts') or []:
        fp = os.path.join(d, 'fonts', f.get('file', ''))
        if not re.match(r'^[A-Za-z0-9_.-]+\.woff2$', f.get('file', '')) or not os.path.exists(fp): raise SystemExit(f'шрифт {f}: нужен файл fonts/<имя>.woff2')
        import base64
        fonts.append({'family': f['family'], 'weight': str(f.get('weight', '400')), 'style': f.get('style', 'normal'), 'file': f['file'],
                      'data': base64.b64encode(open(fp, 'rb').read()).decode()})
    pack = {'format': 'stylepack/1', 'name': sty.get('name') or os.path.basename(os.path.abspath(d)),
            'version': int(sty.get('version') or 1), 'summary': sty.get('summary', ''),
            'settings': sty.get('settings') or {}, 'check': sty.get('check') or {}, 'slots': sty.get('slots') or slots,
            'fonts': fonts, 'sheet': sty.get('sheet'), 'files': files}
    body = json.dumps(pack, ensure_ascii=False)
    if len(body.encode()) > MAX_BYTES: raise SystemExit(f'пакет {len(body.encode()) // 1024} КБ — больше {MAX_BYTES // 1024} КБ, вынеси картинки в ассеты')
    open(out, 'w', encoding='utf-8').write(body)
    print(f'{out}: «{pack["name"]}» v{pack["version"]}, слоты {", ".join(pack["slots"]) or "—"}, файлов {len(files)}, {len(body.encode()) // 1024} КБ')


def load(p):
    d = json.load(open(p, encoding='utf-8'))
    while isinstance(d, dict) and 'data' in d and isinstance(d['data'], dict) and len(d) <= 3: d = d['data']
    if not isinstance(d, dict) or d.get('format') != 'stylepack/1': raise SystemExit(f'{p}: это не стилевой пакет (format stylepack/1)')
    return d


def install(pack_path, reel):
    pk = load(pack_path)
    dst = os.path.join(reel, 'src', 'story', 'pack'); os.makedirs(dst, exist_ok=True)
    for p in glob.glob(os.path.join(dst, '*')):
        if os.path.basename(p) != 'types.ts' and os.path.isfile(p): os.remove(p)
    tpl_types = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'template', 'src', 'story', 'pack', 'types.ts')
    shutil.copy2(tpl_types, os.path.join(dst, 'types.ts'))
    for n, src in (pk.get('files') or {}).items():
        if n in RESERVED or not NAME_OK.match(n): raise SystemExit(f'пакет: недопустимое имя файла {n!r}')
        open(os.path.join(dst, n), 'w', encoding='utf-8').write(src)
    if 'pack.tsx' not in (pk.get('files') or {}): raise SystemExit('пакет без pack.tsx')
    json.dump(pk.get('settings') or {}, open(os.path.join(dst, 'settings.json'), 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
    import base64
    fdir = os.path.join(reel, 'public', 'fonts', 'pack'); shutil.rmtree(fdir, ignore_errors=True)
    fl = []
    for f in pk.get('fonts') or []:
        if not re.match(r'^[A-Za-z0-9_.-]+\.woff2$', f.get('file', '')): raise SystemExit(f'пакет: недопустимое имя шрифта {f.get("file")!r}')
        os.makedirs(fdir, exist_ok=True); open(os.path.join(fdir, f['file']), 'wb').write(base64.b64decode(f['data']))
        fl.append({k: f[k] for k in ('family', 'weight', 'style', 'file')})
    open(os.path.join(dst, 'fonts.ts'), 'w', encoding='utf-8').write(
        "/* Шрифты стилевого пакета (public/fonts/pack) — файл пишет tools/style_pack.py install */\n"
        "import {continueRender, delayRender, staticFile} from 'remotion';\n"
        f"export const PACK_FONTS: {{family: string; weight: string; style: string; file: string}}[] = {json.dumps(fl, ensure_ascii=False)};\n"
        "if (typeof document !== 'undefined' && PACK_FONTS.length) {\n"
        "  const h = delayRender('pack-fonts');\n"
        "  Promise.all(PACK_FONTS.map((f) => new FontFace(f.family, `url(${staticFile(`fonts/pack/${f.file}`)})`, {weight: f.weight, style: f.style})\n"
        "    .load().then((l) => document.fonts.add(l)).catch(() => null))).then(() => continueRender(h));\n}\n")
    open(os.path.join(dst, 'index.tsx'), 'w', encoding='utf-8').write(
        "/* Стилевой пакет — файл пишет tools/style_pack.py install, руками не править */\n"
        "import type {Pack} from './types';\nimport {PACK_SLOTS} from './pack';\nimport settings from './settings.json';\nimport './fonts';\n\n"
        f"export const PACK: Pack = {{...PACK_SLOTS, name: {json.dumps(pk.get('name', ''), ensure_ascii=False)}, version: {int(pk.get('version') or 1)}, "
        "settings: settings as Pack['settings']};\n")
    meta = {k: pk.get(k) for k in ('name', 'version', 'summary', 'check', 'slots', 'sheet')}
    os.makedirs(os.path.join(reel, 'work'), exist_ok=True)
    json.dump(meta, open(os.path.join(reel, 'work', 'pack.json'), 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
    return pk


def testreel(a):
    raw, d = a[0], os.path.abspath(a[1]); pk = opt(a, '--pack'); dur = float(opt(a, '--dur', '15'))
    if not pk: raise SystemExit('нужен --pack pack.json (сначала build)')
    # папка из шаблона, пакеты — общие с template/
    for src in glob.glob(os.path.join(TPL, '**', '*'), recursive=True):
        rel = os.path.relpath(src, TPL)
        if rel.split(os.sep)[0] == 'node_modules' or not os.path.isfile(src): continue
        dst = os.path.join(d, rel)
        if not os.path.exists(dst): os.makedirs(os.path.dirname(dst), exist_ok=True); shutil.copy2(src, dst)
    if not os.path.isdir(os.path.join(TPL, 'node_modules')):
        print('ставлю пакеты шаблона (один раз)…', flush=True)
        r = subprocess.run(['npm', 'ci', '--no-audit', '--no-fund', '--loglevel=error'], cwd=TPL, capture_output=True, text=True)
        if r.returncode: raise SystemExit('npm ci: ' + r.stderr[-400:])
    nm = os.path.join(d, 'node_modules')
    if not os.path.exists(nm): os.symlink(os.path.relpath(os.path.join(TPL, 'node_modules'), d), nm)
    av = os.path.join(d, 'public', 'avatar.mp4')
    r = sh(['ffmpeg', '-y', '-v', 'error', '-i', raw, '-t', f'{dur}', '-vf', 'scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920,fps=30',
            '-c:v', 'libx264', '-preset', 'veryfast', '-crf', '18', '-pix_fmt', 'yuv420p', '-c:a', 'aac', '-b:a', '192k', av])
    if r.returncode: raise SystemExit('ffmpeg: ' + r.stderr[-300:])
    dur = duration(av) or dur
    wp = opt(a, '--words')
    if not wp:
        wp = os.path.join(d, 'work', 'words.json'); os.makedirs(os.path.dirname(wp), exist_ok=True)
        r = subprocess.run([sys.executable, os.path.join(HERE, 'asr.py'), av, wp], capture_output=True, text=True)
        if r.returncode or not os.path.exists(wp): raise SystemExit('распознавание не прошло (tools/setup.sh ставит модель): ' + (r.stderr or r.stdout)[-300:])
    words = json.load(open(wp, encoding='utf-8'))
    words = [w for w in words if w.get('s', 0) < dur]
    spec = opt(a, '--rows')
    if spec:
        rows = []
        for part in spec.split(','):
            m, rng = part.split(':'); s0, e0 = (float(x) for x in rng.split('-'))
            rows.append({'s': s0, 'e': min(e0, dur), 'text': '', 'mode': m.strip().upper()[0]})
    else:
        rows, t, k = [], 0.0, 0
        while t < dur - 0.3:
            e = min(dur, t + 2.5); m = 'C' if k % 3 == 2 else 'A'
            rows.append({'s': round(t, 2), 'e': round(e, 2), 'text': '', 'mode': m}); t = e; k += 1
    for r_ in rows:
        r_['text'] = ' '.join(w['w'] for w in words if r_['s'] <= w['s'] < r_['e'])
        if r_['mode'] == 'C': r_['kind'] = 'kinetic'
    if rows and '--no-hook' not in a:
        first = [w['w'] for w in words if w['s'] < rows[0]['e']][:2]
        if first: rows[0]['hook'] = {'big': [x.strip('.,!?:;«»').upper() for x in first]}
    rows[-1]['e'] = round(dur, 2)
    story = {'fps': 30, 'duration': round(dur, 2), 'settings': {'bg': 'тёмная', 'subWords': 2, 'punch': False, 'wipe': False, 'sfx': False},
             'words': words, 'rows': rows}
    json.dump(story, open(os.path.join(d, 'src', 'story.json'), 'w', encoding='utf-8'), ensure_ascii=False)
    install(pk, d)
    print(f'рендер теста ({dur:.0f} с)…', flush=True)
    r = subprocess.run(['bash', os.path.join(HERE, 'render.sh'), d, 'test.mp4'], env={**os.environ, 'COMP': 'Story'}, capture_output=True, text=True)
    out = os.path.join(d, 'test.mp4')
    if r.returncode or not os.path.exists(out): raise SystemExit('рендер: ОШИБКА\n' + (r.stdout + r.stderr).strip()[-800:] + f'\nполный лог: {d}/render.log')
    print(f'{out}: {dur:.1f} с, сегментов {len(rows)} ({"".join(x["mode"] for x in rows)}), слов {len(words)}')


def check(a):
    reel, out = a[0], a[1]; sheet = opt(a, '--sheet')
    mp = os.path.join(reel, 'work', 'pack.json')
    if not os.path.exists(mp): print('стилевого пакета нет — сверять не с чем'); return 0
    if not os.path.exists(out): raise SystemExit(f'нет видео {out}')
    meta = json.load(open(mp, encoding='utf-8')); chk = meta.get('check') or {}
    m = measure(out); probs = []
    for k in ('cutsPerMin', 'luma', 'sat', 'contrast'):
        rng = chk.get(k)
        if not rng or m.get(k) is None: continue
        lo, hi = rng
        if not lo <= m[k] <= hi: probs.append(f'{k}: {m[k]}, а в стиле {lo}–{hi}')
    work = os.path.join(reel, 'work'); ours = os.path.join(work, 'style_ours.jpg'); res = os.path.join(work, 'style_check.jpg')
    d = duration(out) or 1
    sh(['ffmpeg', '-y', '-v', 'error', '-i', out, '-vf', f'fps={8 / d:.4f},scale=270:480,tile=8x1', '-frames:v', '1', ours])
    if sheet and os.path.exists(sheet) and os.path.exists(ours):
        r = sh(['ffmpeg', '-y', '-v', 'error', '-i', sheet, '-i', ours, '-filter_complex',
                '[0]scale=2160:-2[a];[1]scale=2160:-2[b];[a][b]vstack', '-frames:v', '1', res])
        if r.returncode: shutil.copy2(ours, res)
    elif os.path.exists(ours): shutil.copy2(ours, res)
    print(f'стиль «{meta.get("name")}» v{meta.get("version")}: склеек/мин {m["cutsPerMin"]}, яркость {m["luma"]}, насыщенность {m["sat"]}, контраст {m["contrast"]}; '
          f'лист {os.path.relpath(res)}' + (' (сверху эталон, снизу наш)' if sheet else ''))
    if probs:
        print('Не сошлось со стилем:\n  ' + '\n  '.join(probs)); return 2
    return 0


def main():
    a = sys.argv[1:]
    if not a or a[0] in ('-h', '--help'): sys.exit(__doc__)
    cmd, rest = a[0], a[1:]
    if cmd == 'measure':
        print(json.dumps(measure(rest[0], float(opt(rest, '--from', 0)) or None, float(opt(rest, '--to', 0)) or None), ensure_ascii=False))
    elif cmd == 'side': side(rest)
    elif cmd == 'strip': strip(rest)
    elif cmd == 'build': build(rest)
    elif cmd == 'testreel': testreel(rest)
    elif cmd == 'install':
        pk = install(rest[0], rest[1]); print(f'пакет «{pk.get("name")}» v{pk.get("version")} → {rest[1]}/src/story/pack')
    elif cmd == 'check': sys.exit(check(rest))
    else: sys.exit(__doc__)


if __name__ == '__main__':
    main()
