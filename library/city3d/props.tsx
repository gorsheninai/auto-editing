// Предметы макета, собранные кодом: календарь, значки, телефоны, щиты, стеклянный короб, грузовичок, флешка, ларёк…
import React from 'react';
import {RoundedBox} from '@react-three/drei';
import * as THREE from 'three';
import {FONT, Mat, PAL, V3, canvasTex, rr} from './lib';

type G = {p?: V3; r?: number | V3; s?: number | V3};
const rot = (r?: number | V3): V3 => (typeof r === 'number' ? [0, r, 0] : r ?? [0, 0, 0]);

// ---------- отрывной календарь ----------
export const STAGES = [
  {top: 'сегодня', n: '0'}, {top: 'день первый', n: '1'}, {top: 'день второй', n: '2'}, {top: 'неделя', n: '7'},
  {top: 'месяц', n: '30'}, {top: 'три месяца', n: '90'}, {top: 'полгода', n: '180'}, {top: 'год', n: '365'},
];
const pageTex = (i: number) => canvasTex('page' + i, 512, 600, (c) => {
  c.fillStyle = PAL.paper; c.fillRect(0, 0, 512, 600);
  c.fillStyle = PAL.red; c.fillRect(0, 0, 512, 128);
  c.fillStyle = '#fff'; c.font = `700 64px ${FONT}`; c.textAlign = 'center'; c.textBaseline = 'middle';
  c.fillText(STAGES[i].top, 256, 68);
  c.fillStyle = PAL.ink; c.font = `700 ${STAGES[i].n.length > 2 ? 250 : 300}px ${FONT}`;
  c.fillText(STAGES[i].n, 256, 350);
  c.fillStyle = PAL.grey; c.font = `600 44px ${FONT}`;
  c.fillText(i === 0 ? 'всё работает' : i === 1 || i === 2 ? 'день' : 'дней', 256, 540);
});
/** stage — текущий лист, flip 0..1 — переворот предыдущего листа */
export const Calendar: React.FC<G & {stage: number; flip: number}> = ({p, r, s = 1, stage, flip}) => (
  <group position={p} rotation={rot(r)} scale={s}>
    {/* подставка */}
    <RoundedBox args={[1.25, 0.18, 0.7]} radius={0.05} position={[0, 0.09, 0.05]} castShadow receiveShadow><Mat c={PAL.ink} r={0.5} /></RoundedBox>
    <mesh castShadow position={[0, 0.78, -0.02]} rotation={[-0.12, 0, 0]}><boxGeometry args={[1.08, 1.32, 0.12]} /><Mat c="#E9E3D8" /></mesh>
    {/* текущий лист */}
    <group position={[0, 1.44, 0.06]} rotation={[-0.12, 0, 0]}>
      <mesh position={[0, -0.62, 0]}><planeGeometry args={[1.0, 1.17]} /><Mat c="#fff" r={0.9} map={pageTex(stage)} /></mesh>
      {flip > 0 && flip < 1 && stage > 0 && (
        <group rotation={[-flip * Math.PI * 0.95, 0, 0]} position={[0, 0, 0.004]}>
          <mesh position={[0, -0.62, 0]}><planeGeometry args={[1.0, 1.17]} /><meshLambertMaterial color="#fff" map={pageTex(stage - 1)} /></mesh>
          <mesh position={[0, -0.62, -0.002]} rotation={[0, Math.PI, 0]}><planeGeometry args={[1.0, 1.17]} /><meshLambertMaterial color="#EFE9DF" /></mesh>
        </group>
      )}
      {/* кольца */}
      {[-0.3, -0.1, 0.1, 0.3].map((x) => (
        <mesh key={x} position={[x, 0, 0.01]} rotation={[0, Math.PI / 2, 0]}><torusGeometry args={[0.045, 0.012, 8, 16]} /><Mat c="#8A8790" r={0.3} /></mesh>
      ))}
    </group>
  </group>
);

// ---------- значки (нейтральные, без логотипов) ----------
export type IconKind = 'play' | 'chat' | 'globe' | 'game' | 'search' | 'coin' | 'box' | 'code' | 'shield' | 'check' | 'video' | 'music' | 'book' | 'film';
const iconColor: Record<IconKind, string> = {
  play: PAL.coral, chat: PAL.teal, globe: PAL.blue, game: PAL.violet, search: PAL.yellow, coin: PAL.yellow, box: '#C98A4B',
  code: PAL.ink, shield: PAL.blue, check: PAL.green, video: PAL.teal, music: PAL.coral, book: PAL.violet, film: PAL.ink,
};
const drawGlyph = (c: CanvasRenderingContext2D, k: IconKind, col: string) => {
  c.fillStyle = col; c.strokeStyle = col; c.lineWidth = 22; c.lineCap = 'round'; c.lineJoin = 'round';
  const C = 128;
  if (k === 'play' || k === 'film') { c.beginPath(); c.moveTo(98, 70); c.lineTo(178, 128); c.lineTo(98, 186); c.closePath(); c.fill(); }
  if (k === 'chat') { rr(c, 58, 66, 140, 100, 40); c.fill(); c.beginPath(); c.moveTo(82, 150); c.lineTo(70, 196); c.lineTo(120, 160); c.fill(); }
  if (k === 'globe') { c.beginPath(); c.arc(C, C, 66, 0, 7); c.stroke(); c.beginPath(); c.ellipse(C, C, 28, 66, 0, 0, 7); c.stroke(); c.beginPath(); c.moveTo(62, C); c.lineTo(194, C); c.stroke(); }
  if (k === 'game') { rr(c, 52, 92, 152, 80, 40); c.fill(); c.fillStyle = '#fff'; c.fillRect(78, 124, 40, 14); c.fillRect(91, 111, 14, 40); c.beginPath(); c.arc(160, 120, 9, 0, 7); c.arc(178, 140, 9, 0, 7); c.fill(); }
  if (k === 'search') { c.beginPath(); c.arc(114, 112, 44, 0, 7); c.stroke(); c.beginPath(); c.moveTo(146, 146); c.lineTo(188, 188); c.lineWidth = 30; c.stroke(); }
  if (k === 'coin') { c.beginPath(); c.arc(C, C, 64, 0, 7); c.stroke(); c.font = `700 92px ${FONT}`; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('₽', C, C + 4); }
  if (k === 'box') { c.strokeRect(68, 84, 120, 100); c.beginPath(); c.moveTo(68, 116); c.lineTo(188, 116); c.moveTo(128, 84); c.lineTo(128, 116); c.stroke(); }
  if (k === 'code') { c.font = `700 92px ${FONT}`; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('</>', C, C + 4); }
  if (k === 'check') { c.lineWidth = 30; c.beginPath(); c.moveTo(74, 132); c.lineTo(112, 170); c.lineTo(184, 92); c.stroke(); }
  if (k === 'video') { rr(c, 52, 84, 112, 88, 18); c.fill(); c.beginPath(); c.moveTo(170, 128); c.lineTo(206, 96); c.lineTo(206, 160); c.fill(); }
  if (k === 'music') { c.beginPath(); c.arc(98, 170, 24, 0, 7); c.arc(170, 156, 24, 0, 7); c.fill(); c.fillRect(110, 70, 14, 100); c.fillRect(182, 56, 14, 100); c.fillRect(110, 56, 86, 22); }
  if (k === 'book') { c.beginPath(); c.moveTo(C, 80); c.lineTo(C, 186); c.moveTo(C, 80); c.quadraticCurveTo(90, 66, 60, 78); c.lineTo(60, 180); c.quadraticCurveTo(90, 170, C, 186); c.quadraticCurveTo(166, 170, 196, 180); c.lineTo(196, 78); c.quadraticCurveTo(166, 66, C, 80); c.stroke(); }
};
const iconTex = (k: IconKind, grey: boolean) => canvasTex(`ic-${k}-${grey}`, 256, 256, (c) => {
  c.fillStyle = grey ? '#D7D4DA' : '#FFFFFF'; c.fillRect(0, 0, 256, 256);
  drawGlyph(c, k, grey ? '#9C99A2' : iconColor[k]);
});
/** плитка-значок: grey 0..1 — потухание, spin — крутилка загрузки поверх */
export const AppIcon: React.FC<G & {k: IconKind; grey?: number; spin?: number; cross?: number}> = ({p, r, s = 1, k, grey = 0, spin, cross = 0}) => (
  <group position={p} rotation={rot(r)} scale={s}>
    <RoundedBox args={[0.3, 0.3, 0.07]} radius={0.06} smoothness={4} castShadow>
      <Mat c={grey > 0.5 ? '#C9C6CC' : iconColor[k]} e={0.12} />
    </RoundedBox>
    <mesh position={[0, 0, 0.036]}><planeGeometry args={[0.24, 0.24]} /><Mat c="#fff" map={iconTex(k, grey > 0.5)} e={0.25} ec="#fff" /></mesh>
    <mesh position={[0, 0, -0.036]} rotation={[0, Math.PI, 0]}><planeGeometry args={[0.24, 0.24]} /><Mat c="#fff" map={iconTex(k, grey > 0.5)} e={0.25} ec="#fff" /></mesh>
    {spin !== undefined && grey > 0.5 && (
      <mesh position={[0, 0, 0.05]} rotation={[0, 0, -spin]}><torusGeometry args={[0.07, 0.014, 6, 24, Math.PI * 1.4]} /><Mat c={PAL.ink} /></mesh>
    )}
    {cross > 0 && (
      <group position={[0.13, 0.13, 0.06]} scale={cross}>
        <mesh><sphereGeometry args={[0.06, 16, 12]} /><Mat c={PAL.red} /></mesh>
        <mesh position={[0, 0, 0.05]} rotation={[0, 0, Math.PI / 4]}><boxGeometry args={[0.07, 0.016, 0.01]} /><Mat c="#fff" /></mesh>
        <mesh position={[0, 0, 0.05]} rotation={[0, 0, -Math.PI / 4]}><boxGeometry args={[0.07, 0.016, 0.01]} /><Mat c="#fff" /></mesh>
      </group>
    )}
  </group>
);

// ---------- телефон ----------
export const Phone: React.FC<G & {screen?: THREE.Texture; dark?: number; color?: string}> = ({p, r, s = 1, screen, dark = 0, color = PAL.ink}) => (
  <group position={p} rotation={rot(r)} scale={s}>
    <RoundedBox args={[0.5, 1, 0.06]} radius={0.06} smoothness={4} castShadow><Mat c={color} r={0.4} /></RoundedBox>
    <mesh position={[0, 0, 0.031]}><planeGeometry args={[0.44, 0.92]} />
      <meshLambertMaterial color={new THREE.Color('#fff').multiplyScalar(1 - dark * 0.85)} map={screen}  emissive="#fff" emissiveMap={screen} emissiveIntensity={screen ? 0.35 * (1 - dark) : 0} />
    </mesh>
  </group>
);

/** экран обновления приложений с полосой (k — заполнение 0..1, err — покраснение) */
export const updateTex = (k: number, err: boolean) => canvasTex(`upd-${Math.round(k * 100)}-${err}`, 256, 512, (c) => {
  c.fillStyle = '#F7F5F2'; c.fillRect(0, 0, 256, 512);
  const g: IconKind[] = ['play', 'chat', 'globe', 'game', 'music', 'video'];
  g.forEach((ic, i) => {
    const x = 34 + (i % 3) * 66, y = 70 + Math.floor(i / 3) * 70;
    c.fillStyle = '#D0CDD3'; rr(c, x, y, 54, 54, 14); c.fill();
  });
  c.fillStyle = PAL.ink; c.font = `700 30px ${FONT}`; c.textAlign = 'center';
  c.fillText(err ? 'ошибка' : 'обновление', 128, 300);
  c.fillStyle = '#DDD9E0'; rr(c, 30, 330, 196, 26, 13); c.fill();
  c.fillStyle = err ? PAL.red : PAL.blue; rr(c, 30, 330, Math.max(26, 196 * k), 26, 13); c.fill();
  c.fillStyle = err ? PAL.red : PAL.ink; c.font = `700 44px ${FONT}`;
  c.fillText(`${Math.round(k * 100)}%`, 128, 420);
});

// ---------- щит VPN ----------
export const Shield: React.FC<G & {crack?: number}> = ({p, r, s = 1, crack = 0}) => (
  <group position={p} rotation={rot(r)} scale={s}>
    <mesh castShadow scale={[1, 1.15, 0.4]}><sphereGeometry args={[0.08, 20, 14, 0, Math.PI * 2, 0, Math.PI * 0.62]} /><Mat c={crack > 0.5 ? '#9AA0B4' : PAL.blue} /></mesh>
    <mesh position={[0, -0.02, 0.03]}><boxGeometry args={[0.05, 0.04, 0.02]} /><Mat c="#fff" /></mesh>
    <mesh position={[0, 0.005, 0.03]}><torusGeometry args={[0.016, 0.006, 6, 12, Math.PI]} /><Mat c="#fff" /></mesh>
    {crack > 0 && <mesh position={[0, 0.02, 0.035]} rotation={[0, 0, 0.6]} scale={[crack, 1, 1]}><boxGeometry args={[0.12, 0.008, 0.01]} /><Mat c={PAL.ink} /></mesh>}
  </group>
);

/** стрелка-цикл (перезагрузка) */
export const Reload: React.FC<G & {a: number}> = ({p, s = 1, a}) => (
  <group position={p} scale={s} rotation={[0, 0, -a]}>
    <mesh><torusGeometry args={[0.07, 0.013, 6, 24, Math.PI * 1.5]} /><Mat c={PAL.yellow} e={0.2} /></mesh>
    <mesh position={[0.07, -0.015, 0]} rotation={[0, 0, Math.PI]}><coneGeometry args={[0.028, 0.045, 10]} /><Mat c={PAL.yellow} e={0.2} /></mesh>
  </group>
);

// ---------- пузырь-сообщение с текстом ----------
export const bubbleTex = (txt: string, col = '#fff', ink = PAL.ink) => canvasTex(`bb-${txt}-${col}`, 512, 200, (c) => {
  c.clearRect(0, 0, 512, 200);
  c.fillStyle = col; rr(c, 8, 8, 496, 150, 60); c.fill();
  c.beginPath(); c.moveTo(70, 150); c.lineTo(52, 196); c.lineTo(120, 154); c.fill();
  c.fillStyle = ink; c.font = `700 72px ${FONT}`; c.textAlign = 'center'; c.textBaseline = 'middle';
  c.fillText(txt, 256, 86);
});
export const Bubble: React.FC<G & {txt: string; col?: string; ink?: string; w?: number}> = ({p, r, s = 1, txt, col, ink, w = 0.5}) => (
  <group position={p} rotation={rot(r)} scale={s}>
    <mesh><planeGeometry args={[w, (w * 200) / 512]} /><meshLambertMaterial map={bubbleTex(txt, col, ink)} transparent  emissive="#fff" emissiveMap={bubbleTex(txt, col, ink)} emissiveIntensity={0.25} side={THREE.DoubleSide} /></mesh>
  </group>
);

/** плоская надпись-табличка */
export const signTex = (txt: string, bg: string, fg: string, w = 512, h = 192, fs = 100) => canvasTex(`sg-${txt}-${bg}-${w}`, w, h, (c) => {
  c.fillStyle = bg; rr(c, 0, 0, w, h, 28); c.fill();
  c.fillStyle = fg; c.font = `700 ${fs}px ${FONT}`; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(txt, w / 2, h / 2 + 4);
});

// ---------- грузовичок ----------
export const Truck: React.FC<G & {col?: string; wheel?: number; children?: React.ReactNode}> = ({p, r, s = 1, col = PAL.coral, wheel = 0, children}) => (
  <group position={p} rotation={rot(r)} scale={s}>
    <RoundedBox args={[0.34, 0.2, 0.2]} radius={0.03} position={[-0.06, 0.15, 0]} castShadow><Mat c={PAL.paper} /></RoundedBox>
    <RoundedBox args={[0.14, 0.15, 0.19]} radius={0.03} position={[0.18, 0.125, 0]} castShadow><Mat c={col} /></RoundedBox>
    <mesh position={[0.252, 0.15, 0]}><boxGeometry args={[0.01, 0.07, 0.15]} /><Mat c="#9FC6DA" r={0.2} /></mesh>
    {[[-0.15, 0.1], [-0.15, -0.1], [0.17, 0.1], [0.17, -0.1]].map(([x, z], i) => (
      <mesh key={i} position={[x, 0.04, z]} rotation={[Math.PI / 2, wheel, 0]} castShadow><cylinderGeometry args={[0.04, 0.04, 0.03, 14]} /><Mat c={PAL.ink} /></mesh>
    ))}
    <group position={[-0.06, 0.25, 0]}>{children}</group>
  </group>
);

// ---------- флешка ----------
export const Flash: React.FC<G> = ({p, r, s = 1}) => (
  <group position={p} rotation={rot(r)} scale={s}>
    <RoundedBox args={[0.06, 0.13, 0.03]} radius={0.01} castShadow><Mat c={PAL.violet} /></RoundedBox>
    <mesh position={[0, 0.085, 0]} castShadow><boxGeometry args={[0.04, 0.045, 0.02]} /><Mat c="#C8CBD2" r={0.25} /></mesh>
  </group>
);

// ---------- ноутбук ----------
export const Laptop: React.FC<G & {screen?: THREE.Texture; open?: number}> = ({p, r, s = 1, screen, open = 1}) => (
  <group position={p} rotation={rot(r)} scale={s}>
    <RoundedBox args={[0.2, 0.012, 0.14]} radius={0.004} castShadow><Mat c="#BFC2C9" r={0.35} /></RoundedBox>
    <group position={[0, 0.006, -0.07]} rotation={[Math.PI / 2 + (-0.25 - Math.PI / 2) * open, 0, 0]}>
      <mesh position={[0, 0.07, 0]} castShadow><boxGeometry args={[0.2, 0.14, 0.008]} /><Mat c="#BFC2C9" r={0.35} /></mesh>
      <mesh position={[0, 0.07, 0.0045]}><planeGeometry args={[0.185, 0.125]} /><meshLambertMaterial color="#fff" map={screen} emissive="#fff" emissiveMap={screen} emissiveIntensity={screen ? 0.4 : 0} /></mesh>
    </group>
  </group>
);

// ---------- звезда ----------
const starShape = (() => {
  const s = new THREE.Shape();
  for (let i = 0; i < 10; i++) {
    const a = (i / 10) * Math.PI * 2 + Math.PI / 2, rr2 = i % 2 ? 0.045 : 0.1;
    if (i === 0) s.moveTo(Math.cos(a) * rr2, Math.sin(a) * rr2); else s.lineTo(Math.cos(a) * rr2, Math.sin(a) * rr2);
  }
  s.closePath();
  return s;
})();
export const Star: React.FC<G> = ({p, r, s = 1}) => (
  <mesh position={p} rotation={rot(r)} scale={s} castShadow>
    <extrudeGeometry args={[starShape, {depth: 0.03, bevelEnabled: true, bevelSize: 0.01, bevelThickness: 0.01, bevelSegments: 2}]} />
    <Mat c={PAL.yellow} e={0.35} r={0.4} />
  </mesh>
);

// ---------- лавка ----------
export const Bench: React.FC<G> = ({p, r, s = 1}) => (
  <group position={p} rotation={rot(r)} scale={s}>
    <mesh position={[0, 0.055, 0]} castShadow receiveShadow><boxGeometry args={[0.3, 0.014, 0.08]} /><Mat c="#A8754E" /></mesh>
    <mesh position={[0, 0.1, -0.04]} rotation={[-0.15, 0, 0]} castShadow><boxGeometry args={[0.3, 0.06, 0.012]} /><Mat c="#A8754E" /></mesh>
    {[-0.13, 0.13].map((x) => <mesh key={x} position={[x, 0.027, 0]} castShadow><boxGeometry args={[0.014, 0.055, 0.07]} /><Mat c={PAL.ink} /></mesh>)}
  </group>
);

// ---------- ларёк ----------
export const Kiosk: React.FC<G & {price: string; priceS?: number}> = ({p, r, s = 1, price, priceS = 1}) => (
  <group position={p} rotation={rot(r)} scale={s}>
    <RoundedBox args={[0.42, 0.3, 0.3]} radius={0.02} position={[0, 0.15, 0]} castShadow receiveShadow><Mat c="#E9E1D2" /></RoundedBox>
    <mesh position={[0, 0.33, 0.02]} rotation={[0.25, 0, 0]} castShadow><boxGeometry args={[0.5, 0.025, 0.4]} /><Mat c={PAL.teal} /></mesh>
    {/* стопки журналов */}
    {[-0.12, 0, 0.12].map((x, i) => (
      <group key={x} position={[x, 0.3, 0.12]}>
        {[0, 1, 2, 3].map((j) => <mesh key={j} position={[0, j * 0.012, 0]} rotation={[0, (rnd2(i * 7 + j) - 0.5) * 0.3, 0]} castShadow><boxGeometry args={[0.1, 0.01, 0.13]} /><Mat c={[PAL.coral, PAL.yellow, PAL.blue, PAL.violet][(i + j) % 4]} /></mesh>)}
      </group>
    ))}
    <group position={[0.16, 0.5, 0.18]} scale={priceS}>
      <mesh><planeGeometry args={[0.24, 0.1]} /><meshLambertMaterial map={signTex(price, PAL.yellow, PAL.ink, 384, 160, 96)} transparent emissive="#fff" emissiveMap={signTex(price, PAL.yellow, PAL.ink, 384, 160, 96)} emissiveIntensity={0.25} /></mesh>
    </group>
  </group>
);
const rnd2 = (i: number) => { const x = Math.sin(i * 91.7) * 4375.5; return x - Math.floor(x); };

// ---------- глобус ----------
export const Globe: React.FC<G & {a: number}> = ({p, s = 1, a}) => (
  <group position={p} scale={s} rotation={[0.35, a, 0]}>
    <mesh castShadow><sphereGeometry args={[0.5, 40, 28]} /><Mat c={PAL.blue} r={0.5} /></mesh>
    {Array.from({length: 7}).map((_, i) => (
      <mesh key={i} position={[Math.cos(i * 1.7) * 0.42 * Math.cos(i * 0.9 - 0.4), Math.sin(i * 0.9 - 0.4) * 0.42, Math.sin(i * 1.7) * 0.42 * Math.cos(i * 0.9 - 0.4)]}
        scale={[0.16 + rnd2(i) * 0.12, 0.1 + rnd2(i + 3) * 0.1, 0.16]}>
        <sphereGeometry args={[1, 12, 8]} /><Mat c={PAL.green} />
      </mesh>
    ))}
    <mesh rotation={[Math.PI / 2, 0, 0]}><torusGeometry args={[0.66, 0.008, 6, 64]} /><Mat c="#fff" e={0.6} /></mesh>
    <mesh rotation={[Math.PI / 2.4, 0.6, 0]}><torusGeometry args={[0.72, 0.008, 6, 64]} /><Mat c="#fff" e={0.6} /></mesh>
  </group>
);
