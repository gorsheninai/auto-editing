import React from 'react';
import {AbsoluteFill, interpolate, useCurrentFrame} from 'remotion';
import type {SceneProps} from './registry';
import type {Word} from './types';
import {SANS, SERIF, HAND, clamp} from '../blocks/kit';
import {STY} from '../blocks/style';

/* Стиль «bzik»: белый лист, мелкие объекты, рассыпные слова, пиксельные человечки,
   тонкие рамки, курсор. Всё рисуется кодом (без картинок и логотипов). Только жёсткие склейки. */

const C = () => {
  const c = STY.passport.colors || {};
  return {bg: c.bg || '#FFFFFF', ink: c.ink || '#2D2824', muted: c.muted || '#978F88', acc: c.accent || '#F2C230', soft: c.soft || '#E4DDCF'};
};
const FPS = 30;
/* кадр внутри сегмента, на котором звучит слово с номером i */
const useAt = (p: SceneProps) => (i: number) => Math.round((((p.allWords || p.words)[i]?.s ?? p.t0) - p.t0) * FPS);
/* резкое появление: 3 кадра, с лёгким недолётом */
const snap = (f: number, at: number) => {
  if (f < at) return 0;
  const k = interpolate(f, [at, at + 2, at + 4], [0.86, 1.04, 1], clamp);
  return k;
};

const Sheet: React.FC<{children?: React.ReactNode}> = ({children}) => <AbsoluteFill style={{background: C().bg}}>{children}</AbsoluteFill>;

/* Рассыпное слово: мелкий строчный гротеск в своей точке листа */
const W: React.FC<{at: number; x: number; y: number; text: string; size?: number; serif?: boolean; italic?: boolean; color?: string; rot?: number}> = ({at, x, y, text, size = 46, serif, italic, color, rot = 0}) => {
  const f = useCurrentFrame(); const k = snap(f, at); if (!k) return null;
  return <div style={{position: 'absolute', left: x, top: y, translate: '-50% -50%', rotate: `${rot}deg`, scale: String(k), whiteSpace: 'nowrap',
    fontFamily: serif ? SERIF : SANS, fontStyle: italic ? 'italic' : 'normal', fontWeight: serif ? 700 : 600, fontSize: size, letterSpacing: serif ? 0 : -1, color: color || C().ink, lineHeight: 1}}>{text}</div>;
};

/* ---------- Пиксельные спрайты: строки сетки, «#» — чернила, «o» — акцент ---------- */
const SPR: Record<string, string[]> = {
  think: [
    '...###....', '..#####...', '..#####...', '...###....', '....#.....', '..#####.#.', '.#.###.#..', '#..###....', '...###....', '...#.#....', '..#...#...', '..#...#...',
  ],
  holdTag: [
    '...###.....', '..#####....', '..#####....', '...###.....', '....#......', '..######...', '.#.###..#..', '#..###...#.', '...###.....', '...#.#.....', '..#...#....', '..#...#....',
  ],
  run: [
    '..oooo....', '..####....', '..####....', '...##.....', '...###.##.', '..####....', '.#.##.....', '#..##.....', '...###....', '..#..#....', '.#....#...', '#......#..',
  ],
  cheer: [
    '#..oooo..#', '.#.####.#.', '..######..', '....##....', '....##....', '...####...', '...####...', '....##....', '....##....', '...#..#...', '..#....#..', '..#....#..',
  ],
  stand: [
    '..###..', '.#####.', '.#####.', '..###..', '...#...', '.#####.', '#.###.#', '..###..', '..###..', '..#.#..', '.#...#.', '.#...#.',
  ],
  jump: [
    '#.###.#', '.#####.', '.#####.', '..###..', '...#...', '.#####.', '..###..', '..###..', '..#.#..', '.#...#.', '.......', '.......',
  ],
  heart: ['.##.##.', '#######', '#######', '.#####.', '..###..', '...#...'],
  quest: ['.###.', '#...#', '....#', '...#.', '..#..', '..#..', '.....', '..#..'],
  cup: ['..#..#...', '.#..#....', '..#..#...', '.........', '#######..', '#.....###', '#.....#.#', '#.....###', '.#...#...', '..###....'],
  mirrorMan: [
    '..###..', '.#####.', '.#####.', '..###..', '...#...', '.#####.', '#.###.#', '..###..', '..###..', '..#.#..', '.#...#.', '.#...#.',
  ],
};
const Pix: React.FC<{name: string; x: number; y: number; cell?: number; at?: number; color?: string; flip?: boolean}> = ({name, x, y, cell = 12, at = 0, color, flip}) => {
  const f = useCurrentFrame(); const k = snap(f, at); if (!k) return null;
  const g = SPR[name]; const w = Math.max(...g.map((r) => r.length)); const c = C();
  return <svg width={w * cell} height={g.length * cell} style={{position: 'absolute', left: x - (w * cell) / 2, top: y - (g.length * cell) / 2, scale: `${flip ? -k : k} ${k}`, shapeRendering: 'crispEdges'}}>
    {g.flatMap((row, j) => row.split('').map((ch, i) => ch === '.' ? null :
      <rect key={`${i}-${j}`} x={i * cell} y={j * cell} width={cell} height={cell} fill={ch === 'o' ? c.acc : color || c.ink} />))}
  </svg>;
};

/* Тонкая рамка-фото: белая карточка с линией 3 px, внутри рисунок */
const Frame: React.FC<{x: number; y: number; w: number; h: number; rot?: number; at?: number; dx?: number; children?: React.ReactNode}> = ({x, y, w, h, rot = 0, at = 0, dx = 0, children}) => {
  const f = useCurrentFrame(); const k = snap(f, at); if (!k) return null;
  return <div style={{position: 'absolute', left: x - w / 2 + dx, top: y - h / 2, width: w, height: h, rotate: `${rot}deg`, scale: String(k), border: `3px solid ${C().ink}`, background: '#fff', overflow: 'hidden'}}>
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} style={{position: 'absolute', inset: 0}}>{children}</svg>
  </div>;
};
const ln = () => ({fill: 'none', stroke: C().ink, strokeWidth: 5, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const});

/* Рисунки-линии в рамках (без логотипов) */
const Sneaker: React.FC<{w: number; h: number}> = ({w, h}) => <g transform={`translate(${w / 2 - 210} ${h / 2 - 90})`}>
  <path d="M10 150 L10 120 Q14 96 40 92 L150 60 Q176 40 196 22 L236 18 Q256 40 268 70 Q330 96 400 108 Q418 114 418 140 L418 150 Z" {...ln()} fill="#fff" />
  <path d="M8 150 L420 150 L420 176 L8 176 Z" {...ln()} fill={C().soft} />
  <path d="M196 22 Q206 56 214 84 M160 58 L176 80 M182 48 L198 72 M226 22 L230 46" {...ln()} />
  <path d="M60 128 L380 128" {...ln()} strokeDasharray="10 12" strokeWidth={3} />
</g>;
const Cup: React.FC<{w: number; h: number}> = ({w, h}) => <g transform={`translate(${w / 2 - 95} ${h / 2 - 170})`}>
  <path d="M8 30 L182 30 L174 60 L16 60 Z" {...ln()} fill={C().ink} />
  <path d="M0 18 Q0 4 14 4 L176 4 Q190 4 190 18 L190 30 L0 30 Z" {...ln()} fill={C().ink} />
  <path d="M20 60 L170 60 L150 330 L40 330 Z" {...ln()} fill="#fff" />
  <path d="M30 150 L160 146 L156 220 L36 224 Z" {...ln()} fill={C().soft} strokeWidth={3} />
  <text x={95} y={286} textAnchor="middle" fontFamily={HAND} fontSize={44} fill={C().ink}>аня</text>
</g>;
const Phone: React.FC<{w: number; h: number}> = ({w, h}) => <g transform={`translate(${w / 2 - 110} ${h / 2 - 220})`}>
  <rect x={0} y={0} width={220} height={440} rx={34} {...ln()} fill={C().soft} />
  <rect x={18} y={18} width={104} height={110} rx={26} {...ln()} fill="#fff" />
  <circle cx={48} cy={50} r={18} {...ln()} fill={C().ink} />
  <circle cx={92} cy={50} r={18} {...ln()} fill={C().ink} />
  <circle cx={48} cy={96} r={18} {...ln()} fill={C().ink} />
  <circle cx={94} cy={96} r={7} fill={C().ink} />
</g>;
const Tee: React.FC<{w: number; h: number}> = ({w, h}) => <g transform={`translate(${w / 2 - 120} ${h / 2 - 110})`}>
  <path d="M70 0 Q120 34 170 0 L240 40 L210 96 L184 84 L184 220 L56 220 L56 84 L30 96 L0 40 Z" {...ln()} fill="#fff" />
</g>;
const Medal: React.FC<{w: number; h: number}> = ({w, h}) => <g transform={`translate(${w / 2} ${h / 2})`}>
  <path d="M-46 -110 L-14 -10 M46 -110 L14 -10" {...ln()} />
  <circle cx={0} cy={36} r={56} {...ln()} fill={C().acc} />
  <circle cx={0} cy={36} r={34} {...ln()} strokeWidth={3} />
</g>;
const Portrait: React.FC<{w: number; h: number}> = ({w, h}) => <g transform={`translate(${w / 2} ${h / 2 + 10})`}>
  <path d="M-170 220 Q-160 110 -80 96 L80 96 Q160 110 170 220" {...ln()} fill={C().ink} />
  <ellipse cx={0} cy={-30} rx={92} ry={112} {...ln()} fill="#fff" />
  <path d="M-92 -40 L-118 -32 Q-120 -6 -96 0 M92 -40 L118 -32 Q120 -6 96 0" {...ln()} fill="#fff" />
  <rect x={-78} y={-46} width={64} height={40} rx={4} {...ln()} fill={C().acc} />
  <rect x={14} y={-46} width={64} height={40} rx={4} {...ln()} fill={C().acc} />
  <path d="M-14 -26 L14 -26" {...ln()} />
  <path d="M-38 34 Q0 62 38 34" {...ln()} />
</g>;

/* Курсор-стрелка */
const Cursor: React.FC<{x: number; y: number; press?: boolean}> = ({x, y, press}) => <svg width={70} height={92} style={{position: 'absolute', left: x, top: y, scale: press ? '0.86' : '1', transformOrigin: '0 0'}}>
  <path d="M4 4 L4 74 L22 58 L36 88 L50 82 L36 52 L60 52 Z" fill="#fff" stroke={C().ink} strokeWidth={5} strokeLinejoin="round" />
</svg>;

/* 1. HERO — человечек у кассы, ценник растёт, справа футболка */
export const BzHook: React.FC<SceneProps> = (p) => {
  const f = useCurrentFrame(); const at = useAt(p); const c = C();
  const grow = f >= at(3) ? interpolate(f, [at(3), at(3) + 3], [1, 2.1], clamp) : 1;
  return <Sheet>
    <W at={at(0)} x={210} y={300} text="почему" />
    <W at={at(1)} x={860} y={380} text="люди" />
    <W at={at(2)} x={230} y={1210} text="готовы" />
    <Pix name="quest" x={470} y={560} cell={10} at={0} />
    <Pix name="holdTag" x={430} y={760} cell={14} />
    {/* касса */}
    <svg width={160} height={140} style={{position: 'absolute', left: 250, top: 790}}>
      <path d="M10 60 L150 60 L150 132 L10 132 Z M30 20 L110 20 L110 60 L30 60 Z" fill="#fff" stroke={c.ink} strokeWidth={5} strokeLinejoin="round" />
      <path d="M30 84 L130 84 M30 106 L130 106" stroke={c.ink} strokeWidth={4} strokeDasharray="12 10" />
    </svg>
    {/* ценник */}
    <div style={{position: 'absolute', left: 520, top: 700, transformOrigin: '0 50%', scale: String(grow), rotate: '-8deg', border: `3px solid ${c.ink}`, background: '#fff', padding: '6px 16px 8px 30px',
      fontFamily: SANS, fontWeight: 700, fontSize: 40, letterSpacing: -1, color: c.ink, whiteSpace: 'nowrap', clipPath: 'polygon(14px 0, 100% 0, 100% 100%, 14px 100%, 0 50%)'}}>9 990 ₽</div>
    <W at={at(3)} x={720} y={560} text="переплачивать" size={50} />
    <Frame at={at(5)} x={800} y={1010} w={300} h={300} rot={4}><Tee w={300} h={300} /></Frame>
    <W at={at(5)} x={800} y={1210} text="обычные вещи?" />
  </Sheet>;
};

/* 2/4/6. WORD — предмет в тонкой рамке, бренд и слово мелко; на «не просто» рамка резко сдвигается */
const WordShot: React.FC<{p: SceneProps; brand: number; not: number; noun: number; nounText: string; brandText: string; draw: 'sneaker' | 'cup' | 'phone'; cross?: boolean}> = ({p, brand, not, noun, nounText, brandText, draw, cross}) => {
  const f = useCurrentFrame(); const at = useAt(p); const c = C();
  const moved = f >= at(not);
  const dims = draw === 'sneaker' ? {w: 520, h: 320} : draw === 'cup' ? {w: 320, h: 440} : {w: 320, h: 520};
  const art = draw === 'sneaker' ? <Sneaker {...dims} /> : draw === 'cup' ? <Cup {...dims} /> : <Phone {...dims} />;
  return <Sheet>
    <W at={0} x={540} y={520} text={brandText} size={54} />
    <Frame x={540} y={900} {...dims} rot={moved ? 3 : -4} dx={moved ? (cross ? -150 : 150) : 0}>{art}</Frame>
    {cross ? <Frame at={at(not)} x={800} y={900} w={200} h={260} rot={-3}><path d="M0 0 L200 260 M200 0 L0 260" stroke={c.ink} strokeWidth={3} /></Frame> : null}
    <W at={at(noun)} x={moved && !cross ? 820 : 760} y={moved ? 1240 : 1190} text={nounText} size={42} />
  </Sheet>;
};
export const BzNike: React.FC<SceneProps> = (p) => <WordShot p={p} brand={7} not={9} noun={11} brandText="Nike" nounText="кроссовки" draw="sneaker" />;
export const BzStarbucks: React.FC<SceneProps> = (p) => <WordShot p={p} brand={17} not={18} noun={20} brandText="Starbucks" nounText="кофе" draw="cup" />;
export const BzApple: React.FC<SceneProps> = (p) => <WordShot p={p} brand={25} not={26} noun={28} brandText="Apple" nounText="смартфон" draw="phone" cross />;

/* 3. Ощущение спортсмена — бегун, медаль; на «ощущение» сердце, на «ты спортсмен» медаль вверх */
export const BzAthlete: React.FC<SceneProps> = (p) => {
  const f = useCurrentFrame(); const at = useAt(p); const up = f >= at(15);
  return <Sheet>
    <Pix name={up ? 'cheer' : 'run'} x={420} y={880} cell={16} />
    <Pix name="heart" x={420} y={640} cell={12} at={at(13)} />
    <Frame x={up ? 700 : 720} y={up ? 640 : 900} w={240} h={300} rot={up ? -6 : 5}><Medal w={240} h={300} /></Frame>
    <W at={at(13)} x={240} y={420} text="ощущение" />
    <W at={at(16)} x={700} y={1180} text="спортсмен" />
  </Sheet>;
};

/* 5. TYPE — допечатка с кареткой: «атмосфера + привычк▌», рядом пиксельная чашка */
export const BzType: React.FC<SceneProps> = (p) => {
  const f = useCurrentFrame(); const at = useAt(p); const c = C();
  const a = 'атмосфера', b = ' + привычк';
  const na = Math.floor(interpolate(f, [Math.max(0, at(22) - 4), at(22) + 9], [0, a.length], clamp));
  const nb = Math.floor(interpolate(f, [at(23), at(24) + 8], [0, b.length], clamp));
  const s = a.slice(0, na) + b.slice(0, nb);
  const blink = Math.floor(f / 8) % 2 === 0;
  return <Sheet>
    <Pix name="cup" x={540} y={700} cell={14} />
    <div style={{position: 'absolute', left: 120, right: 120, top: 900, textAlign: 'center', fontFamily: SANS, fontWeight: 600, fontSize: 66, letterSpacing: -2, color: c.ink, whiteSpace: 'nowrap'}}>
      {s}<span style={{display: 'inline-block', width: 6, height: 70, marginLeft: 4, translate: '0 10px', background: blink ? c.ink : 'transparent'}} />
    </div>
  </Sheet>;
};

/* 7. CLICK — кнопка «стиль жизни», человечки вокруг, курсор кликает на «стилю» */
export const BzClick: React.FC<SceneProps> = (p) => {
  const f = useCurrentFrame(); const at = useAt(p); const c = C();
  const clickF = at(33); const pressed = f >= clickF && f < clickF + 4; const on = f >= clickF;
  const cx = interpolate(f, [at(31), clickF - 2], [940, 600], clamp), cy = interpolate(f, [at(31), clickF - 2], [1340, 990], clamp);
  const men = [[230, 700], [850, 700], [180, 1010], [900, 1010], [330, 1260], [760, 1260]];
  return <Sheet>
    {men.map(([x, y], i) => <Pix key={i} name={on && (f - clickF) % 10 < 5 ? 'jump' : 'stand'} x={x} y={y - (on && (f - clickF) % 10 < 5 ? 14 : 0)} cell={10} at={at(30) + i * 3} />)}
    <div style={{position: 'absolute', left: 540, top: 940, translate: '-50% -50%', scale: pressed ? '0.95' : '1', border: `3px solid ${c.ink}`, background: on ? c.ink : '#fff', color: on ? '#fff' : c.ink,
      padding: '18px 38px 22px', fontFamily: SANS, fontWeight: 700, fontSize: 64, letterSpacing: -2, whiteSpace: 'nowrap'}}>стиль жизни</div>
    <W at={at(30)} x={540} y={520} text="принадлежность" size={44} color={c.muted} />
    {f >= at(31) ? <Cursor x={cx} y={cy} press={pressed} /> : null}
  </Sheet>;
};

/* 8. WORD+CALL — портрет-линия в рамке, выноски к подписям */
export const BzGodin: React.FC<SceneProps> = (p) => {
  const f = useCurrentFrame(); const at = useAt(p); const c = C();
  const l1 = interpolate(f, [at(35), at(35) + 4], [0, 1], clamp), l2 = interpolate(f, [at(36), at(36) + 4], [0, 1], clamp);
  return <Sheet>
    <Frame x={430} y={860} w={420} h={520} rot={-2}><Portrait w={420} h={520} /></Frame>
    <svg width={1080} height={1920} style={{position: 'absolute', inset: 0}}>
      <path d={`M640 720 L${640 + 140 * l1} ${720 - 120 * l1}`} stroke={c.ink} strokeWidth={3} />
      <path d={`M640 980 L${640 + 140 * l2} ${980 + 120 * l2}`} stroke={c.ink} strokeWidth={3} />
    </svg>
    <W at={at(35) + 4} x={900} y={570} text="Сет Годин" size={44} />
    <W at={at(36) + 4} x={840} y={1130} text="маркетолог, автор книг" size={34} color={c.muted} />
    <W at={at(37)} x={430} y={1240} text="сформулировал" size={46} />
  </Sheet>;
};

/* 9. ASIDE — цитата мелким курсивом по листу, на «именно так» собирается в кучку */
export const TxtAside: React.FC<SceneProps> = (p) => {
  const f = useCurrentFrame(); const at = useAt(p); const c = C();
  const k = interpolate(f, [at(44), at(44) + 5], [0, 1], clamp);
  const pts: [number, string, number, number, number, number][] = [
    [40, '«такие,', 220, 430, 360, 820], [41, 'как', 820, 560, 560, 820], [42, 'мы,', 300, 1080, 690, 820], [43, 'поступают', 780, 1200, 330, 910], [44, 'именно', 240, 760, 620, 910], [45, 'так»', 860, 900, 810, 910],
  ];
  return <Sheet>
    {pts.map(([i, t, x0, y0, x1, y1]) => <W key={i} at={at(i)} x={x0 + (x1 - x0) * k} y={y0 + (y1 - y0) * k} text={t} serif italic size={58} />)}
    <W at={at(42)} x={540} y={1330} text="(спойлер: это про вас)" serif italic size={36} color={c.muted} />
  </Sheet>;
};

/* 10. CARD — почти пустой белый лист, два слова по центру (CardWord на белом паспорта) */
export const CardWord: React.FC<SceneProps> = () => {
  const c = C();
  return <Sheet><div style={{position: 'absolute', inset: 0, display: 'grid', placeItems: 'center', fontFamily: SANS, fontWeight: 700, fontSize: 96, letterSpacing: -3, color: c.ink}}>сильный маркетинг</div></Sheet>;
};

/* 11. KEY — фраза дугой, «человека» крупно, человечек у зеркала, ремарка в скобках */
export const TxtKey: React.FC<SceneProps> = (p) => {
  const f = useCurrentFrame(); const at = useAt(p); const c = C();
  const arc = 'которым ты хочешь стать'; const shown = [53, 54, 55, 56].filter((i) => f >= at(i)).length;
  const arcText = arc.split(' ').slice(0, shown).join(' ');
  return <Sheet>
    <W at={at(48)} x={540} y={300} text="продаёт" size={44} color={c.muted} />
    <W at={at(49)} x={540} y={400} text="не товар," size={60} />
    <W at={at(52)} x={540} y={600} text="а человека," serif size={128} />
    <svg width={1080} height={700} style={{position: 'absolute', left: 0, top: 640}}>
      <defs><path id="bzarc" d="M140 200 Q540 420 940 200" /></defs>
      <text fontFamily={SANS} fontWeight={700} fontSize={58} letterSpacing={-1} fill={c.ink}><textPath href="#bzarc" startOffset="50%" textAnchor="middle">{arcText}</textPath></text>
    </svg>
    {/* человечек у зеркала */}
    <Pix name="stand" x={420} y={1180} cell={11} at={at(53)} />
    <div style={{position: 'absolute', left: 560, top: 1060, width: 150, height: 230, borderRadius: '50%', border: `3px solid ${c.ink}`, background: '#fff', scale: String(snap(f, at(53))), overflow: 'hidden'}}>
      <div style={{position: 'absolute', left: 75, top: 120}}><Pix name="cheer" x={0} y={0} cell={9} at={at(56)} /></div>
    </div>
    <W at={at(56)} x={540} y={1400} text="(и да, мы тоже продаём вам идею, что вы умнее)" serif italic size={32} color={c.muted} />
  </Sheet>;
};

export const BZIK: Record<string, React.FC<SceneProps>> = {BzHook, BzNike, BzAthlete, BzStarbucks, BzType, BzApple, BzClick, BzGodin, TxtAside, CardWord, TxtKey};
export type {Word};
