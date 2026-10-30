import React from 'react';
import {AbsoluteFill, Easing, continueRender, delayRender, interpolate, useCurrentFrame} from 'remotion';
import FX from './fx.json';
import {ThreeCanvas} from '@remotion/three';
import {useThree} from '@react-three/fiber';
import * as THREE from 'three';

export const W = 1080, H = 1920, FPS = 30;
export const cl = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;
export const io = Easing.bezier(0.65, 0, 0.35, 1);
export const out = Easing.bezier(0.16, 1, 0.3, 1);
export type V3 = [number, number, number];

/** Камера целиком от кадра: позиция и цель по ключам. */
export const Cam: React.FC<{pos: V3; look: V3; fov?: number}> = ({pos, look, fov = 35}) => {
  const {camera} = useThree();
  const c = camera as THREE.PerspectiveCamera;
  c.position.set(...pos);
  if (c.fov !== fov) { c.fov = fov; c.updateProjectionMatrix(); }
  c.lookAt(...look);
  return null;
};

/** интерполяция вектора по ключам кадров */
export const lerp3 = (f: number, keys: number[], vals: V3[], easing = io): V3 =>
  [0, 1, 2].map((k) => interpolate(f, keys, vals.map((v) => v[k]), {...cl, easing})) as V3;

export const Light: React.FC<{sky?: string; ground?: string; sun?: number; sunColor?: string; amb?: number; bg?: string; fog?: [number, number]; sunPos?: V3}> = ({
  sky = '#FFF4E2', ground = '#C8B8A6', sun = 2.2, sunColor = '#FFE7C2', amb = 0.35, bg = '#EFE6D8', fog = [30, 70], sunPos = [8, 14, 6],
}) => (
  <>
    <color attach="background" args={[bg]} />
    <fog attach="fog" args={[bg, fog[0], fog[1]]} />
    <hemisphereLight args={[sky, ground, 0.9]} />
    <ambientLight intensity={amb} />
    <directionalLight position={sunPos} intensity={sun} color={sunColor} castShadow shadow-mapSize={[2048, 2048]} shadow-bias={-0.0004}
      shadow-camera-left={-10} shadow-camera-right={10} shadow-camera-top={10} shadow-camera-bottom={-10} shadow-camera-far={60} />
  </>
);

/** Рисует кадр ровно один раз на каждый кадр Remotion (frameloop="never"): без лишних перерисовок по rAF. */
const FrameDriver: React.FC = () => {
  const frame = useCurrentFrame();
  const {advance} = useThree();
  React.useEffect(() => {
    const h = delayRender('three frame');
    advance(performance.now());
    continueRender(h);
  }, [frame, advance]);
  return null;
};

export const Canvas3D: React.FC<{children: React.ReactNode}> = ({children}) => (
  <ThreeCanvas width={W} height={H} shadows={FX.shadows} frameloop="never" dpr={FX.dpr}
    gl={{antialias: FX.aa, toneMapping: THREE.ACESFilmicToneMapping, powerPreference: 'high-performance'}}
    camera={{fov: 35, position: [0, 5, 10], near: 0.05, far: 200}}
    style={{position: 'absolute', inset: 0}}>
    {children}
    <FrameDriver />
  </ThreeCanvas>
);

/** Тилт-шифт: размытие верхней и нижней полос кадра поверх канваса (как в фото миниатюр). */
export const TiltShift: React.FC<{amount?: number; center?: number; band?: number}> = ({amount = 7, center = 0.5, band = 0.18}) => {
  if (!FX.tilt) return null;
  const a = (center - band) * 100, b = (center + band) * 100;
  const mask = (dir: 'top' | 'bottom') => dir === 'top'
    ? `linear-gradient(to bottom, black 0%, black ${Math.max(0, a - 22)}%, transparent ${a}%)`
    : `linear-gradient(to top, black 0%, black ${Math.max(0, 100 - b - 22)}%, transparent ${100 - b}%)`;
  return (
    <AbsoluteFill style={{pointerEvents: 'none'}}>
      {(['top', 'bottom'] as const).map((d) => (
        <div key={d} style={{position: 'absolute', inset: 0, backdropFilter: `blur(${amount}px) saturate(1.08)`, WebkitMaskImage: mask(d), maskImage: mask(d)}} />
      ))}
    </AbsoluteFill>
  );
};

/** Мягкая виньетка и плёночное зерно поверх */
export const Vignette: React.FC<{k?: number}> = ({k = 0.35}) => (
  <AbsoluteFill style={{pointerEvents: 'none', background: `radial-gradient(ellipse at 50% 45%, transparent 55%, rgba(30,24,20,${k}) 100%)`}} />
);
