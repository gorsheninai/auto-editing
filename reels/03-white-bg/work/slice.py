# Cut generated sheets into separate transparent PNGs, crop by alpha.
# usage: python3 work/slice.py  (from reel dir)
import os, numpy as np
from PIL import Image, ImageFile
from scipy import ndimage
ImageFile.LOAD_TRUNCATED_IMAGES = True  # 02 and 05 on Drive are cut short at the very bottom margin

SRC = 'src_img'
JOBS = {
    '01_turnaround.png': ('poses', 1, 4, ['front', 'q_left', 'profile', 'q_right']),
    '02_poses.png': ('poses', 3, 3, ['stand', 'look', 'think', 'explain', 'nod', 'surprise', 'dream', 'thumb', 'point']),
    '03_hands.png': ('hands', 2, 2, ['phone', 'laptop', 'point', 'magnify']),
    '04_items_photo.png': ('items', 3, 3, ['camera', 'softbox', 'reflector', 'tripod', 'glasses', 'backdrop', 'meter', 'flash', 'card']),
    '05_items_neon.png': ('items', 3, 3, ['racket_pink', 'racket_blue', 'shuttle', 'neon_arc', 'neon_ring', 'neon_zig', 'ball', 'bag', 'sneakers']),
    '06_items_ui.png': ('ui', 3, 3, ['button', 'window', 'ring', 'phone', 'bubble_w', 'bubble_b', 'cursor', 'card', 'bracket']),
    '07_avatars.png': ('ppl', 4, 4, [f'p{i}' for i in range(16)]),
}

def cells_1row(a, n):
    # turnaround: one row, find the vertical band with content
    rows = np.where(a[:, :, 3].max(1) > 20)[0]
    y0, y1 = rows.min(), rows.max() + 1
    w = a.shape[1] // n
    return [(y0, y1, i * w, (i + 1) * w) for i in range(n)]

def crop(cell):
    al = cell[:, :, 3] > 20
    lab, k = ndimage.label(al)
    if k == 0:
        return None
    sizes = ndimage.sum(al, lab, range(1, k + 1))
    big = sizes.max()
    keep = np.zeros_like(al)
    h, w = al.shape
    for i, s in enumerate(sizes, 1):
        m = lab == i
        ys, xs = np.where(m)
        touches = ys.min() == 0 or xs.min() == 0 or ys.max() == h - 1 or xs.max() == w - 1
        if s >= big * 0.04 and not (touches and s < big * 0.5):
            keep |= m
    keep = ndimage.binary_dilation(keep, iterations=3)
    out = cell.copy()
    out[:, :, 3] = (out[:, :, 3] * keep).astype(np.uint8)
    ys, xs = np.where(out[:, :, 3] > 8)
    p = 6
    return out[max(0, ys.min() - p):ys.max() + p, max(0, xs.min() - p):xs.max() + p]

for fn, (folder, R, Cc, names) in JOBS.items():
    a = np.array(Image.open(os.path.join(SRC, fn)).convert('RGBA'))
    os.makedirs(f'public/{folder}', exist_ok=True)
    if R == 1:
        boxes = cells_1row(a, Cc)
    else:
        H, W = a.shape[0] // R, a.shape[1] // Cc
        boxes = [(r * H, (r + 1) * H, c * W, (c + 1) * W) for r in range(R) for c in range(Cc)]
    for (y0, y1, x0, x1), name in zip(boxes, names):
        im = crop(a[y0:y1, x0:x1])
        if im is None:
            print('EMPTY', fn, name); continue
        Image.fromarray(im).save(f'public/{folder}/{name}.png', optimize=True)
        print(folder, name, im.shape[1], im.shape[0])

os.makedirs('public/img', exist_ok=True)
for i in range(1, 6):
    Image.open(f'{SRC}/bg_{i}.png').convert('RGB').save(f'public/img/bg{i}.jpg', quality=90)
print('bgs ok')
