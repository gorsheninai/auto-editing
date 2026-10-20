import React from 'react';
import {
  AbsoluteFill, Img, OffthreadVideo, interpolate, spring, staticFile,
  useCurrentFrame, useVideoConfig, Easing, continueRender, delayRender,
} from 'remotion';
import words from './words.json';

export const FPS = 30;
export const C = {
  teal: '#2F8F8A', deep: '#1F5E5C', ink: '#141414', orange: '#E8622C',
  cream: '#F3EFE7', green: '#2A3A2E', night: '#0E2422',
};
export const PIX = "'Pixel', monospace";
export const SANS = "'InterTight', sans-serif";
export const SERIF = "'NotoDisplay', serif"; // always used italic + condensed (fontStretch)
export const serifIt: React.CSSProperties = {fontFamily: SERIF, fontStyle: 'italic', fontWeight: 400, fontStretch: '68%'};
export const f = (s: number) => Math.round(s * FPS);

// ---------- words / timing ----------
type W = {w: string; s: number; e: number};
export const WORDS = words as W[];
const norm = (s: string) => s.toLowerCase().replace(/[.,?!«»—]/g, '');
export const wt = (word: string, occ = 0) => {
  let n = 0;
  for (const x of WORDS) {
    if (norm(x.w) === word) {
      if (n === occ) return x.s;
      n++;
    }
  }
  throw new Error('word not found ' + word);
};
export const wf = (word: string, occ = 0) => f(wt(word, occ));

// ---------- fonts ----------
const fontFiles: [string, string, string, string, string?][] = [
  ['InterTight', 'inter-tight-cyrillic-700-normal', '700', 'normal'],
  ['InterTight', 'inter-tight-latin-700-normal', '700', 'normal'],
  ['InterTight', 'inter-tight-cyrillic-600-normal', '600', 'normal'],
  ['InterTight', 'inter-tight-latin-600-normal', '600', 'normal'],
  ['NotoDisplay', 'noto-serif-display-cyrillic-wdth-italic', '100 900', 'italic', '62.5% 100%'],
  ['NotoDisplay', 'noto-serif-display-latin-wdth-italic', '100 900', 'italic', '62.5% 100%'],
  ['Manrope', 'manrope-cyrillic-800-normal', '800', 'normal'],
  ['Manrope', 'manrope-latin-800-normal', '800', 'normal'],
  ['Manrope', 'manrope-cyrillic-600-normal', '600', 'normal'],
  ['Manrope', 'manrope-latin-600-normal', '600', 'normal'],
  ['Playfair', 'playfair-display-cyrillic-900-normal', '900', 'normal'],
  ['Playfair', 'playfair-display-latin-900-normal', '900', 'normal'],
  ['Playfair', 'playfair-display-cyrillic-700-italic', '700', 'italic'],
  ['Playfair', 'playfair-display-latin-700-italic', '700', 'italic'],
  ['Pixel', 'pixelify-sans-cyrillic-700-normal', '700', 'normal'],
  ['Pixel', 'pixelify-sans-latin-700-normal', '700', 'normal'],
  ['Pixel', 'pixelify-sans-cyrillic-400-normal', '400', 'normal'],
  ['Pixel', 'pixelify-sans-latin-400-normal', '400', 'normal'],
];
let fontsStarted = false;
export const useFonts = () => {
  if (fontsStarted) return;
  fontsStarted = true;
  const h = delayRender('fonts');
  Promise.all(
    fontFiles.map(([fam, file, weight, style, stretch]) => {
      const ff = new FontFace(fam, `url(${staticFile(`fonts/${file}.woff2`)})`, stretch ? {weight, style, stretch} : {weight, style});
      return ff.load().then((l) => document.fonts.add(l));
    }),
  ).then(() => continueRender(h));
};

// ---------- motion helpers ----------
export const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;
/** stepped frame for "old game" jerky motion */
export const stepF = (frame: number, step = 3) => Math.floor(frame / step) * step;

export const pop = (frame: number, at: number, fps = FPS) =>
  spring({frame: frame - at, fps, config: {damping: 9, stiffness: 160, mass: 0.6}});

export const Bg: React.FC<{src: string; zoom?: [number, number]; panX?: [number, number]; dur: number; dim?: number; posY?: string}> = ({src, zoom = [1.05, 1.15], panX = [0, 0], dur, dim = 0, posY = '50%'}) => {
  const fr = useCurrentFrame();
  const z = interpolate(fr, [0, dur], zoom, clamp);
  const x = interpolate(fr, [0, dur], panX, clamp);
  return (
    <AbsoluteFill style={{overflow: 'hidden'}}>
      <Img src={staticFile(src)} style={{width: '100%', height: '100%', objectFit: 'cover', objectPosition: `50% ${posY}`, scale: String(z), translate: `${x}px 0px`, imageRendering: 'auto'}} />
      {dim > 0 && <AbsoluteFill style={{background: `rgba(10,20,20,${dim})`}} />}
    </AbsoluteFill>
  );
};

/** item / sprite that pops in, then bobs like a game pickup */
export const Pickup: React.FC<{src: string; at: number; x: number; y: number; w: number; bob?: number; spin?: boolean; out?: number}> = ({src, at, x, y, w, bob = 10, spin = false, out}) => {
  const fr = useCurrentFrame();
  if (fr < at) return null;
  const s = pop(fr, at);
  const sf = stepF(fr, 2);
  const by = Math.sin((sf - at) / 9) * bob;
  const o = out !== undefined ? interpolate(fr, [out, out + 6], [1, 0], clamp) : 1;
  const so = out !== undefined ? interpolate(fr, [out, out + 6], [1, 0.4], clamp) : 1;
  return (
    <Img src={staticFile(src)} style={{position: 'absolute', left: x - w / 2, top: y - w / 2 + by, width: w, scale: String(s * so), opacity: o, rotate: spin ? `${Math.sin((sf - at) / 14) * 8}deg` : '0deg'}} />
  );
};

/** PS2 style panel */
export const Panel: React.FC<{style?: React.CSSProperties; children: React.ReactNode; dark?: boolean}> = ({style, children, dark}) => (
  <div style={{
    position: 'absolute', background: dark ? 'rgba(14,36,34,0.88)' : C.cream, color: dark ? C.cream : C.ink,
    border: `6px solid ${dark ? C.cream : C.deep}`, boxShadow: `0 0 0 6px ${dark ? C.deep : C.cream}, 0 14px 0 6px rgba(0,0,0,0.35)`,
    borderRadius: 14, fontFamily: PIX, ...style,
  }}>{children}</div>
);

export const CRT: React.FC<{strength?: number}> = ({strength = 1}) => (
  <AbsoluteFill style={{pointerEvents: 'none'}}>
    <AbsoluteFill style={{background: 'repeating-linear-gradient(0deg, rgba(0,0,0,0.16) 0px, rgba(0,0,0,0.16) 2px, transparent 2px, transparent 5px)', opacity: strength}} />
    <AbsoluteFill style={{background: 'radial-gradient(ellipse at center, transparent 55%, rgba(0,0,0,0.45) 100%)', opacity: strength}} />
  </AbsoluteFill>
);

/** the speaker video, kept in sync with the global timeline */
export const Avatar: React.FC<{from: number; style?: React.CSSProperties}> = ({from, style}) => (
  <OffthreadVideo src={staticFile('avatar.mp4')} muted startFrom={from} style={{width: '100%', height: '100%', objectFit: 'cover', ...style}} />
);

export const TOP_H = 1130;

/** Mode B: game scene on top, avatar window bottom */
// bottom "pop-out" presenter window (person cut out, head breaks the top edge)
const WIN = {x: 60, y: 1390, w: 960, r: 54};
const VID = {w: 960, top: 950}; // 720x1280 source scaled to 960 wide
const VID_H = (VID.w * 1280) / 720;

export const Split: React.FC<{from: number; dur: number; children: React.ReactNode; label?: string}> = ({from, dur, children, label}) => {
  const fr = useCurrentFrame();
  const enter = spring({frame: fr, fps: FPS, config: {damping: 14}});
  const dy = interpolate(enter, [0, 1], [60, 0]);
  const vidStyle: React.CSSProperties = {position: 'absolute', left: 0, top: VID.top - WIN.y, width: VID.w, height: VID_H};
  // pop-out layer is visible above the window (full width) and inside the window, never beside it
  const clip = `polygon(0px 0px, 1080px 0px, 1080px ${WIN.y}px, ${WIN.x + WIN.w}px ${WIN.y}px, ${WIN.x + WIN.w}px 1920px, ${WIN.x}px 1920px, ${WIN.x}px ${WIN.y}px, 0px ${WIN.y}px)`;
  return (
    <AbsoluteFill style={{background: C.night}}>
      {/* dotted backdrop */}
      <AbsoluteFill style={{backgroundImage: `radial-gradient(${C.deep} 2.2px, transparent 2.6px)`, backgroundSize: '26px 26px', opacity: 0.9}} />
      <div style={{position: 'absolute', left: 0, top: 0, width: 1080, height: TOP_H, overflow: 'hidden'}}>
        {children}
        <CRT strength={0.8} />
        {label && (
          <Panel dark style={{left: 36, top: 40, padding: '8px 22px', fontSize: 34, letterSpacing: 2}}>{label}</Panel>
        )}
        {/* soft fade of the game scene into the backdrop, no hard line */}
        <div style={{position: 'absolute', left: 0, right: 0, bottom: 0, height: 220, background: `linear-gradient(180deg, transparent, ${C.night})`}} />
      </div>
      <AbsoluteFill style={{translate: `0px ${dy}px`}}>
        <div style={{position: 'absolute', left: WIN.x, top: WIN.y, width: WIN.w, height: 1920 - WIN.y + 80, borderRadius: WIN.r, overflow: 'hidden', boxShadow: '0 -10px 50px rgba(0,0,0,0.45)'}}>
          <OffthreadVideo src={staticFile('avatar.mp4')} muted startFrom={from} style={vidStyle} />
        </div>
        <AbsoluteFill style={{clipPath: clip}}>
          <OffthreadVideo src={staticFile('avatar_cut.webm')} transparent muted startFrom={from}
            style={{position: 'absolute', left: WIN.x, top: VID.top, width: VID.w, height: VID_H}} />
        </AbsoluteFill>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

export const Shake: React.FC<{at: number; children: React.ReactNode; amp?: number; len?: number}> = ({at, children, amp = 14, len = 10}) => {
  const fr = useCurrentFrame();
  const k = fr >= at && fr < at + len ? (1 - (fr - at) / len) * amp : 0;
  const dx = k ? Math.sin(fr * 7.3) * k : 0;
  const dy = k ? Math.cos(fr * 5.1) * k : 0;
  return <AbsoluteFill style={{translate: `${dx}px ${dy}px`}}>{children}</AbsoluteFill>;
};

export const Flash: React.FC<{at: number; color?: string; len?: number}> = ({at, color = '#fff', len = 6}) => {
  const fr = useCurrentFrame();
  const o = interpolate(fr, [at, at + 1, at + len], [0, 0.75, 0], clamp);
  return <AbsoluteFill style={{background: color, opacity: o, pointerEvents: 'none'}} />;
};

export const PixText: React.FC<{children: React.ReactNode; size: number; color?: string; style?: React.CSSProperties}> = ({children, size, color = C.cream, style}) => (
  <div style={{fontFamily: PIX, fontWeight: 700, fontSize: size, color, textShadow: `4px 4px 0 ${C.ink}, -2px -2px 0 ${C.ink}, 2px -2px 0 ${C.ink}, -2px 2px 0 ${C.ink}`, letterSpacing: 2, lineHeight: 1.05, ...style}}>{children}</div>
);

export {Easing};
