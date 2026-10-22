#!/usr/bin/env python3
"""Базовые звуки монтажа, синтезом (без внешних файлов и лицензий).

python3 tools/make_sfx.py <public_dir>   → <public_dir>/sfx/{whoosh,hit,click,pop,riser,bed_kino}.wav

whoosh — вжух на склейке/входе в B-roll; hit — глухой удар на карточке или номере пункта;
click — мягкий щелчок на появлении слова; pop — поп на заголовке; riser — нарастание перед поворотом;
bed_kino — спокойная кинематографичная подложка 64 с (аккорды + мягкий бит), для замены своей музыкой.
"""
import os, sys, wave
import numpy as np

SR = 44100
rng = np.random.default_rng(7)

def save(path, x):
    x = np.clip(x / (np.max(np.abs(x)) + 1e-9) * 0.89, -1, 1)
    st = np.stack([x, x], 1) if x.ndim == 1 else x
    with wave.open(path, 'wb') as w:
        w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR)
        w.writeframes((st * 32767).astype('<i2').tobytes())

def env(n, a, d, curve=3.0):
    t = np.linspace(0, 1, n); e = np.minimum(1, t / max(a, 1e-4)) * (1 - t) ** curve
    return e

def lowpass(x, cut):
    # однополюсный фильтр, cut — массив или число (Гц)
    cut = np.broadcast_to(cut, x.shape)
    y = np.zeros_like(x); a = 1 - np.exp(-2 * np.pi * cut / SR); s = 0.0
    for i in range(len(x)): s += a[i] * (x[i] - s); y[i] = s
    return y

def whoosh(d=0.4):
    """Воздушный вжух как у референсов: энергия в основном выше 4 кГц (свист воздуха), без гула в середине."""
    n = int(SR * d); t = np.linspace(0, 1, n)
    noise = rng.standard_normal(n)
    hp = noise - lowpass(noise, 3500)                       # убрать всё ниже ~3,5 кГц
    sweep = 5000 + 7000 * np.sin(np.pi * t) ** 2
    x = lowpass(hp, sweep)
    e = np.sin(np.pi * t ** 0.8) ** 2.2
    pan = 0.5 + 0.35 * np.sin(np.pi * (t - 0.5))
    m = x * e
    return np.stack([m * (1 - pan), m * pan], 1)

def hit(d=0.9):
    n = int(SR * d); t = np.arange(n) / SR
    f = 52 + 70 * np.exp(-t * 18)
    body = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 4.5)
    click = lowpass(rng.standard_normal(n), 2500) * np.exp(-t * 60) * 0.6
    return body + click

def click(d=0.05):
    n = int(SR * d); t = np.arange(n) / SR
    return (np.sin(2 * np.pi * 2200 * t) * 0.6 + lowpass(rng.standard_normal(n), 6000) * 0.4) * np.exp(-t * 140)

def pop(d=0.12):
    n = int(SR * d); t = np.arange(n) / SR
    f = 900 * np.exp(-t * 30) + 280
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 38)

def riser(d=1.6):
    n = int(SR * d); t = np.linspace(0, 1, n)
    noise = lowpass(rng.standard_normal(n), 200 + 7000 * t ** 2)
    tone = np.sin(2 * np.pi * np.cumsum(180 + 600 * t ** 2) / SR) * 0.25
    return (noise + tone) * t ** 2.2

def bed(d=64.0, bpm=84):
    n = int(SR * d); t = np.arange(n) / SR; out = np.zeros(n)
    beat = 60 / bpm; bar = beat * 4
    chords = [[57, 60, 64, 67], [53, 57, 60, 64], [48, 52, 55, 59], [55, 59, 62, 65]]  # Am7 Fmaj7 Cmaj7 G7
    hz = lambda m: 440 * 2 ** ((m - 69) / 12)
    for b in range(int(d / bar) + 1):
        ch = chords[b % 4]; s0 = int(b * bar * SR); s1 = min(n, int((b + 1) * bar * SR))
        if s0 >= n: break
        tt = np.arange(s1 - s0) / SR; e = np.minimum(1, tt / 0.6) * np.minimum(1, (bar - tt) / 0.5)
        for m in ch:
            out[s0:s1] += (np.sin(2 * np.pi * hz(m) * tt) + 0.3 * np.sin(2 * np.pi * hz(m) * 2.003 * tt)) * e * 0.09
        bass = hz(ch[0] - 12); out[s0:s1] += np.sin(2 * np.pi * bass * tt) * e * 0.22
    pad = lowpass(out, 1400)
    drums = np.zeros(n)
    k = hit(0.35)[:int(SR * 0.35)] * 0.55; hh = click(0.03) * 0.12
    sn = lowpass(rng.standard_normal(int(SR * 0.2)), 3500) * np.exp(-np.arange(int(SR * 0.2)) / SR * 22) * 0.25
    for i in range(int(d / beat)):
        s = int(i * beat * SR)
        if i % 4 in (0, 2) or (i % 8 == 7):
            e = min(n, s + len(k)); drums[s:e] += k[:e - s]
        if i % 4 in (1, 3):
            e = min(n, s + len(sn)); drums[s:e] += sn[:e - s]
        for h in (0, 0.5):
            hs = int((i + h) * beat * SR); e = min(n, hs + len(hh))
            if hs < n: drums[hs:e] += hh[:e - hs]
    mix = pad + drums
    fade = np.minimum(1, np.minimum(t / 2.0, (d - t) / 3.0))
    return mix * fade

def main():
    out = os.path.join(sys.argv[1] if len(sys.argv) > 1 else 'public', 'sfx'); os.makedirs(out, exist_ok=True)
    for name, fn in [('whoosh', whoosh), ('hit', hit), ('click', click), ('pop', pop), ('riser', riser), ('bed_kino', bed)]:
        save(os.path.join(out, f'{name}.wav'), fn()); print('ok', name)

if __name__ == '__main__':
    main()
