import React from 'react';
import {AbsoluteFill, OffthreadVideo, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import type {Win} from './types';

/* Окна спикера. from — кадр начала сегмента в исходном видео (для startFrom). */
const VW = 720, VH = 1280; // исходник аватара
export const ZONES: Record<Win, {top: number; h: number}> = {
  popout: {top: 0, h: 1130}, window: {top: 0, h: 1130}, circle: {top: 0, h: 1420}, strip: {top: 0, h: 1240},
};

export const SpeakerFull: React.FC<{from: number; src: string}> = ({from, src}) => (
  <AbsoluteFill><OffthreadVideo src={staticFile(src)} muted startFrom={from} style={{width: '100%', height: '100%', objectFit: 'cover'}} /></AbsoluteFill>
);

const useEnter = () => {
  const f = useCurrentFrame(), {fps} = useVideoConfig();
  return spring({frame: f, fps, config: {damping: 14}});
};

export const SpeakerWindow: React.FC<{win: Win; from: number; src: string; cut?: string; bg: string}> = ({win, from, src, cut, bg}) => {
  const k = useEnter(); const dy = interpolate(k, [0, 1], [70, 0]);
  if (win === 'circle') {
    const D = 400, cx = 540, cy = 1640;
    return <AbsoluteFill style={{translate: `0 ${dy}px`}}>
      <div style={{position: 'absolute', left: cx - D / 2, top: cy - D / 2, width: D, height: D, borderRadius: '50%', overflow: 'hidden', boxShadow: '0 18px 50px rgba(0,0,0,.28)', scale: String(interpolate(k, [0, 1], [0.85, 1]))}}>
        <OffthreadVideo src={staticFile(src)} muted startFrom={from} style={{position: 'absolute', width: D * 1.35, height: D * 1.35 * VH / VW, left: -D * 0.175, top: -D * 0.18}} />
      </div></AbsoluteFill>;
  }
  if (win === 'strip') {
    const top = 1240;
    return <AbsoluteFill style={{translate: `0 ${dy}px`}}>
      <div style={{position: 'absolute', left: 0, top, width: 1080, height: 1920 - top + 80, overflow: 'hidden'}}>
        <OffthreadVideo src={staticFile(src)} muted startFrom={from} style={{position: 'absolute', width: 1080, height: 1080 * VH / VW, left: 0, top: -260}} />
        <div style={{position: 'absolute', inset: 0, height: 120, background: `linear-gradient(${bg}, rgba(0,0,0,0))`}} />
      </div></AbsoluteFill>;
  }
  // popout и window: окно x=60, y=1390, ширина 960, радиус 54, низ за краем
  const WIN = {x: 60, y: 1390, w: 960, r: 54}, VIDW = 960, VIDTOP = 950, VIDH = VIDW * VH / VW;
  const clip = `polygon(0px 0px, 1080px 0px, 1080px ${WIN.y}px, ${WIN.x + WIN.w}px ${WIN.y}px, ${WIN.x + WIN.w}px 1920px, ${WIN.x}px 1920px, ${WIN.x}px ${WIN.y}px, 0px ${WIN.y}px)`;
  return <AbsoluteFill style={{translate: `0 ${dy}px`}}>
    <div style={{position: 'absolute', left: WIN.x, top: WIN.y, width: WIN.w, height: 1920 - WIN.y + 80, borderRadius: WIN.r, overflow: 'hidden', boxShadow: '0 -10px 40px rgba(28,27,34,0.18)'}}>
      <OffthreadVideo src={staticFile(src)} muted startFrom={from} style={{position: 'absolute', left: 0, top: VIDTOP - WIN.y, width: VIDW, height: VIDH}} />
    </div>
    {win === 'popout' && cut ? <AbsoluteFill style={{clipPath: clip}}>
      <OffthreadVideo src={staticFile(cut)} transparent muted startFrom={from} style={{position: 'absolute', left: WIN.x, top: VIDTOP, width: VIDW, height: VIDH}} />
    </AbsoluteFill> : null}
  </AbsoluteFill>;
};

/* Подложка с точечной сеткой и мягкий переход сцены в подложку */
export const Backdrop: React.FC<{bg: string; dot: string}> = ({bg, dot}) => (
  <AbsoluteFill style={{background: bg}}>
    <AbsoluteFill style={{backgroundImage: `radial-gradient(${dot} 2.4px, transparent 2.8px)`, backgroundSize: '26px 26px'}} />
  </AbsoluteFill>
);
export const SceneZone: React.FC<{h: number; bg: string; children: React.ReactNode}> = ({h, bg, children}) => (
  <div style={{position: 'absolute', left: 0, top: 0, width: 1080, height: h, overflow: 'hidden'}}>
    {children}
    <div style={{position: 'absolute', left: 0, right: 0, bottom: 0, height: 240, background: `linear-gradient(180deg, rgba(0,0,0,0), ${bg})`}} />
  </div>
);
