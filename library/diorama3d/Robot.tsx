// Робот RobotExpressive (CC0, three.js examples): анимация через mixer.setTime от кадра.
import React, {useLayoutEffect, useMemo} from 'react';
import * as THREE from 'three';
import {GLTF} from 'three/examples/jsm/loaders/GLTFLoader.js';
import * as SkeletonUtils from 'three/examples/jsm/utils/SkeletonUtils.js';

export const Robot: React.FC<{g: GLTF; clip?: string; t: number; height?: number; position?: [number, number, number]; rotY?: number}> = ({g, clip = 'Walking', t, height = 0.42, position = [0, 0, 0], rotY = 0}) => {
  const rig = useMemo(() => {
    const root = SkeletonUtils.clone(g.scene) as THREE.Object3D;
    const box = new THREE.Box3().setFromObject(g.scene);
    const h = box.max.y - box.min.y;
    const mixer = new THREE.AnimationMixer(root);
    const actions = Object.fromEntries(g.animations.map((c) => [c.name, mixer.clipAction(c)]));
    return {root, mixer, actions, k: height / h, y0: -box.min.y};
  }, [g, height]);
  useLayoutEffect(() => {
    for (const [n, a] of Object.entries(rig.actions)) { a.play(); a.setEffectiveWeight(n === clip ? 1 : 0); }
    const a = rig.actions[clip];
    a.time = t % a.getClip().duration;
    rig.mixer.update(0);
  });
  return (
    <group position={position} rotation={[0, rotY, 0]} scale={rig.k}>
      <primitive object={rig.root} position={[0, rig.y0, 0]} />
    </group>
  );
};
