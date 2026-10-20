import React from 'react';
import {AbsoluteFill, Audio, Sequence, interpolate, staticFile, useCurrentFrame} from 'remotion';
import storyJson from '../story.json';
import type {Row, Story, Win, Word} from './types';
import {theme} from './theme';
import {useStoryFonts} from './fonts';
import {Backdrop, SceneZone, SpeakerFull, SpeakerWindow, ZONES} from './windows';
import {AnimText} from './textanim';
import {KineticText, LayerScene, PicInsert, Placeholder, pickFrame} from './inserts';
import {REG} from './registry';

/* Ролик целиком по раскадровке с пульта: src/story.json (tools/pult_to_story.py). */
export const STORY = storyJson as unknown as Story;
const FPS = STORY.fps || 30;
export const STORY_TOTAL = Math.max(1, Math.round(STORY.duration * FPS));
const SANS = "'InterTight', sans-serif";
const T = theme(STORY);
const AV = STORY.settings.avatar || 'avatar.mp4';
const CUT = STORY.settings.avatarCut || 'avatar_cut.webm';
const winOf = (r: Row): Win => (r.win || STORY.settings.win || 'popout') as Win;
const wordsIn = (r: Row) => STORY.words.filter((w) => w.s >= r.s - 0.05 && w.s < r.e - 0.02);

const ROWS = STORY.rows.map((r, i) => {
  const from = Math.round(r.s * FPS);
  const to = i < STORY.rows.length - 1 ? Math.round(STORY.rows[i + 1].s * FPS) : STORY_TOTAL;
  return {r, i, from, dur: Math.max(1, to - from)};
});
const rowAt = (fr: number) => ROWS.find((x) => fr >= x.from && fr < x.from + x.dur) || ROWS[ROWS.length - 1];

/* Содержимое сцены: B — зона сверху, C — весь кадр */
const Content: React.FC<{r: Row; from: number; dur: number; zoneH: number; full: boolean}> = ({r, from, dur, zoneH, full}) => {
  const ws = wordsIn(r);
  if (r.scene && REG[r.scene]) { const Sc = REG[r.scene]; return <Sc from={from} dur={dur} t0={r.s} row={r} words={ws} zoneH={zoneH} full={full} />; }
  const kind = r.kind || (full ? 'kinetic' : 'l2d');
  if ((kind === 'gen' || kind === 'media') && r.media) {
    const fr = r.frame && r.frame !== 'auto' ? r.frame : (kind === 'media' || kind === 'gen' ? pickFrame(r.note, r.media) : 'plain');
    return <PicInsert src={r.media} dur={dur} frame={fr} zoneH={zoneH} bg={T.bg} full={full} />;
  }
  if (kind === 'l2d' && r.layer && (r.layer.bg || r.layer.pose || r.layer.props?.length)) return <LayerScene layer={r.layer} zoneH={zoneH} dur={dur} />;
  if (kind === 'gen' || kind === 'media' || kind === 'l2d') return <Placeholder label={kind === 'l2d' ? '2D-сцена' : 'нет файла'} note={r.note || r.media} zoneH={zoneH} ink={T.ink} />;
  // kinetic, а также motion/d3 без своей сцены
  return <KineticText words={ws} seg0={r.s} fps={FPS} params={STORY.settings.titleAnim} ink={T.ink} accent={T.accent} h={zoneH} />;
};

const Segment: React.FC<{r: Row; from: number; dur: number}> = ({r, from, dur}) => {
  if (r.mode === 'A') return <SpeakerFull from={from} src={AV} />;
  if (r.mode === 'B') {
    const win = winOf(r); const h = ZONES[win].h;
    return <AbsoluteFill>
      <Backdrop bg={T.bg} dot={T.dot} />
      <SceneZone h={h} bg={T.bg}><Content r={r} from={from} dur={dur} zoneH={h} full={false} /></SceneZone>
      <SpeakerWindow win={win} from={from} src={AV} cut={CUT} bg={T.bg} />
    </AbsoluteFill>;
  }
  return <AbsoluteFill><Backdrop bg={T.bg} dot={T.dot} /><Content r={r} from={from} dur={dur} zoneH={1920} full /></AbsoluteFill>;
};

/* Субтитры: по умолчанию 2 слова, фразы по . , : ? !, без предлога вторым словом */
const SHORT = new Set(['в', 'с', 'и', 'а', 'на', 'за', 'из', 'у', 'со', 'не', 'к', 'о', 'от']);
const KEEP = /^(ии|сша|ai|gpt|claude)/i;
const bare = (w: string) => w.toLowerCase().replace(/[.,:?!«»"]/g, '');
const fmt = (w: string) => { let t = w.replace(/[.!?:—…]+$/, ''); if (!KEEP.test(t) && !/^[A-ZА-ЯЁ]{2,}$/.test(t)) t = t.toLowerCase(); return t; };
type Chunk = {ws: Word[]; text: string; s: number; e: number};
const CHUNKS: Chunk[] = (() => {
  const per = STORY.settings.subWords || STORY.settings.subAnim?.words_per_screen || 2;
  const phrases: Word[][] = []; let cur: Word[] = [];
  for (const w of STORY.words) { cur.push(w); if (/[.,:?!»…]$/.test(w.w)) { phrases.push(cur); cur = []; } }
  if (cur.length) phrases.push(cur);
  const out: Chunk[] = [];
  for (const p of phrases) {
    let i = 0;
    while (i < p.length) {
      const rest = p.length - i; let take = Math.min(per, rest);
      while (take > 1 && rest > take) { const last = bare(p[i + take - 1].w); if (SHORT.has(last) || /^\d+$/.test(last)) take--; else break; }
      const ws = p.slice(i, i + take);
      out.push({ws, text: ws.map((x) => fmt(x.w)).join(' '), s: ws[0].s, e: ws[ws.length - 1].e}); i += take;
    }
  }
  return out;
})();

const Captions: React.FC = () => {
  const fr = useCurrentFrame(); const t = fr / FPS;
  const ci = CHUNKS.findIndex((c, i) => { const next = CHUNKS[i + 1]?.s ?? c.e + 0.3; const end = next - c.e > 0.4 ? c.e + 0.15 : next; return t >= c.s && t < end; });
  if (ci < 0) return null;
  const ch = CHUNKS[ci]; const seg = rowAt(fr); const r = seg.r;
  const kind = r.kind || (r.mode === 'C' ? 'kinetic' : '');
  if (r.mode === 'C' && (kind === 'kinetic' || ((kind === 'motion' || kind === 'd3') && !(r.scene && REG[r.scene])))) return null; // текст уже на экране
  const win = winOf(r);
  const y = r.mode === 'A' ? 1500 : r.mode === 'C' ? 1540 : win === 'circle' ? 1350 : win === 'strip' ? 1160 : 1150;
  const p = STORY.settings.subAnim;
  const plate = r.mode !== 'B' || T.dark;
  const c0 = Math.round(ch.s * FPS);
  const color = STORY.settings.subColor || T.ink;
  return <div style={{position: 'absolute', left: 0, right: 0, top: y, translate: '0 -50%', textAlign: 'center'}}>
    <span style={{fontFamily: SANS, fontWeight: 700, fontSize: 56, letterSpacing: -1, color,
      ...(plate && !p?.box?.use ? {background: T.plate, padding: '6px 22px 10px', borderRadius: 18} : {})}}>
      {p && p.enter && p.enter !== 'cut'
        ? <Sequence from={c0} layout="none"><AnimText key={ci} text={ch.text} at={0} unitAt={p.unit === 'word' ? ch.ws.map((w) => Math.round((w.s - ch.s) * FPS)) : undefined} params={{...p, case: p.case || 'as_is'}} accent={T.accent} /></Sequence>
        : ch.text}
    </span>
  </div>;
};

/* Переход: цветная шторка-круг ±4 кадра на смене режима */
const CUTS = ROWS.slice(1).filter((x, k) => x.r.mode !== ROWS[k].r.mode || x.r.mode === 'C').map((x) => x.from);
const Wipe: React.FC = () => {
  const fr = useCurrentFrame();
  const b = CUTS.find((x) => Math.abs(fr - x) <= 4); if (b === undefined) return null;
  const rad = interpolate(Math.abs(fr - b), [0, 4], [1500, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const cols = [T.accent, T.dot, T.dark ? '#2A2D36' : '#FFD23F'];
  return <AbsoluteFill style={{pointerEvents: 'none'}}><div style={{position: 'absolute', left: 540 - rad, top: 960 - rad, width: rad * 2, height: rad * 2, borderRadius: '50%', background: cols[CUTS.indexOf(b) % 3], filter: 'blur(6px)'}} /></AbsoluteFill>;
};

export const StoryMain: React.FC = () => {
  useStoryFonts();
  return <AbsoluteFill style={{background: T.bg}}>
    {ROWS.map(({r, i, from, dur}) => <Sequence key={i} from={from} durationInFrames={dur}><Segment r={r} from={from} dur={dur} /></Sequence>)}
    <Captions />
    <Wipe />
    <Audio src={staticFile(AV)} />
  </AbsoluteFill>;
};
