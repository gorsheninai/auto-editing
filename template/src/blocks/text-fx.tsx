import React from 'react';
import {AbsoluteFill, Sequence, interpolate, random, useCurrentFrame} from 'remotion';
import type {TransitionPresentation, TransitionPresentationComponentProps} from '@remotion/transitions';
import {BlockProps, SANS, Theme, clamp, ramp} from './kit';
import {SoftBlurIn} from '../remocn/soft-blur-in';
import {KineticCenterBuild} from '../remocn/kinetic-center-build';
import {MarkerHighlight} from '../remocn/marker-highlight';
import {RollingNumber} from '../remocn/rolling-number';
import {StrikethroughReplace} from '../remocn/strikethrough-replace';
import {InkUnderline} from '../remocn/ink-underline';
import {ScribbleCircle} from '../remocn/scribble-circle';
import {InkArrow} from '../remocn/ink-arrow';
import {PaperSticker} from '../remocn/paper-sticker';
import {ShaderGrainGradient} from '../remocn/shader-grain-gradient';
import {Confetti} from '../remocn/confetti';
import {whipPan} from '../remocn/whip-pan';
import {zoomBlur} from '../remocn/zoom-blur';
import {focusPull} from '../remocn/focus-pull';
import {pageTurn} from '../remocn/page-turn';

/* ---------- Текст на весь экран (сцены, как моушн: row.scene = код) ---------- */
const Center: React.FC<{h: number; children: React.ReactNode}> = ({h, children}) =>
  <AbsoluteFill style={{height: h, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 70px', textAlign: 'center', fontFamily: SANS, letterSpacing: -3, lineHeight: 1.02}}>{children}</AbsoluteFill>;
const txt = (p: BlockProps, def: string) => (p.data.text || p.data.title || p.data.items.map((i) => i.raw).join(' ') || def).trim();

/* TxtSoftBlur — буквы проявляются из размытия снизу вверх */
/* Компоненты remocn пишут строку без переноса: режем на строки до ~11 знаков, каждая строка — своя, со сдвигом по времени */
const lines = (s: string, max = 11) => { const out: string[] = []; let cur = ''; for (const w of s.split(' ')) { if (cur && (cur + ' ' + w).length > max) { out.push(cur); cur = w; } else cur = cur ? cur + ' ' + w : w; } if (cur) out.push(cur); return out; };
const fit = (ls: string[], full: boolean) => Math.round(Math.min(full ? 170 : 140, 1650 / Math.max(...ls.map((l) => l.length), 4)));
export const TxtSoftBlur: React.FC<BlockProps> = (p) => {
  const ls = lines(txt(p, 'это меняет всё')); const fs = fit(ls, p.full);
  return <Center h={p.zoneH}><div style={{display: 'flex', flexDirection: 'column'}}>{ls.map((l, i) =>
    <div key={i} style={{position: 'relative', width: 1000, height: fs * 1.08}}><Sequence from={i * 7} layout="none"><SoftBlurIn text={l} fontSize={fs} color={p.theme.ink} fontWeight={800} /></Sequence></div>)}</div></Center>;
};
/* TxtCenterBuild — фраза собирается в центре, новое слово въезжает справа и сдвигает строку */
export const TxtCenterBuild: React.FC<BlockProps> = (p) => { const s = txt(p, 'делай раньше, чем готов'); return <Center h={p.zoneH}><KineticCenterBuild text={s} fontSize={Math.min(150, 2100 / Math.max(6, s.length))} color={p.theme.ink} fontWeight={800} /></Center>; };
/* TxtMarker — «до | выделить | после»: маркер прокрашивается за выделенной частью */
export const TxtMarker: React.FC<BlockProps> = (p) => {
  const parts = p.data.items.map((i) => i.raw); const [before, hl, after] = parts.length >= 2 ? [parts[0], parts[1], parts[2] || ''] : ['главное —', 'регулярность', ''];
  const fs = Math.min(120, 1500 / Math.max(6, before.length, hl.length, after.length));
  return <Center h={p.zoneH}><div style={{position: 'relative', width: 1000, height: 600}}><MarkerHighlight before={before} highlight={hl} after={after} markerColor={p.theme.accent} baseColor={p.theme.ink} highlightedTextColor="#fff" fontSize={fs} fontWeight={800} /></div></Center>;
};
/* TxtNumber — число прокручивается до значения; «TxtNumber: 300000 | подпись: рублей в месяц» */
export const TxtNumber: React.FC<BlockProps> = (p) => {
  const f = useCurrentFrame(); const it = p.data.items.find((i) => i.value != null);
  const to = Math.round(it ? it.value as number : 300000); const cap = p.data.title || (it && it.label !== it.shown ? it.label : '') || '';
  const fs = String(to).length > 6 ? 150 : 200;
  return <AbsoluteFill style={{height: p.zoneH}}>
    <AbsoluteFill style={{height: p.zoneH, translate: `0 ${cap ? -60 : 0}px`}}><RollingNumber from={0} to={to} fontSize={fs} color={p.theme.accent} /></AbsoluteFill>
    {cap ? <div style={{position: 'absolute', top: p.zoneH / 2 + fs * 0.45, width: '100%', textAlign: 'center', fontFamily: SANS, fontWeight: 700, fontSize: 64, color: p.theme.ink, opacity: ramp(f, 20, 34), letterSpacing: -1.5}}>{cap}</div> : null}</AbsoluteFill>;
};
/* TxtStrike — «старое | новое»: старое зачёркивается, на его месте новое */
export const TxtStrike: React.FC<BlockProps> = (p) => {
  const parts = p.data.items.map((i) => i.raw); const [a, b] = parts.length >= 2 ? [parts[0], parts[1]] : ['дорого', 'выгодно'];
  return <Center h={p.zoneH}><div style={{position: 'relative', width: 1000, height: 400}}><StrikethroughReplace from={a} to={b} lineColor={p.theme.accent2} color={p.theme.ink} fontSize={Math.min(170, 1700 / Math.max(5, a.length, b.length))} fontWeight={800} /></div></Center>;
};
export const TEXT: Record<string, React.FC<BlockProps>> = {TxtSoftBlur, TxtCenterBuild, TxtMarker, TxtNumber, TxtStrike};

/* ---------- Переходы на склейке: row.tr = код (длина в кадрах) ---------- */
type GlitchProps = Record<string, never>;
const GlitchPresentation: React.FC<TransitionPresentationComponentProps<GlitchProps>> = ({children, presentationProgress: p, presentationDirection: dir}) => {
  const f = useCurrentFrame();
  const show = dir === 'exiting' ? p < 0.5 : p >= 0.5;
  if (!show) return null;
  const amp = Math.sin(p * Math.PI);  // сильнее всего в середине
  const bands = 7;
  return <AbsoluteFill>
    {Array.from({length: bands}, (_, i) => {
      const dx = (random(`g${i}-${f}`) - 0.5) * 160 * amp; const top = (i / bands) * 100, bot = 100 - ((i + 1) / bands) * 100;
      return <AbsoluteFill key={i} style={{clipPath: `inset(${top}% 0 ${bot}% 0)`, translate: `${dx}px 0`, filter: amp > 0.4 && i % 2 ? `brightness(${1 + 0.35 * amp}) saturate(1.4)` : undefined}}>{children}</AbsoluteFill>;
    })}
    <AbsoluteFill style={{background: `linear-gradient(90deg, rgba(255,0,90,${0.25 * amp}), transparent 30%, transparent 70%, rgba(0,220,255,${0.25 * amp}))`, mixBlendMode: 'screen'}} />
  </AbsoluteFill>;
};
const glitch = (): TransitionPresentation<GlitchProps> => ({component: GlitchPresentation, props: {}});
export const TRANSITIONS: Record<string, {make: () => TransitionPresentation<never>; len: number; name: string; summary: string}> = {
  TrWhip: {make: () => whipPan() as never, len: 12, name: 'Проброс камеры', summary: 'Резкий проброс вбок с размытием движения'},
  TrZoom: {make: () => zoomBlur() as never, len: 14, name: 'Пробивка в глубину', summary: 'Старая сцена улетает на зрителя, новая проявляется из размытия'},
  TrFocus: {make: () => focusPull() as never, len: 16, name: 'Перевод фокуса', summary: 'Старая сцена расплывается в светлое пятно, новая собирается в фокус'},
  TrGlitch: {make: () => glitch() as never, len: 8, name: 'Глитч', summary: 'Кадр рвётся на полосы со сдвигом и цветным разломом'},
  TrPage: {make: () => pageTurn() as never, len: 16, name: 'Страница блокнота', summary: 'Сцена уходит вверх покадрово, как перевёрнутая страница'},
};

/* ---------- Рукописные пометки поверх сцены: row.ov = [{code, x, y, w, h, to, text, at}] ---------- */
export type Ov = {code: string; x?: number; y?: number; w?: number; h?: number; to?: [number, number]; text?: string; at?: number};
export const Overlay: React.FC<{ov: Ov; theme: Theme}> = ({ov, theme}) => {
  const at = ov.at ?? 6; const x = ov.x ?? 540, y = ov.y ?? 900, w = ov.w ?? 520, h = ov.h ?? 220;
  if (ov.code === 'InkUnderline') return <div style={{position: 'absolute', left: x - w / 2, top: y}}><InkUnderline width={w} color={theme.accent2} thickness={16} delay={at} /></div>;
  if (ov.code === 'InkCircle') return <div style={{position: 'absolute', left: x - w / 2, top: y - h / 2}}><ScribbleCircle width={w} height={h} color={theme.accent2} strokeWidth={14} delay={at} /></div>;
  if (ov.code === 'InkArrow') return <AbsoluteFill><InkArrow from={{x, y}} to={{x: ov.to?.[0] ?? x + 260, y: ov.to?.[1] ?? y - 200}} color={theme.accent2} strokeWidth={16} delay={at} headSize={60} /></AbsoluteFill>;
  if (ov.code === 'PaperSticker') return <div style={{position: 'absolute', left: x, top: y, translate: '-50% -50%'}}><PaperSticker at={at} background="#FFF6D6" borderColor="rgba(0,0,0,.12)" padding="22px 34px">
    <span style={{fontFamily: "'Caveat', cursive", fontWeight: 700, fontSize: 76, color: theme.ink, whiteSpace: 'nowrap'}}>{ov.text || 'важно!'}</span></PaperSticker></div>;
  return null;
};
export const OVERLAYS: Record<string, {name: string; summary: string}> = {
  InkUnderline: {name: 'Подчёркивание кистью', summary: 'Кисть подчёркивает слово или предмет, покадрово, с сухим хвостом'},
  InkCircle: {name: 'Обвод кистью', summary: 'Кисть обводит важное: начинает тонко, заканчивает жирно'},
  InkArrow: {name: 'Нарисованная стрелка', summary: 'Стрелка рисуется от точки к точке, наконечник выпрыгивает в конце'},
  PaperSticker: {name: 'Бумажная наклейка', summary: 'Наклейка на скотче шлёпается в кадр с рукописной надписью'},
};

/* ---------- Фон и эффекты ---------- */
/* BgGrain — живой зернистый градиент вместо подложки с точками (settings.backdrop = 'BgGrain') */
export const BgGrain: React.FC<{theme: Theme}> = ({theme}) => <AbsoluteFill>
  <ShaderGrainGradient colors={theme.dark ? ['#7B61FF', '#FF6A2B', '#1C1F27'] : ['#B9AAFF', '#FFB48A', '#FFE3A3']} colorBack={theme.bg} softness={0.7} intensity={0.35} noise={0.25} shape="wave" speed={0.6} style={{width: '100%', height: '100%'}} />
</AbsoluteFill>;
/* FxVhs — сцена как с видеокассеты: дрожание строк, цветной сдвиг, полосы, шум (row.fx = 'FxVhs') */
export const FxVhs: React.FC<{children: React.ReactNode}> = ({children}) => {
  const f = useCurrentFrame(); const jx = (random(`j${f}`) - 0.5) * 6; const band = (f * 23) % 2100 - 100;
  return <AbsoluteFill style={{overflow: 'hidden'}}>
    <AbsoluteFill style={{translate: `${jx}px 0`, filter: 'saturate(1.35) contrast(1.08)'}}>{children}</AbsoluteFill>
    <AbsoluteFill style={{background: 'linear-gradient(90deg, rgba(255,0,80,.10), transparent 12%, transparent 88%, rgba(0,200,255,.10))', mixBlendMode: 'screen'}} />
    <AbsoluteFill style={{backgroundImage: 'repeating-linear-gradient(0deg, rgba(0,0,0,.16) 0 2px, transparent 2px 5px)'}} />
    <div style={{position: 'absolute', left: 0, right: 0, top: band, height: 70, background: 'rgba(255,255,255,.10)', filter: 'blur(4px)', translate: `${(random(`b${f}`) - 0.5) * 30}px 0`}} />
    <AbsoluteFill style={{background: 'radial-gradient(ellipse at center, transparent 60%, rgba(0,0,0,.28))'}} />
    <div style={{position: 'absolute', left: 50, top: 60, fontFamily: "'Pixelify Sans', monospace", fontSize: 54, color: '#fff', textShadow: '3px 0 rgba(255,0,80,.6), -3px 0 rgba(0,200,255,.6)', opacity: f % 40 < 30 ? 1 : 0}}>▶ PLAY</div>
  </AbsoluteFill>;
};
/* FxConfetti — залп конфетти поверх сцены (row.fx = 'FxConfetti') */
export const FxConfetti: React.FC<{theme: Theme; at?: number}> = ({theme, at = 4}) =>
  <AbsoluteFill style={{pointerEvents: 'none'}}><Confetti particleCount={140} colors={[theme.accent, theme.accent2, '#F2B53B', '#4CC38A', theme.soft]} originX={0.5} originY={0.62} startFrame={at} power={26} size={16} seed={4} /></AbsoluteFill>;
export const FX: Record<string, {name: string; summary: string}> = {
  BgGrain: {name: 'Зернистый градиент', summary: 'Живой фон из мягкого градиента с плёночным зерном вместо подложки с точками'},
  FxVhs: {name: 'Видеокассета', summary: 'Дрожание строк, цветной сдвиг, бегущая полоса и шум — для ретро-стиля'},
  FxConfetti: {name: 'Конфетти', summary: 'Залп конфетти на ключевой фразе'},
};
void clamp; void interpolate;
