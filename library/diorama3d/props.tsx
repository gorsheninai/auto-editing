// Предметы кодом: колыбель, луч света и др. Материал — матовая «глина».
import React from 'react';
import * as THREE from 'three';
import {RoundedBox} from '@react-three/drei';

type G = JSX.IntrinsicElements['group'];
export const Clay: React.FC<{c: string; r?: number; e?: number; o?: number}> = ({c, r = 0.8, e = 0, o = 1}) => (
  <meshStandardMaterial color={c} roughness={r} metalness={0} emissive={c} emissiveIntensity={e} transparent={o < 1} opacity={o} />
);

export const Cradle: React.FC<G & {glow?: number}> = ({glow = 0, ...p}) => (
  <group {...p}>
    {/* корзинка */}
    <RoundedBox args={[0.62, 0.26, 0.36]} radius={0.1} smoothness={4} position={[0, 0.3, 0]} castShadow><Clay c="#F3E6D3" /></RoundedBox>
    <RoundedBox args={[0.52, 0.06, 0.28]} radius={0.03} position={[0, 0.43, 0]}><Clay c="#F6C9C2" e={glow * 0.6} /></RoundedBox>
    {/* полог */}
    <mesh position={[-0.22, 0.47, 0]} rotation={[Math.PI / 2, 0, Math.PI / 2]} castShadow>
      <cylinderGeometry args={[0.19, 0.19, 0.38, 24, 1, true, 0, Math.PI]} />
      <meshStandardMaterial color="#E8B9B1" roughness={0.8} side={THREE.DoubleSide} />
    </mesh>
    {/* полозья */}
    {[-0.13, 0.13].map((z) => (
      <mesh key={z} position={[0, 0.48, z]} rotation={[0, 0, -Math.PI / 2 - Math.PI * 0.21]} castShadow>
        <torusGeometry args={[0.42, 0.025, 8, 32, Math.PI * 0.42]} />
        <Clay c="#B98B62" />
      </mesh>
    ))}
    {[-0.2, 0.2].flatMap((x) => [-0.13, 0.13].map((z) => (
      <mesh key={`${x}${z}`} position={[x, 0.2, z]} castShadow><cylinderGeometry args={[0.02, 0.02, 0.16, 6]} /><Clay c="#B98B62" /></mesh>
    )))}
  </group>
);

/** Луч света сверху (прозрачный конус, аддитивный) */
export const Beam: React.FC<G & {o: number; h?: number; r?: number; c?: string}> = ({o, h = 6, r = 0.9, c = '#FFE8B0', ...p}) => (
  <group {...p}>
    <mesh position={[0, h / 2, 0]} visible={o > 0.001}>
      <cylinderGeometry args={[r * 0.35, r, h, 32, 1, true]} />
      <meshBasicMaterial color={c} transparent opacity={0.22 * o} blending={THREE.AdditiveBlending} depthWrite={false} side={THREE.DoubleSide} />
    </mesh>
    <mesh position={[0, 0.03, 0]} rotation={[-Math.PI / 2, 0, 0]} visible={o > 0.001}>
      <circleGeometry args={[r, 40]} />
      <meshBasicMaterial color={c} transparent opacity={0.35 * o} blending={THREE.AdditiveBlending} depthWrite={false} />
    </mesh>
    <pointLight position={[0, 1.2, 0]} intensity={3 * o} distance={4} color={c} />
  </group>
);
