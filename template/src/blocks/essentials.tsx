import React from 'react';
import {AbsoluteFill, Easing, interpolate, random, useCurrentFrame, useVideoConfig} from 'remotion';
import {BlockProps, SANS, SERIF, Theme, clamp, ramp, spring, rad, shd} from './kit';

/* Базовые приёмы монтажа (по мотивам onda, snapcn, reactvideoeditor, video-shotcraft), написаны для студии. */

/* ---------- FxPunch: наезд камеры на ударных словах ----------
   at — кадры ударов (относительно сегмента). Масштаб ступеньками 1 → 1.12 → 1 → 1.12…, переход 4 кадра, центр чуть выше середины (лицо). */
export const Punch: React.FC<{at: number[]; children: React.ReactNode; amount?: number}> = ({at, children, amount = 0.12}) => {
  const f = useCurrentFrame();
  let s = 1;
  at.forEach((t, i) => { const k = interpolate(f, [t, t + 4], [0, 1], {...clamp, easing: Easing.out(Easing.cubic)}); s += (i % 2 === 0 ? amount : -amount) * k; });
  return <AbsoluteFill style={{scale: String(Math.max(1, s)), transformOrigin: '50% 38%'}}>{children}</AbsoluteFill>;
};

/* ---------- FxShake: тряска кадра на удар ---------- */
export const Shake: React.FC<{at?: number; children: React.ReactNode; power?: number}> = ({at = 4, children, power = 1}) => {
  const f = useCurrentFrame(); const t = f - at;
  const k = t < 0 ? 0 : Math.max(0, 1 - t / 14) ** 2 * power;
  const dx = (random(`sx${f}`) - 0.5) * 44 * k, dy = (random(`sy${f}`) - 0.5) * 30 * k, r = (random(`sr${f}`) - 0.5) * 2.4 * k;
  return <AbsoluteFill style={{translate: `${dx}px ${dy}px`, rotate: `${r}deg`, scale: String(1 + 0.04 * k)}}>{children}</AbsoluteFill>;
};

/* ---------- Полоса прогресса ролика вверху (settings.progress) ---------- */
export const ProgressBar: React.FC<{total: number; theme: Theme}> = ({total, theme}) => {
  const f = useCurrentFrame(); const p = Math.min(1, f / Math.max(1, total - 1));
  return <div style={{position: 'absolute', left: 40, right: 40, top: 46, height: 12, borderRadius: rad(6), background: 'rgba(255,255,255,.35)', boxShadow: shd('0 2px 10px rgba(0,0,0,.12)'), overflow: 'hidden'}}>
    <div style={{width: `${p * 100}%`, height: '100%', borderRadius: rad(6), background: theme.accent}} /></div>;
};

/* ---------- Ken Burns: медленный наезд и панорама по картинке ---------- */
export const KenBurns: React.FC<{seed: string; dur: number; children: React.ReactNode}> = ({seed, dur, children}) => {
  const f = useCurrentFrame(); const dir = random(seed) > 0.5 ? 1 : -1; const up = random(seed + 'y') > 0.5 ? 1 : -1;
  const t = interpolate(f, [0, Math.max(1, dur)], [0, 1], clamp);
  return <AbsoluteFill style={{scale: String(1.04 + 0.1 * t), translate: `${dir * (t - 0.5) * 5}% ${up * (t - 0.5) * 3}%`}}>{children}</AbsoluteFill>;
};

/* ---------- Пометки поверх кадра (row.ov) ---------- */
type Ov = {x?: number; y?: number; w?: number; h?: number; text?: string; at?: number};

/* Callout — рамка рисуется вокруг области, над ней выпрыгивает подпись */
export const Callout: React.FC<{ov: Ov; theme: Theme}> = ({ov, theme}) => {
  const f = useCurrentFrame(); const {fps} = useVideoConfig(); const at = ov.at ?? 6;
  const x = ov.x ?? 540, y = ov.y ?? 900, w = ov.w ?? 620, h = ov.h ?? 260; const P = 2 * (w + h);
  const draw = interpolate(f, [at, at + 14], [0, 1], {...clamp, easing: Easing.out(Easing.cubic)});
  const k = spring({frame: f - at - 10, fps, config: {damping: 11, stiffness: 180}});
  return <AbsoluteFill style={{pointerEvents: 'none'}}>
    <svg width={1080} height={1920} style={{position: 'absolute', inset: 0}}>
      <rect x={x - w / 2} y={y - h / 2} width={w} height={h} rx={22} fill="none" stroke={theme.accent2} strokeWidth={9} strokeDasharray={P} strokeDashoffset={P * (1 - draw)} />
      <rect x={x - w / 2} y={y - h / 2} width={w} height={h} rx={22} fill={theme.accent2} opacity={0.08 * draw} />
    </svg>
    {ov.text ? <div style={{position: 'absolute', left: x - w / 2, top: y - h / 2 - 96, scale: String(k), transformOrigin: '0 100%', padding: '14px 26px', borderRadius: rad(20), background: theme.accent2, color: '#fff',
      fontFamily: SANS, fontWeight: 800, fontSize: 46, letterSpacing: -1, whiteSpace: 'nowrap', boxShadow: shd('0 10px 30px rgba(0,0,0,.18)')}}>{ov.text}</div> : null}
  </AbsoluteFill>;
};

/* BlurBox — размыть кусок кадра (номер, имя, сумма) */
export const BlurBox: React.FC<{ov: Ov}> = ({ov}) => {
  const f = useCurrentFrame(); const at = ov.at ?? 0; const k = ramp(f, at, at + 6);
  const x = ov.x ?? 540, y = ov.y ?? 900, w = ov.w ?? 520, h = ov.h ?? 110;
  return <div style={{position: 'absolute', left: x - w / 2, top: y - h / 2, width: w, height: h, borderRadius: rad(18), backdropFilter: `blur(${30 * k}px)`, WebkitBackdropFilter: `blur(${30 * k}px)`,
    background: `rgba(200,200,210,${0.35 * k})`, pointerEvents: 'none'}} />;
};

/* Notify — уведомление выезжает сверху: «Notify: Телеграм — Новый заказ на 15 000 ₽» */
export const Notify: React.FC<{ov: Ov; theme: Theme}> = ({ov, theme}) => {
  const f = useCurrentFrame(); const {fps} = useVideoConfig(); const at = ov.at ?? 6;
  const [title, ...rest] = (ov.text || 'Банк — Поступление 15 000 ₽').split(/\s+[—–-]\s+/); const body = rest.join(' — ') || title;
  const inK = spring({frame: f - at, fps, config: {damping: 14, stiffness: 160}}); const out = ramp(f, at + 75, at + 88);
  const y = interpolate(inK, [0, 1], [-260, 70]) - out * 330;
  return <div style={{position: 'absolute', left: 40, right: 40, top: y, padding: '26px 30px', borderRadius: rad(40), background: theme.dark ? 'rgba(40,42,50,.94)' : 'rgba(255,255,255,.94)',
    boxShadow: shd('0 20px 60px rgba(0,0,0,.25)'), display: 'flex', gap: 24, alignItems: 'center', fontFamily: SANS}}>
    <div style={{width: 96, height: 96, borderRadius: rad(24), background: theme.accent, display: 'grid', placeItems: 'center', color: '#fff', fontWeight: 800, fontSize: 52, flex: 'none'}}>{title.trim().charAt(0).toUpperCase()}</div>
    <div style={{flex: 1, minWidth: 0}}>
      <div style={{display: 'flex', justifyContent: 'space-between', fontWeight: 700, fontSize: 36, color: theme.ink}}><span>{title}</span><span style={{fontWeight: 500, color: theme.muted, fontSize: 30}}>сейчас</span></div>
      <div style={{fontWeight: 500, fontSize: 40, color: theme.ink, lineHeight: 1.15, marginTop: 4}}>{body}</div>
    </div>
  </div>;
};

/* NameTag — плашка с именем: «NameTag: Иван Петров — маркетолог» */
export const NameTag: React.FC<{ov: Ov; theme: Theme}> = ({ov, theme}) => {
  const f = useCurrentFrame(); const at = ov.at ?? 8;
  const [name, ...rest] = (ov.text || 'Иван Петров — маркетолог').split(/\s+[—–-]\s+/); const sub = rest.join(' — ');
  const bar = interpolate(f, [at, at + 10], [0, 1], {...clamp, easing: Easing.out(Easing.cubic)}); const txt = ramp(f, at + 6, at + 16); const out = ramp(f, at + 90, at + 102);
  const y = ov.y ?? 1380;
  return <div style={{position: 'absolute', left: 60, top: y, opacity: 1 - out, translate: `${-out * 80}px 0`, fontFamily: SANS}}>
    <div style={{display: 'inline-flex', alignItems: 'stretch', clipPath: `inset(0 ${(1 - bar) * 100}% 0 0)`}}>
      <div style={{width: 14, background: theme.accent2}} />
      <div style={{padding: '18px 30px', background: theme.ink, color: theme.bg, fontWeight: 800, fontSize: 54, letterSpacing: -1.5, opacity: txt, translate: `${(1 - txt) * -30}px 0`}}>{name}</div>
    </div>
    {sub ? <div style={{marginTop: 8, display: 'inline-block', padding: '10px 24px', background: theme.accent, color: '#fff', fontWeight: 600, fontSize: 36, clipPath: `inset(0 ${(1 - ramp(f, at + 10, at + 20)) * 100}% 0 0)`}}>{sub}</div> : null}
  </div>;
};

/* ---------- Сцены ---------- */
/* MChat — чат с ИИ: вопрос печатается, ответ появляется словами. «MChat: вопрос | ответ» */
export const MChat: React.FC<BlockProps> = (p) => {
  const f = useCurrentFrame(); const {fps} = useVideoConfig(); const T = p.theme;
  const parts = p.data.items.map((i) => i.raw);
  const q = parts[0] || p.data.text || 'Как набрать первых 1000 подписчиков?';
  const a = parts[1] || 'Снимай каждый день 30 дней подряд и отвечай на каждый комментарий.';
  const qEnd = 8 + q.length * 1.1; const aw = a.split(' '); const aStart = qEnd + 18;
  const shown = Math.max(0, Math.floor((f - aStart) / 3));
  const card = spring({frame: f, fps, config: {damping: 14}});
  const typing = f > qEnd + 4 && f < aStart;
  const W = 920, zoom = p.full ? 1 : 0.85;
  return <AbsoluteFill style={{height: p.zoneH, display: 'grid', placeItems: 'center'}}>
    <div style={{width: W, zoom, borderRadius: rad(48), background: T.card, boxShadow: shd('0 30px 80px rgba(0,0,0,.14)'), padding: 40, display: 'flex', flexDirection: 'column', gap: 26, fontFamily: SANS, scale: String(0.94 + 0.06 * card), opacity: card}}>
      <div style={{display: 'flex', alignItems: 'center', gap: 16, fontWeight: 700, fontSize: 34, color: T.muted}}><i style={{width: 22, height: 22, borderRadius: '50%', background: T.accent, display: 'block'}} />ИИ-ассистент</div>
      <div style={{alignSelf: 'flex-end', maxWidth: '82%', padding: '24px 30px', borderRadius: '34px 34px 8px 34px', background: T.accent, color: '#fff', fontSize: 44, fontWeight: 600, lineHeight: 1.2}}>
        {q.slice(0, Math.max(0, Math.floor((f - 8) / 1.1)))}{f < qEnd ? <span style={{opacity: f % 16 < 8 ? 1 : 0}}>|</span> : null}</div>
      {typing ? <div style={{alignSelf: 'flex-start', padding: '24px 30px', borderRadius: rad(34), background: T.bg, display: 'flex', gap: 10}}>{[0, 1, 2].map((i) => <i key={i} style={{width: 16, height: 16, borderRadius: '50%', background: T.muted, display: 'block', opacity: 0.4 + 0.6 * Math.abs(Math.sin((f + i * 5) / 6))}} />)}</div> : null}
      {f >= aStart ? <div style={{alignSelf: 'flex-start', maxWidth: '88%', padding: '24px 30px', borderRadius: '34px 34px 34px 8px', background: T.bg, color: T.ink, fontSize: 44, fontWeight: 500, lineHeight: 1.25}}>
        {aw.slice(0, shown + 1).map((w, i) => <span key={i} style={{opacity: i === shown ? 0.5 : 1}}>{w} </span>)}</div> : null}
    </div>
  </AbsoluteFill>;
};

/* TxtRotate — неподвижное начало и слово-барабан: «TxtRotate: для | блогеров, экспертов, бизнеса» */
export const TxtRotate: React.FC<BlockProps> = (p) => {
  const f = useCurrentFrame(); const T = p.theme;
  const parts = p.data.items.map((i) => i.raw);
  const head = parts.length >= 2 ? parts[0] : 'это для';
  const words = (parts.length >= 2 ? parts[1] : parts[0] || 'блогеров, экспертов, бизнеса').split(/\s*,\s*/).filter(Boolean);
  const step = Math.max(14, Math.floor((p.dur - 10) / words.length)); const idx = Math.min(words.length - 1, Math.floor(Math.max(0, f - 6) / step)); const local = f - 6 - idx * step;
  const k = interpolate(local, [0, 8], [0, 1], {...clamp, easing: Easing.out(Easing.back(1.6))});
  const fs = p.full ? 128 : 108;
  return <AbsoluteFill style={{height: p.zoneH, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', fontFamily: SANS, fontWeight: 800, letterSpacing: -4, lineHeight: 1.05, textAlign: 'center'}}>
    <div style={{fontSize: fs, color: T.ink, opacity: ramp(f, 0, 8)}}>{head}</div>
    <div style={{height: fs * 1.15, overflow: 'hidden', position: 'relative', width: 1000}}>
      {idx > 0 ? <div style={{position: 'absolute', width: '100%', fontSize: fs, fontFamily: SERIF, fontStyle: 'italic', fontWeight: 600, color: T.accent, translate: `0 ${-k * fs * 1.15}px`, opacity: 1 - k}}>{words[idx - 1]}</div> : null}
      <div style={{position: 'absolute', width: '100%', fontSize: fs, fontFamily: SERIF, fontStyle: 'italic', fontWeight: 600, color: T.accent, translate: `0 ${(1 - k) * fs * 1.15}px`}}>{words[idx]}</div>
    </div>
  </AbsoluteFill>;
};
