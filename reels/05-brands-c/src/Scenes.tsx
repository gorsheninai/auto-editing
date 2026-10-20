import React from 'react';
import {AbsoluteFill, Img, interpolate, useCurrentFrame} from 'remotion';
import {C, Grain, Plate, S, SANS, Sticker, Strike, Word, clamp, ease, pop, serifIt, wf} from './kit';

// 05-brands-c: «интернет-коллаж» на белом листе, все сцены — режим C, без спикера и без 3D.
type P = {from: number; dur: number};
const T = (from: number) => (w: string, o = 0) => wf(w, o) - from;

/** white sheet, optional background picture (cover) */
const Sheet: React.FC<{children: React.ReactNode; bg?: string; zoom?: [number, number]; dur?: number}> = ({children, bg, zoom = [1, 1.03], dur = 60}) => {
  const fr = useCurrentFrame();
  return (
    <AbsoluteFill style={{background: '#fff', overflow: 'hidden'}}>
      {bg && <Img src={S(bg)} style={{position: 'absolute', width: '100%', height: '100%', objectFit: 'cover', scale: String(interpolate(fr, [0, dur], zoom, clamp))}} />}
      {children}
      <Grain o={0.025} />
    </AbsoluteFill>
  );
};

/** pose / prop image anchored by its bottom-centre, springs up */
const Stand: React.FC<{src: string; at: number; x: number; bottom: number; h: number; out?: number; flip?: boolean; dx?: [number, number, number, number]}> = ({src, at, x, bottom, h, out, flip, dx}) => {
  const fr = useCurrentFrame();
  if (fr < at) return null;
  const s = pop(fr, at);
  const o = out !== undefined ? interpolate(fr, [out, out + 4], [1, 0], clamp) : 1;
  const mx = dx ? interpolate(fr, [dx[0], dx[1]], [dx[2], dx[3]], clamp) : 0;
  return (
    <Img src={S(src)} style={{position: 'absolute', height: h, left: x + mx, bottom: 1920 - bottom, translate: '-50% 0', opacity: o,
      transformOrigin: '50% 100%', scale: `${flip ? -1 : 1} ${interpolate(s, [0, 1], [0.6, 1])}`, rotate: `${Math.sin((fr - at) / 16) * 0.8}deg`}} />
  );
};

/** black arrow cursor gliding through [frame, x, y] keys, squash on click */
const Cursor: React.FC<{path: [number, number, number][]; clicks?: number[]; w?: number}> = ({path, clicks = [], w = 70}) => {
  const fr = useCurrentFrame();
  if (fr < path[0][0]) return null;
  let x = path[0][1], y = path[0][2];
  for (let i = 0; i < path.length - 1; i++) {
    const [a, x0, y0] = path[i];
    const [b, x1, y1] = path[i + 1];
    if (fr >= a) {
      const k = interpolate(fr, [a, b], [0, 1], {...clamp, easing: ease});
      x = x0 + (x1 - x0) * k; y = y0 + (y1 - y0) * k;
    }
  }
  const sq = clicks.some((c) => fr >= c && fr < c + 4) ? 0.8 : 1;
  return (
    <svg width={w} height={w * 1.4} viewBox="0 0 20 28" style={{position: 'absolute', left: x, top: y, scale: String(sq), transformOrigin: '0 0', overflow: 'visible'}}>
      <path d="M1 1 L1 22 L6.5 17 L10.5 26 L14 24.5 L10 15.8 L17.5 15.5 Z" fill="#111" stroke="#fff" strokeWidth={1.4} strokeLinejoin="round" />
    </svg>
  );
};

/** old-Windows grey button */
const WinBtn: React.FC<{x: number; y: number; w: number; h: number; label: string; size?: number; at?: number; off?: boolean; yellow?: boolean; pressed?: boolean}> = ({x, y, w, h, label, size = 48, at = 0, off, yellow, pressed}) => {
  const fr = useCurrentFrame();
  if (fr < at) return null;
  return (
    <div style={{position: 'absolute', left: x, top: y, width: w, height: h, scale: String(pop(fr, at) * (pressed ? 0.94 : 1)),
      background: yellow ? C.yellow : '#E4E4E4', border: `3px solid ${C.ink}`, borderRadius: 6,
      boxShadow: pressed ? `inset 4px 4px 0 rgba(0,0,0,.25)` : `inset -4px -4px 0 rgba(0,0,0,.18), inset 4px 4px 0 #fff`,
      display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: SANS, fontWeight: 600, fontSize: size, letterSpacing: -1,
      color: off ? '#A9A9A9' : C.ink}}>{label}</div>
  );
};

/** 8-bit pixel art from a string map */
const Pix: React.FC<{map: string[]; px: number; x: number; y: number; colors: Record<string, string>; rot?: number; scale?: number}> = ({map, px, x, y, colors, rot = 0, scale = 1}) => (
  <svg width={map[0].length * px} height={map.length * px} style={{position: 'absolute', left: x, top: y, rotate: `${rot}deg`, scale: String(scale), overflow: 'visible'}} shapeRendering="crispEdges">
    {map.flatMap((row, j) => row.split('').map((c, i) => (colors[c] ? <rect key={`${i}-${j}`} x={i * px} y={j * px} width={px} height={px} fill={colors[c]} /> : null)))}
  </svg>
);
const HEART = [
  '.KK...KK.',
  'KRRK.KRRK',
  'KRWRKRRRK',
  'KRRRRRRRK',
  '.KRRRRRK.',
  '..KRRRK..',
  '...KRK...',
  '....K....',
];
const WEED = [
  '...KKKK...',
  '.KK.G..KK.',
  'K..GKG..GK',
  'KG.K..K.GK',
  'K.K.GG.K.K',
  'KG.K..K.GK',
  'K..GKG..GK',
  '.KK..G.KK.',
  '...KKKK...',
];
const pixC = {K: C.ink, R: '#E5484D', W: '#fff', G: C.grey};

/** price tag with a word written along it */
const Tag: React.FC<{x: number; y: number; w: number; text: string; rot: number; size?: number}> = ({x, y, w, text, rot, size = 56}) => (
  <div style={{position: 'absolute', left: x, top: y, width: w, rotate: `${rot}deg`, transformOrigin: '20% 4%'}}>
    <Img src={S('img/pa00.png')} style={{width: w}} />
    <div style={{position: 'absolute', left: 0, right: 0, top: '56%', textAlign: 'center', rotate: '27deg', fontFamily: SANS, fontWeight: 700, fontSize: size, letterSpacing: -1.5, color: C.ink}}>{text}</div>
  </div>
);

// ============ 1–2: two shop windows ============
const QUEUE = ['ppl04', 'ppl05', 'ppl09', 'ppl13', 'ppl06'];
const Shops: React.FC<{from: number; intro: boolean; shrug?: number}> = ({from, intro, shrug}) => {
  const fr = useCurrentFrame();
  const t = T(from);
  const a = (k: number) => (intro ? k : -99);
  const br = intro ? t('брендов') : -99;
  const buy = intro ? t('покупают') : -99;
  return (
    <>
      <Word at={a(0)} x={70} y={150} size={44} color={C.grey}>знаешь,</Word>
      <Word at={intro ? t('почему') : -99} x={600} y={150} size={72}>почему?</Word>
      {/* left: discount window, right: expensive window */}
      <Sticker src="img/pb07.png" at={br + 2} x={270} y={330} w={400} rot={-3} sway={0.6} style={{filter: 'saturate(0.6)'}} />
      <Sticker src="img/pa02.png" at={br} x={810} y={320} w={420} rot={2} sway={0.6} />
      <Word at={br + 3} x={200} y={790} size={36} color={C.grey}>одни</Word>
      <Word at={br + 5} x={740} y={790} size={36} color={C.grey}>другие</Word>
      {shrug !== undefined && fr >= shrug
        ? <Stand src="img/pose06.png" at={shrug} x={540} bottom={1470} h={620} />
        : <Stand src="img/pose00.png" at={a(2)} x={540} bottom={1470} h={640} />}
      {QUEUE.map((p, i) => (
        <Stand key={p} src={`img/${p}.png`} at={buy + i * 2} x={1040 - i * 72} bottom={1440 - (i % 2) * 14} h={330} />
      ))}
    </>
  );
};

// 1 — «Знаешь, почему у одних брендов покупают»
export const SHook: React.FC<P> = ({from, dur}) => (
  <Sheet bg="img/bg1.jpg" dur={dur}>
    <Shops from={from} intro />
  </Sheet>
);

// 2 — «даже дорого, а у других только по скидке?»
export const SPrice: React.FC<P> = ({from, dur}) => {
  const fr = useCurrentFrame();
  const t = T(from);
  const exp = t('дорого');
  const oth = t('других');
  const sale = t('скидке');
  const swing = fr >= exp ? Math.sin((fr - exp) / 4) * 14 * Math.exp(-(fr - exp) / 14) : 0;
  const tagY = interpolate(pop(fr, exp), [0, 1], [-420, 230]);
  const roll = interpolate(fr, [oth, oth + 34], [-110, 330], clamp);
  return (
    <Sheet bg="img/bg1.jpg" zoom={[1.03, 1.05]} dur={dur}>
      <Shops from={from} intro={false} shrug={oth} />
      {fr >= exp && <Tag x={830} y={tagY} w={210} text="дорого" rot={-10 + swing} size={40} />}
      {fr >= sale && (
        <div style={{position: 'absolute', left: 120, top: 250, width: 280, rotate: `${-14 + Math.sin(fr / 5)}deg`, scale: String(interpolate(pop(fr, sale), [0, 1], [2.2, 1]))}}>
          <Img src={S('img/pa01.png')} style={{width: 280}} />
          <div style={{position: 'absolute', left: 0, right: 0, top: 108, textAlign: 'center', fontFamily: SANS, fontWeight: 700, fontSize: 64, letterSpacing: -3, color: C.ink}}>−70%</div>
        </div>
      )}
      {fr >= oth && <Pix map={WEED} px={9} x={roll} y={1080} colors={pixC} rot={(fr - oth) * 11} />}
      <Word at={sale + 6} x={120} y={1180} size={36} color={C.grey} it>пусто</Word>
      <Cursor path={[[0, 880, 1240], [exp, 900, 700], [oth, 900, 700], [sale - 3, 330, 690]]} clicks={[exp, sale]} />
    </Sheet>
  );
};

// 3 — «Дело не в цене.»
export const SNotPrice: React.FC<P> = ({from, dur}) => {
  const fr = useCurrentFrame();
  const t = T(from);
  const no = t('не', 0);
  const price = t('цене');
  const rip = interpolate(fr, [3, 14], [0, 1], {...clamp, easing: ease});
  return (
    <Sheet bg="img/bg3.jpg" dur={dur}>
      {/* hand rips the tag off and takes it away */}
      <div style={{position: 'absolute', left: 520 + rip * 160, top: 120 - rip * 620, width: 560, rotate: `${-6 - rip * 12}deg`}}>
        <Img src={S('img/hand01.png')} style={{width: 560}} />
      </div>
      <WinBtn x={260} y={640} w={560} h={190} label="цена" size={110} />
      <Plate at={no} x={760} y={880} size={52} rot={-4}>не то</Plate>
      <Strike a={price} x1={250} y1={735} x2={830} y2={735} w={12} len={5} />
      <Stand src="img/pose01.png" at={0} x={300} bottom={1480} h={560} />
      <Cursor path={[[0, 900, 1300], [no - 1, 640, 760]]} clicks={[no]} />
    </Sheet>
  );
};

// 4 — «Люди покупают не сам продукт, а эмоции,»
export const SBox: React.FC<P> = ({from, dur}) => {
  const fr = useCurrentFrame();
  const t = T(from);
  const prod = t('продукт');
  const emo = t('эмоции');
  const fly = interpolate(fr, [prod, prod + 12], [0, 1], {...clamp, easing: ease});
  const hk = pop(fr, emo);
  return (
    <Sheet bg="img/bg3.jpg" dur={dur}>
      <Word at={0} x={80} y={170} size={44} color={C.grey}>люди покупают</Word>
      {/* product sticker leaves the frame */}
      <div style={{position: 'absolute', left: 560 - fly * 900, top: 300 - fly * 260, width: 330, rotate: `${6 - fly * 70}deg`, scale: String(pop(fr, 2))}}>
        <Img src={S('img/pb07.png')} style={{width: 330}} />
      </div>
      <Word at={t('сам')} x={150} y={640} size={52}>продукт</Word>
      <Strike a={prod + 2} x1={140} y1={680} x2={380} y2={680} w={7} />
      <Stand src="img/pose02.png" at={0} x={540} bottom={1450} h={600} />
      {fr >= emo && (
        <>
          <Pix map={HEART} px={22} x={640} y={interpolate(hk, [0, 1], [1000, 520])} colors={pixC} scale={interpolate(hk, [0, 1], [0.4, 1])} rot={Math.sin(fr / 6) * 4} />
          <Plate at={emo + 4} x={740} y={760} size={50} rot={3}>эмоции</Plate>
        </>
      )}
    </Sheet>
  );
};

// 5 — moushn MCycle-BW: «статус и ощущение, которое он им даёт.»
export const MCycleBW: React.FC<P> = ({from, dur}) => {
  const fr = useCurrentFrame();
  const t = T(from);
  const cx = 540, cy = 880, R = 330;
  const angs = [-90, 30, 150].map((a) => (a * Math.PI) / 180);
  const pos = angs.map((a) => [cx + Math.cos(a) * R, cy + Math.sin(a) * R]);
  const at = [-10, 3, t('ощущение')];
  const give = t('даёт');
  const arcEnd = [at[1] + 4, at[2], give];
  const arc = (i: number) => {
    const [x1, y1] = pos[i], [x2, y2] = pos[(i + 1) % 3];
    return `M ${x1} ${y1} A ${R} ${R} 0 0 1 ${x2} ${y2}`;
  };
  const L = (R * 2 * Math.PI) / 3;
  const orbit = fr > give + 6 ? ((fr - give - 6) / 28) * Math.PI * 2 - Math.PI / 2 : -Math.PI / 2;
  const node = (i: number, inner: React.ReactNode, label: string, ly: number) => {
    const [x, y] = pos[i];
    const r = 112;
    if (fr < at[i]) return <div key={i} style={{position: 'absolute', left: x - r, top: y - r, width: r * 2, height: r * 2, borderRadius: '50%', border: `3px dashed ${C.grey}`}} />;
    return (
      <React.Fragment key={i}>
        <div style={{position: 'absolute', left: x - r, top: y - r, width: r * 2, height: r * 2, borderRadius: '50%', background: '#fff', border: `5px solid ${C.ink}`,
          scale: String(i === 0 ? 1 : pop(fr, at[i])), display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden'}}>{inner}</div>
        <div style={{position: 'absolute', left: x - 200, width: 400, top: y + ly, textAlign: 'center', fontFamily: SANS, fontWeight: 700, fontSize: 50, letterSpacing: -1.5, color: C.ink,
          opacity: i === 0 ? 1 : interpolate(fr, [at[i] + 2, at[i] + 7], [0, 1], clamp)}}>{label}</div>
      </React.Fragment>
    );
  };
  return (
    <Sheet>
      <AbsoluteFill style={{backgroundImage: `radial-gradient(#DADADA 2px, transparent 2.4px)`, backgroundSize: '34px 34px'}} />
      <div style={{position: 'absolute', top: 130, width: '100%', textAlign: 'center'}}>
        <div style={{...serifIt, fontSize: 92, color: C.ink, lineHeight: 1}}>за что</div>
        <div style={{fontFamily: SANS, fontWeight: 700, fontSize: 80, letterSpacing: -2.5, color: C.ink, lineHeight: 1}}>на самом деле платят</div>
      </div>
      <svg width={1080} height={1920} style={{position: 'absolute', left: 0, top: 0, overflow: 'visible'}}>
        <circle cx={cx} cy={cy} r={R} stroke={C.grey} strokeWidth={4} fill="none" strokeDasharray="3 16" strokeLinecap="round" />
        {[0, 1, 2].map((i) => {
          const a0 = Math.max(0, at[i] + 2);
          const p = interpolate(fr, [a0, Math.max(a0 + 1, arcEnd[i] - 1)], [0, 1], {...clamp, easing: ease});
          return <path key={i} d={arc(i)} stroke={C.ink} strokeWidth={6} fill="none" strokeLinecap="round" strokeDasharray={L} strokeDashoffset={L * (1 - p)} />;
        })}
      </svg>
      {/* centre: what you hold is just a box */}
      <div style={{position: 'absolute', left: cx - 150, top: cy - 150, width: 300, height: 300, borderRadius: '50%', background: C.blue, overflow: 'hidden', border: `3px solid ${C.ink}`}}>
        <Img src={S('img/pose02.png')} style={{position: 'absolute', width: 300, left: 0, top: 10}} />
      </div>
      {node(0, <Pix map={HEART} px={16} x={40} y={46} colors={pixC} />, 'эмоции', -200)}
      {node(1, <Img src={S('img/pa01.png')} style={{width: 170}} />, 'статус', 124)}
      {node(2, <Img src={S('img/orb.png')} style={{width: 190, opacity: 0.6 + Math.sin(fr / 4) * 0.3, filter: `blur(${2 + Math.sin(fr / 5) * 2}px)`}} />, 'ощущение', 124)}
      {fr > give + 6 && (
        <div style={{position: 'absolute', left: cx + Math.cos(orbit) * R - 15, top: cy + Math.sin(orbit) * R - 15, width: 30, height: 30, background: C.yellow, border: `3px solid ${C.ink}`, borderRadius: 4}} />
      )}
      <Plate at={give} x={540} y={1340} size={46} rot={-2}>он им даёт</Plate>
    </Sheet>
  );
};

// 6 — «Apple продаёт не телефоны, а образ жизни.»
export const SLife: React.FC<P> = ({from, dur}) => {
  const fr = useCurrentFrame();
  const t = T(from);
  const ph = t('телефоны');
  const life = t('образ');
  const off = t('а', 2);
  const away = interpolate(fr, [off - 1, off + 8], [0, 1], {...clamp, easing: ease});
  const dark = interpolate(fr, [ph, ph + 4], [0, 1], clamp);
  return (
    <Sheet bg="img/bg4.jpg" dur={dur}>
      <Word at={0} x={80} y={150} size={60}>Apple</Word>
      <Word at={t('продаёт')} x={300} y={162} size={44} color={C.grey}>продаёт</Word>
      <Word at={t('не', 2)} x={600} y={162} size={44} color={C.grey} it>не</Word>
      <Sticker src="img/pb03.png" at={2} x={900} y={110} w={150} rot={12} />
      {/* framed phone, dragged off by the cursor */}
      <div style={{position: 'absolute', left: 280 - away * 760, top: 300 + away * 120, width: 520, rotate: `${-4 - away * 20}deg`, scale: String(pop(fr, 0))}}>
        <Img src={S('img/pb01.png')} style={{width: 520}} />
        <div style={{position: 'absolute', left: 92, top: 96, width: 336, height: 520, borderRadius: 36, background: '#000', opacity: dark * 0.5}} />
        {fr >= ph && <div style={{position: 'absolute', left: 0, right: 0, top: 300, textAlign: 'center', fontFamily: SANS, fontWeight: 600, fontSize: 64, letterSpacing: -2, color: '#fff'}}>телефоны</div>}
        <svg width={520} height={714} style={{position: 'absolute', left: 0, top: 0}}>
          <line x1={60} y1={80} x2={60 + 400 * interpolate(fr, [ph + 2, ph + 8], [0, 1], clamp)} y2={80 + 560 * interpolate(fr, [ph + 2, ph + 8], [0, 1], clamp)} stroke={C.ink} strokeWidth={14} strokeLinecap="round" />
        </svg>
      </div>
      <Cursor path={[[0, 900, 1300], [ph, 760, 640], [off - 1, 700, 650], [off + 8, -60, 760]]} clicks={[off - 2]} />
      {/* lifestyle moodboard under it */}
      <Sticker src="img/pb02.png" at={life} x={560} y={330} w={720} rot={3} sway={0.8} />
      <Stand src="img/pose03.png" at={life + 2} x={780} bottom={1460} h={560} dx={[life + 2, life + 60, 120, -60]} />
      {fr >= life + 6 && (
        <div style={{position: 'absolute', left: 90, top: 1030, scale: String(pop(fr, life + 6)), rotate: '-6deg'}}>
          <Img src={S('img/pa01.png')} style={{width: 110, position: 'absolute', left: -95, top: -70}} />
          <div style={{background: C.ink, color: '#fff', fontFamily: SANS, fontWeight: 600, fontSize: 56, letterSpacing: -1.5, padding: '6px 22px 12px', borderRadius: 6}}>образ жизни</div>
        </div>
      )}
    </Sheet>
  );
};

// 7 — moushn: kнопки «купи» множатся и гаснут: «Поэтому хороший маркетинг это не умение продавать.»
export const MSell: React.FC<P> = ({from, dur}) => {
  const fr = useCurrentFrame();
  const t = T(from);
  const mk = t('хороший');
  const no = t('не', 3);
  const sell = t('продавать');
  const offK = fr >= sell ? 1 : 0;
  const grid = Array.from({length: 9}, (_, i) => i);
  return (
    <Sheet dur={dur}>
      <AbsoluteFill style={{backgroundImage: `radial-gradient(#DADADA 2px, transparent 2.4px)`, backgroundSize: '34px 34px'}} />
      <Word at={0} x={80} y={150} size={44} color={C.grey}>поэтому</Word>
      <Plate at={mk} x={540} y={270} size={64} rot={-2}>хороший маркетинг</Plate>
      {/* pixel seller pushing a box, bubble shouts */}
      <div style={{position: 'absolute', left: 60, top: 430, width: 380, scale: String(pop(fr, 2)), rotate: `${Math.sin(fr / 3) * 2}deg`}}>
        <Img src={S('img/pb04.png')} style={{width: 380}} />
        <div style={{position: 'absolute', left: 150, top: 20, width: 220, textAlign: 'center', fontFamily: "'Pixel', monospace", fontWeight: 700, fontSize: 38, color: offK ? '#A9A9A9' : C.ink}}>КУПИ!!!</div>
      </div>
      {/* buttons multiply */}
      {grid.map((i) => {
        const at = 6 + i * Math.max(2, Math.floor((sell - 10) / 9));
        const c = i % 3, r = Math.floor(i / 3);
        return <WinBtn key={i} at={at} x={490 + c * 180 + (r % 2) * 18} y={470 + r * 120} w={160} h={92} label="купи" size={40} off={fr >= sell + i} />;
      })}
      <Stand src="img/pose04.png" at={no} x={780} bottom={1460} h={560} />
      <Word at={t('умение')} x={90} y={1130} size={78}>продавать</Word>
      <Strike a={sell} x1={80} y1={1185} x2={450} y2={1185} w={10} />
      <Strike a={sell + 2} x1={470} y1={460} x2={1040} y2={830} w={6} />
    </Sheet>
  );
};

// 8 — «Это умение создавать желание купить.»
export const SWant: React.FC<P> = ({from, dur}) => {
  const fr = useCurrentFrame();
  const t = T(from);
  const ty = t('создавать');
  const want = t('желание');
  const buy = t('купить');
  const txt = 'хочу';
  const n = Math.max(0, Math.min(txt.length, Math.floor((fr - ty) / 2)));
  const blink = Math.floor(fr / 6) % 2 === 0;
  const hk = interpolate(fr, [want - 4, buy], [0, 1], {...clamp, easing: ease});
  const glow = interpolate(fr, [want, want + 10], [0, 1], clamp);
  return (
    <Sheet bg="img/bg6.jpg" dur={dur} zoom={[1, 1.05]}>
      {/* spotlight on the one thing in the window */}
      <div style={{position: 'absolute', left: 290, top: 300, width: 500, height: 420, borderRadius: '50%', background: `radial-gradient(rgba(244,197,66,${0.35 * glow}), transparent 70%)`}} />
      <Sticker src="img/pb07.png" at={0} x={540} y={330} w={330} sway={0.4} />
      <Word at={0} x={80} y={150} size={44} color={C.grey}>это умение</Word>
      <Word at={ty} x={620} y={150} size={60} it>создавать</Word>
      <Stand src="img/pose05.png" at={0} x={540} bottom={1330} h={600} />
      {/* input + the only active button */}
      {fr >= ty - 3 && (
        <div style={{position: 'absolute', left: 90, top: 1350, width: 560, height: 110, background: '#fff', border: `3px solid ${C.grey}`, borderRadius: 8, scale: String(pop(fr, ty - 3)),
          display: 'flex', alignItems: 'center', paddingLeft: 30, fontFamily: SANS, fontWeight: 600, fontSize: 64, letterSpacing: -1.5, color: C.ink}}>
          {txt.slice(0, n)}<span style={{opacity: blink ? 1 : 0, fontWeight: 400}}>|</span>
        </div>
      )}
      <WinBtn at={ty} x={680} y={1350} w={310} h={110} label="купить" size={56} yellow pressed={fr >= buy && fr < buy + 5} />
      {fr >= want - 4 && (
        <Img src={S('img/hand02.png')} style={{position: 'absolute', width: 360, left: interpolate(hk, [0, 1], [1100, 835 - 324]), top: interpolate(hk, [0, 1], [1950, 1410 - 7])}} />
      )}
      {[0, 1, 2, 3].map((i) => (
        <Sticker key={i} src="img/pa01.png" at={buy + 1 + i} x={835 + Math.cos(i * 1.7) * 230} y={1180 - i * 90} w={110 - i * 14} rot={i * 23} />
      ))}
    </Sheet>
  );
};

export const BOUNDS = () => [0, wf('даже'), wf('дело'), wf('люди'), wf('статус'), wf('apple'), wf('поэтому'), wf('это', 1)];
export const MODES = ['C', 'C', 'C', 'C', 'C', 'C', 'C', 'C'] as const;
export const SCENES = [SHook, SPrice, SNotPrice, SBox, MCycleBW, SLife, MSell, SWant];
/** bounds where no wipe is played (continuous sheet) */
export const NO_WIPE = [1, 3];
