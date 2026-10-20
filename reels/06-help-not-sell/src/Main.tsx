import React from 'react';
import {AbsoluteFill, Audio, Sequence, interpolate, staticFile, useCurrentFrame} from 'remotion';
import {C, SANS, TOTAL, WORDS, clamp, useFonts, wf} from './kit';
import {BOUNDS, MODES, NO_WIPE, SCENES} from './Scenes';

const B = [...BOUNDS(), TOTAL];

// ---------- captions: 2 words, hard cut (textanim «Резкая смена подписи»), black on the white sheet ----------
type Chunk = {text: string; s: number; e: number};
const SHORT = new Set(['в', 'с', 'и', 'а', 'на', 'за', 'из', 'у', 'со', 'не', 'к', 'о', 'от']);
const fmt = (w: string) => w.replace(/[«»]/g, '').replace(/[.!?:—]/g, '').toLowerCase();
const bare = (w: string) => w.toLowerCase().replace(/[.,:?!«»]/g, '');
const CHUNKS: Chunk[] = (() => {
  const phrases: (typeof WORDS)[] = [];
  let cur: typeof WORDS = [];
  for (const w of WORDS) {
    cur.push(w);
    if (/[.,:?!»]+$/.test(w.w)) { phrases.push(cur); cur = []; }
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
  return (
    <div style={{position: 'absolute', left: 0, right: 0, top: y, translate: '0 -50%', textAlign: 'center'}}>
      <span style={{fontFamily: SANS, fontWeight: 700, fontSize: 56, letterSpacing: -1, color: C.ink,
        textShadow: '0 0 12px #fff, 0 0 4px #fff'}}>{ch.text}</span>
    </div>
  );
};

// ---------- transition: soft colour blob wipe ----------
const BlobWipe: React.FC = () => {
  const fr = useCurrentFrame();
  const b = B.slice(1, -1).find((x, i) => Math.abs(fr - x) <= 3 && !NO_WIPE.includes(i + 1));
  if (b === undefined) return null;
  const d = fr - b;
  const r = interpolate(Math.abs(d), [0, 3], [1300, 0], clamp);
  const cols = [C.blue, C.yellow, C.blue, C.violet];
  const col = cols[B.indexOf(b) % 3];
  return (
    <AbsoluteFill style={{pointerEvents: 'none'}}>
      <div style={{position: 'absolute', left: 540 - r, top: 960 - r, width: r * 2, height: r * 2, borderRadius: '50%', background: col, filter: 'blur(6px)'}} />
    </AbsoluteFill>
  );
};

// ---------- sfx (quiet) ----------
const sfx: [string, number, number][] = (() => {
  const L: [string, number, number][] = [];
  B.slice(1, -1).forEach((b, i) => { if (!NO_WIPE.includes(i + 1)) L.push(['whoosh', b - 5, 0.08]); });
  for (let k = 0; k < 8; k++) L.push(['type', wf('вопроса') + k * 2, 0.07]);
  L.push(['pop', wf('не'), 0.1], ['click', wf('продать'), 0.16]);
  for (let k = 0; k < 6; k++) L.push(['tick', wf('продать') + 4 + k * 2, 0.05]);
  L.push(['thud', wf('продать') + 14, 0.1]);
  for (let k = 0; k < 8; k++) L.push(['type', wf('вопроса', 1) - 2 + k * 2, 0.07]);
  L.push(['pop', wf('кому'), 0.1], ['pop', wf('могу'), 0.1], ['ding', wf('помочь') + 2, 0.1]);
  for (let k = 0; k < 4; k++) L.push(['pop', wf('люди') + k * 3, 0.08]);
  for (let k = 0; k < 4; k++) L.push(['pop', wf('им') + k * 3, 0.08]);
  for (let k = 0; k < 8; k++) L.push(['click', wf('продавали') - 4 + k * 2, 0.07]);
  L.push(['swish', wf('они') + 2, 0.08]);
  for (let k = 0; k < 5; k++) L.push(['type', wf('чтобы', 1) + k * 2, 0.06]);
  L.push(['pop', wf('понимали'), 0.1]);
  L.push(['swish', wf('бренды') + 4, 0.08], ['click', wf('осознают'), 0.14], ['success', wf('осознают') + 2, 0.08]);
  L.push(['buzz', wf('перестают') + 2, 0.05], ['thud', wf('бороться'), 0.1], ['swish', wf('за'), 0.1]);
  for (let k = 0; k < 10; k++) L.push(['tick', wf('начинают') + k * 3, 0.05]);
  L.push(['click', wf('заслуживать') + 4, 0.1], ['ding', wf('доверие'), 0.1]);
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
