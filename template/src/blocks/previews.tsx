import React from 'react';
import {AbsoluteFill, Composition} from 'remotion';
import {LIGHT, SANS, parseData, type Theme} from './kit';
import {SUBS, type SubCode, pickKeywords, toCaptions} from './subs';
import {SCENES} from './library';
import {useStoryFonts} from '../story/fonts';
import {TransitionSeries, linearTiming} from '@remotion/transitions';
import {BgGrain, FX, FxConfetti, FxVhs, OVERLAYS, Overlay, TRANSITIONS} from './text-fx';

/* Стенд превью: каждый блок — композиция P_<код> 1080×1920 (рендер со --scale=0.4 → 432×768 для пульта). */
const FPS = 30;
export const Backdrop: React.FC<{t: Theme}> = ({t}) => <AbsoluteFill style={{background: t.bg}}>
  <AbsoluteFill style={{backgroundImage: `radial-gradient(${t.dark ? 'rgba(255,255,255,.1)' : '#CFC6FF'} 2.4px, transparent 2.8px)`, backgroundSize: '26px 26px', opacity: 0.8}} /></AbsoluteFill>;

const MOTION = SCENES;
export const MOTION_DEMO: Record<string, {note: string; dur: number}> = {
  MBars: {note: 'MBars: я — 3 | они — 30 | заголовок: клиентов в месяц', dur: 110},
  MGrowth: {note: 'MGrowth: янв — 12 | фев — 18 | мар — 15 | апр — 31 | май — 46 | июн — 120 | заголовок: просмотры за полгода', dur: 110},
  MShare: {note: 'MShare: не доходят до конца — 80% | доходят — 20% | заголовок: кто дочитывает', dur: 110},
  MTop: {note: 'MTop: ChatGPT — 800 млн | Gemini — 400 млн | Claude — 100 млн | заголовок: пользователей в неделю', dur: 110},
  MTimeline: {note: 'MTimeline: 2019 — первый ролик | 2022 — 100 тысяч | 2024 — свой курс | сейчас — миллион', dur: 120},
  MGauge: {note: 'MGauge: уровень стресса — 87% | заголовок: в первый месяц', dur: 100},
  MVersus: {note: 'MVersus: фриланс — свобода, свой график, нет оклада | офис — оклад, стабильность, начальник', dur: 120},
  MChecklist: {note: 'MChecklist: найти свою тему | снять 30 роликов | не сдаться | заголовок: план', dur: 140},
  MHub: {note: 'MHub: клиенты | контент | деньги | команда | идеи | заголовок: ты', dur: 110},
  MFlow: {note: 'MFlow: бюджет — реклама | заголовок: куда утекают деньги', dur: 110},
  MInk: {note: 'MInk: текст: свой стиль', dur: 90},
  MBurst: {note: 'MBurst: текст: бесплатно', dur: 90},
  MSpeed: {note: 'MSpeed: текст: за 5 минут', dur: 90},
  MGooey: {note: 'MGooey: текст: хук', dur: 110},
  MBauhaus: {note: 'MBauhaus: текст: новая глава', dur: 130},
  TxtSoftBlur: {note: 'TxtSoftBlur: текст: это меняет всё', dur: 90},
  TxtCenterBuild: {note: 'TxtCenterBuild: текст: делай раньше, чем готов', dur: 100},
  TxtMarker: {note: 'TxtMarker: главное — | регулярность', dur: 90},
  TxtNumber: {note: 'TxtNumber: рублей в месяц — 300 000', dur: 90},
  TxtStrike: {note: 'TxtStrike: дорого | выгодно', dur: 100},
  MGallery: {note: 'MGallery: demo/g1.jpg | demo/g2.jpg | demo/g3.jpg | demo/g4.jpg', dur: 110},
};

const SUB_TEXT = 'Большинство людей переплачивают за рекламу, потому что не знают одну простую вещь.';
const subWords = () => { let t = 0.25; return SUB_TEXT.split(' ').map((w) => { const d = 0.17 + w.length * 0.025; const o = {w, s: t, e: t + d}; t += d + (/[,.]$/.test(w) ? 0.28 : 0.04); return o; }); };
const SHORT = new Set(['в', 'с', 'и', 'а', 'на', 'за', 'из', 'у', 'со', 'не', 'к', 'о', 'от']);
const SubPreview: React.FC<{code: SubCode}> = ({code}) => {
  useStoryFonts();
  const ws = subWords(); const ends = new Set<number>(); let n = 0;
  ws.forEach((w, i) => { n++; const next = ws[i + 1]; const b = w.w.toLowerCase().replace(/[^\p{L}]/gu, ''); if (/[,.]$/.test(w.w) || !next || (n >= 2 && !SHORT.has(b))) { ends.add(i); n = 0; } });
  const caps = toCaptions(ws.map((w) => ({...w, w: w.w.replace(/[.]$/, '').toLowerCase()})), ends);
  return <AbsoluteFill><Backdrop t={LIGHT} />
    <div style={{position: 'absolute', left: 70, right: 70, top: 300, height: 560, borderRadius: 40, background: 'rgba(123,97,255,.10)', border: '3px dashed rgba(123,97,255,.35)', display: 'grid', placeItems: 'center', fontFamily: SANS, fontWeight: 600, fontSize: 40, color: 'rgba(28,27,34,.35)'}}>сцена</div>
    <div style={{position: 'absolute', left: 60, right: 60, top: 1150, translate: '0 -50%', textAlign: 'center', fontFamily: SANS, letterSpacing: -1}}>
      {SUBS[code].render({captions: caps, keywords: pickKeywords(ws), color: LIGHT.ink, accent: LIGHT.accent, onDark: false, fontSize: 74})}
    </div>
  </AbsoluteFill>;
};
const MotionPreview: React.FC<{code: string}> = ({code}) => {
  useStoryFonts();
  const C = MOTION[code]; const d = MOTION_DEMO[code];
  return <AbsoluteFill><Backdrop t={LIGHT} /><C data={parseData(d.note)} theme={LIGHT} zoneH={1920} full dur={d.dur} /></AbsoluteFill>;
};

/* Макет сцены для переходов и эффектов */
const Mock: React.FC<{n: number}> = ({n}) => <AbsoluteFill style={{background: n ? '#FF6A2B' : '#7B61FF', display: 'grid', placeItems: 'center'}}>
  <div style={{fontFamily: SANS, fontWeight: 800, fontSize: 190, color: '#fff', letterSpacing: -6}}>{n ? 'после' : 'до'}</div></AbsoluteFill>;
const Card: React.FC = () => <AbsoluteFill style={{display: 'grid', placeItems: 'center'}}><div style={{width: 820, padding: 60, borderRadius: 44, background: '#fff', boxShadow: '0 20px 60px rgba(0,0,0,.1)', fontFamily: SANS, fontWeight: 800, fontSize: 96, letterSpacing: -3, color: '#1C1B22', textAlign: 'center', lineHeight: 1.05}}>подписка<br />за 0 ₽</div></AbsoluteFill>;
const TrPreview: React.FC<{code: string}> = ({code}) => { useStoryFonts(); const t = TRANSITIONS[code];
  return <TransitionSeries><TransitionSeries.Sequence durationInFrames={45 + t.len}><Mock n={0} /></TransitionSeries.Sequence>
    <TransitionSeries.Transition presentation={t.make()} timing={linearTiming({durationInFrames: t.len})} />
    <TransitionSeries.Sequence durationInFrames={45}><Mock n={1} /></TransitionSeries.Sequence></TransitionSeries>; };
const OV_DEMO: Record<string, object> = {InkUnderline: {x: 540, y: 1075, w: 560}, InkCircle: {x: 540, y: 960, w: 900, h: 420}, InkArrow: {x: 240, y: 1450, to: [430, 1100]}, PaperSticker: {x: 760, y: 700, text: 'без скрытых!'}};
const OvPreview: React.FC<{code: string}> = ({code}) => { useStoryFonts(); return <AbsoluteFill><Backdrop t={LIGHT} /><Card /><Overlay ov={{code, at: 8, ...OV_DEMO[code]}} theme={LIGHT} /></AbsoluteFill>; };
const FxPreview: React.FC<{code: string}> = ({code}) => { useStoryFonts();
  if (code === 'BgGrain') return <AbsoluteFill><BgGrain theme={LIGHT} /><Card /></AbsoluteFill>;
  if (code === 'FxVhs') return <FxVhs><AbsoluteFill><Backdrop t={LIGHT} /><Card /></AbsoluteFill></FxVhs>;
  return <AbsoluteFill><Backdrop t={LIGHT} /><Card /><FxConfetti theme={LIGHT} /></AbsoluteFill>; };

export const Previews: React.FC = () => <>
  {(Object.keys(SUBS) as SubCode[]).map((c) => <Composition key={c} id={`P-${c}`} component={() => <SubPreview code={c} />} durationInFrames={6 * FPS} fps={FPS} width={1080} height={1920} />)}
  {Object.keys(MOTION).map((c) => <Composition key={c} id={`P-${c}`} component={() => <MotionPreview code={c} />} durationInFrames={MOTION_DEMO[c].dur} fps={FPS} width={1080} height={1920} />)}
  {Object.keys(TRANSITIONS).map((c) => <Composition key={c} id={`P-${c}`} component={() => <TrPreview code={c} />} durationInFrames={90} fps={FPS} width={1080} height={1920} />)}
  {Object.keys(OVERLAYS).map((c) => <Composition key={c} id={`P-${c}`} component={() => <OvPreview code={c} />} durationInFrames={90} fps={FPS} width={1080} height={1920} />)}
  {Object.keys(FX).map((c) => <Composition key={c} id={`P-${c}`} component={() => <FxPreview code={c} />} durationInFrames={90} fps={FPS} width={1080} height={1920} />)}
</>;
