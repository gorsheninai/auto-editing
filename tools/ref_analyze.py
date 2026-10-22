#!/usr/bin/env python3
"""Анализ референса по 7 разделам монтажа → report.json с цифрами + листы кадров для визуальной проверки.

python3 tools/ref_analyze.py ref.mp4 out_dir [--lang en|ru]

1. Материалы кадра — тип каждого плана: спикер (лицо крупно), человек/B-roll, скриншот/документ (много текста),
   плоская графика (мало цветов), карточка (однотонный фон), чёрный/белый кадр.
2. Текст и оформление — OCR каждые 1/3 с: события текста (текст, вход/выход, рамка, размер шрифта в px при 1920,
   цвет, регистр, слов на экране), роль (субтитр / заголовок / подпись), анимация входа и выхода по полным кадрам
   (резкий / из размытия / проявление / масштаб / сдвиг / печать), длительность анимации.
3. Моушн и камера — оптический поток внутри плана: наезд/отъезд (скорость), панорама, тряска.
4. Композиция — положение и размер лица (крупность), разделённый экран, окно.
5. Монтаж и ритм — склейки (точно по кадрам), длины планов, очереди быстрых планов, тип каждого перехода
   (жёсткий, растворение, вспышка, затемнение, смаз/проброс, зум), смена крупности спикера через склейку,
   привязка склеек и текста к словам (по распознанной речи).
6. Звук — LUFS, пиковый уровень, подложка (уровень под голосом), темп и чёткость бита, звуковые эффекты
   (время, тип, уровень относительно голоса, доля на склейках), темп речи и паузы.
7. Обработка изображения — яркость, контраст, чёрная/белая точка, насыщенность, тёплый/холодный баланс в тенях
   и светах (teal-orange), виньетка, зерно, резкость, ч/б планы.
"""
import json, os, re, subprocess, sys, math, difflib
import numpy as np
import cv2

ASR_DIR = os.environ.get('ASR_HOME', '/home/claude/asr')
YUNET = os.path.join(ASR_DIR, 'haar', 'yunet.onnx')

def run(cmd): return subprocess.run(cmd, capture_output=True, text=True)

def probe(src):
    j = json.loads(run(['ffprobe', '-v', 'error', '-show_entries', 'format=duration:stream=codec_type,width,height,r_frame_rate', '-of', 'json', src]).stdout)
    v = next(s for s in j['streams'] if s['codec_type'] == 'video')
    n, d = v['r_frame_rate'].split('/')
    return float(j['format']['duration']), int(v['width']), int(v['height']), float(n) / float(d or 1), any(s['codec_type'] == 'audio' for s in j['streams'])

def read_frames(src, fps, w, h, ss=None, t=None):
    cmd = ['ffmpeg', '-v', 'error']
    if ss is not None: cmd += ['-ss', f'{max(0, ss):.3f}']
    cmd += ['-i', src]
    if t is not None: cmd += ['-t', f'{t:.3f}']
    cmd += ['-vf', (f'fps={fps},' if fps else '') + f'scale={w}:{h}:force_original_aspect_ratio=increase,crop={w}:{h}', '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-']
    raw = subprocess.run(cmd, capture_output=True).stdout
    n = len(raw) // (w * h * 3)
    return np.frombuffer(raw[:n * w * h * 3], np.uint8).reshape(n, h, w, 3)

def hexc(rgb): return '#%02X%02X%02X' % tuple(int(max(0, min(255, v))) for v in rgb)

# ---------- 7. изображение: статистика кадра ----------
def frame_stats(rgb):
    f = rgb.astype(np.float32) / 255
    L = 0.2126 * f[..., 0] + 0.7152 * f[..., 1] + 0.0722 * f[..., 2]
    hsv = cv2.cvtColor(rgb, cv2.COLOR_RGB2HSV)
    S = hsv[..., 1].astype(np.float32) / 255
    lo, hi = L < np.percentile(L, 25), L > np.percentile(L, 75)
    rb = f[..., 0] - f[..., 2]
    h, w = L.shape
    c = L[h // 4:3 * h // 4, w // 4:3 * w // 4].mean(); corners = np.concatenate([L[:h // 6, :w // 6].ravel(), L[:h // 6, -w // 6:].ravel(), L[-h // 6:, :w // 6].ravel(), L[-h // 6:, -w // 6:].ravel()]).mean()
    g = (L * 255).astype(np.uint8)
    lap = cv2.Laplacian(g, cv2.CV_32F)
    hp = g.astype(np.float32) - cv2.GaussianBlur(g, (0, 0), 1.2).astype(np.float32)
    flat = cv2.GaussianBlur(np.abs(cv2.Sobel(g, cv2.CV_32F, 1, 1)), (0, 0), 3) < 4
    q = (f * 15.99).astype(np.int32); keys = q[..., 0] * 256 + q[..., 1] * 16 + q[..., 2]
    top = np.sort(np.bincount(keys.ravel(), minlength=4096))[::-1]
    return {'L': float(L.mean()), 'C': float(L.std()), 'black': float(np.percentile(L, 2)), 'white': float(np.percentile(L, 98)), 'S': float(S.mean()),
            'warm_sh': float(rb[lo].mean()) if lo.any() else 0.0, 'warm_hi': float(rb[hi].mean()) if hi.any() else 0.0,
            'vign': float(corners / max(c, 1e-3)), 'sharp': float(lap.var()), 'grain': float(hp[flat].std()) if flat.sum() > 200 else 0.0,
            'flat': float(top[:16].sum() / keys.size)}

# ---------- 4. лица ----------
_fd = None
def faces(rgb):
    global _fd
    h, w = rgb.shape[:2]
    if _fd is None: _fd = cv2.FaceDetectorYN.create(YUNET, '', (w, h), 0.7)
    _fd.setInputSize((w, h))
    _, res = _fd.detect(cv2.cvtColor(rgb, cv2.COLOR_RGB2BGR))
    if res is None: return []
    return sorted([{'x': float(r[0] / w), 'y': float(r[1] / h), 'w': float(r[2] / w), 'h': float(r[3] / h), 'score': float(r[14])} for r in res], key=lambda q: -q['h'])

# ---------- 5. склейки и переходы ----------
def scene_cuts(src, thr=0.3):
    """Склейки по всем кадрам: разница кадров (яркость + цвет + гистограмма) против локального фона.
    ffmpeg scene пропускает склейки между похожими по тону планами — поэтому свой детектор."""
    fr = read_frames(src, None, 72, 128); fps = probe(src)[3]
    if len(fr) < 3: return []
    f = fr.astype(np.float32) / 255
    d = np.zeros(len(f)); cov = np.zeros(len(f))
    for i in range(1, len(f)):
        cov[i] = (np.abs(f[i] - f[i - 1]).max(2) > 0.1).mean()   # какая доля кадра поменялась (склейка меняет почти весь кадр)
        h1 = np.histogram(f[i - 1].mean(2), 32, (0, 1))[0]; h2 = np.histogram(f[i].mean(2), 32, (0, 1))[0]
        d[i] = np.abs(f[i] - f[i - 1]).mean() + 0.5 * np.abs(h1 - h2).sum() / h1.sum()
    cuts = []
    for i in range(1, len(f)):
        lo, hi = max(1, i - 8), min(len(f), i + 9)
        loc = np.median(np.concatenate([d[lo:i], d[i + 1:hi]])) if hi - lo > 2 else 0
        nb = max(d[i - 1], d[i + 1] if i + 1 < len(d) else 0)
        if d[i] > 0.06 and d[i] > 3.5 * loc + 0.02 and d[i] > 1.6 * nb and cov[i] > 0.3:
            t = round(i / fps, 3)
            if not cuts or t - cuts[-1] > 0.12: cuts.append(t)
    return cuts

def scene_cuts_ffmpeg(src, thr=0.3):
    r = run(['ffmpeg', '-hide_banner', '-i', src, '-filter:v', f"select='gt(scene,{thr})',showinfo", '-an', '-f', 'null', '-'])
    ts = [float(m) for m in re.findall(r'pts_time:([0-9.]+)', r.stderr)]
    out = []
    for t in ts:
        if not out or t - out[-1] > 0.12: out.append(round(t, 3))
    return out

def classify_transition(src, t, fps):
    k = 8; fr = read_frames(src, None, 180, 320, ss=t - k / fps, t=(2 * k + 1) / fps)
    if len(fr) < 6: return {'type': 'hard', 'frames': 1}
    g = fr.astype(np.float32).mean(axis=3) / 255
    d = np.array([np.abs(g[i + 1] - g[i]).mean() for i in range(len(g) - 1)])
    lum = g.mean(axis=(1, 2))
    sharp = np.array([cv2.Laplacian((x * 255).astype(np.uint8), cv2.CV_32F).var() for x in g])
    base = np.median(d) + 1e-4; i = int(np.argmax(d))
    big = np.where(d > max(base * 3, d[i] * 0.35))[0]
    span = int(big.max() - big.min() + 1) if len(big) else 1
    # вспышка/провал — это всплеск и возврат: ярче (темнее) ОБОИХ краёв окна; переход «белая карточка → тёмный кадр» — обычная склейка
    lo, hi = lum[:3].mean(), lum[-3:].mean()
    if lum.max() > 0.85 and lum.max() - max(lo, hi) > 0.25: return {'type': 'flash', 'frames': int((lum > max(lo, hi) + 0.15).sum())}
    if lum.min() < 0.05 and min(lo, hi) - lum.min() > 0.12: return {'type': 'dip_black', 'frames': int((lum < 0.08).sum())}
    ds = np.sort(d)[::-1]
    if ds[0] > 2.2 * ds[1]:  # один кадр явно главный — жёсткая склейка (даже если в плане есть движение)
        sb, sa = np.median(sharp[:max(1, i - 1)]), np.median(sharp[i + 3:]) if i + 3 < len(sharp) else np.median(sharp)
        if sharp[max(0, i - 1)] < sb * 0.3 or (i + 1 < len(sharp) and sharp[i + 1] < sa * 0.3): return {'type': 'whip_blur', 'frames': 2}
        return {'type': 'hard', 'frames': 1}
    if span >= 3:
        a, b = g[max(0, big.min() - 1)], g[min(len(g) - 1, big.max() + 1)]
        res = []
        for j in range(big.min(), big.max() + 1):
            m = g[j]; den = ((a - b) ** 2).sum() + 1e-6; al = float(((m - b) * (a - b)).sum() / den)
            res.append(np.abs(m - (al * a + (1 - al) * b)).mean())
        if np.mean(res) < 0.035: return {'type': 'dissolve', 'frames': span}
        if sharp[big.min():big.max() + 1].min() < np.median(sharp) * 0.35: return {'type': 'whip_blur', 'frames': span}
        return {'type': 'hard', 'frames': 1, 'note': 'движение в кадре'}
    # смаз: резкость у склейки падает относительно СВОЕЙ стороны (до — к кадрам до, после — к кадрам после)
    sb, sa = np.median(sharp[:max(1, i - 1)]), np.median(sharp[i + 3:]) if i + 3 < len(sharp) else np.median(sharp)
    if sharp[max(0, i - 1)] < sb * 0.3 or (i + 1 < len(sharp) and sharp[i + 1] < sa * 0.3): return {'type': 'whip_blur', 'frames': 2}
    return {'type': 'hard', 'frames': 1}

# ---------- 3. камера: оптический поток ----------
def camera_motion(grays):
    if len(grays) < 2: return {'zoom_per_s': 0.0, 'pan_x': 0.0, 'pan_y': 0.0, 'shake': 0.0}
    zs, tx, ty = [], [], []
    h, w = grays[0].shape; yy, xx = np.mgrid[0:h, 0:w]; xc, yc = (xx - w / 2) / w, (yy - h / 2) / h
    for a, b in zip(grays[:-1], grays[1:]):
        fl = cv2.calcOpticalFlowFarneback(a, b, None, 0.5, 3, 15, 3, 5, 1.2, 0)
        fx, fy = fl[..., 0] / w, fl[..., 1] / h
        A = np.stack([np.concatenate([xc.ravel(), yc.ravel()]), np.concatenate([np.ones(xc.size), np.zeros(xc.size)]), np.concatenate([np.zeros(xc.size), np.ones(xc.size)])], 1)
        sol, *_ = np.linalg.lstsq(A, np.concatenate([fx.ravel(), fy.ravel()]), rcond=None)
        zs.append(sol[0]); tx.append(sol[1]); ty.append(sol[2])
    zs, tx, ty = np.array(zs), np.array(tx), np.array(ty)
    return {'zoom_per_s': float(np.median(zs) * 10), 'pan_x': float(np.median(tx) * 10), 'pan_y': float(np.median(ty) * 10),
            'shake': float(np.std(tx - np.median(tx)) + np.std(ty - np.median(ty)))}

# ---------- 2. текст: OCR и события ----------
_ocr = None
def ocr(rgb):
    global _ocr
    if _ocr is None:
        from rapidocr_onnxruntime import RapidOCR
        _ocr = RapidOCR()
    res, _ = _ocr(cv2.cvtColor(rgb, cv2.COLOR_RGB2BGR))
    h, w = rgb.shape[:2]; out = []
    for box, txt, sc in (res or []):
        if float(sc) < 0.6 or not txt.strip(): continue
        p = np.array(box, np.float32); x0, y0 = p.min(0); x1, y1 = p.max(0)
        out.append({'text': txt.strip(), 'x0': float(x0 / w), 'y0': float(y0 / h), 'x1': float(x1 / w), 'y1': float(y1 / h)})
    return out

def text_color(rgb, b):
    h, w = rgb.shape[:2]
    x0, y0, x1, y1 = int(b['x0'] * w), int(b['y0'] * h), int(b['x1'] * w) + 1, int(b['y1'] * h) + 1
    crop = rgb[max(0, y0):y1, max(0, x0):x1].reshape(-1, 3).astype(np.float32)
    if len(crop) < 20: return None
    L = crop @ np.array([0.2126, 0.7152, 0.0722], np.float32)
    thr, _ = cv2.threshold(L.astype(np.uint8).reshape(-1, 1), 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)
    hi, lo = crop[L > thr], crop[L <= thr]
    ring = np.concatenate([rgb[max(0, y0 - 4):y0, max(0, x0):x1].reshape(-1, 3), rgb[y1:y1 + 4, max(0, x0):x1].reshape(-1, 3)]).astype(np.float32)
    bgL = (ring @ np.array([0.2126, 0.7152, 0.0722], np.float32)).mean() if len(ring) else 128
    txt = hi if abs(hi.mean() - bgL if len(hi) else 0) > abs(lo.mean() - bgL if len(lo) else 0) else lo
    return hexc(np.median(txt, 0)) if len(txt) else None

def x_height(rgb, b, H=1920):
    h, w = rgb.shape[:2]
    x0, y0, x1, y1 = int(b['x0'] * w), int(b['y0'] * h), int(b['x1'] * w) + 1, int(b['y1'] * h) + 1
    c = cv2.cvtColor(rgb[max(0, y0):y1, max(0, x0):x1], cv2.COLOR_RGB2GRAY)
    if c.size < 30: return None
    _, m = cv2.threshold(c, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)
    if (m > 0).mean() > 0.5: m = 255 - m
    prof = (m > 0).mean(1); core = np.where(prof > prof.max() * 0.45)[0]
    return round(float((core.max() - core.min() + 1) / h * H), 1) if len(core) else None

def text_events(samples, step):
    ev, open_ = [], []
    for t, items in samples:
        nxt = []
        for it in items:
            cx, cy = (it['x0'] + it['x1']) / 2, (it['y0'] + it['y1']) / 2
            m = None
            for e in open_:
                ex, ey = (e['x0'] + e['x1']) / 2, (e['y0'] + e['y1']) / 2
                if abs(cx - ex) < 0.12 and abs(cy - ey) < 0.05 and difflib.SequenceMatcher(None, e['text'].lower(), it['text'].lower()).ratio() > 0.7: m = e; break
            if m: m['t_out'] = t + step; m['n'] += 1; open_.remove(m); nxt.append(m)
            else: e = {**it, 't_in': t, 't_out': t + step, 'n': 1}; ev.append(e); nxt.append(e)
        open_ = nxt
    return ev

def text_anim(src, e, fps, W=360, H=640, phase='in'):
    t0 = (e['t_in'] if phase == 'in' else e['t_out']) - 0.35
    fr = read_frames(src, None, W, H, ss=t0, t=0.8)
    if len(fr) < 6: return None
    x0, y0, x1, y1 = e['x0'], e['y0'], e['x1'], e['y1']; pw, ph = (x1 - x0) * 0.25, (y1 - y0) * 0.6
    X0, Y0, X1, Y1 = int(max(0, x0 - pw) * W), int(max(0, y0 - ph) * H), int(min(1, x1 + pw) * W), int(min(1, y1 + ph) * H)
    crops = [cv2.cvtColor(f[Y0:Y1, X0:X1], cv2.COLOR_RGB2GRAY).astype(np.float32) for f in fr]
    E = np.array([c.std() for c in crops]); S = np.array([cv2.Laplacian(c, cv2.CV_32F).var() for c in crops])
    ref = crops[-1] if phase == 'in' else crops[0]; bg = crops[0] if phase == 'in' else crops[-1]
    masks = [np.abs(c - bg) > 25 for c in crops]
    def bbox(m):
        ys, xs = np.where(m)
        return (xs.min(), ys.min(), xs.max(), ys.max()) if len(xs) > 15 else None
    seq = list(range(len(crops))) if phase == 'in' else list(range(len(crops)))[::-1]
    Ef, Sf = E[seq[-1]], S[seq[-1]] + 1e-6
    prog = [(E[i] - E[seq[0]]) / (Ef - E[seq[0]] + 1e-6) for i in seq]
    start = next((k for k, p in enumerate(prog) if p > 0.1), 0); end = next((k for k, p in enumerate(prog) if p > 0.9), len(prog) - 1)
    frames_n = max(1, end - start + 1)
    mid = seq[min(len(seq) - 1, start + frames_n // 2)]
    blurred = (S[mid] / Sf) < 0.45 * (prog[min(len(prog) - 1, start + frames_n // 2)] ** 2 + 0.05)
    bb = [bbox(masks[i]) for i in seq[start:end + 1]]; bb = [b for b in bb if b]
    scale = slide = 0.0
    if len(bb) >= 2:
        wa, wb = bb[0][2] - bb[0][0] + 1, bb[-1][2] - bb[-1][0] + 1; scale = float(wa / max(1, wb))
        slide = float(((bb[0][1] + bb[0][3]) / 2 - (bb[-1][1] + bb[-1][3]) / 2) / H)
    if frames_n <= 2: kind = 'cut'
    elif blurred: kind = 'blur'
    elif abs(scale - 1) > 0.12: kind = 'scale'
    elif abs(slide) > 0.01: kind = 'slide'
    elif len(bb) >= 3 and bb[0][2] - bb[0][0] < 0.6 * (bb[-1][2] - bb[-1][0]): kind = 'typewriter'
    else: kind = 'fade'
    t_exact = t0 + (seq[start] if phase == 'in' else seq[end]) / fps
    return {'kind': kind, 'ms': int(frames_n / fps * 1000), 'scale_from': round(scale, 2), 'slide': round(slide, 3), 't_exact': round(t_exact, 3)}

# ---------- 6. звук ----------
def audio_analysis(src, dur, cuts, words):
    import librosa
    sr = 22050; y = np.frombuffer(subprocess.run(['ffmpeg', '-v', 'error', '-i', src, '-ac', '1', '-ar', str(sr), '-f', 'f32le', '-'], capture_output=True).stdout, np.float32).copy()
    if not len(y): return None
    hop = 441; rms = librosa.feature.rms(y=y, frame_length=882, hop_length=hop)[0]; db = 20 * np.log10(rms + 1e-9)
    t = np.arange(len(rms)) * hop / sr
    r = run(['ffmpeg', '-hide_banner', '-i', src, '-af', 'ebur128=peak=true', '-f', 'null', '-'])
    I = re.findall(r'I:\s+(-?[0-9.]+) LUFS', r.stderr); LRA = re.findall(r'LRA:\s+([0-9.]+) LU', r.stderr); TP = re.findall(r'Peak:\s+(-?[0-9.]+) dBFS', r.stderr)
    voice = db[db > np.percentile(db, 60)]
    bed = float(np.percentile(db, 10) - np.percentile(db, 90))
    onset = librosa.onset.onset_strength(y=y, sr=sr, hop_length=512)
    # темп без трекинга долей: beat_track в librosa 1.0 + numba 0.68 падает с segfault на части роликов (localmax)
    tempo = librosa.feature.tempo(onset_envelope=onset, sr=sr, hop_length=512)
    ac = librosa.autocorrelate(onset - onset.mean()); ac = ac / (ac[0] + 1e-9)
    lag = int(round(60 / max(float(np.atleast_1d(tempo)[0]), 1) * sr / 512)) if np.atleast_1d(tempo)[0] > 0 else 0
    pulse = float(ac[lag]) if 0 < lag < len(ac) else 0.0
    # эффекты: по полосам 44,1 кГц, кадр 20 мс. Вжух — шум в 9–16 кГц выше фона на 10+ дБ дольше 0,2 с
    # (шипящие короче и ниже), удар — скачок 30–120 Гц на склейке. Уровни меряются одинаково для референса и нашего ролика.
    sr2 = 44100; y2 = np.frombuffer(subprocess.run(['ffmpeg', '-v', 'error', '-i', src, '-ac', '1', '-ar', str(sr2), '-f', 'f32le', '-'], capture_output=True).stdout, np.float32).copy()
    S = np.abs(librosa.stft(y2, n_fft=2048, hop_length=882)) ** 2; fq = librosa.fft_frequencies(sr=sr2, n_fft=2048); tt2 = np.arange(S.shape[1]) * 882 / sr2
    band = lambda a, b: 10 * np.log10(S[(fq >= a) & (fq < b)].sum(0) + 1e-12)
    hb, lb, vb = band(9000, 16000), band(30, 120), band(300, 3000)
    speech_fr = vb > np.percentile(vb, 55)
    vmed = float(np.median(vb[speech_fr]))
    hb_base = np.median(hb); sfx = []; k = 0
    while k < len(hb):
        if hb[k] > hb_base + 10:
            e2 = k
            while e2 < len(hb) and hb[e2] > hb_base + 7: e2 += 1
            if (e2 - k) * 0.02 >= 0.2:
                tt = float(tt2[k]); sfx.append({'t': round(tt, 2), 'len': round((e2 - k) * 0.02, 2), 'kind': 'whoosh', 'level_rel_voice_db': round(float(hb[k:e2].max()) - vmed, 1),
                                                'on_cut': bool(len(cuts) and min(abs(c - tt) for c in cuts) < 0.35)})
            k = max(e2, k + 1)
        else: k += 1
    for c in cuts:
        f0 = int(c / 0.02)
        if 10 < f0 < len(lb) - 5:
            jump = lb[f0 - 1:f0 + 3].max() - np.median(lb[f0 - 25:f0 - 3])
            if jump > 12: sfx.append({'t': round(c, 2), 'len': 0.3, 'kind': 'hit', 'level_rel_voice_db': round(float(lb[f0 - 1:f0 + 3].max()) - vmed, 1), 'on_cut': True})
    sfx.sort(key=lambda q: q['t'])
    bed_low_rel = round(float(np.median(lb)) - vmed, 1)
    sp = {}
    if words:
        gaps = [words[i + 1]['s'] - words[i]['e'] for i in range(len(words) - 1)]
        sp = {'words': len(words), 'wpm': round(len(words) / (dur / 60), 1), 'pauses_over_0_3s': int(sum(g > 0.3 for g in gaps)),
              'max_pause': round(max(gaps or [0]), 2), 'median_gap': round(float(np.median(gaps)) if gaps else 0, 3)}
    return {'lufs': float(I[-1]) if I else None, 'lra': float(LRA[-1]) if LRA else None, 'true_peak': float(TP[-1]) if TP else None,
            'bed_rel_db': round(bed, 1), 'bed_low_rel_voice_db': bed_low_rel, 'music_likely': bool(bed > -30 or bed_low_rel > -25 or pulse > 0.25), 'tempo': round(float(np.atleast_1d(tempo)[0]), 1), 'pulse': round(pulse, 2),
            'sfx': sfx, 'sfx_per_min': round(len(sfx) / (dur / 60), 1), 'sfx_on_cut_share': round(sum(s['on_cut'] for s in sfx) / max(1, len(sfx)), 2),
            'sfx_level_rel_voice_db': round(float(np.median([s['level_rel_voice_db'] for s in sfx])), 1) if sfx else None, 'speech': sp}

def transcribe(src, lang):
    try:
        import sherpa_onnx
    except Exception: return []
    m = os.path.join(ASR_DIR, 'sherpa-onnx-zipformer-gigaspeech-2023-12-12' if lang == 'en' else 'sherpa-onnx-zipformer-ru-2024-09-18')
    if not os.path.isdir(m): return []
    enc = next(f for f in sorted(os.listdir(m)) if f.startswith('encoder') and f.endswith('int8.onnx'))
    dec = next(f for f in sorted(os.listdir(m)) if f.startswith('decoder') and f.endswith('.onnx') and 'int8' not in f)
    joi = next(f for f in sorted(os.listdir(m)) if f.startswith('joiner') and f.endswith('int8.onnx'))
    rec = sherpa_onnx.OfflineRecognizer.from_transducer(encoder=f'{m}/{enc}', decoder=f'{m}/{dec}', joiner=f'{m}/{joi}', tokens=f'{m}/tokens.txt', num_threads=2)
    raw = subprocess.run(['ffmpeg', '-v', 'error', '-i', src, '-ac', '1', '-ar', '16000', '-f', 'f32le', '-'], capture_output=True).stdout
    x = np.frombuffer(raw, np.float32); words = []
    for a in range(0, len(x), 16000 * 20):
        s = rec.create_stream(); s.accept_waveform(16000, x[a:a + 16000 * 20]); rec.decode_stream(s); r = s.result; cur = None
        for tok, ts in zip(r.tokens, r.timestamps):
            ts += a / 16000
            if tok.startswith((' ', '▁')) or cur is None:
                if cur: words.append(cur)
                cur = {'w': tok.replace('▁', '').strip(), 's': round(ts, 3), 'e': round(ts + 0.1, 3)}
            else: cur['w'] += tok; cur['e'] = round(ts + 0.1, 3)
        if cur: words.append(cur)
    words = [w for w in words if w['w']]
    for i in range(len(words) - 1): words[i]['e'] = round(min(max(words[i]['e'], words[i]['s'] + 0.08), words[i + 1]['s']), 3)
    return words

# ---------- листы для глаз ----------
def sheet(frames, labels, path, cols=6):
    if not len(frames): return
    h, w = frames[0].shape[:2]; rows = (len(frames) + cols - 1) // cols
    out = np.zeros((rows * h, cols * w, 3), np.uint8)
    for i, (f, l) in enumerate(zip(frames, labels)):
        y, x = (i // cols) * h, (i % cols) * w; out[y:y + h, x:x + w] = f
        cv2.rectangle(out, (x, y), (x + 8 + 9 * len(l), y + 20), (0, 0, 0), -1); cv2.putText(out, l, (x + 4, y + 15), cv2.FONT_HERSHEY_SIMPLEX, 0.45, (255, 255, 255), 1)
    cv2.imwrite(path, cv2.cvtColor(out, cv2.COLOR_RGB2BGR), [cv2.IMWRITE_JPEG_QUALITY, 82])

def main():
    a = sys.argv[1:]; src, out = a[0], a[1]; lang = a[a.index('--lang') + 1] if '--lang' in a else 'en'
    os.makedirs(out, exist_ok=True)
    dur, W0, H0, fps, has_a = probe(src)
    print('кадры и статистика…', flush=True)
    fr = read_frames(src, 10, 360, 640)
    ts = np.arange(len(fr)) / 10
    stats = [frame_stats(f) for f in fr]
    fcs = [faces(f) for f in fr]
    grays = [cv2.cvtColor(cv2.resize(f, (180, 320)), cv2.COLOR_RGB2GRAY) for f in fr]
    print('склейки и переходы…', flush=True)
    cuts = scene_cuts(src)
    trans = [{'t': c, **classify_transition(src, c, fps)} for c in cuts]
    bounds = [0.0] + cuts + [dur]
    print('распознавание речи…', flush=True)
    words = transcribe(src, lang) if has_a else []
    print('текст на экране…', flush=True)
    step = 1 / 3; samples = []
    for t in np.arange(0.05, dur, step):
        i = min(len(fr) - 1, int(round(t * 10))); samples.append((float(t), ocr(fr[i])))
    events = text_events(samples, step)
    for e in events:
        e['h_px'] = round((e['y1'] - e['y0']) * 1920 * 0.82)  # ≈ кегль при 1080×1920
        i = min(len(fr) - 1, int(round(((e['t_in'] + e['t_out']) / 2) * 10)))
        e['color'] = text_color(fr[i], e)
        try:
            hi = read_frames(src, None, 1080, 1920, ss=(e['t_in'] + e['t_out']) / 2, t=0.04) if (e['t_out'] - e['t_in']) < 3 and len(events) < 400 else []
            e['xh_px'] = x_height(hi[0], e) if len(hi) else None
        except Exception: e['xh_px'] = None
        e['case'] = 'upper' if e['text'].isupper() else 'lower' if e['text'].islower() else 'mixed'
        e['words'] = len(e['text'].split()); e['dur'] = round(e['t_out'] - e['t_in'], 2)
        e['y_rel'] = round((e['y0'] + e['y1']) / 2, 3); e['x_rel'] = round((e['x0'] + e['x1']) / 2, 3)
        e['role'] = 'title' if (e['h_px'] >= 85 or (e['dur'] >= 1.3 and e['h_px'] >= 60)) else ('label' if e['dur'] >= 1.8 else 'subtitle')
    titles = [e for e in events if e['role'] == 'title']
    subs = [e for e in events if e['role'] == 'subtitle']
    print(f'анимация текста ({len(titles)} заголовков, {len(subs)} субтитров)…', flush=True)
    for e in titles + subs[::max(1, len(subs) // 12)][:12]:
        try:
            e['anim_in'] = text_anim(src, e, fps, phase='in'); e['anim_out'] = text_anim(src, e, fps, phase='out')
        except Exception as ex: e['anim_in'] = None
    if words:  # субтитр относительно голоса: насколько раньше/позже слова он появляется
        for e in subs:
            first = re.sub(r'[^a-zа-яё0-9]', '', e['text'].lower().split()[0]) if e['text'].split() else ''
            cand = [w for w in words if abs(w['s'] - e['t_in']) < 0.8 and difflib.SequenceMatcher(None, re.sub(r'[^a-zа-яё0-9]', '', w['w'].lower()), first).ratio() > 0.6]
            t_in = (e.get('anim_in') or {}).get('t_exact', e['t_in'])
            if cand and e.get('anim_in'): e['lead_ms'] = int((t_in - min(cand, key=lambda w: abs(w['s'] - t_in))['s']) * 1000)  # >0 — текст позже голоса
    print('планы…', flush=True)
    shots = []
    for k in range(len(bounds) - 1):
        s, e_ = bounds[k], bounds[k + 1]
        idx = [i for i in range(len(fr)) if s + 0.05 <= ts[i] < e_ - 0.05] or [min(len(fr) - 1, int(((s + e_) / 2) * 10))]
        st = {key: float(np.mean([stats[i][key] for i in idx])) for key in stats[0]}
        fh = [fcs[i][0]['h'] if fcs[i] else 0 for i in idx]; fpres = float(np.mean([1 if x > 0 else 0 for x in fh]))
        face = None
        if fpres > 0.4:
            fl = [fcs[i][0] for i in idx if fcs[i]]
            face = {k2: round(float(np.median([q[k2] for q in fl])), 3) for k2 in ('x', 'y', 'w', 'h')}
        tx = [ev for ev in events if ev['t_in'] < e_ and ev['t_out'] > s]
        txt_area = float(np.mean([sum((it['x1'] - it['x0']) * (it['y1'] - it['y0']) for it in samples[min(len(samples) - 1, int(i / 10 / step))][1]) for i in idx]))
        nbox = float(np.mean([len(samples[min(len(samples) - 1, int(i / 10 / step))][1]) for i in idx]))
        if st['C'] < 0.035 and (st['L'] > 0.8 or st['L'] < 0.08): typ = 'card_white' if st['L'] > 0.8 else 'card_black'
        elif nbox >= 5 or txt_area > 0.12: typ = 'screenshot'
        elif face and face['h'] >= 0.12: typ = 'speaker'
        elif st['flat'] > 0.8: typ = 'graphic'
        elif face: typ = 'person'
        else: typ = 'broll'
        cam = camera_motion([grays[i] for i in idx[::1]][:40])
        shots.append({'n': k + 1, 's': round(s, 3), 'e': round(e_, 3), 'len': round(e_ - s, 3), 'type': typ, 'face': face, 'face_presence': round(fpres, 2),
                      'shot_size': None if not face else ('close' if face['h'] > 0.22 else 'medium' if face['h'] > 0.11 else 'wide'),
                      'camera': {k2: round(v, 4) for k2, v in cam.items()}, 'grade': {k2: round(v, 4) for k2, v in st.items()}, 'bw': st['S'] < 0.06,
                      'texts': [ev['text'] for ev in tx][:8]})
    # смена крупности спикера через склейку
    crop_jumps = []
    for x, y in zip(shots[:-1], shots[1:]):
        if x['type'] == 'speaker' and y['type'] == 'speaker' and x['face'] and y['face']: crop_jumps.append(round(y['face']['h'] / x['face']['h'], 2))
    # очереди быстрых планов
    bursts, run_ = [], []
    for sh in shots:
        if sh['len'] < 0.75: run_.append(sh)
        else:
            if len(run_) >= 3: bursts.append({'s': run_[0]['s'], 'n': len(run_), 'avg_len': round(float(np.mean([q['len'] for q in run_])), 2)})
            run_ = []
    if len(run_) >= 3: bursts.append({'s': run_[0]['s'], 'n': len(run_), 'avg_len': round(float(np.mean([q['len'] for q in run_])), 2)})
    cut_on_word = None
    if words and cuts:
        ws = np.array([w['s'] for w in words]); cut_on_word = round(float(np.mean([np.min(np.abs(ws - c)) < 0.1 for c in cuts])), 2)
    print('звук…', flush=True)
    audio = audio_analysis(src, dur, cuts, words) if has_a else None
    # листы: планы (середины), текст (вход заголовков покадрово)
    mids = [fr[min(len(fr) - 1, int((sh['s'] + sh['e']) / 2 * 10))] for sh in shots]
    sheet([cv2.resize(m, (180, 320)) for m in mids], [f"{sh['n']} {sh['type']} {sh['s']:.1f}" for sh in shots], os.path.join(out, 'shots.jpg'))
    for j, e in enumerate(titles[:6]):
        f2 = read_frames(src, None, 180, 320, ss=e['t_in'] - 0.2, t=0.7)
        sheet(list(f2[:18]), [f'{e["t_in"] - 0.2 + i / fps:.2f}' for i in range(min(18, len(f2)))], os.path.join(out, f'title_{j + 1}.jpg'), cols=9)
    types = {}
    for sh in shots: types[sh['type']] = round(types.get(sh['type'], 0) + sh['len'], 2)
    rep = {'file': os.path.basename(src), 'duration': round(dur, 2), 'size': [W0, H0], 'fps': round(fps, 2),
           'materials': {'time_by_type': types, 'share_by_type': {k: round(v / dur, 3) for k, v in types.items()}},
           'composition': {'speaker_share': round(types.get('speaker', 0) / dur, 3), 'speaker_face_h_median': round(float(np.median([sh['face']['h'] for sh in shots if sh['type'] == 'speaker' and sh['face']] or [0])), 3)},
           'rhythm': {'cuts': cuts, 'cuts_per_min': round(len(cuts) / (dur / 60), 1), 'shot_len': {'median': round(float(np.median([s['len'] for s in shots])), 2), 'mean': round(float(np.mean([s['len'] for s in shots])), 2)},
                      'speaker_shot_median': round(float(np.median([s['len'] for s in shots if s['type'] == 'speaker'] or [0])), 2),
                      'insert_shot_median': round(float(np.median([s['len'] for s in shots if s['type'] != 'speaker'] or [0])), 2),
                      'bursts': bursts, 'crop_jumps': crop_jumps, 'cut_on_word_share': cut_on_word},
           'transitions': {'list': trans, 'share': {k: round(sum(1 for x in trans if x['type'] == k) / max(1, len(trans)), 2) for k in sorted(set(x['type'] for x in trans))}},
           'text': {'events': events, 'titles': titles,
                    'subtitle': {'count': len(subs), 'h_px_median': int(np.median([e['h_px'] for e in subs])) if subs else None, 'y_rel_median': round(float(np.median([e['y_rel'] for e in subs])), 3) if subs else None,
                                 'words_median': float(np.median([e['words'] for e in subs])) if subs else None, 'dur_median': round(float(np.median([e['dur'] for e in subs])), 2) if subs else None,
                                 'colors': [c for c, _ in __import__('collections').Counter(e['color'] for e in subs if e.get('color')).most_common(4)], 'case': max(['lower', 'upper', 'mixed'], key=lambda c: sum(e['case'] == c for e in subs)) if subs else None,
                                 'anim': [e['anim_in']['kind'] for e in subs if e.get('anim_in')], 'lead_ms_median': int(np.median([e['lead_ms'] for e in subs if 'lead_ms' in e])) if any('lead_ms' in e for e in subs) else None}},
           'grade': {k: round(float(np.median([sh['grade'][k] for sh in shots])), 4) for k in stats[0]} | {'bw_shots': sum(sh['bw'] for sh in shots)},
           'grade_speaker': {k: round(float(np.median([sh['grade'][k] for sh in shots if sh['type'] == 'speaker'] or [0])), 4) for k in stats[0]},
           'camera': {'zoom_shots': sum(1 for sh in shots if abs(sh['camera']['zoom_per_s']) > 0.02), 'zoom_median': round(float(np.median([sh['camera']['zoom_per_s'] for sh in shots])), 4),
                      'shake_median': round(float(np.median([sh['camera']['shake'] for sh in shots])), 4)},
           'audio': audio, 'words': words, 'shots': shots}
    json.dump(rep, open(os.path.join(out, 'report.json'), 'w'), ensure_ascii=False, indent=1)
    s = rep['text']['subtitle']; g = rep['grade']
    print(f"{rep['file']}: {dur:.1f} с · планов {len(shots)} · {rep['rhythm']['cuts_per_min']} скл/мин · материалы {rep['materials']['share_by_type']}")
    print(f"переходы {rep['transitions']['share']} · крупность через склейку {crop_jumps[:8]} · очереди {len(bursts)}")
    print(f"субтитры: {s['count']} шт, ≈{s['h_px_median']}px, y={s['y_rel_median']}, слов {s['words_median']}, {s['case']}, цвета {s['colors']}, анимации {s['anim']}, опережение {s['lead_ms_median']} мс")
    print(f"заголовки: {[(e['text'], e['h_px'], (e.get('anim_in') or {}).get('kind'), (e.get('anim_in') or {}).get('ms')) for e in titles][:8]}")
    print(f"грейд: L {g['L']:.2f} C {g['C']:.2f} S {g['S']:.2f} тёплые света {g['warm_hi']:+.3f} тени {g['warm_sh']:+.3f} виньетка {g['vign']:.2f} зерно {g['grain']:.2f} ч/б {g['bw_shots']}")
    if audio: print(f"звук: {audio['lufs']} LUFS, подложка {audio['bed_rel_db']} дБ, бит {audio['tempo']} (чёткость {audio['pulse']}), эффектов {len(audio['sfx'])} ({audio['sfx_per_min']}/мин, на склейках {audio['sfx_on_cut_share']}, уровень {audio['sfx_level_rel_voice_db']} дБ к голосу), речь {audio['speech']}")

if __name__ == '__main__':
    main()
