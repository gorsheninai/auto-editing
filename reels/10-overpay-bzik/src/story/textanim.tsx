import React from 'react';
import {Easing, interpolate, spring, useCurrentFrame, useVideoConfig} from 'remotion';
import type {AnimParams} from './types';

/* Анимированный текст по параметрам из пульта (textanims.params).
   at — кадр (относительно Sequence), когда текст начинает появляться;
   unitAt — необязательные кадры появления для каждого слова (по таймингам речи). */
export const AnimText: React.FC<{text: string; at: number; unitAt?: number[]; params?: AnimParams | null; style?: React.CSSProperties; accent?: string; emphasisIndex?: number}> = ({text, at, unitAt, params, style, accent = '#7B61FF', emphasisIndex = -1}) => {
  const f = useCurrentFrame(), {fps} = useVideoConfig();
  const p: AnimParams = params || {enter: 'cut', unit: 'block'};
  const cased = p.case === 'upper' ? text.toUpperCase() : p.case === 'lower' ? text.toLowerCase() : text;
  const unit = p.unit || 'word';
  const parts = unit === 'char' ? [...cased] : unit === 'word' ? cased.split(/(\s+)/) : [cased];
  const dur = Math.max(1, Math.round(((p.duration_ms ?? 350) / 1000) * fps));
  const stagger = ((p.stagger_ms ?? (unit === 'char' ? 30 : 80)) / 1000) * fps;
  const ease = p.easing === 'linear' ? Easing.linear : p.easing === 'easeInOut' ? Easing.inOut(Easing.cubic) : Easing.out(Easing.cubic);
  let wi = -1;
  const box = p.box?.use ? {background: p.box.color || 'rgba(0,0,0,.6)', borderRadius: p.box.radius_px ?? 14, padding: `${(p.box.padding_px ?? 10) * 0.6}px ${p.box.padding_px ?? 18}px`} : {};
  return <span style={{...box, ...style, color: p.color || (style?.color as string)}}>{parts.map((part, i) => {
    if (/^\s+$/.test(part)) return <span key={i}>{part}</span>;
    wi++;
    const start = unitAt && unitAt[wi] != null ? unitAt[wi] : at + wi * stagger;
    const local = f - start;
    if (p.enter === 'cut' || !p.enter) return <span key={i} style={{opacity: local >= 0 ? 1 : 0, ...emph(wi)}}>{part}</span>;
    const prog = p.easing === 'spring' || p.enter === 'pop'
      ? spring({frame: local, fps, config: {damping: Math.max(6, 14 - (p.overshoot ?? 0.1) * 40), stiffness: 170, mass: 0.7}, durationInFrames: dur})
      : interpolate(local, [0, dur], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: ease});
    const d = p.distance_px ?? 40;
    const st: React.CSSProperties = {display: 'inline-block', whiteSpace: 'pre'};
    switch (p.enter) {
      case 'fade': st.opacity = prog; break;
      case 'slideUp': st.opacity = Math.min(1, prog * 1.6); st.translate = `0 ${(1 - prog) * d}px`; break;
      case 'slideDown': st.opacity = Math.min(1, prog * 1.6); st.translate = `0 ${-(1 - prog) * d}px`; break;
      case 'slideLeft': st.opacity = Math.min(1, prog * 1.6); st.translate = `${(1 - prog) * d}px 0`; break;
      case 'slideRight': st.opacity = Math.min(1, prog * 1.6); st.translate = `${-(1 - prog) * d}px 0`; break;
      case 'scale': case 'pop': st.opacity = Math.min(1, prog * 2); st.scale = String((p.start_scale ?? 0.6) + (1 - (p.start_scale ?? 0.6)) * prog); break;
      case 'blur': st.opacity = prog; st.filter = `blur(${(1 - prog) * (p.blur_px ?? 12)}px)`; break;
      case 'mask': st.clipPath = `inset(${(1 - prog) * 100}% 0 0 0)`; st.translate = `0 ${(1 - prog) * 0.4 * d}px`; break;
      case 'typewriter': st.opacity = local >= 0 ? 1 : 0; break;
    }
    if (local < 0) st.opacity = 0;
    return <span key={i} style={{...st, ...emph(wi)}}>{part}</span>;
  })}</span>;
  function emph(k: number): React.CSSProperties {
    if (k !== emphasisIndex || !p.emphasis || p.emphasis.type === 'none' || !p.emphasis.type) return {};
    const c = p.emphasis.color || accent;
    if (p.emphasis.type === 'color') return {color: c};
    if (p.emphasis.type === 'box') return {background: p.emphasis.box_color || c, borderRadius: 10, padding: '0 10px'};
    if (p.emphasis.type === 'underline') return {textDecoration: `underline ${c} 6px`, textUnderlineOffset: 10};
    if (p.emphasis.type === 'scale') return {scale: '1.12', display: 'inline-block'};
    return {};
  }
};
