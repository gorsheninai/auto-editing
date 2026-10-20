# Quiet extra SFX for this reel: neon buzz, camera shutter, flash whine. 48 kHz mono 16-bit.
import numpy as np, wave
SR = 48000
rng = np.random.default_rng(3)

def save(name, x):
    x = x / (np.abs(x).max() + 1e-9) * 0.9
    with wave.open(f'public/sfx/{name}.wav', 'wb') as w:
        w.setnchannels(1); w.setsampwidth(2); w.setframerate(SR)
        w.writeframes((x * 32767).astype(np.int16).tobytes())

def env(n, a, r):
    e = np.ones(n); A = int(a * SR); R = int(r * SR)
    e[:A] = np.linspace(0, 1, A); e[-R:] = np.linspace(1, 0, R) ** 2
    return e

# neon tube: 100 Hz hum with harmonics, stutters on, then steady
t = np.arange(int(0.7 * SR)) / SR
hum = sum(np.sin(2 * np.pi * 100 * k * t) / k for k in range(1, 9)) + 0.15 * rng.standard_normal(len(t))
gate = np.ones_like(t)
for a, b in [(0.03, 0.06), (0.09, 0.11), (0.15, 0.16)]:
    gate[(t > a) & (t < b)] = 0.1
save('buzz', hum * gate * env(len(t), 0.005, 0.25))

# shutter: two short filtered clicks
n = int(0.18 * SR); x = np.zeros(n)
for at, amp in [(0.0, 1.0), (0.075, 0.7)]:
    i = int(at * SR); m = int(0.025 * SR)
    burst = rng.standard_normal(m) * np.exp(-np.linspace(0, 9, m)) * amp
    burst = np.convolve(burst, np.ones(6) / 6, 'same')
    x[i:i + m] += burst
save('shutter', x)

# flash: rising soft whine + tiny pop
t = np.arange(int(0.45 * SR)) / SR
f = 2200 + 3800 * t / t[-1]
wh = np.sin(2 * np.pi * np.cumsum(f) / SR) * 0.35 * env(len(t), 0.2, 0.08)
pop = np.zeros_like(t); k = int(0.36 * SR); pop[k:k + 900] = rng.standard_normal(900) * np.exp(-np.linspace(0, 8, 900))
save('flash', wh + pop)
print('sfx ok')
