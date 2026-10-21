import React from 'react';
import {AbsoluteFill, Easing, Freeze, Img, OffthreadVideo, interpolate, random, spring, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import type {TransitionPresentation, TransitionPresentationComponentProps} from '@remotion/transitions';
import {BlockProps, SANS, SERIF, Theme, clamp, fmtNum, pop, ramp} from './kit';
import {Confetti} from '../remocn/confetti';

/* Приёмы из video-shotcraft (Apache-2.0, github.com/Vincentwei1021/video-shotcraft, он же getshotpack.com),
   переписаны для студии: вертикаль 1080×1920, кириллица, данные из раскадровки, цвета стиля. */

const ease = Easing.bezier(0.16, 1, 0.3, 1);
const words = (p: BlockProps, def: string) => (p.data.text || p.data.title || p.data.items.map((i) => i.raw).join(' ') || def).trim();
const src = (s: string) => (/^(https?:|data:|\/)/.test(s) ? s : staticFile(s.includes('/') ? s : `media/${s}`));

/* ================= Эффекты на сегмент ================= */

/* FxFlash — три фотовспышки: белый удар, на каждой кадр скачком приближается (как папарацци) */
export const Flash: React.FC<{at?: number; children: React.ReactNode}> = ({at = 4, children}) => {
  const f = useCurrentFrame(); const hits = [at, at + 12, at + 22];
  let scale = 1, white = 0;
  hits.forEach((h, i) => { if (f >= h) scale = [1.12, 1.28, 1.5][i]; const d = f - h; if (d >= 0 && d < 6) white = Math.max(white, 1 - d / 6); });
  const settle = interpolate(f - hits.filter((h) => f >= h).slice(-1)[0], [0, 6], [1.04, 1], clamp);
  return <AbsoluteFill style={{overflow: 'hidden'}}>
    <AbsoluteFill style={{scale: String(scale * (f >= at ? settle : 1)), transformOrigin: '50% 40%', filter: white > 0.3 ? `brightness(${1 + white})` : undefined}}>{children}</AbsoluteFill>
    <AbsoluteFill style={{background: '#fff', opacity: white * 0.9}} />
  </AbsoluteFill>;
};

/* FxFreeze — стоп-кадр: картинка замирает, уходит в ч/б, рамка-уголки и подпись */
export const FreezeAt: React.FC<{at?: number; text?: string; theme: Theme; children: React.ReactNode}> = ({at = 14, text, theme, children}) => {
  const f = useCurrentFrame(); const {fps} = useVideoConfig(); const on = f >= at; const k = ramp(f, at, at + 6);
  const lab = spring({frame: f - at - 4, fps, config: {damping: 12, stiffness: 170}});
  const arm = 70, pad = 90, br = (x: number, y: number, sx: number, sy: number) => <path key={`${x}${y}`} d={`M ${x} ${y + sy * arm} L ${x} ${y} L ${x + sx * arm} ${y}`} stroke="#fff" strokeWidth={8} fill="none" />;
  return <AbsoluteFill>
    <Freeze frame={at} active={on}><AbsoluteFill style={{filter: `grayscale(${k}) contrast(${1 + 0.15 * k})`, scale: String(1 + 0.04 * k)}}>{children}</AbsoluteFill></Freeze>
    {on ? <AbsoluteFill style={{background: '#fff', opacity: Math.max(0, 1 - (f - at) / 4) * 0.7}} /> : null}
    {on ? <svg width={1080} height={1920} style={{position: 'absolute', inset: 0, opacity: k, scale: String(1.06 - 0.06 * k)}}>
      {br(pad, pad + 120, 1, 1)}{br(1080 - pad, pad + 120, -1, 1)}{br(pad, 1920 - pad - 200, 1, -1)}{br(1080 - pad, 1920 - pad - 200, -1, -1)}</svg> : null}
    {on && text ? <div style={{position: 'absolute', left: 0, right: 0, top: 260, textAlign: 'center'}}><span style={{display: 'inline-block', scale: String(lab), padding: '18px 36px', borderRadius: 18, background: theme.accent2, color: '#fff',
      fontFamily: SANS, fontWeight: 800, fontSize: 64, letterSpacing: -1.5}}>{text}</span></div> : null}
  </AbsoluteFill>;
};

/* ================= Пометки поверх кадра ================= */
type Ov = {x?: number; y?: number; w?: number; h?: number; text?: string; at?: number};

/* Spotlight — кадр темнеет, луч света ведётся и останавливается на точке */
export const Spotlight: React.FC<{ov: Ov}> = ({ov}) => {
  const f = useCurrentFrame(); const at = ov.at ?? 4; const x = ov.x ?? 540, y = ov.y ?? 900, r = (ov.w ?? 420) / 2;
  const t = interpolate(f, [at, at + 26], [0, 1], {...clamp, easing: ease}); const dark = ramp(f, at, at + 8);
  const cx = interpolate(t, [0, 1], [x < 540 ? 980 : 100, x]), cy = interpolate(t, [0, 1], [y - 500, y]);
  return <AbsoluteFill style={{pointerEvents: 'none', background: `radial-gradient(circle ${r * (1.6 - 0.6 * t)}px at ${cx}px ${cy}px, rgba(0,0,0,0) 0%, rgba(0,0,0,0) 70%, rgba(8,8,12,${0.72 * dark}) 100%)`}} />;
};

/* ScanFocus — сканирующая линия проходит сверху вниз, на области защёлкиваются уголки и подпись */
export const ScanFocus: React.FC<{ov: Ov; theme: Theme}> = ({ov, theme}) => {
  const f = useCurrentFrame(); const {fps} = useVideoConfig(); const at = ov.at ?? 4;
  const x = ov.x ?? 540, y = ov.y ?? 900, w = ov.w ?? 640, h = ov.h ?? 240;
  const scan = interpolate(f, [at, at + 18], [0, 1], clamp); const lineY = interpolate(scan, [0, 1], [0, y]);
  const lock = spring({frame: f - at - 18, fps, config: {damping: 13, stiffness: 200}});
  const arm = 50, c = theme.accent, g = 1 + (1 - lock) * 0.5, X = x - (w / 2) * g, Y = y - (h / 2) * g, W = w * g, H = h * g;
  return <AbsoluteFill style={{pointerEvents: 'none'}}>
    {scan < 1 ? <div style={{position: 'absolute', left: 0, right: 0, top: lineY - 3, height: 6, background: c, boxShadow: `0 0 30px 8px ${c}88`}} /> : null}
    {scan < 1 ? <div style={{position: 'absolute', left: 0, right: 0, top: 0, height: lineY, background: `linear-gradient(transparent 70%, ${c}22)`}} /> : null}
    {f >= at + 18 ? <svg width={1080} height={1920} style={{position: 'absolute', inset: 0, opacity: lock}}>
      {[[X, Y, 1, 1], [X + W, Y, -1, 1], [X, Y + H, 1, -1], [X + W, Y + H, -1, -1]].map(([px, py, sx, sy], i) =>
        <path key={i} d={`M ${px} ${py + sy * arm} L ${px} ${py} L ${px + sx * arm} ${py}`} stroke={c} strokeWidth={9} fill="none" strokeLinecap="round" />)}
    </svg> : null}
    {ov.text && f >= at + 22 ? <div style={{position: 'absolute', left: X, top: Y + H + 18, padding: '10px 22px', background: c, color: '#fff', borderRadius: 12, fontFamily: SANS, fontWeight: 700, fontSize: 40, opacity: ramp(f, at + 22, at + 30), whiteSpace: 'nowrap'}}>
      {ov.text.slice(0, Math.max(1, Math.floor((f - at - 22) * 1.5)))}</div> : null}
  </AbsoluteFill>;
};

/* ================= Сцены ================= */

/* MSlam — слово влетает с огромного масштаба и бьётся о экран: кольца удара, линии, тряска */
export const MSlam: React.FC<BlockProps> = (p) => {
  const f = useCurrentFrame(); const T = p.theme; const text = words(p, 'стоп');
  const hit = 8; const s = interpolate(f, [0, hit], [4.5, 1], {...clamp, easing: Easing.in(Easing.cubic)});
  const after = f - hit; const shake = after >= 0 ? Math.max(0, 1 - after / 12) : 0;
  const dx = (random(`x${f}`) - 0.5) * 50 * shake, dy = (random(`y${f}`) - 0.5) * 36 * shake;
  const fs = Math.min(p.full ? 230 : 190, 1900 / Math.max(3, text.length));
  const cy = p.zoneH / 2;
  return <AbsoluteFill style={{height: p.zoneH, overflow: 'hidden', translate: `${dx}px ${dy}px`}}>
    {after >= 0 ? [0, 1, 2].map((i) => { const t = (after - i * 3) / 18; if (t < 0 || t > 1) return null;
      return <div key={i} style={{position: 'absolute', left: 540, top: cy, width: 200 + t * 1300, height: 200 + t * 1300, translate: '-50% -50%', borderRadius: '50%', border: `${16 * (1 - t)}px solid ${i % 2 ? T.accent : T.accent2}`, opacity: 1 - t}} />; }) : null}
    {after >= 0 && after < 10 ? Array.from({length: 16}, (_, i) => { const a = (i / 16) * Math.PI * 2; const r0 = 260 + after * 40; return <div key={i} style={{position: 'absolute', left: 540 + Math.cos(a) * r0, top: cy + Math.sin(a) * r0 * 0.8, width: 90, height: 10, borderRadius: 5, background: T.ink, rotate: `${a}rad`, opacity: 1 - after / 10}} />; }) : null}
    <AbsoluteFill style={{height: p.zoneH, display: 'grid', placeItems: 'center'}}>
      <div style={{fontFamily: SANS, fontWeight: 900, fontSize: fs, letterSpacing: -6, color: T.ink, scale: String(s), opacity: f < 1 ? 0 : 1, textTransform: 'uppercase', textShadow: after >= 0 && after < 4 ? `8px 0 ${T.accent2}, -8px 0 ${T.accent}` : 'none', textAlign: 'center', lineHeight: 0.95, padding: '0 50px'}}>{text}</div>
    </AbsoluteFill>
  </AbsoluteFill>;
};

/* MCounter — большое число считается вверх, на финише залп конфетти. «MCounter: подписчиков — 10 000» */
export const MCounter: React.FC<BlockProps> = (p) => {
  const f = useCurrentFrame(); const T = p.theme; const it = p.data.items.find((i) => i.value != null);
  const v = it ? (it.value as number) : 10000; const like = it ? it.shown : '10 000'; const cap = (it && it.label !== it.shown ? it.label : '') || p.data.title || 'подписчиков';
  const end = Math.round(p.dur * 0.5); const x = interpolate(f, [4, end], [0, v], {...clamp, easing: Easing.out(Easing.cubic)});
  const bump = f >= end ? spring({frame: f - end, fps: 30, config: {damping: 8, stiffness: 220}}) : 0;
  const fs = fmtNum(v, like).length > 7 ? 170 : 220;
  return <AbsoluteFill style={{height: p.zoneH, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 10}}>
    <div style={{fontFamily: SANS, fontWeight: 900, fontSize: fs, letterSpacing: -8, color: f >= end ? T.accent : T.ink, fontVariantNumeric: 'tabular-nums', scale: String(1 + 0.12 * Math.sin(bump * Math.PI))}}>{fmtNum(x, like)}</div>
    <div style={{fontFamily: SERIF, fontStyle: 'italic', fontWeight: 600, fontSize: 76, color: T.ink, opacity: ramp(f, 6, 18)}}>{cap}</div>
    <AbsoluteFill style={{height: p.zoneH}}><Confetti particleCount={160} colors={[T.accent, T.accent2, '#F2B53B', '#4CC38A', T.soft]} originX={0.5} originY={0.5} startFrame={end} power={28} size={16} seed={7} /></AbsoluteFill>
  </AbsoluteFill>;
};

/* MBeforeAfter — две картинки, разделитель с ручкой проезжает и открывает «после». «MBeforeAfter: до.jpg | после.jpg» */
export const MBeforeAfter: React.FC<BlockProps & {images?: string[]}> = (p) => {
  const f = useCurrentFrame(); const T = p.theme;
  const files = p.images && p.images.length ? p.images : p.data.items.map((i) => i.raw);
  const [a, b] = [files[0] || 'demo/g1.jpg', files[1] || 'demo/g3.jpg'];
  const W = 900, H = Math.min(p.zoneH * 0.78, 1300);
  const t = interpolate(f, [10, p.dur * 0.45, p.dur * 0.62, p.dur * 0.8], [0.92, 0.12, 0.3, 0.5], {...clamp, easing: Easing.inOut(Easing.cubic)});
  const lab = (s: string, left: boolean) => <div style={{position: 'absolute', top: 30, [left ? 'left' : 'right']: 30, padding: '10px 24px', borderRadius: 999, background: 'rgba(0,0,0,.55)', color: '#fff', fontFamily: SANS, fontWeight: 700, fontSize: 40}}>{s}</div>;
  return <AbsoluteFill style={{height: p.zoneH, display: 'grid', placeItems: 'center'}}>
    <div style={{position: 'relative', width: W, height: H, borderRadius: 40, overflow: 'hidden', boxShadow: '0 30px 80px rgba(0,0,0,.2)', opacity: ramp(f, 0, 8)}}>
      <Img src={src(b)} style={{position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover'}} />{lab('после', false)}
      <div style={{position: 'absolute', inset: 0, clipPath: `inset(0 ${(1 - t) * 100}% 0 0)`}}><Img src={src(a)} style={{width: '100%', height: '100%', objectFit: 'cover'}} />{lab('до', true)}</div>
      <div style={{position: 'absolute', top: 0, bottom: 0, left: `${t * 100}%`, width: 8, translate: '-50% 0', background: '#fff', boxShadow: '0 0 20px rgba(0,0,0,.3)'}} />
      <div style={{position: 'absolute', top: '50%', left: `${t * 100}%`, width: 96, height: 96, translate: '-50% -50%', borderRadius: '50%', background: '#fff', display: 'grid', placeItems: 'center', fontSize: 44, color: T.ink, fontFamily: SANS, fontWeight: 800}}>‹ ›</div>
    </div>
  </AbsoluteFill>;
};

/* ================= Текст на весь экран ================= */

/* TxtFly — слова летят из глубины мимо камеры, в центре стоит заголовок. «TxtFly: слово, слово, … | заголовок: …» */
export const TxtFly: React.FC<BlockProps> = (p) => {
  const f = useCurrentFrame(); const T = p.theme;
  const list = (p.data.items.length ? p.data.items.flatMap((i) => i.raw.split(/\s*,\s*/)) : ['идеи', 'охваты', 'клиенты', 'деньги', 'рост', 'контент', 'свобода', 'команда', 'время', 'энергия']).filter(Boolean);
  const title = p.data.title || 'всё это — твоё';
  const P = 3000, cy = p.zoneH / 2;
  const items = Array.from({length: 18}, (_, i) => { const a = i * 2.39996; const r = 260 + random(`r${i}`) * 420; return {w: list[i % list.length], x: Math.cos(a) * r, y: Math.sin(a) * r * 1.3, ph: i / 18, serif: i % 3 === 0}; });
  return <AbsoluteFill style={{height: p.zoneH, overflow: 'hidden', background: `radial-gradient(circle at 50% ${cy}px, ${T.accent}22, transparent 60%)`}}>
    {items.map((it, i) => {
      const u = ((f / Math.max(60, p.dur)) * 1.2 + it.ph) % 1; const z = -5000 + u * 7400; const s = P / (P - z); if (s <= 0 || s > 6) return null;
      const op = interpolate(u, [0, 0.25, 0.75, 1], [0, 1, 0.6, 0]);
      return <div key={i} style={{position: 'absolute', left: 540 + it.x * s, top: cy + it.y * s, translate: '-50% -50%', scale: String(s), opacity: op, filter: s > 2.5 ? `blur(${(s - 2.5) * 3}px)` : undefined,
        fontFamily: it.serif ? SERIF : SANS, fontStyle: it.serif ? 'italic' : 'normal', fontWeight: it.serif ? 600 : 800, fontSize: 52, color: i % 5 === 0 ? T.accent : T.ink, whiteSpace: 'nowrap'}}>{it.w}</div>;
    })}
    <AbsoluteFill style={{height: p.zoneH, display: 'grid', placeItems: 'center'}}>
      <div style={{padding: '30px 50px', borderRadius: 40, background: `${T.bg}E6`, fontFamily: SANS, fontWeight: 800, fontSize: p.full ? 104 : 88, letterSpacing: -3, color: T.ink, textAlign: 'center', lineHeight: 1, opacity: ramp(f, 6, 18), scale: String(0.94 + 0.06 * ramp(f, 6, 18))}}>{title}</div>
    </AbsoluteFill>
  </AbsoluteFill>;
};

/* TxtSweep — фраза стоит, по ключевому слову пробегает градиентный заряд и слово загорается. «TxtSweep: фраза | ключевое слово» */
export const TxtSweep: React.FC<BlockProps> = (p) => {
  const f = useCurrentFrame(); const T = p.theme; const parts = p.data.items.map((i) => i.raw);
  const phrase = parts[0] || p.data.text || 'главное — системность'; const key = parts[1] || phrase.split(' ').slice(-1)[0];
  const i0 = phrase.toLowerCase().lastIndexOf(key.toLowerCase());
  const pre = i0 >= 0 ? phrase.slice(0, i0) : phrase + ' ', kw = i0 >= 0 ? phrase.slice(i0, i0 + key.length) : key, post = i0 >= 0 ? phrase.slice(i0 + key.length) : '';
  const sweep = interpolate(f, [12, 34], [-60, 160], {...clamp, easing: Easing.inOut(Easing.cubic)}); const lit = ramp(f, 26, 40);
  const fs = Math.min(p.full ? 140 : 118, 2000 / Math.max(8, phrase.length));
  return <AbsoluteFill style={{height: p.zoneH, display: 'grid', placeItems: 'center', padding: '0 70px', textAlign: 'center'}}>
    <div style={{fontFamily: SANS, fontWeight: 800, fontSize: fs, letterSpacing: -3, lineHeight: 1.05, color: T.ink, opacity: ramp(f, 0, 10)}}>
      {pre}{f > 36 ? <span style={{color: T.accent, textShadow: `0 0 ${18 * lit}px ${T.accent}55`}}>{kw}</span> : <span style={{backgroundImage: `linear-gradient(100deg, ${T.ink} ${sweep - 40}%, ${T.accent2} ${sweep - 10}%, ${T.accent} ${sweep}%, ${lit > 0.5 ? T.accent : T.ink} ${sweep + 30}%)`,
        WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent', filter: lit ? `drop-shadow(0 0 ${18 * lit}px ${T.accent}66)` : undefined}}>{kw}</span>}{post}</div>
  </AbsoluteFill>;
};

/* TxtUnderline — заголовок, под ключевым словом маркер прочерчивает линию. «TxtUnderline: фраза | ключевое слово» */
export const TxtUnderline: React.FC<BlockProps> = (p) => {
  const f = useCurrentFrame(); const T = p.theme; const parts = p.data.items.map((i) => i.raw);
  const phrase = parts[0] || p.data.text || 'делай раньше, чем готов'; const key = parts[1] || phrase.split(' ').slice(-1)[0];
  const i0 = phrase.toLowerCase().lastIndexOf(key.toLowerCase());
  const pre = i0 >= 0 ? phrase.slice(0, i0) : phrase + ' ', kw = i0 >= 0 ? phrase.slice(i0, i0 + key.length) : key, post = i0 >= 0 ? phrase.slice(i0 + key.length) : '';
  const draw = interpolate(f, [16, 30], [0, 1], {...clamp, easing: ease}); const fs = Math.min(p.full ? 140 : 118, 2000 / Math.max(8, phrase.length));
  return <AbsoluteFill style={{height: p.zoneH, display: 'grid', placeItems: 'center', padding: '0 70px', textAlign: 'center'}}>
    <div style={{fontFamily: SANS, fontWeight: 800, fontSize: fs, letterSpacing: -3, lineHeight: 1.15, color: T.ink, opacity: ramp(f, 0, 10), translate: `0 ${(1 - ramp(f, 0, 12)) * 30}px`}}>
      {pre}<span style={{position: 'relative', display: 'inline-block'}}>{kw}
        <svg viewBox="0 0 100 20" preserveAspectRatio="none" style={{position: 'absolute', left: '-4%', width: '108%', bottom: -fs * 0.12, height: fs * 0.28, overflow: 'visible'}}>
          <path d="M 2 12 C 25 6, 55 16, 98 8" stroke={T.accent2} strokeWidth={7} fill="none" strokeLinecap="round" pathLength={1} strokeDasharray={1} strokeDashoffset={1 - draw} vectorEffect="non-scaling-stroke" style={{strokeWidth: fs * 0.11}} />
        </svg></span>{post}</div>
  </AbsoluteFill>;
};

/* TxtMask — огромное слово, внутри букв идёт видео спикера или картинка. «TxtMask: слово | pic_3 (можно без — тогда спикер)» */
export const TxtMask: React.FC<BlockProps & {speaker?: {src: string; from: number}}> = (p) => {
  const f = useCurrentFrame(); const T = p.theme; const parts = p.data.items.map((i) => i.raw);
  const word = (parts[0] || p.data.text || 'СТИЛЬ').toUpperCase(); const file = parts[1];
  const fs = Math.min(360, 1450 / Math.max(3, word.length)); const k = interpolate(f, [0, 22], [1.6, 1], {...clamp, easing: ease});
  const fill = file ? <Img src={src(file)} style={{width: '100%', height: '100%', objectFit: 'cover'}} />
    : p.speaker ? <OffthreadVideo src={staticFile(p.speaker.src)} muted startFrom={p.speaker.from} style={{width: '100%', height: '100%', objectFit: 'cover'}} />
    : <div style={{width: '100%', height: '100%', background: `linear-gradient(${f * 3}deg, ${T.accent}, ${T.accent2}, #F2B53B)`}} />;
  return <AbsoluteFill style={{height: p.zoneH, display: 'grid', placeItems: 'center', overflow: 'hidden'}}>
    <svg width={0} height={0} style={{position: 'absolute'}}><defs><clipPath id="txtmask" clipPathUnits="userSpaceOnUse">
      <text x={540} y={p.zoneH / 2 + fs * 0.36} textAnchor="middle" fontFamily="InterTight" fontWeight={900} fontSize={fs} letterSpacing={-fs * 0.04}>{word}</text></clipPath></defs></svg>
    <AbsoluteFill style={{height: p.zoneH, clipPath: 'url(#txtmask)', scale: String(k)}}>{fill}</AbsoluteFill>
    <div style={{position: 'absolute', top: p.zoneH / 2 + fs * 0.55, width: '100%', textAlign: 'center', fontFamily: SERIF, fontStyle: 'italic', fontWeight: 600, fontSize: 64, color: T.ink, opacity: ramp(f, 18, 30)}}>{p.data.title || ''}</div>
  </AbsoluteFill>;
};

/* ================= Переходы ================= */
type None = Record<string, never>;
const mk = (C: React.FC<TransitionPresentationComponentProps<None>>): TransitionPresentation<None> => ({component: C, props: {}});

/* TrFlash — белая вспышка, склейка спрятана в пике */
const FlashP: React.FC<TransitionPresentationComponentProps<None>> = ({children, presentationProgress: p, presentationDirection: d}) => {
  const show = d === 'exiting' ? p < 0.5 : p >= 0.5; if (!show) return null; const w = 1 - Math.abs(p - 0.5) * 2;
  return <AbsoluteFill><AbsoluteFill style={{scale: String(1 + 0.06 * w), filter: `brightness(${1 + 2 * w})`}}>{children}</AbsoluteFill><AbsoluteFill style={{background: '#fff', opacity: Math.pow(w, 1.5)}} /></AbsoluteFill>;
};
/* TrTear — кадр рвётся горизонтальными полосами, полосы растягиваются и смазываются */
const TearP: React.FC<TransitionPresentationComponentProps<None>> = ({children, presentationProgress: p, presentationDirection: d}) => {
  const f = useCurrentFrame(); const show = d === 'exiting' ? p < 0.5 : p >= 0.5; if (!show) return null; const w = 1 - Math.abs(p - 0.5) * 2;
  return <AbsoluteFill style={{overflow: 'hidden'}}>
    <AbsoluteFill style={{translate: `${(d === 'exiting' ? -1 : 1) * 120 * w}px 0`, scale: `${1 + 0.4 * w} 1`, filter: `blur(${10 * w}px)`}}>{children}</AbsoluteFill>
    {Array.from({length: 9}, (_, i) => { const y = random(`ty${i}${f}`) * 100; const h = 0.6 + random(`th${i}${f}`) * 4; return random(`tv${i}${f}`) < w ? <div key={i} style={{position: 'absolute', left: 0, right: 0, top: `${y}%`, height: `${h}%`, background: i % 3 ? 'rgba(255,255,255,.85)' : 'rgba(0,0,0,.8)', filter: 'blur(2px)'}} /> : null; })}
  </AbsoluteFill>;
};
/* TrInk — новая сцена растекается из центра чернильным пятном с рваным краем */
const InkP: React.FC<TransitionPresentationComponentProps<None>> = ({children, presentationProgress: p, presentationDirection: d}) => {
  if (d === 'exiting') return <AbsoluteFill>{children}</AbsoluteFill>;
  const r = interpolate(p, [0, 1], [0, 1300], {easing: Easing.inOut(Easing.cubic)}); const N = 48;
  const pts = Array.from({length: N}, (_, i) => { const a = (i / N) * Math.PI * 2; const rr = r * (0.82 + 0.3 * random(`ink${i}`)); return `${540 + Math.cos(a) * rr}px ${960 + Math.sin(a) * rr}px`; }).join(',');
  return <AbsoluteFill style={{clipPath: `polygon(${pts})`}}>{children}</AbsoluteFill>;
};
/* TrLeak — тёплый засвет плёнки выгорает на склейке */
const LeakP: React.FC<TransitionPresentationComponentProps<None>> = ({children, presentationProgress: p, presentationDirection: d}) => {
  const show = d === 'exiting' ? p < 0.5 : p >= 0.5; if (!show) return null; const w = 1 - Math.abs(p - 0.5) * 2; const x = interpolate(p, [0, 1], [-20, 120]);
  return <AbsoluteFill><AbsoluteFill style={{filter: `brightness(${1 + 0.8 * w}) saturate(${1 + 0.5 * w}) sepia(${0.3 * w})`}}>{children}</AbsoluteFill>
    <AbsoluteFill style={{background: `radial-gradient(ellipse 60% 80% at ${x}% 40%, rgba(255,190,90,${0.95 * w}), rgba(255,90,40,${0.6 * w}) 40%, transparent 75%)`, mixBlendMode: 'screen'}} />
    <AbsoluteFill style={{background: `radial-gradient(circle at ${100 - x}% 80%, rgba(255,240,200,${0.8 * w}), transparent 50%)`, mixBlendMode: 'screen'}} /></AbsoluteFill>;
};
/* TrGrain — старая сцена рассыпается зерном, новая проступает сквозь него */
const grainMask = (thr: number) => `url("data:image/svg+xml;utf8,${encodeURIComponent(`<svg xmlns='http://www.w3.org/2000/svg' width='1080' height='1920'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.012' numOctaves='3' seed='3'/><feColorMatrix type='saturate' values='0'/><feComponentTransfer><feFuncA type='discrete' tableValues='1 1 1 1 1 1 1 1'/><feFuncR type='linear' slope='12' intercept='${-12 * thr + 5.5}'/><feFuncG type='linear' slope='12' intercept='${-12 * thr + 5.5}'/><feFuncB type='linear' slope='12' intercept='${-12 * thr + 5.5}'/></feComponentTransfer></filter><rect width='100%' height='100%' filter='url(#n)'/></svg>`)}")`;
const GrainP: React.FC<TransitionPresentationComponentProps<None>> = ({children, presentationProgress: p, presentationDirection: d}) => {
  if (d === 'exiting') return <AbsoluteFill>{children}</AbsoluteFill>;
  const m = grainMask(interpolate(p, [0, 1], [1.05, -0.05])); return <AbsoluteFill style={{maskImage: m, WebkitMaskImage: m, maskMode: 'luminance', WebkitMaskSize: '100% 100%'} as React.CSSProperties}>{children}</AbsoluteFill>;
};
export const SC_TRANSITIONS: Record<string, {make: () => TransitionPresentation<never>; len: number; name: string; summary: string}> = {
  TrFlash: {make: () => mk(FlashP) as never, len: 10, name: 'Белая вспышка', summary: 'Склейка спрятана в белой вспышке'},
  TrTear: {make: () => mk(TearP) as never, len: 10, name: 'Рваный сдвиг', summary: 'Кадр рвётся полосами и смазывается вбок'},
  TrInk: {make: () => mk(InkP) as never, len: 18, name: 'Чернильное пятно', summary: 'Новая сцена растекается из центра пятном с рваным краем'},
  TrLeak: {make: () => mk(LeakP) as never, len: 16, name: 'Засвет плёнки', summary: 'Тёплый засвет выгорает на склейке'},
  TrGrain: {make: () => mk(GrainP) as never, len: 20, name: 'Зернистое растворение', summary: 'Старая сцена рассыпается зерном, новая проступает'},
};
void pop;
