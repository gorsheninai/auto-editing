#!/usr/bin/env python3
"""Подбор цветокоррекции под референс: ffmpeg-фильтр, после которого статистика кадров нашего видео
совпадает с грейдом референса (яркость, контраст, чёрная/белая точка, насыщенность, тёплые/холодные тени и света,
виньетка, зерно).

python3 tools/grade_match.py <наше_видео> <style_spec.json> [--apply out.mp4] [--key grade_speaker]

Печатает фильтр и таблицу «было / цель / стало». С --apply запекает грейд в новый файл (звук без изменений).
"""
import json, os, subprocess, sys, tempfile
import numpy as np
from scipy.optimize import minimize
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from ref_analyze import frame_stats, read_frames, faces

# веса: яркость/контраст/точки/насыщенность — главное; тёплый баланс слабее (зависит от сюжета кадра);
# виньетка и зерно не подгоняются оптимизатором (у разных сцен разный свет), а ставятся по цели отдельно
KEYS = [('L', 8), ('C', 10), ('black', 6), ('white', 6), ('S', 6), ('warm_sh', 2), ('warm_hi', 1), ('vign', 0), ('grain', 0)]

def filt(p):
    c, b, s, g, rs, bs, rh, bh = p[:8]; v, n = VIGN, GRAIN
    f = (f'eq=contrast={c:.3f}:brightness={b:.3f}:saturation={max(0, s):.3f}:gamma={max(0.3, g):.3f},'
         f'colorbalance=rs={rs:.3f}:bs={bs:.3f}:rh={rh:.3f}:bh={bh:.3f}')
    if v > 0.02: f += f',vignette=angle={0.2 + v:.3f}'
    if n > 0.5: f += f',noise=alls={n:.1f}:allf=t'
    return f

VIGN, GRAIN = 0.0, 0.0
FACEBOX = []
def skin(f, b):
    h, w = f.shape[:2]; x0, y0 = int((b['x'] + b['w'] * 0.25) * w), int((b['y'] + b['h'] * 0.35) * h)
    x1, y1 = int((b['x'] + b['w'] * 0.75) * w), int((b['y'] + b['h'] * 0.8) * h)
    c = f[y0:y1, x0:x1].reshape(-1, 3).astype(np.float32) / 255
    if len(c) < 20: return None
    import cv2
    hsv = cv2.cvtColor((c.reshape(-1, 1, 3) * 255).astype(np.uint8), cv2.COLOR_RGB2HSV).reshape(-1, 3)
    return {'skin_L': float((c @ np.array([0.2126, 0.7152, 0.0722])).mean()), 'skin_S': float(hsv[:, 1].mean() / 255), 'skin_warm': float((c[:, 0] - c[:, 2]).mean())}
def stats_of(frames):
    st = [frame_stats(f) for f in frames]
    out = {k: float(np.mean([x[k] for x in st])) for k, _ in KEYS}
    sk = [skin(f, b) for f, b in zip(frames, FACEBOX) if b]
    sk = [x for x in sk if x]
    if sk: out.update({k: float(np.mean([x[k] for x in sk])) for k in sk[0]})
    return out
def skin_target(refs):
    vals = []
    for rp in refs:
        rep = json.load(open(rp)); src = os.path.join(os.path.dirname(rp), '..', 'refs', rep['file'])
        if not os.path.exists(src): continue
        for sh in [x for x in rep['shots'] if x['type'] == 'speaker' and x['face']][:8]:
            f = read_frames(src, None, 360, 640, ss=(sh['s'] + sh['e']) / 2, t=0.04)
            if len(f):
                fb = faces(f[0])
                if fb: v = skin(f[0], fb[0]); vals.append(v) if v else None
    return {k: float(np.median([v[k] for v in vals])) for k in vals[0]} if vals else {}

def render(pngs, f, tmp):
    outs = []
    for i, p in enumerate(pngs):
        o = os.path.join(tmp, f'o{i}.png')
        subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', p, '-vf', f, o], check=True)
        from PIL import Image
        outs.append(np.array(Image.open(o).convert('RGB')))
    return outs

def main():
    a = sys.argv[1:]; src, specp = a[0], a[1]
    key = a[a.index('--key') + 1] if '--key' in a else 'grade_speaker'
    target = json.load(open(specp))[key]
    frames = read_frames(src, 1, 360, 640)
    frames = frames[np.linspace(0, len(frames) - 1, min(6, len(frames))).astype(int)]
    tmp = tempfile.mkdtemp(); pngs = []
    from PIL import Image
    for i, f in enumerate(frames):
        p = os.path.join(tmp, f'f{i}.png'); Image.fromarray(f).save(p); pngs.append(p)
    FACEBOX[:] = [(faces(f) or [None])[0] for f in frames]
    if '--refs' in a: target = {**target, **skin_target(a[a.index('--refs') + 1].split(','))}
    before = stats_of(frames)
    def loss(p):
        try: st = stats_of(render(pngs, filt(p), tmp))
        except Exception: return 1e6
        l = sum(w * (st[k] - target[k]) ** 2 for k, w in KEYS if target.get(k) is not None)
        return l + sum(w * (st[k] - target[k]) ** 2 for k, w in (('skin_L', 10), ('skin_S', 14), ('skin_warm', 14)) if k in st and k in target)
    global VIGN, GRAIN
    VIGN = float(np.clip((1 - (target.get('vign') or 1)) * 1.6, 0, 0.6))      # тёмные углы как у референса
    GRAIN = float(np.clip(((target.get('grain') or 0) - before['grain']) * 4, 0, 8))  # добавить зерна, только если у нас его меньше
    x0 = np.array([1.0, 0.0, 1.0, 1.0, 0, 0, 0, 0])
    # грубая стартовая точка: яркость и контраст
    x0[1] = float(np.clip(target['L'] - before['L'], -0.3, 0.3)); x0[0] = float(np.clip(target['C'] / max(before['C'], 1e-3), 0.6, 1.8))
    x0[2] = float(np.clip(target['S'] / max(before['S'], 1e-3), 0.3, 1.6))
    res = minimize(loss, x0, method='Nelder-Mead', options={'maxiter': 140, 'xatol': 1e-3, 'fatol': 1e-6,
                   'initial_simplex': [x0] + [x0 + d for d in np.diag([0.15, 0.05, 0.15, 0.15, 0.1, 0.1, 0.1, 0.1])]})
    f = filt(res.x); after = stats_of(render(pngs, f, tmp))
    print('фильтр:', f)
    print(f"{'':8s}{'было':>8s}{'цель':>8s}{'стало':>8s}")
    for k in [k for k, _ in KEYS] + ['skin_L', 'skin_S', 'skin_warm']:
        if k in before: print(f'{k:9s}{before[k]:8.3f}{(target.get(k) or 0):8.3f}{after.get(k, 0):8.3f}')
    if '--apply' in a:
        out = a[a.index('--apply') + 1]
        subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', src, '-vf', f, '-c:v', 'libx264', '-crf', '16', '-preset', 'medium', '-c:a', 'copy', out], check=True)
        print('записано:', out)
    json.dump({'filter': f, 'before': before, 'target': target, 'after': after}, open(os.path.splitext(src)[0] + '.grade.json', 'w'), indent=1)

if __name__ == '__main__':
    main()
