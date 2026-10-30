// Сцены 15–21: не хватает молодых, пенсия, 50 лет, город зарастает и робот, 80 лет, последний человек, прощание.
import React from 'react';
import * as THREE from 'three';
import {AbsoluteFill, interpolate} from 'remotion';
import {ROBOT, XBOT} from '../v3d/assets';
import {Car, Tree} from '../v3d/City';
import {Person} from '../v3d/Person';
import {Clay} from '../v3d/props';
import {Robot} from '../v3d/Robot';
import {cl, io, lerp3, out} from '../v3d/stage';
import {Armchair, Bed, Cake, Cart, Clock, Conveyor, Ivy, Jar, Pedestal, Sign} from '../v3d/things';
import {Room, rnd} from '../v3d/world';
import {CityShot, ELDER, RoomShot, SP, useScene} from './common';

const OLD = {bend: 0.35, headPitch: 0.15};

// 15. «На заводах, в больницах и полиции не хватает молодых.»
export const S15: React.FC<SP> = ({from, dur}) => {
  const {f, m, w} = useScene(from);
  if (!m) return null;
  const c1 = w('больницах') - 3, c2 = w('полиции') - 3;
  const shot = f < c1 ? 0 : f < c2 ? 1 : 2;
  const s0 = [0, c1, c2][shot], s1 = [c1, c2, dur][shot];
  const g = f - s0;
  const ghost = interpolate(g, [4, 14], [0, 1], cl);
  const push = lerp3(g, [0, s1 - s0], [[0, 0, 0], [0, -0.1, -0.6]], io);
  const cam = (p: [number, number, number]): [number, number, number] => [p[0] + push[0], p[1] + push[1], p[2] + push[2]];
  const Ghost: React.FC<{x: number; z: number; r?: number}> = ({x, z, r = 0}) => (
    ghost > 0.02 ? <Person g={m[XBOT]} t={0.3} color="#8FB8E8" wire opacity={ghost} scale={0.95} position={[x, 0, z]} rotY={r} /> : null
  );
  const lbl = (t: string) => <Sign text={t} w={1.1} h={0.24} fg="#1E1D22" px={100} position={[0, 2.0, -1.9]} />;
  return (
    <RoomShot cam={cam([0.2, 1.6, 4.8])} look={[0, 1.05, 0]} fov={46} bg={['#D9D2C6', '#DDE6EA', '#D6DBE2'][shot]} sun={1.4}>
      {shot === 0 && (
        <Room w={8} d={4} h={3.2} floor="#9EA3A8" wall="#D8D2C8" wall2="#CEC7BB" window={false}>
          {lbl('ЗАВОД')}
          <Conveyor shift={g * 0.04} position={[0, 0, -0.4]} />
          <Person g={m[XBOT]} t={g / 30} color={ELDER[0]} joints="#5E6E80" scale={0.92} position={[-0.35, 0, 0.35]} rotY={Math.PI} pose={{...OLD, bend: 0.55}} />
          <Ghost x={0.55} z={0.35} r={Math.PI} /><Ghost x={1.2} z={0.6} r={Math.PI} /><Ghost x={-1.05} z={0.7} r={Math.PI} />
        </Room>
      )}
      {shot === 1 && (
        <Room w={8} d={4} h={3.2} floor="#C9D2D6" wall="#EAF1F2" wall2="#DDE8EA">
          {lbl('БОЛЬНИЦА')}
          <Bed position={[-0.5, 0, -0.6]} rotation={[0, Math.PI / 2, 0]} />
          <Person g={m[XBOT]} t={g / 30} color="#F2F2F0" joints="#9AA8B5" scale={0.92} position={[0.15, 0, 0.5]} rotY={-0.4} pose={OLD} />
          <Ghost x={0.85} z={0.1} r={-0.3} /><Ghost x={-0.9} z={0.9} r={0.4} />
        </Room>
      )}
      {shot === 2 && (
        <group>
          <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow><planeGeometry args={[20, 20]} /><Clay c="#8E9399" /></mesh>
          <mesh position={[0, 1.6, -3]}><boxGeometry args={[12, 3.2, 0.2]} /><Clay c="#C7CCD3" /></mesh>
          {lbl('ПОЛИЦИЯ')}
          <group scale={2.0} position={[-0.6, 0, -1.0]}><Car m={m} kind="car_police" position={[0, 0, 0]} rot={Math.PI / 2 + 0.3} /></group>
          <Person g={m[XBOT]} t={g / 30} color="#4E6E9C" joints="#2F4766" scale={0.92} position={[0.55, 0, 0.45]} rotY={-0.5} pose={OLD} />
          <Ghost x={1.1} z={0.0} r={-0.4} /><Ghost x={-0.35} z={1.0} r={0.2} />
        </group>
      )}
    </RoomShot>
  );
};

// 16. «Пенсию платить некому.»
export const S16: React.FC<SP> = ({from, dur}) => {
  const {f, m, w} = useScene(from);
  if (!m) return null;
  const last = w('некому') + 4;
  // монеты падают всё реже; после «некому» новые не появляются
  const spawns = [-30, -22, -15, -9, -4, 2, 9, 18, last - 14];
  const coins: [number, number][] = spawns.map((s, k) => {
    const t = (f - s) / 30;
    const y = 2.4 - 4.9 * t * t;
    const floor = 0.06 + (6 + k) * 0.045;
    return [Math.max(y, floor), (rnd(k) - 0.5) * 0.12] as [number, number];
  }).filter(([y], k) => f >= spawns[k] && y > 0.06 + (6 + k) * 0.045 + 0.001);
  const level = 6 / 14 + spawns.filter((s) => (f - s) / 30 > Math.sqrt((2.4 - 0.4) / 4.9)).length / 14;
  return (
    <RoomShot cam={lerp3(f, [0, dur], [[0.5, 1.6, 3.9], [0.3, 1.35, 3.1]], io)} look={[0.15, 0.95, -0.3]} fov={44} bg="#D6CFC4" sun={1.3}>
      <Room w={8} d={4} h={3.2} floor="#B5AA9A" wall="#E2D9CA" wall2="#D7CDBC" window={false}>
        <Sign text="ПЕНСИЯ" w={1.0} h={0.24} fg="#1E1D22" position={[0.6, 1.95, -1.9]} />
      </Room>
      <mesh position={[0, 0.25, 0]} castShadow receiveShadow><boxGeometry args={[1.4, 0.5, 1.0]} /><Clay c="#A47C58" /></mesh>
      <Jar level={level} coins={coins} position={[0, 0.5, 0]} scale={0.6} />
      <mesh position={[0, 2.25, 0]} rotation={[0, 0, Math.PI / 2]}><cylinderGeometry args={[0.06, 0.06, 0.8, 12]} /><Clay c="#8C9096" r={0.3} /></mesh>
      {[0, 1, 2, 3].map((k) => (
        <Person key={k} g={m[XBOT]} t={f / 30 + k} color={ELDER[k]} scale={0.9} position={[0.75 + k * 0.32, 0, -0.75 - k * 0.45]} rotY={-2.5} pose={{...OLD, bend: 0.45}} />
      ))}
    </RoomShot>
  );
};

// 17. «Пятьдесят лет. Самому молодому человеку на планете пятьдесят.»
export const S17: React.FC<SP> = ({from, dur}) => {
  const {f, m, w} = useScene(from);
  if (!m) return null;
  const lit = interpolate(f, [w('пятьдесят', 1), w('пятьдесят', 1) + 6], [0, 1], {...cl, easing: out});
  const a = interpolate(f, [0, dur], [0.6, -0.4], cl);
  return (
    <RoomShot cam={[Math.sin(a) * 4.2, 2.0, Math.cos(a) * 4.2]} look={[0.15, 1.05, 0]} fov={44} bg="#1E2229" sky="#5E6A80" sun={0.4} amb={0.12} vign={0.55} sunColor="#B9C6DA">
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow><circleGeometry args={[8, 48]} /><Clay c="#3A3F48" /></mesh>
      <spotLight position={[0, 6, 1]} angle={0.42} penumbra={0.5} intensity={60} distance={12} color="#FFE9C9" castShadow />
      <Pedestal position={[0, 0, -0.2]} scale={1.3} c="#D9D2C6" />
      <Person g={m[XBOT]} t={f / 30} color="#9A9893" joints="#5F5D59" scale={0.95} position={[0, 0.53, -0.2]} rotY={0} pose={{bend: 0.12, headPitch: 0.2 - lit * 0.15}} />
      <mesh position={[0.62, 0.35, 0.7]} castShadow><cylinderGeometry args={[0.28, 0.34, 0.7, 24]} /><Clay c="#D9D2C6" /></mesh>
      <Cake lit={lit} position={[0.62, 0.7, 0.7]} scale={0.9} />
      <pointLight position={[0.62, 1.4, 0.9]} intensity={3 * lit} distance={3} color="#FFB45E" />
    </RoomShot>
  );
};

// 18. «Города затихают, дома зарастают. Робот везёт продукты по пустой улице.»
export const S18: React.FC<SP> = ({from, dur}) => {
  const {f, T, m, w} = useScene(from);
  if (!m) return null;
  const cut = w('робот') - 2;
  const quiet = interpolate(f, [w('затихают'), w('затихают') + 12], [1, 0], cl);
  const grow = interpolate(f, [w('зарастают') - 4, w('зарастают') + 26], [0.15, 1], {...cl, easing: out});
  const ivy = [-4, -2, 0, 2, 4].flatMap((x, k) => [
    <Ivy key={'n' + k} g={grow} seed={k * 7} position={[x, 0.1, -4.9]} />,
    <Ivy key={'s' + k} g={grow} seed={k * 11 + 3} position={[x, 0.1, 4.9]} rotation={[0, Math.PI, 0]} />,
    <Ivy key={'w' + k} g={grow} seed={k * 13 + 5} position={[-4.9, 0.1, x]} rotation={[0, Math.PI / 2, 0]} />,
    <Ivy key={'e' + k} g={grow} seed={k * 17 + 1} position={[4.9, 0.1, x]} rotation={[0, -Math.PI / 2, 0]} />,
  ]);
  const roadTrees = Array.from({length: 14}).map((_, k) => {
    const [x, z] = k < 7 ? [-3 + k, 4.95 + rnd(k) * 0.1] : [-3.2 - rnd(k) * 0.15, -3 + (k - 7)];
    return <Tree key={k} position={[x, 0.1, z]} s={Math.max(0.001, grow - 0.3) * (0.5 + rnd(k + 2) * 0.5)} c="#5E8A55" />;
  });
  const lamps = [[-1.3, -1.3], [1.3, -1.3], [-1.3, 1.3], [1.3, 1.3]].map(([x, z], k) => (
    <pointLight key={k} position={[x * 0.95, 1.0, z * 0.95]} intensity={2.2 * quiet} distance={3} color="#FFC97A" />
  ));
  if (f < cut) {
    return (
      <CityShot T={T} m={m} cam={lerp3(f, [0, cut], [[8.5, 10, 11], [6.5, 6.5, 8.5]], io)} look={[0, 0, 0]} tilt={7} over={{grass: grow}}>
        {lamps}{ivy}{roadTrees}
      </CityShot>
    );
  }
  const g = f - cut;
  const rx = interpolate(g, [0, dur - cut], [-1.8, 0.4], cl);
  return (
    <CityShot T={T} m={m} cam={lerp3(g, [0, dur - cut], [[rx - 0.5, 1.5, 1.5], [rx + 0.05, 0.8, 1.9]], io)} look={[rx + 0.19, 0.28, 4.2]} fov={40} tilt={5} tiltCenter={0.56} over={{grass: 1}}>
      {ivy}{roadTrees}
      <Robot g={m[ROBOT]} t={g / 30 * 1.2} position={[rx, 0.1, 4.2]} rotY={Math.PI / 2} height={0.42} />
      <Cart wheel={g * 0.3} scale={0.55} position={[rx + 0.38, 0.1, 4.2]} rotation={[0, Math.PI / 2, 0]} />
    </CityShot>
  );
};

/** Одно горящее окно на доме (2, −3) */
const LitWindow: React.FC<{o: number}> = ({o}) => (
  <group position={[2.0, 0.98, -4.84]}>
    <mesh><planeGeometry args={[0.3, 0.34]} /><meshBasicMaterial color={new THREE.Color('#FFC266').multiplyScalar(0.25 + o * 0.9)} toneMapped={false} /></mesh>
    <pointLight position={[0, 0, 0.4]} intensity={2.5 * o} distance={2.5} color="#FFB45E" />
  </group>
);

// 19. «Восемьдесят лет. Где-то в доме престарелых»
export const S19: React.FC<SP> = ({from, dur}) => {
  const {f, T, m} = useScene(from);
  if (!m) return null;
  return (
    <CityShot T={T} m={m} cam={lerp3(f, [0, dur], [[5.5, 4.2, 4.5], [2.6, 1.25, -2.4]], io)} look={lerp3(f, [0, dur], [[1, 0.5, -3], [2.0, 0.98, -4.85]], io)} tilt={6} tiltCenter={0.5}
      over={{grass: 1}} vign={0.5}>
      <LitWindow o={1} />
    </CityShot>
  );
};

/** Вид из окна: сумерки и заросшие силуэты */
const Outside: React.FC = () => (
  <group position={[0, 0, -3.2]}>
    <mesh position={[0, 2, -2]}><planeGeometry args={[14, 8]} /><meshBasicMaterial color="#56657A" /></mesh>
    {[-2.4, -1.2, 0.4, 1.6, 2.8].map((x, k) => (
      <mesh key={k} position={[x, 0.6 + rnd(k) * 0.6, -1.6]}><boxGeometry args={[0.9, 1.6 + rnd(k) * 1.4, 0.3]} /><meshStandardMaterial color="#2D3540" /></mesh>
    ))}
    {[-2, -0.8, 0.9, 2.2].map((x, k) => <Tree key={k} position={[x, 0, -1]} s={2.2 + rnd(k) * 0.8} c="#2F4A38" />)}
  </group>
);

// 20. «последний человек на Земле смотрит в окно и тихо говорит:»
export const S20: React.FC<SP> = ({from, dur}) => {
  const {f, m, w} = useScene(from);
  if (!m) return null;
  const lift = interpolate(f, [w('говорит') - 6, w('говорит') + 6], [0, 1], {...cl, easing: out});
  return (
    <RoomShot cam={lerp3(f, [0, dur], [[0.7, 1.8, 3.3], [0.35, 1.6, 2.2]], io)} look={[0, 1.15, -1.5]} bg="#1E2229" sky="#7C8CA4" sun={0.7} sunPos={[0, 3, -6]} sunColor="#9FB2CC" amb={0.28} vign={0.6}>
      <group>
        <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow><planeGeometry args={[8, 8]} /><Clay c="#5A4A3E" /></mesh>
        {/* стена с проёмом окна */}
        <mesh position={[-2.05, 1.5, -2]}><boxGeometry args={[2.5, 3, 0.12]} /><Clay c="#4A4F5A" /></mesh>
        <mesh position={[2.05, 1.5, -2]}><boxGeometry args={[2.5, 3, 0.12]} /><Clay c="#4A4F5A" /></mesh>
        <mesh position={[0, 0.4, -2]}><boxGeometry args={[1.6, 0.8, 0.12]} /><Clay c="#4A4F5A" /></mesh>
        <mesh position={[0, 2.6, -2]}><boxGeometry args={[1.6, 0.8, 0.12]} /><Clay c="#4A4F5A" /></mesh>
        <mesh position={[0, 1.5, -1.98]}><boxGeometry args={[0.05, 1.4, 0.06]} /><Clay c="#D9D2C6" /></mesh>
        <mesh position={[0, 0.8, -1.9]}><boxGeometry args={[1.7, 0.06, 0.25]} /><Clay c="#D9D2C6" /></mesh>
        <Clock sec={f / 30 + 12} position={[1.6, 2.2, -1.93]} />
        <Outside />
        <Armchair position={[0, 0, -0.5]} c="#7A4A3E" />
        <Person g={m[XBOT]} t={0.2} color="#B9B6B1" joints="#77746F" scale={0.95} position={[0, 0.02, -0.5]} rotY={Math.PI}
          pose={{sit: 1, headPitch: 0.3 - lift * 0.35, bend: 0.2}} />
        <pointLight position={[0.6, 1.4, 0.6]} intensity={1.6} distance={4} color="#FFB45E" />
      </group>
    </RoomShot>
  );
};

// 21. «прощай, Земля.»
export const S21: React.FC<SP> = ({from, dur}) => {
  const {f, T, m, w} = useScene(from);
  if (!m) return null;
  const off = interpolate(f, [w('земля') + 4, w('земля') + 12], [1, 0], cl);
  const black = interpolate(f, [dur - 18, dur - 2], [0, 1], cl);
  return (
    <CityShot T={T} m={m} cam={lerp3(f, [0, dur], [[2.3, 1.1, -3.2], [9, 13, 12]], io)} look={lerp3(f, [0, dur], [[2.0, 0.98, -4.85], [0, 0, 0]], io)} tilt={7} over={{grass: 1}} vign={0.6}
      after={<AbsoluteFill style={{background: '#000', opacity: black}} />}>
      <LitWindow o={off} />
    </CityShot>
  );
};
