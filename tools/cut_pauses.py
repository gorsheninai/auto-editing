# usage: python3 cut_pauses.py src.mp4 out.mp4 [noise_db=-38] [min_sil=0.12] [speed=1.2]
# Cuts pauses, speeds up voice+video, loudnorm -14 LUFS. Writes segs.json next to out (for align.py).
import json, re, subprocess, sys, os
src, out = sys.argv[1], sys.argv[2]
noise = sys.argv[3] if len(sys.argv) > 3 else '-38'
dmin = sys.argv[4] if len(sys.argv) > 4 else '0.12'
speed = float(sys.argv[5]) if len(sys.argv) > 5 else 1.2
PAD = 0.05
dur = float(subprocess.check_output(['ffprobe', '-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', src]).decode())
log = subprocess.run(['ffmpeg', '-i', src, '-af', f'silencedetect=noise={noise}dB:d={dmin}', '-f', 'null', '-'], capture_output=True, text=True).stderr
st = [float(x) for x in re.findall(r'silence_start: ([\d.]+)', log)]
en = [float(x) for x in re.findall(r'silence_end: ([\d.]+)', log)]
sil = list(zip(st, en + [dur] * (len(st) - len(en))))
segs, t = [], 0.0
for a, b in sil:
    if a > t: segs.append([max(0, t - PAD if t else 0), min(dur, a + PAD)])
    t = b
if t < dur: segs.append([max(0, t - PAD), dur])
segs = [s for s in segs if s[1] - s[0] > 0.18]  # drop breaths/clicks
fc = []
for i, (a, b) in enumerate(segs):
    d = b - a
    fc.append(f'[0:v]trim={a:.3f}:{b:.3f},setpts=PTS-STARTPTS[v{i}]')
    fc.append(f'[0:a]atrim={a:.3f}:{b:.3f},asetpts=PTS-STARTPTS,afade=t=in:d=0.015,afade=t=out:st={d-0.015:.3f}:d=0.015[a{i}]')
cat = ''.join(f'[v{i}][a{i}]' for i in range(len(segs)))
fc.append(f'{cat}concat=n={len(segs)}:v=1:a=1[vc][ac]')
fc.append(f'[vc]setpts=PTS/{speed},fps=30[vo]')
fc.append(f'[ac]atempo={speed},loudnorm=I=-14:TP=-1.5:LRA=11[ao]')
fcp = os.path.splitext(out)[0] + '_fc.txt'
open(fcp, 'w').write(';'.join(fc))
subprocess.run(['ffmpeg', '-y', '-i', src, '-filter_complex_script', fcp, '-map', '[vo]', '-map', '[ao]',
                '-c:v', 'libx264', '-crf', '16', '-preset', 'medium', '-c:a', 'aac', '-b:a', '192k', '-ar', '48000', out], check=True)
json.dump(segs, open(os.path.join(os.path.dirname(out) or '.', 'segs.json'), 'w'))
print('segments', len(segs), 'out', out)
