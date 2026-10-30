#!/usr/bin/env python3
"""Тихие SFX синтезом numpy под раскадровку + сведение с голосом и громкость -14 LUFS.
python3 work/sfx.py  → public/mix.wav (голос + SFX), work/sfx_only.wav
"""
import json, subprocess, wave
import numpy as np

SR = 48000
rng = np.random.default_rng(3)
W = json.load(open('src/words.json'))
norm = lambda s: s.lower().strip('.,:?!«»—')

def ws(word, occ=0):
    n = 0
    for x in W:
        if norm(x['w']) == word:
            if n == occ: return x['s']
            n += 1
    raise KeyError(word)
def wprev(word, occ=0):
    n = 0
    for i, x in enumerate(W):
        if norm(x['w']) == word:
            if n == occ: return W[i - 1]['s']
            n += 1
fr = lambda t: round(t * 30) / 30  # как f() в kit: кадр

END = (59.81 + 0.5)
N = int(END * SR) + SR
out = np.zeros(N)

def add(t, x, vol):
    i = int(t * SR)
    if i < 0: x = x[-i:]; i = 0
    j = min(N, i + len(x)); out[i:j] += x[:j - i] * vol

def lp(x, a):  # простой фильтр через свёртку экспонентой (быстро)
    k = np.exp(-np.arange(int(SR * 0.004)) * a); k /= k.sum()
    return np.convolve(x, k, 'same')
def hp(x, a): return x - lp(x, a)
def env(n, att, rel):
    t = np.arange(n) / SR
    return np.minimum(1, t / att) * np.exp(-t / rel)
def tone(f, d, att=0.003, rel=0.2, harm=(1, 0.3, 0.1)):
    n = int(d * SR); t = np.arange(n) / SR
    x = sum(a * np.sin(2 * np.pi * f * (k + 1) * t) for k, a in enumerate(harm))
    return x * env(n, att, rel)
def noise(d): return rng.standard_normal(int(d * SR))
def nz(x): return x / (np.max(np.abs(x)) + 1e-9)
def mixs(*xs):
    n = max(len(x) for x in xs); return sum(np.pad(x, (0, n - len(x))) for x in xs)

# --- звуки ---
def whoosh(d=0.6):
    n = int(d * SR); t = np.linspace(0, 1, n)
    x = hp(noise(d), 0.02) * np.sin(np.pi * t) ** 2
    return nz(lp(x, 0.4))
def click(): return mixs(nz(hp(noise(0.012), 0.05) * env(int(0.012 * SR), 0.0005, 0.003)) * 0.9, tone(2200, 0.03, rel=0.008) * 0.3)
def flap():  # перекидное табло: три быстрых щелчка пластин
    x = np.zeros(int(0.25 * SR))
    for k, dt in enumerate([0, 0.05, 0.09, 0.15]):
        c = nz(hp(noise(0.02), 0.08) * env(int(0.02 * SR), 0.0003, 0.004)) * (1 - k * 0.15)
        i = int(dt * SR); x[i:i + len(c)] += c
    return nz(x)
def plink(f): return nz(tone(f, 0.9, rel=0.35, harm=(1, 0.2, 0.05, 0.08)))
def chime(): return nz(mixs(tone(1318.5, 1.2, rel=0.5), 0.7 * np.pad(tone(1760, 1.0, rel=0.45), (int(0.12 * SR), 0))))
def buzz():
    d = 0.18; n = int(d * SR); t = np.arange(n) / SR
    return nz((np.sign(np.sin(2 * np.pi * 120 * t)) * 0.3 + hp(noise(d), 0.05)) * env(n, 0.002, 0.06))
def hum(d):
    n = int(d * SR); t = np.arange(n) / SR
    x = lp(noise(d), 0.05) * 0.6 + 0.4 * np.sin(2 * np.pi * 95 * t)
    fade = np.minimum(1, np.minimum(t / 0.3, (d - t) / 0.3))
    return nz(x) * fade
def sparkle():
    x = np.zeros(int(0.9 * SR))
    for k in range(10):
        p = tone(2500 + rng.random() * 2500, 0.25, rel=0.06, harm=(1,)); i = int(rng.random() * 0.6 * SR); x[i:i + len(p)] += p
    return nz(x)
def crackle(d):
    x = np.zeros(int(d * SR))
    for k in range(int(d * 14)):
        c = hp(noise(0.006), 0.1) * env(int(0.006 * SR), 0.0003, 0.0015) * rng.random()
        i = int(rng.random() * (d - 0.01) * SR); x[i:i + len(c)] += c
    return nz(x)
def shutter(): return nz(np.concatenate([click(), np.zeros(int(0.035 * SR)), click() * 0.7]))
def rattle(d=0.7):
    n = int(d * SR); t = np.arange(n) / SR
    x = hp(noise(d), 0.03) * (0.5 + 0.5 * np.sign(np.sin(2 * np.pi * 28 * t))) * env(n, 0.02, 0.4)
    return nz(lp(x, 0.3))
def clink(f=2800): return nz(mixs(tone(f, 0.5, rel=0.12, harm=(1, 0.5, 0.3, 0.2)), 0.6 * tone(f * 1.48, 0.4, rel=0.09, harm=(1,))))
def blip_down():
    d = 0.35; n = int(d * SR); t = np.arange(n) / SR
    f = 900 * np.exp(-t * 3)
    return nz(np.sin(2 * np.pi * np.cumsum(f) / SR) * env(n, 0.005, 0.15))
def thud(): return nz(mixs(tone(70, 0.5, rel=0.14, harm=(1, 0.4)), 0.3 * lp(noise(0.5), 0.2) * env(int(0.5 * SR), 0.001, 0.05)))
def airpop(): return nz(lp(hp(noise(0.25), 0.03), 0.3) * env(int(0.25 * SR), 0.05, 0.06))
def match():
    d = 0.5; n = int(d * SR)
    x = hp(noise(d), 0.05) * env(n, 0.002, 0.04) + 0.4 * lp(noise(d), 0.3) * env(n, 0.05, 0.25)
    return nz(x)
def wind(d):
    n = int(d * SR); t = np.arange(n) / SR
    x = lp(lp(noise(d), 0.15), 0.15) * (0.6 + 0.4 * np.sin(2 * np.pi * 0.3 * t))
    return nz(x) * np.minimum(1, np.minimum(t / 1.0, (d - t) / 0.8))
def rustle(d=1.0):
    n = int(d * SR); t = np.arange(n) / SR
    return nz(hp(noise(d), 0.04) * (np.abs(np.sin(2 * np.pi * 6 * t)) ** 3) * np.sin(np.pi * t / d))
def servo(d):
    n = int(d * SR); t = np.arange(n) / SR
    f = 330 + 60 * np.sin(2 * np.pi * 1.6 * t)
    x = np.sign(np.sin(2 * np.pi * np.cumsum(f) / SR)) * 0.3
    return nz(lp(x, 0.6)) * np.minimum(1, np.minimum(t / 0.2, (d - t) / 0.3))
def tick(): return mixs(nz(hp(noise(0.01), 0.1) * env(int(0.01 * SR), 0.0003, 0.002)) * 0.8, tone(3200, 0.02, rel=0.004, harm=(1,)) * 0.2)
def low_end(d=2.0): return nz(tone(55, d, att=0.05, rel=0.9, harm=(1, 0.5, 0.2)))

# --- раскладка ---
add(0.0, whoosh(1.4), 0.10)
add(fr(ws('рождаться')) + 0.2, click(), 0.16)
for w, o in [('день', 0), ('неделя', 0), ('месяц', 0), ('год', 0), ('пять', 0), ('двадцать', 0), ('пятьдесят', 0), ('восемьдесят', 0)]:
    add(fr(ws(w, o)), flap(), 0.17)
for w, o in [('день', 0), ('неделя', 0), ('люди', 1), ('пять', 0), ('зато', 0), ('города', 0), ('восемьдесят', 0)]:
    add(fr(ws(w, o)) - 0.25, whoosh(0.5), 0.06)
add(fr(ws('тихо')) + 0.1, click(), 0.12)
# музыкальная шкатулка мобилей до «крика»
t, notes = fr(ws('ни', 0)), [1046.5, 1318.5, 1568, 1318.5, 1174.7, 1568]
k = 0
while t < ws('крика') + 0.1:
    add(t, plink(notes[k % len(notes)]), 0.07); t += 0.3; k += 1
add(fr(ws('совпадение')), airpop(), 0.06)
for k in range(6): add(fr(ws('ни', 1)) + k * 0.28, plink(880 - k * 70), 0.05)
add(fr(ws('только')), buzz(), 0.12)
add(fr(ws('кто-то')), hum(ws('месяц') - ws('кто-то')), 0.05)
add(fr(ws('тишина')), chime(), 0.12)
for k in range(10): add(fr(ws('ни', 2)) + k * 0.1, tick(), 0.06)
add(fr(ws('понимают')), sparkle(), 0.09)
add(fr(ws('люди', 1)), crackle(ws('год') - ws('люди', 1)), 0.05)
f0 = fr(ws('знаменитым')) - 0.13
for k in range(9): add(f0 + k * 0.23 + rng.random() * 0.08, shutter(), 0.11)
add(fr(ws('чудо')) - 0.1, chime(), 0.09)
for k in range(5): add(fr(ws('закрываются')) + k * 0.17, rattle(0.6), 0.07)
add(fr(ws('пустеют')), click(), 0.14)
add(fr(ws('дешевеют')) - 0.2, blip_down(), 0.10)
add(fr(ws('свободно')) - 0.4, whoosh(0.8), 0.08)
add(fr(ws('довольны')) + 0.15, clink(), 0.12)
add(fr(ws('пустые')), thud(), 0.12)
for w in ['заводах', 'больницах', 'полиции']: add(fr(ws(w)) + 0.05, airpop(), 0.09)
s16 = fr(ws('пенсию'))
last = fr(ws('некому')) + 4 / 30
for s in [-30, -22, -15, -9, -4, 2, 9, 18]:
    land = s16 + (s + 19) / 30
    if s16 <= land < last + 0.2: add(land, clink(2400 + rng.random() * 600), 0.08)
add(last - 14 / 30 + 19 / 30, clink(2600), 0.12)
add(fr(ws('пятьдесят', 1)), match(), 0.13)
add(fr(ws('затихают')), wind(END - ws('затихают')), 0.05)
add(fr(ws('зарастают')), rustle(1.2), 0.08)
add(fr(ws('робот')), servo(ws('восемьдесят') - ws('робот')), 0.035)
t = fr(ws('последний', 1))
while t < ws('прощай'): add(t, tick(), 0.08); t += 1.0
add(fr(ws('земля')) + 0.1, low_end(2.0), 0.10)

def wav(path, x):
    st = np.stack([x, x], 1)
    with wave.open(path, 'wb') as w:
        w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR)
        w.writeframes((np.clip(st, -1, 1) * 32767).astype('<i2').tobytes())

out = out[:int(END * SR)]
wav('work/sfx_only.wav', out)
# голос уже −14 LUFS; SFX кладём как есть, весь микс снова в −14 LUFS
subprocess.run(['ffmpeg', '-y', '-v', 'error', '-i', 'public/voice.wav', '-i', 'work/sfx_only.wav', '-filter_complex',
                f'[0]apad=whole_dur={END}[v];[v][1]amix=inputs=2:normalize=0:duration=longest,loudnorm=I=-14:TP=-1.5:LRA=11,volume=0.7dB[a]',
                '-map', '[a]', '-ar', '48000', '-t', f'{END}', 'public/mix.wav'], check=True)
print('ok', END)
