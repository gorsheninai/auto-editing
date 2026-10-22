// @ts-nocheck — JSX-типы three не подхватываются в этом tsconfig
import React from 'react';
import {AbsoluteFill, interpolate, useCurrentFrame, Easing} from 'remotion';
import {ThreeCanvas} from '@remotion/three';
import {useThree} from '@react-three/fiber';
import * as THREE from 'three';
import type {SceneProps} from './registry';
import {clamp} from '../blocks/kit';
import {C, useAt, W} from './bzik';

/* D3 «две комнаты»: low-poly изометрия в духе PS1 (плоская заливка, мало граней).
   В одной комнате человечек с телефоном, на слове «другой» телефон переезжает в соседнюю комнату. */

const Flat: React.FC<{c: string}> = ({c}) => <meshLambertMaterial color={c} flatShading />;

const Cam: React.FC<{f: number}> = ({f}) => {
  const {camera} = useThree();
  const a = Math.PI / 4 + interpolate(f, [0, 60], [-0.06, 0.06], clamp);
  camera.position.set(Math.sin(a) * 21, 17, Math.cos(a) * 21);
  camera.lookAt(0, 0.6, 0);
  return null;
};

/* комната: пол + две стены (задняя и левая), как у кукольного домика */
const Room: React.FC<{x: number; floor: string; wall: string}> = ({x, floor, wall}) => (
  <group position={[x, 0, 0]}>
    <mesh receiveShadow position={[0, -0.15, 0]}><boxGeometry args={[3.6, 0.3, 3.6]} /><Flat c={floor} /></mesh>
    <mesh castShadow receiveShadow position={[0, 1.2, -1.8]}><boxGeometry args={[3.6, 2.4, 0.2]} /><Flat c={wall} /></mesh>
    <mesh castShadow receiveShadow position={[-1.8, 1.2, 0]}><boxGeometry args={[0.2, 2.4, 3.6]} /><Flat c={wall} /></mesh>
  </group>
);

/* блочный человечек из коробок — как пиксельный, но в объёме */
const Man: React.FC<{ink: string; acc: string}> = ({ink, acc}) => (
  <group position={[-1.9, 0, 0.5]}>
    <mesh castShadow position={[0, 1.55, 0]}><boxGeometry args={[0.5, 0.5, 0.5]} /><Flat c={ink} /></mesh>
    <mesh castShadow position={[0, 0.95, 0]}><boxGeometry args={[0.6, 0.7, 0.35]} /><Flat c={acc} /></mesh>
    <mesh castShadow position={[-0.15, 0.3, 0]}><boxGeometry args={[0.2, 0.6, 0.25]} /><Flat c={ink} /></mesh>
    <mesh castShadow position={[0.15, 0.3, 0]}><boxGeometry args={[0.2, 0.6, 0.25]} /><Flat c={ink} /></mesh>
  </group>
);

const PhoneBox: React.FC<{pos: [number, number, number]; rot: number; ink: string; acc: string}> = ({pos, rot, ink, acc}) => (
  <group position={pos} rotation={[0, rot, 0]}>
    <mesh castShadow position={[0, 0.06, 0]}><boxGeometry args={[0.55, 0.1, 0.95]} /><Flat c={ink} /></mesh>
    <mesh position={[0, 0.115, 0]}><boxGeometry args={[0.45, 0.02, 0.8]} /><Flat c={acc} /></mesh>
  </group>
);

export const GRooms: React.FC<SceneProps> = (p) => {
  const f = useCurrentFrame(); const at = useAt(p); const c = C();
  const go = at(45);
  const k = interpolate(f, [go - 2, go + 9], [0, 1], {...clamp, easing: Easing.bezier(0.7, 0, 0.3, 1)});
  /* телефон: рядом с человечком → дугой через проём в соседнюю комнату */
  const x = interpolate(k, [0, 1], [-1.1, 2.2]);
  const y = 0.05 + Math.sin(k * Math.PI) * 1.4;
  const placed = f >= go + 9;
  return <AbsoluteFill style={{background: c.bg}}>
    <ThreeCanvas width={1080} height={1920} shadows gl={{antialias: false}} camera={{fov: 30, position: [12, 13, 12], near: 0.1, far: 200}}
      style={{position: 'absolute', inset: 0}}>
      <color attach="background" args={[c.bg]} />
      <Cam f={f} />
      <ambientLight intensity={1.0} />
      <hemisphereLight args={['#FFFFFF', '#E4DDCF', 0.6]} />
      <directionalLight position={[6, 12, 8]} intensity={1.5} castShadow shadow-mapSize={[512, 512]}
        shadow-camera-left={-8} shadow-camera-right={8} shadow-camera-top={8} shadow-camera-bottom={-8} />
      <group position={[0, 0, 0]}>
        <Room x={-1.9} floor={c.soft} wall="#FFFFFF" />
        <Room x={1.9} floor="#F4F0E8" wall="#FFFFFF" />
        <Man ink={c.ink} acc={c.acc} />
        <PhoneBox pos={[x, y, 0.6]} rot={k * Math.PI * 0.5} ink={c.ink} acc={placed ? c.ink : c.acc} />
      </group>
    </ThreeCanvas>
    <W at={0} x={540} y={470} text="оставь его" size={56} />
    <W at={go} x={760} y={1380} text="другая комната" size={44} color={c.muted} />
  </AbsoluteFill>;
};

export const ROOMS = {GRooms};
