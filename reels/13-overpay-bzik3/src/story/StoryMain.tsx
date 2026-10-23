import React from 'react';
import {AbsoluteFill, Audio, Sequence, interpolate, staticFile, useCurrentFrame} from 'remotion';
import {TransitionSeries, linearTiming} from '@remotion/transitions';
import storyJson from '../story.json';
import type {Row, Story, Win, Word} from './types';
import {theme} from './theme';
import {useStoryFonts} from './fonts';
import {Backdrop, SceneZone, SpeakerFull, SpeakerWindow, ZONES} from './windows';
import {AnimText} from './textanim';
import {KineticText, LayerScene, PicInsert, Placeholder, pickFrame} from './inserts';
import {REG} from './registry';
import {SUBS, isSubCode, pickKeywords, toCaptions} from '../blocks/subs';
import {BgGrain, FxConfetti, FxVhs, Overlay, TRANSITIONS} from '../blocks/text-fx';
import {ProgressBar, Punch, Shake} from '../blocks/essentials';
import {Flash, FreezeAt} from '../blocks/shotcraft';
import {SANS as KSANS, themeFrom} from '../blocks/kit';
import {STY, fontVars, setPassport} from '../blocks/style';
import {BgPaper} from '../blocks/text-fx';
import {BgSwap, FxGrade, StackBuild} from '../blocks/kino';
import {NeonTitle, ProofCard} from './neon';

/* Ролик целиком по раскадровке с пульта: src/story.json (tools/pult_to_story.py). */
export const STORY = storyJson as unknown as Story;
const FPS = STORY.fps || 30;
export const STORY_TOTAL = Math.max(1, Math.round(STORY.duration * FPS));
setPassport(STORY.settings.passport);
const SANS = KSANS;
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
  if (r.scene && REG[r.scene]) { const Sc = REG[r.scene]; return <Sc from={from} dur={dur} t0={r.s} row={r} words={ws} zoneH={zoneH} full={full} theme={T} allWords={STORY.words} speaker={{src: AV, from}} />; }
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

/* Вставка на весь экран: медленная «камера» (наезд по спецификации) и зерно поверх графики */
const InsertCam: React.FC<{dur: number; children: React.ReactNode}> = ({dur, children}) => {
  const f = useCurrentFrame(); const z = STORY.settings.insertZoomPerS || 0; const g = STORY.settings.insertGrain || 0;
  return <AbsoluteFill style={{overflow: 'hidden'}}>
    <AbsoluteFill style={{scale: String(1 + z * (f / FPS))}}>{children}</AbsoluteFill>
    {g ? <AbsoluteFill style={{backgroundImage: GRAIN_TEX, opacity: g, mixBlendMode: 'overlay', backgroundPosition: `${(f * 37) % 240}px ${(f * 53) % 240}px`}} /> : null}
  </AbsoluteFill>;
};
const GRAIN_TEX = `url("data:image/svg+xml;utf8,${encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="240" height="240"><filter id="n"><feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" stitchTiles="stitch"/></filter><rect width="100%" height="100%" filter="url(#n)"/></svg>')}")`;
/* Подложка: точки или живой градиент (settings.backdrop = 'BgGrain') */
const TEX = STORY.settings.backdrop === 'BgGrain' ? 'grain' : STORY.settings.passport?.texture || 'dots';
const Bg: React.FC = () => TEX === 'grain' ? <BgGrain theme={themeFrom(T)} /> : TEX === 'paper' ? <BgPaper theme={themeFrom(T)} /> : TEX === 'clean' ? <AbsoluteFill style={{background: T.bg}} /> : <Backdrop bg={T.bg} dot={T.dot} />;
const SegmentBody: React.FC<{r: Row; from: number; dur: number}> = ({r, from, dur}) => {
  if (r.mode === 'A') return r.fx === 'BgSwap' ? <BgSwap from={from} cut={CUT} bg={r.fxText} /> : r.crop && r.crop !== 1 ? <AbsoluteFill style={{scale: String(r.crop), transformOrigin: '50% 34%'}}><SpeakerFull from={from} src={AV} /></AbsoluteFill> : <SpeakerFull from={from} src={AV} />;
  if (r.mode === 'B') {
    const win = winOf(r); const h = ZONES[win].h;
    return <AbsoluteFill>
      <Bg />
      <SceneZone h={h} bg={T.bg}><Content r={r} from={from} dur={dur} zoneH={h} full={false} /></SceneZone>
      <SpeakerWindow win={win} from={from} src={AV} cut={CUT} bg={T.bg} />
    </AbsoluteFill>;
  }
  return <AbsoluteFill><Bg /><InsertCam dur={dur}><Content r={r} from={from} dur={dur} zoneH={1920} full /></InsertCam></AbsoluteFill>;
};
/* Сегмент + эффект (fx) + рукописные пометки (ov). lead — на сколько кадров сегмент начат раньше из-за перехода */
const Segment: React.FC<{r: Row; from: number; dur: number; lead?: number}> = ({r, from, dur, lead = 0}) => {
  let body = <SegmentBody r={r} from={from} dur={dur} />;
  /* наезды: на ударных словах в режиме A (настройка punch) или по коду FxPunch */
  if ((STORY.settings.punch && r.mode === 'A') || r.fx === 'FxPunch') {
    const hits = wordsIn(r).filter((w) => KEYSET.has(bareW(w.w))).map((w) => Math.round((w.s - r.s) * FPS) + lead);
    body = <Punch at={hits.length ? hits : [lead + 2]}>{body}</Punch>;
  }
  if (r.fx === 'FxShake') body = <Shake at={lead + 3}>{body}</Shake>;
  if (r.fx === 'FxFlash') body = <Flash at={lead + 4}>{body}</Flash>;
  if (r.fx === 'FxFreeze') body = <FreezeAt at={lead + Math.min(20, Math.round(dur * 0.4))} text={r.fxText} theme={themeFrom(T)}>{body}</FreezeAt>;
  return <AbsoluteFill>
    {r.fx === 'FxVhs' ? <FxVhs>{body}</FxVhs> : r.fx === 'FxGrade' ? <FxGrade mode={r.fxText}>{body}</FxGrade> : r.grade ? <FxGrade mode={r.grade}>{body}</FxGrade> : body}
    {r.stack ? <StackBuild items={r.stack.map((x) => ({w: STORY.words[x.w]?.w || '', f: Math.round(((STORY.words[x.w]?.s ?? r.s) - r.s) * FPS) + lead, big: !!x.big}))} /> : null}
    {r.proof ? <ProofCard src={r.proof.src} label={r.proof.label} at={Math.round((r.proof.at - r.s) * FPS) + lead} /> : null}
    {r.hook ? <NeonTitle spec={{top: r.hook.top, big: r.hook.big, bigAt: r.hook.bigAt?.map((t) => Math.round((t - r.s) * FPS) + lead), outAt: r.hook.outAt !== undefined ? Math.round((r.hook.outAt - r.s) * FPS) + lead : undefined}}
      words={wordsIn(r).map((w) => ({w: w.w, f: Math.round((w.s - r.s) * FPS) + lead}))} dur={dur} /> : null}
    {r.fx === 'FxConfetti' ? <FxConfetti theme={themeFrom(T)} at={lead + 4} /> : null}
    {(r.ov || []).map((o, k) => <Overlay key={k} ov={{...o, at: (o.at ?? 6) + lead}} theme={themeFrom(T)} />)}
  </AbsoluteFill>;
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

/* Готовые стили субтитров (remocn): весь текст ролика в их формате, страницы = наши куски */
/* ударные слова для наездов: самое длинное значимое слово каждой фразы */
const bareW = (w: string) => w.toLowerCase().replace(/[^\p{L}\d]/gu, '');
const KEYSET = new Set(pickKeywords(STORY.words));
const SUB_STYLE = isSubCode(STORY.settings.subAnim?.style) ? STORY.settings.subAnim!.style as keyof typeof SUBS : null;
const CAPS = SUB_STYLE ? toCaptions(STORY.words.map((w) => ({...w, w: fmt(w.w)})), new Set(CHUNKS.map((c) => STORY.words.indexOf(c.ws[c.ws.length - 1])))) : [];
const KEYS = SUB_STYLE ? pickKeywords(STORY.words, STORY.settings.subAnim?.keywords) : [];

const Captions: React.FC = () => {
  const fr = useCurrentFrame(); const t = fr / FPS;
  const lead = -(STORY.settings.subStyle?.leadMs ?? 0) / 1000; const tt = t + lead; // субтитр появляется чуть раньше слова, как у референса
  const ci = CHUNKS.findIndex((c, i) => { const next = CHUNKS[i + 1]?.s ?? c.e + 0.3; const end = next - c.e > 0.4 ? c.e + 0.15 : next; return tt >= c.s && tt < end; });
  if (ci < 0) return null;
  const ch = CHUNKS[ci]; const seg = rowAt(fr); const r = seg.r;
  const kind = r.kind || (r.mode === 'C' ? 'kinetic' : '');
  if ((r.hook && (r.hook.outAt === undefined || t < r.hook.outAt)) || r.stack) return null; // заголовок сам показывает слово в скобках; после его ухода — обычный субтитр
  if (r.scene && (/^Txt/.test(r.scene) || /^Card/.test(r.scene))) return null; // текстовая сцена уже показывает эти слова
  if (r.mode === 'C' && (kind === 'kinetic' || ((kind === 'motion' || kind === 'd3') && !(r.scene && REG[r.scene])))) return null; // текст уже на экране
  const win = winOf(r);
  const y = SUB_STYLE === 'SubKino' ? (r.mode === 'B' ? 1300 : r.mode === 'C' ? (/^Phone/.test(r.scene || '') ? 1810 : 1520) : 1120) : r.mode === 'A' ? 1500 : r.mode === 'C' ? 1540 : win === 'circle' ? 1350 : win === 'strip' ? 1160 : 1150;
  const p = STORY.settings.subAnim;
  if (p?.style === 'SubTom') { /* как у референса: по слову, мелко, кремовым, по центру груди, без анимации; ключевые слова крупнее */
    const ss = STORY.settings.subStyle || {}; const fs = ss.fontSize || 60;
    const ki = new Set(ss.keyIdx || []); // крупные слова по номерам (приёмы KEY/NUM/WORD раскадровки) — точнее, чем по написанию
    const key = ki.size ? ch.ws.some((w) => ki.has(STORY.words.indexOf(w))) : (ss.keywords || []).some((k) => ch.ws.some((w) => bareW(w.w) === k.toLowerCase()));
    const size = key ? Math.min(fs * (ss.keyScale || 2.2), 900 / Math.max(1, ch.text.length * 0.56)) : fs;
    const top = r.mode === 'C' ? (ss.topInsert ?? (/^Phone/.test(r.scene || '') ? 1790 : ss.top ?? 1140)) : ss.top ?? 1140;
    const raw = ch.text.replace(/[,;]+$/, ''); const txt = ss.case === 'upper' ? raw.toUpperCase() : ss.case === 'as_is' ? raw : raw.toLowerCase();
    return <div style={{position: 'absolute', left: 0, right: 0, top, translate: '0 -50%', textAlign: 'center', fontFamily: SANS, fontWeight: key ? 800 : 700, fontSize: size, lineHeight: 1, letterSpacing: key ? -size * 0.04 : -1.5,
      color: ss.color || STORY.settings.passport?.colors?.ink || '#EFE7DA', textShadow: '0 2px 14px rgba(0,0,0,.45), 0 0 2px rgba(0,0,0,.3)'}}>{txt}</div>;
  }
  if (SUB_STYLE) {
    const onDark = r.mode === 'A' || T.dark;
    return <div style={{position: 'absolute', left: 60, right: 60, top: y, translate: '0 -50%', textAlign: 'center', fontFamily: SANS, letterSpacing: -1}}>
      {SUBS[SUB_STYLE].render({captions: CAPS, keywords: KEYS, color: onDark ? '#FFFFFF' : (STORY.settings.subColor || T.ink), accent: T.accent, onDark, fontSize: 60})}
    </div>;
  }
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
const trOf = (r: Row) => (r.tr && TRANSITIONS[r.tr] ? TRANSITIONS[r.tr] : null);
const CUTS = ROWS.slice(1).filter((x, k) => !trOf(x.r) && (x.r.mode !== ROWS[k].r.mode || x.r.mode === 'C')).map((x) => x.from);
const Wipe: React.FC = () => {
  const fr = useCurrentFrame();
  const b = CUTS.find((x) => Math.abs(fr - x) <= 4); if (b === undefined) return null;
  const rad = interpolate(Math.abs(fr - b), [0, 4], [1500, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const cols = [T.accent, T.dot, T.dark ? '#2A2D36' : '#FFD23F'];
  return <AbsoluteFill style={{pointerEvents: 'none'}}><div style={{position: 'absolute', left: 540 - rad, top: 960 - rad, width: rad * 2, height: rad * 2, borderRadius: '50%', background: cols[CUTS.indexOf(b) % 3], filter: 'blur(6px)'}} /></AbsoluteFill>;
};

/* Переходы (row.tr): переход длиной L центрирован на склейке — сегмент до неё длиннее на ⌈L/2⌉,
   сегмент после начинается на ⌊L/2⌋ раньше; общая длина и синхрон со звуком не меняются. */
const Transitions: React.FC = () => <TransitionSeries>{ROWS.flatMap(({r, i, from, dur}) => {
  const tin = i > 0 ? trOf(r) : null; const next = ROWS[i + 1]; const tout = next ? trOf(next.r) : null;
  const lead = tin ? Math.floor(tin.len / 2) : 0; const tail = tout ? Math.ceil(tout.len / 2) : 0;
  const out = [<TransitionSeries.Sequence key={`s${i}`} durationInFrames={dur + lead + tail}><Segment r={r} from={from - lead} dur={dur + lead + tail} lead={lead} /></TransitionSeries.Sequence>];
  if (tout) out.push(<TransitionSeries.Transition key={`t${i}`} presentation={tout.make()} timing={linearTiming({durationInFrames: tout.len})} /> as never);
  return out;
})}</TransitionSeries>;

/* Звук по рецепту: вжух на смене режима и входе во вставку, удар на карточке/номере пункта, поп на ключевых словах, подложка */
const SFX = (() => {
  if (STORY.settings.sfxList) return STORY.settings.sfxList.map((x) => ({f: Math.max(0, Math.round(x.t * FPS)), src: x.src, vol: x.vol}));
  if (!STORY.settings.sfx) return [] as {f: number; src: string; vol: number}[];
  const out: {f: number; src: string; vol: number}[] = [];
  ROWS.forEach(({r, i, from}) => {
    const prev = ROWS[i - 1]?.r;
    if (r.scene === 'CardWord' || r.scene === 'TxtNumberTitle') out.push({f: from, src: 'sfx/hit.wav', vol: 0.55});
    else if (i > 0 && (prev?.mode !== r.mode || r.scene === 'MBurst') && i % 2 === 1) out.push({f: Math.max(0, from - 8), src: 'sfx/whoosh.wav', vol: 0.4});
    else if (i > 0 && prev?.mode !== r.mode) out.push({f: Math.max(0, from - 8), src: 'sfx/whoosh.wav', vol: 0.28});
  });
  if (SUB_STYLE === 'SubKino') {
    const ks = new Set(KEYS.map((k) => k.toLowerCase()));
    STORY.words.forEach((w) => { if (ks.has(bareW(w.w))) out.push({f: Math.round(w.s * FPS), src: 'sfx/pop.wav', vol: 0.22}); });
  }
  return out;
})();
const Sounds: React.FC = () => <>
  {STORY.settings.music ? <Audio src={staticFile(STORY.settings.music)} volume={STORY.settings.musicVolume ?? 0.12} loop /> : null}
  {SFX.map((x, k) => <Sequence key={k} from={x.f} durationInFrames={45} layout="none"><Audio src={staticFile(x.src)} volume={x.vol} /></Sequence>)}
</>;

export const StoryMain: React.FC = () => {
  useStoryFonts();
  return <AbsoluteFill style={{background: T.bg, ...fontVars(STORY.settings.passport)}}>
    {ROWS.some((x) => trOf(x.r)) ? <Transitions /> : ROWS.map(({r, i, from, dur}) => <Sequence key={i} from={from} durationInFrames={dur}><Segment r={r} from={from} dur={dur} /></Sequence>)}
    <Captions />
    {STORY.settings.progress ? <ProgressBar total={STORY_TOTAL} theme={themeFrom(T)} /> : null}
    {STORY.settings.wipe === false || STORY.settings.subAnim?.style === 'SubTom' ? null : <Wipe />}
    <Audio src={staticFile(AV)} />
    <Sounds />
  </AbsoluteFill>;
};
