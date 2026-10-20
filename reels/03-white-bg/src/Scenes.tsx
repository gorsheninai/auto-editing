import React from 'react';
import {AbsoluteFill, Img, interpolate, spring, staticFile, useCurrentFrame} from 'remotion';
import {ThreeCanvas} from '@remotion/three';
import {RoundedBox, useTexture} from '@react-three/drei';
import * as THREE from 'three';
import {Cam, Clay, CutOut} from './three3d';
import {
  Avatar, Bg, FPS, Grain, HAND, N, S, SANS, Split, TOP_H, clamp, ease, pop, wf,
} from './kit';

type P = {from: number; dur: number};

// ---------- shared bits ----------

/** handwritten marker text: reveals left-to-right, slight tilt, yellow by default */
export const Hand: React.FC<{at: number; x: number; y: number; children: React.ReactNode; size?: number; color?: string; rot?: number; align?: 'left' | 'center'; glow?: boolean; pill?: boolean}> = ({at, x, y, children, size = 92, color = N.yellow, rot = -3, align = 'center', glow = true, pill = false}) => {
  const fr = useCurrentFrame();
  if (fr < at) return null;
  const k = interpolate(fr, [at, at + 10], [0, 100], {...clamp, easing: ease});
  const jit = Math.sin(fr * 1.7) * 0.6;
  return (
    <div style={{position: 'absolute', left: x, top: y, translate: align === 'center' ? '-50% -50%' : '0 -50%', rotate: `${rot + jit * 0.3}deg`,
      fontFamily: HAND, fontWeight: 700, fontSize: size, lineHeight: 1, color, whiteSpace: 'nowrap',
      clipPath: `inset(-20% ${100 - k}% -20% -5%)`, textShadow: glow && !pill ? `0 0 18px ${color}55, 0 3px 0 rgba(0,0,0,0.35)` : undefined,
      ...(pill ? {background: 'rgba(11,13,42,0.88)', padding: '4px 30px 12px', borderRadius: 999, boxShadow: '0 10px 26px rgba(11,13,42,0.35)'} : {})}}>
      {children}
    </div>
  );
};

/** hand-drawn ellipse that draws itself */
const Scribble: React.FC<{at: number; cx: number; cy: number; rx: number; ry: number; color?: string; w?: number}> = ({at, cx, cy, rx, ry, color = N.yellow, w = 7}) => {
  const fr = useCurrentFrame();
  if (fr < at) return null;
  const k = interpolate(fr, [at, at + 9], [0, 1], {...clamp, easing: ease});
  // slightly open, overlapping loop like a marker stroke
  const pts: string[] = [];
  for (let i = 0; i <= 64; i++) {
    const a = -1.9 + (i / 64) * Math.PI * 2.15;
    const wob = 1 + Math.sin(i * 0.9) * 0.025;
    pts.push(`${(cx + Math.cos(a) * rx * wob).toFixed(1)},${(cy + Math.sin(a) * ry * wob).toFixed(1)}`);
  }
  const len = 2 * Math.PI * Math.sqrt((rx * rx + ry * ry) / 2) * 1.1;
  return (
    <svg width={1080} height={TOP_H} style={{position: 'absolute', left: 0, top: 0, overflow: 'visible'}}>
      <polyline points={pts.join(' ')} fill="none" stroke={color} strokeWidth={w} strokeLinecap="round" strokeLinejoin="round"
        strokeDasharray={len} strokeDashoffset={len * (1 - k)} style={{filter: `drop-shadow(0 0 8px ${color}88)`}} />
    </svg>
  );
};

const Check: React.FC<{at: number; x: number; y: number; label: string}> = ({at, x, y, label}) => {
  const fr = useCurrentFrame();
  const on = fr >= at;
  const k = on ? pop(fr, at) : 0;
  const d = interpolate(fr, [at, at + 7], [30, 0], clamp);
  return (
    <div style={{position: 'absolute', left: x, top: y, display: 'flex', alignItems: 'center', gap: 18, opacity: interpolate(fr, [at - 4, at], [0.35, 1], clamp)}}>
      <div style={{width: 58, height: 58, borderRadius: 14, border: `4px solid ${on ? N.yellow : 'rgba(244,244,246,0.5)'}`, position: 'relative', background: on ? 'rgba(255,216,74,0.12)' : 'transparent'}}>
        {on && (
          <svg width={58} height={58} style={{position: 'absolute', left: -4, top: -4, scale: String(0.6 + k * 0.4)}}>
            <path d="M12 30 L25 43 L48 14" fill="none" stroke={N.yellow} strokeWidth={7} strokeLinecap="round" strokeLinejoin="round" strokeDasharray={30} strokeDashoffset={d} />
          </svg>
        )}
      </div>
      <div style={{fontFamily: HAND, fontWeight: 700, fontSize: 62, color: on ? N.off : 'rgba(244,244,246,0.55)', lineHeight: 1}}>{label}</div>
    </div>
  );
};

// ======================= 1 — A: hook =======================
export const SHook: React.FC<P> = ({from}) => {
  const fr = useCurrentFrame();
  const zIn = wf('белом') - from, zOut = wf('без') - from, burn = wf('пересвета') - from;
  const z = fr < zOut
    ? interpolate(fr, [zIn, zIn + 7], [1, 1.12], {...clamp, easing: ease})
    : interpolate(fr, [zOut, zOut + 9], [1.12, 1], {...clamp, easing: ease});
  // "пересвет": a quick burn-out, then the picture comes back clean
  const b = interpolate(fr, [burn, burn + 3, burn + 12], [1, 1.75, 1], clamp);
  return (
    <AbsoluteFill style={{background: N.navy}}>
      <AbsoluteFill style={{scale: String(z), transformOrigin: '50% 34%', filter: b > 1.001 ? `brightness(${b}) saturate(${2 - b})` : undefined}}>
        <Avatar from={from} />
      </AbsoluteFill>
      <AbsoluteFill style={{background: 'linear-gradient(180deg, rgba(11,13,42,0.7) 0%, rgba(11,13,42,0.15) 22%, transparent 40%, transparent 62%, rgba(11,13,42,0.7) 100%)'}} />
      <Hand at={zIn - 2} x={540} y={170} size={118}>на белом — можно</Hand>
      <Hand at={zOut} x={560} y={300} size={88} color={N.pink} rot={2}>главное, без пересвета</Hand>
      <Grain o={0.06} light />
    </AbsoluteFill>
  );
};

// ======================= 2 — B: face checklist (motion) =======================
// pose 'front' (499×765) — face/eyes/mouth zones in source px
const POSE = {x: 400, y: 160, s: 1.2};
const ZONES = {
  face: {cx: 265, cy: 268, rx: 152, ry: 190},
  eyes: {cx: 262, cy: 240, rx: 158, ry: 62},
  mouth: {cx: 266, cy: 338, rx: 88, ry: 46},
};
export const SFaceCheck: React.FC<P> = ({from, dur}) => {
  const fr = useCurrentFrame();
  const tFace = 0, tEyes = wf('глаза') - from, tMouth = wf('рот') - from, tBraces = wf('брекеты') - from;
  const steps: [number, keyof typeof ZONES][] = [[tFace, 'face'], [tEyes, 'eyes'], [tMouth, 'mouth']];
  let cur = 0;
  steps.forEach(([t], i) => { if (fr >= t) cur = i; });
  const prev = steps[Math.max(0, cur - 1)][1], now = steps[cur][1];
  const k = cur === 0 ? 1 : spring({frame: fr - steps[cur][0], fps: FPS, config: {damping: 16, stiffness: 160}});
  const Z = (a: keyof typeof ZONES['face']) => interpolate(k, [0, 1], [ZONES[prev][a], ZONES[now][a]]);
  const zx = Z('cx'), zy = Z('cy'), zrx = Z('rx'), zry = Z('ry');
  const s = POSE.s;
  const pose: React.CSSProperties = {position: 'absolute', left: POSE.x, top: POSE.y + Math.sin(fr / 14) * 4, width: 499 * s};
  const brace = fr >= tBraces ? pop(fr, tBraces) : 0;
  return (
    <Split from={from}>
      <Bg src="img/bg4.jpg" dur={dur} zoom={[1.08, 1.14]} pos="50% 40%" />
      <AbsoluteFill style={{background: 'rgba(11,13,42,0.55)'}} />
      {/* dim pose + lit zone */}
      <Img src={S('poses/front.png')} style={{...pose, filter: 'brightness(0.42) saturate(0.6)'}} />
      <Img src={S('poses/front.png')} style={{...pose, clipPath: `ellipse(${zrx * s}px ${zry * s}px at ${zx * s}px ${zy * s}px)`, filter: 'brightness(1.08)'}} />
      <Scribble key={now} at={steps[cur][0]} cx={POSE.x + zx * s} cy={POSE.y + zy * s} rx={zrx * s + 18} ry={zry * s + 14} />
      {/* braces: tiny sparkle row on the mouth */}
      {brace > 0 && Array.from({length: 5}).map((_, i) => (
        <div key={i} style={{position: 'absolute', left: POSE.x + (230 + i * 18) * s, top: POSE.y + 336 * s, width: 12, height: 12, borderRadius: 3, rotate: '45deg',
          background: N.off, boxShadow: `0 0 14px ${N.yellow}`, scale: String(brace * (0.7 + 0.3 * Math.sin(fr / 2 + i)))}} />
      ))}
      <div style={{position: 'absolute', left: 54, top: 210, fontFamily: SANS, fontWeight: 700, fontSize: 30, letterSpacing: 3, color: N.pink, textTransform: 'uppercase'}}>в кадре видно</div>
      <Check at={tFace} x={54} y={290} label="лицо" />
      <Check at={tEyes} x={54} y={400} label="глаза" />
      <Check at={wf('очками') - from} x={54} y={510} label="очки" />
      <Check at={tMouth} x={54} y={620} label="рот" />
      <Check at={tBraces} x={54} y={730} label="брекеты" />
    </Split>
  );
};

// ======================= 3D helpers =======================
const Canvas3D: React.FC<{children: React.ReactNode; style?: React.CSSProperties}> = ({children, style}) => (
  <ThreeCanvas width={1080} height={TOP_H} shadows gl={{antialias: true}} camera={{fov: 35, position: [0, 0, 10], near: 0.1, far: 200}}
    style={{position: 'absolute', inset: 0, ...style}}>
    {children}
  </ThreeCanvas>
);

type G = JSX.IntrinsicElements['group'];

/** clay photo camera on a short tripod */
const PhotoCam: React.FC<G> = (p) => (
  <group {...p}>
    <RoundedBox args={[1.25, 0.82, 0.62]} radius={0.12} smoothness={4} position={[0, 1.9, 0]} castShadow><Clay c={'#23263F'} r={0.45} /></RoundedBox>
    <RoundedBox args={[0.42, 0.22, 0.4]} radius={0.06} position={[-0.25, 2.38, 0]} castShadow><Clay c={'#23263F'} /></RoundedBox>
    <mesh position={[0, 1.9, 0.5]} rotation={[Math.PI / 2, 0, 0]} castShadow><cylinderGeometry args={[0.33, 0.36, 0.5, 40]} /><Clay c={'#151729'} r={0.35} /></mesh>
    <mesh position={[0, 1.9, 0.76]}><circleGeometry args={[0.27, 40]} /><meshStandardMaterial color={N.violet} roughness={0.1} metalness={0.6} emissive={N.violet} emissiveIntensity={0.25} /></mesh>
    <mesh position={[0.4, 2.38, 0]}><cylinderGeometry args={[0.08, 0.08, 0.12, 20]} /><Clay c={N.pink} /></mesh>
    <mesh position={[0, 1.4, 0]}><cylinderGeometry args={[0.07, 0.07, 0.25, 12]} /><Clay c={'#3a3d55'} /></mesh>
    {[0, 2.09, 4.19].map((a, i) => (
      <mesh key={i} position={[Math.sin(a) * 0.32, 0.65, Math.cos(a) * 0.32]} rotation={[Math.cos(a) * 0.38, 0, -Math.sin(a) * 0.38]} castShadow>
        <cylinderGeometry args={[0.045, 0.035, 1.45, 10]} /><Clay c={'#3a3d55'} />
      </mesh>
    ))}
  </group>
);

/** glowing frame outline (viewfinder) */
const Frame: React.FC<{cx: number; cy: number; w: number; h: number; z: number; color?: string}> = ({cx, cy, w, h, z, color = N.yellow}) => {
  const t = 0.045, L = 0.32;
  const corners: [number, number, number, number][] = [];
  for (const sx of [-1, 1]) for (const sy of [-1, 1]) {
    corners.push([cx + sx * (w / 2 - L / 2), cy + sy * h / 2, L, t]);
    corners.push([cx + sx * w / 2, cy + sy * (h / 2 - L / 2), t, L]);
  }
  return (
    <group position={[0, 0, z]}>
      {corners.map(([x, y, ww, hh], i) => (
        <mesh key={i} position={[x, y, 0]}><planeGeometry args={[ww, hh]} /><meshBasicMaterial color={color} toneMapped={false} /></mesh>
      ))}
      {/* thin dashed edges */}
      {[-1, 1].map((sy) => <mesh key={'h' + sy} position={[cx, cy + sy * h / 2, -0.001]}><planeGeometry args={[w, 0.012]} /><meshBasicMaterial color={color} transparent opacity={0.45} toneMapped={false} /></mesh>)}
      {[-1, 1].map((sx) => <mesh key={'v' + sx} position={[cx + sx * w / 2, cy, -0.001]}><planeGeometry args={[0.012, h]} /><meshBasicMaterial color={color} transparent opacity={0.45} toneMapped={false} /></mesh>)}
      {/* centre cross */}
      <mesh position={[cx, cy, 0]}><planeGeometry args={[0.16, 0.02]} /><meshBasicMaterial color={color} toneMapped={false} /></mesh>
      <mesh position={[cx, cy, 0]}><planeGeometry args={[0.02, 0.16]} /><meshBasicMaterial color={color} toneMapped={false} /></mesh>
    </group>
  );
};

// ======================= 3 — B: 3D studio, frame grows to neck and torso =======================
const PH = 3.4; // cut-out height in world units, plane spans y 0..PH
const py = (px: number) => PH * (1 - px / 765);
const StudioScene: React.FC<{from: number; dur: number}> = ({from, dur}) => {
  const fr = useCurrentFrame();
  const tFrame = wf('кадре') - from, tNeck = wf('шея') - from, tBody = wf('корпус') - from;
  const grow1 = spring({frame: fr - tNeck, fps: FPS, config: {damping: 15}});
  const grow2 = spring({frame: fr - tBody, fps: FPS, config: {damping: 15}});
  const show = interpolate(fr, [tFrame - 2, tFrame + 4], [0, 1], clamp);
  const bottomPx = 450 + grow1 * 140 + grow2 * 170; // head → neck → torso
  const topPx = 30;
  const fw = interpolate(grow2, [0, 1], [1.78, 2.42]);
  const fy0 = py(bottomPx), fy1 = py(topPx);
  const k = interpolate(fr, [0, dur], [0, 1], {...clamp, easing: ease});
  const pull = spring({frame: fr - tFrame, fps: FPS, config: {damping: 20, stiffness: 60}});
  const camZ = interpolate(pull, [0, 1], [5.6, 8.6]);
  const camY = interpolate(pull, [0, 1], [2.55, 2.05]);
  const lookY = interpolate(pull, [0, 1], [2.45, 1.75]);
  return (
    <>
      <color attach="background" args={[N.navy]} />
      <fog attach="fog" args={[N.navy, 12, 26]} />
      <hemisphereLight args={['#CFC6FF', '#1b1e44', 0.75]} />
      <ambientLight intensity={0.25} />
      <directionalLight position={[-4, 6, 6]} intensity={1.5} castShadow shadow-mapSize={[1024, 1024]} />
      <pointLight position={[3, 3, 2]} intensity={6} distance={10} color={N.pink} />
      <Cam pos={[0.6 + k * 0.5, camY, camZ]} look={[0.2, lookY, 0]} fov={34} />
      {/* white paper backdrop sweep */}
      <mesh position={[0, 3.2, -1.6]} receiveShadow><planeGeometry args={[7, 6.4]} /><Clay c={'#ECEAF2'} r={0.9} /></mesh>
      <mesh position={[0, 0, 0.4]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow><planeGeometry args={[7, 4]} /><Clay c={'#E4E1EC'} r={0.9} /></mesh>
      <mesh position={[0, 0.0, -1.6]} rotation={[0, 0, Math.PI / 2]}><cylinderGeometry args={[0.02, 0.02, 7, 6]} /><Clay c={'#cfcbd9'} /></mesh>
      {/* softbox */}
      <group position={[2.7, 0, 0.4]} rotation={[0, -0.7, 0]}>
        <mesh position={[0, 1.5, 0]}><cylinderGeometry args={[0.04, 0.04, 3, 8]} /><Clay c={'#2e3150'} /></mesh>
        <RoundedBox args={[1.3, 1.6, 0.35]} radius={0.06} position={[0, 3.05, 0]} castShadow><Clay c={'#2e3150'} /></RoundedBox>
        <mesh position={[0, 3.05, 0.18]}><planeGeometry args={[1.15, 1.45]} /><meshBasicMaterial color={'#FFF6EA'} toneMapped={false} /></mesh>
      </group>
      <CutOut src="poses/front.png" h={PH} position={[0, PH / 2, -0.2]} />
      <group visible={show > 0.01}>
        <Frame cx={0} cy={(fy0 + fy1) / 2} w={fw} h={fy1 - fy0} z={0.25} />
      </group>
      <PhotoCam position={[-1.95, 0, 1.5]} rotation={[0, 2.21, 0]} scale={0.78} />
    </>
  );
};
export const S3Studio: React.FC<P> = ({from, dur}) => {
  const fr = useCurrentFrame();
  const sharp = wf('чётко') - from;
  const blur = interpolate(fr, [0, sharp, sharp + 6], [7, 7, 0], clamp);
  return (
    <Split from={from}>
      <Canvas3D style={{filter: `blur(${blur}px)`}}><StudioScene from={from} dur={dur} /></Canvas3D>
      <Hand at={sharp} x={540} y={110} size={76} rot={-2} pill>чётко, без размытия</Hand>
      <Hand at={wf('шея') - from} x={860} y={470} size={70} color={N.pink} rot={-4} pill>+ шея</Hand>
      <Hand at={wf('корпус') - from} x={860} y={600} size={70} color={N.pink} rot={3} pill>+ корпус</Hand>
    </Split>
  );
};

// ======================= 4 — B: 3D neon court =======================
const Tube: React.FC<{a: [number, number, number]; b: [number, number, number]; color: string; on: number}> = ({a, b, color, on}) => {
  const va = new THREE.Vector3(...a), vb = new THREE.Vector3(...b);
  const mid = va.clone().add(vb).multiplyScalar(0.5);
  const len = va.distanceTo(vb);
  const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), vb.clone().sub(va).normalize());
  const c = new THREE.Color('#2a2d48').lerp(new THREE.Color(color), on);
  return (
    <mesh position={mid} quaternion={q}>
      <cylinderGeometry args={[0.06, 0.06, len, 12]} />
      <meshBasicMaterial color={c} toneMapped={false} />
    </mesh>
  );
};
const Racket: React.FC<G & {c: string}> = ({c, ...p}) => (
  <group {...p}>
    <mesh scale={[1, 1.28, 1]} castShadow><torusGeometry args={[0.62, 0.07, 14, 48]} /><Clay c={c} r={0.35} e={0.35} /></mesh>
    {Array.from({length: 7}).map((_, i) => (
      <mesh key={'a' + i} position={[(i - 3) * 0.15, 0, 0]}><boxGeometry args={[0.012, 1.45 * Math.sqrt(Math.max(0.05, 1 - ((i - 3) * 0.15 / 0.62) ** 2)), 0.012]} /><meshBasicMaterial color={'#F4F4F6'} /></mesh>
    ))}
    {Array.from({length: 9}).map((_, i) => (
      <mesh key={'b' + i} position={[0, (i - 4) * 0.15, 0]}><boxGeometry args={[1.12 * Math.sqrt(Math.max(0.05, 1 - ((i - 4) * 0.15 / 0.8) ** 2)), 0.012, 0.012]} /><meshBasicMaterial color={'#F4F4F6'} /></mesh>
    ))}
    <mesh position={[0, -1.02, 0]}><cylinderGeometry args={[0.07, 0.05, 0.28, 12]} /><Clay c={c} /></mesh>
    <mesh position={[0, -1.5, 0]} castShadow><cylinderGeometry args={[0.09, 0.09, 0.75, 16]} /><Clay c={'#1d2040'} r={0.8} /></mesh>
  </group>
);
const Plate: React.FC<{on: number}> = ({on}) => {
  const tex = useTexture(staticFile('img/bg5.jpg'));
  tex.colorSpace = THREE.SRGBColorSpace;
  const c = new THREE.Color('#1a1b38').lerp(new THREE.Color('#ffffff'), on);
  return <mesh position={[0, 2.6, -6]}><planeGeometry args={[12.5, 18.75]} /><meshBasicMaterial map={tex} color={c} toneMapped={false} /></mesh>;
};
const NeonScene: React.FC<{from: number; dur: number}> = ({from, dur}) => {
  const fr = useCurrentFrame();
  const tNeon = wf('неонами') - from, tRack = wf('ракетками') - from;
  // flicker on: tubes start one after another, each with a short stutter
  const onAt = (i: number) => {
    const t = fr - tNeon - i * 2;
    if (t < 0) return 0.05;
    if (t < 6) return [1, 0.2, 1, 0.4, 1, 1][t];
    return 1;
  };
  const r = spring({frame: fr - tRack + 2, fps: FPS, config: {damping: 12, stiffness: 190}});
  const camA = interpolate(fr, [0, dur], [-0.28, 0.12]);
  const glow = (i: number) => onAt(i) * 9;
  const tubes: [[number, number, number], [number, number, number], string][] = [
    [[-3.4, -0.6, -1.2], [-3.4, 5.2, -1.2], N.pink], [[3.4, -0.6, -1.2], [3.4, 5.2, -1.2], N.blue],
    [[-3.0, 5.5, -1.2], [3.0, 5.5, -1.2], N.violet], [[-2.2, -0.2, 0.2], [-1.2, 0.6, 0.2], N.violet],
    [[2.2, -0.2, 0.2], [1.2, 0.6, 0.2], N.pink], [[-1.6, 4.7, -1.2], [1.6, 4.7, -1.2], N.blue],
  ];
  return (
    <>
      <color attach="background" args={['#070820']} />
      <fog attach="fog" args={['#070820', 16, 40]} />
      <ambientLight intensity={0.18} />
      <hemisphereLight args={['#4b3f86', '#05061a', 0.35]} />
      <pointLight position={[-4, 3, -3]} intensity={glow(0) * 4} distance={14} color={N.pink} />
      <pointLight position={[4, 3, -3]} intensity={glow(1) * 4} distance={14} color={N.blue} />
      <pointLight position={[0, 4.8, -3]} intensity={glow(2) * 4} distance={14} color={N.violet} />
      <directionalLight position={[2, 6, 6]} intensity={0.5} castShadow />
      <Cam pos={[Math.sin(camA) * 8, 2.3, Math.cos(camA) * 8]} look={[0, 2.1, -1.5]} fov={42} />
      {/* the real neon location as a back plate: dark until the tubes switch on */}
      <Plate on={Math.max(onAt(0), onAt(2))} />
      {tubes.map(([a, b, c], i) => <Tube key={i} a={a} b={b} color={c} on={onAt(i)} />)}
      {/* rackets fly in and cross */}
      <Racket c={N.pink} scale={1.45} position={[interpolate(r, [0, 1], [-6, -0.75]), interpolate(r, [0, 1], [8, 2.2]), 1.6]} rotation={[0.1, 0.45, interpolate(r, [0, 1], [2.4, 0.72]) + Math.sin(fr / 12) * 0.04]} />
      <Racket c={N.blue} scale={1.45} position={[interpolate(r, [0, 1], [6, 0.75]), interpolate(r, [0, 1], [8, 2.2]), 1.5]} rotation={[0.1, -0.45, interpolate(r, [0, 1], [-2.4, -0.72]) - Math.sin(fr / 12) * 0.04]} />
      <mesh position={[0, interpolate(r, [0, 1], [9, 0.6]) + Math.abs(Math.sin(fr / 6)) * 0.5 * r, 2.2]} castShadow>
        <sphereGeometry args={[0.22, 24, 24]} /><meshStandardMaterial color={N.yellow} emissive={N.yellow} emissiveIntensity={0.35} roughness={0.6} />
      </mesh>
    </>
  );
};
export const S3Neon: React.FC<P> = ({from, dur}) => (
  <Split from={from}>
    <Canvas3D><NeonScene from={from} dur={dur} /></Canvas3D>
    <Hand at={wf('прошлую') - from} x={540} y={120} size={90} rot={-2}>прошлая локация</Hand>
    <Grain o={0.05} light />
  </Split>
);

// ======================= 5 — B: swap background (motion) =======================
const CARD = {w: 420, h: 600, y: 300};
export const MSwap: React.FC<P> = ({from, dur}) => {
  const fr = useCurrentFrame();
  const tArrow = 2, tGood = wf('качественное') - from, tNoMan = wf('без', 1) - from, tFly = wf('человека') - from + 6;
  const fill = interpolate(fr, [tGood, tGood + 14], [0, 100], {...clamp, easing: ease});
  const fly = spring({frame: fr - tFly, fps: FPS, config: {damping: 14, stiffness: 110}});
  const L = {x: 70}, R = {x: 590};
  const arrowK = interpolate(fr, [tArrow, tArrow + 14], [1, 0], {...clamp, easing: ease});
  const poseX = interpolate(fly, [0, 1], [L.x + 40, R.x + 40]);
  const poseY = CARD.y + 150 - Math.sin(fly * Math.PI) * 120;
  return (
    <Split from={from}>
      <Bg src="img/bg2.jpg" dur={dur} zoom={[1.15, 1.22]} filter="brightness(0.45) saturate(0.8)" />
      {/* left: photo on white */}
      <div style={{position: 'absolute', left: L.x, top: CARD.y, width: CARD.w, height: CARD.h, borderRadius: 30, overflow: 'hidden', boxShadow: '0 20px 50px rgba(0,0,0,0.45)', scale: String(pop(fr, 0)), rotate: '-3deg'}}>
        <Img src={S('img/bg4.jpg')} style={{width: '100%', height: '100%', objectFit: 'cover', objectPosition: '50% 45%'}} />
      </div>
      <Hand at={0} x={L.x + CARD.w / 2} y={CARD.y - 50} size={64} color={N.off} rot={-3} glow={false}>фото на белом</Hand>
      {/* right: frame waiting for a clean background */}
      <div style={{position: 'absolute', left: R.x, top: CARD.y, width: CARD.w, height: CARD.h, borderRadius: 30, overflow: 'hidden', rotate: '2deg',
        border: `5px dashed ${fr >= tGood + 10 ? 'transparent' : N.yellow}`, background: 'rgba(11,13,42,0.55)', boxSizing: 'border-box', scale: String(pop(fr, 3))}}>
        <Img src={S('img/bg5.jpg')} style={{position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', clipPath: `inset(0 0 ${100 - fill}% 0)`}} />
        {fr < tGood && (
          <div style={{position: 'absolute', inset: 0, display: 'grid', placeItems: 'center', fontFamily: HAND, fontWeight: 700, fontSize: 170, color: N.yellow, opacity: 0.85 + Math.sin(fr / 4) * 0.15}}>?</div>
        )}
      </div>
      <Hand at={tGood} x={R.x + CARD.w / 2} y={CARD.y - 50} size={64} color={N.yellow} rot={2}>фон без человека</Hand>
      {fr >= tNoMan && (
        <div style={{position: 'absolute', left: R.x + CARD.w - 70, top: CARD.y + CARD.h - 70, width: 100, height: 100, borderRadius: 50, background: N.yellow, display: 'grid', placeItems: 'center', scale: String(pop(fr, tNoMan)), boxShadow: `0 0 30px ${N.yellow}88`}}>
          <svg width={60} height={60}><path d="M10 31 L25 46 L51 15" fill="none" stroke={N.navy} strokeWidth={9} strokeLinecap="round" strokeLinejoin="round" /></svg>
        </div>
      )}
      {/* arrow */}
      <svg width={1080} height={TOP_H} style={{position: 'absolute', left: 0, top: 0}}>
        <path d="M 400 240 C 470 150, 600 150, 680 230" fill="none" stroke={N.yellow} strokeWidth={8} strokeLinecap="round" strokeDasharray={340} strokeDashoffset={340 * arrowK} />
        {arrowK < 0.05 && <path d="M 652 200 L 682 233 L 640 244" fill="none" stroke={N.yellow} strokeWidth={8} strokeLinecap="round" strokeLinejoin="round" />}
      </svg>
      {/* the person flies from the white photo into the new background */}
      <Img src={S('poses/stand.png')} style={{position: 'absolute', left: poseX, top: poseY, width: 340, rotate: `${interpolate(fly, [0, 0.5, 1], [-3, 8, 2])}deg`,
        scale: String(pop(fr, 1)), filter: 'drop-shadow(0 18px 24px rgba(0,0,0,0.4))'}} />
      <Hand at={tFly + 10} x={540} y={1000} size={74} color={N.pink} rot={-2}>готово?</Hand>
    </Split>
  );
};

// ======================= 6 — A: outro — light & colour, neon reflections =======================
const Slider: React.FC<{at: number; y: number; label: string; from: number; to: number; color: string}> = ({at, y, label, from: a, to: b, color}) => {
  const fr = useCurrentFrame();
  if (fr < at) return null;
  const k = interpolate(fr, [at + 4, at + 22], [a, b], {...clamp, easing: ease});
  return (
    <div style={{position: 'absolute', left: 90, top: y, width: 900, height: 108, borderRadius: 30, background: 'rgba(11,13,42,0.72)', backdropFilter: 'blur(6px)',
      display: 'flex', alignItems: 'center', gap: 28, padding: '0 34px', boxSizing: 'border-box', scale: String(pop(fr, at)), boxShadow: '0 12px 30px rgba(0,0,0,0.35)'}}>
      <div style={{fontFamily: HAND, fontWeight: 700, fontSize: 66, color: N.yellow, width: 150}}>{label}</div>
      <div style={{flex: 1, height: 10, borderRadius: 5, background: `linear-gradient(90deg, ${N.navy2}, ${color})`, position: 'relative'}}>
        <div style={{position: 'absolute', left: `${k}%`, top: '50%', width: 44, height: 44, borderRadius: 22, background: N.off, translate: '-50% -50%', boxShadow: `0 0 18px ${color}`}} />
      </div>
    </div>
  );
};
export const SOutro: React.FC<P> = ({from}) => {
  const fr = useCurrentFrame();
  const tLight = wf('свет') - from, tColor = wf('цвет') - from, tNeon = wf('неоновые') - from, tBack = wf('на', 2) - from;
  const z = fr < tBack
    ? interpolate(fr, [tNeon, tNeon + 8], [1, 1.1], {...clamp, easing: ease})
    : interpolate(fr, [tBack, tBack + 10], [1.1, 1.03], {...clamp, easing: ease});
  const neon = interpolate(fr, [tNeon, tNeon + 10], [0, 1], clamp);
  const hideSliders = wf('простая') - from;
  const sliderO = interpolate(fr, [hideSliders + 14, hideSliders + 22], [1, 0], clamp);
  const cta = wf('отражения') - from + 6;
  return (
    <AbsoluteFill style={{background: N.navy}}>
      <AbsoluteFill style={{scale: String(z), transformOrigin: '50% 30%'}}>
        <Avatar from={from} />
      </AbsoluteFill>
      {/* what real neon light would add: pink / blue rim from the sides */}
      <AbsoluteFill style={{opacity: neon * (0.8 + Math.sin(fr / 3) * 0.06), mixBlendMode: 'screen',
        background: `radial-gradient(60% 45% at 0% 38%, ${N.pink}aa, transparent 70%), radial-gradient(55% 45% at 100% 34%, ${N.blue}99, transparent 70%)`}} />
      <AbsoluteFill style={{background: 'linear-gradient(180deg, rgba(11,13,42,0.65) 0%, transparent 28%, transparent 62%, rgba(11,13,42,0.7) 100%)'}} />
      <AbsoluteFill style={{opacity: sliderO}}>
        <Slider at={tLight} y={150} label="свет" from={22} to={68} color={N.yellow} />
        <Slider at={tColor} y={290} label="цвет" from={70} to={30} color={N.pink} />
      </AbsoluteFill>
      <Hand at={tNeon} x={540} y={200} size={96} color={N.pink} rot={-3}>неоновые отражения</Hand>
      {fr >= cta && (
        <div style={{position: 'absolute', left: 540, top: 350, translate: '-50% -50%', scale: String(pop(fr, cta)), display: 'flex', alignItems: 'center', gap: 18,
          background: N.yellow, borderRadius: 999, padding: '10px 40px 14px', boxShadow: `0 0 40px ${N.yellow}66`}}>
          <span style={{fontFamily: HAND, fontWeight: 700, fontSize: 62, color: N.navy}}>пиши</span>
          <span style={{fontFamily: SANS, fontWeight: 700, fontSize: 68, letterSpacing: -2, color: N.navy}}>«МОНТАЖ»</span>
        </div>
      )}
      <Grain o={0.06} light />
    </AbsoluteFill>
  );
};

export const BOUNDS = () => [0, wf('лицо'), wf('должны'), wf('на', 1), wf('перенести'), wf('но')];
export const MODES = ['A', 'B', 'B', 'B', 'B', 'A'] as const;
export const SCENES = [SHook, SFaceCheck, S3Studio, S3Neon, MSwap, SOutro];
