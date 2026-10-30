import React from 'react';
import {AbsoluteFill} from 'remotion';
import {useModels, XBOT} from './v3d/assets';
import {City, CITY_MODELS} from './v3d/City';
import {Person, Pose} from './v3d/Person';
import {Cam, Canvas3D, Light} from './v3d/stage';

const AX: [string, Pose][] = [
  ['pointR', {raw: [['RightArm', 'z', -1.3]]}], ['pointL', {raw: [['LeftArm', 'z', 1.3]]}],
  ['prayA', {raw: [['RightArm', 'z', -0.5], ['LeftArm', 'z', 0.5], ['RightForeArm', 'z', -1.9], ['LeftForeArm', 'z', 1.9]]}],
  ['prayB', {raw: [['RightArm', 'z', -0.5], ['LeftArm', 'z', 0.5], ['RightForeArm', 'y', 1.9], ['LeftForeArm', 'y', -1.9]]}],
  ['shrugA', {raw: [['RightArm', 'x', 0.4], ['LeftArm', 'x', 0.4], ['RightForeArm', 'z', -1.3], ['LeftForeArm', 'z', 1.3]]}],
  ['shrugB', {raw: [['RightArm', 'x', -0.4], ['LeftArm', 'x', -0.4], ['RightForeArm', 'z', -1.3], ['LeftForeArm', 'z', 1.3]]}],
  ['pitch+', {raw: [['Head', 'x', 0.5]]}], ['pitch-', {raw: [['Head', 'x', -0.5]]}],
  ['shoulderUp', {raw: [['RightShoulder', 'z', 0.3], ['LeftShoulder', 'z', -0.3]]}], ['shoulderUp2', {raw: [['RightShoulder', 'z', -0.3], ['LeftShoulder', 'z', 0.3]]}],
  ['armOutR', {raw: [['RightArm', 'x', 1.0]]}], ['armOutR2', {raw: [['RightArm', 'x', -1.0]]}],
];
const POSES0: [string, Pose, string?][] = [
  ['idle', {}], ['bend', {bend: 0.8}], ['headYaw', {headYaw: 0.9}], ['headPitch', {headPitch: 0.5}], ['shrug', {shrug: 1}],
  ['pointR', {pointR: 1}], ['pray', {pray: 1}], ['sit', {sit: 1}], ['kneel', {kneel: 1}], ['baby', {bigHead: 1.8}],
];
export const Poses: React.FC = () => {
  const m = useModels([XBOT]);
  if (!m) return null;
  return (
    <AbsoluteFill>
      <Canvas3D>
        <Light />
        <Cam pos={[0, 1.8, 16]} look={[0, 1.6, 0]} fov={40} />
        <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow><planeGeometry args={[20, 20]} /><meshStandardMaterial color="#ddd" /></mesh>
        {AX.map(([n, p], k) => (
          <Person key={n} g={m[XBOT]} t={0.5} scale={1} position={[((k % 6) - 2.5) * 1.3, k < 6 ? 1.9 : 0, k < 6 ? -1 : 0]} rotY={0.5} pose={p}
            />
        ))}
      </Canvas3D>
    </AbsoluteFill>
  );
};
export const CityTop: React.FC = () => {
  const m = useModels([...CITY_MODELS]);
  if (!m) return null;
  return (
    <AbsoluteFill>
      <Canvas3D>
        <Light />
        <Cam pos={[0.01, 40, 0]} look={[0, 0, 0]} fov={30} />
        <City m={m} />
      </Canvas3D>
    </AbsoluteFill>
  );
};
