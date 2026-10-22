import React, {useMemo} from 'react';
import {AbsoluteFill, Img, interpolate, staticFile, useCurrentFrame} from 'remotion';
import {ThreeCanvas} from '@remotion/three';
import {useThree} from '@react-three/fiber';
import * as THREE from 'three';
import type {SceneProps} from './registry';
import {SANS, clamp} from '../blocks/kit';
import {C, useAt, snap, Sheet, W, SPR, Pix, ln, Cursor} from './bzik';

/* Ролик 12 «Почему одни достигают целей»: стиль bzik — белый лист, рассыпные слова, пиксельный человечек,
   картинки с Диска на весь лист, курсор, допечатка, 3D-комнаты low-poly. Только жёсткие склейки, без наездов камеры. */

Object.assign(SPR, {
  flag: ['#oooo.', '#ooooo', '#oooo.', '#.....', '#.....', '#.....', '#.....', '#.....', '#.....'],
  cal: ['#########', '#ooooooo#', '#########', '#.#.#.#.#', '#########', '#.#.#.#.#', '#########', '#.#.#.#.#', '#########'],
  cal2: ['#########', '#ooooooo#', '#########', '#.#.#.#.#', '#########', '#.#.#o#.#', '#########', '#.#.#.#.#', '#########'],
});

/* 1. HERO — слова рассыпаются, человечек бежит по пунктиру к флажку «цель» и добегает на «целей» */
export const GHook: React.FC<SceneProps> = (p) => {
  const f = useCurrentFrame(); const at = useAt(p); const c = C();
  const t0 = at(3), t1 = at(5);
  const x = interpolate(f, [t0, t1], [210, 800], clamp);
  const moving = f >= t0 && f < t1; const done = f >= t1;
  const name = done ? 'cheer' : moving ? (Math.floor(f / 3) % 2 ? 'run' : 'stand') : 'stand';
  return <Sheet>
    <W at={at(0)} x={240} y={330} text="почему" />
    <W at={at(1)} x={820} y={430} text="одни" />
    <W at={at(2)} x={330} y={560} text="люди" />
    <W at={at(3)} x={720} y={640} text="достигают" size={50} />
    <svg width={1080} height={1920} style={{position: 'absolute', inset: 0}}>
      <path d="M120 1000 L960 1000" stroke={c.ink} strokeWidth={4} strokeDasharray="14 14" />
    </svg>
    <Pix name="flag" x={910} y={920} cell={14} />
    <W at={0} x={910} y={1060} text="цель" size={40} color={c.muted} />
    <Pix name={name} x={x} y={925} cell={12} />
  </Sheet>;
};

/* Лист с картинкой из ChatGPT на весь кадр (белый фон картинки сливается с листом), без наезда */
const PicSheet: React.FC<{src: string; children?: React.ReactNode}> = ({src, children}) => {
  const f = useCurrentFrame(); const k = snap(f, 0);
  return <Sheet>
    <Img src={staticFile(src)} style={{position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', scale: String(k)}} />
    {children}
  </Sheet>;
};

/* 2. WORD — человек стоит на пустой дороге; на «годами» листается пиксельный календарь */
export const GRoad: React.FC<SceneProps> = (p) => {
  const f = useCurrentFrame(); const at = useAt(p);
  const flip = f >= at(8) ? (Math.floor((f - at(8)) / 5) % 2 ? 'cal2' : 'cal') : 'cal';
  return <PicSheet src="media/05_смысловые/pic_1.png">
    <W at={at(8)} x={260} y={330} text="годами" />
    <Pix name={flip} x={820} y={330} cell={12} at={at(8)} />
  </PicSheet>;
};

/* 4. WORD — открытая книга, под «читать» маленькая подпись */
export const GBook: React.FC<SceneProps> = (p) => {
  const at = useAt(p); const c = C();
  return <PicSheet src="media/05_смысловые/pic_2.png">
    <W at={at(18)} x={330} y={1390} text="читать" size={42} color={c.muted} />
    <W at={at(20)} x={760} y={1390} text="одну" size={42} />
  </PicSheet>;
};

/* 6. WORD+ASIDE — форма и кроссовки у кровати; на «вечера» ремарка курсивом */
export const GKit: React.FC<SceneProps> = (p) => {
  const at = useAt(p); const c = C();
  return <PicSheet src="media/05_смысловые/pic_3.png">
    <W at={at(33)} x={540} y={1420} text="(а не утром в панике)" serif italic size={46} color={c.muted} />
  </PicSheet>;
};

/* 5. CLICK — слово «очевидной» в рамке-кнопке; курсор едет на «привычку», клик на «очевидной» */
export const GClick: React.FC<SceneProps> = (p) => {
  const f = useCurrentFrame(); const at = useAt(p); const c = C();
  const clickF = at(26); const pressed = f >= clickF && f < clickF + 4; const on = f >= clickF;
  const cx = interpolate(f, [at(23), clickF - 2], [930, 640], clamp), cy = interpolate(f, [at(23), clickF - 2], [1320, 980], clamp);
  return <Sheet>
    <W at={0} x={150} y={250} text="2." size={44} color={c.muted} />
    <W at={at(24)} x={290} y={700} text="полезную" size={46} color={c.muted} />
    <W at={at(25)} x={780} y={790} text="привычку" size={46} color={c.muted} />
    <div style={{position: 'absolute', left: 540, top: 940, translate: '-50% -50%', scale: String(pressed ? 0.95 : 1), border: `3px solid ${c.ink}`, background: on ? c.ink : '#fff', color: on ? '#fff' : c.ink,
      padding: '20px 44px 26px', fontFamily: SANS, fontWeight: 700, fontSize: 92, letterSpacing: -3, whiteSpace: 'nowrap'}}>очевидной</div>
    {on ? <Pix name="heart" x={870} y={870} cell={12} at={clickF + 4} /> : null}
    {f >= at(23) ? <Cursor x={cx} y={cy} press={pressed} /> : null}
  </Sheet>;
};

/* 7. TYPE — «3. убери препятс▌» печатается кареткой и обрывается; на «телефоне» в углу вырезка смартфона */
export const GType: React.FC<SceneProps> = (p) => {
  const f = useCurrentFrame(); const at = useAt(p); const c = C();
  const full = '3. убери препятс';
  const n = Math.floor(interpolate(f, [0, 8, 11, 22, 25, 37], [0, 3, 3, 9, 9, full.length], clamp));
  const stuck = n >= full.length;
  const blink = stuck ? Math.floor(f / 3) % 2 === 0 : Math.floor(f / 8) % 2 === 0;
  const shake = stuck && f < 52 ? (Math.floor(f / 2) % 2 ? 5 : -5) : 0;
  const k = snap(f, at(41));
  return <Sheet>
    <div style={{position: 'absolute', left: 100, top: 740, fontFamily: SANS, fontWeight: 600, fontSize: 96, letterSpacing: -3, color: c.ink, whiteSpace: 'nowrap'}}>
      {full.slice(0, n)}<span style={{display: 'inline-block', width: 8, height: 88, marginLeft: 6, translate: `${shake}px 12px`, background: blink ? c.ink : 'transparent'}} />
    </div>
    {k ? <Img src={staticFile('media/derived/phone.png')} style={{position: 'absolute', left: 640, top: 1130, width: 300, scale: String(k), mixBlendMode: 'multiply'}} /> : null}
  </Sheet>;
};

/* 8. D3 — low-poly изометрия: две комнаты, телефон переезжает в соседнюю на «другой» */
const Cam: React.FC = () => {
  const {camera} = useThree();
  camera.position.set(9, 8.4, 9); camera.lookAt(0, 0.4, 0); camera.updateProjectionMatrix();
  return null;
};
const Blk: React.FC<{pos: [number, number, number]; size: [number, number, number]; color: string; edge?: string}> = ({pos, size, color, edge}) => {
  const g = useMemo(() => new THREE.BoxGeometry(...size), [size[0], size[1], size[2]]);
  const eg = useMemo(() => new THREE.EdgesGeometry(g), [g]);
  return <group position={pos}>
    <mesh geometry={g}><meshLambertMaterial color={color} flatShading /></mesh>
    {edge ? <lineSegments geometry={eg}><lineBasicMaterial color={edge} /></lineSegments> : null}
  </group>;
};
export const GRooms: React.FC<SceneProps> = (p) => {
  const f = useCurrentFrame(); const at = useAt(p); const c = C();
  const t0 = at(45), t1 = at(46);
  const px = interpolate(f, [t0, t1], [-2.6, 2.6], clamp);
  const hop = Math.sin(interpolate(f, [t0, t1], [0, Math.PI], clamp)) * 1.4;
  const arrived = f >= t1;
  const room = (x: number) => <group position={[x, 0, 0]}>
    <Blk pos={[0, -0.1, 0]} size={[4, 0.2, 4]} color={c.soft} edge={c.ink} />
    <Blk pos={[0, 1.1, -2.05]} size={[4, 2.2, 0.1]} color="#FFFFFF" edge={c.ink} />
    <Blk pos={[x < 0 ? -2.05 : 2.05, 1.1, 0]} size={[0.1, 2.2, 4]} color="#F6F3EC" edge={c.ink} />
  </group>;
  return <Sheet>
    <ThreeCanvas orthographic width={1080} height={1920} gl={{antialias: false, alpha: true}} camera={{position: [9, 8.4, 9], zoom: 105, near: 0.1, far: 100}} style={{position: 'absolute', inset: 0}}>
      <Cam />
      <ambientLight intensity={0.85} />
      <directionalLight position={[4, 9, 6]} intensity={1.1} />
      {room(-2.6)}{room(2.6)}
      {/* стол и телефон в левой комнате */}
      <Blk pos={[-2.6, 0.5, 0.3]} size={[1.2, 0.1, 0.8]} color={c.ink} />
      <Blk pos={[-3.05, 0.25, 0.05]} size={[0.1, 0.5, 0.1]} color={c.ink} />
      <Blk pos={[-2.15, 0.25, 0.55]} size={[0.1, 0.5, 0.1]} color={c.ink} />
      <Blk pos={[px, (arrived ? 0.2 : 0.62) + hop, 0.3]} size={[0.3, 0.06, 0.55]} color="#2D2824" edge="#F2C230" />
      {/* человечек в правой комнате */}
      <Blk pos={[3.2, 0.55, 0.4]} size={[0.5, 0.9, 0.35]} color={c.ink} />
      <Blk pos={[3.2, 1.3, 0.4]} size={[0.42, 0.42, 0.42]} color={c.ink} />
      <Blk pos={[3.2, 0.05, 0.4]} size={[0.5, 0.1, 0.35]} color={c.acc} />
    </ThreeCanvas>
    <W at={at(42)} x={300} y={420} text="оставь" />
    {f >= at(46) ? <W at={at(46)} x={540} y={1330} text="другая комната" size={64} /> : null}
  </Sheet>;
};


/* 9. CARD — чистый белый лист: слова всплывают по одному в разных точках, «воли» зачёркивается тонкой линией */
export const GCard: React.FC<SceneProps> = (p) => {
  const f = useCurrentFrame(); const at = useAt(p); const c = C();
  const w0 = p.row.wi ? p.row.wi[0] : 0;
  const pts: [string, number, number, number, boolean?][] = [['секрет', 300, 520, 54], ['не', 760, 760, 54], ['в', 330, 1000, 54], ['силе', 700, 1180, 80], ['воли', 540, 1420, 128, true]];
  const strike = interpolate(f, [at(w0 + 4) + 10, at(w0 + 4) + 18], [0, 1], clamp);
  return <Sheet>
    {pts.map(([t, x, y, size, last], i) => <W key={i} at={at(w0 + i)} x={x} y={y} text={t} size={size} />)}
    <div style={{position: 'absolute', left: 540 - 190, top: 1420, width: 380 * strike, height: 6, background: c.accent, translate: '0 -3px'}} />
  </Sheet>;
};

export const GOALS: Record<string, React.FC<SceneProps>> = {GHook, GRoad, GBook, GClick, GKit, GType, GRooms, CardWord: GCard};
