import React from 'react';
import {AbsoluteFill, interpolate, random, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {BlockProps, HAND, SANS, SERIF, beats, clamp, pop, ramp} from './kit';
import {CheckList} from '../remocn/check-list';
import {TrimBurst} from '../remocn/trim-burst';
import {SpeedLines} from '../remocn/speed-lines';
import {GooeyMorph} from '../remocn/gooey-morph';
import {BauhausBuild} from '../remocn/bauhaus-build';
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
      return <div key={i} style={{position: 'absolute', left: cx + rx * Math.cos(a), top: cy + ry * Math.sin(a), translate: '-50% -50%', scale: String(k), padding: '18px 30px', borderRadius: 999, background: T.card,
        border: `5px solid ${i % 2 ? T.accent2 : T.accent}`, fontFamily: SANS, fontWeight: 700, fontSize: p.full ? 52 : 42, color: T.ink, whiteSpace: 'nowrap', boxShadow: '0 10px 30px rgba(0,0,0,.08)'}}>{s}</div>;
    })}
    <div style={{position: 'absolute', left: cx, top: cy, translate: '-50% -50%', width: 270, height: 270, borderRadius: '50%', background: T.accent, display: 'grid', placeItems: 'center', scale: String(ck),
      boxShadow: `0 0 0 ${18 + Math.sin(f / 6) * 8}px ${T.accent}33`, fontFamily: SERIF, fontStyle: 'italic', fontWeight: 600, fontSize: center.length > 8 ? 52 : 74, color: '#fff', textAlign: 'center', lineHeight: 1}}>{center}</div>
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
      <div key={i} style={{position: 'absolute', left: x as number, top: y as number, translate: '-50% -50%', scale: String(k), padding: '24px 40px', borderRadius: 34, background: c as string, color: '#fff',
        fontFamily: SANS, fontWeight: 800, fontSize: 54, letterSpacing: -1.5, whiteSpace: 'nowrap', boxShadow: `0 16px 40px ${c}55`}}>{s as string}</div>)}
  </AbsoluteFill>;
};

/* MInk — чернильная клякса растекается рваным краем и открывает слово */
export const MInk: React.FC<BlockProps> = (p) => {
  const f = useCurrentFrame(); const T = p.theme;
  const text = wordOf(p, 'идея');
  const g = interpolate(f, [4, 30], [0, 1], {...clamp, easing: (t) => 1 - Math.pow(1 - t, 4)});
  const R = (p.full ? 620 : 500) * g; const cy = p.zoneH / 2;
  const blobs = Array.from({length: 9}, (_, i) => ({a: i / 9 * Math.PI * 2 + random(`a${i}`), d: (0.35 + random(`d${i}`) * 0.4) * R, r: (0.25 + random(`s${i}`) * 0.25) * R}));
  const drops = Array.from({length: 14}, (_, i) => ({a: random(`da${i}`) * Math.PI * 2, d: (0.75 + random(`dd${i}`) * 0.5) * R, r: 8 + random(`dr${i}`) * 26}));
  const tk = ramp(f, 22, 36);
  return <AbsoluteFill style={{height: p.zoneH, overflow: 'hidden'}}>
    <svg width={1080} height={p.zoneH} style={{position: 'absolute', inset: 0}}>
      <defs><filter id="ink"><feTurbulence type="fractalNoise" baseFrequency="0.012" numOctaves={3} seed={4} /><feDisplacementMap in="SourceGraphic" scale={70} /></filter></defs>
      <g filter="url(#ink)" fill={T.accent}>
        <circle cx={540} cy={cy} r={R * 0.55} />
        {blobs.map((b, i) => <circle key={i} cx={540 + Math.cos(b.a) * b.d} cy={cy + Math.sin(b.a) * b.d} r={b.r} />)}
        {drops.map((d, i) => <circle key={`d${i}`} cx={540 + Math.cos(d.a) * d.d} cy={cy + Math.sin(d.a) * d.d} r={d.r * g} />)}
      </g>
    </svg>
    <AbsoluteFill style={{height: p.zoneH, display: 'grid', placeItems: 'center', opacity: tk, translate: `0 ${(1 - tk) * 40}px`}}>
      <BigWord text={text} color="#fff" accent={T.dark ? T.ink : '#FFE7A8'} k={0.9 + 0.1 * tk} />
    </AbsoluteFill>
  </AbsoluteFill>;
};

/* MBurst — слово выпрыгивает, вокруг вспышка из штрихов (remocn trim-burst) */
export const MBurst: React.FC<BlockProps> = (p) => {
  const f = useCurrentFrame(); const {fps} = useVideoConfig(); const T = p.theme;
  const text = wordOf(p, 'бесплатно');
  const k = pop(f, fps, 4, 9);
  return <AbsoluteFill style={{height: p.zoneH}}>
    <Frame zoneH={p.zoneH}>
      <TrimBurst x={0.5} y={0.5} count={14} innerRadius={120} reach={70} strokeLength={32} weight={4} color={T.accent2} delay={6} seed={3} />
      <TrimBurst x={0.5} y={0.5} count={10} innerRadius={150} reach={50} strokeLength={18} weight={3} color={T.accent} delay={10} seed={8} rotation={18} dots />
    </Frame>
    <AbsoluteFill style={{height: p.zoneH, display: 'grid', placeItems: 'center'}}><BigWord text={text} color={T.ink} accent={T.accent} k={k} /></AbsoluteFill>
  </AbsoluteFill>;
};

/* MSpeed — плашка со словом влетает с линиями скорости и тормозит с отскоком (remocn speed-lines) */
export const MSpeed: React.FC<BlockProps> = (p) => {
  const T = p.theme; const text = wordOf(p, 'за 5 минут');
  return <AbsoluteFill style={{height: p.zoneH}}>
    <Frame zoneH={p.zoneH}>
      <SpeedLines mode="trail" from={{x: -0.4, y: 0.5}} x={0.5} y={0.5} count={14} weight={3} spread={80} duration={16} bounce={0.55} color={T.accent} delay={6}>
        <div style={{padding: '34px 60px', borderRadius: 48, background: T.accent2, color: '#fff', fontFamily: SANS, fontWeight: 800, fontSize: text.length > 12 ? 84 : 110, letterSpacing: -3, whiteSpace: 'nowrap', boxShadow: `0 24px 60px ${T.accent2}66`}}>{text}</div>
      </SpeedLines>
    </Frame>
  </AbsoluteFill>;
};

/* MGooey — полоски падают как в тетрисе и слипаются в слово (remocn gooey-morph). Лучше 1–2 коротких слова */
export const MGooey: React.FC<BlockProps> = (p) => {
  const T = p.theme; const word = wordOf(p, 'ХУК').toUpperCase().slice(0, 9);
  const W = 1080, H = 1920, n = 4, bw = 150, bh = 128, gap = 18;
  const x0 = W / 2 - (n * bw + (n - 1) * gap) / 2;
  const rest: [number, number][] = Array.from({length: n}, (_, i) => [x0 + i * (bw + gap), H / 2 - bh / 2]);
  const startP: [number, number][] = [[620, 1500], [120, 1560], [500, 300], [960, 360]];
  const fs = Math.min(230, 900 / Math.max(3, word.length) * 1.55);
  return <AbsoluteFill style={{height: p.zoneH}}>
    <Frame zoneH={p.zoneH}>
      <GooeyMorph width={W} height={H} barWidth={bw} barHeight={bh} barStartPositions={startP} barRestPositions={rest} word={word} fontFamily="InterTight" fontSize={fs} wordCenterX={W / 2} wordBaselineY={H / 2 + fs * 0.35} fill={T.accent} />
    </Frame>
  </AbsoluteFill>;
};

/* MBauhaus — круги, дуги и квадраты кувыркаются и собираются в композицию; сверху может стоять слово */
export const MBauhaus: React.FC<BlockProps> = (p) => {
  const f = useCurrentFrame(); const T = p.theme; const text = p.data.text || p.data.title;
  return <AbsoluteFill style={{height: p.zoneH}}>
    <Frame zoneH={p.zoneH}><BauhausBuild scale={p.full ? 1.15 : 0.95} seed={7} inkColor={T.ink} accentColor={T.accent2} secondaryColor={T.accent} tertiaryColor="#F2B53B" /></Frame>
    {text ? <div style={{position: 'absolute', bottom: p.zoneH * 0.1, width: '100%', opacity: ramp(f, p.dur * 0.55, p.dur * 0.55 + 12)}}><BigWord text={text} color={T.ink} accent={T.accent} k={1} size={96} /></div> : null}
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
