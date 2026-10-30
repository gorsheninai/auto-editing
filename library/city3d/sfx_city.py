# Тихие SFX синтезом numpy под события макета → public/sfx.wav (48 кГц, моно)
import json, numpy as np, wave
SR = 48000; DUR = 62.5
W = json.load(open('src/words.json'))
def wf(w, n=1):
    k = 0
    for x in W:
        if x['w'] == w:
            k += 1
            if k == n: return x['s']
    raise KeyError(w)
T = dict(off=wf('отключат'), net=wf('интернет'), d1=wf('день', 1), morning=wf('утро'), yt=wf('ютюб'), wa=wf('ватсап'),
         sites=wf('иностранные'), games=wf('игры'), notopen=wf('открываются'), nohelp=wf('помогает'), reboot=wf('перезагружают'),
         confused=wf('понимают'), d2=wf('день', 2), exhale=wf('выдох'), vk=wf('вконтакте'), ya=wf('яндекс'), bank=wf('банки'),
         mp=wf('маркетплейсы'), work=wf('работают'), okay=wf('ну'), write=wf('пишут'), week=wf('неделя'), noupd=wf('обновляются'),
         money=wf('деньги'), dl=wf('скачать'), month=wf('месяц'), call=wf('звонить'), vdead=wf('работает'), nosee=wf('видит'),
         close=wf('закрывается'), m3=wf('три'), grow=wf('растут'), blog=wf('блогеры'), stars=wf('звезды'), half=wf('полгода'),
         passing=wf('передают'), again=wf('снова'), price=wf('цене'), year=wf('год'), what=wf('такое'), world=wf('весь'))
out = np.zeros(int(SR * DUR))
rng = np.random.default_rng(7)
def t_(d): return np.arange(int(SR * d)) / SR
def env(n, a=0.004, r=None):
    e = np.ones(n); na = max(1, int(a * SR)); e[:na] = np.linspace(0, 1, na)
    if r: e *= np.exp(-np.arange(n) / (r * SR))
    return e
def lp(x, k):  # простой однополюсный ФНЧ
    y = np.zeros_like(x); a = k; acc = 0.0
    for i in range(len(x)): acc += a * (x[i] - acc); y[i] = acc
    return y
def put(t0, s, g):
    i = int(t0 * SR)
    if i < 0: s = s[-i:]; i = 0
    j = min(len(out), i + len(s)); out[i:j] += s[:j - i] * g

def click(): t = t_(0.05); return np.sin(2 * np.pi * 1800 * t) * env(len(t), 0.0005, 0.006) + rng.normal(0, 1, len(t)) * env(len(t), 0.0005, 0.003) * 0.5
def pop(f0=500, f1=900, d=0.12):
    t = t_(d); f = np.linspace(f0, f1, len(t)); return np.sin(2 * np.pi * np.cumsum(f) / SR) * env(len(t), 0.003, d / 3)
def ding(f=1320, d=0.6):
    t = t_(d); return (np.sin(2 * np.pi * f * t) + 0.4 * np.sin(2 * np.pi * f * 2.01 * t) + 0.2 * np.sin(2 * np.pi * f * 3.02 * t)) * env(len(t), 0.002, d / 4)
def whoosh(d=0.5, k0=0.02, k1=0.25):
    n = int(d * SR); x = rng.normal(0, 1, n); y = np.zeros(n); acc = 0
    ks = np.linspace(k0, k1, n)
    for i in range(n): acc += ks[i] * (x[i] - acc); y[i] = acc
    return y * np.sin(np.linspace(0, np.pi, n)) ** 2 * 2.5
def flip():
    n = int(0.28 * SR); x = rng.normal(0, 1, n); y = x - np.concatenate([[0], x[:-1]]) * 0.9
    e = np.zeros(n); e += np.exp(-((np.arange(n) / SR - 0.05) / 0.03) ** 2) + 0.6 * np.exp(-((np.arange(n) / SR - 0.15) / 0.04) ** 2)
    return y * e * 0.5
def thud(f=90, d=0.25):
    t = t_(d); f_ = f * np.exp(-t * 6); return np.sin(2 * np.pi * np.cumsum(f_) / SR) * env(len(t), 0.002, 0.06)
def clink(f=2600): t = t_(0.25); return (np.sin(2 * np.pi * f * t) + 0.6 * np.sin(2 * np.pi * f * 1.52 * t)) * env(len(t), 0.0005, 0.04)
def beep(f=660, d=0.12): t = t_(d); return np.sign(np.sin(2 * np.pi * f * t)) * 0.3 * env(len(t), 0.003, d)
def chirp():
    t = t_(0.09); f = 3200 + 1600 * np.sin(np.linspace(0, np.pi, len(t))); return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.sin(np.linspace(0, np.pi, len(t)))
def motor(d):
    t = t_(d); s = np.sin(2 * np.pi * 55 * t + 0.3 * np.sin(2 * np.pi * 7 * t)) + 0.5 * np.sin(2 * np.pi * 110 * t)
    return s * np.minimum(1, np.minimum(t / 0.3, (d - t) / 0.3))
def rattle(d=0.7):
    n = int(d * SR); s = np.zeros(n)
    for k in range(14): i = int(k / 14 * n); c = click(); s[i:i + len(c)] += c[:n - i] * (0.6 + 0.4 * rng.random())
    return s + thud(70, d) * 0.5
def breath(d=0.7): return lp(rng.normal(0, 1, int(d * SR)), 0.06) * np.sin(np.linspace(0, np.pi, int(d * SR))) * 3
def chord(d):
    t = t_(d); s = sum(np.sin(2 * np.pi * f * t) * (0.6 ** i) for i, f in enumerate([220, 277.2, 329.6, 440]))
    return s * np.minimum(1, t / 0.6) * np.exp(-t / (d * 0.7))

put(T['off'], click(), 0.25)
for i in range(8): put(T['off'] + i * 0.06, clink(1800 + i * 90), 0.08)
put(T['net'] - 0.15, whoosh(0.7, 0.02, 0.15), 0.12)
for k in ['d1', 'd2', 'week', 'month', 'm3', 'half', 'year']: put(T[k], flip(), 0.25)
for i in range(3): put(T['morning'] + 0.1 + i * 0.13, chirp(), 0.06)
for i, k in enumerate(['yt', 'wa', 'sites', 'games']): put(T[k], pop(480 + i * 60, 900 + i * 60), 0.18)
put(T['notopen'] + 0.15, thud(80), 0.25)
put(T['nohelp'], click(), 0.2)
for i in range(3): put(T['reboot'] + i * 0.35, pop(700, 400, 0.1), 0.1)
put(T['confused'], beep(520), 0.12); put(T['confused'] + 0.16, beep(420), 0.12)
put(T['exhale'] - 0.05, breath(0.8), 0.12)
for i, k in enumerate(['vk', 'ya', 'bank', 'mp']): put(T[k], ding(1180 + i * 110), 0.1)
put(T['mp'] - 0.2, motor(T['work'] + 1.1 - T['mp']), 0.06)
put(T['okay'], pop(600, 1000, 0.08), 0.12)
for i in range(3): put(T['write'] + i * 0.22, pop(650, 1050, 0.08), 0.12)
put(T['week'] + 0.6, whoosh(0.8, 0.01, 0.12), 0.14)
put(T['noupd'] + 0.3, beep(380, 0.25), 0.12)
for i in range(6): put(T['money'] + i * 0.16 + 0.55, clink(2400 + i * 120), 0.13)
for i in range(7): put(T['dl'] - 0.2 + i * 0.13 + 0.6, thud(140), 0.18)
for i in range(2): put(T['call'] + i * 0.45, beep(425, 0.3), 0.07)
put(T['vdead'] + 0.15, pop(400, 120, 0.25), 0.18)
put(T['nosee'], ding(523, 1.2), 0.07)
put(T['close'] - 0.1, rattle(0.75), 0.13)
put(T['grow'] - 0.6, whoosh(0.9, 0.01, 0.3), 0.15)
for i in range(5): put(T['grow'] - 0.2 + i * 0.12, pop(300, 600, 0.12), 0.14)
put(T['blog'] - 0.3, motor(T['stars'] - T['blog']), 0.06)
for i in range(6): put(T['stars'] + i * 0.1, ding(1568 + i * 70, 0.4), 0.06)
for i in range(4): put(T['passing'] - 0.4 + (T['again'] - T['passing'] + 0.2) * i / 4, whoosh(0.25, 0.05, 0.3), 0.08)
put(T['price'] - 0.1, pop(350, 1400, 0.1), 0.18)
wind = lp(rng.normal(0, 1, int((DUR - T['year']) * SR)), 0.01) * 4
put(T['year'], wind * np.minimum(1, np.arange(len(wind)) / SR / 1.0), 0.05)
put(T['what'] - 0.1, pop(500, 800, 0.1), 0.12)
put(T['world'] - 0.3, chord(DUR - T['world'] + 0.3), 0.08)

out = np.clip(out, -1, 1)
with wave.open('public/sfx.wav', 'wb') as w:
    w.setnchannels(1); w.setsampwidth(2); w.setframerate(SR); w.writeframes((out * 32767).astype(np.int16).tobytes())
print('sfx peak', round(float(np.abs(out).max()), 3))
