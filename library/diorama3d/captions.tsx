// Субтитры по правилам reel-montage-popout: 2 слова, Inter Tight 700 56 px, без анимации.
import React from 'react';
import {useCurrentFrame} from 'remotion';
import {SANS, WORDS} from '../kit';

type Chunk = {text: string; s: number; e: number};
const SHORT = new Set(['в', 'с', 'и', 'а', 'на', 'за', 'из', 'у', 'со', 'не', 'к', 'о', 'от', 'по', 'для']);
const KEEP = /^(ии|сша)$/i;
const fmt = (w: string) => {
  const t = w.replace(/[.!?:—]+$/, '');
  return KEEP.test(t) ? t.toUpperCase() : t.toLowerCase();
};
const bare = (w: string) => w.toLowerCase().replace(/[.,:?!«»]/g, '');
export const CHUNKS: Chunk[] = (() => {
  const phrases: (typeof WORDS)[] = [];
  let cur: typeof WORDS = [];
  for (const w of WORDS) {
    cur.push(w);
    if (/[.,:?!»]$/.test(w.w)) { phrases.push(cur); cur = []; }
  }
  if (cur.length) phrases.push(cur);
  const out: Chunk[] = [];
  for (const p of phrases) {
    let i = 0;
    while (i < p.length) {
      const rest = p.length - i;
      let take = rest === 1 ? 1 : 2;
      const second = bare(p[i + 1]?.w ?? '');
      if (take === 2 && rest > 2 && (SHORT.has(second) || /^\d+$/.test(second))) take = 1;
      const ws = p.slice(i, i + take);
      out.push({text: ws.map((x) => fmt(x.w)).join(' '), s: ws[0].s, e: ws[ws.length - 1].e});
      i += take;
    }
  }
  return out;
})();

/** dark(t) — true, если сцена тёмная: белый текст с тенью вместо чёрного на плашке */
export const Captions: React.FC<{dark: (t: number) => boolean; y?: number}> = ({dark, y = 1500}) => {
  const t = useCurrentFrame() / 30;
  const ch = CHUNKS.find((c, i) => {
    const next = CHUNKS[i + 1]?.s ?? c.e + 0.3;
    const end = next - c.e > 0.4 ? c.e + 0.15 : next;
    return t >= c.s && t < end;
  });
  if (!ch) return null;
  const d = dark(t);
  return (
    <div style={{position: 'absolute', left: 0, right: 0, top: y, translate: '0 -50%', textAlign: 'center'}}>
      <span style={{
        fontFamily: SANS, fontWeight: 700, fontSize: 56, letterSpacing: -1,
        ...(d
          ? {color: '#FFFFFF', textShadow: '0 2px 10px rgba(0,0,0,0.55), 0 1px 2px rgba(0,0,0,0.6)'}
          : {color: '#1C1B22', background: 'rgba(244,241,234,0.94)', padding: '6px 22px 10px', borderRadius: 18}),
      }}>{ch.text}</span>
    </div>
  );
};
