// Общее: «возраст мира» по времени ролика, комната-интерьер, текстуры-надписи.
import React, {useMemo} from 'react';
import * as THREE from 'three';
import {interpolate} from 'remotion';
import {cl} from './stage';

/** Состояние мира по секунде ролика: город выцветает, темнеет и зарастает. */
export const ageAt = (t: number) => {
  const K = [0, 15, 22, 30, 34, 39, 45, 49, 53, 60.5];
  const desat = interpolate(t, K, [0, 0, 0.15, 0.25, 0.15, 0.4, 0.55, 0.6, 0.7, 0.75], cl);
  const dark = interpolate(t, K, [0, 0, 0.05, 0.08, 0.02, 0.1, 0.15, 0.2, 0.3, 0.4], cl);
  const grass = interpolate(t, [0, 45, 49, 52, 60], [0, 0.05, 0.2, 1, 1], cl);
  return {desat, dark, grass};
};

/** Свет по эпохам: тёплый день → хмурый месяц → снова тепло (5 лет) → серые сумерки. */
export const lightAt = (t: number) => {
  const K = [0, 15, 22, 30, 34, 39, 45, 53, 60.5];
  const mix = (a: string[], i: number) => {
    // кусочно-линейно по K
    let k = 0; while (k < K.length - 2 && t > K[k + 1]) k++;
    const u = Math.min(1, Math.max(0, (t - K[k]) / (K[k + 1] - K[k])));
    return new THREE.Color(a[k]).lerp(new THREE.Color(a[k + 1]), u).getStyle();
    void i;
  };
  const bg = ['#EFE6D8', '#EFE6D8', '#DCDCD6', '#D8D6D0', '#EDE3D2', '#CFCFCB', '#9EA4A6', '#5E6873', '#353C46'];
  const sky = ['#FFF4E2', '#FFF4E2', '#E8ECEF', '#E4E6E8', '#FFF1DC', '#DCE0E2', '#B8C2CA', '#7B8794', '#56606C'];
  const sunC = ['#FFE7C2', '#FFE7C2', '#F1F3F5', '#EEF0F2', '#FFE2B5', '#E7E9EB', '#C9D3DC', '#9FB0C4', '#7D8DA3'];
  const sun = interpolate(t, K, [2.2, 2.2, 1.5, 1.4, 2.2, 1.3, 1.1, 0.9, 0.6], cl);
  return {bg: mix(bg, 0), sky: mix(sky, 0), sunColor: mix(sunC, 0), sun};
};

/** Текстура с надписью/рисунком на canvas */
export const useCanvasTex = (w: number, h: number, draw: (c: CanvasRenderingContext2D) => void, key: string) =>
  useMemo(() => {
    const cv = document.createElement('canvas');
    cv.width = w; cv.height = h;
    draw(cv.getContext('2d')!);
    const t = new THREE.CanvasTexture(cv);
    t.colorSpace = THREE.SRGBColorSpace;
    t.anisotropy = 4;
    return t;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, typeof document !== 'undefined' && document.fonts.check('700 40px InterTight')]);

export const FONT = (px: number, w = 700) => `${w} ${px}px InterTight, sans-serif`;

/** Комната-разрез: пол, задняя и боковая стены, окно со светом. */
export const Room: React.FC<{w?: number; d?: number; h?: number; floor?: string; wall?: string; wall2?: string; window?: boolean; winGlow?: number; children?: React.ReactNode}> = ({
  w = 6, d = 4, h = 2.6, floor = '#D9C7AE', wall = '#EFE7DA', wall2 = '#E6DCCB', window = true, winGlow = 1, children,
}) => (
  <group>
    <mesh receiveShadow rotation={[-Math.PI / 2, 0, 0]}><planeGeometry args={[w, d]} /><meshStandardMaterial color={floor} roughness={0.9} /></mesh>
    <mesh receiveShadow position={[0, h / 2, -d / 2]}><boxGeometry args={[w, h, 0.1]} /><meshStandardMaterial color={wall} roughness={0.95} /></mesh>
    <mesh receiveShadow position={[-w / 2, h / 2, 0]}><boxGeometry args={[0.1, h, d]} /><meshStandardMaterial color={wall2} roughness={0.95} /></mesh>
    {/* плинтус */}
    <mesh position={[0, 0.05, -d / 2 + 0.06]}><boxGeometry args={[w, 0.1, 0.03]} /><meshStandardMaterial color="#FFFFFF" roughness={0.8} /></mesh>
    {window && (
      <group position={[w * 0.18, h * 0.58, -d / 2 + 0.06]}>
        <mesh><boxGeometry args={[1.5, 1.1, 0.04]} /><meshStandardMaterial color="#FFFFFF" /></mesh>
        <mesh position={[0, 0, 0.025]}><planeGeometry args={[1.36, 0.96]} /><meshStandardMaterial color="#DDEBF2" emissive="#FFF6E4" emissiveIntensity={0.9 * winGlow} /></mesh>
        <mesh position={[0, 0, 0.03]}><boxGeometry args={[0.04, 1.0, 0.02]} /><meshStandardMaterial color="#FFFFFF" /></mesh>
        <mesh position={[0, 0, 0.03]}><boxGeometry args={[1.4, 0.04, 0.02]} /><meshStandardMaterial color="#FFFFFF" /></mesh>
      </group>
    )}
    {children}
  </group>
);

export const rnd = (n: number) => { const x = Math.sin(n * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };
