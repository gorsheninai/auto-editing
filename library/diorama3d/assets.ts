// Загрузка GLTF через delayRender: кадр не снимается, пока модели не загрузились.
import {useEffect, useState} from 'react';
import {continueRender, delayRender, staticFile} from 'remotion';
import * as THREE from 'three';
import {GLTF, GLTFLoader} from 'three/examples/jsm/loaders/GLTFLoader.js';

const loader = new GLTFLoader();
const cache = new Map<string, Promise<GLTF>>();
const done = new Map<string, GLTF>();

export const loadGLTF = (path: string): Promise<GLTF> => {
  if (!cache.has(path)) {
    cache.set(path, loader.loadAsync(staticFile(path)).then((g) => {
      g.scene.traverse((o) => {
        const m = o as THREE.Mesh;
        if (m.isMesh) { m.castShadow = true; m.receiveShadow = true; m.frustumCulled = false; }
      });
      done.set(path, g);
      return g;
    }));
  }
  return cache.get(path)!;
};

/** Возвращает набор загруженных моделей; пока грузятся — держит рендер (delayRender). */
export const useModels = (paths: string[]): Record<string, GLTF> | null => {
  const ready = () => paths.every((p) => done.has(p));
  const [, force] = useState(0);
  const [handle] = useState(() => (ready() ? null : delayRender('models ' + paths.join(','), {timeoutInMilliseconds: 110000})));
  useEffect(() => {
    if (!handle) return;
    Promise.all(paths.map(loadGLTF)).then(() => { force((x) => x + 1); continueRender(handle); });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  if (!ready()) return null;
  return Object.fromEntries(paths.map((p) => [p, done.get(p)!]));
};

export const CITY = (n: string) => `models/city/${n}.gltf`;
export const XBOT = 'models/xbot.glb';
export const ROBOT = 'models/robot.glb';
