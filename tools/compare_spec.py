#!/usr/bin/env python3
"""Замкнутая проверка: наш готовый ролик, разобранный тем же ref_analyze.py, против спецификации стиля.

python3 tools/compare_spec.py work/an_out/report.json work/style_spec.json [--video out.mp4 --story src/story.json]
С --video/--story кегль субтитров меряется прямо по кадрам (маска по цвету субтитра, высота строчных по профилю строк):
распознавание текста латиницей путает кириллицу и надписи в графике, поэтому для наших роликов это точнее.
Печатает таблицу «референс / наш / в норме?» по ритму, тексту, звуку и грейду.
"""
import json, subprocess, sys
import numpy as np

def direct_xh(video, story, spec):
    """Высота строчных субтитра по кадрам: середина каждого слова на планах спикера, маска по цвету, ядро профиля строк."""
    st = json.load(open(story)); su = spec['engine']['subtitle']; c = su['color'].lstrip('#'); col = np.array([int(c[i:i + 2], 16) for i in (0, 2, 4)])
    top = su['top']; keys = set((st['settings'].get('subStyle') or {}).get('keywords') or [])
    A = [r for r in st['rows'] if r['mode'] == 'A' and not r.get('hook') and not r.get('stack')]
    out = []
    for w in st['words']:
        m = (w['s'] + w['e']) / 2
        if not any(r['s'] <= m < r['e'] for r in A) or w['w'].lower().strip('.,!?') in keys: continue
        raw = subprocess.run(['ffmpeg', '-v', 'error', '-ss', f'{m:.3f}', '-i', video, '-frames:v', '1', '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-'], capture_output=True).stdout
        if len(raw) < 1080 * 1920 * 3: continue
        f = np.frombuffer(raw, np.uint8)[:1080 * 1920 * 3].reshape(1920, 1080, 3)[max(0, top - 220):top + 220].astype(int)
        mask = (np.abs(f - col).max(2) < 34)
        prof = mask.sum(1)
        if prof.max() < 6: continue
        core = prof > prof.max() * 0.35; best = run = 0
        for v in core: run = run + 1 if v else 0; best = max(best, run)
        out.append(best)
    return float(np.median(out)) if out else None

def main():
    r = json.load(open(sys.argv[1])); s = json.load(open(sys.argv[2]))
    shots = r['shots']; sp = [x for x in shots if x['type'] == 'speaker']; ins = [x for x in shots if x['type'] != 'speaker']
    subs = [e for e in r['text']['events'] if e['role'] == 'subtitle']
    a = r.get('audio') or {}
    x = sys.argv
    sub_xh = direct_xh(x[x.index('--video') + 1], x[x.index('--story') + 1], s) if '--video' in x and '--story' in x else \
        (float(np.median([e['xh_px'] for e in subs if e.get('xh_px')])) if subs else None)
    rows = [
        ('склеек в минуту', s['rhythm']['cuts_per_min'], r['rhythm']['cuts_per_min'], 0.3),
        ('план спикера, с (медиана)', s['rhythm']['speaker_shot_median'], float(np.median([x['len'] for x in sp])) if sp else None, 0.35),
        ('вставка, с (медиана)', s['rhythm']['insert_shot_median'], float(np.median([x['len'] for x in ins])) if ins else None, 0.35),
        ('доля спикера', s['rhythm']['speaker_share'], r['composition']['speaker_share'], 0.2),
        ('склейки только жёсткие', s['engine']['transitions'].get('hard', 1), r['transitions']['share'].get('hard', 0), 0.1),
        ('субтитр, высота строчных px', s['text']['subtitle'].get('xh_px'), sub_xh, 0.15),
        ('субтитр, высота y', s['text']['subtitle']['y_rel'], float(np.median([e['y_rel'] for e in subs])) if subs else None, 0.08),
        ('слов на экране', s['text']['subtitle']['words_per_screen'], float(np.median([e['words'] for e in subs])) if subs else None, 0.3),
        ('громкость LUFS', s['sound']['lufs'], a.get('lufs'), 0.1),
        ('подложка (p10/p90), дБ', s['sound'].get('bed_rel_db_median'), a.get('bed_rel_db'), 0.2),
        ('яркость спикера L', s['grade_speaker']['L'], r['grade_speaker']['L'], 0.2),
        ('контраст спикера C', s['grade_speaker']['C'], r['grade_speaker']['C'], 0.2),
        ('насыщенность спикера S', s['grade_speaker']['S'], r['grade_speaker']['S'], 0.25),
    ]
    print(f"{'параметр':30s}{'реф':>9s}{'наш':>9s}  ")
    ok = 0
    for name, ref, our, tol in rows:
        if ref is None or our is None: print(f'{name:30s}{str(ref):>9s}{str(our):>9s}  —'); continue
        good = abs(our - ref) <= tol * max(abs(ref), 1e-6) if ref else abs(our) < 0.05
        ok += good; print(f'{name:30s}{ref:9.3f}{our:9.3f}  {"✓" if good else "✗"}')
    print(f'в норме {ok} из {len(rows)}')

if __name__ == '__main__':
    main()
