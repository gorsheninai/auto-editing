import React from 'react';
import {AbsoluteFill, Img, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';

/* Анимированная сцена-иллюстрация (kind 'illu'): фон рисуется кодом (тон стиля + «земля»),
   объекты — отдельные картинки на прозрачном фоне (sc{N}_o{k}.png), каждый со своим движением.
   Текста в картинках нет: слова дают субтитры и текстовые блоки. */
export type IlluObj = {src: string; move?: string; place?: string; size?: string};
export type Illu = {objs: IlluObj[]; tone?: 'light' | 'dark'; ground?: boolean};

const PLACE: Record<string, [number, number]> = {
  center: [540, 1100], left: [270, 1180], right: [810, 1180], top: [540, 820], bottom: [540, 1400], back: [540, 980],
};
const SIZE: Record<string, [number, number]> = {big: [780, 820], mid: [540, 600], small: [340, 380]};
const ENTER = new Set(['pop', 'rise', 'drop', 'slide-l', 'slide-r', 'grow']);

const GRAIN = `url("data:image/svg+xml;utf8,${encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="240" height="240"><filter id="n"><feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" stitchTiles="stitch"/><feColorMatrix values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 0.55 0"/></filter><rect width="100%" height="100%" filter="url(#n)"/></svg>')}")`;

const Obj: React.FC<{o: IlluObj; i: number; n: number; dur: number}> = ({o, i, n, dur}) => {
  const f = useCurrentFrame(); const {fps} = useVideoConfig(); const t = f / fps;
  const move = o.move || 'pop';
  const delay = 3 + i * 7;                                           // объекты появляются по очереди
  const e = spring({frame: f - delay, fps, config: {damping: 13, stiffness: 120, mass: 0.8}});
  const lin = interpolate(f, [delay, delay + 18], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const size = o.size || (i === 0 ? (n > 2 ? 'mid' : 'big') : n > 2 ? 'small' : 'mid');
  const [W0, H0] = SIZE[size] || SIZE.mid; const k = n > 1 && size === 'big' ? 0.8 : 1; const W = W0 * k, H = H0 * k; // несколько объектов — главный чуть меньше
  /* место по умолчанию: один — по центру, два — рядом, три-четыре — главный в центре, остальные по бокам и сверху */
  const auto = n === 1 ? 'center' : n === 2 ? (['left', 'right'] as const)[i] : (['center', 'right', 'left', 'top'] as const)[i % 4];
  const place = o.place || auto;
  let [x, y] = PLACE[place] || PLACE.center;
  let dx = 0, dy = 0, rot = 0, sc = 1, op = 1;
  /* появление */
  const enter = ENTER.has(move) ? move : 'pop';
  if (enter === 'pop') { sc = interpolate(e, [0, 1], [0.4, 1]); op = lin; }
  if (enter === 'grow') { sc = interpolate(f, [delay, delay + 40], [0.15, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: (k) => 1 - Math.pow(1 - k, 3)}); op = lin; }
  if (enter === 'rise') { dy = (1 - e) * 700 - Math.max(0, f - delay - 12) * 2.2; op = lin; }   // взлетает и продолжает подниматься
  if (enter === 'drop') { dy = -(1 - e) * 900; }
  if (enter === 'slide-l') { dx = -(1 - e) * 900; }
  if (enter === 'slide-r') { dx = (1 - e) * 900; }
  /* движение в кадре */
  const ph = i * 1.7;
  if (move === 'float' || ENTER.has(move)) dy += Math.sin(t * 1.8 + ph) * 12;
  if (move === 'swing') rot = Math.sin(t * 2.4 + ph) * 7;
  if (move === 'spin') rot = t * 45;
  if (move === 'orbit') { dx += Math.cos(t * 1.6 + ph) * 230; dy += Math.sin(t * 1.6 + ph) * 110; }
  if (move === 'pulse') sc *= 1 + Math.sin(t * 5 + ph) * 0.05;
  if (move === 'shake') dx += Math.sin(f * 1.9) * 7;
  if (move === 'tip') rot = interpolate(f, [delay + 10, Math.min(dur, delay + 50)], [0, -12], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  if (move !== 'pop' && !ENTER.has(move)) { sc *= interpolate(e, [0, 1], [0.6, 1]); op = lin; }
  const back = place === 'back' ? 0.7 : 1;
  return <Img src={staticFile(o.src)} style={{position: 'absolute', left: x - W / 2 + dx, top: y - H / 2 + dy, width: W, height: H, objectFit: 'contain',
    opacity: op, scale: String(sc * back), rotate: `${rot}deg`, transformOrigin: move === 'swing' ? '50% 0%' : '50% 60%'}} />;
};

export const IlluScene: React.FC<{illu: Illu; dur: number; colors: {bg: string; ink: string; accent: string; soft?: string; card?: string}}> = ({illu, dur, colors}) => {
  const f = useCurrentFrame();
  const dark = illu.tone === 'dark';
  const bg = dark ? colors.ink : colors.bg;
  const ground = dark ? colors.accent : colors.ink;
  const objs = illu.objs.slice(0, 4);
  /* лёгкий параллакс: фон стоит, «земля» и объекты чуть смещаются */
  const par = interpolate(f, [0, Math.max(1, dur)], [0, -24]);
  return <AbsoluteFill style={{background: bg, overflow: 'hidden'}}>
    <AbsoluteFill style={{background: dark ? 'radial-gradient(ellipse at 50% 35%, rgba(255,255,255,.10), transparent 60%)' : 'radial-gradient(ellipse at 50% 30%, rgba(255,255,255,.45), transparent 60%)'}} />
    {illu.ground ? <div style={{position: 'absolute', left: -60, right: -60, top: 1440 + par * 0.5, bottom: -40, background: ground, borderRadius: '50% 50% 0 0 / 60px 60px 0 0', opacity: dark ? 0.55 : 0.92}} /> : null}
    <AbsoluteFill style={{translate: `0 ${par}px`}}>{objs.map((o, i) => <Obj key={i} o={o} i={i} n={objs.length} dur={dur} />)}</AbsoluteFill>
    <AbsoluteFill style={{backgroundImage: GRAIN, opacity: dark ? 0.3 : 0.16, mixBlendMode: 'multiply', pointerEvents: 'none'}} />
  </AbsoluteFill>;
};
