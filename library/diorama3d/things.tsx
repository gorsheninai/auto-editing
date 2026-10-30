// Предметы ролика кодом (глина): кроватки, глобус, ТВ, самолёт, тесты, микроскоп, ДНК, свечи, коляска,
// ставни, игрушки, ценник, парты, конвейер, банка с монетами, торт, кресло, часы, тележка.
import React, {useMemo} from 'react';
import * as THREE from 'three';
import {RoundedBox} from '@react-three/drei';
import {Clay} from './props';
import {FONT, rnd, useCanvasTex} from './world';

type G = JSX.IntrinsicElements['group'];

export const Crib: React.FC<G & {c?: string}> = ({c = '#F4EEE6', ...p}) => (
  <group {...p}>
    <RoundedBox args={[0.9, 0.12, 0.5]} radius={0.03} position={[0, 0.42, 0]} castShadow receiveShadow><Clay c="#FFFFFF" /></RoundedBox>
    <RoundedBox args={[0.84, 0.06, 0.44]} radius={0.03} position={[0, 0.5, 0]}><Clay c="#CFE3EE" /></RoundedBox>
    {[-1, 1].map((s) => (
      <group key={s}>
        {/* рейки по длинным сторонам */}
        {Array.from({length: 9}).map((_, k) => (
          <mesh key={k} position={[-0.4 + k * 0.1, 0.62, s * 0.24]} castShadow><cylinderGeometry args={[0.012, 0.012, 0.32, 6]} /><Clay c={c} /></mesh>
        ))}
        <mesh position={[0, 0.79, s * 0.24]}><boxGeometry args={[0.9, 0.03, 0.03]} /><Clay c={c} /></mesh>
        <mesh position={[s * 0.45, 0.62, 0]} castShadow><boxGeometry args={[0.04, 0.4, 0.52]} /><Clay c={c} /></mesh>
      </group>
    ))}
    {/* ножки */}
    {[-0.42, 0.42].flatMap((x) => [-0.22, 0.22].map((z) => (
      <mesh key={`${x}${z}`} position={[x, 0.18, z]}><cylinderGeometry args={[0.025, 0.025, 0.36, 6]} /><Clay c={c} /></mesh>
    )))}
  </group>
);

/** Мобиль над кроваткой: ang — угол поворота */
export const Mobile: React.FC<G & {ang: number}> = ({ang, ...p}) => (
  <group {...p}>
    <mesh position={[0, 0.35, 0]}><cylinderGeometry args={[0.006, 0.006, 0.7, 4]} /><Clay c="#BBBBBB" /></mesh>
    <group rotation={[0, ang, 0]}>
      <mesh rotation={[0, 0, Math.PI / 2]}><cylinderGeometry args={[0.006, 0.006, 0.5, 4]} /><Clay c="#BBBBBB" /></mesh>
      {[0, 1, 2, 3].map((k) => {
        const a = (k / 4) * Math.PI * 2;
        const cols = ['#F2B6A0', '#A8CBE8', '#F4D58D', '#B9D9B0'];
        return (
          <group key={k} position={[Math.cos(a) * 0.22, -0.12, Math.sin(a) * 0.22]}>
            <mesh position={[0, 0.06, 0]}><cylinderGeometry args={[0.003, 0.003, 0.12, 3]} /><Clay c="#BBBBBB" /></mesh>
            <mesh castShadow>{k % 2 ? <sphereGeometry args={[0.05, 12, 10]} /> : <octahedronGeometry args={[0.06]} />}<Clay c={cols[k]} /></mesh>
          </group>
        );
      })}
    </group>
  </group>
);

/** Настольный глобус на подставке. lit — 0..1 горящие метки, kOff — сколько меток уже погасло */
export const Globe: React.FC<G & {spin: number; off: number}> = ({spin, off, ...p}) => {
  const geo = useMemo(() => {
    const g = new THREE.IcosahedronGeometry(1, 4).toNonIndexed();
    const pos = g.attributes.position;
    const col = new Float32Array(pos.count * 3);
    const sea = new THREE.Color('#8FB8CF'), land = new THREE.Color('#B9C98F'), sand = new THREE.Color('#E2CF9B');
    for (let i = 0; i < pos.count; i += 3) {
      const cx = (pos.getX(i) + pos.getX(i + 1) + pos.getX(i + 2)) / 3, cy = (pos.getY(i) + pos.getY(i + 1) + pos.getY(i + 2)) / 3, cz = (pos.getZ(i) + pos.getZ(i + 1) + pos.getZ(i + 2)) / 3;
      const n = Math.sin(cx * 3.1 + 1.3) * Math.cos(cy * 2.7 - 0.4) + Math.sin(cz * 3.7 + cx * 1.9) * 0.6 + Math.cos(cy * 5.3 + cz * 2.1) * 0.25;
      const c = n > 0.35 ? land : n > 0.22 ? sand : sea;
      for (let k = 0; k < 3; k++) col.set([c.r, c.g, c.b], (i + k) * 3);
    }
    g.setAttribute('color', new THREE.BufferAttribute(col, 3));
    return g;
  }, []);
  const pins = useMemo(() => Array.from({length: 26}).map((_, k) => {
    const y = 1 - (k + 0.5) / 26 * 2, r = Math.sqrt(1 - y * y), a = k * 2.39996;
    return new THREE.Vector3(Math.cos(a) * r, y * 0.85, Math.sin(a) * r).normalize();
  }), []);
  return (
    <group {...p}>
      {/* подставка */}
      <mesh position={[0, -1.55, 0]} castShadow receiveShadow><cylinderGeometry args={[0.55, 0.7, 0.18, 40]} /><Clay c="#9C6E4B" /></mesh>
      <mesh position={[0, -1.3, 0]}><cylinderGeometry args={[0.06, 0.08, 0.4, 12]} /><Clay c="#9C6E4B" /></mesh>
      <mesh rotation={[0, 0, 0.41]}><torusGeometry args={[1.13, 0.03, 8, 64, Math.PI * 1.2]} /><Clay c="#C9A26B" r={0.4} /></mesh>
      <group rotation={[0, 0, 0.41]}>
        <group rotation={[0, spin, 0]}>
          <mesh geometry={geo} castShadow><meshStandardMaterial vertexColors flatShading roughness={0.85} /></mesh>
          {pins.map((v, k) => {
            const isOff = k < off;
            return (
              <group key={k} position={v.clone().multiplyScalar(1.0)} quaternion={new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), v)}>
                <mesh position={[0, 0.08, 0]}><cylinderGeometry args={[0.008, 0.008, 0.16, 4]} /><Clay c="#666" /></mesh>
                <mesh position={[0, 0.17, 0]}><sphereGeometry args={[0.035, 10, 8]} />
                  <meshStandardMaterial color={isOff ? '#8A8A8A' : '#FF7A59'} emissive={isOff ? '#000000' : '#FF6A3D'} emissiveIntensity={isOff ? 0 : 1.2} roughness={0.5} /></mesh>
              </group>
            );
          })}
        </group>
      </group>
    </group>
  );
};

/** Экран новостей: «СРОЧНО · 0 рождений» */
export const NewsScreenTex = () => useCanvasTex(640, 400, (c) => {
  c.fillStyle = '#1D2430'; c.fillRect(0, 0, 640, 400);
  c.fillStyle = '#D93A2B'; c.fillRect(0, 290, 640, 70);
  c.fillStyle = '#FFFFFF'; c.font = FONT(40); c.fillText('СРОЧНО', 24, 340);
  c.font = FONT(30, 600); c.fillText('в мире ни одного рождения', 210, 338);
  c.font = FONT(170); c.textAlign = 'center'; c.fillText('0', 200, 230);
  c.font = FONT(44); c.textAlign = 'left'; c.fillText('рождений', 290, 150); c.fillText('за неделю', 290, 205);
}, 'news');
export const BarsTex = () => useCanvasTex(64, 40, (c) => {
  ['#E8E8E8', '#E8D44D', '#4DD1E8', '#5CC65C', '#D14DC6', '#D14D4D', '#4D5CD1'].forEach((col, k) => { c.fillStyle = col; c.fillRect(k * 9.2, 0, 9.2, 40); });
}, 'bars');

export const TV: React.FC<G & {tex: THREE.Texture; glow?: number}> = ({tex, glow = 1, ...p}) => (
  <group {...p}>
    <RoundedBox args={[1.12, 0.74, 0.12]} radius={0.04} castShadow><Clay c="#2B2B30" r={0.5} /></RoundedBox>
    <mesh position={[0, 0, 0.065]}><planeGeometry args={[1.0, 0.625]} /><meshBasicMaterial map={tex} toneMapped={false} color={new THREE.Color(glow, glow, glow)} /></mesh>
  </group>
);

/** Кресло самолёта */
export const Seat: React.FC<G & {c?: string}> = ({c = '#4C6A8C', ...p}) => (
  <group {...p}>
    <RoundedBox args={[0.5, 0.12, 0.48]} radius={0.04} position={[0, 0.42, 0]} castShadow><Clay c={c} /></RoundedBox>
    <RoundedBox args={[0.5, 0.7, 0.1]} radius={0.04} position={[0, 0.78, -0.22]} rotation={[-0.12, 0, 0]} castShadow><Clay c={c} /></RoundedBox>
    <RoundedBox args={[0.3, 0.12, 0.08]} radius={0.03} position={[0, 1.12, -0.25]}><Clay c="#E9E4DA" /></RoundedBox>
    <mesh position={[0, 0.2, 0]}><boxGeometry args={[0.4, 0.4, 0.3]} /><Clay c="#555A62" /></mesh>
  </group>
);

/** Тест на беременность: корпус + окошко с контрольной полоской */
export const PregTest: React.FC<G> = (p) => (
  <group {...p}>
    <RoundedBox args={[0.24, 0.05, 1.1]} radius={0.024} smoothness={3} castShadow receiveShadow><Clay c="#FAFAFA" r={0.4} /></RoundedBox>
    <RoundedBox args={[0.22, 0.05, 0.28]} radius={0.024} position={[0, 0.001, 0.42]}><Clay c="#9FC3E8" r={0.4} /></RoundedBox>
    <mesh position={[0, 0.026, -0.12]} rotation={[-Math.PI / 2, 0, 0]}><planeGeometry args={[0.13, 0.32]} /><Clay c="#EDEDED" /></mesh>
    {/* контрольная полоска есть, тестовой нет */}
    <mesh position={[0, 0.028, -0.2]} rotation={[-Math.PI / 2, 0, 0]}><planeGeometry args={[0.11, 0.025]} /><Clay c="#D9506A" /></mesh>
    <mesh position={[0, 0.028, -0.06]} rotation={[-Math.PI / 2, 0, 0]}><planeGeometry args={[0.11, 0.025]} /><meshStandardMaterial color="#E8E1E1" /></mesh>
  </group>
);

/** Сетка тестов инстансингом. reveal(i) — масштаб 0..1 */
export const TestField: React.FC<G & {n: number; cols: number; reveal: (i: number) => number}> = ({n, cols, reveal, ...p}) => {
  const body = useMemo(() => new THREE.BoxGeometry(0.24, 0.05, 1.1), []);
  const line = useMemo(() => new THREE.BoxGeometry(0.11, 0.01, 0.025), []);
  const refs = [React.useRef<THREE.InstancedMesh>(null), React.useRef<THREE.InstancedMesh>(null)];
  React.useLayoutEffect(() => {
    const m = new THREE.Matrix4(), q = new THREE.Quaternion(), s = new THREE.Vector3(), v = new THREE.Vector3();
    for (let i = 0; i < n; i++) {
      const r = Math.floor(i / cols), c = i % cols;
      const k = reveal(i);
      const x = (c - (cols - 1) / 2) * 0.42, z = (r - (n / cols - 1) / 2) * 1.35;
      q.setFromAxisAngle(new THREE.Vector3(0, 1, 0), (rnd(i) - 0.5) * 0.2);
      s.setScalar(Math.max(0.0001, k));
      v.set(x, (1 - k) * 0.4, z);
      m.compose(v, q, s); refs[0].current?.setMatrixAt(i, m);
      v.set(x, (1 - k) * 0.4 + 0.03, z - 0.2 * k); m.compose(v, q, s); refs[1].current?.setMatrixAt(i, m);
    }
    refs.forEach((r) => { if (r.current) r.current.instanceMatrix.needsUpdate = true; });
  });
  return (
    <group {...p}>
      <instancedMesh ref={refs[0]} args={[body, undefined, n]} castShadow receiveShadow><meshStandardMaterial color="#FAFAFA" roughness={0.45} /></instancedMesh>
      <instancedMesh ref={refs[1]} args={[line, undefined, n]}><meshStandardMaterial color="#D9506A" roughness={0.6} /></instancedMesh>
    </group>
  );
};

export const Microscope: React.FC<G> = (p) => (
  <group {...p}>
    <RoundedBox args={[0.5, 0.08, 0.6]} radius={0.03} position={[0, 0.04, 0]} castShadow><Clay c="#F2F2F2" /></RoundedBox>
    <mesh position={[0, 0.35, -0.2]} rotation={[0.3, 0, 0]} castShadow><boxGeometry args={[0.12, 0.6, 0.12]} /><Clay c="#F2F2F2" /></mesh>
    <mesh position={[0, 0.25, 0.02]}><boxGeometry args={[0.36, 0.03, 0.3]} /><Clay c="#333" /></mesh>
    <mesh position={[0, 0.55, 0.0]} rotation={[-0.35, 0, 0]} castShadow><cylinderGeometry args={[0.05, 0.06, 0.45, 16]} /><Clay c="#3A3F47" r={0.4} /></mesh>
    <mesh position={[0, 0.8, -0.1]} rotation={[-0.35, 0, 0]}><cylinderGeometry args={[0.035, 0.035, 0.15, 12]} /><Clay c="#222" /></mesh>
  </group>
);

/** Спираль ДНК; scatter 0..1 — рассыпается */
export const DNA: React.FC<G & {rot: number; scatter: number}> = ({rot, scatter, ...p}) => {
  const N = 22;
  return (
    <group {...p} rotation={[0, rot, 0]}>
      {Array.from({length: N}).map((_, k) => {
        const y = (k - N / 2) * 0.1, a = k * 0.55;
        const d = scatter * (0.6 + rnd(k) * 1.6);
        const dir = new THREE.Vector3(Math.cos(a + 1), (rnd(k + 9) - 0.5) * 1.5, Math.sin(a + 1));
        const o = 1 - scatter * 0.85;
        return (
          <group key={k} position={[dir.x * d, y + dir.y * d, dir.z * d]} rotation={[scatter * rnd(k) * 3, a, 0]}>
            <mesh position={[0.32, 0, 0]}><sphereGeometry args={[0.05, 12, 10]} /><Clay c="#7FA8E0" e={0.5} o={o} /></mesh>
            <mesh position={[-0.32, 0, 0]}><sphereGeometry args={[0.05, 12, 10]} /><Clay c="#F08FA6" e={0.5} o={o} /></mesh>
            <mesh rotation={[0, 0, Math.PI / 2]}><cylinderGeometry args={[0.012, 0.012, 0.64, 6]} /><Clay c="#FFFFFF" e={0.3} o={o} /></mesh>
          </group>
        );
      })}
    </group>
  );
};

export const Candle: React.FC<G & {flick: number}> = ({flick, ...p}) => (
  <group {...p}>
    <mesh position={[0, 0.06, 0]} castShadow><cylinderGeometry args={[0.025, 0.025, 0.12, 10]} /><Clay c="#F7F1E3" /></mesh>
    <mesh position={[0, 0.15, 0]} scale={[1, 1 + flick * 0.25, 1]}><sphereGeometry args={[0.022, 8, 8]} />
      <meshBasicMaterial color="#FFC266" toneMapped={false} /></mesh>
  </group>
);

export const Pedestal: React.FC<G & {c?: string}> = ({c = '#E9DFCF', ...p}) => (
  <group {...p}>
    <mesh position={[0, 0.12, 0]} castShadow receiveShadow><cylinderGeometry args={[0.55, 0.62, 0.24, 40]} /><Clay c={c} /></mesh>
    <mesh position={[0, 0.32, 0]} castShadow receiveShadow><cylinderGeometry args={[0.42, 0.48, 0.18, 40]} /><Clay c={c} /></mesh>
    <mesh position={[0, 0.25, 0]} rotation={[Math.PI / 2, 0, 0]}><torusGeometry args={[0.52, 0.015, 6, 48]} /><Clay c="#C9A26B" r={0.35} /></mesh>
  </group>
);

export const Stroller: React.FC<G & {wheel: number}> = ({wheel, ...p}) => (
  <group {...p}>
    <mesh position={[0, 0.42, 0]} rotation={[0, 0, Math.PI / 2]} castShadow><cylinderGeometry args={[0.24, 0.24, 0.36, 24, 1, false, 0, Math.PI]} /><Clay c="#7FA6C9" /></mesh>
    <RoundedBox args={[0.36, 0.2, 0.55]} radius={0.06} position={[0, 0.32, 0]} castShadow><Clay c="#9DBBD6" /></RoundedBox>
    <mesh position={[0, 0.62, 0.36]} rotation={[0.6, 0, 0]}><cylinderGeometry args={[0.012, 0.012, 0.4, 6]} /><Clay c="#555" /></mesh>
    <mesh position={[0, 0.78, 0.48]} rotation={[0, 0, Math.PI / 2]}><cylinderGeometry args={[0.018, 0.018, 0.36, 8]} /><Clay c="#333" /></mesh>
    {[-0.17, 0.17].flatMap((x) => [-0.2, 0.2].map((z) => (
      <mesh key={`${x}${z}`} position={[x, 0.1, z]} rotation={[wheel, 0, Math.PI / 2]} castShadow>
        <torusGeometry args={[0.08, 0.02, 8, 16]} /><Clay c="#333" />
      </mesh>
    )))}
  </group>
);

/** Рольставня: down 0..1 */
export const Shutter: React.FC<G & {w: number; h: number; down: number}> = ({w, h, down, ...p}) => {
  const hh = Math.max(0.001, h * down);
  return (
    <group {...p}>
      <mesh position={[0, h + 0.06, 0.02]}><boxGeometry args={[w + 0.06, 0.12, 0.12]} /><Clay c="#8C9096" /></mesh>
      <group position={[0, h - hh / 2, 0]}>
        {Array.from({length: Math.max(1, Math.round(hh / 0.06))}).map((_, k, arr) => (
          <mesh key={k} position={[0, hh / 2 - (k + 0.5) * (hh / arr.length), 0]} castShadow>
            <boxGeometry args={[w, hh / arr.length * 0.9, 0.03]} /><Clay c="#B3B7BC" r={0.6} />
          </mesh>
        ))}
      </group>
    </group>
  );
};

export const Teddy: React.FC<G & {c?: string}> = ({c = '#B98B62', ...p}) => (
  <group {...p}>
    <mesh position={[0, 0.16, 0]} castShadow><sphereGeometry args={[0.15, 16, 12]} /><Clay c={c} /></mesh>
    <mesh position={[0, 0.38, 0]} castShadow><sphereGeometry args={[0.11, 16, 12]} /><Clay c={c} /></mesh>
    {[-1, 1].map((s) => <mesh key={s} position={[s * 0.08, 0.47, 0]}><sphereGeometry args={[0.04, 10, 8]} /><Clay c={c} /></mesh>)}
    <mesh position={[0, 0.36, 0.1]}><sphereGeometry args={[0.04, 10, 8]} /><Clay c="#E8D2B5" /></mesh>
    {[-1, 1].map((s) => <mesh key={'a' + s} position={[s * 0.15, 0.2, 0.04]}><sphereGeometry args={[0.055, 10, 8]} /><Clay c={c} /></mesh>)}
    {[-1, 1].map((s) => <mesh key={'l' + s} position={[s * 0.08, 0.04, 0.09]}><sphereGeometry args={[0.06, 10, 8]} /><Clay c={c} /></mesh>)}
  </group>
);
export const Blocks: React.FC<G> = (p) => (
  <group {...p}>
    {[['#E87461', 0, 0, 0], ['#F2C14E', 0.17, 0, 0.02], ['#6FA8DC', 0.08, 0.16, 0.0]].map(([c, x, y, z], k) => (
      <RoundedBox key={k} args={[0.15, 0.15, 0.15]} radius={0.02} position={[x as number, (y as number) + 0.075, z as number]} rotation={[0, k * 0.4, 0]} castShadow><Clay c={c as string} /></RoundedBox>
    ))}
  </group>
);
export const Ball: React.FC<G> = (p) => (
  <group {...p}>
    <mesh castShadow position={[0, 0.13, 0]}><sphereGeometry args={[0.13, 20, 16]} /><Clay c="#E8574A" r={0.5} /></mesh>
    <mesh position={[0, 0.13, 0]} rotation={[0.4, 0, 0.3]}><torusGeometry args={[0.131, 0.02, 6, 32]} /><Clay c="#FFFFFF" r={0.5} /></mesh>
  </group>
);

/** Табличка с надписью (canvas) */
export const Sign: React.FC<G & {text: string; w?: number; h?: number; bg?: string; fg?: string; glow?: number; px?: number}> = ({text, w = 1.2, h = 0.3, bg = '#FFFFFF', fg = '#C8372D', glow = 0, px = 90, ...p}) => {
  const tex = useCanvasTex(512, Math.round(512 * h / w), (c) => {
    c.fillStyle = bg; c.fillRect(0, 0, 512, 512);
    c.fillStyle = fg; c.font = FONT(px); c.textAlign = 'center'; c.textBaseline = 'middle';
    c.fillText(text, 256, Math.round(512 * h / w) / 2 + 4);
  }, `${text}${bg}${fg}${px}`);
  return (
    <group {...p}>
      <mesh castShadow><boxGeometry args={[w + 0.04, h + 0.04, 0.04]} /><Clay c="#3A3A3A" /></mesh>
      <mesh position={[0, 0, 0.021]}><planeGeometry args={[w, h]} /><meshStandardMaterial map={tex} emissiveMap={tex} emissive="#FFFFFF" emissiveIntensity={glow} roughness={0.7} /></mesh>
    </group>
  );
};

export const SchoolDesk: React.FC<G> = (p) => (
  <group {...p}>
    <RoundedBox args={[1.0, 0.05, 0.5]} radius={0.02} position={[0, 0.7, 0]} castShadow receiveShadow><Clay c="#C9A27A" /></RoundedBox>
    {[-0.45, 0.45].map((x) => <mesh key={x} position={[x, 0.35, 0]} castShadow><boxGeometry args={[0.04, 0.7, 0.44]} /><Clay c="#6D7B8A" /></mesh>)}
    {/* стул */}
    <RoundedBox args={[0.38, 0.04, 0.36]} radius={0.015} position={[0, 0.42, 0.48]} castShadow><Clay c="#C9A27A" /></RoundedBox>
    <RoundedBox args={[0.38, 0.3, 0.03]} radius={0.015} position={[0, 0.62, 0.66]} castShadow><Clay c="#C9A27A" /></RoundedBox>
    {[-0.16, 0.16].flatMap((x) => [0.33, 0.63].map((z) => <mesh key={`${x}${z}`} position={[x, 0.21, z]}><cylinderGeometry args={[0.015, 0.015, 0.42, 6]} /><Clay c="#6D7B8A" /></mesh>))}
  </group>
);

export const Conveyor: React.FC<G & {shift: number}> = ({shift, ...p}) => (
  <group {...p}>
    <mesh position={[0, 0.5, 0]} castShadow receiveShadow><boxGeometry args={[4, 0.1, 0.6]} /><Clay c="#3E4248" /></mesh>
    {[-1.8, -0.6, 0.6, 1.8].map((x) => <mesh key={x} position={[x, 0.25, 0]}><boxGeometry args={[0.08, 0.5, 0.5]} /><Clay c="#6D747C" /></mesh>)}
    {Array.from({length: 6}).map((_, k) => {
      const x = (((k * 0.75 + shift) % 4.5) + 4.5) % 4.5 - 2.25;
      return Math.abs(x) < 1.95 ? <RoundedBox key={k} args={[0.32, 0.26, 0.32]} radius={0.02} position={[x, 0.68, 0]} castShadow><Clay c="#C9A27A" /></RoundedBox> : null;
    })}
  </group>
);

export const Bed: React.FC<G> = (p) => (
  <group {...p}>
    <RoundedBox args={[0.9, 0.2, 1.9]} radius={0.05} position={[0, 0.5, 0]} castShadow receiveShadow><Clay c="#FFFFFF" /></RoundedBox>
    <RoundedBox args={[0.6, 0.12, 0.35]} radius={0.05} position={[0, 0.65, -0.7]}><Clay c="#E9EEF2" /></RoundedBox>
    <mesh position={[0, 0.3, 0]}><boxGeometry args={[0.85, 0.06, 1.8]} /><Clay c="#9AA5AF" /></mesh>
    {[-0.4, 0.4].flatMap((x) => [-0.85, 0.85].map((z) => <mesh key={`${x}${z}`} position={[x, 0.2, z]}><cylinderGeometry args={[0.02, 0.02, 0.4, 6]} /><Clay c="#9AA5AF" /></mesh>))}
  </group>
);

/** Банка с монетами: level 0..1, coins — падающие монеты [y, x] */
export const Jar: React.FC<G & {level: number; coins: [number, number][]}> = ({level, coins, ...p}) => (
  <group {...p}>
    {Array.from({length: Math.round(level * 14)}).map((_, k) => (
      <mesh key={k} position={[Math.sin(k * 2.3) * 0.12, 0.06 + k * 0.045, Math.cos(k * 1.7) * 0.12]} rotation={[0.2 * Math.sin(k), k, 0.15 * Math.cos(k)]} castShadow>
        <cylinderGeometry args={[0.16, 0.16, 0.04, 28]} /><Clay c="#E3B341" r={0.35} />
      </mesh>
    ))}
    {coins.map(([y, x], k) => (
      <mesh key={'c' + k} position={[x, y, 0]} rotation={[Math.PI / 2, 0, y * 3]} castShadow><cylinderGeometry args={[0.16, 0.16, 0.04, 28]} /><Clay c="#E3B341" r={0.35} /></mesh>
    ))}
    <mesh position={[0, 0.5, 0]}><cylinderGeometry args={[0.42, 0.42, 1.0, 40, 1, true]} />
      <meshStandardMaterial color="#DDEEF2" transparent opacity={0.22} roughness={0.1} side={THREE.DoubleSide} depthWrite={false} /></mesh>
    <mesh position={[0, 1.02, 0]}><torusGeometry args={[0.42, 0.03, 8, 40]} /><Clay c="#CFE3E8" r={0.2} o={0.6} /></mesh>
  </group>
);

export const Cake: React.FC<G & {lit: number}> = ({lit, ...p}) => (
  <group {...p}>
    <mesh position={[0, 0.03, 0]} receiveShadow><cylinderGeometry args={[0.42, 0.42, 0.04, 40]} /><Clay c="#FFFFFF" /></mesh>
    <mesh position={[0, 0.17, 0]} castShadow><cylinderGeometry args={[0.32, 0.32, 0.24, 40]} /><Clay c="#F3D9C9" /></mesh>
    <mesh position={[0, 0.3, 0]}><cylinderGeometry args={[0.33, 0.33, 0.04, 40]} /><Clay c="#FFFFFF" /></mesh>
    {[-0.08, 0.08].map((x, k) => (
      <group key={k} position={[x, 0.32, 0]}>
        <Sign text={k ? '0' : '5'} w={0.12} h={0.16} bg="#F2C14E" fg="#FFFFFF" px={300} position={[0, 0.1, 0]} />
        <mesh position={[0, 0.22, 0]} scale={lit}><sphereGeometry args={[0.025, 8, 8]} /><meshBasicMaterial color="#FFC266" toneMapped={false} /></mesh>
      </group>
    ))}
  </group>
);

export const Armchair: React.FC<G & {c?: string}> = ({c = '#8C5A4A', ...p}) => (
  <group {...p}>
    <RoundedBox args={[0.8, 0.2, 0.7]} radius={0.06} position={[0, 0.35, 0]} castShadow><Clay c={c} /></RoundedBox>
    <RoundedBox args={[0.8, 0.75, 0.16]} radius={0.06} position={[0, 0.72, 0.3]} castShadow><Clay c={c} /></RoundedBox>
    {[-1, 1].map((s) => <RoundedBox key={s} args={[0.14, 0.38, 0.7]} radius={0.05} position={[s * 0.38, 0.5, 0]} castShadow><Clay c={c} /></RoundedBox>)}
    {[-0.3, 0.3].flatMap((x) => [-0.25, 0.25].map((z) => <mesh key={`${x}${z}`} position={[x, 0.12, z]}><cylinderGeometry args={[0.03, 0.02, 0.24, 6]} /><Clay c="#4A3428" /></mesh>))}
  </group>
);

export const Clock: React.FC<G & {sec: number}> = ({sec, ...p}) => (
  <group {...p}>
    <mesh rotation={[Math.PI / 2, 0, 0]} castShadow><cylinderGeometry args={[0.22, 0.22, 0.05, 32]} /><Clay c="#F7F3EA" /></mesh>
    <mesh rotation={[Math.PI / 2, 0, 0]}><torusGeometry args={[0.22, 0.02, 8, 32]} /><Clay c="#6B4F3A" /></mesh>
    <mesh position={[0, 0, 0.03]} rotation={[0, 0, -sec * Math.PI / 30]}><boxGeometry args={[0.008, 0.36, 0.005]} /><Clay c="#C8372D" /></mesh>
    <mesh position={[0, 0.05, 0.03]} rotation={[0, 0, -0.9]}><boxGeometry args={[0.02, 0.14, 0.005]} /><Clay c="#222" /></mesh>
    <mesh position={[0.06, 0, 0.03]} rotation={[0, 0, -1.9]}><boxGeometry args={[0.02, 0.1, 0.005]} /><Clay c="#222" /></mesh>
  </group>
);

export const Cart: React.FC<G & {wheel: number}> = ({wheel, ...p}) => (
  <group {...p}>
    <mesh position={[0, 0.32, 0]} castShadow><boxGeometry args={[0.5, 0.28, 0.7]} /><meshStandardMaterial color="#B8BEC4" roughness={0.4} metalness={0.3} wireframe /></mesh>
    <mesh position={[0, 0.19, 0]}><boxGeometry args={[0.5, 0.02, 0.7]} /><Clay c="#9AA0A6" /></mesh>
    {[['#E87461', -0.12, 0.38, -0.15, 0.16, 0.22, 0.12], ['#F2C14E', 0.1, 0.36, 0.1, 0.18, 0.18, 0.18], ['#7FB069', -0.1, 0.38, 0.18, 0.12, 0.26, 0.12], ['#FFFFFF', 0.13, 0.4, -0.18, 0.1, 0.3, 0.1]].map(([c, x, y, z, a, b, d], k) => (
      <mesh key={k} position={[x as number, y as number, z as number]} castShadow><boxGeometry args={[a as number, b as number, d as number]} /><Clay c={c as string} /></mesh>
    ))}
    {[-0.2, 0.2].flatMap((x) => [-0.28, 0.28].map((z) => <mesh key={`${x}${z}`} position={[x, 0.06, z]} rotation={[wheel, 0, Math.PI / 2]}><cylinderGeometry args={[0.06, 0.06, 0.03, 12]} /><Clay c="#333" /></mesh>))}
    <mesh position={[0, 0.55, -0.4]} rotation={[0, 0, Math.PI / 2]}><cylinderGeometry args={[0.015, 0.015, 0.5, 6]} /><Clay c="#555" /></mesh>
  </group>
);

/** Плющ на стене: пятна листвы, растут по g 0..1 */
export const Ivy: React.FC<G & {g: number; w?: number; h?: number; seed?: number}> = ({g, w = 1.8, h = 1.6, seed = 0, ...p}) => (
  <group {...p}>
    {Array.from({length: 26}).map((_, k) => {
      const x = (rnd(k + seed) - 0.5) * w, y = rnd(k * 3 + seed) * h;
      const s = Math.max(0, Math.min(1, g * 1.6 - (y / h) * 0.8)) * (0.12 + rnd(k * 7 + seed) * 0.12);
      return s > 0.005 ? <mesh key={k} position={[x, y, 0]} scale={s}><icosahedronGeometry args={[1, 0]} /><meshStandardMaterial color={k % 3 ? '#5E8A55' : '#73A062'} flatShading roughness={0.9} /></mesh> : null;
    })}
  </group>
);

export const Cloud: React.FC<G> = (p) => (
  <group {...p}>
    {[[0, 0, 0, 0.5], [0.5, -0.1, 0, 0.38], [-0.5, -0.12, 0, 0.36], [0.2, 0.25, 0, 0.34]].map(([x, y, z, r], k) => (
      <mesh key={k} position={[x, y, z]}><icosahedronGeometry args={[r, 1]} /><meshStandardMaterial color="#FFFFFF" flatShading roughness={1} /></mesh>
    ))}
  </group>
);
