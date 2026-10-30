// Человечек: манекен Xbot (three.js examples), анимация mixer.setTime(t) + позы костями от кадра.
import React, {useLayoutEffect, useMemo} from 'react';
import * as THREE from 'three';
import {GLTF} from 'three/examples/jsm/loaders/GLTFLoader.js';
import * as SkeletonUtils from 'three/examples/jsm/utils/SkeletonUtils.js';

const ADDITIVE = ['agree', 'headShake', 'sad_pose', 'sneak_pose'];
const prepared = new WeakMap<GLTF, Record<string, THREE.AnimationClip>>();
const clipsOf = (g: GLTF) => {
  if (!prepared.has(g)) {
    const m: Record<string, THREE.AnimationClip> = {};
    for (const c of g.animations) {
      const cl = c.clone();
      if (ADDITIVE.includes(c.name)) THREE.AnimationUtils.makeClipAdditive(cl);
      m[c.name] = cl;
    }
    prepared.set(g, m);
  }
  return prepared.get(g)!;
};

export type Pose = {
  bend?: number;      // наклон корпуса вперёд, рад
  headYaw?: number;   // поворот головы, рад (+ влево от персонажа)
  headPitch?: number; // кивок вниз, рад
  shrug?: number;     // пожатие плечами 0..1
  pointR?: number;    // правая рука вперёд/вверх 0..1
  pointL?: number;
  armsDown?: number;  // руки вдоль тела (из T-подобных поз) 0..1
  sit?: number;       // сидит 0..1
  kneel?: number;     // на коленях 0..1
  pray?: number;      // руки сложены у груди 0..1
  bigHead?: number;   // масштаб головы (малыш)
  raw?: [string, 'x' | 'y' | 'z', number][]; // ручные повороты костей
};

export type PersonProps = {
  g: GLTF;
  clip?: string;          // базовая: idle / walk / run
  t: number;              // время анимации, с
  add?: [string, number, number?][]; // аддитивные: [имя, вес, время]
  color?: string;
  joints?: string;
  scale?: number;
  position?: [number, number, number];
  rotY?: number;
  pose?: Pose;
  opacity?: number;
  wire?: boolean;         // прозрачный контур («нет человека»)
};

const BONES = ['Hips', 'Spine', 'Spine1', 'Spine2', 'Neck', 'Head', 'LeftShoulder', 'RightShoulder', 'LeftArm', 'RightArm',
  'LeftForeArm', 'RightForeArm', 'LeftUpLeg', 'RightUpLeg', 'LeftLeg', 'RightLeg'] as const;

export const Person: React.FC<PersonProps> = ({g, clip = 'idle', t, add = [], color = '#E9E2D6', joints, scale = 0.25, position = [0, 0, 0], rotY = 0, pose = {}, opacity = 1, wire}) => {
  const rig = useMemo(() => {
    const root = SkeletonUtils.clone(g.scene) as THREE.Object3D;
    const mixer = new THREE.AnimationMixer(root);
    const clips = clipsOf(g);
    const actions: Record<string, THREE.AnimationAction> = {};
    for (const [n, c] of Object.entries(clips)) {
      const a = mixer.clipAction(c);
      if (ADDITIVE.includes(n)) a.blendMode = THREE.AdditiveAnimationBlendMode;
      a.play();
      a.setEffectiveWeight(0);
      actions[n] = a;
    }
    const bones: Record<string, THREE.Bone> = {};
    root.traverse((o) => {
      const b = o as THREE.Bone;
      if (b.isBone) bones[b.name.replace('mixamorig', '')] = b;
    });
    const body = new THREE.MeshStandardMaterial({roughness: 0.75, metalness: 0});
    const jnt = new THREE.MeshStandardMaterial({roughness: 0.6, metalness: 0});
    root.traverse((o) => {
      const m = o as THREE.SkinnedMesh;
      if (m.isMesh) m.material = m.name.includes('Joints') ? jnt : body;
    });
    return {root, mixer, actions, bones, body, jnt};
  }, [g]);

  const c = new THREE.Color(color);
  rig.body.color.copy(c);
  rig.jnt.color.copy(joints ? new THREE.Color(joints) : c.clone().multiplyScalar(0.72));
  for (const m of [rig.body, rig.jnt]) {
    m.transparent = opacity < 1 || !!wire;
    m.opacity = wire ? 0.28 : opacity;
    m.wireframe = !!wire;
    m.depthWrite = !wire && opacity >= 1;
  }

  useLayoutEffect(() => {
    const {mixer, actions, bones} = rig;
    for (const a of Object.values(actions)) a.setEffectiveWeight(0);
    actions[clip].setEffectiveWeight(1);
    // одна шкала времени для всех: время каждого клипа задаём явно
    actions[clip].time = t % actions[clip].getClip().duration;
    for (const [n, w, tt] of add) {
      const a = actions[n];
      if (!a) continue;
      a.setEffectiveWeight(w);
      const d = a.getClip().duration;
      a.time = tt === undefined ? d * 0.999 : Math.min(tt, d * 0.999);
    }
    // PropertyMixer пишет в кость только при изменении значения; ручные повороты ниже иначе копились бы
    // из кадра в кадр. Портим «прошлые» буферы — mixer перезапишет все кости заново.
    for (const pm of (mixer as unknown as {_bindings: {buffer: Float64Array; valueSize: number}[]})._bindings) {
      pm.buffer.fill(NaN, pm.valueSize, pm.valueSize * 3);
    }
    mixer.update(0);

    const p = pose;
    const rx = (b: string, a: number) => bones[b] && bones[b].rotateX(a);
    const ry = (b: string, a: number) => bones[b] && bones[b].rotateY(a);
    const rz = (b: string, a: number) => bones[b] && bones[b].rotateZ(a);
    if (p.bend) { rx('Spine', p.bend * 0.45); rx('Spine1', p.bend * 0.35); rx('Neck', p.bend * 0.2); }
    if (p.headYaw) { ry('Neck', p.headYaw * 0.4); ry('Head', p.headYaw * 0.6); }
    if (p.headPitch) rx('Head', p.headPitch);
    // оси калиброваны по листу поз (work/poses_s.jpg): z у плеча — вперёд, z у предплечья — сгиб локтя
    if (p.shrug) {
      rz('RightArm', -0.45 * p.shrug); rz('LeftArm', 0.45 * p.shrug);
      rz('RightForeArm', -1.7 * p.shrug); rz('LeftForeArm', 1.7 * p.shrug);
      rx('Head', -0.08 * p.shrug);
    }
    if (p.pointR) rz('RightArm', -1.3 * p.pointR);
    if (p.pointL) rz('LeftArm', 1.3 * p.pointL);
    if (p.pray) {
      rz('RightArm', -0.5 * p.pray); rz('LeftArm', 0.5 * p.pray);
      ry('RightForeArm', 1.9 * p.pray); ry('LeftForeArm', -1.9 * p.pray);
      rx('Head', 0.3 * p.pray);
    }
    if (p.sit) {
      rx('LeftUpLeg', -1.5 * p.sit); rx('RightUpLeg', -1.5 * p.sit);
      rx('LeftLeg', 1.5 * p.sit); rx('RightLeg', 1.5 * p.sit);
      if (bones.Hips) bones.Hips.position.y -= 42 * p.sit; // см в масштабе арматуры
    }
    if (p.kneel) {
      rx('LeftUpLeg', -0.15 * p.kneel); rx('RightUpLeg', -0.15 * p.kneel);
      rx('LeftLeg', 1.6 * p.kneel); rx('RightLeg', 1.6 * p.kneel);
      if (bones.Hips) bones.Hips.position.y -= 44 * p.kneel;
    }
    for (const [b, ax, a] of p.raw ?? []) (ax === 'x' ? rx : ax === 'y' ? ry : rz)(b, a);
    const hs = p.bigHead ?? 1;
    bones.Head?.scale.setScalar(hs);
  });

  return (
    <group position={position} rotation={[0, rotY, 0]} scale={scale}>
      <primitive object={rig.root} />
    </group>
  );
};
