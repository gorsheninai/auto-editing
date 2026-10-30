import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {wf} from '../kit';
import {ROBOT, useModels, XBOT} from '../v3d/assets';
import {City, CITY_MODELS} from '../v3d/City';
import {Canvas3D, Cam, Light, TiltShift, V3, Vignette} from '../v3d/stage';
import {ageAt, lightAt} from '../v3d/world';

export type SP = {from: number; dur: number};
export const ALL = [...CITY_MODELS, XBOT, ROBOT];

/** Локальный кадр, секунда ролика и якоря слов в локальных кадрах */
export const useScene = (from: number) => {
  const f = useCurrentFrame();
  const m = useModels(ALL);
  return {f, T: (from + f) / 30, m, w: (word: string, occ = 0) => wf(word, occ) - from};
};

export const CLOTHES = ['#E9E2D6', '#D98C6A', '#7F9CC0', '#E6C27A', '#9DB89A', '#C9A5C9', '#EDE7DF', '#B9876B'];
export const ELDER = ['#B9B6B1', '#A9A6A2', '#C6C2BC', '#9E9B97'];

/** Кольцо людей вокруг центра */
export const ring = (n: number, r0: number, seed = 0, spread = 0.32) => Array.from({length: n}).map((_, k) => {
  const a = (k / n) * Math.PI * 2 + Math.sin(k * 3.1 + seed) * 0.12;
  const r = r0 + ((k * 7) % 3) * spread;
  const x = Math.cos(a) * r, z = Math.sin(a) * r;
  return {x, z, rot: Math.atan2(-x, -z), c: CLOTHES[(k + seed) % CLOTHES.length], off: (k * 0.77) % 3, k};
});

/** Поворот головы к цели с учётом направления тела, рад, ограничен ±lim */
export const lookYaw = (px: number, pz: number, rot: number, tx: number, tz: number, lim = 1.2) => {
  let d = Math.atan2(tx - px, tz - pz) - rot;
  while (d > Math.PI) d -= Math.PI * 2;
  while (d < -Math.PI) d += Math.PI * 2;
  return Math.max(-lim, Math.min(lim, d));
};

/** Наружный план города: свет и возраст мира по секунде ролика, тилт-шифт. */
export const CityShot: React.FC<{T: number; m: NonNullable<ReturnType<typeof useModels>>; cam: V3; look: V3; fov?: number; tilt?: number; tiltCenter?: number;
  over?: Partial<ReturnType<typeof ageAt>>; light?: Partial<ReturnType<typeof lightAt>>; vign?: number; children?: React.ReactNode; after?: React.ReactNode}> = ({
  T, m, cam, look, fov = 35, tilt = 6, tiltCenter = 0.52, over, light, vign = 0.28, children, after,
}) => {
  const a = {...ageAt(T), ...over};
  const l = {...lightAt(T), ...light};
  return (
    <AbsoluteFill>
      <Canvas3D>
        <Light bg={l.bg} sky={l.sky} sunColor={l.sunColor} sun={l.sun} />
        <Cam pos={cam} look={look} fov={fov} />
        <City m={m} desat={a.desat} dark={a.dark} grass={a.grass}>{children}</City>
      </Canvas3D>
      {tilt > 0 && <TiltShift amount={tilt} center={tiltCenter} band={0.16} />}
      <Vignette k={vign} />
      {after}
    </AbsoluteFill>
  );
};

/** Интерьерный план без тилт-шифта */
export const RoomShot: React.FC<{cam: V3; look: V3; fov?: number; bg?: string; sun?: number; sunPos?: V3; sunColor?: string; sky?: string; amb?: number; vign?: number; children?: React.ReactNode; after?: React.ReactNode}> = ({
  cam, look, fov = 38, bg = '#E9E1D3', sun = 1.8, sunPos = [4, 7, 5], sunColor = '#FFF0D8', sky = '#FFF4E2', amb = 0.4, vign = 0.3, children, after,
}) => (
  <AbsoluteFill>
    <Canvas3D>
      <Light bg={bg} sky={sky} sun={sun} sunPos={sunPos} sunColor={sunColor} amb={amb} fog={[40, 90]} />
      <Cam pos={cam} look={look} fov={fov} />
      {children}
    </Canvas3D>
    <Vignette k={vign} />
    {after}
  </AbsoluteFill>
);
