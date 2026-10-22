import React from 'react';
import {AbsoluteFill, interpolate, random, useCurrentFrame} from 'remotion';
import {SANS, clamp, rad, ramp, spring, themeFrom, type Theme} from '../blocks/kit';
import {Phone} from '../blocks/phone';
import type {SceneProps} from './registry';

/* Сцены ролика 08: ИИ-диктофон в виде карточки (2D-моушн кодом) и приложение с готовым конспектом. */
const th = (p: SceneProps): Theme => themeFrom(p.theme || {dark: true, bg: '#121212', ink: '#F2EDE4', accent: '#E9B25A'});
const at = (p: SceneProps, i: number) => Math.round(((p.allWords?.[i]?.s ?? p.t0) - p.t0) * 30);

const Glow: React.FC<{t: Theme}> = ({t}) => {
  const f = useCurrentFrame();
  return <AbsoluteFill style={{background: `radial-gradient(ellipse at 50% ${40 + Math.sin(f / 40) * 3}%, ${t.accent}26 0%, ${t.bg} 55%), ${t.bg}`}}>
    <AbsoluteFill style={{backgroundImage: 'radial-gradient(rgba(255,255,255,.05) 1.5px, transparent 2px)', backgroundSize: '34px 34px', opacity: 0.6}} />
  </AbsoluteFill>;
};

/* Карточка-диктофон: тонкая чёрная карта, решётка микрофона, светодиод, гравировка AI */
const Card: React.FC<{t: Theme; rec: number; ai: number; w?: number}> = ({t, rec, ai, w = 500}) => {
  const f = useCurrentFrame(); const h = w * 1.58;
  const led = rec > 0 ? (Math.sin(f / 4) > 0 ? '#FF3B30' : '#7A1A15') : t.accent;
  return <div style={{position: 'relative', width: w, height: h, borderRadius: rad(44), background: 'linear-gradient(155deg, #2A2A2D 0%, #121214 45%, #0A0A0B 100%)',
    boxShadow: `0 50px 120px rgba(0,0,0,.6), inset 0 0 0 2px rgba(255,255,255,.08), inset 0 2px 0 rgba(255,255,255,.12)`, overflow: 'hidden'}}>
    {/* блик */}
    <div style={{position: 'absolute', inset: 0, background: `linear-gradient(115deg, transparent ${30 + Math.sin(f / 30) * 10}%, rgba(255,255,255,.07) ${42 + Math.sin(f / 30) * 10}%, transparent ${55 + Math.sin(f / 30) * 10}%)`}} />
    {/* микрофон */}
    <div style={{position: 'absolute', top: 54, left: '50%', translate: '-50% 0', display: 'flex', gap: 9}}>
      {Array.from({length: 7}, (_, i) => <i key={i} style={{width: 9, height: 9, borderRadius: '50%', background: '#000', boxShadow: 'inset 0 1px 1px rgba(255,255,255,.15)', display: 'block'}} />)}
    </div>
    {/* светодиод */}
    <div style={{position: 'absolute', top: 50, right: 48, width: 16, height: 16, borderRadius: '50%', background: led, boxShadow: `0 0 ${18 + rec * 12}px ${led}`}} />
    {/* гравировка */}
    <div style={{position: 'absolute', left: 0, right: 0, top: h * 0.42, textAlign: 'center', fontFamily: SANS, fontWeight: 800, fontSize: w * 0.26, letterSpacing: -4,
      color: 'transparent', backgroundImage: `linear-gradient(180deg, rgba(255,255,255,.22), rgba(255,255,255,.06))`, WebkitBackgroundClip: 'text', backgroundClip: 'text',
      filter: ai > 0 ? `drop-shadow(0 0 ${ai * 26}px ${t.accent})` : 'none'}}>AI</div>
    <div style={{position: 'absolute', left: 0, right: 0, bottom: 56, textAlign: 'center', fontFamily: SANS, fontWeight: 700, fontSize: 22, letterSpacing: 6, color: 'rgba(255,255,255,.28)'}}>VOICE · NOTE</div>
    {/* кнопка */}
    <div style={{position: 'absolute', left: 48, bottom: 48, width: 54, height: 12, borderRadius: 6, background: '#000', boxShadow: 'inset 0 1px 2px rgba(255,255,255,.12)'}} />
  </div>;
};

/* Волна записи вокруг карточки */
const Wave: React.FC<{t: Theme; k: number; y: number}> = ({t, k, y}) => {
  const f = useCurrentFrame(); const n = 44;
  return <div style={{position: 'absolute', left: 60, right: 60, top: y, height: 220, display: 'flex', alignItems: 'center', justifyContent: 'space-between', opacity: k}}>
    {Array.from({length: n}, (_, i) => { const a = Math.abs(Math.sin(i * 0.55 + f / 3.5) * 0.6 + (random(`w${i}-${Math.floor(f / 2)}`) - 0.5) * 0.7);
      const mid = 1 - Math.abs(i - n / 2) / (n / 2);
      return <i key={i} style={{width: 10, height: 20 + a * 190 * (0.3 + 0.7 * mid) * k, borderRadius: 5, background: i % 3 ? t.accent : t.ink, opacity: 0.35 + 0.65 * mid, display: 'block'}} />; })}
  </div>;
};

/* AiCard: появление карточки → «диктофон» → «+ ИИ». note: «AiCard» или «AiCard: запись» (режим записи) */
export const AiCard: React.FC<SceneProps> = (p) => {
  const f = useCurrentFrame(); const t = th(p);
  const rec = /запис|rec/i.test(p.row.note || '');
  const k = spring({frame: f, fps: 30, config: {damping: 15, stiffness: 120}});
  const tilt = interpolate(f, [0, p.dur], [-10, 6], clamp);
  const iAi = rec ? 0 : Math.max(0, at(p, 5));
  const ai = rec ? 0.6 : ramp(f, iAi, iAi + 10);
  const labels = rec ? [{s: 0, txt: '● запись'}, {s: 8, txt: `00:${String(12 + Math.floor(f / 30)).padStart(2, '0')}`}] : [{s: 4, txt: 'диктофон'}, {s: iAi, txt: '+ искусственный интеллект'}];
  return <AbsoluteFill style={{overflow: 'hidden'}}>
    <Glow t={t} />
    {rec ? <Wave t={t} k={ramp(f, 4, 14)} y={1110} /> : null}
    <div style={{position: 'absolute', left: '50%', top: rec ? 120 : 260, translate: `-50% ${(1 - k) * 700}px`, perspective: 1600}}>
      <div style={{transform: `rotateY(${tilt}deg) rotateX(${6 - k * 6}deg) rotateZ(${(1 - k) * -14}deg)`, scale: String(rec ? 0.82 + 0.02 * Math.sin(f / 6) : 0.9 + 0.1 * k)}}>
        <Card t={t} rec={rec ? 1 : 0} ai={ai} />
      </div>
    </div>
    <div style={{position: 'absolute', left: 0, right: 0, top: rec ? 900 : 1150, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14}}>
      {labels.map((l, i) => { const o = ramp(f, l.s, l.s + 8);
        return <div key={i} style={{fontFamily: SANS, fontWeight: 800, fontSize: i === 0 ? 92 : 46, letterSpacing: i === 0 ? -3 : 0, color: i === 0 ? t.ink : t.accent,
          opacity: o, translate: `0 ${(1 - o) * 24}px`, textTransform: i === 0 ? 'lowercase' : 'none', textShadow: '0 4px 24px rgba(0,0,0,.5)'}}>{l.txt}</div>; })}
    </div>
  </AbsoluteFill>;
};

/* PhoneNotes: приложение — запись лекции → ИИ пишет конспект по пунктам → «готово» */
const NOTES = ['Тема: рынок и спрос', 'Спрос растёт, когда цена падает', 'Пример: сезонные скидки', 'Формула эластичности', 'Вывод: цена ≠ ценность'];
export const PhoneNotes: React.FC<SceneProps> = (p) => {
  const f = useCurrentFrame(); const t = th(p);
  const bp = {data: {code: '', title: '', total: '', items: [], text: ''}, theme: t, zoneH: p.zoneH, full: p.full, dur: p.dur};
  const done = Math.round(p.dur * 0.78);
  return <AbsoluteFill style={{overflow: 'hidden'}}>
    <Glow t={t} />
    <Phone p={bp} dark screenBg="#0E0F12">
      <div style={{position: 'absolute', inset: 0, padding: '120px 40px 40px', color: '#F2EDE4', fontFamily: SANS}}>
        <div style={{fontSize: 26, color: '#8A8F98', fontWeight: 600}}>Лекция · 1:24:10</div>
        <div style={{fontSize: 52, fontWeight: 800, letterSpacing: -1, marginTop: 6}}>Конспект</div>
        <div style={{display: 'flex', gap: 5, alignItems: 'center', height: 70, margin: '18px 0 26px'}}>
          {Array.from({length: 38}, (_, i) => <i key={i} style={{flex: 1, height: 10 + Math.abs(Math.sin(i * 0.9 + 1.3)) * 50, borderRadius: 4, background: i / 38 < f / done ? t.accent : '#2A2D35', display: 'block'}} />)}
        </div>
        {NOTES.map((n, i) => { const s = 8 + i * Math.max(5, Math.round((done - 14) / NOTES.length)); const o = ramp(f, s, s + 7);
          const shown = n.slice(0, Math.round(n.length * Math.min(1, Math.max(0, (f - s) / 9))));
          return <div key={i} style={{display: 'flex', gap: 16, alignItems: 'flex-start', fontSize: 31, fontWeight: i === 0 ? 800 : 600, lineHeight: 1.25, marginBottom: 20, opacity: o}}>
            <span style={{color: t.accent, fontWeight: 800}}>{i === 0 ? '#' : '•'}</span><span>{shown}</span></div>; })}
      </div>
      <div style={{position: 'absolute', left: 40, right: 40, bottom: 46, height: 92, borderRadius: rad(28), display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 14,
        background: f >= done ? t.accent : '#1C1F26', color: f >= done ? '#121212' : '#8A8F98', fontFamily: SANS, fontWeight: 800, fontSize: 32,
        scale: String(f >= done ? 1 + 0.06 * Math.max(0, 1 - (f - done) / 8) : 1)}}>
        {f >= done ? '✓ Конспект готов' : 'ИИ пишет конспект…'}
      </div>
    </Phone>
  </AbsoluteFill>;
};
