#!/usr/bin/env python3
"""Глубокий разбор референса для премонтажа.

python3 tools/ref_deep.py ref.mp4 out_dir

Пишет в out_dir:
  report.json  — склейки (точно, по ffmpeg scene), планы, темп; звук: громкость (LUFS), речь/паузы,
                 подложка под голосом, удары на склейках, всплески вне склеек (эффекты), спектр в паузах
  shots_N.jpg  — листы: кадр из середины каждого плана с номером и секундой (для разбора режимов и графики)
  text_N.jpg   — листы: кадры 3 раза в секунду (для чтения субтитров и текста на экране → транскрипт и анимации)
  motion_N.jpg — для каждого плана 4 кадра подряд (начало плана) — видно, как появляется графика и текст
Дальше Claude смотрит листы и уточняет премонтаж в templates/<id>.
"""
import json, os, re, subprocess, sys
import numpy as np
from PIL import Image, ImageDraw, ImageFont

def run(cmd):
    return subprocess.run(cmd, capture_output=True, text=True)

def probe(src):
    r = run(['ffprobe', '-v', 'error', '-show_entries', 'format=duration:stream=codec_type,width,height,r_frame_rate', '-of', 'json', src])
    j = json.loads(r.stdout)
    v = next((s for s in j['streams'] if s['codec_type'] == 'video'), {})
    num, den = (v.get('r_frame_rate', '30/1').split('/') + ['1'])[:2]
    return float(j['format']['duration']), v.get('width'), v.get('height'), float(num) / float(den or 1), any(s['codec_type'] == 'audio' for s in j['streams'])

def scene_cuts(src, thr=0.3):
    r = run(['ffmpeg', '-hide_banner', '-i', src, '-filter:v', f"select='gt(scene,{thr})',showinfo", '-an', '-f', 'null', '-'])
    ts = [float(m) for m in re.findall(r'pts_time:([0-9.]+)', r.stderr)]
    out = []
    for t in ts:
        if not out or t - out[-1] > 0.3: out.append(round(t, 2))
    return out

def frame(src, t, w=270, h=480):
    r = subprocess.run(['ffmpeg', '-v', 'error', '-ss', f'{t:.3f}', '-i', src, '-frames:v', '1', '-vf', f'scale={w}:{h}:force_original_aspect_ratio=increase,crop={w}:{h}', '-f', 'image2pipe', '-vcodec', 'png', '-'], capture_output=True)
    from io import BytesIO
    try: return Image.open(BytesIO(r.stdout)).convert('RGB')
    except Exception: return Image.new('RGB', (w, h), 'black')

def font(sz):
    for p in ['/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf']:
        if os.path.exists(p): return ImageFont.truetype(p, sz)
    return ImageFont.load_default()

def sheets(src, times, out, prefix, cols=5, rows=3, w=270, h=480, label=None):
    files = []; per = cols * rows; f = font(18)
    for si in range(0, len(times), per):
        part = times[si:si + per]
        im = Image.new('RGB', (cols * w, rows * h), 'black'); d = ImageDraw.Draw(im)
        for i, t in enumerate(part):
            x, y = (i % cols) * w, (i // cols) * h
            im.paste(frame(src, t, w, h), (x, y))
            txt = label(si + i, t) if label else f'{si + i + 1} · {t:.2f}с'
            d.rectangle([x, y, x + 8 + 11 * len(txt), y + 28], fill=(0, 0, 0))
            d.text((x + 5, y + 4), txt, fill=(255, 255, 255), font=f)
        fn = os.path.join(out, f'{prefix}_{si // per + 1}.jpg'); im.save(fn, quality=82); files.append(fn)
    return files

def audio(src, dur, cuts):
    raw = subprocess.run(['ffmpeg', '-v', 'error', '-i', src, '-ac', '1', '-ar', '16000', '-f', 'f32le', '-'], capture_output=True).stdout
    x = np.frombuffer(raw, dtype=np.float32)
    if not len(x): return None
    hop = 320  # 20 мс
    n = len(x) // hop; fr = x[:n * hop].reshape(n, hop)
    rms = np.sqrt((fr ** 2).mean(1) + 1e-12); db = 20 * np.log10(rms + 1e-9)
    t = np.arange(n) * 0.02
    # речь: по огибающей с порогом от громких мест
    loud = np.percentile(db, 90); thr = loud - 22
    voiced = db > thr
    # сгладить: дырки < 150 мс заполнить
    v = voiced.copy(); k = 0
    for i in range(n):
        if not voiced[i]: k += 1
        else:
            if 0 < k <= 7: v[i - k:i] = True
            k = 0
    segs = []; st = None
    for i, b in enumerate(v):
        if b and st is None: st = i
        if not b and st is not None:
            if (i - st) * 0.02 > 0.15: segs.append([round(st * 0.02, 2), round(i * 0.02, 2)])
            st = None
    if st is not None: segs.append([round(st * 0.02, 2), round(n * 0.02, 2)])
    gaps = [[segs[i][1], segs[i + 1][0]] for i in range(len(segs) - 1) if segs[i + 1][0] - segs[i][1] > 0.15]
    # подложка: уровень в паузах и спектральная плоскость (шум ≈ плоский, музыка — тональная)
    gap_db = [float(db[int(a / 0.02):int(b / 0.02)].mean()) for a, b in gaps if b - a > 0.2]
    floor = float(np.median(gap_db)) if gap_db else float(np.percentile(db, 5))
    tonal = None
    if gaps:
        chunks = [x[int(a * 16000):int(b * 16000)] for a, b in gaps if b - a > 0.25]
        if chunks:
            c = np.concatenate(chunks)[:16000 * 10]
            if len(c) > 2048:
                spec = np.abs(np.fft.rfft(c[:len(c) // 2048 * 2048].reshape(-1, 2048) * np.hanning(2048), axis=1)).mean(0) + 1e-9
                flat = float(np.exp(np.log(spec).mean()) / spec.mean())
                tonal = round(1 - flat, 2)
    # удары на склейках и всплески вне склеек
    def peak_ratio(tc):
        i0, i1 = int((tc - 0.06) / 0.02), int((tc + 0.12) / 0.02)
        a, b = max(0, int((tc - 1) / 0.02)), min(n, int((tc + 1) / 0.02))
        around = np.concatenate([rms[a:max(a, i0 - 5)], rms[min(b, i1 + 5):b]])
        if not len(around) or i0 >= n: return 0
        return float(rms[max(0, i0):max(i0 + 1, i1)].max() / (np.median(around) + 1e-9))
    hits = [round(c, 2) for c in cuts if peak_ratio(c) > 2.0]
    onset = np.diff(db, prepend=db[0])
    spikes = [round(float(t[i]), 2) for i in np.where(onset > 14)[0]]
    spikes_off = [s for s in spikes if all(abs(s - c) > 0.25 for c in cuts)]
    lufs = None
    r = run(['ffmpeg', '-hide_banner', '-i', src, '-af', 'ebur128', '-f', 'null', '-'])
    m = re.findall(r'I:\s+(-?[0-9.]+) LUFS', r.stderr)
    if m: lufs = float(m[-1])
    speech = sum(b - a for a, b in segs)
    return {
        'lufs': lufs, 'speech_share': round(speech / dur, 2), 'phrases': len(segs), 'avg_phrase_s': round(speech / max(1, len(segs)), 2),
        'pauses': len(gaps), 'avg_pause_s': round(sum(b - a for a, b in gaps) / max(1, len(gaps)), 2), 'max_pause_s': round(max([b - a for a, b in gaps] or [0]), 2),
        'floor_db_in_pauses': round(floor, 1), 'peak_db': round(float(loud), 1),
        'bed_under_voice': 'да' if floor > loud - 35 else 'нет', 'bed_tonality': tonal,
        'hits_on_cuts': hits, 'hits_share': round(len(hits) / max(1, len(cuts)), 2), 'spikes_off_cuts': spikes_off[:40],
        'speech_segments': segs,
    }

def main():
    src, out = sys.argv[1], sys.argv[2]
    os.makedirs(out, exist_ok=True)
    dur, w, h, fps, has_a = probe(src)
    cuts = scene_cuts(src)
    bounds = [0.0] + cuts + [round(dur, 2)]
    shots = [[bounds[i], bounds[i + 1]] for i in range(len(bounds) - 1) if bounds[i + 1] - bounds[i] > 0.05]
    lens = [b - a for a, b in shots]
    mids = [round((a + b) / 2, 2) for a, b in shots]
    rep = {'file': os.path.basename(src), 'duration': round(dur, 2), 'size': [w, h], 'fps': round(fps, 2),
           'cuts': cuts, 'shots': len(shots), 'cuts_per_min': round(len(cuts) / (dur / 60), 1),
           'shot_len': {'avg': round(float(np.mean(lens)), 2), 'min': round(min(lens), 2), 'max': round(max(lens), 2), 'median': round(float(np.median(lens)), 2)},
           'shot_list': [{'n': i + 1, 's': a, 'e': b, 'len': round(b - a, 2)} for i, (a, b) in enumerate(shots)]}
    rep['audio'] = audio(src, dur, cuts) if has_a else None
    rep['sheets'] = {
        'shots': sheets(src, mids, out, 'shots'),
        'text': sheets(src, [round(x, 2) for x in np.arange(0.1, dur, 1 / 3)], out, 'text', cols=6, rows=3, w=240, h=427),
        'motion': sheets(src, [a + k * 0.12 for a, b in shots[:30] for k in range(4)], out, 'motion', cols=8, rows=3, w=180, h=320,
                         label=lambda i, t: f'{i // 4 + 1}.{i % 4 + 1}'),
    }
    json.dump(rep, open(os.path.join(out, 'report.json'), 'w'), ensure_ascii=False, indent=1)
    a = rep['audio'] or {}
    print(f"{rep['file']}: {rep['duration']} с, планов {rep['shots']}, {rep['cuts_per_min']} склеек/мин, план ≈ {rep['shot_len']['avg']} с; "
          f"LUFS {a.get('lufs')}, речь {a.get('speech_share')}, подложка {a.get('bed_under_voice')} (тональность {a.get('bed_tonality')}), удары на склейках {a.get('hits_share')}")
    print('листы:', sum(len(v) for v in rep['sheets'].values()))

if __name__ == '__main__':
    main()
