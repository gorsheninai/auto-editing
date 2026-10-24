import React from 'react';
import {AbsoluteFill, Img, OffthreadVideo, interpolate, staticFile, useCurrentFrame} from 'remotion';
import {HAND, SANS, beats, clamp, rad, ramp, spring, type BlockProps, type Theme} from './kit';
import {STY} from './style';

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
  const isTone = (x: string) => /^(белая|чёрная|черная|тёмная|темная|black|white|dark)$/i.test(x.trim());
  const dark = data.items.some((i) => /^(чёрная|черная|тёмная|темная|black|dark)$/i.test(i.raw.trim()));
  const parts = data.items.map((i) => i.raw).filter((x) => !isTone(x));
  /* «CardWord: связка | слово» — мелкий курсив сверху и жирное слово снизу; иначе одно слово */
  const lead = parts.length >= 2 ? parts[0] : '';
  const w = parts.length >= 2 ? parts.slice(1).join(' ') : data.text || data.title || parts[0] || '';
  const P = STY.passport.colors || {};
  const bg = dark ? (P.ink || '#050505') : (P.card || P.bg || '#F1F0EE'), ink = dark ? (P.card || P.bg || '#F2EDE4') : (P.ink || '#111');
  const longest = Math.max(1, ...w.split(/\s+/).map((x) => x.length));
  const big = Math.min(lead ? 132 : 120, 940 / (longest * 0.6));   // слово не вылезает за край
  const op = interpolate(f, [0, 2], [0, 1], clamp);
  return <AbsoluteFill style={{background: bg, display: 'grid', placeItems: 'center', padding: '0 70px'}}>
    <div style={{textAlign: 'center', opacity: op}}>
      {lead ? <div style={{fontFamily: SANS, fontStyle: 'italic', fontWeight: 300, fontSize: 64, color: ink, opacity: 0.75, marginBottom: 10}}>{lead}</div> : null}
      <div style={{fontFamily: SANS, fontWeight: 800, fontSize: dark && !lead ? 46 : big, lineHeight: 1.02, letterSpacing: dark && !lead ? 0 : -3, color: ink}}>{w}</div>
    </div>
  </AbsoluteFill>;
};

/* ---------- FxGrade: грейд на сегмент — ч/б или кино (row.fx = 'FxGrade', fxText = 'чб' | 'кино') ---------- */
export const FxGrade: React.FC<{mode?: string; children: React.ReactNode}> = ({mode, children}) => {
  const bw = !mode || /ч\/?б|bw|black/i.test(mode);
  if (/кино|film/i.test(mode || '')) return <AbsoluteFill>
    <AbsoluteFill style={{filter: 'saturate(.82) contrast(1.14) brightness(.82) sepia(.1)'}}>{children}</AbsoluteFill>
    <AbsoluteFill style={{background: 'linear-gradient(180deg, rgba(20,70,80,.28), rgba(30,40,40,.1) 45%, rgba(255,150,70,.14))', mixBlendMode: 'soft-light'}} />
    <AbsoluteFill style={{background: 'radial-gradient(ellipse at 50% 40%, transparent 45%, rgba(0,0,0,.5))'}} />
  </AbsoluteFill>;
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
  <AbsoluteFill><OffthreadVideo src={staticFile(cut)} transparent muted startFrom={from} style={{width: '100%', height: '100%', objectFit: 'cover'}} /></AbsoluteFill>
</AbsoluteFill>;

/* ---------- HookTitle: заголовок-хук из размытия; под ним справа мелким капсом — текущее слово речи ---------- */
export const HookTitle: React.FC<{top?: string; big: string[]; words: {w: string; f: number}[]; dur: number; color?: string}> = ({top, big, words, dur, color = '#EFE7DA'}) => {
  const f = useCurrentFrame();
  const inn = interpolate(f, [1, 9], [0, 1], clamp), out = interpolate(f, [dur - 6, dur - 1], [0, 1], clamp);
  const blur = (1 - inn) * 26 + out * 22, op = Math.min(1, inn * 1.4) * (1 - out);
  let cur = ''; for (const w of words) if (f >= w.f) cur = w.w.replace(/[.,:;!?—…«»]/g, '');
  return <div style={{position: 'absolute', left: 150, top: 820, filter: `blur(${blur}px)`, opacity: op, color, fontFamily: SANS, textShadow: '0 4px 30px rgba(0,0,0,.35)'}}>
    {top ? <div style={{fontWeight: 800, fontSize: 34, letterSpacing: 1, textTransform: 'uppercase', marginLeft: 6, marginBottom: 2}}>{top}</div> : null}
    {big.map((l, i) => <div key={i} style={{fontWeight: 800, fontSize: 170, lineHeight: 0.8, letterSpacing: -9, textTransform: 'lowercase', marginLeft: i * 34}}>{l}</div>)}
    <div style={{textAlign: 'right', fontWeight: 800, fontSize: 30, letterSpacing: 1, textTransform: 'uppercase', marginTop: 14}}>{cur}</div>
  </div>;
};

/* ---------- StackBuild: стопка слов поверх кадра, как «it was / SLOW / as / F*CK»: каждое слово проявляется из размытия в момент произнесения ---------- */
export const StackBuild: React.FC<{items: {w: string; f: number; big: boolean}[]; color?: string; left?: number; top?: number}> = ({items, color = '#EFE7DA', left = 0, top = 380}) => {
  const f = useCurrentFrame();
  return <div style={{position: 'absolute', left: left || undefined, right: left ? undefined : 70, width: 520, top, display: 'flex', flexDirection: 'column', alignItems: 'center', color, fontFamily: SANS, textShadow: '0 4px 26px rgba(0,0,0,.35)'}}>
    {items.map((it, i) => { const k = interpolate(f, [it.f, it.f + 5], [0, 1], clamp); if (f < it.f) return null;
      const txt = it.w.replace(/[.,:;!?—…«»]/g, '');
      return <div key={i} style={{fontWeight: 800, fontSize: it.big ? Math.min(150, 500 / Math.max(1, txt.length * 0.56)) : 36, lineHeight: it.big ? 0.86 : 1.1, letterSpacing: it.big ? -6 : 0,
        textTransform: it.big ? 'lowercase' : 'lowercase', filter: `blur(${(1 - k) * 14}px)`, opacity: Math.min(1, k * 1.6), scale: String(1.08 - 0.08 * k)}}>{txt}</div>; })}
  </div>;
};

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
