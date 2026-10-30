// Сцены 0–7: хук, роддом, кроватки, врачи, глобус, новости, самолёт, тесты.
import React from 'react';
import {AbsoluteFill, interpolate} from 'remotion';
import {XBOT} from '../v3d/assets';
import {Person} from '../v3d/Person';
import {Beam, Clay, Cradle} from '../v3d/props';
import {cl, io, lerp3, out} from '../v3d/stage';
import {BarsTex, Cloud, Crib, Globe, Mobile, NewsScreenTex, PregTest, Seat, Sign, TestField, TV} from '../v3d/things';
import {Room, rnd} from '../v3d/world';
import {CityShot, RoomShot, SP, ring, useScene} from './common';

// 0. «Что, если люди перестанут рождаться?»
export const S00: React.FC<SP> = ({from, dur}) => {
  const {f, T, m, w} = useScene(from);
  if (!m) return null;
  const stop = w('перестанут') + 4, off = w('рождаться') + 6;
  const tAnim = Math.min(f, stop) / 30;
  const beam = interpolate(f, [off, off + 10], [1, 0], cl);
  const look = interpolate(f, [stop, stop + 12], [0, 1], {...cl, easing: out});
  return (
    <CityShot T={T} m={m} cam={lerp3(f, [0, dur], [[9.5, 13.5, 13], [1.7, 1.25, 2.7]])} look={lerp3(f, [0, dur], [[0, 0, 0], [0, 0.32, 0]])}
      tilt={interpolate(f, [0, dur], [9, 5], cl)}>
      <Cradle position={[0, 0.1, 0]} rotation={[0, 0.5, 0]} scale={0.55} glow={beam} />
      <Beam o={beam} position={[0, 0.1, 0]} />
      {ring(22, 0.85).map((p) => (
        <Person key={p.k} g={m[XBOT]} t={tAnim + p.off} color={p.c} position={[p.x, 0.1, p.z]} rotY={p.rot} pose={{headPitch: 0.4 * look, bend: 0.12 * look}} />
      ))}
    </CityShot>
  );
};

/** Красный крест */
const Cross: React.FC<JSX.IntrinsicElements['group'] & {glow: number}> = ({glow, ...p}) => (
  <group {...p}>
    <mesh><boxGeometry args={[0.36, 0.36, 0.05]} /><Clay c="#FFFFFF" /></mesh>
    <mesh position={[0, 0, 0.03]}><boxGeometry args={[0.26, 0.08, 0.02]} /><Clay c="#D63B2F" e={glow} /></mesh>
    <mesh position={[0, 0, 0.03]}><boxGeometry args={[0.08, 0.26, 0.02]} /><Clay c="#D63B2F" e={glow} /></mesh>
  </group>
);
export const Roddom: React.FC<{glow: number; x?: number}> = ({glow, x = 0}) => (
  <group position={[x, 0, -4.86]}>
    <Sign text="РОДДОМ" w={1.0} h={0.24} glow={glow * 0.8} position={[0, 1.05, 0]} />
    <Cross glow={glow} position={[0.68, 1.05, 0]} />
    <Sign text="идут роды" w={0.5} h={0.12} px={70} bg="#2B2B30" fg={glow > 0.5 ? '#FF5A4A' : '#5A5A5F'} glow={glow} position={[-0.62, 1.05, 0]} />
  </group>
);

// 1. «День первый. В роддомах непривычно тихо.»
export const S01: React.FC<SP> = ({from, dur}) => {
  const {f, T, m, w} = useScene(from);
  if (!m) return null;
  const glow = interpolate(f, [w('тихо'), w('тихо') + 6], [1, 0], cl);
  return (
    <CityShot T={T} m={m} cam={lerp3(f, [0, dur], [[1.2, 1.25, 1.6], [0.25, 1.05, -0.9]])} look={lerp3(f, [0, dur], [[0, 0.8, -5], [0, 0.85, -5]])} tilt={4} tiltCenter={0.5}>
      <Roddom glow={glow} />
      <Person g={m[XBOT]} t={f / 30} color="#F4F4F2" joints="#9DBAD6" position={[-0.4, 0.1, -4.4]} rotY={0.3} />
      <Person g={m[XBOT]} t={f / 30 + 1.2} color="#EDE7DF" position={[0.45, 0.1, -3.6]} rotY={-2.6} clip="walk" />
    </CityShot>
  );
};

const CRIBS: [number, number][] = [[-0.66, 0.7], [0.66, 0.7], [-0.66, -0.75], [0.66, -0.75], [-0.66, -2.2], [0.66, -2.2]];
const Ward: React.FC<{ang: (k: number) => number}> = ({ang}) => (
  <Room w={5} d={6.4} h={3} floor="#CDB89B" wall="#EAF1F2" wall2="#DDE8EA">
    {CRIBS.map(([x, z], k) => (
      <group key={k} position={[x, 0, z]} rotation={[0, Math.PI / 2 + (rnd(k) - 0.5) * 0.12, 0]}>
        <Crib scale={1.1} c={['#F4EEE6', '#E9D8C4', '#DCE7EE'][k % 3]} />
        {k % 2 === 0 && <Mobile ang={ang(k)} position={[0, 1.45, 0]} scale={1.2} />}
      </group>
    ))}
  </Room>
);

// 2. «Ни одного детского крика.»
export const S02: React.FC<SP> = ({from, dur}) => {
  const {f, w} = useScene(from);
  const stop = w('крика') + 6;
  const spin = (k: number) => k + Math.min(f, stop) * 0.035 + interpolate(f, [stop - 10, stop + 8], [0, 0.15], {...cl, easing: out});
  return (
    <RoomShot cam={lerp3(f, [0, dur], [[0.5, 2.4, 4.4], [0.1, 2.0, 3.2]], io)} look={lerp3(f, [0, dur], [[0, 0.7, -0.6], [0, 0.8, -0.9]], io)} sunPos={[3, 6, 6]} fov={46}>
      <Ward ang={spin} />
    </RoomShot>
  );
};

// 3. «Врачи пожимают плечами: совпадение.»
export const S03: React.FC<SP> = ({from, dur}) => {
  const {f, m, w} = useScene(from);
  if (!m) return null;
  const sh = interpolate(f, [w('пожимают'), w('пожимают') + 8, w('совпадение') - 2, w('совпадение') + 8], [0, 1, 1, 0.15], {...cl, easing: out});
  const hs = (f - w('совпадение')) / 30;
  return (
    <RoomShot cam={lerp3(f, [0, dur], [[0.5, 1.6, 5.4], [0.15, 1.5, 4.7]], io)} look={[0, 1.05, 0.6]} sunPos={[3, 6, 6]} fov={46}>
      <Ward ang={(k) => k} />
      <Person g={m[XBOT]} t={f / 30} color="#F7F7F5" joints="#8FB2D3" scale={0.95} position={[-0.42, 0, 2.0]} rotY={0.4} pose={{shrug: sh}}
        add={hs > 0 ? [['headShake', 1, hs * 0.9]] : []} />
      <Person g={m[XBOT]} t={f / 30 + 1.5} color="#F7F7F5" joints="#8FB2D3" scale={0.92} position={[0.48, 0, 1.75]} rotY={-0.45} pose={{shrug: sh * 0.9}} />
    </RoomShot>
  );
};

// 4. «Неделя. Ни одного рождения во всём мире.»
export const S04: React.FC<SP> = ({from, dur}) => {
  const {f, w} = useScene(from);
  const off = interpolate(f, [w('ни', 1), w('мире') + 8], [0, 26], cl);
  const a = interpolate(f, [0, dur], [-0.5, 0.35], cl);
  return (
    <RoomShot cam={[Math.sin(a) * 7.0, 1.0, Math.cos(a) * 7.0]} look={[0, -0.25, 0]} bg="#E6DED0" sunPos={[4, 6, 5]} fov={42}>
      <mesh position={[0, -1.75, 0]} receiveShadow><boxGeometry args={[6, 0.2, 4]} /><Clay c="#B98B62" /></mesh>
      <mesh position={[0, 0, -3]} receiveShadow><planeGeometry args={[20, 12]} /><Clay c="#E6DED0" /></mesh>
      <Globe spin={f * 0.012} off={off} scale={1.25} />
    </RoomShot>
  );
};

// 5. «В новостях только это.»
export const S05: React.FC<SP> = ({from, dur}) => {
  const {f, m, w} = useScene(from);
  const news = NewsScreenTex(), bars = BarsTex();
  if (!m) return null;
  const on = f >= w('только');
  return (
    <RoomShot cam={lerp3(f, [0, dur], [[0.5, 1.5, 4.9], [0.2, 1.45, 4.0]], io)} look={[0, 1.45, -1]} fov={46} bg="#3B4048" sun={0.8} amb={0.25} sky="#9FB0C8" vign={0.45}>
      <Room w={7} d={4} h={3} floor="#4A4F57" wall="#5A6270" wall2="#535A66" window={false}>
        {[0, 1].flatMap((c) => [0, 1, 2].map((r) => (
          <TV key={`${c}${r}`} tex={on || (c + r) % 2 === Math.floor(f / 4) % 2 ? (on ? news : bars) : bars} glow={1}
            position={[(c - 0.5) * 1.22, 0.85 + r * 0.82, -1.85]} />
        )))}
        <mesh position={[0, 0.22, -1.6]} castShadow><boxGeometry args={[2.8, 0.44, 0.6]} /><Clay c="#2E3138" /></mesh>
        <pointLight position={[0, 1.4, -1]} intensity={on ? 3 : 2} distance={5} color={on ? '#FFD9C9' : '#CFE0FF'} />
      </Room>
      <Person g={m[XBOT]} t={f / 30} color="#7F9CC0" scale={0.95} position={[-0.45, 0, 1.6]} rotY={Math.PI + 0.25} pose={{headPitch: -0.1}} />
      <Person g={m[XBOT]} t={f / 30 + 1} color="#D98C6A" scale={0.9} position={[0.55, 0, 2.2]} rotY={Math.PI - 0.3} />
    </RoomShot>
  );
};

// 6. «Кто-то шутит: наконец-то в самолётах тишина.»
export const S06: React.FC<SP> = ({from, dur}) => {
  const {f, m, w} = useScene(from);
  if (!m) return null;
  const quiet = interpolate(f, [w('тишина'), w('тишина') + 10], [0, 1], {...cl, easing: out});
  const laugh = interpolate(f, [w('шутит'), w('шутит') + 6, w('наконец-то') + 12], [0, 1, 0], cl);
  const rows = [1.2, 0.1, -1.0, -2.1, -3.2];
  const seats = [-1.05, -0.5, 0.5, 1.05];
  return (
    <RoomShot cam={lerp3(f, [0, dur], [[0.25, 1.55, 3.3], [0.1, 1.45, 2.6]], io)} look={[0, 1.0, -3]} bg="#DCE6EE" sky="#F4F8FB" sun={1.2} sunPos={[0, 6, 4]} amb={0.6} fov={46}>
      {/* фюзеляж изнутри */}
      <mesh position={[0, 1.0, -1]} rotation={[Math.PI / 2, 0, 0]}><cylinderGeometry args={[1.75, 1.75, 9, 40, 1, true]} /><meshStandardMaterial color="#EEF0F2" side={1} roughness={0.9} /></mesh>
      <mesh position={[0, -0.02, -1]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow><planeGeometry args={[3.4, 9]} /><Clay c="#5C6B7C" /></mesh>
      <mesh position={[0, 0.0, -1]} rotation={[-Math.PI / 2, 0, 0]}><planeGeometry args={[0.6, 9]} /><Clay c="#8C4B4B" /></mesh>
      {rows.flatMap((z) => [-1, 1].map((s) => (
        <mesh key={`${z}${s}`} position={[s * 1.66, 1.35, z]} rotation={[0, s * -Math.PI / 2, 0]}>
          <planeGeometry args={[0.28, 0.38]} /><meshStandardMaterial color="#BFE0F5" emissive="#DFF1FF" emissiveIntensity={1} />
        </mesh>
      )))}
      <Sign text="ТИХИЙ РЕЙС" w={1.1} h={0.22} bg="#1F2A36" fg={quiet > 0.5 ? '#9BE39B' : '#4A5866'} glow={quiet} px={80} position={[0, 1.95, -1.6]} />
      {rows.flatMap((z, r) => seats.map((x, c) => {
        const k = r * 4 + c;
        const empty = k === 6 || k === 13;
        return (
          <group key={k}>
            <Seat position={[x, 0, z]} c={k % 5 === 0 ? '#3F5A78' : '#4C6A8C'} />
            {!empty && (
              <Person g={m[XBOT]} t={(f / 30 + rnd(k) * 3) * (1 - quiet)} color={['#E9E2D6', '#D98C6A', '#9DB89A', '#C9A5C9', '#E6C27A'][k % 5]}
                scale={0.9} position={[x, 0.02, z + 0.02]} rotY={0}
                pose={{sit: 1, headPitch: quiet * (0.3 + rnd(k + 1) * 0.3) - (k % 3 === 0 ? laugh * 0.35 : 0), headYaw: quiet * (rnd(k + 2) - 0.5) * 0.8}} />
            )}
          </group>
        );
      }))}
      {[0, 1, 2].map((k) => <Cloud key={k} position={[-2.1, 1.3 + k * 0.1, -4.6 + ((f * 0.04 + k * 3) % 9)]} scale={0.25} />)}
    </RoomShot>
  );
};

// 7. «Месяц. Шутки заканчиваются. Ни одной новой беременности.»
export const S07: React.FC<SP> = ({from, dur}) => {
  const {f, w} = useScene(from);
  const w0 = w('ни', 2);
  const reveal = (i: number) => {
    if (i === 78) return 0; // центральный тест — отдельный
    const cols = 12, r = Math.floor(i / cols), c = i % cols;
    const d = Math.hypot(r - 5.5, c - 5.5);
    return interpolate(f, [w0 + d * 3, w0 + d * 3 + 10], [0, 1], {...cl, easing: out});
  };
  return (
    <RoomShot cam={lerp3(f, [0, w0 - 4, dur], [[0.0, 0.55, 0.75], [0.0, 1.0, 1.4], [0.0, 7.2, 6.4]], io)}
      look={lerp3(f, [0, w0 - 4, dur], [[0, 0, -0.1], [0, 0, -0.2], [0, 0, -0.9]], io)} bg="#DADDE0" sky="#EEF2F5" sunColor="#F2F5F8" sun={1.6} sunPos={[3, 8, 4]}>
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow><planeGeometry args={[40, 40]} /><Clay c="#D9DCDF" /></mesh>
      <PregTest position={[0, 0.026, 0]} />
      <TestField n={144} cols={12} reveal={reveal} position={[-0.21, 0.026, -0.675]} />
    </RoomShot>
  );
};

void AbsoluteFill;
