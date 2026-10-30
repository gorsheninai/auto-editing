# Финальная сборка: 3D-слой 720×1280 → 1080×1920, эффект макета (размытие верх/низ), виньетка, зерно,
# субтитры (PNG-плашки Inter Tight 700 56 px), голос + SFX, громкость −14 LUFS.
import json, os, subprocess, sys
from PIL import Image, ImageDraw, ImageFont
from fontTools.ttLib import TTFont
os.chdir(os.environ.get('REEL', '.'))  # папка ролика
src = sys.argv[1] if len(sys.argv) > 1 else 'work/city.mp4'
outp = sys.argv[2] if len(sys.argv) > 2 else 'out.mp4'
W, H, DUR = 1080, 1920, 62.5
SUBS = json.loads(open('src/subs.ts').read().split('= ', 1)[1].rstrip().rstrip(';'))

# --- субтитры: картинка на каждую пару, видео с альфой через concat ---
FC, FL = 'work/inter-tight-cyrillic-700-normal.ttf', 'work/inter-tight-latin-700-normal.ttf'
fc, fl = ImageFont.truetype(FC, 56), ImageFont.truetype(FL, 56)
cmap_c = TTFont(FC).getBestCmap()
def font_for(ch): return fc if ord(ch) in cmap_c else fl
def text_w(s): return sum(font_for(ch).getlength(ch) - 1 for ch in s)  # letter-spacing −1
os.makedirs('work/subs', exist_ok=True)
blank = Image.new('RGBA', (W, 200), (0, 0, 0, 0)); blank.save('work/subs/blank.png')
lst, t = [], 0.0
for i, s in enumerate(SUBS):
    if s['s'] > t: lst.append(('work/subs/blank.png', s['s'] - t))
    im = Image.new('RGBA', (W, 200), (0, 0, 0, 0)); d = ImageDraw.Draw(im)
    tw = text_w(s['text']); pw, ph = tw + 52, 86
    x0 = (W - pw) / 2
    d.rounded_rectangle([x0, 10, x0 + pw, 10 + ph], 18, fill=(244, 241, 234, 240))
    x = x0 + 26
    for ch in s['text']:
        f = font_for(ch); d.text((x, 10 + ph / 2 + 2), ch, font=f, fill=(28, 27, 34, 255), anchor='lm'); x += f.getlength(ch) - 1
    p = f'work/subs/s{i:03d}.png'; im.save(p)
    lst.append((p, s['e'] - s['s'])); t = s['e']
lst.append(('work/subs/blank.png', DUR - t + 0.5))
with open('work/subs/list.txt', 'w') as f:
    for p, d in lst: f.write(f"file '{os.path.abspath(p)}'\nduration {d:.4f}\n")
    f.write(f"file '{os.path.abspath(lst[-1][0])}'\n")

# --- маска размытия: белое сверху и снизу, чёрное в середине ---
m = Image.new('L', (W, H))
for y in range(H):
    v = 0.0
    if y < 640: v = min(1, (640 - y) / 420)
    if y > H - 560: v = min(1, (y - (H - 560)) / 380)
    m.paste(int(v * 255), (0, y, W, y + 1))
m.save('work/tilt_mask.png')

fg = (
    f"[0:v]scale={W}:{H}:flags=lanczos,setsar=1,format=yuv444p,split[a][b];[b]gblur=sigma=7[bl];"
    f"[1:v]format=gray,scale={W}:{H}[mk];[mk]format=yuv444p[mk3];"
    f"[a][bl][mk3]maskedmerge[ts];"
    f"[ts]vignette=angle=PI/5,noise=alls=3:allf=t,format=yuv420p[v0];"
    f"[2:v]format=rgba,fps=30[sb];[v0][sb]overlay=0:1490-10:format=auto,trim=duration={DUR}[v];"
    f"[3:a][4:a]amix=inputs=2:normalize=0:duration=longest,atrim=duration={DUR},loudnorm=I=-14:TP=-1.5:LRA=11:"+os.environ.get('LN_MEASURED', 'linear=false')+",aresample=48000[au]"
)
cmd = ['ffmpeg', '-y', '-v', 'error', '-i', src, '-loop', '1', '-i', 'work/tilt_mask.png',
       '-f', 'concat', '-safe', '0', '-i', 'work/subs/list.txt', '-i', 'public/voice.wav', '-i', 'public/sfx.wav',
       '-filter_complex', fg, '-map', '[v]', '-map', '[au]', '-t', str(DUR), '-r', '30',
       '-c:v', 'libx264', '-crf', '20', '-preset', 'medium', '-pix_fmt', 'yuv420p', '-c:a', 'aac', '-b:a', '192k', '-movflags', '+faststart', outp]
subprocess.run(cmd, check=True)
print('ok', outp)
