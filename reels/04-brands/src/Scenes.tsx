import React from 'react';
import {AbsoluteFill, Img, interpolate, useCurrentFrame} from 'remotion';
import {S3BrandOrbit, S3Launch} from './scenes3d';
import {
  AvatarCut, C, Grain, Plate, S, SANS, Split, Sticker, Strike, Word, clamp, ease, pop, serifIt, wf,
} from './kit';

type P = {from: number; dur: number};
const DOTS: React.CSSProperties = {backgroundImage: `radial-gradient(${C.lav} 2px, transparent 2.4px)`, backgroundSize: '30px 30px'};
const Sheet: React.FC<{children: React.ReactNode; bg?: string}> = ({children, bg}) => (
  <AbsoluteFill style={{background: C.cream}}>
    {bg ? <Img src={S(bg)} style={{position: 'absolute', width: '100%', height: '100%', objectFit: 'cover'}} /> : <AbsoluteFill style={DOTS} />}
    {children}
    <Grain o={0.03} />
  </AbsoluteFill>
);

/** arrow cursor gliding between points, with a click squash */
const Cursor: React.FC<{path: [number, number, number][]; click?: number; src?: string; w?: number}> = ({path, click, src = 'img/ui00.png', w = 120}) => {
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
  const sq = click !== undefined && fr >= click && fr < click + 5 ? 0.82 : 1;
  return <Img src={S(src)} style={{position: 'absolute', left: x, top: y, width: w, scale: String(sq), transformOrigin: '10% 5%'}} />;
};

// 1 — A: «Знаешь, почему у»
export const SHook: React.FC<P> = ({from, dur}) => {
  const t = (w: string, o = 0) => wf(w, o) - from;
  return (
    <AvatarCut from={from} dur={dur} zoom={[1.06, 1.1]}>
      <Word at={t('почему') + 2} x={760} y={330} size={42}>почему?</Word>
    </AvatarCut>
  );
};

// 2 — C (3D): «одних брендов покупают даже дорого»
export const SOrbit: React.FC<P> = ({from, dur}) => {
  const fr = useCurrentFrame();
  const t = (w: string, o = 0) => wf(w, o) - from;
  const tagAt = t('дорого');
  const k = pop(fr, tagAt);
  return (
    <AbsoluteFill>
      <S3BrandOrbit from={from} dur={dur} />
      <Word at={0} x={70} y={140}>одних</Word>
      <Word at={t('брендов')} x={760} y={230}>брендов</Word>
      <Word at={t('покупают')} x={90} y={1290}>покупают</Word>
      <Word at={t('даже')} x={780} y={1380} it>даже</Word>
      {fr >= tagAt && (
        <div style={{position: 'absolute', left: interpolate(k, [0, 1], [350, 560]), top: interpolate(k, [0, 1], [1100, 640]), width: 380, scale: String(interpolate(k, [0, 1], [0.4, 1.1])), rotate: `${-12 + Math.sin(fr / 6) * 2}deg`}}>
          <Img src={S('img/ib02.png')} style={{width: 380}} />
          <div style={{position: 'absolute', left: 120, top: 330, rotate: '38deg', fontFamily: SANS, fontWeight: 700, fontSize: 64, letterSpacing: -2, color: C.ink}}>дорого</div>
        </div>
      )}
      <Grain o={0.03} />
    </AbsoluteFill>
  );
};

// 3 — C: two shops — queue vs discount, then «дело не в цене»
export const SShops: React.FC<P> = ({from}) => {
  const fr = useCurrentFrame();
  const t = (w: string, o = 0) => wf(w, o) - from;
  const sale = t('скидке');
  const deal = t('дело');
  const dim = interpolate(fr, [deal - 2, deal + 4], [1, 0.18], clamp);
  const tk = pop(fr, deal);
  return (
    <Sheet bg="img/bg_1.png">
      <AbsoluteFill style={{opacity: dim}}>
        <div style={{position: 'absolute', left: 539, top: 220, width: 2, height: 1050, background: C.grey, opacity: 0.6}} />
        <Word at={0} x={160} y={250} size={40} color={C.grey}>одни</Word>
        <Word at={t('других')} x={700} y={250} size={40} color={C.grey}>другие</Word>
        <Sticker src="img/ib04.png" at={0} x={270} y={380} w={400} sway={0} />
        <Sticker src="img/ib04.png" at={t('других')} x={810} y={380} w={400} sway={0} />
        {/* queue at the left shop */}
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <Sticker key={i} src={`img/av${String([0, 1, 5, 2, 3, 8][i]).padStart(2, '0')}.png`} at={3 + i * 3}
            x={110 + (i % 3) * 150} y={800 + Math.floor(i / 3) * 160} w={140} rot={(i % 2 ? 4 : -4)} />
        ))}
        <Sticker src="img/ib02.png" at={6} x={350} y={240} w={120} rot={-10} />
        {/* empty discount shop */}
        <Sticker src="img/ib03.png" at={sale} x={900} y={300} w={210} rot={8} />
        {fr >= sale && <div style={{position: 'absolute', left: 840, top: 372, rotate: '8deg', scale: String(pop(fr, sale)), fontFamily: SANS, fontWeight: 700, fontSize: 52, letterSpacing: -2, color: C.ink}}>−70%</div>}
        <Word at={sale + 6} x={720} y={860} size={36} color={C.grey}>пусто</Word>
        <Cursor path={[[t('других'), 520, 1150], [sale - 2, 830, 640]]} click={sale} />
      </AbsoluteFill>
      {/* «дело не в цене» */}
      {fr >= deal && (
        <div style={{position: 'absolute', left: 540 - 230, top: interpolate(tk, [0, 1], [-700, 330]), width: 460, rotate: `${-8 + Math.sin(fr / 7) * 3}deg`}}>
          <Img src={S('img/ib02.png')} style={{width: 460}} />
          <div style={{position: 'absolute', left: 150, top: 380, rotate: '38deg', fontFamily: SANS, fontWeight: 700, fontSize: 78, letterSpacing: -2, color: C.ink}}>цена</div>
        </div>
      )}
      <Strike a={t('цене')} x1={270} y1={1000} x2={820} y2={420} w={14} />
      <Plate at={t('не', 0)} x={700} y={1150} size={50} rot={-3}>не в этом</Plate>
    </Sheet>
  );
};

// 4 — C motion: product vs emotions race
const Lane: React.FC<{y: number; label: string; icon: string; color: string; k: number; at: number}> = ({y, label, icon, color, k, at}) => {
  const fr = useCurrentFrame();
  if (fr < at) return null;
  const o = interpolate(fr, [at, at + 5], [0, 1], clamp);
  return (
    <div style={{position: 'absolute', left: 90, right: 90, top: y, opacity: o}}>
      <div style={{fontFamily: SANS, fontWeight: 600, fontSize: 50, letterSpacing: -1, color}}>{label}</div>
      <div style={{position: 'relative', marginTop: 16, height: 64, border: `2px solid ${C.ink}`, borderRadius: 4, background: '#fff'}}>
        <div style={{position: 'absolute', left: 6, top: 6, bottom: 6, width: `calc(${k * 100}% - 12px)`, background: color, borderRadius: 2}} />
        <Img src={S(icon)} style={{position: 'absolute', top: -58, left: `calc(${k * 100}% - 90px)`, width: 160}} />
      </div>
    </div>
  );
};
export const MRaceBW: React.FC<P> = ({from, dur}) => {
  const fr = useCurrentFrame();
  const t = (w: string, o = 0) => wf(w, o) - from;
  const emo = t('эмоции');
  const prod = interpolate(fr, [4, dur], [0.08, 0.5], clamp);
  const emoK = fr < emo ? interpolate(fr, [8, emo], [0.04, 0.22], clamp) : interpolate(fr, [emo, emo + 12], [0.22, 0.96], {...clamp, easing: ease});
  return (
    <Sheet>
      <div style={{position: 'absolute', top: 170, width: '100%', textAlign: 'center'}}>
        <div style={{fontFamily: SANS, fontWeight: 600, fontSize: 44, color: C.grey}}>люди покупают</div>
        <div style={{...serifIt, fontSize: 120, color: C.ink, lineHeight: 1.05}}>что на самом деле?</div>
      </div>
      <Lane y={560} label="продукт" icon="img/ib01.png" color={C.grey} k={prod} at={2} />
      <Lane y={900} label="эмоции" icon="img/ie01.png" color={C.ink} k={emoK} at={6} />
      <Strike a={t('не', 1)} x1={80} y1={600} x2={360} y2={600} w={8} len={10} />
      <Sticker src="img/ie04.png" at={emo + 8} x={900} y={760} w={190} rot={12} />
      <Plate at={emo + 10} x={540} y={1240} size={44}>обгоняют</Plate>
    </Sheet>
  );
};

// 5 — B: status & feeling
export const SStatus: React.FC<P> = ({from, dur}) => {
  const fr = useCurrentFrame();
  const t = (w: string, o = 0) => wf(w, o) - from;
  const feel = t('ощущение');
  const fo = interpolate(fr, [feel, feel + 8], [0, 1], clamp);
  return (
    <Split from={from}>
      <AbsoluteFill style={{opacity: fo}}>
        <Img src={S('img/bg_4.png')} style={{position: 'absolute', width: '100%', height: '100%', objectFit: 'cover', filter: `blur(${4 + Math.sin(fr / 5) * 3}px)`, scale: String(interpolate(fr, [feel, dur], [1.05, 1.15], clamp))}} />
      </AbsoluteFill>
      <Sticker src="img/ie00.png" at={0} x={540} y={130} w={300} />
      <Sticker src="img/ie02.png" at={4} x={220} y={330} w={210} rot={-8} />
      <Sticker src="img/ie03.png" at={7} x={860} y={330} w={240} rot={7} />
      <Plate at={2} x={540} y={430} size={44}>статус</Plate>
      {fr >= feel && (
        <Img src={S('img/pose03.png')} style={{position: 'absolute', height: 560, left: 540 - 150, top: interpolate(pop(fr, feel), [0, 1], [1100, 540])}} />
      )}
      <Word at={feel + 4} x={650} y={700} size={64} it>ощущение</Word>
      <Sticker src="img/ui08.png" at={t('даёт')} x={300} y={600} w={260} />
    </Split>
  );
};

// 6 — C: phone → lifestyle
const SCR = {x: 392, y: 40, w: 216, h: 230}; // upper phone screen area in hand00 (source px)
export const SLife: React.FC<P> = ({from, dur}) => {
  const fr = useCurrentFrame();
  const t = (w: string, o = 0) => wf(w, o) - from;
  const phones = t('телефоны');
  const life = t('образ');
  const sc = 820 / 976;
  const away = interpolate(fr, [life - 2, life + 8], [0, 1], {...clamp, easing: ease});
  const enter = interpolate(pop(fr, 0), [0, 1], [500, 0]);
  return (
    <Sheet>
      <div style={{position: 'absolute', left: 130, top: 330 + enter + away * 900, width: 820, rotate: `${away * 14}deg`, opacity: 1 - away * 0.6}}>
        <Img src={S('img/hand00.png')} style={{width: 820}} />
        <div style={{position: 'absolute', left: SCR.x * sc, top: SCR.y * sc, width: SCR.w * sc, height: SCR.h * sc, display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontFamily: SANS, fontWeight: 600, fontSize: 52, letterSpacing: -1.5, color: '#fff', opacity: interpolate(fr, [0, 4], [0, 1], clamp)}}>Apple</div>
      </div>
      <AbsoluteFill style={{opacity: 1 - away}}>
        <Word at={phones} x={150} y={250} size={60}>телефоны</Word>
        <Strike a={phones + 2} x1={140} y1={290} x2={450} y2={290} w={8} />
        <Strike a={phones + 4} x1={220} y1={1180} x2={860} y2={420} w={12} />
      </AbsoluteFill>
      {/* lifestyle moodboard */}
      <Sticker src="img/ui03.png" at={life} x={330} y={520} w={480} rot={-4} />
      <Sticker src="img/av13.png" at={life + 2} x={330} y={640} w={250} rot={-4} />
      <Sticker src="img/ui05.png" at={life + 3} x={760} y={760} w={460} rot={5} />
      <Sticker src="img/ib08.png" at={life + 5} x={760} y={880} w={300} rot={5} />
      <Sticker src="img/ib01.png" at={life + 7} x={250} y={1000} w={230} rot={-6} />
      <Sticker src="img/ui08.png" at={life + 8} x={600} y={380} w={300} />
      <Plate at={life + 6} x={540} y={1260} size={56}>образ жизни</Plate>
    </Sheet>
  );
};

// 7 — C motion: marketing → selling ✕ → desire
const Node: React.FC<{at: number; x: number; y: number; src: string; label: string; ring?: string; ghost?: boolean}> = ({at, x, y, src, label, ring = C.ink, ghost}) => {
  const fr = useCurrentFrame();
  const r = 110;
  if (ghost || fr < at) return (
    <>
      <div style={{position: 'absolute', left: x - r, top: y - r, width: r * 2, height: r * 2, borderRadius: '50%', border: `3px dashed ${C.grey}`}} />
      {ghost && <div style={{position: 'absolute', left: x - 200, width: 400, top: y + r + 14, textAlign: 'center', fontFamily: SANS, fontWeight: 600, fontSize: 50, color: C.grey}}>{label}</div>}
    </>
  );
  const s = pop(fr, at);
  return (
    <>
      <div style={{position: 'absolute', left: x - r, top: y - r, width: r * 2, height: r * 2, borderRadius: '50%', background: '#fff', border: `6px solid ${ring}`, scale: String(s),
        display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
        <Img src={S(src)} style={{width: 150, height: 150, objectFit: 'contain'}} />
      </div>
      <div style={{position: 'absolute', left: x - 200, width: 400, top: y + r + 14, textAlign: 'center', fontFamily: SANS, fontWeight: 600, fontSize: 50, letterSpacing: -1, color: C.ink, opacity: interpolate(fr, [at, at + 4], [0, 1], clamp)}}>{label}</div>
    </>
  );
};
export const MPathBW: React.FC<P> = ({from}) => {
  const fr = useCurrentFrame();
  const t = (w: string, o = 0) => wf(w, o) - from;
  const n1 = t('маркетинг'), n2 = t('не', 3), x2 = t('продавать');
  const d = 'M 280 470 C 600 470 800 560 800 800 C 800 1040 520 1060 280 1140';
  const k = interpolate(fr, [0, x2 + 6], [0, 1], clamp);
  return (
    <Sheet>
      <Word at={t('хороший')} x={90} y={150} size={44} color={C.grey}>хороший</Word>
      <svg width={1080} height={1920} style={{position: 'absolute', left: 0, top: 0}}>
        <path d={d} fill="none" stroke={C.grey} strokeWidth={6} strokeDasharray="4 18" strokeLinecap="round" pathLength={1} />
        <path d={d} fill="none" stroke={C.ink} strokeWidth={6} strokeLinecap="round" pathLength={1} strokeDasharray={`${k * 0.62} 1`} />
      </svg>
      <Node at={n1} x={280} y={470} src="img/ib04.png" label="маркетинг" ring={C.yellow} />
      <Node at={n2} x={800} y={800} src="img/ib05.png" label="продавать" />
      <Node at={0} x={280} y={1140} src="img/ie06.png" label="желание" ghost />
      <Sticker src="img/ie05.png" at={n2 + 2} x={430} y={720} w={190} sway={0} style={{transform: 'scaleX(1)'}} />
      <Strike a={x2 - 2} x1={630} y1={955} x2={970} y2={955} w={10} />
      <Plate at={x2 - 4} x={800} y={1060} size={46}>не это</Plate>
    </Sheet>
  );
};

// 8 — C (3D): pencil launch + typing «желание»
export const SLaunch: React.FC<P> = ({from, dur}) => {
  const fr = useCurrentFrame();
  const t = (w: string, o = 0) => wf(w, o) - from;
  const ty = t('создавать');
  const word = 'желание';
  const n = Math.max(0, Math.min(word.length, Math.floor((fr - ty) / 1.6)));
  const blink = Math.floor(fr / 6) % 2 === 0;
  return (
    <AbsoluteFill>
      <S3Launch from={from} dur={dur} />
      <Plate at={0} x={300} y={250} size={56} rot={-2}>это умение</Plate>
      {fr >= ty - 2 && (
        <div style={{position: 'absolute', left: 540 - 300, top: 1180, width: 600, scale: String(pop(fr, ty - 2))}}>
          <Img src={S('img/ui02.png')} style={{width: 600}} />
          <div style={{position: 'absolute', left: 100, top: 64, fontFamily: SANS, fontWeight: 600, fontSize: 70, letterSpacing: -1.5, color: C.ink}}>
            {word.slice(0, n)}<span style={{opacity: blink ? 1 : 0}}>|</span>
          </div>
        </div>
      )}
      <Word at={ty} x={640} y={1110} size={40} color={C.grey}>создавать</Word>
      <Grain o={0.03} />
    </AbsoluteFill>
  );
};

// 9 — A: «желание купить» — speaker only
export const SEnd: React.FC<P> = ({from, dur}) => <AvatarCut from={from} dur={dur} zoom={[1.0, 1.08]} />;

export const BOUNDS = () => [0, wf('одних'), wf('а'), wf('люди'), wf('статус'), wf('apple'), wf('поэтому'), wf('это', 1), wf('желание')];
export const MODES = ['A', 'C', 'C', 'C', 'B', 'C', 'C', 'C', 'A'] as const;
export const SCENES = [SHook, SOrbit, SShops, MRaceBW, SStatus, SLife, MPathBW, SLaunch, SEnd];
