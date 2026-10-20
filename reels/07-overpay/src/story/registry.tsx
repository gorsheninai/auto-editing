import React from 'react';
import {AbsoluteFill, Img, interpolate, useCurrentFrame} from 'remotion';
import type {Row, Word} from './types';
import {BgImg, Bubble, Burst, Cup, FinishTape, Garland, Grain, Heart, Medal, Mirror, P, Phone, Pill, PriceTag, SANS, SERIF, Sky, Smiley, Sneaker, Star, cl, img, puffy, sp, toyShadow} from './clay';

/* Сцены ролика 07 «Почему люди переплачивают». Все — режим C, 1080×1920.
   Кадр внутри сегмента — локальный; слова-якоря берутся из words по тексту. */
export type SceneProps = {from: number; dur: number; t0: number; row: Row; words: Word[]; zoneH: number; full: boolean};

const norm = (s: string) => s.toLowerCase().replace(/[.,:?!«»—]/g, '');
/** локальный кадр начала слова внутри сегмента */
const at = (p: SceneProps, w: string, occ = 0) => {
  let n = 0;
  for (const x of p.words) if (norm(x.w) === w) { if (n === occ) return Math.round(x.s * 30) - p.from; n++; }
  throw new Error(`слово «${w}» не найдено в сегменте «${p.row.text}»`);
};
const Abs: React.FC<{x: number; y: number; children: React.ReactNode; style?: React.CSSProperties}> = ({x, y, children, style}) => (
  <div style={{position: 'absolute', left: x, top: y, ...style}}>{children}</div>
);
/* пружинное появление вокруг центра */
const Pop: React.FC<{at: number; x: number; y: number; children: React.ReactNode; from?: number; rot?: number}> = ({at: a, x, y, children, from = 0, rot = 0}) => {
  const fr = useCurrentFrame(); const s = sp(fr, a);
  if (fr < a) return null;
  return <div style={{position: 'absolute', left: x, top: y, transform: `translate(-50%,-50%) scale(${from + (1 - from) * s}) rotate(${rot * (1 - s)}deg)`}}>{children}</div>;
};
const Hero: React.FC<{src: string; h: number; x: number; y: number; style?: React.CSSProperties}> = ({src, h, x, y, style}) => (
  <Img src={img(`img/${src}.png`)} style={{position: 'absolute', left: x, top: y, height: h, transform: 'translate(-50%,-100%)', filter: toyShadow, ...style}} />
);

/* 1. Хук: футболка на ниточке у гигантского ценника ×10, на «переплачивать» ценник раздувается и тянет героя вверх */
const SHook: React.FC<SceneProps> = (p) => {
  const fr = useCurrentFrame();
  const k = at(p, 'переплачивать');
  const inflate = sp(fr, k, {damping: 8, stiffness: 120});
  const lift = interpolate(fr, [k + 4, p.dur], [0, -170], cl);
  const bob = Math.sin(fr / 7) * 10;
  const tagS = 0.8 + 0.55 * inflate;
  const wob = Math.sin(fr / 3) * 3 * inflate;
  const heroIn = sp(fr, 0);
  const hx = 540, hy = 1440 + lift;
  const tx = 600, ty = 470 + bob + lift * 1.15 - 60 * inflate;
  return <AbsoluteFill>
    <BgImg src="img/bg_01.jpg" dur={p.dur} y={60} />
    <svg width="1080" height="1920" style={{position: 'absolute'}}>
      <path d={`M${hx + 10} ${hy - 470} Q${hx + 80} ${(hy - 470 + ty) / 2} ${tx - 60} ${ty + 120}`} stroke="#fff" strokeWidth="6" fill="none" />
    </svg>
    <div style={{position: 'absolute', left: tx, top: ty, transform: `translate(-50%,-50%) scale(${tagS}) rotate(${-8 + wob}deg)`}}><PriceTag w={520} /></div>
    <Hero src="pose1" h={760} x={hx} y={hy} style={{transform: `translate(-50%,-100%) scale(${0.85 + 0.15 * heroIn}) rotate(${wob}deg)`}} />
    {fr >= k && <div style={{position: 'absolute', left: tx, top: ty}}><Burst at={k} r={340} /></div>}
    <Grain />
  </AbsoluteFill>;
};

/* 2. Nike: плашка зачёркивается и сжимается на «кроссовки», кроссовок с крылышками отлетает */
const SNike: React.FC<SceneProps> = (p) => {
  const fr = useCurrentFrame();
  const k = at(p, 'кроссовки');
  const s0 = sp(fr, 0);
  const strike = interpolate(fr, [k, k + 6], [0, 1], cl);
  const squash = sp(fr, k + 2, {damping: 9});
  const fly = sp(fr, k, {damping: 14, stiffness: 120});
  return <AbsoluteFill>
    <Sky dur={p.dur} />
    <Abs x={540} y={640} style={{transform: `translate(-50%,-50%) scale(${s0 * (1 - 0.22 * squash)}, ${s0 * (1 - 0.32 * squash)}) rotate(${-4 * squash}deg)`}}>
      <div style={{position: 'relative'}}>
        <Pill size={190}>Nike</Pill>
        <div style={{position: 'absolute', left: -20, top: '50%', height: 22, width: `${strike * 108}%`, borderRadius: 11, background: P.orange, transform: 'rotate(-6deg)', boxShadow: '0 6px 10px rgba(0,0,0,0.15)'}} />
      </div>
    </Abs>
    <Abs x={540} y={330} style={{transform: `translate(-50%,-50%) scale(${sp(fr, 2)}) rotate(-3deg)`}}>
      <Pill size={66} bg={P.yellow}>продаёт <span style={{fontFamily: SERIF, fontStyle: 'italic', fontWeight: 500, fontStretch: '68%', fontSize: 74}}>не просто</span></Pill>
    </Abs>
    <div style={{position: 'absolute', left: 540 + 420 * fly, top: 1050 - 320 * fly + 260 * fly * fly, transform: `translate(-50%,-50%) scale(${sp(fr, 3) * (1 - 0.25 * fly)}) rotate(${-10 + 38 * fly}deg)`}}>
      <Sneaker w={560} />
    </div>
    <Grain />
  </AbsoluteFill>;
};

/* 3. Стадион: на «ощущение» натягивается финишная лента, на «спортсмен» — большая медаль */
const SStadium: React.FC<SceneProps> = (p) => {
  const fr = useCurrentFrame();
  const k1 = at(p, 'ощущение'); const k2 = at(p, 'спортсмен');
  const tape = sp(fr, k1, {damping: 13});
  const run = interpolate(fr, [0, p.dur], [-60, 60], cl);
  const jump = -Math.abs(Math.sin(fr / 6)) * 50;
  const med = sp(fr, k2, {damping: 8});
  return <AbsoluteFill>
    <BgImg src="img/bg_02.jpg" dur={p.dur} />
    <Abs x={40} y={760} style={{transform: `scale(${0.6 + 0.4 * tape})`, transformOrigin: '50% 100%', opacity: tape}}><FinishTape w={1000} k={tape} /></Abs>
    {fr >= k2 && <div style={{position: 'absolute', left: 540 + run, top: 820, width: 0, height: 0}}>
      <div style={{position: 'absolute', left: -420, top: -420, width: 840, height: 840, borderRadius: '50%', background: 'radial-gradient(circle, rgba(255,240,150,0.85) 0%, rgba(255,212,59,0.35) 40%, rgba(255,212,59,0) 70%)', transform: `scale(${med})`}} />
    </div>}
    <Hero src="pose2" h={820} x={540 + run} y={1420 + jump} />
    {fr >= k2 && <>
      <div style={{position: 'absolute', left: 820, top: 520, transform: `translate(-50%,-50%) scale(${med}) rotate(${12 - 12 * med}deg)`}}><Medal size={300} /></div>
      <div style={{position: 'absolute', left: 820, top: 600}}><Burst at={k2} r={260} /></div>
    </>}
    <Grain />
  </AbsoluteFill>;
};

/* 4. Starbucks: стаканчик выезжает на стойку, на «кофе» поднимается пар-сердечко */
const SCup: React.FC<SceneProps> = (p) => {
  const fr = useCurrentFrame();
  const k = at(p, 'кофе');
  const slide = sp(fr, 0, {damping: 14});
  const steam = interpolate(fr, [k, k + 14], [0, 1], cl);
  return <AbsoluteFill>
    <Sky dur={p.dur} />
    <Abs x={540} y={250} style={{transform: `translate(-50%,-50%) scale(${sp(fr, 0)})`}}><Pill size={140} bg={P.white} color="#00704A">Starbucks</Pill></Abs>
    <Abs x={-40} y={1180} style={{width: 1160, height: 220, borderRadius: 60, background: `linear-gradient(180deg, #FBEFD0 0%, ${P.cream} 40%, #D9BF85 100%)`, boxShadow: '0 20px 40px rgba(20,70,130,0.3)'}}>{null}</Abs>
    <Abs x={-40} y={1170} style={{width: 1160, height: 46, borderRadius: 23, background: '#FFF6DE'}}>{null}</Abs>
    <div style={{position: 'absolute', left: 540 + 700 * (1 - slide), top: 1210, transform: 'translate(-50%,-100%)'}}><Cup w={380} /></div>
    {fr >= k && <div style={{position: 'absolute', left: 540 + Math.sin(fr / 4) * 18, top: 560 - 120 * steam, transform: `translate(-50%,-50%) scale(${0.3 + 0.9 * steam})`, opacity: interpolate(steam, [0, 0.2], [0, 1], cl)}}><Heart size={240} /></div>}
    {fr >= k && [0, 1, 2].map((i) => <div key={i} style={{position: 'absolute', left: 470 + i * 70, top: 690 - 60 * steam - i * 20, width: 26, height: 120 * steam, borderRadius: 13, background: 'rgba(255,255,255,0.7)', transform: `rotate(${(i - 1) * 10}deg)`}} />)}
    <Grain />
  </AbsoluteFill>;
};

/* 5. Кофейня: на «атмосферу» загорается гирлянда и тёплый свет, на «привычку» в календарике отмечаются утра */
const SCafe: React.FC<SceneProps> = (p) => {
  const fr = useCurrentFrame();
  const k1 = at(p, 'атмосферу'); const k2 = at(p, 'привычку');
  const warm = interpolate(fr, [k1, k1 + 8], [0, 1], cl);
  const card = sp(fr, k2 - 4);
  const days = ['пн', 'вт', 'ср', 'чт', 'пт'];
  return <AbsoluteFill>
    <BgImg src="img/pic_1.jpg" dur={p.dur} zoom={0.07} />
    <AbsoluteFill style={{background: 'radial-gradient(circle at 50% 55%, rgba(255,200,90,0.35), rgba(255,170,60,0) 60%)', opacity: warm, mixBlendMode: 'screen'}} />
    <Abs x={0} y={70}><Garland at={k1} /></Abs>
    {fr >= k2 - 4 && <div style={{position: 'absolute', left: 540, top: 470, transform: `translate(-50%,-50%) scale(${card}) rotate(${-4 * card}deg)`, filter: toyShadow}}>
      <div style={{width: 760, borderRadius: 48, background: '#fff', overflow: 'hidden', border: '8px solid #fff'}}>
        <div style={{height: 90, background: P.pink, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: SANS, fontWeight: 700, fontSize: 52, color: '#fff'}}>каждое утро</div>
        <div style={{display: 'flex', justifyContent: 'space-around', padding: '28px 20px 34px', background: '#FFF8EC'}}>
          {days.map((d, i) => {
            const m = sp(fr, k2 + 1 + i * 2, {damping: 9, stiffness: 260});
            return <div key={d} style={{position: 'relative', width: 116, textAlign: 'center', fontFamily: SANS, fontWeight: 700, fontSize: 48, color: P.ink}}>
              {d}
              <div style={{position: 'absolute', left: 4, top: -24, width: 108, height: 108, borderRadius: '50%', border: `10px solid ${P.orange}`, transform: `scale(${m})`, opacity: m > 0.05 ? 1 : 0}} />
            </div>;
          })}
        </div>
      </div>
    </div>}
    <Grain />
  </AbsoluteFill>;
};

/* 6. Apple: пухлый смартфон обновляется, на «смартфон» подпрыгивает, на «а» экран гаснет */
const SPhone: React.FC<SceneProps> = (p) => {
  const fr = useCurrentFrame();
  const k1 = at(p, 'смартфон'); const k2 = at(p, 'а');
  const hop = sp(fr, k1, {damping: 7, stiffness: 220});
  const off = interpolate(fr, [k2, k2 + 4], [0, 1], cl);
  const prog = interpolate(fr, [0, k1], [0.1, 0.95], cl);
  const y = -Math.sin(Math.min(1, (fr - k1) / 10) * Math.PI) * 90 * (fr >= k1 ? 1 : 0);
  return <AbsoluteFill>
    <Sky dur={p.dur} soft />
    <Abs x={540} y={230} style={{transform: `translate(-50%,-50%) scale(${sp(fr, 0)})`}}><Pill size={150}>Apple</Pill></Abs>
    <div style={{position: 'absolute', left: 540, top: 860 + y, transform: `translate(-50%,-50%) scale(${sp(fr, 1) * (1 + 0.06 * (1 - hop) * (fr >= k1 ? 1 : 0))}) rotate(${(fr >= k1 ? Math.sin((fr - k1) / 2) * 5 * (1 - hop) : -3)}deg)`}}>
      <Phone w={420} prog={prog} off={off} />
    </div>
    <Grain />
  </AbsoluteFill>;
};

/* 7. Наклейка «стиль жизни» летит к герою и на «стилю» прилипает к груди */
const SSticker: React.FC<SceneProps> = (p) => {
  const fr = useCurrentFrame();
  const k = at(p, 'стилю');
  const t = interpolate(fr, [0, k], [0, 1], {...cl, easing: (x) => 1 - Math.pow(1 - x, 2.4)});
  const slap = sp(fr, k, {damping: 7, stiffness: 260});
  const stuck = fr >= k;
  const sx = stuck ? 540 : 900 - 360 * t; const sy = stuck ? 960 : 260 + 700 * t + Math.sin(t * Math.PI) * -120;
  const sc = stuck ? 1.25 - 0.35 * slap : 1.3 - 0.2 * t;
  const squash = stuck ? 1 + 0.25 * (1 - slap) : 1;
  return <AbsoluteFill>
    <BgImg src="img/bg_01.jpg" dur={p.dur} y={160} />
    <Hero src="turn1" h={900} x={540} y={1460 - (stuck ? 20 * (1 - slap) : 0)} style={{transform: `translate(-50%,-100%) scale(${0.9 + 0.1 * sp(fr, 0)})`}} />
    <div style={{position: 'absolute', left: sx, top: sy, transform: `translate(-50%,-50%) rotate(${stuck ? -6 : 220 * (1 - t) - 6}deg) scale(${sc * squash}, ${sc / squash})`, filter: toyShadow}}>
      <div style={{padding: '18px 34px 24px', borderRadius: 40, background: P.yellow, border: '10px solid #fff', fontFamily: SANS, fontWeight: 700, fontSize: 64, color: P.pink, whiteSpace: 'nowrap', letterSpacing: -2}}>стиль жизни</div>
    </div>
    {stuck && <div style={{position: 'absolute', left: 540, top: 960}}><Burst at={k} r={330} hearts n={10} /></div>}
    <Grain />
  </AbsoluteFill>;
};

/* 8. «Сет Годин» надутыми буквами, на «сформулировал» вырастает пустой пузырь */
const SName: React.FC<SceneProps> = (p) => {
  const fr = useCurrentFrame();
  const k = at(p, 'сформулировал');
  const name = 'Сет Годин'.split('');
  const b = sp(fr, k, {damping: 10});
  return <AbsoluteFill>
    <Sky dur={p.dur} soft stars={false} />
    <div style={{position: 'absolute', left: 540, top: 600, transform: `translate(-50%,-50%) scale(${0.2 + 0.8 * b})`, opacity: fr >= k ? 1 : 0, transformOrigin: '30% 100%'}}>
      <Bubble w={820} h={460}>
        <div style={{display: 'flex', gap: 34}}>{[0, 1, 2].map((i) => <div key={i} style={{width: 46, height: 46, borderRadius: '50%', background: P.sky, transform: `translateY(${Math.sin((fr - i * 4) / 3) * 12}px)`}} />)}</div>
      </Bubble>
    </div>
    <div style={{position: 'absolute', left: 0, width: 1080, top: 1080, display: 'flex', justifyContent: 'center'}}>
      {name.map((ch, i) => {
        const s = sp(fr, i * 1.2, {damping: 9});
        return <span key={i} style={{...puffy(170), display: 'inline-block', minWidth: ch === ' ' ? 50 : 0, transform: `translateY(${(1 - s) * 80}px) scale(${s})`}}>{ch}</span>;
      })}
    </div>
    <Abs x={540} y={1300} style={{transform: 'translateX(-50%)', opacity: interpolate(fr, [6, 12], [0, 1], cl)}}>
      <span style={{...puffy(64, '#1F6FB5', '#FFFFFF'), fontFamily: SERIF, fontStyle: 'italic', fontWeight: 500, fontStretch: '68%', letterSpacing: 0, whiteSpace: 'nowrap'}}>маркетолог</span>
    </Abs>
    <Grain />
  </AbsoluteFill>;
};

/* 9. Цитата: слова вылетают в ритм речи, на «именно» снизу — ряд одинаковых аватарок «наших» */
const SQuote: React.FC<SceneProps> = (p) => {
  const fr = useCurrentFrame();
  const k = at(p, 'именно');
  const lines = [['Такие,', 'как', 'мы,'], ['поступают'], ['именно', 'так']];
  const wAt = (w: string) => at(p, norm(w));
  return <AbsoluteFill>
    <Sky dur={p.dur} soft stars={false} />
    <div style={{position: 'absolute', left: 540, top: 560, transform: 'translate(-50%,-50%)'}}>
      <Bubble w={1000} h={760}>
        <div style={{display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 18, marginTop: -10}}>
          {lines.map((ln, li) => <div key={li} style={{display: 'flex', gap: 26}}>
            {ln.map((w) => {
              const s = sp(fr, wAt(w) - 1, {damping: 9, stiffness: 240});
              return <span key={w} style={{...puffy(li === 1 ? 128 : 112, P.sky, '#1F7FCB'), display: 'inline-block', transform: `scale(${s}) translateY(${(1 - s) * 40}px)`, opacity: s > 0.02 ? 1 : 0}}>{li === 0 && w === 'Такие,' ? '«Такие,' : w === 'так' ? 'так»' : w}</span>;
            })}
          </div>)}
        </div>
      </Bubble>
    </div>
    <div style={{position: 'absolute', left: 0, width: 1080, top: 1130, display: 'flex', justifyContent: 'center', gap: 6, flexWrap: 'wrap'}}>
      {[1, 4, 6, 9, 13].map((n, i) => {
        const s = sp(fr, k + i * 2, {damping: 9});
        return <Img key={n} src={img(`img/ava${n}.png`)} style={{width: 200, transform: `scale(${s}) translateY(${(1 - s) * 60}px)`, filter: toyShadow, opacity: fr >= k + i * 2 ? 1 : 0}} />;
      })}
    </div>
    <Grain />
  </AbsoluteFill>;
};

/* 10. Зеркало на подиуме: обычный герой тянется, на «товар» вспышка, на «а» в отражении уверенная версия */
const SMirror: React.FC<SceneProps> = (p) => {
  const fr = useCurrentFrame();
  const k1 = at(p, 'товар'); const k2 = at(p, 'а');
  const flash = interpolate(fr, [k1, k1 + 2, k1 + 8], [0, 1, 0], cl);
  const refl = sp(fr, k1 + 2, {damping: 10});
  const reach = interpolate(fr, [0, p.dur], [0, 26], cl);
  return <AbsoluteFill>
    <BgImg src="img/bg_06.jpg" dur={p.dur} zoom={0.04} />
    <div style={{position: 'absolute', left: 720, top: 1330, transform: `translate(-50%,-100%) scale(${sp(fr, 0)})`, transformOrigin: '50% 100%'}}>
      <Mirror w={450} flash={flash}>
        {fr >= k1 + 2 && <Img src={img('img/pose5.png')} style={{position: 'absolute', left: '50%', bottom: -10, height: 560, transform: `translateX(-50%) scale(${0.6 + 0.4 * refl})`, transformOrigin: '50% 100%', opacity: refl}} />}
      </Mirror>
    </div>
    <Hero src="pose4" h={660} x={290 + reach} y={1420} />
    {fr >= k1 + 2 && <div style={{position: 'absolute', left: 720, top: 1000}}><Burst at={k1 + 2} r={300} n={7} /></div>}
    <Grain />
  </AbsoluteFill>;
};

/* 11. Финал: «будущий ты» с медалью и кофе, на «стать» прилипает значок «такой, как я хочу», кадр замирает */
const SFinal: React.FC<SceneProps> = (p) => {
  const fr = useCurrentFrame();
  const k = at(p, 'стать');
  const hero = sp(fr, 0, {damping: 10});
  const badge = sp(fr, k, {damping: 7, stiffness: 240});
  const f = Math.min(fr, k + 12); // замирание после значка
  return <AbsoluteFill>
    <Sky dur={p.dur} />
    <div style={{position: 'absolute', left: 540, top: 860, width: 0, height: 0}}>
      <div style={{position: 'absolute', left: -460, top: -460, width: 920, height: 920, borderRadius: '50%', background: 'radial-gradient(circle, rgba(255,255,255,0.85) 0%, rgba(255,240,180,0.4) 40%, rgba(255,255,255,0) 70%)', transform: `scale(${hero})`}} />
    </div>
    {[[200, 520, 0], [880, 450, 1], [150, 1080, 2], [920, 1120, 3], [520, 280, 4]].map(([x, y, i]) => (
      <div key={i} style={{position: 'absolute', left: x, top: y + Math.sin((f + i * 11) / 8) * 16, transform: `scale(${sp(fr, 2 + i * 2)})`}}>{i % 2 ? <Star size={70} /> : <Heart size={86} />}</div>
    ))}
    <Hero src="pose5" h={900} x={500} y={1450} style={{transform: `translate(-50%,-100%) scale(${0.7 + 0.3 * hero})`, transformOrigin: '50% 100%'}} />
    <div style={{position: 'absolute', left: 770, top: 1150, transform: `translate(-50%,-50%) scale(${sp(fr, 4)}) rotate(8deg)`}}><Cup w={190} /></div>
    {fr >= k && <div style={{position: 'absolute', left: 540, top: 330, transform: `translate(-50%,-50%) scale(${1.4 - 0.4 * badge}) rotate(${-5 + 10 * (1 - badge)}deg)`, opacity: Math.min(1, badge * 3)}}>
      <div style={{display: 'flex', alignItems: 'center', gap: 22, padding: '20px 40px 20px 22px', borderRadius: 999, background: '#fff', boxShadow: '0 20px 40px rgba(20,70,130,0.3)'}}>
        <Smiley size={150} />
        <div style={{fontFamily: SANS, fontWeight: 700, fontSize: 62, lineHeight: 1.0, color: P.pink, letterSpacing: -2}}>ТАКОЙ,<br /><span style={{whiteSpace: 'nowrap'}}>КАК Я ХОЧУ</span></div>
      </div>
    </div>}
    {fr >= k && <div style={{position: 'absolute', left: 540, top: 330}}><Burst at={k} r={380} hearts n={10} /></div>}
    <Grain />
  </AbsoluteFill>;
};

export const REG: Record<string, React.FC<SceneProps>> = {
  hook: SHook, nike: SNike, stadium: SStadium, cup: SCup, cafe: SCafe, phone: SPhone,
  sticker: SSticker, name: SName, quote: SQuote, mirror: SMirror, final: SFinal,
};
