// Город-диорама на подставке из набора KayKit City Builder Bits (CC0) + деревья, окна и зелень кодом.
import React, {useMemo} from 'react';
import * as THREE from 'three';
import {GLTF} from 'three/examples/jsm/loaders/GLTFLoader.js';
import {CITY} from './assets';

export const CITY_MODELS = ['base', 'road_straight', 'road_corner', 'building_A', 'building_B', 'building_C', 'building_D',
  'building_E', 'building_F', 'building_G', 'building_H', 'car_sedan', 'car_taxi', 'car_hatchback', 'car_police',
  'car_stationwagon', 'streetlight', 'bench', 'bush'].map(CITY);

export const TILE = 2;
// Внешнее кольцо зданий 7×7: индекс → тип здания. Особые: H — роддом, S — школа, T — магазин игрушек.
type Cell = {i: number; j: number; kind: string; rot: number; tag?: string};
const B = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];

export const LAYOUT: Cell[] = (() => {
  const cells: Cell[] = [];
  let k = 0;
  for (let i = -3; i <= 3; i++) for (let j = -3; j <= 3; j++) {
    const ai = Math.abs(i), aj = Math.abs(j);
    if (ai <= 1 && aj <= 1) cells.push({i, j, kind: 'base', rot: 0, tag: 'plaza'});
    else if (ai === 2 && aj === 2) cells.push({i, j, kind: 'road_corner', rot: cornerRot(i, j)});
    else if (ai === 2 && aj < 2) cells.push({i, j, kind: 'road_straight', rot: 0});
    else if (aj === 2 && ai < 2) cells.push({i, j, kind: 'road_straight', rot: Math.PI / 2});
    else {
      // здание смотрит к центру
      const rot = ai === 3 && aj < 3 ? (i > 0 ? -Math.PI / 2 : Math.PI / 2) : (j > 0 ? Math.PI : 0);
      cells.push({i, j, kind: 'building_' + B[(k * 5 + 3) % 8], rot});
      k++;
    }
  }
  return cells;
})();
function cornerRot(i: number, j: number) {
  if (i > 0 && j > 0) return 0;
  if (i < 0 && j > 0) return -Math.PI / 2;
  if (i < 0 && j < 0) return Math.PI;
  return Math.PI / 2;
}
export const cellPos = (i: number, j: number): [number, number, number] => [i * TILE, 0, j * TILE];

const tint = (obj: THREE.Object3D, desat: number, dark: number) => {
  obj.traverse((o) => {
    const m = o as THREE.Mesh;
    if (!m.isMesh) return;
    const mat = (m.material as THREE.MeshStandardMaterial);
    if (!mat.userData.base) {
      m.material = mat.clone();
      (m.material as THREE.MeshStandardMaterial).userData.base = mat.color.clone();
    }
    const mm = m.material as THREE.MeshStandardMaterial;
    const b = mm.userData.base as THREE.Color;
    const gray = (b.r + b.g + b.b) / 3;
    mm.color.setRGB(b.r + (gray - b.r) * desat, b.g + (gray - b.g) * desat, b.b + (gray - b.b) * desat).multiplyScalar(1 - dark);
    mm.roughness = 0.85;
  });
};

const Model: React.FC<{g: GLTF; position?: [number, number, number]; rot?: number; scale?: number; desat?: number; dark?: number}> = ({g, position = [0, 0, 0], rot = 0, scale = 1, desat = 0, dark = 0}) => {
  const obj = useMemo(() => g.scene.clone(true), [g]);
  tint(obj, desat, dark);
  return <primitive object={obj} position={position} rotation={[0, rot, 0]} scale={scale} />;
};

export const Tree: React.FC<{position: [number, number, number]; s?: number; c?: string}> = ({position, s = 1, c = '#7FA36B'}) => (
  <group position={position} scale={s}>
    <mesh castShadow position={[0, 0.25, 0]}><cylinderGeometry args={[0.05, 0.07, 0.5, 8]} /><meshStandardMaterial color="#8A6A4F" roughness={0.9} /></mesh>
    <mesh castShadow position={[0, 0.7, 0]}><icosahedronGeometry args={[0.36, 1]} /><meshStandardMaterial color={c} roughness={0.9} flatShading /></mesh>
  </group>
);

export type CityProps = {
  m: Record<string, GLTF>;
  desat?: number;   // 0 — живые цвета, 1 — серый
  dark?: number;    // затемнение
  grass?: number;   // 0..1 — зарастание
  lights?: number;  // 0..1 — доля горящих окон (вечер)
  hideCells?: (c: Cell) => boolean;
  children?: React.ReactNode;
};

const rnd = (n: number) => { const x = Math.sin(n * 127.1) * 43758.5453; return x - Math.floor(x); };

export const City: React.FC<CityProps> = ({m, desat = 0, dark = 0, grass = 0, lights = 0, hideCells, children}) => {
  const trees = useMemo(() => {
    const t: [number, number, number][] = [];
    // деревья по краю подставки
    for (let k = 0; k < 28; k++) {
      const side = k % 4, u = (Math.floor(k / 4) / 6) * 13 - 6.5 + rnd(k) * 0.6;
      const e = 7.35;
      t.push(side === 0 ? [u, 0, e] : side === 1 ? [u, 0, -e] : side === 2 ? [e, 0, u] : [-e, 0, u]);
    }
    return t;
  }, []);
  return (
    <group>
      {/* подставка-диорама */}
      <mesh receiveShadow position={[0, -0.6, 0]}><boxGeometry args={[15.4, 1.2, 15.4]} /><meshStandardMaterial color={new THREE.Color('#9C7A5B').multiplyScalar(1 - dark)} roughness={0.95} /></mesh>
      <mesh receiveShadow position={[0, 0.02, 0]}><boxGeometry args={[15.4, 0.06, 15.4]} /><meshStandardMaterial color={new THREE.Color('#A9C48C').lerp(new THREE.Color('#8F9A86'), desat).multiplyScalar(1 - dark)} roughness={0.95} /></mesh>
      {LAYOUT.filter((c) => !hideCells?.(c)).map((c, n) => (
        <Model key={n} g={m[CITY(c.kind)]} position={cellPos(c.i, c.j)} rot={c.rot} desat={desat} dark={dark} />
      ))}
      {trees.map((p, k) => <Tree key={k} position={p} s={0.9 + rnd(k + 3) * 0.5 + grass * 0.8} c={grass > 0.3 ? '#5E8A55' : '#7FA36B'} />)}
      {/* фонари и скамейки на площади */}
      {[[-1.3, -1.3], [1.3, -1.3], [-1.3, 1.3], [1.3, 1.3]].map(([x, z], k) => (
        <Model key={'l' + k} g={m[CITY('streetlight')]} position={[x, 0.1, z]} rot={Math.atan2(x, z) + Math.PI} desat={desat} dark={dark} />
      ))}
      {children}
    </group>
  );
};

export const Car: React.FC<{m: Record<string, GLTF>; kind?: string; position: [number, number, number]; rot?: number; desat?: number; dark?: number}> = ({m, kind = 'car_sedan', position, rot = 0, desat, dark}) => (
  <Model g={m[CITY(kind)]} position={position} rot={rot} desat={desat} dark={dark} />
);
