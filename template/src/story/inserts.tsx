import React from 'react';
import {AbsoluteFill, Img, OffthreadVideo, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {AnimText} from './textanim';
import type {AnimParams, Word} from './types';

const SANS = "var(--f-sans, 'InterTight'), sans-serif";
const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;

/* Кинетический текст: ключевые слова сегмента крупно, по 1–3 слова на экран, в ритм речи */
const STOP = new Set(['и','а','в','на','с','по','к','о','у','за','из','от','не','но','что','это','как','то','же','ли','бы','я','ты','мы','вы','он','она','они','его','её','их','для','до','так','уже','ещё']);
export const KineticText: React.FC<{words: Word[]; seg0: number; fps: number; params?: AnimParams | null; ink: string; accent: string; h?: number}> = ({words, seg0, fps, params, ink, accent, h = 1920}) => {
  const f = useCurrentFrame();
  const chunks: {ws: Word[]}[] = []; let cur: Word[] = [];
  words.forEach((w, i) => { cur.push(w); const end = /[.,!?:;…]$/.test(w.w) || cur.length >= (params?.words_per_screen || 2) || i === words.length - 1; if (end) { chunks.push({ws: cur}); cur = []; } });
  const now = seg0 + f / fps;
  const ch = [...chunks].reverse().find(c => c.ws[0].s <= now + 0.02) || chunks[0];
  if (!ch) return null;
  const text = ch.ws.map(w => w.w.replace(/[.,!?:;…«»"]/g, '')).join(' ');
  const at = Math.round((ch.ws[0].s - seg0) * fps);
  const key = ch.ws.map(w => w.w.replace(/[^\p{L}\d]/gu, '')).reduce((b, w, i, a) => (!STOP.has(w.toLowerCase()) && w.length > (a[b] || '').length ? i : b), 0);
  const longest = Math.max(1, ...text.split(/\s+/).map((x) => x.length));
  const size = Math.min(text.length > 18 ? 118 : text.length > 10 ? 150 : 190, 900 / (longest * 0.6)); // длинное слово не вылезает за край
  return <AbsoluteFill style={{alignItems: 'center', justifyContent: 'center', height: h}}>
    <div style={{width: 940, textAlign: 'center', fontFamily: SANS, fontWeight: 800, fontSize: size, lineHeight: 1.02, letterSpacing: -4, color: ink, textWrap: 'balance' as any}}>
      <AnimText key={at} text={text} at={at} params={params || {unit: 'word', enter: 'pop', stagger_ms: 70, overshoot: 0.15, start_scale: 0.7, emphasis: {type: 'color'}}} accent={accent} emphasisIndex={key} />
    </div>
  </AbsoluteFill>;
};

/* Картинка (pic_N от ChatGPT или вставка пользователя) с наездом камеры и рамкой по смыслу */
export type Frame = 'phone' | 'window' | 'painting' | 'product' | 'poster' | 'plain';
export const pickFrame = (note = '', media = ''): Frame => {
  const t = (note + ' ' + media).toLowerCase();
  if (/товар|кроссов|бренд|продукт|упаковк|бутылк|флакон|модель/.test(t)) return 'product';
  if (/постер|обложк|журнал|афиш|плакат/.test(t)) return 'poster';
  if (/скрин|чат|сообщен|уведомлен|приложен|телефон|сторис|пост|переписк/.test(t)) return 'phone';
  if (/сайт|страниц|документ|таблиц|браузер|статья|новост/.test(t)) return 'window';
  if (/картин|полотн|живопис|музей|портрет|художник/.test(t)) return 'painting';
  return 'plain';
};
const isVideo = (n: string) => /\.(mp4|webm|mov)$/i.test(n);
export const PicInsert: React.FC<{src: string; dur: number; frame: Frame; zoneH: number; bg: string; full: boolean}> = ({src, dur, frame, zoneH, bg, full}) => {
  const f = useCurrentFrame(), {fps} = useVideoConfig();
  const k = spring({frame: f, fps, config: {damping: 15}});
  const z = interpolate(f, [0, dur], [1.04, 1.14], clamp); /* Ken Burns: наезд + панорама, направление от имени файла */
  const dir = src.length % 2 ? 1 : -1; const pan = interpolate(f, [0, dur], [-2.5, 2.5], clamp) * dir;
  const media = isVideo(src)
    ? <OffthreadVideo src={staticFile(src)} muted style={{width: '100%', height: '100%', objectFit: 'cover'}} />
    : <Img src={staticFile(src)} style={{width: '100%', height: '100%', objectFit: 'cover', scale: String(z), translate: `${pan}% ${pan * -0.5}%`}} />;
  if (frame === 'product') {
    // товар на подиуме: картинка без рамки, мягкое пятно света и тень-эллипс, лёгкое покачивание
    const S = Math.min(full ? 900 : 760, zoneH - 200);
    const fl = Math.sin(f / 20) * 10;
    return <AbsoluteFill style={{height: zoneH, background: full ? bg : 'transparent'}}>
      <div style={{position: 'absolute', left: 540 - S * 0.62, top: zoneH / 2 - S * 0.62, width: S * 1.24, height: S * 1.24, borderRadius: '50%', background: 'radial-gradient(rgba(255,255,255,.75), rgba(255,255,255,0) 68%)'}} />
      <div style={{position: 'absolute', left: 540 - S * 0.36, top: zoneH / 2 + S * 0.46, width: S * 0.72, height: S * 0.09, borderRadius: '50%', background: 'rgba(0,0,0,.22)', filter: 'blur(14px)', scale: String(1 - fl / 120)}} />
      <div style={{position: 'absolute', left: 540 - S / 2, top: zoneH / 2 - S / 2 - 20 + fl, width: S, height: S, borderRadius: 36, overflow: 'hidden', opacity: k, scale: String(interpolate(k, [0, 1], [0.8, 1]) * z)}}>
        {isVideo(src) ? media : <Img src={staticFile(src)} style={{width: '100%', height: '100%', objectFit: 'cover'}} />}
      </div>
    </AbsoluteFill>;
  }
  if (frame === 'poster') {
    // постер/обложка: вертикальный лист с наклоном, въезд с поворотом
    const W = full ? 760 : 600, H = W * 1.42, sc = Math.min(1, (zoneH - 160) / H);
    return <AbsoluteFill style={{height: zoneH, background: full ? bg : 'transparent'}}>
      <div style={{position: 'absolute', left: 540 - W * sc / 2, top: (zoneH - H * sc) / 2 - (full ? 0 : 30), width: W * sc, height: H * sc, overflow: 'hidden', borderRadius: 8,
        boxShadow: '0 40px 90px rgba(0,0,0,.35)', opacity: k, rotate: `${interpolate(k, [0, 1], [-9, -2.5])}deg`, scale: String(interpolate(k, [0, 1], [1.15, 1]))}}>{media}</div>
    </AbsoluteFill>;
  }
  if (frame === 'plain') return <AbsoluteFill style={{height: zoneH, overflow: 'hidden', opacity: k}}>{media}</AbsoluteFill>;
  const W = frame === 'phone' ? (full ? 620 : 470) : (full ? 920 : 860);
  const H = frame === 'phone' ? W * 2.05 : frame === 'painting' ? W * 1.25 : W * 0.78;
  const maxH = zoneH - (full ? 260 : 120); const sc = Math.min(1, maxH / H);
  const style: React.CSSProperties = {position: 'absolute', left: 540 - W * sc / 2, top: (zoneH - H * sc) / 2 - (full ? 0 : 40), width: W * sc, height: H * sc, overflow: 'hidden',
    scale: String(interpolate(k, [0, 1], [0.92, 1])), opacity: k, boxShadow: '0 30px 80px rgba(0,0,0,.28)'};
  if (frame === 'phone') Object.assign(style, {borderRadius: 64 * sc, border: `${14 * sc}px solid #111`, background: '#000'});
  if (frame === 'window') Object.assign(style, {borderRadius: 22, background: '#fff', paddingTop: 54 * sc});
  if (frame === 'painting') Object.assign(style, {border: `${34 * sc}px solid #6B4A2B`, outline: `${8 * sc}px solid #C9A46A`, outlineOffset: -18 * sc, background: '#000'});
  return <AbsoluteFill style={{height: zoneH, background: full ? bg : 'transparent'}}>
    <div style={style}>
      {frame === 'window' ? <div style={{position: 'absolute', top: 0, left: 0, right: 0, height: 54 * sc, background: '#ECECEC', display: 'flex', gap: 10, alignItems: 'center', paddingLeft: 20}}>{['#FF5F57', '#FEBC2E', '#28C840'].map(c => <i key={c} style={{width: 16 * sc, height: 16 * sc, borderRadius: '50%', background: c, display: 'block'}} />)}</div> : null}
      <div style={{position: 'absolute', inset: frame === 'window' ? `${54 * sc}px 0 0 0` : 0, overflow: 'hidden'}}>{media}</div>
    </div>
  </AbsoluteFill>;
};

/* 2D-сцена из слоёв без своего кода: фон + поза + предметы из row.layer */
export const LayerScene: React.FC<{layer: {bg?: string; pose?: string; props?: string[]}; zoneH: number; dur: number}> = ({layer, zoneH, dur}) => {
  const f = useCurrentFrame(), {fps} = useVideoConfig();
  const pop = (d: number) => spring({frame: f - d, fps, config: {damping: 11, stiffness: 170, mass: 0.7}});
  const props = layer.props || [];
  const spots = [[230, 0.34], [850, 0.30], [210, 0.62], [870, 0.6], [540, 0.18]];
  return <AbsoluteFill style={{height: zoneH, overflow: 'hidden'}}>
    {layer.bg ? <Img src={staticFile(layer.bg)} style={{width: '100%', height: '100%', objectFit: 'cover', scale: String(interpolate(f, [0, dur], [1.03, 1.1], clamp))}} /> : null}
    {layer.pose ? <Img src={staticFile(layer.pose)} style={{position: 'absolute', left: 540 - 300, bottom: zoneH * 0.02, width: 600, height: zoneH * 0.8, objectFit: 'contain', objectPosition: 'bottom', translate: `0 ${interpolate(pop(2), [0, 1], [200, 0])}px`}} /> : null}
    {props.slice(0, 5).map((src, i) => { const [x, y] = spots[i]; const s = pop(8 + i * 6); return <Img key={i} src={staticFile(src)} style={{position: 'absolute', left: x - 120, top: zoneH * y - 120, width: 240, height: 240, objectFit: 'contain', scale: String(s), rotate: `${Math.sin((f + i * 20) / 18) * 4}deg`}} />; })}
  </AbsoluteFill>;
};

/* Заглушка: сцена ещё не собрана — видно при проверке стоп-кадров, в финал не должна попасть */
export const Placeholder: React.FC<{label: string; note?: string; zoneH: number; ink: string}> = ({label, note, zoneH, ink}) => (
  <AbsoluteFill style={{height: zoneH, alignItems: 'center', justifyContent: 'center', padding: 80}}>
    <div style={{border: `4px dashed ${ink}`, borderRadius: 30, padding: 50, fontFamily: SANS, color: ink, textAlign: 'center', opacity: 0.75}}>
      <div style={{fontSize: 56, fontWeight: 800}}>{label}</div>
      {note ? <div style={{fontSize: 34, marginTop: 16}}>{note}</div> : null}
    </div>
  </AbsoluteFill>
);
