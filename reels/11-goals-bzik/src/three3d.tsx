import React, {useMemo} from 'react';
import {AbsoluteFill, Img, interpolate, useCurrentFrame, staticFile, Easing} from 'remotion';
import {ThreeCanvas, useOffthreadVideoTexture} from '@remotion/three';
import {useThree} from '@react-three/fiber';
import {RoundedBox, useTexture} from '@react-three/drei';
import * as THREE from 'three';
import {C, Grain, SANS, Title, clamp, ease, pop, serifIt, wf} from './kit';

const W = 1080, H = 1920;
const P = {
  cream: '#F4F1EA', ink: '#2A2833', green: '#1F6B45', orange: '#FF6A2B', violet: '#7B61FF', lav: '#CFC6FF',
  yellow: '#FFD23F', mint: '#7FD8BE', gold: '#F2B437', wood: '#E8C79A', grey: '#C9C6CF', white: '#FBFAF7',
};
const easeIO = Easing.bezier(0.65, 0, 0.35, 1);

/** soft clay material */
const Clay: React.FC<{c: string; r?: number; e?: number}> = ({c, r = 0.55, e = 0}) => (
  <meshStandardMaterial color={c} roughness={r} metalness={0} emissive={c} emissiveIntensity={e} />
);

/** lights + background shared by all 3D scenes */
const Stage: React.FC<{bg?: string; fog?: [number, number]; clear?: boolean}> = ({bg = P.cream, fog = [14, 40], clear}) => (
  <>
    {!clear && <color attach="background" args={[bg]} />}
    {!clear && <fog attach="fog" args={[bg, fog[0], fog[1]]} />}
    <hemisphereLight args={[P.lav, P.cream, 0.9]} />
    <ambientLight intensity={0.35} />
    <directionalLight position={[5, 9, 7]} intensity={1.6} castShadow shadow-mapSize={[1024, 1024]}
      shadow-camera-left={-12} shadow-camera-right={12} shadow-camera-top={12} shadow-camera-bottom={-12} />
    <directionalLight position={[-6, 2, 4]} intensity={0.45} color={P.violet} />
  </>
);

/** camera driven by remotion frame */
const Cam: React.FC<{pos: [number, number, number]; look: [number, number, number]; fov?: number}> = ({pos, look, fov}) => {
  const {camera} = useThree();
  camera.position.set(...pos);
  if (fov && (camera as THREE.PerspectiveCamera).fov !== fov) {
    (camera as THREE.PerspectiveCamera).fov = fov;
    (camera as THREE.PerspectiveCamera).updateProjectionMatrix();
  }
  camera.lookAt(...look);
  return null;
};

const Canvas3D: React.FC<{children: React.ReactNode; transparent?: boolean}> = ({children, transparent}) => (
  <ThreeCanvas width={W} height={H} shadows gl={{antialias: true, alpha: !!transparent}} camera={{fov: 35, position: [0, 0, 10], near: 0.1, far: 200}}
    style={{position: 'absolute', inset: 0}}>
    {children}
  </ThreeCanvas>
);

// ======================= PROPS =======================
type G = JSX.IntrinsicElements['group'];

export const GradCap: React.FC<G> = (p) => (
  <group {...p}>
    <mesh castShadow position={[0, 0.25, 0]} rotation={[0, Math.PI / 4, 0]}><boxGeometry args={[2, 0.12, 2]} /><Clay c={P.green} /></mesh>
    <mesh castShadow position={[0, -0.1, 0]}><cylinderGeometry args={[0.7, 0.75, 0.6, 32]} /><Clay c={P.green} /></mesh>
    <mesh position={[0, 0.34, 0]}><sphereGeometry args={[0.1, 16, 16]} /><Clay c={P.yellow} /></mesh>
    <mesh position={[0.62, 0.0, 0.62]} rotation={[0, 0, 0.15]}><cylinderGeometry args={[0.03, 0.03, 0.7, 8]} /><Clay c={P.yellow} /></mesh>
    <mesh position={[0.66, -0.4, 0.62]}><coneGeometry args={[0.1, 0.3, 12]} /><Clay c={P.yellow} /></mesh>
  </group>
);

export const Coins: React.FC<G & {n?: number}> = ({n = 5, ...p}) => (
  <group {...p}>
    {Array.from({length: n}).map((_, i) => (
      <mesh key={i} castShadow position={[Math.sin(i * 2.1) * 0.06, i * 0.22, Math.cos(i * 1.7) * 0.06]}>
        <cylinderGeometry args={[0.7, 0.7, 0.2, 40]} /><Clay c={P.gold} r={0.35} />
      </mesh>
    ))}
  </group>
);

export const Briefcase: React.FC<G> = (p) => (
  <group {...p}>
    <RoundedBox args={[2, 1.4, 0.6]} radius={0.15} smoothness={4} castShadow><Clay c={P.green} /></RoundedBox>
    <mesh position={[0, 0.85, 0]}><torusGeometry args={[0.35, 0.08, 12, 24, Math.PI]} /><Clay c={P.orange} /></mesh>
    <RoundedBox args={[0.4, 0.25, 0.1]} radius={0.04} position={[0, 0.3, 0.33]}><Clay c={P.yellow} /></RoundedBox>
  </group>
);

export const Stopwatch: React.FC<G & {t?: number}> = ({t = 0, ...p}) => (
  <group {...p}>
    <mesh castShadow rotation={[Math.PI / 2, 0, 0]}><cylinderGeometry args={[1, 1, 0.4, 48]} /><Clay c={P.green} /></mesh>
    <mesh position={[0, 0, 0.21]}><circleGeometry args={[0.8, 48]} /><Clay c={P.white} /></mesh>
    <mesh position={[0, 1.12, 0]}><cylinderGeometry args={[0.15, 0.15, 0.3, 16]} /><Clay c={P.orange} /></mesh>
    <mesh position={[0, 0, 0.24]} rotation={[0, 0, -t]}><boxGeometry args={[0.08, 0.7, 0.04]} /><meshStandardMaterial color={P.orange} /></mesh>
  </group>
);

export const Robot: React.FC<G> = (p) => (
  <group {...p}>
    <RoundedBox args={[1.8, 1.4, 1.4]} radius={0.3} smoothness={5} castShadow><Clay c={P.white} /></RoundedBox>
    <RoundedBox args={[1.4, 0.8, 0.1]} radius={0.15} position={[0, 0, 0.7]}><Clay c={P.ink} r={0.3} /></RoundedBox>
    <mesh position={[-0.3, 0.05, 0.77]}><sphereGeometry args={[0.13, 16, 16]} /><Clay c={P.mint} e={0.6} /></mesh>
    <mesh position={[0.3, 0.05, 0.77]}><sphereGeometry args={[0.13, 16, 16]} /><Clay c={P.mint} e={0.6} /></mesh>
    <mesh position={[-1, 0, 0]} rotation={[0, 0, Math.PI / 2]}><cylinderGeometry args={[0.3, 0.3, 0.3, 24]} /><Clay c={P.violet} /></mesh>
    <mesh position={[1, 0, 0]} rotation={[0, 0, Math.PI / 2]}><cylinderGeometry args={[0.3, 0.3, 0.3, 24]} /><Clay c={P.violet} /></mesh>
    <mesh position={[0, 0.95, 0]}><cylinderGeometry args={[0.04, 0.04, 0.4, 8]} /><Clay c={P.ink} /></mesh>
    <mesh position={[0, 1.2, 0]}><sphereGeometry args={[0.14, 16, 16]} /><Clay c={P.orange} /></mesh>
  </group>
);

export const Book: React.FC<G & {c?: string}> = ({c = P.violet, ...p}) => (
  <group {...p}>
    <RoundedBox args={[1.4, 0.32, 1.9]} radius={0.06} castShadow><Clay c={c} /></RoundedBox>
    <mesh position={[0.05, 0, 0]}><boxGeometry args={[1.32, 0.24, 1.8]} /><Clay c={P.white} /></mesh>
  </group>
);

export const Diploma: React.FC<G> = (p) => (
  <group {...p}>
    <mesh castShadow rotation={[0, 0, Math.PI / 2]}><cylinderGeometry args={[0.28, 0.28, 2, 24]} /><Clay c={P.white} /></mesh>
    <mesh rotation={[0, Math.PI / 2, 0]}><torusGeometry args={[0.3, 0.07, 10, 24]} /><Clay c={P.orange} /></mesh>
  </group>
);

export const Laptop: React.FC<G & {open?: number; screen?: THREE.Texture | null; children?: React.ReactNode}> = ({open = 1.85, screen, children, ...p}) => (
  <group {...p}>
    <RoundedBox args={[3.2, 0.14, 2.2]} radius={0.06} castShadow receiveShadow><Clay c={P.grey} r={0.4} /></RoundedBox>
    <mesh position={[0, 0.075, 0.2]} rotation={[-Math.PI / 2, 0, 0]}><planeGeometry args={[2.8, 1.2]} /><Clay c={'#5a5764'} /></mesh>
    <group position={[0, 0.07, -1.08]} rotation={[-(Math.PI - open), 0, 0]}>
      <RoundedBox args={[3.2, 2.1, 0.1]} radius={0.06} position={[0, 1.05, 0]} castShadow><Clay c={P.grey} r={0.4} /></RoundedBox>
      <mesh position={[0, 1.05, 0.056]}><planeGeometry args={[3.0, 1.9]} /><meshBasicMaterial color={'#24222c'} /></mesh>
      {screen && <mesh position={[0, 1.36, 0.06]}><planeGeometry args={[1.95, 1.1]} /><meshBasicMaterial map={screen} toneMapped={false} /></mesh>}
      <group position={[0, 1.05, 0.062]}>{children}</group>
    </group>
  </group>
);

export const Chair: React.FC<G & {c?: string}> = ({c = P.ink, ...p}) => (
  <group {...p}>
    <RoundedBox args={[0.9, 0.14, 0.9]} radius={0.05} position={[0, 0.75, 0]} castShadow><Clay c={c} /></RoundedBox>
    <RoundedBox args={[0.9, 0.9, 0.12]} radius={0.05} position={[0, 1.25, -0.42]} castShadow><Clay c={c} /></RoundedBox>
    <mesh position={[0, 0.4, 0]}><cylinderGeometry args={[0.06, 0.06, 0.7, 8]} /><Clay c={P.grey} /></mesh>
    {Array.from({length: 5}).map((_, i) => (
      <mesh key={i} position={[Math.cos(i * 1.256) * 0.3, 0.08, Math.sin(i * 1.256) * 0.3]} rotation={[0, -i * 1.256, 0]}>
        <boxGeometry args={[0.6, 0.06, 0.08]} /><Clay c={P.grey} />
      </mesh>
    ))}
  </group>
);

export const Desk: React.FC<G> = (p) => (
  <group {...p}>
    <RoundedBox args={[2.6, 0.1, 1.2]} radius={0.04} position={[0, 1.15, 0]} castShadow receiveShadow><Clay c={P.white} /></RoundedBox>
    <mesh position={[-1.2, 0.57, 0]}><boxGeometry args={[0.08, 1.14, 1.1]} /><Clay c={P.grey} /></mesh>
    <mesh position={[1.2, 0.57, 0]}><boxGeometry args={[0.08, 1.14, 1.1]} /><Clay c={P.grey} /></mesh>
    <RoundedBox args={[0.9, 0.05, 0.6]} radius={0.02} position={[0, 1.23, -0.1]}><Clay c={'#8f8c98'} /></RoundedBox>
  </group>
);

export const PencilRocket: React.FC<G & {t?: number}> = ({t = 0, ...p}) => (
  <group {...p}>
    {/* body along +X */}
    <mesh castShadow rotation={[0, 0, Math.PI / 2]}><cylinderGeometry args={[0.45, 0.45, 4, 6]} /><Clay c={P.yellow} /></mesh>
    <mesh position={[2.45, 0, 0]} rotation={[0, 0, -Math.PI / 2]}><coneGeometry args={[0.45, 0.9, 6]} /><Clay c={P.wood} /></mesh>
    <mesh position={[2.82, 0, 0]} rotation={[0, 0, -Math.PI / 2]}><coneGeometry args={[0.13, 0.26, 12]} /><Clay c={P.ink} /></mesh>
    <mesh position={[-2.1, 0, 0]} rotation={[0, 0, Math.PI / 2]}><cylinderGeometry args={[0.47, 0.47, 0.3, 24]} /><Clay c={P.grey} r={0.3} /></mesh>
    <mesh position={[-2.45, 0, 0]} rotation={[0, 0, Math.PI / 2]}><cylinderGeometry args={[0.45, 0.45, 0.45, 24]} /><Clay c={P.orange} /></mesh>
    {/* flame */}
    {[0, 1, 2].map((i) => (
      <mesh key={i} position={[-3.1 - i * 0.35, 0, 0]} rotation={[0, 0, Math.PI / 2]} scale={[1, 1 + Math.sin(t * 1.3 + i) * 0.15, 1]}>
        <coneGeometry args={[0.42 - i * 0.1, 1.2 + i * 0.3, 16]} />
        <meshBasicMaterial color={i === 0 ? P.yellow : P.orange} transparent opacity={0.9 - i * 0.2} />
      </mesh>
    ))}
  </group>
);

/** cloud = cluster of soft spheres */
export const Cloud: React.FC<G & {c?: string}> = ({c = P.lav, ...p}) => (
  <group {...p}>
    {[[0, 0, 0, 1.2], [1.1, -0.2, 0.2, 0.9], [-1.1, -0.25, 0.1, 0.85], [0.4, 0.5, -0.2, 0.8], [-0.5, 0.35, 0.3, 0.7]].map(([x, y, z, r], i) => (
      <mesh key={i} position={[x, y, z]}><sphereGeometry args={[r, 24, 24]} /><Clay c={c} r={0.9} /></mesh>
    ))}
  </group>
);

/** 2D cut-out of the character standing in the 3D world (paper doll) */
const CutOut: React.FC<G & {src: string; h: number}> = ({src, h, ...p}) => {
  const tex = useTexture(staticFile(src));
  tex.colorSpace = THREE.SRGBColorSpace;
  const img = tex.image as HTMLImageElement;
  const w = (h * img.width) / img.height;
  return (
    <group {...p}>
      <mesh><planeGeometry args={[w, h]} /><meshBasicMaterial map={tex} transparent alphaTest={0.05} toneMapped={false} side={THREE.DoubleSide} /></mesh>
    </group>
  );
};

// ======================= SCENES =======================
type SP = {from: number; dur: number};

/** "ещё никогда так быстро" — props orbit around the title, passing in front of and behind it */
const ORBIT = ['cap', 'case', 'watch', 'robot', 'book', 'diploma', 'coins'] as const;
const OrbitProps: React.FC<{front: boolean}> = ({front}) => {
  const fr = useCurrentFrame();
  let ang = 0;
  for (let i = 0; i < fr; i++) ang += 0.035 + i * 0.0035;
  return (
    <>
      <Stage bg={P.cream} fog={[12, 30]} clear />
      <Cam pos={[0, 1.2, interpolate(fr, [0, 45], [15, 12.5], clamp)]} look={[0, 0, 0]} fov={38} />
      {[...ORBIT, ...ORBIT].map((k, i) => {
        const ring = i >= ORBIT.length ? 1 : 0;
        const a = (ring ? -ang * 0.8 : ang) + (i / ORBIT.length) * Math.PI * 2 + ring * 1.9;
        const R = ring ? 5.6 : 4.0;
        const x = Math.cos(a) * R, z = Math.sin(a) * 2.4, y = (ring ? 1 : -1) * Math.sin(a) * 2.8 + (ring ? 3.2 : -0.4) * Math.cos(a * 2) * 0.5;
        if ((z > 0) !== front) return null;
        const rot: [number, number, number] = [a * 0.8, a * 1.3, a * 0.4];
        const s = ring ? 0.55 : 0.62;
        const pos: [number, number, number] = [x, y, z];
        switch (k) {
          case 'cap': return <GradCap key={i} position={pos} rotation={rot} scale={s} />;
          case 'case': return <Briefcase key={i} position={pos} rotation={rot} scale={s} />;
          case 'watch': return <Stopwatch key={i} position={pos} rotation={rot} scale={s} t={a * 4} />;
          case 'robot': return <Robot key={i} position={pos} rotation={rot} scale={s * 0.9} />;
          case 'book': return <Book key={i} position={pos} rotation={rot} scale={s} />;
          case 'diploma': return <Diploma key={i} position={pos} rotation={rot} scale={s} />;
          default: return <Coins key={i} position={pos} rotation={rot} scale={s * 0.8} n={4} />;
        }
      })}
    </>
  );
};
export const S3Orbit: React.FC<SP> = () => (
  <AbsoluteFill style={{background: P.cream}}>
    <Img src={staticFile('img/BG1.jpg')} style={{position: 'absolute', width: '100%', height: '100%', objectFit: 'cover', opacity: 0.85}} />
    <Canvas3D transparent><OrbitProps front={false} /></Canvas3D>
    <Title top={800} a="ещё никогда" b="так быстро" sizeA={96} sizeB={130} />
    <Canvas3D transparent><OrbitProps front /></Canvas3D>
    <Grain />
  </AbsoluteFill>
);
/** "нейросети полностью поменяли рынок труда" — staircase twists into a loop, steps fly apart */
const STEP_COLS = [P.lav, P.mint, P.yellow, P.orange, P.green, P.violet];
const Coaster: React.FC<{dur: number}> = ({dur}) => {
  const fr = useCurrentFrame();
  const k = interpolate(fr, [6, dur * 0.75], [0, 1], {...clamp, easing: easeIO});
  const burst = interpolate(fr, [dur * 0.55, dur], [0, 1], clamp);
  const N = 22;
  const steps = useMemo(() => Array.from({length: N}).map((_, i) => i), []);
  const camA = interpolate(fr, [0, dur], [-0.35, 0.55]);
  return (
    <>
      <Stage bg={P.cream} fog={[14, 34]} />
      <Cam pos={[Math.sin(camA) * 23, 4 + k * 2, Math.cos(camA) * 23]} look={[0, 3.2, 0]} fov={38} />
      {steps.map((i) => {
        const s = i / (N - 1);
        // straight staircase
        const p0 = new THREE.Vector3(0, -3 + s * 10, 5 - s * 10);
        // vertical loop (radius 4) centred at y=3
        const a = -Math.PI / 2 + s * Math.PI * 2.2;
        const p1 = new THREE.Vector3((s - 0.5) * 3, 3 + Math.sin(a) * 4, Math.cos(a) * 4);
        const p = p0.lerp(p1, k);
        const spin = burst * (i % 2 ? 1 : -1) * (1 + (i % 5));
        const away = burst * burst * 3 * (i % 3 === 0 ? 1 : 0);
        return (
          <RoundedBox key={i} args={[2.6, 0.45, 1.0]} radius={0.12} smoothness={3} castShadow
            position={[p.x + away * Math.sin(i), p.y + away, p.z + away * Math.cos(i)]}
            rotation={[k * (a + Math.PI / 2) + spin * 0.6, spin * 0.3, spin * 0.2]}>
            <Clay c={STEP_COLS[i % STEP_COLS.length]} />
          </RoundedBox>
        );
      })}
      <CutOut src="poses/fall.png" h={4.6} position={[interpolate(fr, [0, dur], [-2.2, 1.6]), 2.6 + Math.sin(fr / 5) * 0.3, 7]}
        rotation={[0, 0, interpolate(fr, [0, dur], [0.3, -1.2])]} />
      <GradCap position={[3.5, 6 + fr * 0.03, 1]} rotation={[fr * 0.1, fr * 0.07, 0]} scale={0.6} />
      <Coins position={[-4, 7 - fr * 0.02, 0]} rotation={[fr * 0.08, 0, fr * 0.05]} scale={0.5} n={3} />
    </>
  );
};
export const S3Coaster: React.FC<SP> = ({dur}) => (
  <AbsoluteFill style={{background: P.cream}}>
    <Canvas3D><Coaster dur={dur} /></Canvas3D>
    <Grain />
  </AbsoluteFill>
);

/** "...объявили о сокращении более 120 тысяч рабочих мест" — top-down office, chairs vanish */
const Office: React.FC<{from: number; dur: number}> = ({from, dur}) => {
  const fr = useCurrentFrame();
  const at = wf('120') - from;
  const rows = 6, cols = 3;
  const tilt = interpolate(fr, [0, dur], [0.35, 0.8], {...clamp, easing: ease});
  const dist = interpolate(fr, [0, dur], [16, 22], {...clamp, easing: ease});
  return (
    <>
      <Stage bg={'#EEEAF4'} fog={[20, 45]} />
      <Cam pos={[0, Math.cos(tilt) * dist, Math.sin(tilt) * dist]} look={[0, 0, 0]} fov={42} />
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow position={[0, 0, 0]}><planeGeometry args={[60, 60]} /><Clay c={'#E7E3EE'} /></mesh>
      {Array.from({length: rows * cols}).map((_, i) => {
        const r = Math.floor(i / cols), c = i % cols;
        const x = (c - 1) * 3.4, z = (r - (rows - 1) / 2) * 3.0;
        const keep = r === 2 && c === 1;
        const d = Math.hypot(c - 1, r - 2.5);
        const t0 = at + 6 + d * 7;
        const g = keep ? 0 : interpolate(fr, [t0, t0 + 14], [0, 1], {...clamp, easing: ease});
        return (
          <group key={i} position={[x, 0, z]}>
            <Desk position={[0, 0, -0.6]} />
            <Chair c={keep ? P.orange : '#4a4756'} position={[0 + g * 1.5, -g * 4, 0.6 + g * 2]} rotation={[g * 1.2, Math.PI + g * 2, 0]} scale={1 - g * 0.6} />
          </group>
        );
      })}
    </>
  );
};
export const S3Jobs: React.FC<SP> = ({from, dur}) => {
  const fr = useCurrentFrame();
  const at = wf('120') - from;
  const n = Math.round(interpolate(fr, [at, at + 30], [0, 120000], {...clamp, easing: ease}));
  return (
    <AbsoluteFill style={{background: P.cream}}>
      <Canvas3D><Office from={from} dur={dur} /></Canvas3D>
      <AbsoluteFill style={{background: 'linear-gradient(180deg, rgba(244,241,234,0.95) 0%, rgba(244,241,234,0.7) 22%, transparent 38%)'}} />
      <div style={{position: 'absolute', top: 150, width: '100%', textAlign: 'center'}}>
        <div style={{fontFamily: SANS, fontWeight: 700, fontSize: 170, letterSpacing: -6, color: C.ink, lineHeight: 1}}>
          {fr >= at ? n.toLocaleString('ru-RU').replace(/ |,/g, ' ') : ''}
        </div>
        {fr >= at && <div style={{...serifIt, fontSize: 92, color: C.ink, opacity: interpolate(fr, [at + 10, at + 20], [0, 1], clamp)}}>рабочих мест из-за ИИ</div>}
      </div>
      <Grain />
    </AbsoluteFill>
  );
};

/** "Поэтому нужно перестраивать подход к образованию" — pencil rocket flight through clouds */
const Flight: React.FC<{dur: number}> = ({dur}) => {
  const fr = useCurrentFrame();
  const t = fr;
  const clouds = useMemo(() => Array.from({length: 14}).map((_, i) => ({
    x: ((i * 7.3) % 24) - 12, y: ((i * 5.1) % 18) - 9, z: -4 - (i % 5) * 4, s: 0.8 + (i % 3) * 0.5, c: i % 3 ? P.lav : '#E4DEFF',
  })), []);
  return (
    <>
      <Stage bg={'#F1EDFA'} fog={[10, 34]} />
      <Cam pos={[-2 + fr * 0.02, -0.5, 13]} look={[0.5, 0.3, 0]} fov={40} />
      {clouds.map((c, i) => (
        <Cloud key={i} c={c.c} scale={c.s} position={[((c.x - t * (0.25 + (i % 3) * 0.1) + 30) % 30) - 15, c.y + t * 0.06, c.z]} />
      ))}
      <group position={[0, Math.sin(t / 8) * 0.3, 0]} rotation={[0, -0.35, 0.42 + Math.sin(t / 10) * 0.05]}>
        <PencilRocket t={t} />
        <CutOut src="poses/ride.png" h={3.4} position={[0.1, 1.55, 0.05]} rotation={[0, 0.35, -0.42]} />
      </group>
      {[0, 1, 2, 3].map((i) => (
        <group key={i} position={[6 - ((t * (0.18 + i * 0.04) + i * 4) % 14), -3 + i * 2.2, 2 + (i % 2) * 2]} rotation={[t * 0.05 * (i + 1), t * 0.04, 0]}>
          {i % 2 ? <GradCap scale={0.5} /> : <Book scale={0.5} c={i === 0 ? P.orange : P.violet} />}
        </group>
      ))}
    </>
  );
};
export const S3Rocket: React.FC<SP> = ({dur}) => (
  <AbsoluteFill>
    <Canvas3D><Flight dur={dur} /></Canvas3D>
    <Grain />
  </AbsoluteFill>
);

/** "Кстати, весь этот рилс смонтирован нейросетью" — camera pulls out of a laptop screen playing the reel */
const LaptopScene: React.FC<{dur: number}> = ({dur}) => {
  const fr = useCurrentFrame();
  const tex = useOffthreadVideoTexture({src: staticFile('avatar.mp4')});
  const k = interpolate(fr, [0, dur], [0, 1], {...clamp, easing: ease});
  const ph = interpolate(fr, [0, dur], [-0.85, 0.85], clamp);
  const bars: [number, number, number, string][] = [
    [-0.9, 0.5, -0.62, P.violet], [-0.1, 0.7, -0.62, P.violet], [0.75, 0.5, -0.62, P.violet],
    [-0.6, 0.6, -0.74, P.orange], [0.4, 0.4, -0.74, P.orange], [-0.5, 1.6, -0.86, P.green], [0.75, 0.6, -0.86, P.green],
  ];
  return (
    <>
      <Stage bg={P.cream} fog={[12, 30]} />
      <Cam pos={[interpolate(k, [0, 1], [0, 2.2]), interpolate(k, [0, 1], [1.95, 3.4]), interpolate(k, [0, 1], [0.9, 7.2])]} look={[0, interpolate(k, [0, 1], [1.95, 1.0]), -1.0]} fov={40} />
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.08, 0]} receiveShadow><planeGeometry args={[30, 30]} /><Clay c={P.wood} r={0.7} /></mesh>
      <Laptop screen={tex} open={1.82}>
        {bars.map(([x, w, y, c], i) => (
          <mesh key={i} position={[x * 1.3, y, 0.001]}><planeGeometry args={[w * 1.3, 0.09]} /><meshBasicMaterial color={c} /></mesh>
        ))}
        <mesh position={[ph * 1.3, -0.74, 0.002]}><planeGeometry args={[0.02, 0.42]} /><meshBasicMaterial color={P.orange} /></mesh>
      </Laptop>
      <group position={[-2.6, 0, 0.6]}>
        <mesh castShadow position={[0, 0.4, 0]}><cylinderGeometry args={[0.45, 0.38, 0.8, 32]} /><Clay c={P.white} /></mesh>
        <mesh position={[0, 0.79, 0]} rotation={[-Math.PI / 2, 0, 0]}><circleGeometry args={[0.4, 32]} /><Clay c={'#5b3a24'} /></mesh>
      </group>
      <Book position={[2.6, 0.16, 0.7]} rotation={[0, 0.4, 0]} scale={0.8} />
      <Robot position={[2.4, 0.95, -1.4]} rotation={[0, -0.5, 0]} scale={0.55} />
    </>
  );
};
export const S3Laptop: React.FC<SP> = ({dur}) => (
  <AbsoluteFill style={{background: P.cream}}>
    <Canvas3D><LaptopScene dur={dur} /></Canvas3D>
    <div style={{position: 'absolute', left: 60, right: 60, top: 40, height: 260, borderRadius: 60, background: 'rgba(244,241,234,0.88)', filter: 'blur(14px)'}} />
    <Title at={12} top={70} a="весь этот рилс" b="смонтирован нейросетью" sizeA={72} sizeB={80} />
    <Grain />
  </AbsoluteFill>
);

export {pop};
