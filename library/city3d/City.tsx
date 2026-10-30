// Макет квартала под стеклом: весь ролик — одна сцена, камера и события от useCurrentFrame().
import React, {useMemo} from 'react';
import {useCurrentFrame} from 'remotion';
import {useThree} from '@react-three/fiber';
import {RoundedBox} from '@react-three/drei';
import * as THREE from 'three';
import {
  Blob, FPS, MName, Mat, Model, PAL, Person, V3, back, canvasTex, clamp, eio, eout, lin, mix, mixV, pop, rnd, rr, FONT, win, wf,
} from './lib';
import {
  AppIcon, Bench, Bubble, Calendar, Flash, Globe, Kiosk, Laptop, Phone, Reload, Shield, Star, Truck, signTex, updateTex,
} from './props';

// ---------- моменты по словам ----------
export const T = {
  off: wf('отключат'), net: wf('интернет'), d1: wf('день', 1), morning: wf('утро'),
  yt: wf('ютюб', 1), wa: wf('ватсап'), sites: wf('иностранные', 1), games: wf('игры'), notopen: wf('открываются'),
  vpn: wf('впн', 1), nohelp: wf('помогает'), reboot: wf('перезагружают'), confused: wf('понимают'),
  d2: wf('день', 2), exhale: wf('выдох'),
  vk: wf('вконтакте'), ya: wf('яндекс'), bank: wf('банки'), mp: wf('маркетплейсы'), work: wf('работают'),
  okay: wf('ну'), write: wf('пишут'),
  week: wf('неделя'), noupd: wf('обновляются'),
  free: wf('фрилансеры'), clients: wf('клиентов'), money: wf('деньги'), nocome: wf('приходят'),
  prog: wf('программисты'), dl: wf('скачать'),
  month: wf('месяц'), call: wf('звонить'), video: wf('видеосвязь'), vdead: wf('работает'),
  granny: wf('бабушка'), nosee: wf('видит'),
  biz: wf('бизнес'), close: wf('закрывается'),
  m3: wf('три'), grow: wf('растут'),
  blog: wf('блогеры'), move: wf('переезжают'), stars: wf('звезды'), used: wf('привыкли'),
  half: wf('полгода'), pass: wf('передают'), flash: wf('флешках'), again: wf('снова'), price: wf('цене'),
  year: wf('год'), what: wf('такое'), sigh: wf('вздохом'), before: wf('раньше'), world: wf('весь'), phone: wf('телефоне'),
  end: 62.5,
};
export const STAGE_T = [T.d1, T.d2, T.week, T.month, T.m3, T.half, T.year];

// ---------- камера: ключи [время, позиция, точка взгляда] ----------
type K = [number, V3, V3];
const CAM: K[] = [
  [0.0, [0, 7.2, 12.5], [0, 1.6, 0]],
  [1.2, [0, 5.8, 10.6], [0, 1.3, 0]],
  [2.6, [-1.2, 4.6, 9.4], [-1.8, 1.2, -2.6]],
  [3.55, [-1.6, 3.9, 8.3], [-2.3, 1.2, -3.2]],
  [4.25, [-2.4, 1.05, 2.5], [-3, 0.45, -0.35]],
  [8.0, [-2.65, 0.95, 2.15], [-3, 0.45, -0.35]],
  [8.6, [3.0, 0.85, 3.2], [1.75, 0.25, 1.5]],
  [12.2, [0.9, 0.8, 3.3], [1.75, 0.25, 1.5]],
  [13.0, [-0.2, 4.4, 9.4], [-1.4, 1.1, -3]],
  [13.75, [-0.4, 4.2, 9.0], [-1.6, 1.1, -3]],
  [14.4, [-2.6, 2.3, 3.2], [-1.6, 1.85, -1]],
  [16.0, [0.1, 2.9, 3.6], [0.3, 1.3, -1.4]],
  [17.3, [1.4, 2.6, 3.2], [1.3, 1.0, -1.8]],
  [17.9, [-0.7, 0.9, 5.3], [-1.7, 0.45, 2.6]],
  [19.8, [-0.6, 1.4, 5.6], [-1.7, 0.8, 2.0]],
  [20.4, [-1.0, 3.9, 8.6], [-2.0, 1.3, -3]],
  [21.0, [-1.0, 3.8, 8.4], [-2.0, 1.3, -3]],
  [21.7, [-2.0, 0.4, 4.1], [-2.0, 0.65, 1.35]],
  [23.0, [-2.0, 0.95, 4.4], [-2.0, 0.6, 1.35]],
  [23.6, [2.0, 0.75, -0.35], [6.0, -0.05, -0.6]],
  [26.6, [2.3, 0.75, -0.35], [6.0, -0.05, -0.6]],
  [27.2, [3.4, 1.45, 2.4], [2.0, 1.4, -1]],
  [29.3, [3.6, 1.6, 2.8], [2.0, 2.1, -1]],
  [29.9, [-0.6, 4.2, 9.2], [-1.8, 1.2, -3]],
  [30.6, [-0.6, 4.1, 9.0], [-1.8, 1.2, -3]],
  [31.3, [3.3, 0.42, 1.55], [6.0, 0.3, 0.8]],
  [33.8, [3.5, 0.45, 1.6], [6.0, 0.3, 0.8]],
  [34.3, [7.2, 0.3, 0.75], [4.4, 0.18, 0.95]],
  [35.9, [7.0, 0.28, 0.78], [4.4, 0.18, 0.95]],
  [36.4, [1.0, 0.5, 1.05], [1.0, 0.45, -0.6]],
  [38.8, [1.0, 0.62, 1.45], [1.0, 0.45, -0.6]],
  [39.4, [0.4, 4.0, 9.4], [-1.0, 1.3, -3]],
  [40.1, [0.4, 3.9, 9.2], [-1.0, 1.3, -3]],
  [40.7, [2.0, 0.35, 4.8], [2.0, 0.6, 2.0]],
  [42.0, [2.0, 2.4, 6.8], [2.0, 1.8, 2.0]],
  [42.6, [-3.3, 0.55, 1.3], [-2.7, 0.2, 0]],
  [44.6, [1.2, 0.6, 1.5], [1.9, 0.3, 0]],
  [45.8, [3.0, 2.3, 6.4], [2.0, 2.8, 2.0]],
  [47.4, [1.2, 3.6, 8.8], [0, 1.0, 0]],
  [48.0, [-1.0, 3.9, 8.6], [-2.0, 1.3, -3]],
  [48.7, [-1.0, 3.8, 8.4], [-2.0, 1.3, -3]],
  [49.4, [-0.2, 0.9, 5.3], [-0.8, 0.2, 2.6]],
  [52.6, [-0.25, 0.85, 4.4], [-0.8, 0.22, 2.0]],
  [54.6, [-0.3, 0.8, 3.6], [-0.8, 0.3, 1.3]],
  [55.2, [-0.8, 4.0, 9.0], [-2.0, 1.2, -3]],
  [55.8, [-0.8, 3.9, 8.8], [-2.0, 1.2, -3]],
  [56.5, [-1.9, 0.32, 3.5], [-1.9, 0.17, 2.6]],
  [59.3, [-1.9, 0.28, 3.15], [-1.9, 0.17, 2.6]],
  [60.3, [-1.83, 0.215, 2.93], [-1.83, 0.205, 2.72]],
  [61.3, [-1.83, 0.21, 2.83], [-1.83, 0.205, 2.72]],
  [62.5, [0.5, 8.5, 15.5], [0, 1.0, 0]],
];
const camAt = (t: number): [V3, V3] => {
  let i = 0;
  while (i < CAM.length - 2 && t > CAM[i + 1][0]) i++;
  const [ta, pa, la] = CAM[i], [tb, pb, lb] = CAM[i + 1];
  const k = eio(clamp((t - ta) / (tb - ta)));
  return [mixV(pa, pb, k), mixV(la, lb, k)];
};
const CamRig: React.FC<{t: number}> = ({t}) => {
  const {camera} = useThree();
  const [p, l] = camAt(t);
  const d = 0.012; // лёгкое дыхание камеры
  camera.position.set(p[0] + Math.sin(t * 0.7) * d, p[1] + Math.sin(t * 0.9 + 1) * d, p[2]);
  camera.lookAt(l[0], l[1], l[2]);
  return null;
};

// ---------- свет и погода по этапам ----------
type L = {t: number; bg: string; sun: string; si: number; sp: V3; hemi: number};
const LIGHT: L[] = [
  {t: 0, bg: '#2B2F3A', sun: '#FFF1DE', si: 2.2, sp: [6, 10, 6], hemi: 0.8},
  {t: T.d1, bg: '#3A3240', sun: '#FFC489', si: 2.4, sp: [-9, 4.5, 5], hemi: 0.7},
  {t: T.d2, bg: '#2E3646', sun: '#FFF6EA', si: 2.6, sp: [4, 11, 6], hemi: 0.9},
  {t: T.week, bg: '#3B2C38', sun: '#FF9D6B', si: 2.3, sp: [9, 3.8, 3], hemi: 0.65},
  {t: T.month, bg: '#2F3138', sun: '#FFE2B8', si: 2.0, sp: [-5, 8, 7], hemi: 0.85},
  {t: T.m3, bg: '#2B3644', sun: '#FFF4E2', si: 2.6, sp: [5, 10, 7], hemi: 0.95},
  {t: T.half, bg: '#33353B', sun: '#E8E4DE', si: 1.8, sp: [-4, 9, 8], hemi: 1.0},
  {t: T.year, bg: '#2C3442', sun: '#DCE8FF', si: 2.2, sp: [3, 9, 8], hemi: 1.05},
  {t: T.before + 1.2, bg: '#1E2129', sun: '#FFD7A8', si: 1.3, sp: [-3, 6, 7], hemi: 0.55},
];
const lightAt = (t: number) => {
  let i = 0;
  while (i < LIGHT.length - 1 && t >= LIGHT[i + 1].t) i++;
  const a = LIGHT[i], b = LIGHT[Math.min(i + 1, LIGHT.length - 1)];
  // переход 0.9 с после смены этапа
  const k = i === LIGHT.length - 1 ? 0 : 0;
  const prev = LIGHT[Math.max(0, i - 1)];
  const kk = i === 0 ? 1 : eio(lin(t, a.t, a.t + 0.9));
  void b; void k;
  const c = (x: string, y: string) => new THREE.Color(x).lerp(new THREE.Color(y), kk);
  return {bg: c(prev.bg, a.bg), sun: c(prev.sun, a.sun), si: mix(prev.si, a.si, kk), sp: mixV(prev.sp, a.sp, kk), hemi: mix(prev.hemi, a.hemi, kk)};
};
/** листва: 0 — лето, 1 — осень; снег 0..1 */
const seasonAt = (t: number) => {
  const autumn = Math.max(lin(t, T.month, T.month + 0.9) * (1 - lin(t, T.m3, T.m3 + 0.9)), lin(t, T.half, T.half + 0.9));
  const snow = lin(t, T.year + 0.2, T.year + 1.4);
  return {autumn, snow};
};

// ---------- карта квартала ----------
type Tile = [MName, number, number, number?];
const R = Math.PI / 2;
const MAP: Tile[] = (() => {
  const t: Tile[] = [];
  for (let x = -4; x <= 4; x++) for (let z = -4; z <= 4; z++) {
    if (x === 0 && z === 0) { t.push(['road-intersection', x, z]); continue; }
    if (z === 0) { t.push(['road-straight', x, z, R]); continue; }
    if (x === 0) { t.push(['road-straight', x, z]); continue; }
    if (x <= -1 && x >= -3 && z >= 1 && z <= 3) { t.push([x === -3 && z === 3 ? 'pavement-fountain' : 'pavement', x, z]); continue; }
    t.push(['grass', x, z]);
  }
  return t;
})();
const HOUSES: Tile[] = [
  ['building-small-c', -3, -3], ['building-small-b', -2, -3], ['building-small-a', -1, -3],
  ['building-small-b', 1, -3], ['building-small-c', 2, -3], ['building-small-d', 3, -3],
  ['building-small-d', -2, -2], ['building-small-a', -1, -2], ['building-garage', 1, -2], ['building-small-a', 2, -2],
  ['building-small-a', -3, -1], ['building-small-c', -2, -1], ['building-small-b', -1, -1],
  ['building-small-c', 1, -1], ['building-small-d', 2, -1], ['building-small-d', 3, -1],
];
const TREES: Tile[] = [
  ['grass-trees-tall', -3, -2], ['grass-trees', 3, -2], ['grass-trees', -4, -4], ['grass-trees-tall', -4, -2], ['grass-trees', -4, 1],
  ['grass-trees-tall', -4, 3], ['grass-trees', -2, 4], ['grass-trees-tall', 1, 4], ['grass-trees', 3, 4], ['grass-trees', 4, -4],
  ['grass-trees-tall', 4, 3], ['grass-trees', -1, -4], ['grass-trees-tall', 2, -4], ['grass-trees', -4, -1],
];
const ROOF: Record<string, number> = {
  'building-small-a': 0.95, 'building-small-b': 1.63, 'building-small-c': 1.75, 'building-small-d': 1.0, 'building-garage': 0.55,
};
// новые дома на пустыре (три месяца)
const GROW: Tile[] = [['building-small-b', 1, 1], ['building-small-c', 3, 1], ['building-small-a', 1, 3], ['building-small-d', 3, 3]];

// ---------- мелкие помощники ----------
const up = new THREE.Vector3(0, 1, 0);
/** палочка от a к b, k — доля длины от a */
const Rod: React.FC<{a: V3; b: V3; r?: number; k?: number; c?: string; e?: number}> = ({a, b, r = 0.01, k = 1, c = '#fff', e = 0.5}) => {
  const A = new THREE.Vector3(...a), B = new THREE.Vector3(...b);
  const dir = B.clone().sub(A);
  const len = dir.length() * k;
  const q = new THREE.Quaternion().setFromUnitVectors(up, dir.clone().normalize());
  const mid = A.clone().add(dir.clone().normalize().multiplyScalar(len / 2));
  if (len < 0.001) return null;
  return <mesh position={mid} quaternion={q}><cylinderGeometry args={[r, r, len, 6]} /><Mat c={c} e={e} /></mesh>;
};

const CASE = {h: 3.2, w: 4.62};
const GlassCase: React.FC<{k: number}> = ({k}) => {
  if (k <= 0) return null;
  const h = CASE.h * k, w = CASE.w;
  const glass = <meshLambertMaterial color="#DDEFF7" transparent opacity={0.09}   depthWrite={false} side={THREE.DoubleSide} />;
  const edge = '#E9EEF2';
  return (
    <group>
      {[[0, h / 2, w, 0], [0, h / 2, -w, 0], [w, h / 2, 0, R], [-w, h / 2, 0, R]].map(([x, y, z, r], i) => (
        <mesh key={i} position={[x, y, z]} rotation={[0, r, 0]}><planeGeometry args={[w * 2, h]} />{glass}</mesh>
      ))}
      {k > 0.98 && <mesh position={[0, h, 0]} rotation={[-R, 0, 0]}><planeGeometry args={[w * 2, w * 2]} />{glass}</mesh>}
      {/* рёбра */}
      {[[w, w], [w, -w], [-w, w], [-w, -w]].map(([x, z], i) => (
        <mesh key={'v' + i} position={[x, h / 2, z]}><boxGeometry args={[0.035, h, 0.035]} /><Mat c={edge} r={0.3} e={0.15} /></mesh>
      ))}
      {[0, h].map((y) => [[0, w, 0], [0, -w, 0], [w, 0, R], [-w, 0, R]].map(([x, z, r], i) => (
        <mesh key={'h' + y + i} position={[x, y + 0.01, z]} rotation={[0, r, 0]}><boxGeometry args={[w * 2, 0.035, 0.035]} /><Mat c={edge} r={0.3} e={0.15} /></mesh>
      )))}
    </group>
  );
};

/** табличка-плоскость с текстурой */
const Plate: React.FC<{tex: THREE.Texture; p: V3; w: number; h: number; r?: number; s?: number; glow?: number}> = ({tex, p, w, h, r = 0, s = 1, glow = 0.25}) => (
  <mesh position={p} rotation={[0, r, 0]} scale={s}><planeGeometry args={[w, h]} />
    <meshLambertMaterial map={tex} transparent emissive="#fff" emissiveMap={tex} emissiveIntensity={glow}  side={THREE.DoubleSide} />
  </mesh>
);

const facesTex = (dead: boolean) => canvasTex('faces' + dead, 512, 300, (c) => {
  c.fillStyle = dead ? '#2A2A30' : '#EAF3F7'; rr(c, 0, 0, 512, 300, 30); c.fill();
  if (!dead) {
    [[140, PAL.coral], [372, PAL.teal]].forEach(([x, col]) => {
      c.fillStyle = col as string; rr(c, (x as number) - 100, 40, 200, 220, 24); c.fill();
      c.fillStyle = PAL.skin; c.beginPath(); c.arc(x as number, 130, 50, 0, 7); c.fill();
      c.fillStyle = '#fff'; c.beginPath(); c.arc(x as number, 290, 90, Math.PI, 0); c.fill();
    });
  } else {
    c.strokeStyle = PAL.red; c.lineWidth = 26; c.lineCap = 'round';
    c.beginPath(); c.moveTo(206, 100); c.lineTo(306, 200); c.moveTo(306, 100); c.lineTo(206, 200); c.stroke();
  }
});
const qTex = canvasTex.bind(null);
const questionTex = () => qTex('q', 256, 256, (c) => {
  c.fillStyle = '#fff'; c.beginPath(); c.arc(128, 128, 120, 0, 7); c.fill();
  c.fillStyle = PAL.ink; c.font = `700 190px ${FONT}`; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('?', 128, 140);
});

// ---------- снег ----------
const SNOW_N = 700;
const Snow: React.FC<{t: number; k: number}> = ({t, k}) => {
  const ref = React.useRef<THREE.InstancedMesh>(null);
  const m = useMemo(() => new THREE.Matrix4(), []);
  if (ref.current) {
    for (let i = 0; i < SNOW_N; i++) {
      const x = (rnd(i) - 0.5) * 9.0, z = (rnd(i + 99) - 0.5) * 9.0;
      const sp = 0.35 + rnd(i + 7) * 0.25;
      let y = 3.1 - (((t * sp + rnd(i + 3) * 3.1) % 3.1));
      y = Math.max(0.03, y);
      const s = k * (0.012 + rnd(i + 5) * 0.01);
      m.makeScale(s, s, s).setPosition(x + Math.sin(t * 1.3 + i) * 0.05, y, z);
      ref.current.setMatrixAt(i, m);
    }
    ref.current.instanceMatrix.needsUpdate = true;
  }
  return (
    <instancedMesh ref={ref} args={[undefined, undefined, SNOW_N]} visible={k > 0} frustumCulled={false}>
      <sphereGeometry args={[1, 6, 4]} /><meshLambertMaterial color="#fff" emissive="#fff" emissiveIntensity={0.5} />
    </instancedMesh>
  );
};

// ======================= СЦЕНА =======================
export const City: React.FC<{m: Record<string, THREE.Group>; parts?: string}> = ({m, parts = 'all'}) => {
  const has = (k: string) => parts === 'all' || parts.split(',').includes(k);
  const frame = useCurrentFrame();
  const t = frame / FPS;
  const L = lightAt(t);
  const {autumn, snow} = seasonAt(t);
  const leaf = new THREE.Color(1, 1, 1).lerp(new THREE.Color(1.35, 0.78, 0.32), autumn);
  const stage = STAGE_T.filter((x) => t >= x).length;
  const flip = stage > 0 ? lin(t, STAGE_T[stage - 1], STAGE_T[stage - 1] + 0.5) : 0;
  const caseK = eout(lin(t, T.net - 0.1, T.net + 0.55));

  // 1. облако-интернет и нити
  const cloudK = 1 - eio(lin(t, T.off + 0.4, T.d1 + 0.3));
  const roofs = HOUSES.slice(0, 16).filter((_, i) => i % 2 === 0);

  return (
    <>
      <color attach="background" args={[L.bg]} />
      <fog attach="fog" args={[L.bg, 16, 34]} />
      <hemisphereLight args={['#DDE6FF', '#5A4A3E', L.hemi]} />
      <directionalLight position={L.sp} color={L.sun} intensity={L.si} castShadow shadow-mapSize={[1536, 1536]} shadow-bias={-0.0004}
        shadow-camera-left={-10} shadow-camera-right={10} shadow-camera-top={10} shadow-camera-bottom={-10} shadow-camera-near={0.5} shadow-camera-far={40} />
      <CamRig t={t} />

      {/* стол и подиум */}
      <mesh position={[0, -0.33, 0]} rotation={[-R, 0, 0]} receiveShadow><planeGeometry args={[80, 80]} /><Mat c="#5B4334" r={0.85} /></mesh>
      <RoundedBox args={[9.5, 0.3, 9.5]} radius={0.04} position={[0, -0.16, 0]} receiveShadow castShadow><Mat c="#ECE6DA" /></RoundedBox>

      {/* квартал */}
      {has('map') && MAP.map(([n, x, z, r], i) => (
        <Model key={'m' + i} m={m} n={n} p={[x, 0, z]} r={r ?? 0} snow={n === 'grass' ? snow : snow * 0.5} cast={n === 'road-straight-lightposts' || n === 'pavement-fountain'} />
      ))}
      {has('houses') && HOUSES.map(([n, x, z], i) => <group key={'h' + i}><Blob p={[x + 0.08, 0.066, z + 0.1]} w={1.35} o={0.8} /><Model m={m} n={n} p={[x, 0, z]} snow={snow * 0.35} /></group>)}
      {has('trees') && TREES.map(([n, x, z], i) => <Model key={'t' + i} m={m} n={n} p={[x, 0.01, z]} tint={leaf} snow={snow * 0.8} />)}

      {/* новые дома на пустыре */}
      {GROW.map(([n, x, z], i) => {
        const k = back(lin(t, T.grow - 0.5 + i * 0.12, T.grow + 0.1 + i * 0.12));
        return k > 0.001 ? <group key={'g' + i}><Blob p={[x + 0.08, 0.068, z + 0.1]} w={1.35} o={0.8 * Math.min(1, k)} /><Model m={m} n={n} p={[x, 0.02, z]} s={[1, k, 1]} snow={snow * 0.35} /></group> : null;
      })}
      <Tower t={t} snow={snow} />

      {/* заграница: отдельный островок справа */}
      <group position={[7.6, 0, -0.5]}>
        <RoundedBox args={[3, 0.3, 3]} radius={0.04} position={[0, -0.16, 0]} receiveShadow castShadow><Mat c="#E3E9EE" /></RoundedBox>
        {(['grass', 'grass', 'grass', 'pavement', 'pavement', 'pavement', 'grass', 'grass', 'grass'] as MName[]).map((n, i) => (
          <Model key={i} m={m} n={n} p={[(i % 3) - 1, 0, Math.floor(i / 3) - 1]} snow={snow} />
        ))}
        <Model m={m} n="building-small-a" p={[0, 0, -1]} snow={snow * 0.35} />
        <Model m={m} n="building-small-c" p={[1, 0, -1]} snow={snow * 0.35} />
        <Model m={m} n="grass-trees" p={[1, 0.01, 1]} tint={leaf} snow={snow * 0.8} />
        <Model m={m} n="flag" p={[-1.2, 0.05, -1.2]} />
      </group>

      {/* календарь на столе */}
      <Blob p={[-2.9, -0.325, -6.5]} w={3.6} d={2.4} o={0.7} />
      <Calendar p={[-3.0, -0.33, -6.7]} r={0.22} s={2.3} stage={stage} flip={flip} />

      {/* облако и нити */}
      {cloudK > 0.01 && (
        <group position={[0, 4.9 + (1 - cloudK) * 2, 0]}>
          <Model m={m} n="cloud" p={[0, 0, 0]} s={2.2 * cloudK} />
          {(['play', 'chat', 'globe', 'game', 'music', 'video'] as const).map((k2, i) => {
            const a = i / 6 * Math.PI * 2 + t * 0.6;
            const fall = lin(t, T.off + i * 0.05, T.off + 0.9 + i * 0.05);
            return <AppIcon key={k2} k={k2} p={[Math.cos(a) * 1.9, 0.8 - fall * fall * 4, Math.sin(a) * 1.9]} r={-a + R} s={2.2 * cloudK} grey={fall > 0.3 ? 1 : 0} />;
          })}
        </group>
      )}
      {roofs.map(([n, x, z], i) => {
        const cut = T.off + i * 0.06;
        const k = t < cut ? 1 : 1 - eout(lin(t, cut, cut + 0.3));
        const top: V3 = [x * 0.25, 4.85, z * 0.25];
        const bot: V3 = [x, ROOF[n] + 0.05, z];
        return k > 0.01 ? (
          <group key={'th' + i}>
            <Rod a={top} b={bot} k={k * 0.5} r={0.012} />
            <Rod a={bot} b={top} k={k * 0.5} r={0.012} />
          </group>
        ) : null;
      })}
      {has('case') && <GlassCase k={caseK} />}

      {/* ===== сцены ===== */}
      {has('scenes') && <>
      <S3Icons t={t} />
      <S4Vpn t={t} />
      <S6Signs t={t} />
      <S7Ok t={t} />
      <S8Phones t={t} />
      <S9Free t={t} />
      <S10Code t={t} />
      <S11Call t={t} />
      <S13Shop t={t} />
      <S15Blog t={t} />
      <S16Flash t={t} />
      <S17Year t={t} />
      <Snow t={t} k={snow} />
      </>}
    </>
  );
};

// ---------- S3: значки сереют ----------
const S3Icons: React.FC<{t: number}> = ({t}) => {
  if (t < T.d1 || t > T.vpn + 0.6) return null;
  const ks = ['play', 'chat', 'globe', 'game'] as const;
  const at = [T.yt, T.wa, T.sites, T.games];
  const grey = t > T.notopen + 0.15 ? 1 : 0;
  return (
    <group>
      <Person p={[-3, 0.05, -0.32]} shirt={PAL.coral} armR={0.9 + (grey ? 0 : 0.05 * Math.sin(t * 6))} nod={0.15}
        armL={grey ? 0.3 : 0} outL={grey ? 0.5 * win(t, T.notopen + 0.2, 99) : 0}>
        <Phone p={[0, 0.02, 0.02]} r={[-0.6, 0, 0]} s={0.07} color={PAL.ink} />
      </Person>
      {ks.map((k, i) => {
        const s = pop(t, at[i], 0.4);
        if (s <= 0) return null;
        const g = lin(t, T.notopen + i * 0.1, T.notopen + 0.15 + i * 0.1);
        return <AppIcon key={k} k={k} p={[-3.48 + i * 0.32, 0.5 + Math.sin(t * 2 + i) * 0.015 - g * 0.04, -0.3]} s={0.85 * s} r={(i - 1.5) * -0.12}
          grey={g > 0.5 ? 1 : 0} spin={t * 5} cross={back(lin(t, T.vpn - 0.3 + i * 0.07, T.vpn + i * 0.07))} />;
      })}
    </group>
  );
};

// ---------- S4: VPN ----------
const S4Vpn: React.FC<{t: number}> = ({t}) => {
  if (t < T.vpn - 0.6 || t > T.d2 + 0.8) return null;
  const crowd: [number, number, string, 'short' | 'long' | 'cap'][] = [[1.35, 1.55, PAL.teal, 'short'], [1.75, 1.35, PAL.yellow, 'long'], [2.15, 1.6, PAL.violet, 'cap']];
  const shrug = win(t, T.confused - 0.1, T.d2 + 0.4, 0.3, 0.4);
  return (
    <group>
      {crowd.map(([x, z, c, st], i) => {
        const sh = pop(t, T.vpn - 0.2 + i * 0.12, 0.4);
        const crack = lin(t, T.nohelp + i * 0.08, T.nohelp + 0.25 + i * 0.08);
        const reb = lin(t, T.reboot, T.confused);
        return (
          <group key={i}>
            <Person p={[x, 0.06, z]} ry={(1 - i) * 0.35} shirt={c} hair={i === 1 ? '#7A4A2A' : '#2A2220'} style={st}
              armL={shrug * 0.5} armR={shrug * 0.5} outL={shrug * 1.0} outR={shrug * 1.0} slump={win(t, T.d2, T.d2 + 3) * 0} />
            {sh > 0 && <Shield p={[x, 0.42 + Math.sin(t * 2.5 + i) * 0.01, z]} s={sh} crack={reb > 0 && reb < 1 ? 0 : crack} r={reb * Math.PI * 4} />}
            {reb > 0 && reb < 1 && <Reload p={[x, 0.42, z + 0.08]} a={reb * Math.PI * 6} s={1.1} />}
          </group>
        );
      })}
    </group>
  );
};

// ---------- S6: вывески работают ----------
const S6Signs: React.FC<{t: number}> = ({t}) => {
  if (t < T.vk - 0.4) return null;
  const signs: [IconK, number, number, number][] = [['chat', -2, -1, T.vk], ['search', -1, -1, T.ya], ['coin', 2, -2, T.bank], ['box', 1, -2, T.mp]];
  const truckK = eio(lin(t, T.mp - 0.2, T.work + 0.9));
  return (
    <group>
      {signs.map(([k, x, z, at], i) => {
        const roof = ROOF[HOUSES.find((h) => h[1] === x && h[2] === z)![0]];
        const s = pop(t, at, 0.45);
        const ok = pop(t, T.work + i * 0.1, 0.4);
        return (
          <group key={i} position={[x, roof + 0.05, z]}>
            <mesh position={[0, 0.12, 0]} castShadow><cylinderGeometry args={[0.012, 0.012, 0.24 * s, 6]} /><Mat c={PAL.ink} /></mesh>
            <AppIcon k={k} p={[0, 0.34 * s, 0]} s={1.25 * s} />
            {ok > 0 && (
              <group position={[0.22, 0.52, 0.06]} scale={ok}>
                <mesh><sphereGeometry args={[0.08, 16, 12]} /><Mat c={PAL.green} e={0.15} /></mesh>
                <AppIcon k="check" p={[0, 0, 0.05]} s={0.45} />
              </group>
            )}
          </group>
        );
      })}
      {truckK > 0 && truckK < 1 && t < T.okay + 0.6 && <Truck p={[0.18, 0.04, mix(3.6, -1.75, truckK)]} r={R} wheel={t * 12} col={PAL.coral} />}
      {t >= T.work + 0.9 && t < T.okay + 1 && <Truck p={[0.18, 0.04, -1.75]} r={R} col={PAL.coral} />}
    </group>
  );
};
type IconK = 'chat' | 'search' | 'coin' | 'box';

// ---------- S7: «жить можно» ----------
const S7Ok: React.FC<{t: number}> = ({t}) => {
  if (t < T.okay - 0.6 || t > T.week + 0.6) return null;
  const msgs: [string, V3][] = [['ну и ладно', [-2.3, 0.62, 2.5]], ['жить можно', [-1.3, 0.85, 2.3]], ['норм 👌', [-2.0, 1.1, 1.9]], ['работает же', [-1.0, 0.55, 2.8]]];
  return (
    <group>
      <Bench p={[-1.6, 0.06, 3.2]} />
      <Person p={[-1.67, 0.06, 3.2]} sit shirt={PAL.blue} armR={0.9}>
        <Phone p={[0, 0.02, 0.02]} r={[-0.9, 0, 0]} s={0.06} />
      </Person>
      {msgs.map(([txt, p], i) => {
        const at = i === 0 ? T.okay : T.write + (i - 1) * 0.22;
        const s = pop(t, at, 0.4);
        return s > 0 ? <Bubble key={i} txt={txt} p={[p[0], p[1] + (t - at) * 0.04, p[2]]} s={s * 0.9} r={0} col={i % 2 ? '#fff' : '#DFF4EA'} /> : null;
      })}
    </group>
  );
};

// ---------- S8: телефоны не обновляются ----------
const S8Phones: React.FC<{t: number}> = ({t}) => {
  if (t < T.week + 0.2 || t > T.free + 0.6) return null;
  const rise = eout(lin(t, T.week + 0.6, T.week + 1.4)) * (1 - eio(lin(t, T.free - 0.2, T.free + 0.4)));
  const k = Math.min(0.99, mix(0.4, 0.99, eout(lin(t, T.week + 1.2, T.noupd))));
  const err = t > T.noupd + 0.3;
  const tex = updateTex(k, err);
  return (
    <group>
      {[-2.42, -1.58].map((x, i) => (
        <group key={i} position={[x, -1 + rise * 1.06, 1.35]}>
          <Phone p={[0, 0.5, 0]} r={(i ? -1 : 1) * 0.18} s={1} screen={tex} color={i ? '#E8E4EA' : PAL.ink} />
          <mesh position={[0, 0.03, 0]}><cylinderGeometry args={[0.3, 0.34, 0.06, 24]} /><Mat c="#BDB6AA" /></mesh>
        </group>
      ))}
      {/* маленькие люди смотрят на памятники */}
      <Person p={[-2.1, 0.06, 1.75]} ry={Math.PI} shirt={PAL.teal} armL={0.2} />
      <Person p={[-1.85, 0.06, 1.85]} ry={Math.PI + 0.3} shirt={PAL.yellow} style="long" hair="#B5653A" outR={err ? 0.6 : 0} armR={err ? 0.6 : 0} />
    </group>
  );
};

// ---------- S9: фрилансер и деньги из-за границы ----------
const S9Free: React.FC<{t: number}> = ({t}) => {
  if (t < T.free - 0.8 || t > T.prog + 0.6) return null;
  const leave = lin(t, T.clients, T.clients + 1.2);
  return (
    <group>
      <Person p={[3.6, 0.06, -0.42]} ry={R} shirt={PAL.violet} armL={0.9} armR={0.9} nod={0.2}
        outL={0.1} slump={lin(t, T.nocome, T.nocome + 0.5)}>
        <Laptop p={[-0.04, 0.0, 0.05]} r={[0, 0, 0]} s={0.6} screen={facesTex(false)} />
      </Person>
      {[0, 1].map((i) => (
        <Person key={i} p={[6.45 + leave * (0.6 + i * 0.3), 0.06, -0.75 + i * 0.4]} ry={leave > 0.15 ? R : -R} walk={leave > 0.15 ? t * 10 : 0}
          shirt={i ? PAL.blue : PAL.teal} armR={leave > 0.15 ? 0 : 2.6} outR={leave > 0.15 ? 0 : 0.2 * Math.sin(t * 9)} s={1 - leave * 0.2} />
      ))}
      {/* монеты летят и ударяются о стекло */}
      {Array.from({length: 6}).map((_, i) => {
        const t0 = T.money + i * 0.16, x0 = 6.3, x1 = CASE.w + 0.04;
        const f = lin(t, t0, t0 + 0.55), d = lin(t, t0 + 0.55, t0 + 1.25);
        if (f <= 0) return null;
        const z = -0.5 + (rnd(i) - 0.5) * 0.6;
        const x = f < 1 ? mix(x0, x1, f) : x1 + 0.12 + d * 0.3;
        const y = f < 1 ? 0.4 + Math.sin(f * Math.PI) * 0.5 : Math.max(-0.31, 0.4 + 0.2 * d - 1.6 * d * d * 1.5);
        return (
          <group key={i} position={[x, y, z]} rotation={[t * 8 + i, R, 0]} scale={0.45}>
            <mesh castShadow rotation={[R, 0, 0]}><cylinderGeometry args={[0.18, 0.18, 0.05, 20]} /><Mat c={PAL.yellow} r={0.35} /></mesh>
          </group>
        );
      })}
    </group>
  );
};

// ---------- S10: код застревает на крышке ----------
const S10Code: React.FC<{t: number}> = ({t}) => {
  if (t < T.prog - 0.8 || t > T.month + 0.8) return null;
  return (
    <group>
      <group position={[2, 1.0, -1]}>
        <Person p={[0, 0.0, 0.05]} sit shirt={PAL.ink} armL={0.9} armR={0.9} nod={-0.2 - lin(t, T.dl, T.dl + 0.8) * 0.4} />
        <Laptop p={[0, 0.06, 0.16]} s={0.55} screen={signTex('скачать…', '#EEF2F6', PAL.ink, 384, 256, 64)} />
      </group>
      {Array.from({length: 7}).map((_, i) => {
        const t0 = T.dl - 0.2 + i * 0.13;
        const f = lin(t, t0, t0 + 0.6);
        if (f <= 0) return null;
        const y = Math.max(CASE.h + 0.09, 6.0 - f * f * 2.9);
        const b = f >= 1 ? Math.sin(lin(t, t0 + 0.6, t0 + 0.9) * Math.PI) * 0.05 : 0;
        return <AppIcon key={i} k="code" p={[1.4 + (i % 4) * 0.4 + rnd(i) * 0.1, y + b, -1.3 + Math.floor(i / 4) * 0.5]} r={[-R, 0, rnd(i + 2)]} s={1} />;
      })}
    </group>
  );
};

// ---------- S11–S12: звонок, видеосвязь, бабушка ----------
const S11Call: React.FC<{t: number}> = ({t}) => {
  if (t < T.month + 0.5 || t > T.biz + 0.5) return null;
  const cord = lin(t, T.call - 0.2, T.call + 0.5);
  const scr = pop(t, T.video - 0.1, 0.4);
  const dead = t > T.vdead + 0.15;
  const gr = t > T.granny - 0.6;
  const tabDead = t > T.nosee + 0.1;
  return (
    <group>
      <Person p={[4.25, 0.06, 1.15]} ry={R} shirt={PAL.coral} armR={2.2} outR={0.4} />
      <Person p={[6.35, 0.06, 0.45]} ry={-R} shirt={PAL.teal} style="long" hair="#5A3A2A" armR={2.2} outR={0.4} />
      <Cord k={cord} />
      {scr > 0 && t < T.granny && <Plate tex={facesTex(dead)} p={[5.35, 0.62, 0.9]} w={0.62} h={0.36} s={scr} glow={dead ? 0.05 : 0.5} />}
      {gr && (
        <>
          <Person p={[4.45, 0.06, 0.95]} ry={R} shirt="#7C5A8C" style="bun" hair="#D9D6D2" slump={0.4 + lin(t, T.nosee, T.nosee + 0.6) * 0.5}
            armL={tabDead ? 0.3 : 0.9} armR={tabDead ? 0.3 : 0.9}>
            <Phone p={[-0.02, 0.0, 0.03]} r={[-0.5, -0.6, 0]} s={0.11} color="#D9D3C8" screen={tabDead ? undefined : facesTex(false)} dark={tabDead ? 1 : 0} />
          </Person>
          {[0, 1].map((i) => (
            <Person key={i} p={[6.45 + i * 0.22, 0.06, 0.85 - i * 0.28]} ry={-R} s={0.68} shirt={i ? PAL.yellow : PAL.blue} style="kid"
              armR={2.7} outR={0.25 * Math.sin(t * 8 + i)} />
          ))}
        </>
      )}
    </group>
  );
};
const Cord: React.FC<{k: number}> = ({k}) => {
  const geo = useMemo(() => {
    const c = new THREE.CatmullRomCurve3([new THREE.Vector3(4.3, 0.2, 1.15), new THREE.Vector3(4.6, 0.1, 1.05), new THREE.Vector3(5.3, 0.05, 0.8), new THREE.Vector3(6.0, 0.1, 0.55), new THREE.Vector3(6.3, 0.2, 0.45)]);
    return new THREE.TubeGeometry(c, 80, 0.008, 6, false);
  }, []);
  if (k <= 0) return null;
  geo.setDrawRange(0, Math.floor((geo.index!.count / 6) * k) * 6);
  return <mesh geometry={geo}><Mat c={PAL.ink} /></mesh>;
};

// ---------- S13: магазин закрывается ----------
const S13Shop: React.FC<{t: number}> = ({t}) => {
  if (t < T.biz - 0.6 || t > T.m3 + 0.8) return null;
  const sh = eio(lin(t, T.close - 0.1, T.close + 0.6));
  const sign = pop(t, T.close + 0.5, 0.35);
  return (
    <group position={[1, 0, -0.47]}>
      <Plate tex={signTex('магазин', PAL.teal, '#fff', 512, 160, 92)} p={[0, 0.78, 0.02]} w={0.5} h={0.156} glow={0.35} />
      <mesh position={[0, 0.72 - sh * 0.33, 0.04]} castShadow>
        <boxGeometry args={[0.6, 0.06 + sh * 0.6, 0.02]} /><Mat c="#9AA0A8" r={0.4} />
      </mesh>
      {Array.from({length: 7}).map((_, i) => sh > i / 7 ? (
        <mesh key={i} position={[0, 0.72 - i * 0.085, 0.052]}><boxGeometry args={[0.6, 0.006, 0.004]} /><Mat c="#7C828A" /></mesh>
      ) : null)}
      {sign > 0 && <Plate tex={signTex('закрыто', PAL.red, '#fff', 512, 160, 96)} p={[0, 0.3, 0.07]} w={0.32} h={0.1} s={sign} glow={0.3} />}
      <Person p={[0.4, 0.06, 0.3]} ry={-0.3} shirt="#5C6F8A" slump={sh} />
    </group>
  );
};

// ---------- S14: башня своих платформ ----------
const Tower: React.FC<{t: number; snow: number}> = ({t, snow}) => {
  const k = back(lin(t, T.grow - 0.2, T.grow + 0.9));
  if (k <= 0.001) return null;
  return (
    <group position={[2, 0.02, 2]} scale={[1, k, 1]}>
      <Blob p={[0.1, 0.05, 0.12]} w={1.2} o={0.8} />
      {[0, 1, 2, 3].map((i) => (
        <RoundedBox key={i} args={[0.7 - i * 0.08, 0.62, 0.7 - i * 0.08]} radius={0.05} position={[0, 0.31 + i * 0.62, 0]} castShadow receiveShadow>
          <Mat c={i % 2 ? '#F2EEE6' : PAL.teal} e={snow * 0.2} ec="#fff" />
        </RoundedBox>
      ))}
      {[0, 1, 2, 3].map((i) => [0, 1, 2].map((j) => (
        <mesh key={i + '-' + j} position={[-0.2 + j * 0.2, 0.31 + i * 0.62, (0.7 - i * 0.08) / 2 + 0.002]}>
          <planeGeometry args={[0.1, 0.32]} /><Mat c="#FFE8B0" e={0.6} />
        </mesh>
      )))}
      <mesh position={[0, 2.62, 0]} castShadow><cylinderGeometry args={[0.012, 0.012, 0.3, 6]} /><Mat c={PAL.ink} /></mesh>
      <AppIcon k="play" p={[0, 2.95, 0]} s={1.6} />
    </group>
  );
};

// ---------- S15: блогер переезжает, новые звёзды ----------
const S15Blog: React.FC<{t: number}> = ({t}) => {
  if (t < T.blog - 0.6 || t > T.half + 0.6) return null;
  const drive = eio(lin(t, T.blog - 0.3, T.stars - 0.4));
  const x = mix(-3.6, 1.55, drive);
  return (
    <group>
      <Truck p={[x, 0.04, 0.2]} wheel={t * 14} col={PAL.violet}>
        <Person p={[-0.04, 0.0, 0]} ry={R} s={0.9} shirt={PAL.coral} style="cap" armR={0.5} />
        <group position={[0.07, 0.0, 0.0]}>
          <mesh position={[0, 0.12, 0]}><cylinderGeometry args={[0.005, 0.005, 0.24, 6]} /><Mat c={PAL.ink} /></mesh>
          <mesh position={[0, 0.25, 0]} rotation={[0, R, 0]}><torusGeometry args={[0.055, 0.01, 8, 24]} /><Mat c="#fff" e={1.2} /></mesh>
        </group>
      </Truck>
      {Array.from({length: 6}).map((_, i) => {
        const s = pop(t, T.stars + i * 0.1, 0.4);
        const a = (i / 6) * Math.PI * 2 + t * 0.5;
        return s > 0 ? <Star key={i} p={[2 + Math.cos(a) * 0.75, 3.3 + Math.sin(i * 2) * 0.25, 2 + Math.sin(a) * 0.75]} r={[0, -a, 0]} s={s * 1.4} /> : null;
      })}
      {/* «привыкли»: люди отдыхают у башни */}
      {t > T.used - 0.4 && [0, 1, 2].map((i) => (
        <Person key={i} p={[1.25 + i * 0.25, 0.06, 2.75 + (i % 2) * 0.1]} ry={0.2 - i * 0.2} shirt={[PAL.yellow, PAL.teal, PAL.blue][i]}
          style={i === 1 ? 'long' : 'short'} hair={i === 1 ? '#7A4A2A' : '#2A2220'} s={pop(t, T.used - 0.4 + i * 0.1, 0.4)} />
      ))}
    </group>
  );
};

// ---------- S16: флешки по цепочке, журналы в цене ----------
const S16Flash: React.FC<{t: number}> = ({t}) => {
  if (t < T.half + 0.3 || t > T.year + 0.6) return null;
  const N = 5, xs = Array.from({length: N}, (_, i) => 3.6 - i * 0.45); // z цепочки
  const fp = lin(t, T.pass - 0.4, T.again - 0.2) * (N - 1);
  const seg = Math.min(N - 2, Math.floor(fp)), fk = eio(fp - seg);
  const fx = mix(xs[seg], xs[seg + 1], fk);
  const price = t > T.price - 0.1;
  return (
    <group>
      {xs.map((x, i) => {
        const near = Math.abs(fx - x) < 0.35 ? 1 - Math.abs(fx - x) / 0.35 : 0;
        return (
          <Person key={i} p={[-0.75, 0.06, x]} ry={R * 0.8} shirt={[PAL.teal, PAL.coral, PAL.blue, PAL.yellow, PAL.violet][i]}
            style={(['short', 'long', 'cap', 'short', 'bun'] as const)[i]} hair={i === 4 ? '#D9D6D2' : '#3A2A20'}
            armL={near * 1.2} armR={near * 1.2} outL={-0.3 * near} outR={-0.3 * near} />
        );
      })}
      <Flash p={[-0.66, 0.2 + Math.sin(fk * Math.PI) * 0.1, fx]} r={[0, 0, R + fk * Math.PI]} s={1.3} />
      <Kiosk p={[-0.85, 0.06, 1.2]} r={0.3} price={price ? '500 ₽' : '50 ₽'} priceS={price ? pop(t, T.price - 0.1, 0.45) : 1} />
    </group>
  );
};

// ---------- S17–S18: год, отец и сын, мир в телефоне ----------
const S17Year: React.FC<{t: number}> = ({t}) => {
  if (t < T.year + 0.4) return null;
  const q = pop(t, T.what - 0.1, 0.4) * (1 - lin(t, T.before - 0.2, T.before + 0.2));
  const phoneUp = eio(lin(t, T.before - 0.6, T.before + 0.2));
  const g = eout(lin(t, T.world - 0.5, T.world + 0.5));
  return (
    <group position={[0.55, 0, 0]}>
      <Bench p={[-2.45, 0.06, 2.6]} />
      <Person p={[-2.55, 0.06, 2.6]} sit shirt="#4A5568" hair="#5B4A3E" slump={lin(t, T.sigh, T.sigh + 0.6) * 0.6} nod={0.15 * phoneUp} armR={phoneUp * 0.2} />
      <Person p={[-2.32, 0.06, 2.6]} sit s={0.85} shirt={PAL.coral} style="cap" ry={-0.35} nod={-0.1} />
      {q > 0 && <Plate tex={questionTex()} p={[-2.25, 0.4, 2.62]} w={0.14} h={0.14} s={q} glow={0.4} />}
      {phoneUp > 0 && (
        <group position={[-2.38, mix(0.12, 0.205, phoneUp), 2.72]} rotation={[mix(-1.2, -0.05, phoneUp), 0, 0]}>
          <Phone p={[0, 0, 0]} s={0.075} color={PAL.ink} screen={signTex('', '#1B2B4A', '#fff', 64, 128, 10)} />
          {g > 0 && <Globe p={[0, 0, 0.006 + g * 0.02]} s={0.03 * g} a={t * 1.2} />}
        </group>
      )}
    </group>
  );
};
