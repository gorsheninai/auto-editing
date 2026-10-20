import React from 'react';
import {AbsoluteFill, Audio, Sequence, interpolate, staticFile, useCurrentFrame} from 'remotion';
import {C, SANS, TOTAL, WORDS, clamp, useFonts, wf} from './kit';
import {BOUNDS, MODES, SCENES} from './Scenes';

const B = [...BOUNDS(), TOTAL];

// ---------- captions: strictly 2 words, static, black ----------
type Chunk = {text: string; s: number; e: number};
const SHORT = new Set(['в', 'с', 'и', 'а', 'на', 'за', 'из', 'у', 'со', 'не', 'к', 'о', 'от']);
const KEEP = /^(ии|сша|«монтаж»)/i;
const fmt = (w: string) => {
  let t = w.replace(/[.!?:—]+$/, '');
  if (/^«монтаж»/i.test(t)) return '«МОНТАЖ»';
  if (!KEEP.test(t)) t = t.toLowerCase();
  return t;
};
const bare = (w: string) => w.toLowerCase().replace(/[.,:?!«»]/g, '');
const CHUNKS: Chunk[] = (() => {
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

const sceneAt = (fr: number) => {
  for (let i = 0; i < MODES.length; i++) if (fr >= B[i] && fr < B[i + 1]) return i;
  return MODES.length - 1;
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
  const i = sceneAt(fr);
  const mode = MODES[i];
  const y = mode === 'B' ? 1150 : mode === 'A' ? 1500 : 1560;
  const onDark = mode === 'A';
  return (
    <div style={{position: 'absolute', left: 0, right: 0, top: y, translate: '0 -50%', textAlign: 'center'}}>
      <span style={{
        fontFamily: SANS, fontWeight: 700, fontSize: 56, letterSpacing: -1, color: C.ink,
        ...(onDark || mode === 'C'
          ? {background: 'rgba(244,241,234,0.94)', padding: '6px 22px 10px', borderRadius: 18}
          : {textShadow: '0 1px 0 rgba(255,255,255,0.7)'}),
      }}>{ch.text}</span>
    </div>
  );
};

// ---------- transition: soft colour blob wipe ----------
const BlobWipe: React.FC = () => {
  const fr = useCurrentFrame();
  const b = B.slice(1, -1).find((x) => Math.abs(fr - x) <= 4);
  if (b === undefined) return null;
  const d = fr - b; // -4..4
  const r = interpolate(Math.abs(d), [0, 4], [1500, 0], clamp);
  const cols = [C.lav, C.violet, C.orange];
  const col = cols[B.indexOf(b) % 3];
  return (
    <AbsoluteFill style={{pointerEvents: 'none'}}>
      <div style={{position: 'absolute', left: 540 - r, top: 960 - r, width: r * 2, height: r * 2, borderRadius: '50%', background: col, filter: 'blur(6px)'}} />
    </AbsoluteFill>
  );
};

// ---------- sfx ----------
const sfx: [string, number, number][] = (() => {
  const L: [string, number, number][] = [];
  B.slice(1, -1).forEach((b) => L.push(['whoosh', b - 6, 0.16]));
  ['образование', 'стажировка', 'развитие', 'рост'].forEach((w) => L.push(['pop', wf(w), 0.2]));
  L.push(['swish', wf('но') + 2, 0.2], ['thud', wf('но') + 4, 0.25]);
  L.push(['tick', wf('обучиться') + 6, 0.15], ['tick', wf('обучиться') + 16, 0.15], ['tick', wf('обучиться') + 26, 0.15]);
  for (let k = 0; k < 6; k++) L.push(['pop', wf('быстрее') + k * 3, 0.12]);
  L.push(['thud', wf('дешёвый'), 0.2]);
  L.push(['click', wf('120'), 0.2]);
  for (let k = 0; k < 16; k += 3) L.push(['tick', wf('120') + 12 + k * 2, 0.1]);
  L.push(['ding', wf('изменилась'), 0.2]);
  L.push(['swish', wf('поэтому') + 2, 0.22]);
  ['ставить', 'выбирать', 'подключать', 'контролировать'].forEach((w) => L.push(['pop', wf(w), 0.2]));
  L.push(['click', wf('стыке'), 0.25], ['ding', wf('придумывать'), 0.2]);
  L.push(['pop', wf('хорошую'), 0.2], ['thud', wf('плохой'), 0.2]);
  for (let k = 0; k < 4; k++) L.push(['type', wf('кстати') + 14 + k * 4, 0.12]);
  L.push(['success', wf('монтаж'), 0.22]);
  return L;
})();

export const Main: React.FC = () => {
  useFonts();
  return (
    <AbsoluteFill style={{background: C.cream}}>
      {SCENES.map((Sc, i) => (
        <Sequence key={i} from={B[i]} durationInFrames={B[i + 1] - B[i]}>
          <Sc from={B[i]} dur={B[i + 1] - B[i]} />
        </Sequence>
      ))}
      <Captions />
      <BlobWipe />
      <Audio src={staticFile('avatar.mp4')} />
      {sfx.map(([n, at, v], i) => (
        <Sequence key={`s${i}`} from={Math.max(0, at)} durationInFrames={45}>
          <Audio src={staticFile(`sfx/${n}.wav`)} volume={v} />
        </Sequence>
      ))}
    </AbsoluteFill>
  );
};
