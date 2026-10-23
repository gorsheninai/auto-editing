import React from 'react';
import {AbsoluteFill, Img, interpolate, random, staticFile, useCurrentFrame} from 'remotion';
import {SANS, SERIF, clamp, pop, rad, shd} from '../blocks/kit';
import type {SceneProps} from './registry';

/* «Красный неон»: двухъярусный заголовок над головой спикера.
   Тезис — белая строка курсивом из размытия; ниже огромная красная неоновая строка, буквы собираются вразнобой.
   big меняется по времени (bigAt — кадр от начала сегмента), под заголовком мелко в скобках — текущее слово речи. */
const RED = '#F32239', RED2 = '#911518';
const neonShadow = (k = 1) => `0 0 ${6 * k}px rgba(255,120,135,.9), 0 0 ${18 * k}px ${RED}, 0 0 ${42 * k}px ${RED}, 0 0 ${80 * k}px ${RED2}`;
const clean = (w: string) => w.replace(/[.,:;!?—…«»"]/g, '');

const NeonWord: React.FC<{text: string; at: number; size: number; seed: string}> = ({text, at, size, seed}) => {
  const f = useCurrentFrame();
  const chars = [...text];
  return <div style={{fontFamily: SANS, fontWeight: 800, fontSize: size, lineHeight: 0.92, letterSpacing: -size * 0.03, color: '#FFE9EC', whiteSpace: 'nowrap', textAlign: 'center'}}>
    {chars.map((c, i) => {
      const d = Math.floor(random(`${seed}-${i}`) * 7);            // вразнобой, в пределах ~0,23 с
      const k = interpolate(f, [at + d, at + d + 4], [0, 1], clamp);
      const flick = f - at - d < 7 && random(`${seed}-f-${i}-${f}`) < 0.18 ? 0.35 : 1; // неон «зажигается» с мерцанием
      const dy = (1 - k) * (random(`${seed}-y-${i}`) - 0.5) * size * 0.6;
      return <span key={i} style={{display: 'inline-block', opacity: k * flick, translate: `0 ${dy}px`, scale: String(1.25 - 0.25 * k), filter: `blur(${(1 - k) * 10}px)`,
        textShadow: neonShadow(size / 150), WebkitTextStroke: `${Math.max(1, size / 70)}px ${RED}`, minWidth: c === ' ' ? size * 0.28 : undefined}}>{c}</span>;
    })}
  </div>;
};

export type NeonSpec = {top?: string; big: string[]; bigAt?: number[]; outAt?: number; y?: number};
export const NeonTitle: React.FC<{spec: NeonSpec; words: {w: string; f: number}[]; dur: number}> = ({spec, words, dur}) => {
  const f = useCurrentFrame();
  const at = spec.bigAt || spec.big.map((_, i) => (i === 0 ? 3 : 999));
  const end = Math.min(dur, spec.outAt ?? dur);
  const topIn = interpolate(f, [0, 6], [0, 1], clamp);
  const out = interpolate(f, [end - 6, end - 1], [0, 1], clamp);
  if (f >= end) return null;
  let bi = -1; at.forEach((a, i) => { if (f >= a) bi = i; });
  const big = bi >= 0 ? spec.big[bi] : '';
  const bigOut = bi >= 0 && bi < spec.big.length - 1 ? interpolate(f, [at[bi + 1] - 3, at[bi + 1]], [0, 1], clamp) : 0; // смена неона — уход размытием
  const size = big ? Math.min(180, 940 / Math.max(1, big.length * 0.8)) : 0;
  let cur = ''; for (const w of words) if (f >= w.f) cur = clean(w.w);
  const y = spec.y ?? 150;
  return <div style={{position: 'absolute', left: 0, right: 0, top: y, display: 'flex', flexDirection: 'column', alignItems: 'center', filter: `blur(${out * 24}px)`, opacity: 1 - out}}>
    {spec.top ? <div style={{fontFamily: SERIF, fontStyle: 'italic', fontWeight: 600, fontStretch: '80%', fontSize: 66, lineHeight: 1, color: '#F4F3F5', marginBottom: 10,
      filter: `blur(${(1 - topIn) * 18}px)`, opacity: topIn, textShadow: '0 3px 18px rgba(0,0,0,.6)'}}>{spec.top}</div> : null}
    {big ? <div style={{filter: `blur(${bigOut * 20}px)`, opacity: 1 - bigOut}}><NeonWord key={bi} text={big} at={at[bi]} size={size} seed={big} /></div> : <div style={{height: 150}} />}
    {cur ? <div style={{marginTop: 26, fontFamily: SANS, fontWeight: 800, fontSize: 42, letterSpacing: 1, color: '#F4F3F5', textTransform: 'uppercase', textShadow: '0 2px 12px rgba(0,0,0,.6)'}}>[{cur}]</div> : null}
  </div>;
};

/* PROOF: скруглённая карточка-доказательство влетает с пружиной в угол над плечом */
export const ProofCard: React.FC<{src: string; at: number; label?: string}> = ({src, at, label}) => {
  const f = useCurrentFrame();
  if (f < at) return null;
  const k = pop(f, 30, at, 11);
  return <div style={{position: 'absolute', right: 56, top: 760, width: 330, rotate: `${(1 - k) * 14 + 4}deg`, translate: `${(1 - k) * 420}px ${(1 - k) * -120}px`, scale: String(0.6 + 0.4 * k)}}>
    <div style={{borderRadius: rad(28), overflow: 'hidden', border: `4px solid ${RED}`, boxShadow: shd(`0 0 30px ${RED}88, 0 24px 60px rgba(0,0,0,.6)`), aspectRatio: '2 / 3'}}>
      <Img src={staticFile(src)} style={{width: '100%', height: '100%', objectFit: 'cover'}} />
    </div>
    {label ? <div style={{marginTop: 12, textAlign: 'center', fontFamily: SANS, fontWeight: 800, fontSize: 34, color: '#F4F3F5', textShadow: '0 2px 12px rgba(0,0,0,.7)'}}>{label}</div> : null}
  </div>;
};

/* Смартфон кодом (картинки iPhone нет в материалах): тёмное стекло, красный отблеск по ребру, без логотипа */
export const PhoneShot: React.FC<SceneProps> = ({dur}) => {
  const f = useCurrentFrame();
  const k = pop(f, 30, 0, 14);
  const sweep = interpolate(f, [4, dur], [-60, 160], clamp);
  return <AbsoluteFill style={{background: 'radial-gradient(ellipse at 50% 38%, #3A1418 0%, #160D0F 45%, #0A0809 100%)', alignItems: 'center', justifyContent: 'center'}}>
    {/* отражение на стеклянной поверхности */}
    <div style={{position: 'absolute', left: 0, right: 0, top: 1380, bottom: 0, background: 'linear-gradient(180deg, rgba(243,34,57,.10), rgba(0,0,0,0) 60%)'}} />
    <div style={{width: 560, height: 1140, borderRadius: 96, translate: `0 ${(1 - k) * 120}px`, rotate: `${-8 + (1 - k) * -10}deg`, scale: String(0.9 + 0.1 * k), position: 'relative',
      background: 'linear-gradient(150deg, #2B2A30 0%, #121116 40%, #050507 100%)', boxShadow: `inset 0 0 0 6px #3B3A41, inset 0 0 0 8px #0B0B0D, 26px 0 0 -14px ${RED}, 0 0 80px ${RED}55, 0 60px 120px rgba(0,0,0,.8)`}}>
      {/* блок камер */}
      <div style={{position: 'absolute', left: 44, top: 44, width: 230, height: 230, borderRadius: 64, background: 'linear-gradient(145deg, #232227, #0E0E11)', boxShadow: 'inset 0 0 0 3px #34333A'}}>
        {[[30, 30], [120, 72], [30, 120]].map(([x, y], i) => <div key={i} style={{position: 'absolute', left: x, top: y, width: 82, height: 82, borderRadius: '50%', background: 'radial-gradient(circle at 40% 38%, #3C4A66 0%, #0B0E16 45%, #000 70%)', boxShadow: 'inset 0 0 0 7px #2A2930, 0 0 0 2px #000'}} />)}
        <div style={{position: 'absolute', left: 168, top: 26, width: 30, height: 30, borderRadius: '50%', background: '#E8E1D0', opacity: 0.85}} />
      </div>
      {/* блик стекла */}
      <div style={{position: 'absolute', inset: 0, borderRadius: 96, overflow: 'hidden'}}>
        <div style={{position: 'absolute', top: -200, left: `${sweep}%`, width: 160, height: 1600, rotate: '24deg', background: 'linear-gradient(90deg, rgba(255,255,255,0), rgba(255,255,255,.16), rgba(255,255,255,0))'}} />
      </div>
      {/* красное ребро */}
      <div style={{position: 'absolute', right: -6, top: 60, bottom: 60, width: 8, borderRadius: 8, background: RED, boxShadow: `0 0 24px ${RED}, 0 0 60px ${RED}`}} />
    </div>
  </AbsoluteFill>;
};

/* TxtCenterBuild ролика: цитата собирается по центру в ритм речи (по таймингам слов), слово «мы» — красным неоном */
export const QuoteBuild: React.FC<SceneProps> = ({words, t0}) => {
  const f = useCurrentFrame();
  const ws = words.map((w) => ({t: clean(w.w).toUpperCase(), at: Math.round((w.s - t0) * 30), red: /^мы$/i.test(clean(w.w))}));
  const lines = [ws.slice(0, 3), ws.slice(3, 4), ws.slice(4)];
  return <AbsoluteFill style={{background: 'radial-gradient(ellipse at 50% 45%, #241416 0%, #0F0C0D 70%)', alignItems: 'center', justifyContent: 'center'}}>
    <div style={{position: 'absolute', top: 470, fontFamily: SERIF, fontStyle: 'italic', fontWeight: 300, fontSize: 260, color: RED, opacity: 0.55, textShadow: neonShadow(1)}}>«</div>
    <div style={{display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6}}>
      {lines.map((ln, li) => <div key={li} style={{display: 'flex', gap: 28, justifyContent: 'center'}}>
        {ln.map((w, i) => {
          const k = pop(f, 30, w.at - 1, 13); if (f < w.at - 1) return null;
          const size = 118;
          return <span key={i} style={{fontFamily: SANS, fontWeight: 800, fontSize: size, letterSpacing: -3, lineHeight: 1.05, display: 'inline-block',
            translate: `${(1 - k) * 90}px 0`, opacity: Math.min(1, k * 1.5), filter: `blur(${(1 - Math.min(1, k)) * 8}px)`,
            color: w.red ? '#FFE9EC' : '#F4F3F5', textShadow: w.red ? neonShadow(0.9) : '0 4px 24px rgba(0,0,0,.5)', WebkitTextStroke: w.red ? `2px ${RED}` : undefined}}>{w.t}</span>;
        })}
      </div>)}
    </div>
  </AbsoluteFill>;
};
