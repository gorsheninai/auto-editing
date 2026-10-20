import React from 'react';
import {AbsoluteFill, Audio, Sequence, interpolate, staticFile, useCurrentFrame} from 'remotion';
import {C, SANS, WORDS, clamp, f, useFonts, wf} from './kit';
import {
  S1Hook, S2Loading, S3Studio, S4Versus, S5Item, S6Inventory, S7Grind, S8LevelUp,
  S9Chart, S10Rare, S11Clones, S12Select, S13Booklet, S14Cta,
} from './Scenes';

export const TOTAL = Math.ceil(43.7 * 30);

type Mode = 'A' | 'B' | 'C';
// scene boundaries in frames
const B = [0, wf('загружают'), wf('а'), wf('пока'), wf('remotion'), wf('описываешь'), wf('больше', 1), wf('порог'), wf('из-за'), wf('всё'), wf('одинаковые'), wf('пока', 1), wf('хочешь'), wf('пиши'), TOTAL];
const MODES: Mode[] = ['A', 'C', 'B', 'B', 'C', 'B', 'B', 'C', 'B', 'C', 'B', 'C', 'B', 'A'];

const scene = (i: number) => {
  const from = B[i];
  const dur = B[i + 1] - B[i];
  switch (i) {
    case 0: return <S1Hook />;
    case 1: return <S2Loading dur={dur} />;
    case 2: return <S3Studio from={from} dur={dur} />;
    case 3: return <S4Versus from={from} dur={dur} />;
    case 4: return <S5Item from={from} dur={dur} />;
    case 5: return <S6Inventory from={from} dur={dur} />;
    case 6: return <S7Grind from={from} dur={dur} />;
    case 7: return <S8LevelUp dur={dur} />;
    case 8: return <S9Chart from={from} dur={dur} />;
    case 9: return <S10Rare from={from} dur={dur} />;
    case 10: return <S11Clones from={from} dur={dur} />;
    case 11: return <S12Select from={from} dur={dur} />;
    case 12: return <S13Booklet from={from} dur={dur} />;
    default: return <S14Cta from={from} />;
  }
};

// ---------- captions: strictly 2 words, static, white ----------
type Chunk = {text: string; s: number; e: number};
const SHORT = new Set(['в', 'с', 'и', 'а', 'на', 'за', 'из', 'у', 'со', 'не']);
const KEEP_CASE = /^(remotion|claude|code|ии|«монтаж»)/i;
const fmt = (w: string) => {
  let t = w.replace(/[.!?—]+$/, '').replace(/\?$/, '');
  if (!KEEP_CASE.test(t)) t = t.toLowerCase();
  else if (/^«монтаж»/i.test(t)) t = '«МОНТАЖ»';
  return t;
};
const bare = (w: string) => w.toLowerCase().replace(/[.,?!«»]/g, '');
export const CHUNKS: Chunk[] = (() => {
  // split into phrases at punctuation (sentence ends and commas)
  const phrases: (typeof WORDS)[] = [];
  let cur: typeof WORDS = [];
  for (const w of WORDS) {
    if (w.w === '—') continue;
    cur.push(w);
    if (/[.,?!»]$/.test(w.w)) { phrases.push(cur); cur = []; }
  }
  if (cur.length) phrases.push(cur);
  const out: Chunk[] = [];
  for (const p of phrases) {
    let i = 0;
    while (i < p.length) {
      const rest = p.length - i;
      let take = rest === 1 ? 1 : 2;
      // a short function word never ends a chunk: it moves to the next one
      if (take === 2 && rest > 2 && SHORT.has(bare(p[i + 1].w))) take = 1;
      const ws = p.slice(i, i + take);
      out.push({text: ws.map((x) => fmt(x.w)).join(' '), s: ws[0].s, e: ws[ws.length - 1].e});
      i += take;
    }
  }
  return out;
})();

const modeAt = (fr: number): {mode: Mode; idx: number} => {
  for (let i = 0; i < MODES.length; i++) if (fr >= B[i] && fr < B[i + 1]) return {mode: MODES[i], idx: i};
  return {mode: 'A', idx: MODES.length - 1};
};

const Captions: React.FC = () => {
  const fr = useCurrentFrame();
  const t = fr / 30;
  const ch = CHUNKS.find((c, i) => {
    const next = CHUNKS[i + 1]?.s ?? c.e + 0.3;
    const end = next - c.e > 0.4 ? c.e + 0.15 : next;
    return t >= c.s && t < end;
  });
  if (!ch) return null;
  const {mode, idx} = modeAt(fr);
  const y = mode === 'B' ? 1150 : idx === 11 ? 1640 : 1480;
  return (
    <div style={{
      position: 'absolute', left: 40, right: 40, top: y, translate: '0 -50%', textAlign: 'center',
      fontFamily: SANS, fontWeight: 700, fontSize: 56, letterSpacing: -1, color: '#fff',
      textShadow: '0 2px 14px rgba(0,0,0,0.75), 0 0 3px rgba(0,0,0,0.6)',
    }}>{ch.text}</div>
  );
};

// ---------- transition: pixel block wipe ----------
const PixelWipe: React.FC = () => {
  const fr = useCurrentFrame();
  const b = B.slice(1, -1).find((x) => Math.abs(fr - x) <= 3);
  if (b === undefined) return null;
  const d = fr - b; // -3..3
  const cols = 9, rows = 16;
  const cells = [];
  for (let r = 0; r < rows; r++)
    for (let c = 0; c < cols; c++) {
      const h = Math.abs(Math.sin((r * 31 + c * 17) * 12.9898) * 43758.5453) % 1;
      const on = d < 0 ? h < (d + 4) / 4 : h > d / 4;
      if (on) cells.push(<div key={`${r}-${c}`} style={{position: 'absolute', left: c * 120, top: r * 120, width: 121, height: 121, background: (r + c) % 3 ? C.deep : C.night}} />);
    }
  return <AbsoluteFill>{cells}</AbsoluteFill>;
};

// ---------- sfx ----------
const sfx: [string, number, number][] = (() => {
  const L: [string, number, number][] = [];
  B.slice(1, -1).forEach((b) => L.push(['whoosh', b - 4, 0.18]));
  L.push(['tick', B[1] + 2, 0.2], ['tick', B[1] + 12, 0.2], ['tick', B[1] + 22, 0.2], ['confirm', B[2] - 8, 0.18]);
  L.push(['pickup', wf('уровне'), 0.18], ['pickup', wf('продакшенов'), 0.18], ['select', wf('каждый', 1), 0.2]);
  L.push(['hit', wf('спорили') - 4, 0.35], ['select', wf('уже'), 0.2]);
  L.push(['pickup', B[4] + 2, 0.22], ['confirm', wf('30'), 0.22]);
  for (let k = B[5] + 4; k < wf('собирает'); k += 4) L.push(['type', k, 0.1]);
  ['описываешь', 'собирает', 'съёмок', 'нарезает', 'субтитры', 'анимацию', 'графику', 'звук'].forEach((w) => L.push(['pickup', wf(w), 0.14]));
  L.push(['error', B[6] + 6, 0.12]);
  L.push(['levelup', B[7], 0.25]);
  L.push(['select', wf('не', 1), 0.2]);
  ['идеи', 'вкус', 'реализация'].forEach((w) => L.push(['pickup', wf(w), 0.2]));
  L.push(['error', wf('надоедят'), 0.18], ['whoosh', wf('пролистывать'), 0.25]);
  for (let k = B[11]; k < wf('свой') - 4; k += 6) L.push(['select', k, 0.12]);
  L.push(['confirm', wf('свой'), 0.25]);
  L.push(['pickup', wf('claude code', 1), 0.15], ['pickup', wf('remotion', 1), 0.15]);
  L.push(['confirm', wf('монтаж', 1), 0.25]);
  return L;
})();

export const Main: React.FC = () => {
  useFonts();
  return (
    <AbsoluteFill style={{background: C.night}}>
      {MODES.map((_, i) => (
        <Sequence key={i} from={B[i]} durationInFrames={B[i + 1] - B[i]}>
          {scene(i)}
        </Sequence>
      ))}
      <Captions />
      <PixelWipe />
      <Audio src={staticFile('avatar.mp4')} />
      {sfx.map(([n, at, v], i) => (
        <Sequence key={`s${i}`} from={Math.max(0, at)} durationInFrames={45}>
          <Audio src={staticFile(`sfx/${n}.wav`)} volume={v} />
        </Sequence>
      ))}
    </AbsoluteFill>
  );
};
