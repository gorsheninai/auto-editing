import React from 'react';
import {AbsoluteFill, Img, OffthreadVideo, interpolate, staticFile, useCurrentFrame} from 'remotion';
import {HAND, SANS, beats, clamp, rad, ramp, spring, type BlockProps, type Theme} from './kit';

/* «Кино-подача»: блоки из разбора референсов (премонтаж kino-golova).
   SubKino — субтитры по слову + ключевое слово «стопкой»; TxtNumberTitle — номер пункта поверх кадра;
   MBurst — очередь быстрых кадров с одной подписью; CardWord — карточка-пауза; FxGrade — ч/б и кино-грейд; BgSwap — новый фон за спикером. */

const src = (s: string) => (/^(https?:|data:)/.test(s) ? s : staticFile(s.includes('/') ? s : `media/${s}`));
const isMedia = (s: string) => /\.(png|jpe?g|webp|gif|mp4|webm|mov)$/i.test(s.trim());
const isVid = (s: string) => /\.(mp4|webm|mov)$/i.test(s.trim());
const Media: React.FC<{s: string; style?: React.CSSProperties}> = ({s, style}) => isVid(s)
  ? <OffthreadVideo src={src(s)} muted style={{width: '100%', height: '100%', objectFit: 'cover', ...style}} />
  : <Img src={src(s)} style={{width: '100%', height: '100%', objectFit: 'cover', ...style}} />;

/* ---------- SubKino: одно слово за раз; во фразе с ключевым словом — «стопка» ---------- */
type Cap = {text: string; startMs: number; endMs: number; pageBreakAfter?: boolean};
const bare = (w: string) => w.toLowerCase().replace(/[^\p{L}\d]/gu, '');
export const SubKino: React.FC<{captions: Cap[]; keywords: string[]; color: string; accent: string; fontSize?: number}> = ({captions, keywords, color, fontSize = 50}) => {
  const f = useCurrentFrame(); const ms = (f / 30) * 1000;
  let i = -1;
  for (let k = 0; k < captions.length; k++) { const next = captions[k + 1]?.startMs ?? captions[k].endMs + 300; if (ms >= captions[k].startMs && ms < Math.max(next, captions[k].endMs)) { i = k; break; } }
  if (i < 0) return null;
  let a = i; while (a > 0 && !captions[a - 1].pageBreakAfter) a--;
  let b = i; while (b < captions.length - 1 && !captions[b].pageBreakAfter) b++;
  const page = captions.slice(a, b + 1); const keys = new Set(keywords.map(bare));
  const ki = page.findIndex((c) => keys.has(bare(c.text)));
  const shadow = '0 2px 18px rgba(0,0,0,.45)';
  const word = (c: Cap, big: boolean, key: number) => {
    const age = ms - c.startMs; const o = interpolate(age, [0, 50], [0, 1], clamp);
    const bigSize = Math.min(fontSize * 3.6, 940 / Math.max(1, c.text.length * 0.56));
    return <div key={key} style={{fontFamily: SANS, fontWeight: big ? 800 : 700, fontSize: big ? bigSize : fontSize * (ki >= 0 ? 0.62 : 1), lineHeight: big ? 0.86 : 1.05,
      letterSpacing: big ? -bigSize * 0.045 : -1, color, opacity: o, textShadow: shadow, textTransform: big ? 'lowercase' : (ki >= 0 ? 'uppercase' : 'lowercase')}}>{c.text}</div>;
  };
  if (ki < 0) return <div style={{display: 'flex', justifyContent: 'center'}}>{word(captions[i], false, 0)}</div>;
  const spoken = page.filter((c) => c.startMs <= ms);
  const before = spoken.filter((_, k) => k < ki); const after = spoken.filter((_, k) => k > ki); const key = spoken[ki];
  return <div style={{display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2}}>
    {before.length ? <div style={{display: 'flex', gap: 12}}>{before.map((c, k) => word(c, false, k))}</div> : null}
    {key ? word(key, true, 99) : null}
    {after.length ? <div style={{display: 'flex', gap: 12}}>{after.map((c, k) => word(c, false, 200 + k))}</div> : null}
  </div>;
};

/* ---------- TxtNumberTitle: «1:» + заголовок пункта поверх кадра ---------- */
/* note: «TxtNumberTitle: 1 | Выучи один денежный навык | фон: pic_3.png» */
export const TxtNumberTitle: React.FC<BlockProps> = ({data, theme, zoneH, dur}) => {
  const f = useCurrentFrame();
  const raw = data.items.map((i) => i.raw);
  const bg = raw.find(isMedia) || '';
  const num = (raw.find((s) => /^\d+$/.test(s.trim())) || data.items.find((i) => i.value != null)?.shown || '1').replace(/\D/g, '') || '1';
  const title = data.title || raw.find((s) => !isMedia(s) && !/^\d+$/.test(s.trim())) || data.text;
  const z = interpolate(f, [0, dur], [1.04, 1.12], clamp);
  const n = spring({frame: f - 2, fps: 30, config: {damping: 13, stiffness: 190}});
  const ws = (title || '').toUpperCase().split(/\s+/).filter(Boolean);
  return <AbsoluteFill style={{background: theme.bg, overflow: 'hidden'}}>
    {bg ? <AbsoluteFill style={{scale: String(z)}}><Media s={bg} /></AbsoluteFill> : null}
    {bg ? <AbsoluteFill style={{background: 'linear-gradient(180deg, rgba(0,0,0,.15), rgba(0,0,0,.45))'}} /> : null}
    <div style={{position: 'absolute', left: 80, right: 80, top: zoneH * 0.36, display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center'}}>
      <div style={{fontFamily: SANS, fontWeight: 800, fontSize: 230, lineHeight: 0.9, color: theme.accent, scale: String(0.6 + 0.4 * n), opacity: n, textShadow: '0 6px 30px rgba(0,0,0,.35)'}}>{num}:</div>
      <div style={{display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '0 18px', marginTop: 18, maxWidth: 880}}>
        {ws.map((w, i) => { const o = ramp(f, 8 + i * 3, 14 + i * 3);
          return <span key={i} style={{fontFamily: SANS, fontWeight: 800, fontSize: 84, lineHeight: 1.02, letterSpacing: -2, color: theme.ink, opacity: o, translate: `0 ${(1 - o) * 26}px`, textShadow: '0 4px 24px rgba(0,0,0,.4)'}}>{w}</span>; })}
      </div>
    </div>
  </AbsoluteFill>;
};

/* ---------- MBurst: очередь кадров по 0,3–0,6 с с одной подписью ---------- */
/* note: «MBurst: pic_1.png | pic_2.png | pic_3.png | заголовок: $10 000 | текст: на счету | чб» */
export const MBurst: React.FC<BlockProps> = ({data, theme, dur, marks}) => {
  const f = useCurrentFrame();
  const imgs = data.items.map((i) => i.raw).filter(isMedia);
  const bw = data.items.some((i) => /^(чб|ч\/б|bw)$/i.test(i.raw.trim()));
  const n = Math.max(1, imgs.length);
  const at = marks && marks.length >= n ? marks.slice(0, n) : Array.from({length: n}, (_, i) => Math.round((i * dur) / n));
  let k = 0; for (let i = 0; i < n; i++) if (f >= at[i]) k = i;
  const since = f - at[k];
  const pop = spring({frame: f - 1, fps: 30, config: {damping: 14, stiffness: 220}});
  const cap = data.title || data.text;
  return <AbsoluteFill style={{background: '#000', overflow: 'hidden'}}>
    {imgs.length ? <AbsoluteFill style={{scale: String(1.06 + since * 0.004), rotate: `${(k % 2 ? -1 : 1) * 1.2}deg`, filter: bw ? 'grayscale(1) contrast(1.15) brightness(.92)' : 'none'}}><Media s={imgs[k]} /></AbsoluteFill> : null}
    <AbsoluteFill style={{background: 'radial-gradient(ellipse at center, rgba(0,0,0,.05) 30%, rgba(0,0,0,.45))'}} />
    {cap ? <div style={{position: 'absolute', left: 0, right: 0, top: '45%', translate: '0 -50%', display: 'flex', flexDirection: 'column', alignItems: 'center'}}>
      <div style={{fontFamily: SANS, fontWeight: 800, fontSize: 150, letterSpacing: -6, color: theme.ink, scale: String(0.85 + 0.15 * pop), textShadow: '0 6px 30px rgba(0,0,0,.5)'}}>{cap}</div>
      {data.title && data.text ? <div style={{fontFamily: SANS, fontWeight: 700, fontSize: 34, letterSpacing: 2, textTransform: 'uppercase', color: theme.ink, marginTop: 4, opacity: ramp(f, 6, 12)}}>{data.text}</div> : null}
    </div> : null}
  </AbsoluteFill>;
};

/* ---------- CardWord: карточка-пауза — одно слово на белом или чёрном ---------- */
/* note: «CardWord: текст: had | белая» */
export const CardWord: React.FC<BlockProps> = ({data, theme}) => {
  const f = useCurrentFrame();
  const dark = data.items.some((i) => /^(чёрная|черная|тёмная|темная|black|dark)$/i.test(i.raw.trim()));
  const w = data.text || data.title || data.items.find((i) => !/^(белая|чёрная|черная|тёмная|темная|black|white|dark)$/i.test(i.raw.trim()))?.raw || '';
  return <AbsoluteFill style={{background: dark ? '#050505' : '#F1F0EE', display: 'grid', placeItems: 'center'}}>
    <div style={{fontFamily: SANS, fontWeight: 800, fontSize: dark ? 46 : 120, letterSpacing: dark ? 0 : -4, color: dark ? '#F2EDE4' : '#111', opacity: interpolate(f, [0, 2], [0, 1], clamp)}}>{w}</div>
  </AbsoluteFill>;
};

/* ---------- FxGrade: грейд на сегмент — ч/б или кино (row.fx = 'FxGrade', fxText = 'чб' | 'кино') ---------- */
export const FxGrade: React.FC<{mode?: string; children: React.ReactNode}> = ({mode, children}) => {
  const bw = !mode || /ч\/?б|bw|black/i.test(mode);
  return <AbsoluteFill>
    <AbsoluteFill style={{filter: bw ? 'grayscale(1) contrast(1.18) brightness(.95)' : 'saturate(.85) contrast(1.12) sepia(.12) hue-rotate(-8deg)'}}>{children}</AbsoluteFill>
    {!bw ? <AbsoluteFill style={{background: 'linear-gradient(180deg, rgba(0,60,70,.18), rgba(255,140,60,.10))', mixBlendMode: 'soft-light'}} /> : null}
    <AbsoluteFill style={{background: 'radial-gradient(ellipse at center, transparent 55%, rgba(0,0,0,.35))'}} />
  </AbsoluteFill>;
};

/* ---------- BgSwap: спикер вырезкой поверх нового фона (row.fx = 'BgSwap', fxText = файл или «закат») ---------- */
const Sunset: React.FC = () => {
  const f = useCurrentFrame();
  return <AbsoluteFill style={{background: 'linear-gradient(180deg, #2C3E63 0%, #8C5A86 30%, #E8836A 58%, #F6C28B 78%, #F9E3B8 100%)'}}>
    {[0, 1, 2, 3].map((i) => <div key={i} style={{position: 'absolute', left: `${-20 + i * 30 + ((f * (0.15 + i * 0.05)) % 40)}%`, top: `${12 + i * 13}%`, width: 900, height: 220, borderRadius: '50%',
      background: 'radial-gradient(ellipse, rgba(255,214,190,.55), rgba(255,214,190,0) 70%)', filter: 'blur(18px)'}} />)}
  </AbsoluteFill>;
};
export const BgSwap: React.FC<{from: number; cut: string; bg?: string}> = ({from, cut, bg}) => <AbsoluteFill>
  {bg && isMedia(bg) ? <Media s={bg} /> : <Sunset />}
  <OffthreadVideo src={staticFile(cut)} transparent muted startFrom={from} style={{width: '100%', height: '100%', objectFit: 'cover'}} />
</AbsoluteFill>;

export const KINO_SCENES = {TxtNumberTitle, MBurst, CardWord};
export const KINO_INFO: Record<string, {name: string; summary: string}> = {
  SubKino: {name: 'Слово за словом + ключевое стопкой', summary: 'Субтитры по одному слову; во фразе с ключевым словом служебные слова мелко сверху и снизу, ключевое — крупно'},
  TxtNumberTitle: {name: 'Номер пункта поверх кадра', summary: '«1:» и заголовок пункта крупно по центру поверх B-roll или картинки'},
  MBurst: {name: 'Очередь кадров', summary: '3–6 картинок по 0,3–0,6 с с одной крупной подписью сверху, можно в ч/б'},
  CardWord: {name: 'Карточка-пауза', summary: 'Белый экран с одним чёрным словом или чёрный с маленьким белым'},
  FxGrade: {name: 'Ч/б и кино-грейд', summary: 'Сегмент в ч/б или в тёплом кино-грейде с виньеткой'},
  BgSwap: {name: 'Новый фон за спикером', summary: 'Спикер вырезкой поверх неба-заката или своей картинки'},
};
export type {Theme};
void HAND; void beats; void rad;
