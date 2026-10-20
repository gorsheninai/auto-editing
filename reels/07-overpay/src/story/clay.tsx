import React from 'react';
import {AbsoluteFill, Img, interpolate, spring, staticFile, useCurrentFrame} from 'remotion';

/* Пластилиновый набор ролика 07: надутые предметы в SVG, небо, пухлый текст. */
export const P = {
  sky: '#3FA9F5', sky2: '#8FD0FF', green: '#5DBB46', yellow: '#FFD43B', pink: '#FF3FA4',
  orange: '#FF8A3D', cream: '#F6E6B8', white: '#FFFFFF', ink: '#1C1B22', red: '#E8473C',
};
export const SANS = "'InterTight', sans-serif";
export const SERIF = "'NotoDisplay', serif";
export const cl = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;
export const sp = (fr: number, at: number, cfg: {damping?: number; stiffness?: number; mass?: number} = {}) =>
  spring({frame: fr - at, fps: 30, config: {damping: 11, stiffness: 190, mass: 0.7, ...cfg}});
export const img = (p: string) => staticFile(p);

/* мягкая тень «игрушки» */
export const toyShadow = 'drop-shadow(0 18px 22px rgba(20,70,130,0.28)) drop-shadow(0 4px 4px rgba(20,70,130,0.18))';

/* Фон-картинка с медленным наездом */
export const BgImg: React.FC<{src: string; dur: number; zoom?: number; y?: number}> = ({src, dur, zoom = 0.05, y = 0}) => {
  const fr = useCurrentFrame();
  const s = interpolate(fr, [0, dur], [1.02, 1.02 + zoom], cl);
  return <AbsoluteFill style={{overflow: 'hidden'}}>
    <Img src={img(src)} style={{position: 'absolute', left: 540 - (1280 * (1920 + y)) / 3840, top: 0, width: (1280 * (1920 + y)) / 1920, height: 1920 + y, objectFit: 'cover', transform: `scale(${s})`, transformOrigin: '50% 60%'}} />
  </AbsoluteFill>;
};

/* Небо-градиент с пухлыми облаками и звёздочками */
export const Sky: React.FC<{dur: number; stars?: boolean; soft?: boolean}> = ({dur, stars = true, soft}) => {
  const fr = useCurrentFrame();
  const dx = interpolate(fr, [0, dur], [0, -40], cl);
  const clouds: [number, number, number][] = [[-60, 210, 1.1], [760, 120, 0.9], [820, 1240, 1.2], [-120, 1350, 1]];
  return <AbsoluteFill style={{background: soft ? `linear-gradient(180deg, #5BB7F7 0%, #A8DCFF 70%, #CFEBFF 100%)` : `linear-gradient(180deg, ${P.sky} 0%, #6EC0FA 55%, ${P.sky2} 100%)`, overflow: 'hidden'}}>
    {clouds.map(([x, y, k], i) => <Cloud key={i} x={x + dx * (i % 2 ? 1 : 0.6)} y={y} k={k} />)}
    {stars && [[140, 520, P.yellow, 0], [930, 600, P.pink, 1], [180, 1130, P.pink, 2], [900, 960, P.yellow, 3], [520, 300, P.white, 4]].map(([x, y, c, i]) => {
      const b = 1 + 0.12 * Math.sin((fr + (i as number) * 9) / 6);
      return <div key={i as number} style={{position: 'absolute', left: x as number, top: y as number, transform: `scale(${b}) rotate(${(i as number) * 17}deg)`}}><Star size={54} color={c as string} /></div>;
    })}
  </AbsoluteFill>;
};

export const Cloud: React.FC<{x: number; y: number; k?: number}> = ({x, y, k = 1}) => (
  <div style={{position: 'absolute', left: x, top: y, width: 380 * k, height: 170 * k, filter: 'drop-shadow(0 10px 14px rgba(30,110,190,0.25))'}}>
    {[[0, 70, 150, 100], [90, 20, 170, 150], [210, 50, 140, 120], [60, 80, 260, 90]].map(([l, t, w, h], i) => (
      <div key={i} style={{position: 'absolute', left: l * k, top: t * k, width: w * k, height: h * k, borderRadius: 999,
        background: 'radial-gradient(circle at 40% 30%, #fff 0%, #F3F9FF 60%, #DCEEFF 100%)'}} />
    ))}
  </div>
);

/* Зерно поверх кадра */
export const Grain: React.FC = () => {
  const fr = useCurrentFrame();
  return <AbsoluteFill style={{pointerEvents: 'none', opacity: 0.09, mixBlendMode: 'multiply'}}>
    <svg width="1080" height="1920"><filter id="gr"><feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" seed={fr % 7} /><feColorMatrix values="0 0 0 0 0.3  0 0 0 0 0.3  0 0 0 0 0.3  0 0 0 1 0" /></filter><rect width="1080" height="1920" filter="url(#gr)" /></svg>
  </AbsoluteFill>;
};

/* Пухлый текст: белые буквы с объёмом */
export const puffy = (size: number, color = P.white, edge = '#BFE3FF'): React.CSSProperties => ({
  fontFamily: SANS, fontWeight: 700, fontSize: size, letterSpacing: -size * 0.03, lineHeight: 1, color,
  textShadow: `0 ${size * 0.04}px 0 ${edge}, 0 ${size * 0.08}px 0 ${edge}, 0 ${size * 0.16}px ${size * 0.25}px rgba(20,70,130,0.35)`,
});

/* Надутая плашка с текстом */
export const Pill: React.FC<{children: React.ReactNode; size?: number; bg?: string; color?: string; style?: React.CSSProperties}> = ({children, size = 120, bg = P.white, color = P.ink, style}) => (
  <div style={{display: 'inline-block', padding: `${size * 0.22}px ${size * 0.5}px ${size * 0.3}px`, borderRadius: 999,
    background: `radial-gradient(120% 140% at 30% 20%, #fff 0%, ${bg} 45%, ${shade(bg)} 100%)`,
    boxShadow: `inset 0 -${size * 0.1}px ${size * 0.16}px rgba(0,0,0,0.10), inset 0 ${size * 0.06}px ${size * 0.08}px rgba(255,255,255,0.9), 0 ${size * 0.16}px ${size * 0.3}px rgba(20,70,130,0.3)`,
    fontFamily: SANS, fontWeight: 700, fontSize: size, letterSpacing: -size * 0.03, lineHeight: 1, color, whiteSpace: 'nowrap', ...style}}>{children}</div>
);
const shade = (c: string) => ({[P.white]: '#E3EEF8', [P.yellow]: '#F2B91E', [P.pink]: '#D92585', [P.orange]: '#E86A1F', [P.cream]: '#E4CC92'} as Record<string, string>)[c] || c;

/* ---------- предметы ---------- */
export const Star: React.FC<{size?: number; color?: string}> = ({size = 60, color = P.yellow}) => (
  <svg width={size} height={size} viewBox="-50 -50 100 100" style={{overflow: 'visible', filter: 'drop-shadow(0 4px 4px rgba(20,70,130,0.25))'}}>
    <path d={starPath(40, 18)} fill={color} stroke={color} strokeWidth={14} strokeLinejoin="round" />
    <ellipse cx={-10} cy={-14} rx={9} ry={6} fill="#fff" opacity={0.55} />
  </svg>
);
const starPath = (R: number, r: number) => Array.from({length: 10}, (_, i) => {
  const a = -Math.PI / 2 + (i * Math.PI) / 5; const rr = i % 2 ? r : R;
  return `${i ? 'L' : 'M'}${(Math.cos(a) * rr).toFixed(1)},${(Math.sin(a) * rr).toFixed(1)}`;
}).join(' ') + 'Z';

export const Heart: React.FC<{size?: number; color?: string}> = ({size = 80, color = P.pink}) => (
  <svg width={size} height={size} viewBox="0 0 100 100" style={{overflow: 'visible', filter: 'drop-shadow(0 6px 6px rgba(20,70,130,0.25))'}}>
    <defs><radialGradient id={`h${color.slice(1)}`} cx="35%" cy="30%" r="75%"><stop offset="0" stopColor="#fff" stopOpacity="0.85" /><stop offset="0.25" stopColor={color} /><stop offset="1" stopColor={shade(color)} /></radialGradient></defs>
    <path d="M50 88 C20 66 6 50 6 32 C6 16 18 6 31 6 C40 6 46 11 50 18 C54 11 60 6 69 6 C82 6 94 16 94 32 C94 50 80 66 50 88Z" fill={`url(#h${color.slice(1)})`} />
  </svg>
);

/* Надутый оранжевый ценник с белым овалом */
export const PriceTag: React.FC<{w?: number; text?: string}> = ({w = 420, text = '×10'}) => (
  <div style={{position: 'relative', width: w, height: w * 0.6, filter: toyShadow}}>
    <svg width={w} height={w * 0.6} viewBox="0 0 400 240" style={{position: 'absolute', overflow: 'visible'}}>
      <defs>
        <radialGradient id="tagG" cx="38%" cy="25%" r="80%"><stop offset="0" stopColor="#FFE0C2" /><stop offset="0.3" stopColor={P.orange} /><stop offset="1" stopColor="#D9561A" /></radialGradient>
      </defs>
      <path d="M95 30 H350 Q378 30 378 58 V182 Q378 210 350 210 H95 L28 120 Z" fill="url(#tagG)" stroke="url(#tagG)" strokeWidth={36} strokeLinejoin="round" />
      <ellipse cx="236" cy="120" rx="118" ry="70" fill="#FFF8EE" />
      <ellipse cx="210" cy="86" rx="70" ry="16" fill="#fff" opacity="0.8" />
      <circle cx="82" cy="120" r="17" fill="#B9461A" />
      <circle cx="82" cy="117" r="11" fill="#7FC7FA" />
      <ellipse cx="150" cy="52" rx="60" ry="12" fill="#fff" opacity="0.45" />
    </svg>
    <div style={{position: 'absolute', left: w * 0.29, width: w * 0.6, top: 0, height: w * 0.6, display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontFamily: SANS, fontWeight: 700, fontSize: w * 0.26, color: P.orange, letterSpacing: -4, textShadow: '0 3px 0 #FFD2AE'}}>{text}</div>
  </div>
);

/* Пухлый кроссовок с крылышками */
export const Sneaker: React.FC<{w?: number; wings?: number}> = ({w = 420, wings = 1}) => {
  const fr = useCurrentFrame();
  const flap = Math.sin(fr / 2.2) * 14 * wings;
  return <svg width={w} height={w * 0.62} viewBox="0 0 400 250" style={{overflow: 'visible', filter: toyShadow}}>
    <defs>
      <radialGradient id="snU" cx="40%" cy="25%" r="85%"><stop offset="0" stopColor="#fff" /><stop offset="0.6" stopColor="#F4F6FA" /><stop offset="1" stopColor="#CFD8E4" /></radialGradient>
      <linearGradient id="snS" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#FFB27A" /><stop offset="1" stopColor="#E8661F" /></linearGradient>
    </defs>
    {wings > 0 && <g transform={`translate(70 95) rotate(${-20 - flap})`}>
      {[0, 1, 2].map((i) => <ellipse key={i} cx={-40 - i * 8} cy={-10 + i * 22} rx={56 - i * 8} ry={20} fill="#fff" stroke="#DCE8F5" strokeWidth={4} transform={`rotate(${-25 + i * 12})`} />)}
    </g>}
    <path d="M40 200 Q30 120 90 92 Q140 70 170 40 Q200 20 230 50 Q270 100 340 130 Q380 145 380 190 Q380 215 350 215 H60 Q40 215 40 200Z" fill="url(#snU)" />
    <rect x="30" y="196" width="358" height="40" rx="20" fill="url(#snS)" />
    <rect x="44" y="200" width="200" height="8" rx="4" fill="#fff" opacity="0.5" />
    {[0, 1, 2, 3].map((i) => <path key={i} d={`M${170 + i * 26} ${70 + i * 18} q22 -6 36 6`} stroke={P.yellow} strokeWidth={13} strokeLinecap="round" fill="none" />)}
    <path d="M282 112 q30 -40 54 -10 M282 112 q-10 -44 28 -46" stroke={P.yellow} strokeWidth={11} strokeLinecap="round" fill="none" />
    <ellipse cx="130" cy="120" rx="40" ry="12" fill="#fff" opacity="0.8" transform="rotate(-25 130 120)" />
  </svg>;
};

/* Золотая медаль на розовой ленте */
export const Medal: React.FC<{size?: number; ribbon?: boolean}> = ({size = 260, ribbon = true}) => (
  <svg width={size} height={size * 1.35} viewBox="0 0 200 270" style={{overflow: 'visible', filter: toyShadow}}>
    <defs><radialGradient id="mdG" cx="35%" cy="30%" r="80%"><stop offset="0" stopColor="#FFF6C8" /><stop offset="0.35" stopColor={P.yellow} /><stop offset="1" stopColor="#E0A512" /></radialGradient></defs>
    {ribbon && <><path d="M60 0 L100 110 L80 120 L30 6Z" fill={P.pink} /><path d="M140 0 L100 110 L120 120 L170 6Z" fill="#E22D8E" /></>}
    <circle cx="100" cy="180" r="82" fill="url(#mdG)" />
    <circle cx="100" cy="180" r="58" fill="none" stroke="#F2BE25" strokeWidth="8" />
    <g transform="translate(100 182)"><path d={starPath(34, 15)} fill="#FFF0A0" stroke="#FFF0A0" strokeWidth={10} strokeLinejoin="round" /></g>
    <ellipse cx="72" cy="136" rx="24" ry="10" fill="#fff" opacity="0.7" transform="rotate(-30 72 136)" />
  </svg>
);

/* Финишная лента между столбиками; k — доля натяжения 0…1 */
export const FinishTape: React.FC<{w?: number; k: number}> = ({w = 1000, k}) => (
  <svg width={w} height={260} viewBox={`0 0 ${w} 260`} style={{overflow: 'visible', filter: toyShadow}}>
    <defs><pattern id="chk" width="40" height="40" patternUnits="userSpaceOnUse"><rect width="40" height="40" fill="#fff" /><rect width="20" height="20" fill={P.red} /><rect x="20" y="20" width="20" height="20" fill={P.red} /></pattern></defs>
    {[30, w - 70].map((x, i) => <g key={i}><rect x={x} y={40} width={40} height={220} rx={20} fill={i ? '#F2F2F2' : '#fff'} /><circle cx={x + 20} cy={40} r={30} fill={P.yellow} /></g>)}
    <g transform={`translate(${w / 2} 0) scale(${k} 1) translate(${-w / 2} 0)`}>
      <path d={`M70 80 Q${w / 2} ${110 - 20 * k} ${w - 70} 80 L${w - 70} 120 Q${w / 2} ${150 - 20 * k} 70 120Z`} fill="url(#chk)" stroke="#fff" strokeWidth={4} />
    </g>
  </svg>
);

/* Красный стаканчик с кремовым манжетом */
export const Cup: React.FC<{w?: number}> = ({w = 300}) => (
  <svg width={w} height={w * 1.35} viewBox="0 0 200 270" style={{overflow: 'visible', filter: toyShadow}}>
    <defs>
      <linearGradient id="cupR" x1="0" x2="1"><stop offset="0" stopColor="#F05A4F" /><stop offset="0.35" stopColor="#FF7A6E" /><stop offset="1" stopColor="#C8322A" /></linearGradient>
      <linearGradient id="cupS" x1="0" x2="1"><stop offset="0" stopColor="#E9D29A" /><stop offset="0.35" stopColor="#FBEAC0" /><stop offset="1" stopColor="#D4B877" /></linearGradient>
    </defs>
    <path d="M30 50 H170 L152 262 Q150 270 140 270 H60 Q50 270 48 262Z" fill="url(#cupR)" />
    <path d="M38 120 H162 L156 196 H44Z" fill="url(#cupS)" />
    <rect x="16" y="22" width="168" height="38" rx="19" fill="#fff" />
    <rect x="50" y="6" width="100" height="26" rx="13" fill="#F3F3F3" />
    <rect x="60" y="66" width="14" height="44" rx="7" fill="#fff" opacity="0.45" />
  </svg>
);

/* Пухлый смартфон; scr — 0 экран с обновлением, 1 погас */
export const Phone: React.FC<{w?: number; prog: number; off: number}> = ({w = 420, prog, off}) => (
  <div style={{position: 'relative', width: w, height: w * 1.9, borderRadius: w * 0.2, filter: toyShadow,
    background: 'radial-gradient(120% 90% at 30% 15%, #fff 0%, #F2F5FA 50%, #C9D3E0 100%)'}}>
    <div style={{position: 'absolute', inset: w * 0.07, borderRadius: w * 0.14, overflow: 'hidden',
      background: `linear-gradient(180deg, #7CCBFF, ${P.sky})`}}>
      <div style={{position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: w * 0.07}}>
        <div style={{width: w * 0.26, height: w * 0.26, borderRadius: '50%', border: `${w * 0.035}px solid #fff`, borderTopColor: 'transparent', transform: `rotate(${prog * 720}deg)`}} />
        <div style={{fontFamily: SANS, fontWeight: 700, fontSize: w * 0.085, color: '#fff'}}>обновление</div>
        <div style={{width: w * 0.6, height: w * 0.06, borderRadius: 99, background: 'rgba(255,255,255,0.4)'}}>
          <div style={{width: `${prog * 100}%`, height: '100%', borderRadius: 99, background: '#fff'}} />
        </div>
      </div>
      <div style={{position: 'absolute', inset: 0, background: '#2A3346', opacity: off}} />
    </div>
    <div style={{position: 'absolute', left: w * 0.38, top: w * 0.1, width: w * 0.24, height: w * 0.05, borderRadius: 99, background: '#1C1B22', opacity: 0.8}} />
  </div>
);

/* Скруглённое зеркало в кремовой раме с наклейками; children — отражение */
export const Mirror: React.FC<{w?: number; flash: number; children?: React.ReactNode}> = ({w = 440, flash, children}) => {
  const h = w * 1.45; const b = w * 0.09;
  return <div style={{position: 'relative', width: w, height: h, filter: toyShadow}}>
    <div style={{position: 'absolute', inset: 0, borderRadius: `${w / 2}px ${w / 2}px ${w * 0.16}px ${w * 0.16}px`, background: `radial-gradient(120% 90% at 30% 15%, #FFF8E6 0%, ${P.cream} 50%, #DCC184 100%)`, border: `${w * 0.025}px solid #fff`}} />
    <div style={{position: 'absolute', left: b, top: b, right: b, bottom: b, overflow: 'hidden', borderRadius: `${w / 2 - b}px ${w / 2 - b}px ${w * 0.1}px ${w * 0.1}px`,
      background: 'linear-gradient(160deg, #E9F6FF 0%, #BFE3FB 55%, #9ACFF3 100%)'}}>
      {children}
      <div style={{position: 'absolute', left: '-30%', top: '-10%', width: '40%', height: '140%', background: 'rgba(255,255,255,0.35)', transform: 'rotate(25deg)'}} />
      <div style={{position: 'absolute', inset: 0, background: '#fff', opacity: flash}} />
    </div>
    <div style={{position: 'absolute', left: -14, top: h * 0.32, transform: 'rotate(-18deg)'}}><Heart size={74} /></div>
    <div style={{position: 'absolute', right: -16, top: h * 0.1, transform: 'rotate(14deg)'}}><Star size={70} /></div>
    <div style={{position: 'absolute', right: -6, bottom: h * 0.12, transform: 'rotate(10deg)'}}><Heart size={56} color={P.yellow} /></div>
  </div>;
};

/* Круглый значок со смайликом */
export const Smiley: React.FC<{size?: number}> = ({size = 200}) => (
  <svg width={size} height={size} viewBox="0 0 200 200" style={{overflow: 'visible', filter: toyShadow}}>
    <defs><radialGradient id="smG" cx="35%" cy="30%" r="80%"><stop offset="0" stopColor="#FFF4B0" /><stop offset="0.4" stopColor={P.yellow} /><stop offset="1" stopColor="#F2A6C8" /></radialGradient></defs>
    <circle cx="100" cy="100" r="96" fill="#fff" />
    <circle cx="100" cy="100" r="80" fill="url(#smG)" />
    <ellipse cx="72" cy="86" rx="10" ry="15" fill={P.ink} /><ellipse cx="128" cy="86" rx="10" ry="15" fill={P.ink} />
    <circle cx="56" cy="118" r="13" fill={P.pink} opacity="0.7" /><circle cx="144" cy="118" r="13" fill={P.pink} opacity="0.7" />
    <path d="M66 122 Q100 158 134 122" stroke={P.ink} strokeWidth="10" strokeLinecap="round" fill="none" />
  </svg>
);

/* Облако-пузырь для цитаты */
export const Bubble: React.FC<{w: number; h: number; children?: React.ReactNode}> = ({w, h, children}) => (
  <div style={{position: 'relative', width: w, height: h, filter: 'drop-shadow(0 20px 26px rgba(20,70,130,0.28))'}}>
    {[[0.02, 0.22, 0.4, 0.62], [0.2, 0.0, 0.42, 0.6], [0.48, 0.04, 0.42, 0.58], [0.66, 0.2, 0.34, 0.6], [0.08, 0.36, 0.84, 0.6]].map(([l, t, ww, hh], i) => (
      <div key={i} style={{position: 'absolute', left: l * w, top: t * h, width: ww * w, height: hh * h, borderRadius: 999, background: 'radial-gradient(circle at 35% 25%, #fff 0%, #F7FBFF 60%, #E2F0FD 100%)'}} />
    ))}
    {[[0.2, 1.0, 0.09], [0.12, 1.14, 0.055]].map(([l, t, r], i) => <div key={`t${i}`} style={{position: 'absolute', left: l * w, top: t * h, width: r * w, height: r * w, borderRadius: '50%', background: '#F4F9FF'}} />)}
    <div style={{position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center'}}>{children}</div>
  </div>
);

/* Гирлянда: лампочки загораются по очереди начиная с кадра at */
export const Garland: React.FC<{w?: number; at: number}> = ({w = 1080, at}) => {
  const fr = useCurrentFrame(); const n = 9;
  return <svg width={w} height={220} viewBox={`0 0 ${w} 220`} style={{overflow: 'visible'}}>
    <path d={`M-20 30 Q${w / 2} 210 ${w + 20} 30`} stroke="#3C6B2E" strokeWidth={8} fill="none" />
    {Array.from({length: n}, (_, i) => {
      const t = (i + 1) / (n + 1); const x = -20 + t * (w + 40); const y = (1 - t) * (1 - t) * 30 + 2 * (1 - t) * t * 210 + t * t * 30;
      const on = interpolate(fr, [at + i * 1.2, at + i * 1.2 + 4], [0, 1], cl);
      return <g key={i} transform={`translate(${x} ${y + 26})`}>
        <circle r={60 * on} fill={P.yellow} opacity={0.35 * on} />
        <ellipse rx={20} ry={26} fill={on > 0.5 ? '#FFF3A6' : '#C9B46A'} />
        <rect x={-10} y={-40} width={20} height={16} rx={4} fill="#3C6B2E" />
      </g>;
    })}
  </svg>;
};

/* Вспышка-звёздочки вокруг точки */
export const Burst: React.FC<{at: number; n?: number; r?: number; hearts?: boolean}> = ({at, n = 8, r = 260, hearts}) => {
  const fr = useCurrentFrame();
  const k = interpolate(fr, [at, at + 14], [0, 1], cl);
  if (fr < at) return null;
  return <>{Array.from({length: n}, (_, i) => {
    const a = (i / n) * Math.PI * 2 + 0.3; const d = r * (0.4 + 0.6 * k);
    const sc = interpolate(fr, [at, at + 5, at + 22], [0.2, 1.1, 0.85], cl);
    const C = hearts && i % 2 ? <Heart size={70} color={i % 4 === 1 ? P.pink : P.yellow} /> : <Star size={56} color={i % 3 ? P.yellow : P.pink} />;
    return <div key={i} style={{position: 'absolute', left: Math.cos(a) * d - 30, top: Math.sin(a) * d - 30, transform: `scale(${sc}) rotate(${k * 40}deg)`}}>{C}</div>;
  })}</>;
};
