#!/usr/bin/env python3
"""Ролик одной командой: проект пульта → готовый out.mp4 с проверкой. Чат только запускает и ждёт.

  python3 tools/reel_go.py work/db/projects/<id>.json reels/NN-name --files work/files [--anims work/db/textanims] [опции reel_prep]

1. tools/reel_prep.py --auto  — окружение, папка, материалы, вырезки, story.json, видео спикера.
   Быстрый режим: только готовые блоки библиотеки; строка без блока — слоёная 2D-сцена из материалов
   или кинетический текст. Своих сцен не пишется, заглушек нет.
2. рендер композиции Story (tools/render.sh) → <ролик>/out.mp4
3. проверка цифрами: длительность против story.json, громкость (≈ −14 LUFS), заглушки в раскадровке,
   лист из 8 стоп-кадров work/check_sheet.jpg (смотреть, только если пользователь попросил или проверка не сошлась).

Всё пишет в <ролик>/work/go.log; в чат — короткий итог. Упало — исправить причину и запустить ту же
команду: сделанное пропускается (рендер — если out.mp4 новее story.json и видео спикера).
"""
import json, os, re, subprocess, sys, time

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)


def sh(cmd, **kw):
    return subprocess.run(cmd, capture_output=True, text=True, **kw)


def main():
    a = sys.argv[1:]
    if len(a) < 2 or a[0].startswith('-'): sys.exit(__doc__)
    reel = os.path.abspath(a[1]); work = os.path.join(reel, 'work'); os.makedirs(work, exist_ok=True)
    log = open(os.path.join(work, 'go.log'), 'a', encoding='utf-8')
    t0 = time.time()
    def say(x): print(x, flush=True); log.write(x + '\n'); log.flush()

    # 1. подготовка
    args = a if '--auto' in a else a + ['--auto']
    r = subprocess.run([sys.executable, os.path.join(HERE, 'reel_prep.py')] + args, text=True, capture_output=True)
    log.write(r.stdout + r.stderr)
    lines = [l for l in r.stdout.splitlines() if l.strip()]
    if r.returncode:
        say('\n'.join(lines[-12:])); sys.exit(1)
    say('\n'.join(l for l in lines if not l.startswith(('Полный лог', '=== '))))

    st_path = os.path.join(reel, 'src', 'story.json')
    st = json.load(open(st_path, encoding='utf-8'))
    av = os.path.join(reel, 'public', st['settings'].get('avatar') or 'avatar.mp4')
    out = os.path.join(reel, 'out.mp4')

    # заглушки: в быстром режиме их быть не должно
    bad = []
    for i, row in enumerate(st['rows']):
        k = row.get('kind')
        if k == 'l2d' and not row.get('scene') and not (row.get('layer') or {}).get('pose') and not (row.get('layer') or {}).get('props') and not (row.get('layer') or {}).get('bg'):
            bad.append(f'{i + 1}: 2D-сцена без слоёв')
        if k in ('gen', 'media') and not row.get('media'):
            bad.append(f'{i + 1}: картинка без файла')
    if bad:
        say('ЗАГЛУШКИ в раскадровке — рендер не запускаю:\n  ' + '\n  '.join(bad)); sys.exit(1)

    # 2. рендер
    newest = max(os.path.getmtime(st_path), os.path.getmtime(av) if os.path.exists(av) else 0)
    if os.path.exists(out) and os.path.getmtime(out) > newest and '--rerender' not in a:
        say('рендер: уже готов')
    else:
        say('рендер: идёт (обычно 10–25 мин)…')
        t = time.time()
        r = sh(['bash', os.path.join(HERE, 'render.sh'), reel, 'out.mp4'], env={**os.environ, 'COMP': 'Story'}, cwd=ROOT)
        log.write(r.stdout + r.stderr)
        if r.returncode or not os.path.exists(out):
            say('рендер: ОШИБКА\n' + '\n'.join((r.stdout + r.stderr).strip().splitlines()[-10:])
                + f'\nполный лог: {os.path.relpath(os.path.join(reel, "render.log"), ROOT)}'); sys.exit(1)
        say(f'рендер: {(time.time() - t) / 60:.1f} мин')

    # 3. проверка цифрами
    probs = []
    pr = sh(['ffprobe', '-v', 'error', '-show_entries', 'format=duration:stream=width,height', '-of', 'json', out])
    info = json.loads(pr.stdout or '{}')
    dur = float(info.get('format', {}).get('duration', 0))
    wh = next(((s['width'], s['height']) for s in info.get('streams', []) if s.get('width')), (0, 0))
    if wh != (1080, 1920): probs.append(f'размер {wh[0]}×{wh[1]}, а нужен 1080×1920')
    if abs(dur - st['duration']) > 0.6: probs.append(f'длительность {dur:.1f} с, по раскадровке {st["duration"]} с')
    lu = sh(['ffmpeg', '-v', 'info', '-nostats', '-i', out, '-af', 'ebur128', '-f', 'null', '-'])
    m = re.findall(r'I:\s+(-?[\d.]+) LUFS', lu.stderr)
    lufs = float(m[-1]) if m else None
    if lufs is None: probs.append('нет звука')
    elif abs(lufs + 14) > 2: probs.append(f'громкость {lufs:.1f} LUFS, нужна около −14')
    # лист стоп-кадров — по одному на равные доли ролика
    sheet = os.path.join(work, 'check_sheet.jpg')
    n = 8; fps = max(1, n) / max(dur, 1)
    sh(['ffmpeg', '-y', '-v', 'error', '-i', out, '-vf', f'fps={fps:.4f},scale=270:480,tile=4x2', '-frames:v', '1', sheet])
    rows = st['rows']; tot = sum(r['e'] - r['s'] for r in rows) or 1
    share = {k: round(100 * sum(r['e'] - r['s'] for r in rows if r['mode'] == k) / tot) for k in 'ABC'}
    kin = sum(1 for r in rows if r.get('kind') == 'kinetic')

    say('\n=== ГОТОВО ===')
    say(f'{os.path.relpath(out, ROOT)}: {dur:.1f} с, {wh[0]}×{wh[1]}, '
        + (f'{lufs:.1f} LUFS' if lufs is not None else 'без звука')
        + f'; A {share["A"]}% / B {share["B"]}% / C {share["C"]}%; кинетический текст в {kin} из {len(rows)} строк.')
    say(f'Лист стоп-кадров: {os.path.relpath(sheet, ROOT)}. Всего {(time.time() - t0) / 60:.1f} мин.')
    if probs:
        say('Не сошлось:\n  ' + '\n  '.join(probs)); sys.exit(2)
    say('Проверка цифрами пройдена — отправляй out.mp4 пользователю.')


if __name__ == '__main__':
    main()
