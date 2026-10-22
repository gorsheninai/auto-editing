import React from 'react';
import {AbsoluteFill, interpolate, random, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {BlockProps, HAND, SANS, SERIF, beats, clamp, pop, ramp, rad, shd} from './kit';
import {CheckList} from '../remocn/check-list';
import {SpeedLines} from '../remocn/speed-lines';
import {Reel} from '../remocn/reel';

/* Блоки remocn рисуют на весь кадр 1080×1920. В режиме B зона сцены ниже (zoneH),
   поэтому кадр сдвигается так, чтобы его центр совпал с центром зоны. */
const Frame: React.FC<{zoneH: number; children: React.ReactNode}> = ({zoneH, children}) =>
  <div style={{position: 'absolute', left: 0, top: zoneH / 2 - 960, width: 1080, height: 1920}}>{children}</div>;
const BigWord: React.FC<{text: string; color: string; accent: string; k: number; size?: number}> = ({text, color, accent, k, size}) => {
  const fs = size || (text.length > 14 ? 110 : text.length > 8 ? 140 : 180);
  return <div style={{fontFamily: SANS, fontWeight: 800, fontSize: fs, letterSpacing: -5, lineHeight: 0.95, color, textAlign: 'center', padding: '0 60px', scale: String(k), textWrap: 'balance' as never}}>
    {text.split(' ').map((w, i, a) => i === a.length - 1 && a.length > 1 ? <span key={i} style={{fontFamily: SERIF, fontStyle: 'italic', fontWeight: 600, color: accent}}>{w}</span> : <span key={i}>{w} </span>)}</div>;
};
const wordOf = (p: BlockProps, def: string) => (p.data.text || p.data.title || p.data.items.map((i) => i.label).join(' ') || def).trim();

/* MChecklist — рукописный список сам себя пишет, потом ставит галочки и зачёркивает (remocn check-list) */
export const MChecklist: React.FC<BlockProps> = (p) => {
  const T = p.theme;
  const items = p.data.items.length ? p.data.items.map((i) => i.raw) : ['найти свою тему', 'снять 30 роликов', 'не сдаться'];
  return <AbsoluteFill style={{height: p.zoneH, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 30}}>
    {p.data.title ? <div style={{fontFamily: HAND, fontWeight: 700, fontSize: 96, color: T.accent, rotate: '-3deg'}}>{p.data.title}</div> : null}
    <div style={{width: 880}}><CheckList items={items.slice(0, 5)} width={880} fontSize={p.full ? 92 : 80} color={T.ink} boxColor={T.ink} tickColor={T.accent2} weight={700} delay={6} /></div>
  </AbsoluteFill>;
};

/* MHub — центр и спутники по эллипсу, линии рисуются, по ним бегут импульсы */
export const MHub: React.FC<BlockProps> = (p) => {
  const f = useCurrentFrame(); const {fps} = useVideoConfig(); const T = p.theme;
  const center = p.data.title || p.data.text || 'ты';
  const sats = (p.data.items.length ? p.data.items.map((i) => i.label) : ['клиенты', 'контент', 'деньги', 'команда', 'идеи']).slice(0, 7);
  const cx = 540, cy = p.zoneH / 2, rx = 350, ry = Math.min(p.zoneH * 0.3, 560);
  const at = beats(sats.length, p.dur, p.marks, 14);
  const ck = pop(f, fps, 2, 11);
  return <AbsoluteFill style={{height: p.zoneH}}>
    <svg width={1080} height={p.zoneH} style={{position: 'absolute', inset: 0}}>
      {sats.map((_, i) => {
        const a = -Math.PI / 2 + i / sats.length * Math.PI * 2; const x = cx + rx * Math.cos(a), y = cy + ry * Math.sin(a);
        const k = ramp(f, at[i] - 4, at[i] + 8);
        const pulse = ((f - at[i] - 10) / 26 + i * 0.37) % 1;
        return <g key={i}>
          <line x1={cx} y1={cy} x2={cx + (x - cx) * k} y2={cy + (y - cy) * k} stroke={T.line} strokeWidth={6} strokeLinecap="round" />
          {f > at[i] + 10 ? <circle cx={cx + (x - cx) * pulse} cy={cy + (y - cy) * pulse} r={11} fill={i % 2 ? T.accent2 : T.accent} opacity={Math.sin(pulse * Math.PI)} /> : null}
        </g>;
      })}
    </svg>
    {sats.map((s, i) => {
      const a = -Math.PI / 2 + i / sats.length * Math.PI * 2; const k = pop(f, fps, at[i], 11);
      return <div key={i} style={{position: 'absolute', left: cx + rx * Math.cos(a), top: cy + ry * Math.sin(a), translate: '-50% -50%', scale: String(k), padding: '18px 30px', borderRadius: rad(999), background: T.card,
        border: `5px solid ${i % 2 ? T.accent2 : T.accent}`, fontFamily: SANS, fontWeight: 700, fontSize: p.full ? 52 : 42, color: T.ink, whiteSpace: 'nowrap', boxShadow: shd('0 10px 30px rgba(0,0,0,.08)')}}>{s}</div>;
    })}
    <div style={{position: 'absolute', left: cx, top: cy, translate: '-50% -50%', width: 270, height: 270, borderRadius: '50%', background: T.accent, display: 'grid', placeItems: 'center', scale: String(ck),
      boxShadow: shd(`0 0 0 ${18 + Math.sin(f / 6) * 8}px ${T.accent}33`), fontFamily: SERIF, fontStyle: 'italic', fontWeight: 600, fontSize: center.length > 8 ? 52 : 74, color: '#fff', textAlign: 'center', lineHeight: 1}}>{center}</div>
  </AbsoluteFill>;
};

/* MFlow — поток частиц течёт из «откуда» в «куда»; «MFlow: деньги — реклама» */
export const MFlow: React.FC<BlockProps> = (p) => {
  const f = useCurrentFrame(); const {fps} = useVideoConfig(); const T = p.theme;
  const it = p.data.items[0]; const from = it ? it.label : 'бюджет'; const to = it ? it.shown : 'реклама';
  const ax = 230, ay = p.zoneH * 0.72, bx = 850, by = p.zoneH * 0.3, mx = 540 + 260, my = p.zoneH * 0.75;
  const N = 150; const start = 14;
  const ka = pop(f, fps, 2, 12), kb = pop(f, fps, 8, 12);
  return <AbsoluteFill style={{height: p.zoneH}}>
    {p.data.title ? <div style={{position: 'absolute', top: p.zoneH * 0.08, width: '100%', textAlign: 'center', fontFamily: SANS, fontWeight: 700, fontSize: 60, color: T.ink, letterSpacing: -2, opacity: ramp(f, 0, 12)}}>{p.data.title}</div> : null}
    <svg width={1080} height={p.zoneH} style={{position: 'absolute', inset: 0}}>
      <path d={`M ${ax} ${ay} Q ${mx} ${my} ${bx} ${by}`} stroke={T.line} strokeWidth={70} fill="none" strokeLinecap="round" opacity={ramp(f, 6, 18)} />
      {Array.from({length: N}, (_, i) => {
        const life = 34 + random(`l${i}`) * 20; const born = start + random(`b${i}`) * Math.max(10, p.dur - life - start);
        const t = (f - born) / life; if (t < 0 || t > 1) return null;
        const e = t * t * (3 - 2 * t); const q = 1 - e;
        const x = q * q * ax + 2 * q * e * mx + e * e * bx + (random(`x${i}`) - 0.5) * 50;
        const y = q * q * ay + 2 * q * e * my + e * e * by + (random(`y${i}`) - 0.5) * 50;
        const r = 12 + random(`r${i}`) * 16;
        return <circle key={i} cx={x} cy={y} r={r * Math.sin(t * Math.PI) + 2} fill={i % 3 ? T.accent : T.accent2} opacity={0.9} />;
      })}
    </svg>
    {[[ax, ay, from, ka, T.accent2], [bx, by, to, kb, T.accent]].map(([x, y, s, k, c], i) =>
      <div key={i} style={{position: 'absolute', left: x as number, top: y as number, translate: '-50% -50%', scale: String(k), padding: '24px 40px', borderRadius: rad(34), background: c as string, color: '#fff',
        fontFamily: SANS, fontWeight: 800, fontSize: 54, letterSpacing: -1.5, whiteSpace: 'nowrap', boxShadow: shd(`0 16px 40px ${c}55`)}}>{s as string}</div>)}
  </AbsoluteFill>;
};



/* MSpeed — плашка со словом влетает с линиями скорости и тормозит с отскоком (remocn speed-lines) */
export const MSpeed: React.FC<BlockProps> = (p) => {
  const T = p.theme; const text = wordOf(p, 'за 5 минут');
  return <AbsoluteFill style={{height: p.zoneH}}>
    <Frame zoneH={p.zoneH}>
      <SpeedLines mode="trail" from={{x: -0.4, y: 0.5}} x={0.5} y={0.5} count={14} weight={3} spread={80} duration={16} bounce={0.55} color={T.accent} delay={6}>
        <div style={{padding: '34px 60px', borderRadius: rad(48), background: T.accent2, color: '#fff', fontFamily: SANS, fontWeight: 800, fontSize: text.length > 12 ? 84 : 110, letterSpacing: -3, whiteSpace: 'nowrap', boxShadow: shd(`0 24px 60px ${T.accent2}66`)}}>{text}</div>
      </SpeedLines>
    </Frame>
  </AbsoluteFill>;
};



/* MGallery — картинки (pic_N, свои вставки) распускаются из центра одна за другой (remocn reel).
   «MGallery: pic_3 | pic_4 | pic_5» — файлы из public/media */
export const MGallery: React.FC<BlockProps & {images?: string[]}> = (p) => {
  const T = p.theme;
  const imgs = (p.images && p.images.length ? p.images : p.data.items.map((i) => i.raw)).map((s) => (/^(https?:|data:)/.test(s) ? s : staticFile(s.includes('/') ? s : `media/${s}`)));
  const w = 760, h = Math.min(p.zoneH * 0.78, 1000);
  return <AbsoluteFill style={{height: p.zoneH}}>
    <Frame zoneH={p.zoneH}><Reel images={imgs.slice(0, 6)} width={w} height={h} radius={44} step={Math.max(14, Math.floor(p.dur / Math.max(1, imgs.length)))} background={T.bg} /></Frame>
  </AbsoluteFill>;
};
