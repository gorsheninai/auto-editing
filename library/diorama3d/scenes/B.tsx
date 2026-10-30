// Сцены 8–14: лаборатория, молитва, знаменитый младенец, коляска, закрытия, «зато», школа.
import React from 'react';
import {AbsoluteFill, interpolate} from 'remotion';
import {RoundedBox} from '@react-three/drei';
import {CITY, XBOT} from '../v3d/assets';
import {Car} from '../v3d/City';
import {Person} from '../v3d/Person';
import {Beam, Clay} from '../v3d/props';
import {cl, io, lerp3, out} from '../v3d/stage';
import {Ball, Blocks, Candle, DNA, Microscope, Pedestal, SchoolDesk, Shutter, Sign, Stroller, Teddy} from '../v3d/things';
import {FONT, Room, rnd, useCanvasTex} from '../v3d/world';
import {Roddom} from './A';
import {CLOTHES, CityShot, RoomShot, SP, lookYaw, ring, useScene} from './common';

// 8. «Учёные не понимают причину.»
export const S08: React.FC<SP> = ({from, dur}) => {
  const {f, m, w} = useScene(from);
  if (!m) return null;
  const sc = interpolate(f, [w('понимают'), w('понимают') + 22], [0, 1], {...cl, easing: out});
  const sh = interpolate(f, [w('причину') - 2, w('причину') + 8], [0, 1], {...cl, easing: out});
  return (
    <RoomShot cam={lerp3(f, [0, dur], [[0.6, 2.0, 5.6], [0.25, 1.8, 4.7]], io)} look={[0, 1.45, 0]} fov={46} bg="#DDE6EA" sky="#F2F7FA" sunColor="#F4F8FB" sun={1.5}>
      <Room w={8} d={4} h={3.2} floor="#C9D2D6" wall="#E8EEF0" wall2="#DCE5E8" window={false} />
      <RoundedBox args={[3.2, 0.12, 1.1]} radius={0.04} position={[0, 0.95, -0.4]} castShadow receiveShadow><Clay c="#F5F5F3" /></RoundedBox>
      <mesh position={[0, 0.45, -0.4]} castShadow><boxGeometry args={[3.0, 0.9, 1.0]} /><Clay c="#9FB3BF" /></mesh>
      <Microscope position={[-0.4, 1.01, -0.4]} scale={1.1} />
      {[0.5, 0.75, 1.0].map((x, k) => (
        <mesh key={k} position={[x, 1.15, -0.55]} castShadow><cylinderGeometry args={[0.06, 0.06, 0.3, 16]} /><meshStandardMaterial color={['#9FD3C7', '#F2B6A0', '#C9B8F0'][k]} transparent opacity={0.8} roughness={0.2} /></mesh>
      ))}
      <DNA rot={f * 0.05} scatter={sc} position={[0.2, 2.35, -0.4]} scale={0.9} />
      <pointLight position={[0.2, 2.3, 0.2]} intensity={2.5 * (1 - sc * 0.7)} distance={4} color="#BFD8FF" />
      <Person g={m[XBOT]} t={f / 30} color="#F7F7F5" joints="#B9C7D4" scale={0.95} position={[-0.4, 0, 0.32]} rotY={Math.PI} pose={{bend: 0.75 * (1 - sh), headPitch: 0.3 - sh * 0.5}} />
      <Person g={m[XBOT]} t={f / 30 + 1} color="#F7F7F5" joints="#B9C7D4" scale={0.95} position={[0.75, 0, 0.75]} rotY={-2.6} pose={{shrug: sh, headPitch: -0.35}} />
      <Person g={m[XBOT]} t={f / 30 + 2} color="#F7F7F5" joints="#B9C7D4" scale={0.95} position={[-1.05, 0, 1.15]} rotY={2.6} pose={{shrug: sh * 0.8, headPitch: -0.3}} />
    </RoomShot>
  );
};

// 9. «Люди молятся, ищут виноватых.»
export const S09: React.FC<SP> = ({from, dur}) => {
  const {f, T, m, w} = useScene(from);
  if (!m) return null;
  const blame = interpolate(f, [w('ищут'), w('виноватых') + 6], [0, 1], {...cl, easing: out});
  const crowd = ring(20, 0.9, 3, 0.36);
  return (
    <CityShot T={T} m={m} cam={lerp3(f, [0, dur], [[4.2, 4.6, 5.2], [2.0, 1.4, 2.9]])} look={lerp3(f, [0, dur], [[0, 0, 0], [0, 0.25, 0]])} tilt={6}
      light={{sun: 1.0}}>
      <pointLight position={[0, 0.8, 0]} intensity={4} distance={4} color="#FFB45E" />
      {crowd.map((p) => {
        const pointer = p.k % 5 === 0;
        const yaw = blame * (rnd(p.k) - 0.5) * 2.0;
        return (
          <group key={p.k}>
            <Person g={m[XBOT]} t={0.4 + p.off} color={p.c} position={[p.x, 0.1, p.z]} rotY={p.rot + (pointer ? yaw * 0.6 : 0)}
              pose={{kneel: 1, pray: pointer ? 1 - blame : 1, pointR: pointer ? blame : 0, headYaw: yaw, headPitch: 0.15 * (1 - blame)}} />
            <Candle flick={Math.sin(f * 0.9 + p.k * 2) * 0.5 + 0.5} position={[p.x * 0.8, 0.1, p.z * 0.8]} scale={0.8} />
          </group>
        );
      })}
    </CityShot>
  );
};

/** Плакат с силуэтом младенца */
const Poster: React.FC<JSX.IntrinsicElements['group']> = (p) => {
  const tex = useCanvasTex(400, 520, (c) => {
    c.fillStyle = '#F2C14E'; c.fillRect(0, 0, 400, 520);
    c.fillStyle = '#1E1D22'; c.beginPath(); c.arc(200, 190, 92, 0, Math.PI * 2); c.fill();
    c.beginPath(); c.ellipse(200, 370, 120, 80, 0, Math.PI, 0); c.fill();
    c.font = FONT(58); c.textAlign = 'center'; c.fillText('ЛИЦО ГОДА', 200, 480);
  }, 'poster');
  return (
    <group {...p}>
      <mesh castShadow><boxGeometry args={[1.04, 1.34, 0.05]} /><Clay c="#2B2B30" /></mesh>
      <mesh position={[0, 0, 0.03]}><planeGeometry args={[1, 1.3]} /><meshStandardMaterial map={tex} emissiveMap={tex} emissive="#ffffff" emissiveIntensity={0.25} /></mesh>
    </group>
  );
};

// 10. «Год. Последний рождённый ребёнок становится самым знаменитым человеком на Земле.»
export const S10: React.FC<SP> = ({from, dur}) => {
  const {f, T, m, w} = useScene(from);
  if (!m) return null;
  const fame = interpolate(f, [w('знаменитым') - 4, w('знаменитым') + 8], [0, 1], cl);
  const a = interpolate(f, [0, dur], [0.3, -0.9], cl);
  const crowd = ring(26, 1.3, 5, 0.3);
  const flashes = Array.from({length: 26}).map((_, k) => fame > 0 && (Math.floor(f / 2) * 7 + k * 13) % 23 === 0);
  const anyFlash = flashes.filter(Boolean).length;
  return (
    <CityShot T={T} m={m} cam={[Math.sin(a) * 2.5, 1.5 + interpolate(f, [0, dur], [0.3, -0.2], cl), Math.cos(a) * 2.5]} look={[0, 0.4, 0]} tilt={5}
      after={<AbsoluteFill style={{background: '#FFFFFF', opacity: anyFlash * 0.05 * fame, pointerEvents: 'none'}} />}>
      <Pedestal scale={0.75} position={[0, 0.1, 0]} />
      <Person g={m[XBOT]} t={f / 30} color="#F6D7C6" scale={0.16} position={[0, 0.42, 0]} rotY={a} pose={{bigHead: 1.6}} />
      <spotLight position={[0, 4, 0]} angle={0.3} penumbra={0.6} intensity={30} distance={8} color="#FFF1CF" target-position={[0, 0, 0]} />
      {crowd.map((p) => (
        <group key={p.k}>
          <Person g={m[XBOT]} t={f / 30 + p.off} color={p.c} position={[p.x, 0.1, p.z]} rotY={p.rot} pose={{pointR: 0.35 + fame * 0.9 * ((p.k % 3) ? 1 : 0.4), headPitch: -0.25}} />
          {flashes[p.k] && <mesh position={[p.x * 0.86, 0.5, p.z * 0.86]}><sphereGeometry args={[0.05, 8, 8]} /><meshBasicMaterial color="#FFFFFF" toneMapped={false} /></mesh>}
        </group>
      ))}
      <Poster position={[-1.4, 1.35, -4.85]} scale={fame} />
      <Poster position={[1.6, 1.35, -4.85]} scale={fame} />
      <Poster position={[-4.85, 1.35, 0.6]} rotation={[0, Math.PI / 2, 0]} scale={fame} />
    </CityShot>
  );
};

// 11. «Каждого малыша на улице провожают взглядом, как чудо.»
export const S11: React.FC<SP> = ({from, dur}) => {
  const {f, T, m, w} = useScene(from);
  if (!m) return null;
  const mx = interpolate(f, [0, dur], [-1.6, 0.35], cl);
  const sx = mx + 0.32, z = 4.25;
  const miracle = interpolate(f, [w('чудо') - 4, w('чудо') + 10], [0, 1], {...cl, easing: out});
  const side: [number, number, number][] = [[-1.2, 5.05, Math.PI], [-0.5, 5.1, Math.PI], [0.3, 5.0, Math.PI], [1.0, 5.1, Math.PI], [1.7, 5.05, Math.PI],
    [-0.9, 3.15, 0], [0.0, 3.1, 0], [0.9, 3.2, 0], [1.6, 3.1, 0]];
  return (
    <CityShot T={T} m={m} cam={[mx + 0.15, 0.7, 2.45]} look={[mx + 0.15, 0.3, z]} fov={42} tilt={5} tiltCenter={0.55}>
      <Person g={m[XBOT]} clip="walk" t={f / 30} color="#C9A5C9" position={[mx, 0.1, z]} rotY={Math.PI / 2} pose={{pointR: 0.25, pointL: 0.25}} />
      <Stroller wheel={f * 0.3} scale={0.45} position={[sx, 0.1, z]} rotation={[0, -Math.PI / 2, 0]} />
      <Beam o={miracle} position={[sx, 0.1, z]} h={2.5} r={0.35} />
      {side.map(([x, pz, rot], k) => {
        const yaw = lookYaw(x, pz, rot, sx, z, 1.3);
        return <Person key={k} g={m[XBOT]} t={f / 30 + rnd(k) * 3} color={CLOTHES[(k + 2) % 8]} position={[x, 0.1, pz]}
          rotY={rot + yaw * 0.45} pose={{headYaw: yaw * 0.55}} />;
      })}
    </CityShot>
  );
};

// 12. «Пять лет. Закрываются роддома и детские сады. Магазины игрушек пустеют.»
export const S12: React.FC<SP> = ({from, dur}) => {
  const {f, T, m, w} = useScene(from);
  if (!m) return null;
  const cut = w('магазины');
  if (f < cut) {
    const z0 = w('закрываются');
    const down = (k: number) => interpolate(f, [z0 + k * 5, z0 + k * 5 + 16], [0, 1], {...cl, easing: io});
    return (
      <CityShot T={T} m={m} cam={lerp3(f, [0, cut], [[-1.9, 0.9, -0.9], [0.6, 0.9, -0.7]], io)} look={lerp3(f, [0, cut], [[-1.6, 0.6, -5], [0.3, 0.6, -5]], io)} tilt={4} tiltCenter={0.5}>
        <Roddom glow={0} />
        <Sign text="ДЕТСКИЙ САД" w={1.1} h={0.22} fg="#3C7A4E" position={[-2, 1.05, -4.86]} px={70} />
        {[-4, -2, 0, 2, 4].map((x, k) => <Shutter key={x} w={1.3} h={0.75} down={down(k)} position={[x, 0.1, -4.82]} />)}
        {/* горка у детсада */}
        <group position={[-2.4, 0.1, -4.1]} scale={0.5}>
          <mesh position={[0, 0.5, 0]} rotation={[0, 0, 0.6]} castShadow><boxGeometry args={[1.2, 0.06, 0.4]} /><Clay c="#E8574A" /></mesh>
          <mesh position={[0.48, 0.42, 0]}><boxGeometry args={[0.06, 0.84, 0.4]} /><Clay c="#F2C14E" /></mesh>
        </group>
      </CityShot>
    );
  }
  const g = f - cut;
  const flip = interpolate(f, [w('пустеют'), w('пустеют') + 10], [0, Math.PI], {...cl, easing: io});
  return (
    <RoomShot cam={lerp3(g, [0, dur - cut], [[0.3, 1.35, 4.0], [0.1, 1.25, 3.2]], io)} look={[0, 1.15, -1]} fov={46} bg="#CFC7BB" sun={1.1} sunColor="#F1E6D6" amb={0.3} vign={0.4}>
      <Room w={6} d={3} h={2.8} floor="#B8A894" wall="#E4D6C2" wall2="#D8C9B4" window={false}>
        {[0.6, 1.25, 1.9].map((y) => <mesh key={y} position={[0, y, -1.25]} castShadow receiveShadow><boxGeometry args={[1.9, 0.06, 0.45]} /><Clay c="#A47C58" /></mesh>)}
        <Teddy position={[-0.55, 0.63, -1.25]} scale={1.1} />
        <Blocks position={[0.15, 0.63, -1.25]} />
        <Ball position={[0.65, 0.63, -1.25]} />
        <Teddy position={[0.45, 1.28, -1.25]} c="#E8C8A8" />
        <Blocks position={[-0.5, 1.28, -1.25]} rotation={[0, 0.6, 0]} />
        <Ball position={[-0.2, 1.93, -1.25]} scale={0.8} />
        <Sign text="ИГРУШКИ" w={1.2} h={0.26} fg="#E8574A" position={[0, 2.15, -1.4]} />
      </Room>
      {/* пыль в воздухе */}
      {Array.from({length: 40}).map((_, k) => (
        <mesh key={k} position={[(rnd(k) - 0.5) * 3, 0.3 + ((rnd(k + 5) * 2.2 + g * 0.004 * (1 + rnd(k))) % 2.3), (rnd(k + 9) - 0.2) * 1.5]}>
          <sphereGeometry args={[0.008, 4, 4]} /><meshBasicMaterial color="#FFF6E0" transparent opacity={0.6} />
        </mesh>
      ))}
      {/* табличка на двери: ОТКРЫТО → ЗАКРЫТО */}
      <group position={[0.45, 0.45, -0.1]} rotation={[0, -0.2 + flip, 0]}>
        <Sign text="ОТКРЫТО" w={0.7} h={0.22} fg="#3C7A4E" px={80} position={[0, 0, 0.012]} />
        <Sign text="ЗАКРЫТО" w={0.7} h={0.22} fg="#C8372D" px={80} rotation={[0, Math.PI, 0]} position={[0, 0, -0.012]} />
      </group>
    </RoomShot>
  );
};

/** Ценник-табло на столбе */
const Price: React.FC<JSX.IntrinsicElements['group'] & {v: number}> = ({v, ...p}) => {
  const txt = `${v.toFixed(1).replace('.', ',')} млн ₽`;
  const tex = useCanvasTex(512, 256, (c) => {
    c.fillStyle = '#FFFFFF'; c.fillRect(0, 0, 512, 256);
    c.fillStyle = '#6E6A72'; c.font = FONT(40, 600); c.textAlign = 'center'; c.fillText('квартира', 256, 70);
    c.fillStyle = '#1E1D22'; c.font = FONT(96); c.fillText(txt, 256, 170);
    c.fillStyle = '#2E9C5A'; c.font = FONT(40); c.fillText('▼ дешевеет', 256, 230);
  }, txt);
  return (
    <group {...p}>
      <mesh position={[0, -0.9, 0]} castShadow><cylinderGeometry args={[0.04, 0.04, 1.8, 8]} /><Clay c="#555" /></mesh>
      <mesh castShadow><boxGeometry args={[1.64, 0.84, 0.06]} /><Clay c="#2B2B30" /></mesh>
      <mesh position={[0, 0, 0.035]}><planeGeometry args={[1.6, 0.8]} /><meshStandardMaterial map={tex} emissiveMap={tex} emissive="#ffffff" emissiveIntensity={0.35} /></mesh>
    </group>
  );
};

/** Точка на кольцевой дороге (центр. линия ±4), s — путь по периметру */
const ringPos = (s: number, lane: number): [number, number, number, number] => {
  const L = 8, P = 4 * L, u = ((s % P) + P) % P, side = Math.floor(u / L), t = u - side * L - 4, r = 4 + lane;
  if (side === 0) return [t, 0.1, r, Math.PI / 2];
  if (side === 1) return [r, 0.1, -t, Math.PI];
  if (side === 2) return [-t, 0.1, -r, -Math.PI / 2];
  return [-r, 0.1, t, 0];
};

// 13. «Зато квартиры дешевеют, на дорогах свободно. Взрослые живут для себя и вроде бы довольны.»
export const S13: React.FC<SP> = ({from, dur}) => {
  const {f, T, m, w} = useScene(from);
  if (!m) return null;
  const cut = w('взрослые');
  if (f < cut) {
    const v = interpolate(f, [w('дешевеют') - 6, w('дешевеют') + 18], [9.8, 3.1], {...cl, easing: io});
    const go = interpolate(f, [w('свободно') - 14, w('свободно')], [0.03, 0.09], cl);
    const cars = ['car_sedan', 'car_taxi', 'car_hatchback', 'car_stationwagon', 'car_sedan'];
    return (
      <CityShot T={T} m={m} cam={lerp3(f, [0, cut], [[2.4, 2.2, 4.4], [3.0, 1.9, 4.2]], io)} look={lerp3(f, [0, cut], [[0.6, 1.0, 0.6], [0.9, 0.7, 0.4]], io)} tilt={6}>
        <Price v={v} position={[0.6, 1.25, 0.6]} rotation={[0, 0.5, 0]} />
        {cars.map((c, k) => {
          const [x, y, z, r] = ringPos(k * 6.4 + f * go * 1.0 + interpolate(f, [0, cut], [0, 3], cl), -0.45);
          return <Car key={k} m={m} kind={c} position={[x, y, z]} rot={r} />;
        })}
      </CityShot>
    );
  }
  const g = f - cut;
  const cheers = interpolate(f, [w('довольны') - 2, w('довольны') + 8], [0, 1], {...cl, easing: out});
  return (
    <CityShot T={T} m={m} cam={lerp3(g, [0, dur - cut], [[1.3, 0.8, 2.3], [0.9, 0.7, 1.75]], io)} look={[0, 0.3, 0.35]} fov={40} tilt={5} tiltCenter={0.55}>
      {/* столик кафе с зонтом */}
      <group position={[0, 0.1, 0.4]}>
        <mesh position={[0, 0.2, 0]} castShadow><cylinderGeometry args={[0.16, 0.16, 0.02, 24]} /><Clay c="#FFFFFF" /></mesh>
        <mesh position={[0, 0.1, 0]}><cylinderGeometry args={[0.015, 0.015, 0.2, 6]} /><Clay c="#555" /></mesh>
        <mesh position={[0, 0.62, 0]} castShadow><coneGeometry args={[0.55, 0.22, 16, 1, true]} /><meshStandardMaterial color="#E8574A" side={2} roughness={0.8} /></mesh>
        <mesh position={[0, 0.4, 0]}><cylinderGeometry args={[0.01, 0.01, 0.5, 6]} /><Clay c="#555" /></mesh>
        {[-0.05, 0.05].map((x) => <mesh key={x} position={[x, 0.24, 0]}><cylinderGeometry args={[0.015, 0.012, 0.06, 8]} /><meshStandardMaterial color="#F6E3B0" transparent opacity={0.85} /></mesh>)}
        {[[-0.3, Math.PI / 2], [0.3, -Math.PI / 2]].map(([x, r], k) => (
          <group key={k}>
            <mesh position={[x * 1.05, 0.11, 0]}><cylinderGeometry args={[0.07, 0.07, 0.02, 16]} /><Clay c="#A47C58" /></mesh>
            <Person g={m[XBOT]} t={g / 30 + k} color={k ? '#E6C27A' : '#7F9CC0'} position={[x, 0.0, 0]} rotY={r} pose={{sit: 1, pointR: cheers * 0.55, headPitch: -0.15}} />
          </group>
        ))}
      </group>
      {/* пара на скамейке */}
      <Car m={m} kind="bench" position={[-1.3, 0.1, -0.3]} rot={0.5} />
      <Person g={m[XBOT]} t={g / 30 + 2} color="#9DB89A" position={[-1.38, 0.0, -0.22]} rotY={0.5} pose={{sit: 1}} />
      <Person g={m[XBOT]} t={g / 30 + 3} color="#C9A5C9" position={[-1.12, 0.0, -0.36]} rotY={0.5} pose={{sit: 1, headYaw: 0.5}} />
    </CityShot>
  );
};

// 14. «Двадцать лет. Школы стоят пустые.»
export const S14: React.FC<SP> = ({from, dur}) => {
  const {f, w} = useScene(from);
  const dim = interpolate(f, [w('пустые'), w('пустые') + 14], [1, 0.35], cl);
  const board = useCanvasTex(800, 360, (c) => {
    c.fillStyle = '#2F4A3E'; c.fillRect(0, 0, 800, 360);
    c.fillStyle = 'rgba(255,255,255,0.45)'; c.font = `italic 400 96px NotoDisplay, serif`; c.textAlign = 'center'; c.fillText('1 сентября', 400, 190);
    c.fillStyle = 'rgba(255,255,255,0.12)'; c.fillRect(80, 250, 640, 6);
  }, 'board');
  return (
    <RoomShot cam={lerp3(f, [0, dur], [[0.6, 2.1, 5.6], [-0.2, 1.8, 4.4]], io)} look={[-0.6, 1.0, -1.2]} fov={46} bg="#D2CBC0" sun={1.6 * dim + 0.3} sunPos={[6, 6, 2]} sunColor="#FFE6C2" amb={0.25 + 0.15 * dim}>
      <Room w={9} d={6} h={3.2} floor="#B89B7A" wall="#E7E0D2" wall2="#DCD3C2" winGlow={dim}>
        <mesh position={[-1, 1.6, -2.93]}><planeGeometry args={[3.2, 1.44]} /><meshStandardMaterial map={board} roughness={0.9} /></mesh>
      </Room>
      {[-2.2, -0.6, 1.0].flatMap((x) => [-1.4, 0.0, 1.4].map((z) => <SchoolDesk key={`${x}${z}`} position={[x, 0, z]} />))}
      {Array.from({length: 50}).map((_, k) => (
        <mesh key={k} position={[(rnd(k) - 0.5) * 6, 0.3 + ((rnd(k + 5) * 2.5 + f * 0.004 * (1 + rnd(k))) % 2.6), (rnd(k + 9) - 0.5) * 4]}>
          <sphereGeometry args={[0.01, 4, 4]} /><meshBasicMaterial color="#FFF6E0" transparent opacity={0.7 * dim} />
        </mesh>
      ))}
    </RoomShot>
  );
};

void CITY;
