#!/usr/bin/env python3
"""Подготовка ролика одной командой: от проекта пульта до готовой к сценам папки.

  python3 tools/reel_prep.py work/db/projects/<id>.json reels/NN-name --files work/files [--anims work/db/textanims]

Входы:
  project.json   документ projects/<id> (ArtifactData get с out_dir).
  --files DIR    папка, куда Artifact read сохранил файлы пульта по id: видео аватара (поле avatar.id)
                 и пакеты материалов (поле mediaPack.parts — их собирает кнопка «Собрать пакет для монтажа»).
  --avatar FILE  видео аватара или озвучка (mp3, m4a, wav), если файла нет на пульте (больше 20 МБ — прислан в чат).
                 Озвучка без видео превращается в дорожку с пустым кадром: спикера в кадре нет, ролик весь из вставок.
  --media DIR    папка с материалами как на Диске (01_персонаж … 06_мои_вставки), если пакета нет.
  --anims P      textanims: папка из ArtifactData list с out_dir или один JSON.
  --no-matte     не вырезать спикера (окно без выхода головы за край).
  --plate-fix    после вырезки спикера убрать прилипший над головой фон (tools/matte/plate_fix.py).
  --auto         быстрый режим (его включает reel_go.py): строки без готового блока собираются из материалов
                 или идут кинетическим текстом — своих сцен писать не нужно.
  --redo ЭТАП    переделать этап, даже если он уже сделан (scaffold, media, cutout, story, avatar, matte).

Этапы (каждый пишет одну строку; полный вывод инструментов — <ролик>/work/prep.log):
  0. env       tools/setup.sh — ставит недостающие модули и модели (повторно — секунда)
  1. scaffold  папка из template/, пакеты — ссылка на template/node_modules (ставятся один раз на все ролики)
  2. media     пакеты пульта или --media → public/media/<подпапки как на Диске>
  3. cutout    позы, люди и предметы (01_, 02_, 03_) без прозрачности → вырезка фона rembg (isnet-general-use)
  4. story     tools/pult_to_story.py → src/story.json, src/words.json
  5. avatar    без спецификации стиля: паузы режутся ровно по segs пульта, ускорение speed → public/avatar.mp4;
               со спецификацией (поле spec): tools/spec_build.py --src (паузы, распознавание, грейд, звук)
  6. matte     если в раскадровке есть окно «Вырезка» или BgSwap: прозрачный спикер → public/avatar_cut.webm
  7. report    лист work/prep_sheet.jpg (материалы + кадры вырезки) и отчёт: что готово, чего не хватает, какие сцены писать

Повторный запуск продолжает с первого несделанного этапа; story и report выполняются всегда (дешёвые).
"""
import base64, glob, hashlib, json, os, shutil, subprocess, sys, time

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
TPL = os.path.join(ROOT, 'template')
STAGES = ['env', 'scaffold', 'media', 'cutout', 'story', 'avatar', 'matte', 'report']
CUT_DIRS = ('01_', '02_', '03_')            # персонаж, предметы, люди — им нужен прозрачный фон
IMG = ('.png', '.jpg', '.jpeg', '.webp')


# ---------- мелочи ----------
def unwrap(d):
    while isinstance(d, dict) and 'data' in d and isinstance(d['data'], (dict, list)) and len(d) <= 3:
        d = d['data']
    return d


class Prep:
    def __init__(self, a):
        self.args = a
        self.proj_path = a[0]
        self.reel = os.path.abspath(a[1])
        self.proj = unwrap(json.load(open(self.proj_path, encoding='utf-8')))
        self.opt = lambda k: a[a.index(k) + 1] if k in a and a.index(k) + 1 < len(a) else None
        self.flag = lambda k: k in a
        self.work = os.path.join(self.reel, 'work')
        self.pub = os.path.join(self.reel, 'public')
        os.makedirs(self.work, exist_ok=True)
        self.logf = open(os.path.join(self.work, 'prep.log'), 'a', encoding='utf-8')
        self.state_path = os.path.join(self.work, 'prep_state.json')
        self.state = json.load(open(self.state_path)) if os.path.exists(self.state_path) else {}
        self.redo = {a[i + 1] for i, x in enumerate(a) if x == '--redo' and i + 1 < len(a)}
        self.notes = []          # строки отчёта
        self.warn = []           # предупреждения в отчёт

    def log(self, *x):
        print(*x, file=self.logf, flush=True)

    def run(self, *cmd, cwd=None, out=False):
        cmd = [str(c) for c in cmd]
        self.log('$', ' '.join(cmd))
        r = subprocess.run(cmd, cwd=cwd, capture_output=True, text=True)
        self.log(r.stdout[-20000:], r.stderr[-20000:])
        if r.returncode:
            tail = (r.stderr or r.stdout).strip().splitlines()[-6:]
            raise RuntimeError(f'{os.path.basename(cmd[1] if cmd[0].startswith("python") else cmd[0])}: код {r.returncode}\n  ' + '\n  '.join(tail))
        return r.stdout if out else None

    def sig(self, *parts):
        return hashlib.md5(json.dumps(parts, ensure_ascii=False, default=str).encode()).hexdigest()[:12]

    def fsig(self, path):
        if not path or not os.path.exists(path): return None
        st = os.stat(path); return [os.path.basename(path), st.st_size, int(st.st_mtime)]

    def done(self, stage, sig):
        return stage not in self.redo and self.state.get(stage) == sig

    def mark(self, stage, sig):
        self.state[stage] = sig
        json.dump(self.state, open(self.state_path, 'w'), indent=1)

    def say(self, stage, text):
        line = f'[{stage}] {text}'
        print(line, flush=True); self.log(line)

    # ---------- входные файлы ----------
    def files_dir(self):
        return self.opt('--files')

    def by_id(self, aid):
        d = self.files_dir()
        if not d or not aid: return None
        hits = sorted(glob.glob(os.path.join(d, '**', aid + '*'), recursive=True))
        return hits[0] if hits else None

    def avatar_src(self):
        p = self.opt('--avatar')
        if p: return os.path.abspath(p)
        av = self.proj.get('avatar') or {}
        p = self.by_id(av.get('id'))
        return os.path.abspath(p) if p else None

    def is_audio(self, path):
        """озвучка без видео: в файле нет видеодорожки (обложка mp3 не считается)"""
        if (self.proj.get('avatar') or {}).get('kind') == 'audio' and not self.opt('--avatar'): return True
        r = subprocess.run(['ffprobe', '-v', 'error', '-select_streams', 'v', '-show_entries',
                            'stream=codec_name:stream_disposition=attached_pic', '-of', 'json', path], capture_output=True, text=True)
        try: streams = json.loads(r.stdout or '{}').get('streams', [])
        except ValueError: streams = []
        return not [x for x in streams if not (x.get('disposition') or {}).get('attached_pic')]

    def voice_as_video(self, src):
        """озвучка → mp4 с чёрным кадром 1080×1920: дальше паузы, ускорение и звук идут как у видео аватара,
        а в кадре спикера нет (раскадровка пульта в этом случае вся из вставок C)"""
        out = os.path.join(self.work, 'voice_video.mp4')
        if os.path.exists(out) and os.path.getmtime(out) >= os.path.getmtime(src): return out
        self.run('ffmpeg', '-y', '-v', 'error', '-f', 'lavfi', '-i', 'color=c=black:s=1080x1920:r=30', '-i', src,
                 '-map', '0:v', '-map', '1:a', '-shortest', '-c:v', 'libx264', '-preset', 'veryfast', '-tune', 'stillimage',
                 '-pix_fmt', 'yuv420p', '-c:a', 'aac', '-b:a', '192k', out)
        return out

    # ---------- 1. папка ролика ----------
    def env(self):
        self.run('bash', os.path.join(HERE, 'setup.sh'))
        self.say('env', 'окружение готово')

    def scaffold(self):
        s = self.sig(self.fsig(os.path.join(TPL, 'package-lock.json')))
        nm = os.path.join(self.reel, 'node_modules')
        if self.done('scaffold', s) and os.path.exists(os.path.join(self.reel, 'package.json')) and os.path.exists(nm):
            self.say('scaffold', 'уже готово'); return
        n = 0
        for src in glob.glob(os.path.join(TPL, '**', '*'), recursive=True):
            rel = os.path.relpath(src, TPL)
            if rel.split(os.sep)[0] == 'node_modules' or not os.path.isfile(src): continue
            dst = os.path.join(self.reel, rel)
            if os.path.exists(dst): continue          # свои файлы ролика не трогаем
            os.makedirs(os.path.dirname(dst), exist_ok=True); shutil.copy2(src, dst); n += 1
        if not os.path.isdir(os.path.join(TPL, 'node_modules')):
            self.say('scaffold', 'ставлю пакеты шаблона (один раз на все ролики)…')
            self.run('npm', 'ci', '--no-audit', '--no-fund', '--loglevel=error', cwd=TPL)
        if not os.path.exists(nm):
            os.symlink(os.path.relpath(os.path.join(TPL, 'node_modules'), self.reel), nm)
        self.mark('scaffold', s)
        self.say('scaffold', f'папка из шаблона: {n} файлов, пакеты — общие с template/')

    # ---------- 2. материалы ----------
    def media(self):
        md = os.path.join(self.pub, 'media')
        pack = self.proj.get('mediaPack') or {}
        parts = [self.by_id(pid) for pid in pack.get('parts') or []]
        src_dir = self.opt('--media')
        s = self.sig([self.fsig(p) for p in parts], src_dir and sorted(os.listdir(src_dir)))
        if self.done('media', s) and os.path.isdir(md):
            self.say('media', f'уже готово: {sum(len(f) for _, _, f in os.walk(md))} файлов'); return
        os.makedirs(md, exist_ok=True)
        n, missing = 0, [pid for pid, p in zip(pack.get('parts') or [], parts) if not p]
        for p in parts:
            if not p: continue
            data = json.load(open(p, encoding='utf-8'))
            for f in data.get('files') or []:
                rel = os.path.normpath(f['path']).lstrip(os.sep)
                if rel.startswith('..'): continue
                dst = os.path.join(md, rel); os.makedirs(os.path.dirname(dst), exist_ok=True)
                open(dst, 'wb').write(base64.b64decode(f['b64'])); n += 1
        if src_dir:
            for f in glob.glob(os.path.join(src_dir, '**', '*'), recursive=True):
                if os.path.isfile(f):
                    dst = os.path.join(md, os.path.relpath(f, src_dir)); os.makedirs(os.path.dirname(dst), exist_ok=True)
                    shutil.copy2(f, dst); n += 1
        if missing: self.warn.append(f'нет файлов пакета материалов {", ".join(missing)} в --files: прочитай их с пульта (Artifact read path=id)')
        for sk in pack.get('skipped') or []:
            self.warn.append(f'не попал в пакет (больше 20 МБ или ошибка Диска): {sk}')
        if not parts and not src_dir:
            self.warn.append('материалов нет: на пульте не собран пакет (раздел «Материалы» → «Собрать пакет для монтажа») и не передан --media')
        self.mark('media', s)
        self.say('media', f'разложено файлов: {n}' + (f' (частей пакета: {len(parts) - len(missing)})' if parts else ''))

    # ---------- 3. вырезка фона у поз и предметов ----------
    def need_cut(self, path):
        from PIL import Image
        im = Image.open(path)
        if im.mode in ('RGBA', 'LA') or 'transparency' in im.info:
            a = im.convert('RGBA').getchannel('A')
            hist = a.histogram(); total = sum(hist)
            if sum(hist[:16]) / total > 0.02: return False   # уже есть прозрачный фон
        return True

    def cutout(self):
        md = os.path.join(self.pub, 'media')
        todo = []
        for d in sorted(glob.glob(os.path.join(md, '*'))):
            if not os.path.basename(d).startswith(CUT_DIRS): continue
            todo += [f for f in sorted(glob.glob(os.path.join(d, '**', '*'), recursive=True)) if f.lower().endswith(IMG)]
        s = self.sig([self.fsig(f) for f in todo])
        if self.done('cutout', s):
            self.say('cutout', 'уже готово'); return
        cut, kept, sheets = 0, 0, []
        need = [f for f in todo if self.need_cut(f)]
        if need:
            self.ensure_rembg()
            from rembg import new_session, remove
            from PIL import Image
            with self.quiet(): ses = new_session('isnet-general-use')
            orig = os.path.join(self.work, 'orig'); os.makedirs(orig, exist_ok=True)
            for f in need:
                im = Image.open(f).convert('RGB')
                with self.quiet(): out = remove(im, session=ses)
                rel = os.path.relpath(f, md); keep = os.path.join(orig, rel)
                os.makedirs(os.path.dirname(keep), exist_ok=True); shutil.move(f, keep)
                png = os.path.splitext(f)[0] + '.png'
                out.save(png); cut += 1
                n = self.blobs(out)
                if n > 1: sheets.append(f'{rel} — {n} объекта')
        kept = len(todo) - len(need)
        # проверка листов и у уже прозрачных
        from PIL import Image
        for f in todo:
            if f in need or not os.path.exists(f): continue
            n = self.blobs(Image.open(f))
            if n > 1: sheets.append(f'{os.path.relpath(f, md)} — {n} объекта')
        for sh in sheets: self.warn.append(f'похоже на лист из нескольких картинок, разрезать: {sh}')
        # проверенные файлы теперь .png — подпись под новые пути
        todo2 = [f for d in sorted(glob.glob(os.path.join(md, '*'))) if os.path.basename(d).startswith(CUT_DIRS)
                 for f in sorted(glob.glob(os.path.join(d, '**', '*'), recursive=True)) if f.lower().endswith(IMG)]
        self.mark('cutout', self.sig([self.fsig(f) for f in todo2]))
        self.say('cutout', f'вырезан фон: {cut}, уже прозрачных: {kept}' + (f', листов: {len(sheets)}' if sheets else ''))

    def blobs(self, im):
        """Сколько крупных отдельных объектов на прозрачной картинке (лист 2×2, 3×3 → больше одного)."""
        try:
            import numpy as np
            from scipy import ndimage
            a = np.asarray(im.convert('RGBA').getchannel('A').resize((200, int(200 * im.height / max(1, im.width))))) > 40
            lab, n = ndimage.label(ndimage.binary_closing(a, iterations=2))
            if n < 2: return n
            sizes = ndimage.sum(np.ones_like(a), lab, range(1, n + 1))
            return int((sizes > 0.04 * a.sum()).sum())
        except Exception:
            return 1

    def quiet(self):
        import contextlib
        return contextlib.redirect_stderr(self.logf)

    def ensure_rembg(self):
        try:
            import rembg, scipy  # noqa
        except ImportError:
            self.say('cutout', 'ставлю rembg (один раз)…')
            self.run(sys.executable, '-m', 'pip', 'install', '-q', 'rembg', 'onnxruntime', 'scipy', '--break-system-packages')

    # ---------- 4. раскадровка ----------
    def story(self):
        sj = os.path.join(self.reel, 'src', 'story.json')
        s = self.sig(self.fsig(self.proj_path), self.state.get('media'), self.state.get('cutout'), self.opt('--anims'), self.flag('--auto'))
        if self.done('story', s) and os.path.exists(sj):
            self.scene_todo = self.state.get('scene_todo', [])
            self.say('story', 'уже готово'); return
        cmd = [sys.executable, os.path.join(HERE, 'pult_to_story.py'), self.proj_path, self.reel]
        an = self.opt('--anims')
        if an:
            if os.path.isdir(an):     # ArtifactData list с out_dir: по файлу на документ
                docs = []
                for f in sorted(glob.glob(os.path.join(an, '**', '*.json'), recursive=True)):
                    d = unwrap(json.load(open(f, encoding='utf-8')))
                    if isinstance(d, dict): d.setdefault('id', os.path.splitext(os.path.basename(f))[0]); docs.append(d)
                an = os.path.join(self.work, 'textanims.json'); json.dump(docs, open(an, 'w'), ensure_ascii=False)
            cmd += ['--anims', an]
        if self.flag('--auto'): cmd.append('--auto')
        out = self.run(*cmd, out=True)
        lines = [l for l in out.strip().splitlines() if l.strip()]
        head = next((l for l in lines if l.startswith('story.json')), '')
        self.scene_todo = [l[2:] for l in lines if l.startswith('! ')]
        self.state['scene_todo'] = self.scene_todo
        # spec_build переписывает story.json — после новой раскадровки его надо прогнать заново
        if self.proj.get('spec'): self.state.pop('avatar', None)
        # звуки монтажа (вжух, удар, поп…) синтезом — StoryMain берёт их из public/sfx
        need = [f for f in ('whoosh', 'hit', 'click', 'pop') if not os.path.exists(os.path.join(self.pub, 'sfx', f + '.wav'))]
        if need: self.run(sys.executable, os.path.join(HERE, 'make_sfx.py'), self.pub)
        self.mark('story', s)
        self.say('story', (head or 'story.json собран') + ('; звуки монтажа синтезированы' if need else ''))

    def rows(self):
        return json.load(open(os.path.join(self.reel, 'src', 'story.json'), encoding='utf-8'))

    # ---------- 5. видео спикера ----------
    def avatar(self):
        src = self.avatar_src()
        spec = bool(self.proj.get('spec'))
        segs = self.proj.get('segs')
        speed = float(self.proj.get('speed') or (1.0 if spec else 1.2))
        s = self.sig(self.fsig(src), segs, speed, spec)
        out = os.path.join(self.pub, 'avatar.mp4')
        if not src:
            self.warn.append('нет видео аватара: прочитай его с пульта (Artifact read path=<avatar.id>) в --files или передай --avatar')
            self.say('avatar', 'пропущено: нет видео аватара'); return
        if self.done('avatar', s) and os.path.exists(out):
            self.say('avatar', 'уже готово'); return
        if self.is_audio(src):
            src = self.voice_as_video(src)
            self.say('avatar', 'голос — озвучка без видео: собрана дорожка с пустым кадром, спикера в кадре не будет')
            if any(r.get('mode') in ('A', 'B') for r in (self.proj.get('sbRows') or [])):
                self.warn.append('голос — озвучка без видео, а в раскадровке есть кадры со спикером (A/B): там будет чёрный кадр. Пересобери раскадровку на пульте')
        if spec:
            self.say('avatar', 'шаблон со спецификацией стиля: spec_build (паузы, распознавание, грейд, звук)…')
            self.run(sys.executable, os.path.join(HERE, 'spec_build.py'), self.reel, '--src', src)
            self.mark('avatar', s)
            self.say('avatar', 'spec_build готов: story.json перенесён на реальные тайминги')
            return
        cmd = [sys.executable, os.path.join(HERE, 'cut_pauses.py'), src, out, '-38', '0.12', speed]
        if segs:
            sp = os.path.join(self.work, 'segs_pult.json'); json.dump(segs, open(sp, 'w')); cmd += ['--segs', sp]
        else:
            self.warn.append('в проекте нет segs: паузы искались заново, тайминги слов пульта могут разойтись с видео')
        self.run(*cmd)
        dur = float(self.run('ffprobe', '-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', out, out=True))
        words = self.proj.get('words') or []
        last = words[-1]['e'] if words else 0
        if words and abs(dur - last) > 0.4:
            self.warn.append(f'видео {dur:.1f} с, а последнее слово пульта кончается на {last:.1f} с: проверь синхрон (возможно, на пульте другое видео аватара)')
        self.mark('avatar', s)
        self.say('avatar', f'паузы вырезаны по пульту, ×{speed}: {dur:.1f} с')

    # ---------- 6. вырезка спикера ----------
    def needs_matte(self, st):
        win = st['settings'].get('win') or 'popout'
        for r in st['rows']:
            if r.get('fx') == 'BgSwap': return True
            if r['mode'] == 'B' and (r.get('win') or win) == 'popout': return True
        return False

    def matte(self):
        st = self.rows()
        av = os.path.join(self.pub, st['settings'].get('avatar') or 'avatar.mp4')
        cut = os.path.join(self.pub, st['settings'].get('avatarCut') or 'avatar_cut.webm')
        if self.flag('--no-matte') or not self.needs_matte(st):
            self.say('matte', 'не нужна' + (' (--no-matte)' if self.flag('--no-matte') else ': окон «Вырезка» и BgSwap нет')); return
        if not os.path.exists(av):
            self.say('matte', 'пропущено: нет видео спикера'); return
        s = self.sig(self.fsig(av), self.flag('--plate-fix'))
        if self.done('matte', s) and os.path.exists(cut):
            self.say('matte', 'уже готово'); return
        self.ensure_rembg()
        m = os.path.join(self.work, 'matte')
        for d in ('fr', 'full', 'rgba', 'rgba2'): shutil.rmtree(os.path.join(m, d), ignore_errors=True)
        for d in ('fr', 'full', 'rgba'): os.makedirs(os.path.join(m, d))
        for f in ('plate.npy', 'platevalid.npy'):
            if os.path.exists(os.path.join(m, f)): os.remove(os.path.join(m, f))
        t0 = time.time()
        self.say('matte', 'вырезаю спикера (~0.7 с на кадр)…')
        self.run('ffmpeg', '-v', 'error', '-i', av, '-vf', 'scale=540:960', os.path.join(m, 'fr', '%05d.png'))
        self.run('ffmpeg', '-v', 'error', '-i', av, '-vf', 'scale=720:1280', os.path.join(m, 'full', '%05d.png'))
        self.run(sys.executable, os.path.join(HERE, 'matte', 'matte.py'), cwd=m)
        frames = 'rgba'
        if self.flag('--plate-fix'):
            self.run(sys.executable, os.path.join(HERE, 'matte', 'plate_fix.py'), 'all', cwd=m); frames = 'rgba2'
        self.run('ffmpeg', '-y', '-v', 'error', '-framerate', '30', '-i', os.path.join(m, frames, '%05d.png'),
                 '-c:v', 'libvpx-vp9', '-pix_fmt', 'yuva420p', '-b:v', '4M', '-auto-alt-ref', '0', cut)
        self.mark('matte', s)
        n = len(os.listdir(os.path.join(m, frames)))
        self.say('matte', f'спикер вырезан: {n} кадров за {int(time.time() - t0)} с → public/{os.path.basename(cut)}')

    # ---------- 7. лист и отчёт ----------
    def font(self):
        from PIL import ImageFont
        for f in ('/usr/share/fonts/truetype/dejavu/DejaVuSansCondensed.ttf', '/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf',
                  *glob.glob('/usr/share/fonts/**/DejaVuSans*.ttf', recursive=True)):
            if os.path.exists(f): return ImageFont.truetype(f, 12)
        return ImageFont.load_default()

    def report(self):
        from PIL import Image, ImageDraw
        fnt = self.font()
        st = self.rows()
        md = os.path.join(self.pub, 'media')
        pics = [f for f in sorted(glob.glob(os.path.join(md, '**', '*'), recursive=True)) if f.lower().endswith(IMG)]
        tiles = []
        for f in pics[:40]:
            try:
                im = Image.open(f).convert('RGBA'); im.thumbnail((220, 220))
                bg = Image.new('RGBA', (230, 250), (255, 0, 255, 255) if os.path.basename(os.path.dirname(f)).startswith(CUT_DIRS) else (240, 240, 240, 255))
                bg.alpha_composite(im, ((230 - im.width) // 2, (230 - im.height) // 2))
                ImageDraw.Draw(bg).text((4, 233), os.path.basename(f)[:32], fill=(0, 0, 0, 255), font=fnt)
                tiles.append(bg)
            except Exception:
                pass
        cut = os.path.join(self.pub, st['settings'].get('avatarCut') or 'avatar_cut.webm')
        if os.path.exists(cut):   # два кадра вырезки на пурпурном — видно края и прилипший фон
            dur = st.get('duration') or 10
            for t in (dur * 0.25, dur * 0.7):
                fp = os.path.join(self.work, f'cut_{int(t)}.png')
                try:
                    self.run('ffmpeg', '-y', '-v', 'error', '-c:v', 'libvpx-vp9', '-ss', f'{t:.2f}', '-i', cut, '-frames:v', '1', fp)
                    im = Image.open(fp).convert('RGBA'); im.thumbnail((220, 230))
                    bg = Image.new('RGBA', (230, 250), (255, 0, 255, 255)); bg.alpha_composite(im, ((230 - im.width) // 2, 0))
                    ImageDraw.Draw(bg).text((4, 233), f'вырезка {t:.1f} с', fill=(0, 0, 0, 255), font=fnt); tiles.append(bg)
                except Exception:
                    pass
        sheet = None
        if tiles:
            cols = 6; rows = (len(tiles) + cols - 1) // cols
            S = Image.new('RGB', (cols * 230, rows * 250), (255, 255, 255))
            for i, t in enumerate(tiles): S.paste(t.convert('RGB'), ((i % cols) * 230, (i // cols) * 250))
            sheet = os.path.join(self.work, 'prep_sheet.jpg'); S.save(sheet, quality=82)
        # отчёт
        rows = st['rows']; tot = sum(r['e'] - r['s'] for r in rows) or 1
        sh = {m: round(100 * sum(r['e'] - r['s'] for r in rows if r['mode'] == m) / tot) for m in 'ABC'}
        print('\n=== ГОТОВО К СЦЕНАМ ===')
        print(f'Ролик {os.path.relpath(self.reel, ROOT)}: {st["duration"]} с, {len(rows)} сегментов, A {sh["A"]}% / B {sh["B"]}% / C {sh["C"]}%.')
        print(f'Материалы: {len(pics)} картинок' + (f', лист {os.path.relpath(sheet, ROOT)} (пурпур = прозрачность)' if sheet else '') + '.')
        todo = getattr(self, 'scene_todo', [])
        if todo:
            print('Сцены и файлы по раскадровке:')
            for t in todo: print('  -', t)
        if self.warn:
            print('Проверить:')
            for w in self.warn: print('  !', w)
        if self.flag('--auto'): return
        print('Дальше: свои сцены в template/src/story/registry.tsx по списку выше → стоп-кадры листом → '
              f'COMP=Story tools/render.sh {os.path.relpath(self.reel, ROOT)} out.mp4 (запускать в фоне).')
        print(f'Полный лог: {os.path.relpath(os.path.join(self.work, "prep.log"), ROOT)}')

    def main(self):
        self.log(f'\n===== {time.strftime("%Y-%m-%d %H:%M:%S")} {" ".join(sys.argv)}')
        for stage in STAGES:
            try:
                getattr(self, stage)()
            except Exception as e:
                self.say(stage, f'ОШИБКА: {e}')
                print(f'Исправь и запусти ту же команду ещё раз — сделанные этапы пропустятся. Лог: {os.path.join(self.work, "prep.log")}')
                sys.exit(1)


if __name__ == '__main__':
    a = sys.argv[1:]
    if len(a) < 2 or a[0].startswith('-'): sys.exit(__doc__)
    Prep(a).main()
