import React, {useMemo} from 'react';
import {AbsoluteFill, interpolate, useCurrentFrame, Easing, delayRender, continueRender, staticFile} from 'remotion';
import * as THREE from 'three';
import {Canvas3D, Cam, PencilRocket, Stage} from './three3d';
import {C, clamp, ease} from './kit';

type SP = {from: number; dur: number};
const easeIO = Easing.bezier(0.65, 0, 0.35, 1);

/** textures preloaded outside Suspense so the frame waits for them */
const cache = new Map<string, THREE.Texture>();
const useTex = (src: string) => {
  const [tex, setTex] = React.useState<THREE.Texture | null>(cache.get(src) ?? null);
  React.useEffect(() => {
    if (tex) return;
    const h = delayRender('tex ' + src);
    new THREE.TextureLoader().load(staticFile(src), (t) => {
      t.colorSpace = THREE.SRGBColorSpace; cache.set(src, t); setTex(t); continueRender(h);
    }, undefined, () => continueRender(h));
  }, [src, tex]);
  return tex;
};
const CutOut: React.FC<JSX.IntrinsicElements['group'] & {src: string; h: number}> = ({src, h, ...p}) => {
  const tex = useTex(src);
  if (!tex) return null;
  const img = tex.image as HTMLImageElement;
  const w = (h * img.width) / img.height;
  return (
    <group {...p}>
      <mesh><planeGeometry args={[w, h]} /><meshBasicMaterial map={tex} transparent alphaTest={0.05} toneMapped={false} side={THREE.DoubleSide} /></mesh>
    </group>
  );
};

/** flat sticker card in 3D: white frame + sprite, slightly tilted */
const Card: React.FC<{src: string; h: number; position: [number, number, number]; rotation?: [number, number, number]}> = ({src, h, position, rotation = [0, 0, 0]}) => (
  <group position={position} rotation={rotation}>
    <CutOut src={src} h={h} />
  </group>
);

/** soft contact shadow */
const Shadow: React.FC<{position: [number, number, number]; s?: number; o?: number}> = ({position, s = 1, o = 0.12}) => (
  <mesh position={position} rotation={[-Math.PI / 2, 0, 0]} scale={[s * 1.6, s, 1]}>
    <circleGeometry args={[1, 40]} />
    <meshBasicMaterial color={C.ink} transparent opacity={o} depthWrite={false} />
  </mesh>
);

/** thin grey orbit ellipse */
const Ring: React.FC<{R: number; tilt: number}> = ({R, tilt}) => (
  <mesh rotation={[Math.PI / 2 - 0.32, 0, tilt]}>
    <torusGeometry args={[R, 0.012, 6, 160]} />
    <meshBasicMaterial color={C.grey} />
  </mesh>
);

/**
 * BrandOrbit — «одних брендов покупают даже дорого»
 * Persona in thinking pose stands on a white sheet; brand stickers (bag, sneakers, gift, card, diamond, phone)
 * circle him on two tilted orbits, speeding up. Camera pushes in. The price tag is a 2D layer above (in Scenes).
 */
const ORB = ['img/ib01.png', 'img/ib08.png', 'img/ib06.png', 'img/ib07.png', 'img/ie02.png', 'img/ib00.png'];
const OrbitWorld: React.FC<{dur: number}> = ({dur}) => {
  const fr = useCurrentFrame();
  let ang = 0;
  for (let i = 0; i < fr; i++) ang += 0.03 + i * 0.0012;
  const push = interpolate(fr, [0, dur], [0, 1], {...clamp, easing: easeIO});
  return (
    <>
      <Stage bg={C.cream} fog={[18, 40]} />
      <Cam pos={[Math.sin(push * 0.5 - 0.2) * 2.2, 1.6 - push * 0.4, 21 - push * 3.5]} look={[0, 0.9, 0]} fov={38} />
      <Shadow position={[0, -2.55, 0]} s={0.8} />
      <CutOut src="img/pose00.png" h={4.6} position={[0, -0.25, 0]} />
      <Ring R={4.2} tilt={0.18} />
      <Ring R={5.6} tilt={-0.22} />
      {ORB.map((src, i) => {
        const ring = i % 2;
        const a = (ring ? -ang * 0.85 : ang) + (i / ORB.length) * Math.PI * 2 + ring * 0.6;
        const R = ring ? 5.6 : 4.2;
        const tilt = ring ? -0.22 : 0.18;
        const x0 = Math.cos(a) * R, z0 = Math.sin(a) * R * 0.95;
        // tilt the ellipse like the ring (x-axis tilt ~0.32 rad, then z tilt)
        const y0 = -z0 * Math.sin(0.32) * 0.6;
        const x = x0 * Math.cos(tilt) - y0 * Math.sin(tilt);
        const y = x0 * Math.sin(tilt) + y0 * Math.cos(tilt) + 0.6;
        return <Card key={src} src={src} h={1.25} position={[x, y, z0 * 0.35]} rotation={[0, 0, Math.sin(a * 2) * 0.25]} />;
      })}
    </>
  );
};
export const S3BrandOrbit: React.FC<SP> = ({dur}) => (
  <AbsoluteFill style={{background: C.cream}}>
    <Canvas3D><OrbitWorld dur={dur} /></Canvas3D>
  </AbsoluteFill>
);

/**
 * PencilLaunch — «это умение создавать»
 * Yellow pencil-rocket takes off diagonally across a white sheet, leaving a trail of black/grey pixel cubes.
 */
const Launch: React.FC<{dur: number}> = ({dur}) => {
  const fr = useCurrentFrame();
  const k = interpolate(fr, [0, dur], [0, 1], {...clamp, easing: Easing.bezier(0.5, 0, 0.6, 1)});
  const pos = (t: number): [number, number, number] => [interpolate(t, [0, 1], [-4.2, 3.4]), interpolate(t, [0, 1], [-5.2, 4.4]), 0];
  const cubes = useMemo(() => Array.from({length: 26}).map((_, i) => ({t: i / 26, o: [((i * 37) % 7) / 10 - 0.3, ((i * 53) % 7) / 10 - 0.3], s: 0.16 + (i % 3) * 0.07, c: i % 3 === 0 ? C.grey : C.ink})), []);
  const p = pos(k);
  return (
    <>
      <Stage bg={C.cream} fog={[18, 40]} />
      <Cam pos={[0.8, -0.4 + k * 1.2, 14]} look={[0, k * 1.4 - 0.4, 0]} fov={42} />
      {cubes.filter((c) => c.t < k - 0.04).map((c, i) => {
        const q = pos(c.t);
        const age = k - c.t;
        const s = c.s * interpolate(age, [0, 0.5], [1, 0.4], clamp);
        return (
          <mesh key={i} position={[q[0] - 1.6 + c.o[0], q[1] - 1.9 + c.o[1], -0.4]} rotation={[0, 0, 0]}>
            <boxGeometry args={[s, s, s]} />
            <meshBasicMaterial color={c.c} />
          </mesh>
        );
      })}
      <group position={p} rotation={[0.25, -0.35, 0.86]} scale={0.75}>
        <PencilRocket t={fr} />
      </group>
    </>
  );
};
export const S3Launch: React.FC<SP> = ({dur}) => (
  <AbsoluteFill style={{background: C.cream}}>
    <Canvas3D><Launch dur={dur} /></Canvas3D>
  </AbsoluteFill>
);

export {ease};
