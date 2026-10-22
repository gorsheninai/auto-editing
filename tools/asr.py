#!/usr/bin/env python3
"""Распознавание русской речи с таймингами слов (sherpa-onnx, модель zipformer-ru, офлайн).

python3 tools/asr.py <видео_или_аудио> [out.json] [--script текст.txt]

Модель: ~/asr/sherpa-onnx-zipformer-ru-2024-09-18 (или $ASR_MODEL). Ставится один раз:
  pip install sherpa-onnx --break-system-packages
  curl -L -o zf.tar.bz2 https://github.com/k2-fsa/sherpa-onnx/releases/download/asr-models/sherpa-onnx-zipformer-ru-2024-09-18.tar.bz2 && tar xjf zf.tar.bz2

Выход: [{w, s, e}] — слова с началом и концом в секундах исходника.
С --script: слова сценария (с пунктуацией и регистром) выравниваются на распознанные по времени
(Нидлман–Вунш по буквам), так субтитры пишутся как в тексте, а тайминг — по реальному голосу.
"""
import json, os, re, subprocess, sys
import numpy as np

MODEL = os.environ.get('ASR_MODEL', os.path.expanduser('~/asr/sherpa-onnx-zipformer-ru-2024-09-18'))
if not os.path.isdir(MODEL): MODEL = '/home/claude/asr/sherpa-onnx-zipformer-ru-2024-09-18'

def load(src):
    raw = subprocess.run(['ffmpeg', '-v', 'error', '-i', src, '-ac', '1', '-ar', '16000', '-f', 'f32le', '-'], capture_output=True).stdout
    return np.frombuffer(raw, dtype=np.float32)

def recognize(x):
    import sherpa_onnx
    rec = sherpa_onnx.OfflineRecognizer.from_transducer(
        encoder=f'{MODEL}/encoder.int8.onnx', decoder=f'{MODEL}/decoder.onnx', joiner=f'{MODEL}/joiner.int8.onnx',
        tokens=f'{MODEL}/tokens.txt', num_threads=4, decoding_method='greedy_search')
    words = []
    # куски по 25 с с перекрытием нет — режем по тишине, чтобы не рвать слова
    hop = 160; n = len(x) // hop
    rms = np.sqrt((x[:n * hop].reshape(n, hop) ** 2).mean(1) + 1e-12)
    quiet = rms < max(1e-4, np.percentile(rms, 20) * 1.5)
    bounds, start = [], 0
    while start < len(x):
        end = min(len(x), start + 16000 * 25)
        if end < len(x):
            a, b = (start + 16000 * 15) // hop, end // hop
            q = np.where(quiet[a:b])[0]
            if len(q): end = (a + q[len(q) // 2]) * hop
        bounds.append((start, end)); start = end
    for a, b in bounds:
        s = rec.create_stream(); s.accept_waveform(16000, x[a:b]); rec.decode_stream(s)
        r = s.result; toks, ts = list(r.tokens), list(r.timestamps)
        cur = None
        for tok, t in zip(toks, ts):
            t = t + a / 16000
            if tok.startswith(('▁', ' ')) or cur is None:
                if cur: words.append(cur)
                cur = {'w': tok.replace('▁', '').strip(), 's': round(t, 3), 'e': round(t + 0.12, 3)}
            else:
                cur['w'] += tok; cur['e'] = round(t + 0.12, 3)
        if cur: words.append(cur)
    words = [w for w in words if w['w']]
    for i in range(len(words) - 1):  # конец слова — не дальше начала следующего
        words[i]['e'] = round(min(max(words[i]['e'], words[i]['s'] + 0.08), words[i + 1]['s']), 3)
    return words

def norm(w): return re.sub(r'[^а-яёa-z0-9]', '', w.lower().replace('ё', 'е'))

def align_script(script_words, asr):
    """Сопоставить слова сценария распознанным: DP по словам с похожестью по буквам."""
    A = [norm(w) for w in script_words]; B = [norm(w['w']) for w in asr]
    def sim(a, b):
        if not a or not b: return 0.0
        import difflib
        return difflib.SequenceMatcher(None, a, b).ratio()
    n, m = len(A), len(B)
    D = np.zeros((n + 1, m + 1)); P = np.zeros((n + 1, m + 1), dtype=int)
    for i in range(1, n + 1): D[i, 0] = -0.6 * i; P[i, 0] = 1
    for j in range(1, m + 1): D[0, j] = -0.4 * j; P[0, j] = 2
    for i in range(1, n + 1):
        for j in range(1, m + 1):
            c = [D[i - 1, j - 1] + (sim(A[i - 1], B[j - 1]) * 2 - 0.8), D[i - 1, j] - 0.6, D[i, j - 1] - 0.4]
            k = int(np.argmax(c)); D[i, j] = c[k]; P[i, j] = k
    i, j, pairs = n, m, {}
    while i > 0 or j > 0:
        k = P[i, j] if i > 0 and j > 0 else (1 if i > 0 else 2)
        if k == 0: pairs[i - 1] = j - 1; i -= 1; j -= 1
        elif k == 1: i -= 1
        else: j -= 1
    out = []
    for i, w in enumerate(script_words):
        if i in pairs: out.append({'w': w, 's': asr[pairs[i]]['s'], 'e': asr[pairs[i]]['e']})
        else: out.append({'w': w, 's': None, 'e': None})
    # пропущенные — между соседями
    for i, o in enumerate(out):
        if o['s'] is None:
            prev = next((out[k]['e'] for k in range(i - 1, -1, -1) if out[k]['e'] is not None), 0.0)
            nxt = next((out[k]['s'] for k in range(i + 1, len(out)) if out[k]['s'] is not None), prev + 0.3)
            o['s'] = round(prev, 3); o['e'] = round(max(prev + 0.05, nxt), 3)
    return out

def main():
    a = sys.argv[1:]
    src = a[0]; out = a[1] if len(a) > 1 and not a[1].startswith('--') else None
    x = load(src); words = recognize(x)
    if '--script' in a:
        sw = [w for w in open(a[a.index('--script') + 1]).read().split() if w not in ('—', '–', '-')]
        words = align_script(sw, words)
    txt = ' '.join(w['w'] for w in words)
    if out: json.dump(words, open(out, 'w'), ensure_ascii=False, indent=0)
    print(f'{len(words)} слов:', txt[:400])

if __name__ == '__main__':
    main()
