import React from 'react';
import {Img, interpolate, staticFile, useCurrentFrame} from 'remotion';
import type {SceneProps} from './registry';
import {SANS, SERIF, clamp} from '../blocks/kit';
import {C, useAt, snap, Sheet, W, SPR, Pix} from './bzik';

/* Стиль «bzik» с картинками: белый лист, вырезки и фото в тонких рамках, пиксельный герой,
   рассыпные слова под голос, только жёсткие склейки. Картинки — public/cut (вырезано из папки ролика на Диске). */

SPR.coin = ['.###.', '#ooo#', '#o#o#', '#ooo#', '.###.'];
SPR.check = ['....#', '...#.', '#.#..', '.#...'];

const cut = (n: string) => staticFile(`cut/${n}.png`);

/* Вырезка: картинка по центру (x, y), ширина w, резкое появление на кадре at */
const Cut: React.FC<{n: string; x: number; y: number; w: number; at?: number; rot?: number; style?: React.CSSProperties}> = ({n, x, y, w, at = 0, rot = 0, style}) => {
  const f = useCurrentFrame(); const k = snap(f, at); if (!k) return null;
  return <Img src={cut(n)} style={{position: 'absolute', left: x - w / 2, top: y, width: w, translate: '0 -50%', rotate: `${rot}deg`, scale: String(k), ...style}} />;
};
/* Фото в тонкой рамке: белая карточка, линия 3 px, вырезка внутри */
const PhotoFrame: React.FC<{n: string; x: number; y: number; w: number; h: number; pad?: number; at?: number; rot?: number; dx?: number; fit?: 'contain' | 'cover'; pos?: string}> = ({n, x, y, w, h, pad = 22, at = 0, rot = 0, dx = 0, fit = 'contain', pos = '50% 50%'}) => {
  const f = useCurrentFrame(); const k = snap(f, at); if (!k) return null;
  return <div style={{position: 'absolute', left: x - w / 2 + dx, top: y - h / 2, width: w, height: h, rotate: `${rot}deg`, scale: String(k), border: `3px solid ${C().ink}`, background: '#fff', overflow: 'hidden'}}>
    <Img src={cut(n)} style={{position: 'absolute', left: pad, top: pad, width: w - pad * 2 - 6, height: h - pad * 2 - 6, objectFit: fit, objectPosition: pos}} />
  </div>;
};
/* KenBurns: медленный наезд на весь лист внутри сегмента (не камера-удар) */
const KB: React.FC<{dur: number; to?: number; ox?: string; children: React.ReactNode}> = ({dur, to = 1.05, ox = '50% 45%', children}) => {
  const f = useCurrentFrame();
  return <div style={{position: 'absolute', inset: 0, scale: String(interpolate(f, [0, dur], [1, to], clamp)), transformOrigin: ox}}>{children}</div>;
};
/* Слово, которое печатается по буквам с кареткой */
const Typed: React.FC<{at: number; x: number; y: number; text: string; size?: number; cps?: number}> = ({at, x, y, text, size = 46, cps = 1.4}) => {
  const f = useCurrentFrame(); if (f < at) return null;
  const n = Math.min(text.length, Math.floor((f - at) * cps) + 1); const blink = Math.floor(f / 7) % 2 === 0 || n < text.length;
  return <div style={{position: 'absolute', left: x, top: y, translate: '-50% -50%', whiteSpace: 'nowrap', fontFamily: SANS, fontWeight: 600, fontSize: size, letterSpacing: -1, color: C().ink, lineHeight: 1}}>
    {text.slice(0, n)}<span style={{display: 'inline-block', width: 4, height: size * 0.95, marginLeft: 3, translate: '0 6px', background: blink ? C().ink : 'transparent'}} />
  </div>;
};

/* 1. HERO — пиксельный герой чешет затылок с пустым ценником; слова лесенкой; на «переплачивать» из руки летят монеты */
export const B2Hook: React.FC<SceneProps> = (p) => {
  const f = useCurrentFrame(); const at = useAt(p); const t = at(3);
  const coins = [[-170, -230], [-60, -300], [70, -260], [150, -170], [-210, -90], [200, -60]];
  return <Sheet>
    <W at={at(0)} x={230} y={330} text="почему" />
    <W at={at(1)} x={850} y={430} text="люди" />
    <W at={at(2)} x={250} y={1270} text="готовы" />
    <Pix name="quest" x={470} y={520} cell={9} />
    <Cut n="hero_think" x={540} y={900} w={430} />
    {f >= t ? coins.map(([dx, dy], i) => {
      const k = interpolate(f, [t, t + 7], [0, 1], clamp);
      return <Pix key={i} name="coin" x={700 + dx * k} y={1010 + dy * k + 120 * k * k} cell={11} at={t} />;
    }) : null}
    <W at={t} x={800} y={1280} text="переплачивать" size={50} />
  </Sheet>;
};

/* 2. WORD — футболка-вырезка в тонкой рамке, на «обычные» рядом кружка, на «вещи» слово мелко */
const Mug: React.FC = () => {
  const c = C(); const s = {fill: '#fff', stroke: c.ink, strokeWidth: 5, strokeLinejoin: 'round' as const};
  return <svg width={200} height={190} viewBox="0 0 200 190" style={{position: 'absolute', left: 0, top: 0}}>
    <path d="M30 30 L140 30 L134 160 Q132 176 116 176 L54 176 Q38 176 36 160 Z" {...s} />
    <path d="M140 64 Q186 64 182 104 Q178 138 136 136" {...s} fill="none" />
    <ellipse cx={85} cy={30} rx={55} ry={10} {...s} />
  </svg>;
};
export const B2Things: React.FC<SceneProps> = (p) => {
  const f = useCurrentFrame(); const at = useAt(p);
  return <Sheet><KB dur={p.dur}>
    <PhotoFrame n="tee" x={450} y={820} w={480} h={460} rot={-3} pad={30} />
    {f >= at(5) ? <div style={{position: 'absolute', left: 690, top: 900, width: 260, height: 250, border: `3px solid ${C().ink}`, background: '#fff', rotate: '5deg', scale: String(snap(f, at(5)))}}>
      <div style={{position: 'absolute', left: 30, top: 30}}><Mug /></div>
    </div> : null}
    <W at={at(5)} x={300} y={1120} text="обычные" size={44} />
    <W at={at(6)} x={820} y={1220} text="вещи" size={44} />
  </KB></Sheet>;
};

/* 3. WORD — кроссовок в рамке, «nike» мелко, «не просто» всплывает рядом, «кроссовки» под рамкой */
export const B2Nike: React.FC<SceneProps> = (p) => {
  const at = useAt(p);
  return <Sheet><KB dur={p.dur}>
    <W at={0} x={250} y={560} text="nike" size={50} />
    <Cut n="p_sneaker" x={540} y={880} w={820} rot={-1} />
    <W at={at(9)} x={720} y={500} text="не" size={46} />
    <W at={at(10)} x={850} y={550} text="просто" size={46} />
    <W at={at(11)} x={790} y={1180} text="кроссовки" size={42} />
  </KB></Sheet>;
};

/* 4. HERO — кроссовок уходит в угол, по листу бежит герой с медалью; на «ощущение» пиксель-сердце, на «спортсмен» слово печатается */
export const B2Athlete: React.FC<SceneProps> = (p) => {
  const f = useCurrentFrame(); const at = useAt(p);
  const x = interpolate(f, [0, p.dur], [470, 610], clamp); const bob = Math.abs(Math.sin(f / 3.2)) * -14;
  return <Sheet>
    <Cut n="p_sneaker" x={220} y={380} w={260} rot={-6} />
    <Cut n="p_runner" x={x} y={880 + bob} w={560} />
    <Pix name="heart" x={x - 60} y={560} cell={12} at={at(13)} />
    <W at={at(13)} x={300} y={1230} text="ощущение" size={44} />
    <Typed at={at(16)} x={780} y={1230} text="спортсмен" size={46} />
  </Sheet>;
};

/* 5. WORD — стаканчик Starbucks в рамке; «starbucks», «не просто»; на «кофе» горсть зёрен */
const Beans: React.FC<{at: number}> = ({at}) => {
  const f = useCurrentFrame(); if (f < at) return null; const c = C();
  const b = [[0, 0, 20], [46, 18, -30], [18, 50, 60], [70, 64, 10], [-30, 46, -50], [40, 100, 35], [-6, 92, -10]];
  return <svg width={260} height={220} style={{position: 'absolute', left: 720, top: 1000}}>
    {b.map(([x, y, r], i) => { const k = snap(f, at + i); if (!k) return null;
      return <g key={i} transform={`translate(${80 + x} ${50 + y}) rotate(${r}) scale(${k})`}>
        <ellipse rx={22} ry={15} fill={c.ink} /><path d="M-16 0 Q0 -6 16 0" stroke="#fff" strokeWidth={3} fill="none" />
      </g>; })}
  </svg>;
};
export const B2Starbucks: React.FC<SceneProps> = (p) => {
  const at = useAt(p);
  return <Sheet><KB dur={p.dur}>
    <W at={0} x={270} y={500} text="starbucks" size={50} />
    <PhotoFrame n="p_cup" x={480} y={860} w={380} h={540} rot={-4} pad={40} />
    <W at={at(18)} x={820} y={620} text="не" size={46} />
    <W at={at(19)} x={850} y={680} text="просто" size={46} />
    <W at={at(20)} x={840} y={980} text="кофе" size={44} />
    <Beans at={at(20)} />
  </KB></Sheet>;
};

/* 6. ASIDE — стаканчик остаётся, ремарки курсивом; на «привычку» пиксельный календарь с галочками */
export const B2Aside: React.FC<SceneProps> = (p) => {
  const f = useCurrentFrame(); const at = useAt(p); const c = C(); const t = at(24);
  const cells = Array.from({length: 14}, (_, i) => i);
  return <Sheet>
    <PhotoFrame n="p_cup" x={300} y={760} w={260} h={370} rot={-4} pad={28} />
    <W at={at(22)} x={720} y={620} text="(атмосфера)" serif italic size={56} />
    {f >= t ? <div style={{position: 'absolute', left: 560, top: 820, width: 380, scale: String(snap(f, t)), transformOrigin: '0 0'}}>
      <div style={{height: 34, background: c.ink}} />
      <div style={{display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', border: `3px solid ${c.ink}`, borderTop: 0}}>
        {cells.map((i) => <div key={i} style={{height: 54, borderRight: i % 7 < 6 ? `2px solid ${c.soft}` : 0, borderTop: i >= 7 ? `2px solid ${c.soft}` : 0, display: 'grid', placeItems: 'center'}}>
          {f >= t + 2 + i ? <svg width={30} height={24} style={{shapeRendering: 'crispEdges'}}>{SPR.check.flatMap((r, j) => r.split('').map((ch, k) => ch === '#' ? <rect key={`${j}${k}`} x={k * 6} y={j * 6} width={6} height={6} fill={i === 13 ? c.acc : c.ink} /> : null))}</svg> : null}
        </div>)}
      </div>
    </div> : null}
    <W at={t} x={560} y={1260} text="(та самая, ежедневная)" serif italic size={44} color={c.muted} />
  </Sheet>;
};

/* 7. WORD — смартфон в рамке, «apple», «не просто»; на «смартфон» рамка сдвигается, на «а» рядом пустая рамка */
export const B2Apple: React.FC<SceneProps> = (p) => {
  const f = useCurrentFrame(); const at = useAt(p); const moved = f >= at(28);
  return <Sheet><KB dur={p.dur}>
    <W at={0} x={290} y={470} text="apple" size={50} />
    <PhotoFrame n="p_phone" x={540} y={860} w={340} h={560} rot={moved ? -5 : 2} dx={moved ? -150 : 0} pad={40} />
    <W at={at(26)} x={830} y={540} text="не" size={46} />
    <W at={at(27)} x={860} y={600} text="просто" size={46} />
    <W at={at(28)} x={380} y={1200} text="смартфон" size={42} />
    <Cut n="p_empty" x={780} y={900} w={250} at={at(29)} rot={3} />
  </KB></Sheet>;
};

/* 8. CALL — телефон по центру, от него выноски к подписям; по низу бежит пиксельный человечек */
export const B2Call: React.FC<SceneProps> = (p) => {
  const f = useCurrentFrame(); const at = useAt(p); const c = C();
  const calls: [number, string, number, number, number, number][] = [
    [30, 'принадлежность', 660, 690, 820, 480], [32, 'определённому', 420, 860, 210, 1060], [33, 'стиль жизни', 660, 1010, 800, 1210],
  ];
  const runX = interpolate(f, [0, p.dur], [120, 960], clamp);
  return <Sheet>
    <PhotoFrame n="p_phone" x={540} y={850} w={260} h={430} rot={-2} pad={30} />
    {/* рамка-выделение вокруг телефона, как у Callout */}
    {f >= at(30) ? <div style={{position: 'absolute', left: 390, top: 615, width: 300, height: 470, border: `3px dashed ${c.ink}`, scale: String(snap(f, at(30)))}} /> : null}
    <svg width={1080} height={1920} style={{position: 'absolute', inset: 0}}>
      {calls.map(([i, , x0, y0, x1, y1]) => { const k = interpolate(f, [at(i), at(i) + 4], [0, 1], clamp); if (!k) return null;
        return <path key={i} d={`M${x0} ${y0} L${x0 + (x1 - x0) * k} ${y0 + (y1 - y0) * k}`} stroke={c.ink} strokeWidth={3} />; })}
    </svg>
    {calls.map(([i, t, , , x1, y1]) => <W key={i} at={at(i) + 4} x={x1} y={y1 + (y1 < 900 ? -36 : 36)} text={t} size={i === 33 ? 52 : 42} />)}
    <Pix name={Math.floor(f / 4) % 2 ? 'run' : 'stand'} x={runX} y={1360} cell={7} />
  </Sheet>;
};

/* 9. WORD — фото Сета Година в рамке, выноска с именем; на «так:» мигает двоеточие-каретка */
export const B2Godin: React.FC<SceneProps> = (p) => {
  const f = useCurrentFrame(); const at = useAt(p); const c = C();
  const l1 = interpolate(f, [at(35), at(35) + 4], [0, 1], clamp), l2 = interpolate(f, [at(37), at(37) + 4], [0, 1], clamp);
  const colon = f >= at(39) && Math.floor((f - at(39)) / 5) % 2 === 0;
  return <Sheet><KB dur={p.dur} to={1.04}>
    <PhotoFrame n="godin" x={470} y={840} w={430} h={600} rot={-2} pad={20} fit="cover" pos="50% 4%" />
    <svg width={1080} height={1920} style={{position: 'absolute', inset: 0}}>
      <path d={`M690 640 L${690 + 120 * l1} ${640 - 110 * l1}`} stroke={c.ink} strokeWidth={3} />
      <path d={`M690 1030 L${690 + 120 * l2} ${1030 + 110 * l2}`} stroke={c.ink} strokeWidth={3} />
    </svg>
    <W at={at(35) + 3} x={850} y={490} text="сет годин" size={46} />
    <W at={at(37) + 3} x={830} y={1180} text="маркетолог, автор книг" size={32} color={c.muted} />
    {f >= at(39) ? <div style={{position: 'absolute', left: 470, top: 1270, translate: '-50% -50%', fontFamily: SANS, fontWeight: 700, fontSize: 90, color: c.ink, opacity: colon ? 1 : 0}}>:</div> : null}
  </KB></Sheet>;
};

/* 10. TYPE — цитата печатается по буквам с кареткой; на «именно» каретка стоит, на «так» закрывающая кавычка */
export const B2Type: React.FC<SceneProps> = (p) => {
  const f = useCurrentFrame(); const at = useAt(p); const c = C();
  const parts: [number, string][] = [[40, '«такие, '], [41, 'как '], [42, 'мы,\n'], [43, 'поступают '], [44, 'именно '], [45, 'так»']];
  let s = '';
  parts.forEach(([i, t], k) => {
    const a = at(i); const speed = i === 44 ? 2.2 : 1.6;
    const n = Math.max(0, Math.min(t.length, Math.floor((f - a + 1) * speed)));
    if (f >= a) s += t.slice(0, n);
  });
  const blink = Math.floor(f / 7) % 2 === 0;
  const lines = s.split('\n');
  return <Sheet>
    <div style={{position: 'absolute', left: 80, right: 80, top: 760, textAlign: 'center', fontFamily: SANS, fontWeight: 600, fontSize: 82, letterSpacing: -2.5, lineHeight: 1.18, color: c.ink, whiteSpace: 'pre'}}>
      {lines.map((ln, i) => <div key={i}>{ln}{i === lines.length - 1 ? <span style={{display: 'inline-block', width: 6, height: 82, marginLeft: 4, translate: '0 12px', background: blink ? c.ink : 'transparent'}} /> : null}</div>)}
    </div>
    <W at={at(40)} x={540} y={600} text="сет годин:" size={38} color={c.muted} />
  </Sheet>;
};

/* 11. CARD — пустой белый лист, два слова крупно по центру, каждое на своём слове */
export const B2Card: React.FC<SceneProps> = (p) => {
  const f = useCurrentFrame(); const at = useAt(p); const c = C();
  const st = (i: number): React.CSSProperties => ({display: 'block', scale: String(snap(f, at(i)) || 0.0001), opacity: f >= at(i) ? 1 : 0});
  return <Sheet>
    <div style={{position: 'absolute', left: 0, right: 0, top: 960, translate: '0 -50%', textAlign: 'center', fontFamily: SANS, fontWeight: 700, fontSize: 124, letterSpacing: -5, lineHeight: 1.02, color: c.ink}}>
      <span style={st(46)}>сильный</span><span style={st(47)}>маркетинг</span>
    </div>
  </Sheet>;
};

/* 12. KEY — «продаёт не товар» мелко сверху, «товар» зачёркивается, «человека» вырастает на весь лист сжатым гротеском */
export const B2Key: React.FC<SceneProps> = (p) => {
  const f = useCurrentFrame(); const at = useAt(p); const c = C();
  const strike = interpolate(f, [at(50) + 3, at(50) + 8], [0, 1], clamp);
  const g = f >= at(52) ? interpolate(f, [at(52), at(52) + 3, at(52) + 5], [0.5, 1.04, 1], clamp) : 0;
  return <Sheet>
    <W at={at(48)} x={360} y={560} text="продаёт" size={50} />
    <W at={at(49)} x={600} y={560} text="не" size={50} />
    <div style={{position: 'absolute', left: 790, top: 560, translate: '-50% -50%', opacity: f >= at(50) ? 1 : 0, fontFamily: SANS, fontWeight: 600, fontSize: 50, letterSpacing: -1, color: c.ink, lineHeight: 1}}>
      товар<div style={{position: 'absolute', left: -6, top: '52%', height: 5, width: `calc(${strike * 100}% + 12px)`, background: c.ink}} />
    </div>
    {g ? <div style={{position: 'absolute', left: 540, top: 930, translate: '-50% -50%', scale: `${g * 0.78} ${g}`, fontFamily: SANS, fontWeight: 800, fontSize: 290, letterSpacing: -14, color: c.ink, whiteSpace: 'nowrap', lineHeight: 1}}>человека</div> : null}
  </Sheet>;
};

/* 13. HERO + ASIDE — маленький герой тянется к своему большому силуэту с кроссовком, стаканчиком и телефоном; ремарка курсивом */
export const B2Final: React.FC<SceneProps> = (p) => {
  const f = useCurrentFrame(); const at = useAt(p); const c = C();
  const reach = Math.sin(f / 4) * 6;
  return <Sheet>
    {/* силуэт — тот же герой, светлым тоном */}
    <Cut n="hero_front" x={640} y={760} w={380} style={{filter: 'brightness(0) invert(0.9)'}} />
    <Cut n="p_sneaker" x={560} y={1150} w={200} at={at(54)} rot={-4} />
    <Cut n="p_cup" x={850} y={760} w={110} at={at(55)} rot={6} />
    <Cut n="p_phone" x={440} y={700} w={90} at={at(55) + 2} rot={-8} />
    <Cut n="hero_q" x={300 + reach} y={1130} w={150} />
    <Pix name="heart" x={380} y={970} cell={8} at={at(55)} />
    <W at={at(56)} x={540} y={1360} text="(и да, мы тоже это сейчас сделали)" serif italic size={38} color={c.muted} />
  </Sheet>;
};

export const BZIK2: Record<string, React.FC<SceneProps>> = {B2Hook, B2Things, B2Nike, B2Athlete, B2Starbucks, B2Aside, B2Apple, B2Call, B2Godin, B2Type, B2Card, B2Key, B2Final};
