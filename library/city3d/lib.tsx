// Общие помощники для 3D-макета: время, загрузка GLB через delayRender, текстуры-надписи, фигурки людей.
import React, {useEffect, useMemo, useState} from 'react';
import {continueRender, delayRender, staticFile} from 'remotion';
import * as THREE from 'three';
import {GLTFLoader} from 'three/examples/jsm/loaders/GLTFLoader.js';
import WORDS from './words.json';

export type V3 = [number, number, number];
export const FPS = 30;
export const words = WORDS as {w: string; s: number; e: number; t: string}[];

/** время начала слова: wf('впн', 2) — второе вхождение */
export const wf = (w: string, n = 1) => {
  let k = 0;
  for (const x of words) if (x.w === w && ++k === n) return x.s;
  throw new Error('нет слова ' + w + ' ' + n);
};

export const clamp = (x: number, a = 0, b = 1) => Math.min(b, Math.max(a, x));
export const lin = (t: number, a: number, b: number) => clamp((t - a) / (b - a));
export const eio = (x: number) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);
export const eout = (x: number) => 1 - Math.pow(1 - x, 3);
export const back = (x: number) => {
  const c1 = 1.9, c3 = c1 + 1;
  return x <= 0 ? 0 : x >= 1 ? 1 : 1 + c3 * Math.pow(x - 1, 3) + c1 * Math.pow(x - 1, 2);
};
/** появление с пружиной: 0 → 1 за d секунд с t0 */
export const pop = (t: number, t0: number, d = 0.35) => back(lin(t, t0, t0 + d));
/** окно видимости: появиться в a, исчезнуть в b */
export const win = (t: number, a: number, b: number, fi = 0.3, fo = 0.3) =>
  Math.min(back(lin(t, a, a + fi)), 1 - eio(lin(t, b - fo, b)));
export const mix = (a: number, b: number, k: number) => a + (b - a) * k;
export const mixV = (a: V3, b: V3, k: number): V3 => [mix(a[0], b[0], k), mix(a[1], b[1], k), mix(a[2], b[2], k)];
export const rnd = (i: number) => {
  const x = Math.sin(i * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
};

// ---------- модели ----------
export const MODEL_NAMES = [
  'building-small-a', 'building-small-b', 'building-small-c', 'building-small-d', 'building-garage',
  'road-straight', 'road-straight-lightposts', 'road-corner', 'road-intersection', 'road-split',
  'pavement', 'pavement-fountain', 'grass', 'grass-trees', 'grass-trees-tall', 'cloud', 'coin', 'flag',
] as const;
export type MName = (typeof MODEL_NAMES)[number];
const pixCache = new Map<THREE.Texture, ImageData>();
const bakeVertexColors = (mesh: THREE.Mesh, map: THREE.Texture | null) => {
  const g = mesh.geometry as THREE.BufferGeometry;
  const uv = g.getAttribute('uv');
  if (!map || !uv) return;
  let px = pixCache.get(map);
  if (!px) {
    const img = map.image as HTMLImageElement | ImageBitmap;
    const cv = document.createElement('canvas');
    cv.width = img.width; cv.height = img.height;
    const c = cv.getContext('2d')!;
    c.drawImage(img as CanvasImageSource, 0, 0);
    px = c.getImageData(0, 0, cv.width, cv.height);
    pixCache.set(map, px);
  }
  const col = new Float32Array(uv.count * 3);
  const tmp = new THREE.Color();
  for (let i = 0; i < uv.count; i++) {
    let u = uv.getX(i) % 1, v = uv.getY(i) % 1;
    if (u < 0) u += 1; if (v < 0) v += 1;
    const x = Math.min(px.width - 1, Math.floor(u * px.width));
    const y = Math.min(px.height - 1, Math.floor((map.flipY ? 1 - v : v) * px.height));
    const k = (y * px.width + x) * 4;
    tmp.setRGB(px.data[k] / 255, px.data[k + 1] / 255, px.data[k + 2] / 255, THREE.SRGBColorSpace);
    col[i * 3] = tmp.r; col[i * 3 + 1] = tmp.g; col[i * 3 + 2] = tmp.b;
  }
  g.setAttribute('color', new THREE.BufferAttribute(col, 3));
};
let cache: Record<string, THREE.Group> | null = null;
let pending: Promise<void> | null = null;

export const useModels = () => {
  const [m, setM] = useState(cache);
  const [handle] = useState(() => (cache ? null : delayRender('glb', {timeoutInMilliseconds: 120000})));
  useEffect(() => {
    if (cache) return;
    if (!pending) {
      const loader = new GLTFLoader();
      const out: Record<string, THREE.Group> = {};
      pending = Promise.all(
        MODEL_NAMES.map((n) => loader.loadAsync(staticFile(['cloud', 'coin', 'flag'].includes(n) ? `models/pf/${n}.glb` : `models/${n}.glb`)).then((g) => {
          g.scene.traverse((o) => {
            const mesh = o as THREE.Mesh;
            if (mesh.isMesh) {
              mesh.castShadow = true; mesh.receiveShadow = true;
              const mat = mesh.material as THREE.MeshStandardMaterial;
              if (mat.map) { mat.map.colorSpace = THREE.SRGBColorSpace; mat.map.anisotropy = 1; }
              // Палитру colormap запекаем в цвета вершин, материал Lambert без текстуры:
              // в программном рендере (swangle) это в разы дешевле PBR с текстурой, а макет и так матовый
              bakeVertexColors(mesh, mat.map);
              mesh.material = new THREE.MeshLambertMaterial({vertexColors: true});
            }
          });
          out[n] = g.scene;
        })),
      ).then(() => { cache = out; });
    }
    pending.then(() => { setM(cache); if (handle !== null) continueRender(handle); });
  }, [handle]);
  return m;
};

/** экземпляр модели; tint — умножение цвета, snow — белое свечение (снег), оба можно менять каждый кадр */
export const Model: React.FC<{
  m: Record<string, THREE.Group>; n: MName; p?: V3; r?: number; s?: number | V3; tint?: THREE.Color; snow?: number; cast?: boolean;
}> = ({m, n, p = [0, 0, 0], r = 0, s = 1, tint, snow = 0, cast = true}) => {
  const obj = useMemo(() => {
    const c = m[n].clone(true);
    if (tint || snow !== undefined) c.traverse((o) => {
      const mesh = o as THREE.Mesh;
      if (mesh.isMesh) { mesh.material = (mesh.material as THREE.Material).clone(); mesh.castShadow = cast; }
    });
    return c;
  }, [m, n]);
  obj.traverse((o) => {
    const mesh = o as THREE.Mesh;
    if (!mesh.isMesh) return;
    const mat = mesh.material as THREE.MeshStandardMaterial;
    if (tint) mat.color.copy(tint);
    mat.emissive.setRGB(0.92, 0.95, 1); mat.emissiveIntensity = snow * 0.55;
  });
  return <primitive object={obj} position={p} rotation={[0, r, 0]} scale={s} />;
};

// ---------- надписи и значки на текстурах ----------
const texCache = new Map<string, THREE.CanvasTexture>();
export const FONT = '"Inter Tight", sans-serif';
export const canvasTex = (key: string, w: number, h: number, draw: (c: CanvasRenderingContext2D) => void) => {
  let t = texCache.get(key);
  if (!t) {
    const cv = document.createElement('canvas');
    cv.width = w; cv.height = h;
    const c = cv.getContext('2d')!;
    draw(c);
    t = new THREE.CanvasTexture(cv);
    t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 1;
    texCache.set(key, t);
  }
  return t;
};
export const rr = (c: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) => {
  c.beginPath(); c.moveTo(x + r, y); c.arcTo(x + w, y, x + w, y + h, r); c.arcTo(x + w, y + h, x, y + h, r);
  c.arcTo(x, y + h, x, y, r); c.arcTo(x, y, x + w, y, r); c.closePath();
};

export const PAL = {
  ink: '#1C1B22', cream: '#F4F1EA', paper: '#FBF8F2', red: '#E5533D', coral: '#F07A5A', teal: '#2FA58C', blue: '#3D7BE0',
  yellow: '#F6C343', violet: '#7B61FF', grey: '#A9A6AE', green: '#3FA35B', wood: '#6B4A35', woodD: '#3E2A1F', skin: '#F0C7A2',
  skin2: '#C98F65', glass: '#CFE7F2',
};

/** матовый пластик фигурок и предметов */
export const Mat: React.FC<{c: string; r?: number; e?: number; ec?: string; o?: number; map?: THREE.Texture}> = ({c, r = 0.7, e = 0, ec, o, map}) => (
  <meshLambertMaterial color={c} emissive={ec ?? c} emissiveIntensity={e}
    transparent={o !== undefined} opacity={o ?? 1} map={map} />
);

// ---------- мягкая тень-пятно (дешевле карты теней в программном рендере) ----------
const blobTex = () => canvasTex('blob', 128, 128, (c) => {
  const g = c.createRadialGradient(64, 64, 4, 64, 64, 62);
  g.addColorStop(0, 'rgba(0,0,0,0.55)'); g.addColorStop(0.55, 'rgba(0,0,0,0.28)'); g.addColorStop(1, 'rgba(0,0,0,0)');
  c.fillStyle = g; c.fillRect(0, 0, 128, 128);
});
export const Blob: React.FC<{p?: V3; w: number; d?: number; o?: number}> = ({p = [0, 0.003, 0], w, d, o = 1}) => (
  <mesh position={p} rotation={[-Math.PI / 2, 0, 0]} renderOrder={1}>
    <planeGeometry args={[w, d ?? w]} />
    <meshBasicMaterial map={blobTex()} transparent opacity={o} depthWrite={false} />
  </mesh>
);

// ---------- фигурка человека для макета (высота ≈ 0.26 при s=1) ----------
export type PersonProps = {
  p: V3; ry?: number; s?: number; shirt?: string; pants?: string; skin?: string; hair?: string;
  style?: 'short' | 'bun' | 'cap' | 'long' | 'bald' | 'kid';
  armL?: number; armR?: number; // подъём руки вперёд (рад)
  outL?: number; outR?: number; // отвод руки в сторону (рад)
  walk?: number; // фаза шага (0 — стоит)
  sit?: boolean; slump?: number; // 0..1 сутулость/опущенные плечи
  nod?: number; children?: React.ReactNode; // предмет в правой руке
};
export const Person: React.FC<PersonProps> = ({
  p, ry = 0, s = 1, shirt = PAL.blue, pants = '#3B3F55', skin = PAL.skin, hair = '#3A2A20', style = 'short',
  armL = 0, armR = 0, outL = 0, outR = 0, walk = 0, sit = false, slump = 0, nod = 0, children,
}) => {
  const sw = walk ? Math.sin(walk) * 0.5 : 0;
  const legY = sit ? 0.055 : 0.1;
  return (
    <group position={p} rotation={[0, ry, 0]} scale={s}>
      <Blob w={sit ? 0.2 : 0.15} p={[0.02, 0.004, sit ? 0.03 : 0.01]} />
      {/* ноги */}
      {[-1, 1].map((k) => (
        <group key={k} position={[k * 0.018, legY, 0]} rotation={[sit ? -Math.PI / 2 : sw * k, 0, 0]}>
          <mesh castShadow position={[0, -0.048, 0]}><capsuleGeometry args={[0.015, 0.068, 4, 10]} /><Mat c={pants} /></mesh>
          {sit && <mesh castShadow position={[0, -0.1, 0.045]} rotation={[Math.PI / 2, 0, 0]}><capsuleGeometry args={[0.014, 0.05, 4, 10]} /><Mat c={pants} /></mesh>}
        </group>
      ))}
      <group position={[0, legY, 0]} rotation={[slump * 0.25 + Math.abs(sw) * 0.04, 0, 0]}>
        {/* туловище */}
        <mesh castShadow position={[0, 0.055, 0]}><capsuleGeometry args={[0.033, 0.06, 4, 14]} /><Mat c={shirt} /></mesh>
        {style === 'bun' && <mesh castShadow position={[0, 0.085, -0.004]}><capsuleGeometry args={[0.038, 0.02, 4, 14]} /><Mat c="#9C5A7A" /></mesh>}
        {/* руки */}
        {[-1, 1].map((k) => {
          const fwd = (k < 0 ? armL : armR) - (walk ? sw * k * 0.8 : 0);
          const out = (k < 0 ? outL : outR) + 0.08;
          return (
            <group key={k} position={[k * 0.041, 0.095 - slump * 0.012, 0]} rotation={[-fwd, 0, k * out]}>
              <mesh castShadow position={[0, -0.04, 0]}><capsuleGeometry args={[0.011, 0.06, 4, 8]} /><Mat c={shirt} /></mesh>
              <mesh position={[0, -0.083, 0]}><sphereGeometry args={[0.012, 10, 8]} /><Mat c={skin} /></mesh>
              {k > 0 && children && <group position={[0, -0.09, 0.01]} rotation={[fwd, 0, 0]}>{children}</group>}
            </group>
          );
        })}
        {/* голова */}
        <group position={[0, 0.142 - slump * 0.01, slump * 0.01]} rotation={[nod, 0, 0]}>
          <mesh castShadow><sphereGeometry args={[0.034, 18, 14]} /><Mat c={skin} r={0.6} /></mesh>
          {style !== 'bald' && (
            <mesh castShadow position={[0, 0.01, -0.004]} scale={[1.06, style === 'long' ? 1.0 : 0.82, 1.06]}>
              <sphereGeometry args={[0.034, 18, 12, 0, Math.PI * 2, 0, style === 'long' ? Math.PI * 0.75 : Math.PI * 0.5]} />
              <Mat c={hair} />
            </mesh>
          )}
          {style === 'long' && <mesh castShadow position={[0, -0.022, -0.016]}><boxGeometry args={[0.064, 0.05, 0.03]} /><Mat c={hair} /></mesh>}
          {style === 'bun' && <mesh castShadow position={[0, 0.034, -0.016]}><sphereGeometry args={[0.017, 12, 10]} /><Mat c={hair} /></mesh>}
          {style === 'cap' && (
            <group position={[0, 0.016, 0]}>
              <mesh castShadow><sphereGeometry args={[0.036, 16, 10, 0, Math.PI * 2, 0, Math.PI * 0.5]} /><Mat c={PAL.red} /></mesh>
              <mesh castShadow position={[0, 0.001, 0.034]}><boxGeometry args={[0.05, 0.005, 0.03]} /><Mat c={PAL.red} /></mesh>
            </group>
          )}
          {/* глаза */}
          {[-1, 1].map((k) => (
            <mesh key={k} position={[k * 0.012, 0.004, 0.032]}><sphereGeometry args={[0.0042, 8, 6]} /><Mat c={PAL.ink} r={0.3} /></mesh>
          ))}
        </group>
      </group>
    </group>
  );
};

/** шрифты для canvas-текстур и субтитров */
export const useFonts = () => {
  const [ok, setOk] = useState(false);
  const [h] = useState(() => delayRender('fonts'));
  useEffect(() => {
    const list = [
      new FontFace('Inter Tight', `url(${staticFile('fonts/inter-tight-cyrillic-700-normal.woff2')})`, {weight: '700'}),
      new FontFace('Inter Tight', `url(${staticFile('fonts/inter-tight-latin-700-normal.woff2')})`, {weight: '700'}),
      new FontFace('Inter Tight', `url(${staticFile('fonts/inter-tight-cyrillic-600-normal.woff2')})`, {weight: '600'}),
      new FontFace('Inter Tight', `url(${staticFile('fonts/inter-tight-latin-600-normal.woff2')})`, {weight: '600'}),
    ];
    Promise.all(list.map((f) => f.load().then((ff) => document.fonts.add(ff)))).then(() => { setOk(true); continueRender(h); });
  }, [h]);
  return ok;
};
