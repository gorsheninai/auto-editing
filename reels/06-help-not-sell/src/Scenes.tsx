import React from 'react';
import {AbsoluteFill, Img, Sequence, interpolate, useCurrentFrame} from 'remotion';
import {C, Grain, Plate, S, SANS, Strike, Title, Word, clamp, ease, pop, serifIt, wf} from './kit';

// 06-help-not-sell: интернет-коллаж bzik на белом листе, все сцены — режим C, без спикера.
type P = {from: number; dur: number};
/** children see the global frame */
const Glob: React.FC<{from: number; children: React.ReactNode}> = ({from, children}) => <Sequence from={-from} layout="none">{children}</Sequence>;
const G: React.FC<{from: number; render: (g: number) => React.ReactNode}> = ({render}) => <>{render(useCurrentFrame())}</>;

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

/** pose / prop anchored by bottom-centre, springs up; swaps without a pop when `still` */
const Stand: React.FC<{g: number; src: string; at: number; x: number; bottom: number; h: number; out?: number; flip?: boolean; still?: boolean; z?: number}> = ({g, src, at, x, bottom, h, out, flip, still, z}) => {
  if (g < at || (out !== undefined && g >= out)) return null;
  const s = still ? 1 : pop(g, at);
  return (
    <Img src={S(src)} style={{position: 'absolute', height: h, left: x, bottom: 1920 - bottom, translate: '-50% 0', zIndex: z,
      transformOrigin: '50% 100%', scale: `${flip ? -1 : 1} ${interpolate(s, [0, 1], [0.6, 1])}`, rotate: `${Math.sin((g - at) / 16) * 0.8}deg`}} />
  );
};

const Cursor: React.FC<{g: number; path: [number, number, number][]; clicks?: number[]; w?: number}> = ({g, path, clicks = [], w = 70}) => {
  if (g < path[0][0]) return null;
  let x = path[0][1], y = path[0][2];
  for (let i = 0; i < path.length - 1; i++) {
    const [a, x0, y0] = path[i];
    const [b, x1, y1] = path[i + 1];
    if (g >= a) {
      const k = interpolate(g, [a, b], [0, 1], {...clamp, easing: ease});
      x = x0 + (x1 - x0) * k; y = y0 + (y1 - y0) * k;
    }
  }
  const sq = clicks.some((c) => g >= c && g < c + 4) ? 0.8 : 1;
  return (
    <svg width={w} height={w * 1.4} viewBox="0 0 20 28" style={{position: 'absolute', left: x, top: y, scale: String(sq), transformOrigin: '0 0', overflow: 'visible', zIndex: 20}}>
      <path d="M1 1 L1 22 L6.5 17 L10.5 26 L14 24.5 L10 15.8 L17.5 15.5 Z" fill="#111" stroke="#fff" strokeWidth={1.4} strokeLinejoin="round" />
    </svg>
  );
};

const WinBtn: React.FC<{g: number; x: number; y: number; w: number; h: number; label: string; size?: number; at?: number; out?: number; yellow?: boolean; pressed?: boolean; ring?: number}> = ({g, x, y, w, h, label, size = 48, at = 0, out, yellow, pressed, ring}) => {
  if (g < at || (out !== undefined && g >= out)) return null;
  const rk = ring !== undefined ? interpolate(g, [ring, ring + 6], [0, 1], clamp) : 0;
  return (
    <div style={{position: 'absolute', left: x, top: y, width: w, height: h, scale: String(pop(g, at) * (pressed ? 0.94 : 1)),
      background: yellow ? C.yellow : '#E4E4E4', border: `3px solid ${C.ink}`, borderRadius: 6,
      boxShadow: pressed ? `inset 4px 4px 0 rgba(0,0,0,.25)` : `inset -4px -4px 0 rgba(0,0,0,.18), inset 4px 4px 0 #fff`,
      outline: rk ? `${4 * rk}px solid ${C.ink}` : undefined, outlineOffset: 10 * rk,
      display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: SANS, fontWeight: 600, fontSize: size, letterSpacing: -1, color: C.ink}}>{label}</div>
  );
};

const Pix: React.FC<{map: string[]; px: number; x: number; y: number; colors?: Record<string, string>; scale?: number; rot?: number}> = ({map, px, x, y, colors = {K: C.ink, W: '#fff'}, scale = 1, rot = 0}) => (
  <svg width={map[0].length * px} height={map.length * px} style={{position: 'absolute', left: x, top: y, scale: String(scale), rotate: `${rot}deg`, overflow: 'visible'}} shapeRendering="crispEdges">
    {map.flatMap((row, j) => row.split('').map((c, i) => (colors[c] ? <rect key={`${i}-${j}`} x={i * px} y={j * px} width={px} height={px} fill={colors[c]} /> : null)))}
  </svg>
);
// 1-bit man pointing right
const POINT = [
  '..KKK.......',
  '.KWWWK......',
  '.KWKWK......',
  '.KWWWK......',
  '..KKK.......',
  '.KWWWKKKKKKK',
  'KWWWWWWWWWWK',
  'KWKWWWKKKKKK',
  'KWKWWWK.....',
  '.K.KWK......',
  '...KWK......',
  '..KK.KK.....',
  '..K...K.....',
  '.KK...KK....',
];

/** retro popup window drawn in code */
const Popup: React.FC<{g: number; at: number; x: number; y: number; w: number; text: string; size?: number; red?: boolean; close?: number; rot?: number}> = ({g, at, x, y, w, text, size = 44, red, close, rot = 0}) => {
  if (g < at) return null;
  const s = pop(g, at);
  const c = close !== undefined ? interpolate(g, [close, close + 4], [1, 0], clamp) : 1;
  if (c <= 0) return null;
  return (
    <div style={{position: 'absolute', left: x, top: y, width: w, scale: String(s * (0.6 + 0.4 * c)), opacity: c, rotate: `${rot}deg`,
      background: '#F4F4F4', border: `3px solid ${C.ink}`, borderRadius: 6, boxShadow: '6px 6px 0 rgba(0,0,0,.12)'}}>
      <div style={{height: 40, background: '#D4D4DA', borderBottom: `3px solid ${C.ink}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 8px'}}>
        <div style={{width: 46, height: 18, background: '#E5484D', borderRadius: 4, border: `2px solid ${C.ink}`}} />
        <div style={{width: 26, height: 26, border: `2.5px solid ${C.ink}`, background: '#fff', fontFamily: SANS, fontWeight: 700, fontSize: 22, lineHeight: '22px', textAlign: 'center'}}>×</div>
      </div>
      <div style={{padding: '18px 12px 22px', textAlign: 'center', fontFamily: SANS, fontWeight: 700, fontSize: size, letterSpacing: -1, color: red ? '#E5484D' : C.ink, lineHeight: 1}}>{text}</div>
    </div>
  );
};

// ============ 1–3: one continuous desk with the search field ============
const IN = {x: 110, y: 560, w: 860, h: 130};
const Q1 = 'как мне продать?';
const Q2 = 'кому я могу помочь?';
const Desk: React.FC<{g: number}> = ({g}) => {
  const tQ = wf('вопроса');
  const del = wf('продать');
  const tA = wf('а');
  const tQ2 = wf('вопроса', 1) - 2;
  const who = wf('кому');
  const can = wf('могу');
  const help = wf('помочь');
  // field text
  let txt = '';
  if (g < del + 3) txt = Q1.slice(0, Math.max(0, Math.min(Q1.length, Math.floor((g - tQ) * 1.2))));
  else if (g < tQ2) txt = Q1.slice(0, Math.max(0, Q1.length - Math.floor((g - del - 3) * 1.6)));
  else txt = Q2.slice(0, Math.max(0, Math.min(Q2.length, Math.floor((g - tQ2) * 1.1))));
  const blink = Math.floor(g / 6) % 2 === 0;
  const stoneIn = interpolate(g, [del + 8, del + 18], [1, 0], {...clamp, easing: ease});
  const stoneOut = interpolate(g, [who - 4, who + 4], [0, 1], clamp);
  return (
    <>
      <Title top={150} a="с чего начинается" b="маркетинг" sizeA={70} sizeB={96} />
      {/* search field */}
      <div style={{position: 'absolute', left: IN.x, top: IN.y, width: IN.w, height: IN.h, background: '#fff', border: `3px solid ${C.grey}`, borderRadius: 10,
        display: 'flex', alignItems: 'center', paddingLeft: 34, fontFamily: SANS, fontWeight: 600, fontSize: 64, letterSpacing: -1.5, color: C.ink, boxShadow: '0 6px 0 #F2F2F4'}}>
        {txt}<span style={{opacity: blink ? 1 : 0, fontWeight: 400, marginLeft: 2}}>|</span>
      </div>
      {g >= wf('не') && g < del + 3 && <Plate at={wf('не')} x={190} y={505} size={70} rot={-5}>не</Plate>}
      <WinBtn g={g} at={wf('как') - 2} out={tA} x={690} y={720} w={280} h={96} label="удалить" size={46} pressed={g >= del && g < del + 5} />
      {/* idea graveyard */}
      {g >= del + 8 && stoneOut < 1 && (
        <div style={{position: 'absolute', left: 730 + stoneIn * 500, top: 860 + stoneOut * 600, width: 300, rotate: `${4 + stoneIn * 20}deg`}}>
          <Img src={S('img/pa0.png')} style={{width: 300}} />
          <div style={{position: 'absolute', left: 58, top: 280, width: 136, textAlign: 'center', fontFamily: SANS, fontWeight: 700, fontSize: 26, lineHeight: 1, color: C.ink, rotate: '-4deg'}}>как продать?</div>
        </div>
      )}
      <Word at={del + 12} x={720} y={1330} size={34} color={C.grey} it>кладбище идей</Word>
      {/* helper suggestions */}
      {g >= who && (
        <div style={{position: 'absolute', left: 560, top: 740, width: 420, scale: String(pop(g, who)), transformOrigin: '50% 0'}}>
          <Img src={S('img/pa2.png')} style={{width: 420}} />
          {['не хватает времени', 'не знаю, с чего начать', 'страшно ошибиться'].map((s, i) => (
            <div key={s} style={{position: 'absolute', left: 120, top: 70 + i * 140, width: 270, fontFamily: SANS, fontWeight: 600, fontSize: 26, fontStyle: 'italic', color: C.grey,
              rotate: `${[4, 3, 3][i]}deg`, opacity: interpolate(g, [who + 2 + i * 2, who + 5 + i * 2], [0, 1], clamp)}}>{s}</div>
          ))}
          {g >= can && <div style={{position: 'absolute', left: -50, top: 320, scale: String(pop(g, can))}}><Plate at={can} x={0} y={0} size={44} bg={C.yellow} color={C.ink} rot={-8}>я!</Plate></div>}
        </div>
      )}
      <WinBtn g={g} at={help} x={110} y={740} w={300} h={100} label="помочь" size={52} yellow ring={help + 2} />
      {/* hero */}
      <Stand g={g} src="img/pose0.png" at={0} out={tA} x={300} bottom={1480} h={600} />
      <Stand g={g} src="img/pose1.png" at={tA} x={300} bottom={1480} h={600} still />
      <Cursor g={g} path={[[0, 900, 1250], [wf('как') - 2, 920, 1150], [del - 3, 820, 770], [tA + 2, 820, 770], [help + 2, 300, 790]]} clicks={[del, help + 6]} />
    </>
  );
};
const DeskScene: React.FC<P> = ({from, dur}) => {
  return <Sheet bg="img/bg1.png" dur={dur}><Glob from={from}><G from={from} render={(g) => <Desk g={g} />} /></Glob></Sheet>;
};
// 1 — «Хороший маркетинг начинается не с вопроса»
export const SDeskA = DeskScene;
// 2 — моушн «Как мне продать?» (стирание + надгробие)
export const MErase = DeskScene;
// 3 — «а с вопроса "Кому я могу помочь?"»
export const SDeskB = DeskScene;

// ============ 4–5: ads swarm, then the hand closes them ============
const ADS: {x: number; y: number; w: number; t: string; red?: boolean; rot: number; size?: number}[] = [
  {x: 60, y: 300, w: 420, t: 'КУПИ СЕЙЧАС', rot: -4},
  {x: 600, y: 250, w: 360, t: '−50%', red: true, rot: 5, size: 80},
  {x: 640, y: 640, w: 380, t: 'только сегодня', rot: -3, size: 40},
  {x: 70, y: 690, w: 330, t: 'успей!', rot: 4, size: 60},
  // second wave (scene 5)
  {x: 330, y: 150, w: 380, t: 'КУПИ СЕЙЧАС', rot: 2},
  {x: 30, y: 1000, w: 360, t: '−70%', red: true, rot: -6, size: 80},
  {x: 640, y: 1000, w: 380, t: 'последний шанс', rot: 4, size: 38},
  {x: 360, y: 460, w: 360, t: 'КУПИ!!!', rot: -2, size: 58},
];
const Swarm: React.FC<{g: number}> = ({g}) => {
  const ppl = wf('люди');
  const them = wf('им');
  const close0 = wf('продавали') - 4;
  const appear = (i: number) => (i < 4 ? ppl + i * 3 : them + (i - 4) * 3);
  // hand sweeps over close buttons in this order
  const order = [4, 1, 7, 2, 0, 3, 6, 5];
  const closeAt = (i: number) => close0 + order.indexOf(i) * 2;
  const xBtn = (i: number) => [ADS[i].x + ADS[i].w - 26, ADS[i].y + 20];
  const keys = order.map((i, k) => [close0 + k * 2, ...xBtn(i)] as [number, number, number]);
  let hx = 1300, hy = 2000;
  if (g >= close0 - 6) {
    const pts: [number, number, number][] = [[close0 - 6, 1300, 2000], ...keys];
    for (let i = 0; i < pts.length - 1; i++) {
      if (g >= pts[i][0]) {
        const k = interpolate(g, [pts[i][0], pts[i + 1][0]], [0, 1], clamp);
        hx = pts[i][1] + (pts[i + 1][1] - pts[i][1]) * k; hy = pts[i][2] + (pts[i + 1][2] - pts[i][2]) * k;
      }
    }
    if (g >= keys[keys.length - 1][0]) { hx = keys[keys.length - 1][1]; hy = keys[keys.length - 1][2]; }
  }
  const calm = g >= keys[keys.length - 1][0] + 2;
  return (
    <>
      {/* people turned away from the ads */}
      {['ppl0', 'ppl4', 'ppl1', 'ppl3'].map((p, i) => (
        <Stand key={p} g={g} src={`img/${p}.png`} at={ppl + i * 2} x={[110, 230, 860, 980][i]} bottom={1480 - (i % 2) * 20} h={330} />
      ))}
      <Stand g={g} src="img/pose2.png" at={0} x={540} bottom={1490} h={620} />
      <Word at={wf('не', 1)} x={150} y={950} size={64} it>не</Word>
      <Word at={wf('хотят')} x={780} y={930} size={64} it>хотят</Word>
      {ADS.map((a, i) => (
        <Popup key={i} g={g} at={appear(i)} x={a.x} y={a.y} w={a.w} text={a.t} red={a.red} size={a.size} rot={a.rot} close={closeAt(i)} />
      ))}
      {calm && <Word at={keys[keys.length - 1][0] + 2} x={380} y={760} size={40} color={C.grey}>тишина</Word>}
      {g >= close0 - 6 && <Img src={S('img/hand1.png')} style={{position: 'absolute', width: 380, left: hx - 361, top: hy - 2, zIndex: 30}} />}
    </>
  );
};
const SwarmScene: React.FC<P> = ({from, dur}) => {
  return <Sheet bg="img/bg1.png" dur={dur}><Glob from={from}><G from={from} render={(g) => <Swarm g={g} />} /></Glob></Sheet>;
};
// 4 — «Люди не хотят, чтобы»
export const SAds = SwarmScene;
// 5 — моушн «им что-то продавали.»
export const MClose = SwarmScene;

// 6 — «Они хотят, чтобы их понимали.»
export const SChat: React.FC<P> = ({from, dur}) => {
  const fr = useCurrentFrame();
  const g = fr + from;
  const they = wf('они');
  const rep = wf('чтобы', 1);
  const und = wf('понимали');
  const R = 'понимаю тебя';
  const n = Math.max(0, Math.min(R.length, Math.floor((g - rep) * 1.3)));
  const W = 600;
  return (
    <Sheet bg="img/bg1.png" dur={dur}>
      <Word at={0} x={90} y={170} size={44} color={C.grey}>они хотят</Word>
      <div style={{position: 'absolute', left: 400, top: 330, width: W, rotate: '-5deg', scale: String(pop(fr, 0))}}>
        <Img src={S('img/pa4.png')} style={{width: W}} />
        <div style={{position: 'absolute', left: 70, top: 88, width: 260, fontFamily: SANS, fontWeight: 600, fontSize: 33, lineHeight: 1.05, color: C.ink, rotate: '6deg'}}>не знаю, с чего начать…</div>
        <div style={{position: 'absolute', left: 196, top: 296, width: 300, fontFamily: SANS, fontWeight: 700, fontSize: 36, color: C.ink, rotate: '6deg'}}>{R.slice(0, n)}</div>
      </div>
      {fr >= 4 && <Pix map={POINT} px={13} x={120} y={500} scale={pop(fr, 4)} />}
      <Stand g={g} src="img/pose3.png" at={they} x={340} bottom={1480} h={640} still />
      <Plate at={und - from} x={760} y={1060} size={64} rot={-3}>понимали</Plate>
      {g >= und + 3 && <Word at={und + 3 - from} x={640} y={1150} size={34} color={C.grey} it>прочитано ✓✓</Word>}
    </Sheet>
  );
};

// 7 — «И бренды, которые это осознают,»
export const SBrand: React.FC<P> = ({from, dur}) => {
  const fr = useCurrentFrame();
  const g = fr + from;
  const br = wf('бренды');
  const aw = wf('осознают');
  const arrow = interpolate(g, [br + 10, br + 22], [0, 1], {...clamp, easing: ease});
  return (
    <Sheet bg="img/bg1.png" dur={dur}>
      <Word at={0} x={90} y={300} size={72}>продать</Word>
      <Strike a={br + 4 - from} x1={80} y1={350} x2={400} y2={350} w={10} />
      <svg width={1080} height={1920} style={{position: 'absolute', left: 0, top: 0}}>
        <path d={`M 420 340 Q 560 ${340 - 120 * arrow} ${420 + 220 * arrow} ${340 + 0 * arrow}`} stroke={C.ink} strokeWidth={6} fill="none" strokeLinecap="round" />
        {arrow > 0.95 && <path d="M 618 318 L 645 342 L 614 360" stroke={C.ink} strokeWidth={6} fill="none" strokeLinecap="round" strokeLinejoin="round" />}
      </svg>
      <WinBtn g={g} at={br + 18} x={660} y={280} w={330} h={110} label="помочь" size={58} yellow={g >= aw} pressed={g >= aw && g < aw + 5} ring={aw + 2} />
      <Stand g={g} src="img/pose4.png" at={0} x={540} bottom={1430} h={650} />
      <div style={{position: 'absolute', left: 540, bottom: 1920 - 1490, translate: '-50% 0', height: 470, scale: `1 ${interpolate(pop(fr, 2), [0, 1], [0.6, 1])}`, transformOrigin: '50% 100%'}}>
        <Img src={S('img/pa5.png')} style={{height: 470}} />
        <div style={{position: 'absolute', left: 0, right: 0, top: 470 * 0.425, textAlign: 'center', fontFamily: SANS, fontWeight: 700, fontSize: 34, letterSpacing: -1, color: C.ink}}>бренд</div>
      </div>
      <Cursor g={g} path={[[from, 960, 1300], [aw - 4, 830, 340]]} clicks={[aw]} />
    </Sheet>
  );
};

// 8 — «перестают бороться за внимание»
const MEGA: {x: number; y: number; w: number; flip: boolean; ph: number}[] = [
  {x: 40, y: 330, w: 330, flip: false, ph: 0},
  {x: 700, y: 300, w: 330, flip: true, ph: 2},
  {x: 60, y: 760, w: 280, flip: false, ph: 4},
  {x: 740, y: 730, w: 290, flip: true, ph: 1},
];
export const SMegaphone: React.FC<P> = ({from, dur}) => {
  const fr = useCurrentFrame();
  const fight = wf('бороться') - from;
  const za = wf('за') - from;
  const att = wf('внимание') - from;
  const quiet = interpolate(fr, [za, za + 10], [1, 0.25], clamp);
  return (
    <Sheet bg="img/bg2.png" dur={dur} zoom={[1.02, 1.07]}>
      {MEGA.map((m, i) => {
        const sh = Math.sin((fr + m.ph) * 1.7) * 6 * quiet;
        return (
          <Img key={i} src={S('img/pa6.png')} style={{position: 'absolute', left: m.x + sh, top: m.y, width: m.w, scale: `${m.flip ? -1 : 1} 1`, rotate: `${(m.flip ? -8 : 8) + sh * 0.5}deg`,
            opacity: interpolate(fr, [i * 2, i * 2 + 3], [0, 1], clamp) * (0.35 + 0.65 * quiet)}} />
        );
      })}
      <Plate at={3} x={540} y={240} size={50} bg="#fff" color={C.ink} rot={-6}>100к</Plate>
      <Plate at={6} x={560} y={900} size={50} bg="#fff" color={C.ink} rot={5}>200к</Plate>
      <Stand g={fr} src="img/pose5.png" at={0} x={540} bottom={1480} h={520} />
      <Word at={fight} x={330} y={540} size={96}>бороться</Word>
      <Strike a={za} x1={320} y1={608} x2={760} y2={608} w={12} len={5} />
      <Word at={att} x={400} y={680} size={40} color={C.grey} it>за внимание</Word>
    </Sheet>
  );
};

// 9 — моушн «и начинают заслуживать доверие.»
export const MTrust: React.FC<P> = ({from, dur}) => {
  const fr = useCurrentFrame();
  const st = wf('начинают') - from;
  const tr = wf('доверие') - from;
  const earn = wf('заслуживать') - from;
  const N = 10;
  const filled = Math.max(0, Math.min(N, Math.floor(interpolate(fr, [st, tr + 6], [0, N], clamp))));
  const bx = 120, by = 430, bw = 840, bh = 92;
  return (
    <Sheet bg="img/bg3.png" dur={dur}>
      <div style={{position: 'absolute', top: 210, width: '100%', textAlign: 'center', ...serifIt, fontSize: 104, color: C.ink, lineHeight: 1}}>доверие</div>
      <div style={{position: 'absolute', left: bx, top: by, width: bw, height: bh, border: `4px solid ${C.ink}`, borderRadius: 10, background: '#F2F2F4', padding: 8, display: 'flex', gap: 8}}>
        {Array.from({length: N}, (_, i) => (
          <div key={i} style={{flex: 1, borderRadius: 3, background: i < filled ? C.orange : 'transparent', scale: i === filled - 1 ? String(pop(fr, 0) * 0 + 1) : '1'}} />
        ))}
      </div>
      <div style={{position: 'absolute', left: bx, top: by + bh + 14, width: bw, textAlign: 'right', fontFamily: SANS, fontWeight: 600, fontSize: 34, color: C.grey}}>{filled * 10}%</div>
      {fr >= earn - 2 && (
        <>
          <div style={{position: 'absolute', left: 140, top: 640, fontFamily: SANS, fontWeight: 600, fontSize: 52, color: C.grey, opacity: interpolate(fr, [earn - 2, earn + 2], [0, 1], clamp)}}>купить</div>
          <Strike a={earn + 2} x1={130} y1={675} x2={330} y2={675} w={8} color={C.grey} />
          <WinBtn g={fr} at={earn + 4} x={390} y={620} w={330} h={104} label="заслужить" size={50} yellow />
        </>
      )}
      <Stand g={fr} src="img/pose6.png" at={0} x={250} bottom={1480} h={600} />
      {fr >= tr && (
        <div style={{position: 'absolute', left: 520, top: 880, width: 480, scale: String(pop(fr, tr)), transformOrigin: '50% 100%'}}>
          <Img src={S('img/pb0.png')} style={{width: 480}} />
          {['бренд', 'человек'].map((s, i) => (
            <div key={s} style={{position: 'absolute', left: i ? 323 : 2, top: 12, width: 152, textAlign: 'center', fontFamily: SANS, fontWeight: 700, fontSize: i ? 28 : 32, color: C.ink, letterSpacing: -0.5}}>{s}</div>
          ))}
        </div>
      )}
    </Sheet>
  );
};

export const BOUNDS = () => [0, wf('как'), wf('а'), wf('люди'), wf('им'), wf('они'), wf('и', 0), wf('перестают'), wf('и', 1)];
export const MODES = ['C', 'C', 'C', 'C', 'C', 'C', 'C', 'C', 'C'] as const;
export const SCENES = [SDeskA, MErase, SDeskB, SAds, MClose, SChat, SBrand, SMegaphone, MTrust];
/** bounds where no wipe is played (continuous sheet) */
export const NO_WIPE = [1, 2, 4];
