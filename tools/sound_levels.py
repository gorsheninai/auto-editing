#!/usr/bin/env python3
"""Громкость эффектов и подложки под голос по спецификации стиля — тем же способом, каким они мерились у референса.

python3 tools/sound_levels.py <голос.mp4> <папка sfx> <style_spec.json>
→ печатает JSON {whoosh, hit, music} — множители громкости для <Audio volume> в Remotion.

Вжух: пик энергии 9–16 кГц к медиане голоса 300–3000 Гц; удар: пик 30–120 Гц к голосу; подложка: медиана 30–120 Гц к голосу.
"""
import json, subprocess, sys
import numpy as np, librosa

def load(p, sr=44100):
    return np.frombuffer(subprocess.run(['ffmpeg', '-v', 'error', '-i', p, '-ac', '1', '-ar', str(sr), '-f', 'f32le', '-'], capture_output=True).stdout, np.float32).copy()

def bands(y, sr=44100):
    S = np.abs(librosa.stft(y, n_fft=2048, hop_length=882)) ** 2; fq = librosa.fft_frequencies(sr=sr, n_fft=2048)
    b = lambda a, c: 10 * np.log10(S[(fq >= a) & (fq < c)].sum(0) + 1e-12)
    return b(9000, 16000), b(30, 120), b(300, 3000)

def main():
    voice, sfx, spec = sys.argv[1], sys.argv[2], json.load(open(sys.argv[3]))
    snd = spec['engine']['sound']
    _, _, vb = bands(load(voice)); vmed = float(np.median(vb[vb > np.percentile(vb, 55)]))
    hb_w, _, _ = bands(load(f'{sfx}/whoosh.wav')); _, lb_h, _ = bands(load(f'{sfx}/hit.wav')); _, lb_m, _ = bands(load(f'{sfx}/bed_kino.wav'))
    gain = lambda have, want: float(10 ** ((want - have) / 20)) if want is not None else 0.0
    out = {'whoosh': round(min(1.0, gain(float(hb_w.max()) - vmed, snd.get('whooshRelVoiceDb'))), 3),
           'hit': round(min(1.0, gain(float(lb_h.max()) - vmed, snd.get('hitRelVoiceDb'))), 3),
           'music': 0.0}
    if snd.get('music'):  # подложка: подобрать громкость, при которой «дно» смеси (p10/p90 по 20 мс) как у референса
        v = load(voice); m = load(f'{sfx}/bed_kino.wav'); m = np.resize(m, len(v)); target = spec['sound'].get('bed_rel_db_median', -13.6)
        def floor(vol):
            r = np.sqrt(np.convolve((v + vol * m) ** 2, np.ones(882) / 882, 'valid')[::882]) + 1e-9
            return 20 * np.log10(np.percentile(r, 10) / np.percentile(r, 90))
        out['music'] = round(float(min([0.02 * k for k in range(1, 40)], key=lambda q: abs(floor(q) - target))), 3)
    print(json.dumps(out))

if __name__ == '__main__':
    main()
