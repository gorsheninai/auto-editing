#!/usr/bin/env python3
"""Сводит отчёты ref_analyze.py по нескольким референсам в одну спецификацию стиля (style_spec.json)
и переводит её в параметры нашего монтажа.

python3 tools/style_spec.py work/an1/report.json work/an2/report.json … -o style_spec.json

Спецификация — числа по 7 разделам: что и сколько в кадре, текст (кегль, место, цвет, регистр, анимации),
камера, композиция, ритм (длины планов, очереди, смена крупности, переходы), звук (LUFS, подложка,
эффекты и их уровень к голосу), грейд (яркость, контраст, насыщенность, тёплые/холодные тени и света,
виньетка, зерно). Плюс `engine` — готовые значения для story.json и `substitutes` — чем заменять то,
чего в наших паках нет.
"""
import json, sys, collections
import numpy as np

def med(xs, nd=3):
    xs = [x for x in xs if x is not None]
    return round(float(np.median(xs)), nd) if xs else None

def main():
    a = sys.argv[1:]; out = a[a.index('-o') + 1] if '-o' in a else 'style_spec.json'
    reps = [json.load(open(p)) for p in a if p.endswith('.json') and p != out]
    # 1. материалы
    share = collections.defaultdict(list)
    for r in reps:
        for k in set(sum([list(x['materials']['share_by_type']) for x in reps], [])): share[k].append(r['materials']['share_by_type'].get(k, 0))
    materials = {k: med(v) for k, v in share.items()}
    # 2. текст
    subs = [e for r in reps for e in r['text']['events'] if e['role'] == 'subtitle']
    titles = [e for r in reps for e in r['text']['titles']]
    anim_s = collections.Counter(e['anim_in']['kind'] for e in subs if e.get('anim_in'))
    anim_t = collections.Counter(e['anim_in']['kind'] for e in titles if e.get('anim_in'))
    anim_t_ms = med([e['anim_in']['ms'] for e in titles if e.get('anim_in') and e['anim_in']['kind'] != 'cut'], 0)
    anim_t_out = collections.Counter(e['anim_out']['kind'] for e in titles if e.get('anim_out'))
    # цвет субтитров: доминирующий в каждом референсе, затем тот, что совпал у большинства референсов
    def dom(r):
        c = collections.Counter(e['color'] for e in r['text']['events'] if e['role'] == 'subtitle' and e.get('color'))
        return c.most_common(1)[0][0] if c else None
    per = [dom(r) for r in reps if dom(r)]
    rgb = lambda h: np.array([int(h[i:i + 2], 16) for i in (1, 3, 5)])
    best = max(per, key=lambda c: sum(np.abs(rgb(c) - rgb(o)).sum() < 60 for o in per)) if per else None
    colors = collections.Counter([best] if best else [])
    # ключевые слова крупнее: одиночные «заголовки» в потоке субтитров — это выделенные слова
    keys = [e for r in reps for e in r['text']['titles'] if e['words'] == 1 and e['dur'] < 1.2]
    text = {'subtitle': {'h_px': med([e['h_px'] for e in subs], 0), 'xh_px': med([e.get('xh_px') for e in subs], 1), 'y_rel': med([e['y_rel'] for e in subs]), 'x_rel': med([e['x_rel'] for e in subs]),
                         'words_per_screen': med([e['words'] for e in subs], 1), 'dur': med([e['dur'] for e in subs], 2),
                         'case': collections.Counter(e['case'] for e in subs).most_common(1)[0][0] if subs else None,
                         'color': colors.most_common(1)[0][0] if colors else None, 'anim': dict(anim_s), 'lead_ms': med([e.get('lead_ms') for e in subs], 0),
                         'key_h_px': med([e['h_px'] for e in keys], 0), 'key_per_min': round(len(keys) / sum(r['duration'] / 60 for r in reps), 1)},
            'title': {'count_per_min': round(sum(len(r['text']['titles']) for r in reps) / sum(r['duration'] / 60 for r in reps), 2), 'h_px': med([e['h_px'] for e in titles], 0),
                      'anim_in': dict(anim_t), 'anim_in_ms': anim_t_ms, 'anim_out': dict(anim_t_out), 'dur': med([e['dur'] for e in titles], 2),
                      'y_rel': med([e['y_rel'] for e in titles]), 'examples': [e['text'] for e in titles][:12]}}
    # 3–5. камера, композиция, ритм, переходы
    shots = [s for r in reps for s in r['shots']]
    sp = [s for s in shots if s['type'] == 'speaker']; ins = [s for s in shots if s['type'] != 'speaker']
    jumps = sum([r['rhythm']['crop_jumps'] for r in reps], [])
    trans = collections.Counter(t['type'] for r in reps for t in r['transitions']['list'])
    ntr = sum(trans.values()) or 1
    rhythm = {'cuts_per_min': med([r['rhythm']['cuts_per_min'] for r in reps], 1), 'speaker_shot_median': med([s['len'] for s in sp], 2), 'insert_shot_median': med([s['len'] for s in ins], 2),
              'speaker_share': med([r['composition']['speaker_share'] for r in reps]), 'bursts_per_min': round(sum(len(r['rhythm']['bursts']) for r in reps) / sum(r['duration'] / 60 for r in reps), 2),
              'burst_shot_len': med([b['avg_len'] for r in reps for b in r['rhythm']['bursts']], 2),
              'crop_jump_share': round(sum(1 for j in jumps if abs(j - 1) > 0.15) / max(1, len(jumps)), 2), 'crop_jump_ratio': med([max(j, 1 / j) for j in jumps if abs(j - 1) > 0.15], 2),
              'cut_on_word_share': med([r['rhythm']['cut_on_word_share'] for r in reps], 2),
              'transitions': {k: round(v / ntr, 2) for k, v in trans.items()}}
    camera = {'speaker_zoom_per_s': med([s['camera']['zoom_per_s'] for s in sp], 4), 'insert_zoom_per_s': med([abs(s['camera']['zoom_per_s']) for s in ins], 4),
              'insert_pan': med([abs(s['camera']['pan_x']) + abs(s['camera']['pan_y']) for s in ins], 4), 'shake': med([s['camera']['shake'] for s in shots], 4)}
    composition = {'speaker_face_h': med([s['face']['h'] for s in sp if s['face']]), 'speaker_face_y': med([s['face']['y'] for s in sp if s['face']]),
                   'speaker_face_x': med([s['face']['x'] + s['face']['w'] / 2 for s in sp if s['face']]),
                   'shot_sizes': dict(collections.Counter(s['shot_size'] for s in sp))}
    # 6. звук
    au = [r['audio'] for r in reps if r.get('audio')]
    sfx = [x for q in au for x in q['sfx']]
    sound = {'lufs': med([q['lufs'] for q in au], 1), 'true_peak': med([q['true_peak'] for q in au], 1), 'music': sum(q['music_likely'] for q in au) >= max(1, len(au) // 2 + 1),
             'bed_low_rel_voice_db': med([q.get('bed_low_rel_voice_db') for q in au], 1), 'bed_rel_db_median': med([q.get('bed_rel_db') for q in au], 1), 'tempo': med([q['tempo'] for q in au], 0),
             'whoosh_per_min': round(sum(1 for x in sfx if x['kind'] == 'whoosh') / sum(r['duration'] / 60 for r in reps), 1),
             'whoosh_level_rel_voice_db': med([x['level_rel_voice_db'] for x in sfx if x['kind'] == 'whoosh'], 1),
             'hit_share_of_cuts': round(sum(1 for x in sfx if x['kind'] == 'hit') / max(1, sum(len(r['rhythm']['cuts']) for r in reps)), 2),
             'hit_level_rel_voice_db': med([x['level_rel_voice_db'] for x in sfx if x['kind'] == 'hit'], 1),
             'sfx_on_cut_share': round(sum(x['on_cut'] for x in sfx) / max(1, len(sfx)), 2),
             'speech_wpm': med([q['speech'].get('wpm') for q in au], 0), 'speech_max_pause': med([q['speech'].get('max_pause') for q in au], 2)}
    # 7. грейд
    gk = ['L', 'C', 'black', 'white', 'S', 'warm_sh', 'warm_hi', 'vign', 'grain', 'sharp']
    grade = {k: med([r['grade_speaker'][k] for r in reps if r['grade_speaker'].get('L')], 4) for k in gk}
    grade_all = {k: med([r['grade'][k] for r in reps], 4) for k in gk}
    bw = round(sum(r['grade']['bw_shots'] for r in reps) / max(1, len(shots)), 2)
    # движок: значения для story.json
    st = text['subtitle']
    engine = {
        'subtitle': {'style': 'SubTom', 'fontSize': int(round(st['xh_px'] / 0.545)) if st.get('xh_px') else int(round((st['h_px'] or 50) * 1.55)), 'top': int(round((st['y_rel'] or 0.58) * 1920)), 'color': st['color'] or '#EFE7DA',  # кегль: калибровка замкнутой проверкой (наш 58 → OCR 37 px)
                     'case': st['case'] or 'lower', 'words': max(1, int(round(st['words_per_screen'] or 1))), 'anim': max(st['anim'], key=st['anim'].get) if st['anim'] else 'cut',
                     'leadMs': st['lead_ms'] or 0},
        'title': {'anim': (max({k: v for k, v in anim_t.items() if k != 'cut'}, key=anim_t.get) if sum(v for k, v in anim_t.items() if k != 'cut') >= 0.3 * max(1, sum(anim_t.values())) else 'cut') if anim_t else 'blur',
                  'ms': anim_t_ms or 300, 'perMin': text['title']['count_per_min']},
        'keywords': {'scale': round((text['subtitle']['key_h_px'] or 0) / max(1, text['subtitle']['h_px'] or 1), 2), 'perMin': text['subtitle']['key_per_min']},
        'crop': {'base': 1.0, 'jump': rhythm['crop_jump_ratio'] or 1.3, 'jumpShare': rhythm['crop_jump_share']},
        'shots': {'speakerMedian': rhythm['speaker_shot_median'], 'insertMedian': rhythm['insert_shot_median'], 'speakerShare': rhythm['speaker_share'],
                  'burstsPerMin': rhythm['bursts_per_min'], 'burstShot': rhythm['burst_shot_len']},
        'transitions': rhythm['transitions'], 'cutsOnWords': rhythm['cut_on_word_share'],
        'sound': {'lufs': sound['lufs'] or -14, 'music': sound['music'], 'bedRelVoiceDb': sound['bed_low_rel_voice_db'], 'whooshPerMin': sound['whoosh_per_min'],
                  'whooshRelVoiceDb': sound['whoosh_level_rel_voice_db'], 'hitShare': sound['hit_share_of_cuts'], 'hitRelVoiceDb': sound['hit_level_rel_voice_db']},
        'grade': grade, 'bwShare': bw,
        'insertCamera': {'zoomPerS': camera['insert_zoom_per_s'], 'pan': camera['insert_pan']},
    }
    substitutes = {
        'broll': 'живой B-roll → 2D-сцена по смыслу во весь кадр с той же камерой (медленный наезд/дрейф как insert_zoom_per_s), в том же грейде и с зерном',
        'person': 'человек в кадре → 2D-персонаж/силуэт в сцене по смыслу',
        'screenshot': 'скриншот → PhoneFrame/PhoneScroll/наш интерфейс-блок с текстом по смыслу',
        'graphic': 'плоская графика → блок библиотеки той же подгруппы',
        'card_white': 'CardWords: светлый фон, одно слово за раз',
        'card_black': 'CardWords тёмный: чёрный фон, мелкое белое слово',
        'flicker_bg': 'фон за спикером мигает → мир-флик (смена 2D-миров каждые 2–3 кадра)',
        'bw_series': 'ч/б серия → FxGrade чб на вставках',
    }
    spec = {'refs': [r['file'] for r in reps], 'materials': materials, 'text': text, 'camera': camera, 'composition': composition, 'rhythm': rhythm,
            'sound': sound, 'grade_speaker': grade, 'grade_all': grade_all, 'bw_share': bw, 'engine': engine, 'substitutes': substitutes}
    json.dump(spec, open(out, 'w'), ensure_ascii=False, indent=1)
    print(json.dumps({k: spec[k] for k in ('materials', 'rhythm', 'sound', 'grade_speaker')}, ensure_ascii=False, indent=1)[:3000])
    print('engine:', json.dumps(engine, ensure_ascii=False)[:1500])

if __name__ == '__main__':
    main()
