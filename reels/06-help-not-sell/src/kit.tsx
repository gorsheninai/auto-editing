import React from 'react';
import {
  AbsoluteFill, Img, OffthreadVideo, interpolate, spring, staticFile,
  useCurrentFrame, continueRender, delayRender, Easing,
} from 'remotion';
import words from './words.json';

export const FPS = 30;
export const C = {
  cream: '#FFFFFF', ink: '#111111', green: '#1F6B45', orange: '#E8A33D',
  violet: '#B06CF0', lav: '#D4D4DA', yellow: '#F4C542', grey: '#8C8C8C', blue: '#E8EEF8',
};
export const SANS = "'InterTight', sans-serif";
export const SERIF = "'NotoDisplay', serif";
export const serifIt: React.CSSProperties = {fontFamily: SERIF, fontStyle: 'italic', fontWeight: 400, fontStretch: '68%'};
export const f = (s: number) => Math.round(s * FPS);
export const S = (p: string) => staticFile(p);

// ---------- words / timing ----------
type W = {w: string; s: number; e: number};
export const WORDS = words as W[];
export const norm = (s: string) => s.toLowerCase().replace(/[.,:?!«»—]/g, '');
const idx = (word: string, occ = 0) => {
  let n = 0;
  for (let i = 0; i < WORDS.length; i++) {
    if (norm(WORDS[i].w) === word) {
      if (n === occ) return i;
      n++;
    }
  }
  throw new Error('word not found ' + word);
};
export const wf = (word: string, occ = 0) => f(WORDS[idx(word, occ)].s);
/** start of the word right before `word` (to cut on "и вот…") */
export const wfPrev = (word: string, occ = 0) => f(WORDS[idx(word, occ) - 1].s);
export const VIDEO_DUR = 13.9; // cleaned avatar video length, s
export const TOTAL = Math.min(Math.ceil((WORDS[WORDS.length - 1].e + 0.45) * FPS), Math.floor(VIDEO_DUR * FPS));

// ---------- fonts ----------
const fontFiles: [string, string, string, string, string?][] = [
  ['InterTight', 'inter-tight-cyrillic-700-normal', '700', 'normal'],
  ['InterTight', 'inter-tight-latin-700-normal', '700', 'normal'],
  ['InterTight', 'inter-tight-cyrillic-600-normal', '600', 'normal'],
  ['InterTight', 'inter-tight-latin-600-normal', '600', 'normal'],
  ['Pixel', 'pixelify-sans-cyrillic-700-normal', '700', 'normal'],
  ['Pixel', 'pixelify-sans-latin-700-normal', '700', 'normal'],
  ['NotoDisplay', 'noto-serif-display-cyrillic-wdth-italic', '100 900', 'italic', '62.5% 100%'],
  ['NotoDisplay', 'noto-serif-display-latin-wdth-italic', '100 900', 'italic', '62.5% 100%'],
];
let started = false;
export const useFonts = () => {
  if (started) return;
  started = true;
  const h = delayRender('fonts');
  Promise.all(fontFiles.map(([fam, file, weight, style, stretch]) => {
    const ff = new FontFace(fam, `url(${S(`fonts/${file}.woff2`)})`, stretch ? {weight, style, stretch} : {weight, style});
    return ff.load().then((l) => document.fonts.add(l));
  })).then(() => continueRender(h));
};

// ---------- motion helpers ----------
export const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;
export const ease = Easing.bezier(0.16, 1, 0.3, 1);
export const pop = (frame: number, at: number) =>
  spring({frame: frame - at, fps: FPS, config: {damping: 11, stiffness: 170, mass: 0.7}});

/** background image, cover, slow zoom/pan */
export const Bg: React.FC<{src: string; dur: number; zoom?: [number, number]; pan?: [number, number]; panY?: [number, number]; pos?: string; filter?: string}> = ({src, dur, zoom = [1.03, 1.1], pan = [0, 0], panY = [0, 0], pos = '50% 50%', filter}) => {
  const fr = useCurrentFrame();
  return (
    <AbsoluteFill style={{overflow: 'hidden'}}>
      <Img src={S(src)} style={{width: '100%', height: '100%', objectFit: 'cover', objectPosition: pos, filter,
        scale: String(interpolate(fr, [0, dur], zoom, clamp)),
        translate: `${interpolate(fr, [0, dur], pan, clamp)}px ${interpolate(fr, [0, dur], panY, clamp)}px`}} />
    </AbsoluteFill>
  );
};

/** object that springs in, then floats gently */
export const Pop: React.FC<{src: string; at: number; x: number; y: number; w: number; float?: number; rot?: number; out?: number; from?: 'scale' | 'up' | 'down'}> = ({src, at, x, y, w, float = 8, rot = 0, out, from = 'scale'}) => {
  const fr = useCurrentFrame();
  if (fr < at) return null;
  const s = pop(fr, at);
  const fy = Math.sin((fr - at) / 14) * float;
  const o = out !== undefined ? interpolate(fr, [out, out + 8], [1, 0], clamp) : 1;
  const dy = from === 'up' ? interpolate(s, [0, 1], [260, 0]) : from === 'down' ? interpolate(s, [0, 1], [-400, 0]) : 0;
  return (
    <Img src={S(src)} style={{position: 'absolute', left: x - w / 2, top: y - w / 2 + fy + dy, width: w, opacity: o,
      scale: String(from === 'scale' ? s : 1), rotate: `${rot + Math.sin((fr - at) / 20) * 3}deg`}} />
  );
};

/** label pill */
export const Pill: React.FC<{at: number; x: number; y: number; children: React.ReactNode; bg?: string; color?: string; size?: number}> = ({at, x, y, children, bg = C.ink, color = '#fff', size = 34}) => {
  const fr = useCurrentFrame();
  if (fr < at) return null;
  return (
    <div style={{position: 'absolute', left: x, top: y, translate: '-50% -50%', scale: String(pop(fr, at)), background: bg, color,
      fontFamily: SANS, fontWeight: 700, fontSize: size, letterSpacing: -0.5, padding: '8px 22px', borderRadius: 999, whiteSpace: 'nowrap',
      boxShadow: '0 8px 24px rgba(28,27,34,0.18)'}}>{children}</div>
  );
};

export const Grain: React.FC<{o?: number}> = ({o = 0.07}) => (
  <AbsoluteFill style={{pointerEvents: 'none', opacity: o, mixBlendMode: 'multiply',
    backgroundImage: 'url("data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 width=%22160%22 height=%22160%22><filter id=%22n%22><feTurbulence type=%22fractalNoise%22 baseFrequency=%220.9%22 numOctaves=%222%22/></filter><rect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23n)%22/></svg>")'}} />
);

export const Avatar: React.FC<{from: number; style?: React.CSSProperties}> = ({from, style}) => (
  <OffthreadVideo src={S('avatar.mp4')} muted startFrom={from} style={{width: '100%', height: '100%', objectFit: 'cover', ...style}} />
);

export const TOP_H = 1130;
const WIN = {x: 60, y: 1390, w: 960, r: 54};
const VID = {w: 960, top: 950};
const VID_H = (VID.w * 1280) / 720;

/** Mode B: scene on top, pop-out presenter window below, light dotted backdrop */
export const Split: React.FC<{from: number; children: React.ReactNode}> = ({from, children}) => {
  const fr = useCurrentFrame();
  const enter = spring({frame: fr, fps: FPS, config: {damping: 14}});
  const dy = interpolate(enter, [0, 1], [60, 0]);
  const vid: React.CSSProperties = {position: 'absolute', left: 0, top: VID.top - WIN.y, width: VID.w, height: VID_H};
  const clip = `polygon(0px 0px, 1080px 0px, 1080px ${WIN.y}px, ${WIN.x + WIN.w}px ${WIN.y}px, ${WIN.x + WIN.w}px 1920px, ${WIN.x}px 1920px, ${WIN.x}px ${WIN.y}px, 0px ${WIN.y}px)`;
  return (
    <AbsoluteFill style={{background: C.cream}}>
      <AbsoluteFill style={{backgroundImage: `radial-gradient(${C.lav} 2px, transparent 2.4px)`, backgroundSize: '30px 30px'}} />
      <div style={{position: 'absolute', left: 0, top: 0, width: 1080, height: TOP_H, overflow: 'hidden'}}>
        {children}
        <div style={{position: 'absolute', left: 0, right: 0, bottom: 0, height: 240, background: `linear-gradient(180deg, rgba(244,241,234,0), ${C.cream})`}} />
      </div>
      <AbsoluteFill style={{translate: `0px ${dy}px`}}>
        <div style={{position: 'absolute', left: WIN.x, top: WIN.y, width: WIN.w, height: 1920 - WIN.y + 80, borderRadius: WIN.r, overflow: 'hidden', boxShadow: '0 -10px 40px rgba(28,27,34,0.18)'}}>
          <OffthreadVideo src={S('avatar.mp4')} muted startFrom={from} style={vid} />
        </div>
        <AbsoluteFill style={{clipPath: clip}}>
          <OffthreadVideo src={S('avatar_cut.webm')} transparent muted startFrom={from}
            style={{position: 'absolute', left: WIN.x, top: VID.top, width: VID.w, height: VID_H}} />
        </AbsoluteFill>
      </AbsoluteFill>
      <Grain o={0.03} />
    </AbsoluteFill>
  );
};

export const Shake: React.FC<{at: number; children: React.ReactNode; amp?: number; len?: number}> = ({at, children, amp = 12, len = 12}) => {
  const fr = useCurrentFrame();
  const k = fr >= at && fr < at + len ? (1 - (fr - at) / len) * amp : 0;
  return <AbsoluteFill style={{translate: `${k ? Math.sin(fr * 7.3) * k : 0}px ${k ? Math.cos(fr * 5.1) * k : 0}px`}}>{children}</AbsoluteFill>;
};

export const Title: React.FC<{at?: number; top: number; a: string; b: string; color?: string; sizeA?: number; sizeB?: number}> = ({at = 0, top, a, b, color = C.ink, sizeA = 84, sizeB = 104}) => {
  const fr = useCurrentFrame();
  const o = interpolate(fr, [at, at + 8], [0, 1], clamp);
  const y = interpolate(fr, [at, at + 14], [30, 0], {...clamp, easing: ease});
  const line = interpolate(fr, [at + 8, at + 24], [0, 100], clamp);
  return (
    <div style={{position: 'absolute', top, left: 40, right: 40, textAlign: 'center', opacity: o, translate: `0px ${y}px`}}>
      <div style={{fontFamily: SANS, fontWeight: 700, fontSize: sizeA, letterSpacing: -2.5, color, lineHeight: 1}}>{a}</div>
      <div style={{...serifIt, fontSize: sizeB, color, lineHeight: 1.05, display: 'inline-block', position: 'relative'}}>
        {b}
        <div style={{position: 'absolute', left: 6, bottom: 4, height: 5, width: `${line}%`, background: C.orange, borderRadius: 3}} />
      </div>
    </div>
  );
};

/** Mode A for light reels: cut-out speaker on white dotted sheet */
export const AvatarCut: React.FC<{from: number; dur: number; zoom?: [number, number]; children?: React.ReactNode}> = ({from, dur, zoom = [1.0, 1.04], children}) => {
  const fr = useCurrentFrame();
  return (
    <AbsoluteFill style={{background: C.cream}}>
      <AbsoluteFill style={{backgroundImage: `radial-gradient(${C.lav} 2px, transparent 2.4px)`, backgroundSize: '30px 30px'}} />
      <AbsoluteFill style={{scale: String(interpolate(fr, [0, dur], zoom, clamp)), transformOrigin: '50% 30%'}}>
        <OffthreadVideo src={S('avatar_cut.webm')} transparent muted startFrom={from} style={{width: '100%', height: '100%'}} />
      </AbsoluteFill>
      {children}
      <Grain o={0.03} />
    </AbsoluteFill>
  );
};

/** small scattered grotesque word (reference style) */
export const Word: React.FC<{at: number; x: number; y: number; children: React.ReactNode; size?: number; color?: string; it?: boolean}> = ({at, x, y, children, size = 44, color = C.ink, it}) => {
  const fr = useCurrentFrame();
  if (fr < at) return null;
  return (
    <div style={{position: 'absolute', left: x, top: y, fontFamily: SANS, fontWeight: 600, fontSize: size, letterSpacing: -0.5, color, whiteSpace: 'nowrap',
      fontStyle: it ? 'italic' : 'normal', opacity: interpolate(fr, [at, at + 3], [0, 1], clamp), translate: `0px ${interpolate(fr, [at, at + 6], [10, 0], clamp)}px`}}>{children}</div>
  );
};

/** sticker image: pops in with a small overshoot and slight tilt sway */
export const Sticker: React.FC<{src: string; at: number; x: number; y: number; w: number; rot?: number; out?: number; sway?: number; style?: React.CSSProperties}> = ({src, at, x, y, w, rot = 0, out, sway = 1.5, style}) => {
  const fr = useCurrentFrame();
  if (fr < at) return null;
  const s = pop(fr, at);
  const o = out !== undefined ? interpolate(fr, [out, out + 5], [1, 0], clamp) : 1;
  return <Img src={S(src)} style={{position: 'absolute', left: x - w / 2, top: y, width: w, scale: String(s), opacity: o, rotate: `${rot + Math.sin((fr - at) / 9) * sway}deg`, ...style}} />;
};

/** black plate with white text */
export const Plate: React.FC<{at: number; x: number; y: number; children: React.ReactNode; size?: number; bg?: string; color?: string; rot?: number}> = ({at, x, y, children, size = 46, bg = C.ink, color = '#fff', rot = 0}) => {
  const fr = useCurrentFrame();
  if (fr < at) return null;
  return (
    <div style={{position: 'absolute', left: x, top: y, translate: '-50% -50%', scale: String(pop(fr, at)), rotate: `${rot}deg`, background: bg, color,
      fontFamily: SANS, fontWeight: 600, fontSize: size, letterSpacing: -0.5, padding: '6px 20px 10px', borderRadius: 6, whiteSpace: 'nowrap'}}>{children}</div>
  );
};

/** strike line drawn left to right */
export const Strike: React.FC<{a: number; x1: number; y1: number; x2: number; y2: number; w?: number; color?: string; len?: number}> = ({a, x1, y1, x2, y2, w = 8, color = C.ink, len = 7}) => {
  const fr = useCurrentFrame();
  const k = interpolate(fr, [a, a + len], [0, 1], {...clamp, easing: ease});
  if (k <= 0) return null;
  return (
    <svg width={1080} height={1920} style={{position: 'absolute', left: 0, top: 0, pointerEvents: 'none'}}>
      <line x1={x1} y1={y1} x2={x1 + (x2 - x1) * k} y2={y1 + (y2 - y1) * k} stroke={color} strokeWidth={w} strokeLinecap="round" />
    </svg>
  );
};
