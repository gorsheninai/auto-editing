import React from 'react';
import {Sequence, interpolate, useCurrentFrame} from 'remotion';
import type {SceneProps} from './registry';
import {SANS, clamp} from '../blocks/kit';
import {parseData, themeFrom} from '../blocks/kit';
import {TEXT} from '../blocks/text-fx';
import {C, useAt, snap, Sheet, W, SPR, Pix, Frame, ln, Sneaker, Tee, Cursor} from './bzik';

/* Ролик 11 «Почему одни достигают целей»: стиль bzik — белый лист, рассыпные слова,
   пиксельный человечек, тонкие рамки с линейными рисунками, курсор, допечатка. Только жёсткие склейки. */

/* Новые спрайты: «#» — чернила, «o» — акцент */
Object.assign(SPR, {
  flag: ['#oooo.', '#ooooo', '#oooo.', '#.....', '#.....', '#.....', '#.....', '#.....', '#.....'],
  hourglass: ['#######', '.#ooo#.', '..#o#..', '...#...', '..#.#..', '.#.o.#.', '#######'],
  moon: ['..ooo.', '.oo...', 'oo....', 'oo....', 'oo....', '.oo...', '..ooo.'],
  sit: ['..###...', '.#####..', '.#####..', '..###...', '...#....', '.####...', '#.###...', '..#####.', '..#...#.', '..#...#.'],
  wave: ['..###..#', '.#####.#', '.#####.#', '..###.#.', '...#.#..', '.####...', '#.###...', '..###...', '..###...', '..#.#...', '.#...#..', '.#...#..'],
  carry: ['..###....', '.#####...', '.#####...', '..###....', '...#.....', '.#####...', '#.###.###', '..###.#o#', '..###.###', '..#.#....', '.#...#...', '.#...#...'],
  carry2: ['..###....', '.#####...', '.#####...', '..###....', '...#.....', '.#####...', '#.###.###', '..###.#o#', '..###.###', '...#.....', '..#.#....', '..#.#....'],
  wall: ['#######', '#..#..#', '#######', '.#..#..', '#######'],
  cal: ['#.#.#.#', '#######', '#ooooo#', '#.....#', '#.#.#.#', '#.....#', '#.#.#.#', '#######'],
  cal2: ['#.#.#.#', '#######', '#ooooo#', '#.....#', '#.#.#..', '#.....#', '#.#....', '#######'],
  cal3: ['#.#.#.#', '#######', '#ooooo#', '#.....#', '#......', '#.....#', '#......', '#######'],
  timer: ['..###..', '...#...', '.#####.', '#..#..#', '#..##.#', '#.....#', '.#####.'],
});

/* 1. HERO — человечек бежит по пунктиру к флажку «цель» */
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

/* 2. WORD — человечек стоит на пустой дороге; на «годами» песочные часы */
export const GStuck: React.FC<SceneProps> = (p) => {
  const f = useCurrentFrame(); const at = useAt(p); const c = C();
  return <Sheet>
    <W at={at(7)} x={250} y={380} text="другие" />
    <W at={at(8)} x={830} y={380} text="годами" />
    {f >= at(8) ? <Pix name={['cal', 'cal2', 'cal3'][Math.floor((f - at(8)) / 4) % 3]} x={830} y={500} cell={12} /> : null}
    <Frame x={540} y={880} w={560} h={600} rot={-3}>
      <path d="M40 600 L250 220 M520 600 L310 220" {...ln()} />
      <path d="M0 220 L560 220" {...ln()} strokeWidth={3} />
      <path d="M280 590 L280 540 M280 480 L280 430 M280 380 L280 345 M280 300 L280 280" {...ln()} strokeWidth={4} />
    </Frame>
    <Pix name="sit" x={540} y={1010} cell={11} />
    <W at={0} x={800} y={1230} text="на месте" size={42} />
  </Sheet>;
};

/* 3. KEY — крупная «2» и «минуты» */
export const GTwo: React.FC<SceneProps> = (p) => {
  const f = useCurrentFrame(); const at = useAt(p); const c = C();
  const k = snap(f, at(15)), k2 = snap(f, at(16));
  return <Sheet>
    <W at={0} x={540} y={420} text="1." size={52} color={c.muted} />
    <W at={at(13)} x={330} y={600} text="начни" />
    <W at={at(14)} x={700} y={600} text="с" />
    {k ? <div style={{position: 'absolute', left: 540, top: 870, translate: '-50% -50%', scale: String(k), fontFamily: SANS, fontWeight: 800, fontStretch: '68%', fontSize: 300, letterSpacing: -12, lineHeight: 1, color: c.ink, whiteSpace: 'nowrap'}}>двух</div> : null}
    {k2 ? <div style={{position: 'absolute', left: 470, top: 1130, translate: '-50% -50%', scale: String(k2), fontFamily: SANS, fontWeight: 700, fontSize: 96, letterSpacing: -4, color: c.ink, whiteSpace: 'nowrap'}}>минут</div> : null}
    <Pix name="timer" x={760} y={1130} cell={12} at={at(16)} />
  </Sheet>;
};

/* 4. WORD — раскрытая книга; на «одну» остаётся одна страница */
export const GBook: React.FC<SceneProps> = (p) => {
  const f = useCurrentFrame(); const at = useAt(p); const c = C();
  const one = f >= at(20);
  const lines = (x: number) => [0, 1, 2, 3, 4, 5].map((i) => <path key={i} d={`M${x} ${150 + i * 34} L${x + 150} ${150 + i * 34}`} {...ln()} strokeWidth={3} />);
  return <Sheet>
    <W at={at(17)} x={250} y={400} text="хочешь" />
    <W at={at(18)} x={800} y={440} text="читать?" />
    <W at={at(18) + 4} x={800} y={500} text="(хотя бы чуть-чуть)" serif italic size={30} color={c.muted} />
    <Frame x={540} y={860} w={620} h={460} rot={2}>
      {one ? <g>
        <rect x={210} y={90} width={200} height={290} {...ln()} fill="#fff" />
        {[0, 1, 2, 3, 4, 5].map((i) => <path key={i} d={`M235 ${140 + i * 36} L${385 - (i === 5 ? 70 : 0)} ${140 + i * 36}`} {...ln()} strokeWidth={3} />)}
      </g> : <g>
        {[5, 4, 3, 2, 1].map((i) => <path key={i} d={`M${60 - i * 6} ${110 + i * 6} L${60 - i * 6} ${370 + i * 6} L310 ${390 + i * 6} L${560 + i * 6} ${370 + i * 6} L${560 + i * 6} ${110 + i * 6}`} {...ln()} strokeWidth={3} />)}
        <path d="M60 110 Q190 80 310 120 Q430 80 560 110 L560 370 Q430 345 310 390 Q190 345 60 370 Z" {...ln()} fill="#fff" />
        <path d="M310 120 L310 390" {...ln()} />
        {lines(110)}{lines(360)}
      </g>}
    </Frame>
    <W at={at(21)} x={800} y={1170} text="страница" size={42} />
  </Sheet>;
};

/* 5. CARD — почти пустой лист, в центре одно слово «очевидной» */
export const GCard: React.FC<SceneProps> = (p) => {
  const at = useAt(p); const c = C();
  return <Sheet>
    <W at={0} x={150} y={250} text="второе." size={40} color={c.muted} />
    <W at={at(25)} x={540} y={830} text="полезную привычку —" size={42} color={c.muted} />
    <W at={at(26)} x={540} y={960} text="очевидной" size={128} />
  </Sheet>;
};

/* 6. WORD — форма и кроссовки у кровати; на «вечера» пиксельная луна */
export const GKit: React.FC<SceneProps> = (p) => {
  const at = useAt(p); const c = C();
  return <Sheet>
    <W at={at(28)} x={260} y={390} text="заниматься" />
    <W at={at(29)} x={780} y={440} text="спортом?" />
    <W at={at(33)} x={540} y={1300} text="(а не утром в панике)" serif italic size={48} />
    <Frame x={540} y={900} w={680} h={480} rot={-2}>
      {/* стул: спинка, сиденье, ножки */}
      <path d="M250 40 L250 250 M250 250 L470 250 M270 250 L270 400 M450 250 L450 400 M250 40 L270 40" {...ln()} />
      {/* форма на спинке и сиденье, кроссовки у ножек */}
      <g transform="translate(205 60) scale(0.55)"><Tee w={240} h={220} /></g>
      <g transform="translate(300 300) scale(0.36)"><Sneaker w={520} h={320} /></g>
      <path d="M0 400 L680 400" {...ln()} strokeWidth={3} />
    </Frame>
    <W at={at(31)} x={790} y={1180} text="форма" size={42} />
  </Sheet>;
};

/* 7. TYPE — «третье. / убери препятствия.» печатается кареткой; каретка упирается в стенку */
export const GType: React.FC<SceneProps> = (p) => {
  const f = useCurrentFrame(); const at = useAt(p); const c = C();
  const a = '3.', b = 'убери препятствия', cut = 'убери препят';
  const na = Math.floor(interpolate(f, [0, at(35) - 2], [0, a.length], clamp));
  const nb = Math.floor(interpolate(f, [at(35), at(36) + 10], [0, cut.length], clamp));
  const stuck = nb >= cut.length;
  const blink = stuck ? Math.floor(f / 3) % 2 === 0 : Math.floor(f / 8) % 2 === 0;
  const shake = stuck && f < at(36) + 26 ? (Math.floor(f / 2) % 2 ? 4 : -4) : 0;
  const caret = <span style={{display: 'inline-block', width: 7, height: 74, marginLeft: 6, translate: `${shake}px 12px`, background: blink ? c.ink : 'transparent'}} />;
  const st: React.CSSProperties = {position: 'absolute', left: 110, right: 60, fontFamily: SANS, fontWeight: 600, fontSize: 76, letterSpacing: -2, color: c.ink, whiteSpace: 'nowrap'};
  return <Sheet>
    <div style={{...st, top: 720}}>{a.slice(0, na)}{nb === 0 ? caret : null}</div>
    <div style={{...st, top: 830}}>{b.slice(0, nb)}{nb > 0 ? caret : null}</div>
    <Pix name="wall" x={890} y={980} cell={16} at={at(36) + 10} />
    <W at={at(37)} x={330} y={1210} text="хочешь меньше" size={44} color={c.muted} />
    <Frame x={820} y={1210} w={220} h={340} rot={5} at={at(41)}>
      <rect x={30} y={25} width={160} height={290} rx={26} {...ln()} fill="#fff" />
      <rect x={45} y={55} width={130} height={230} rx={6} stroke={c.ink} strokeWidth={3} fill={c.soft} />
    </Frame>
  </Sheet>;
};

/* 8. WORD — смартфон в рамке; на «меньше» экран гаснет */
export const GPhone: React.FC<SceneProps> = (p) => {
  const f = useCurrentFrame(); const at = useAt(p); const c = C();
  const off = f >= at(38);
  return <Sheet>
    <W at={at(38)} x={250} y={420} text="меньше" />
    <W at={at(39)} x={800} y={470} text="сидеть" />
    <Frame x={540} y={880} w={380} h={600} rot={3}>
      <rect x={70} y={60} width={240} height={480} rx={34} {...ln()} fill="#fff" />
      <rect x={88} y={100} width={204} height={400} rx={8} stroke={c.ink} strokeWidth={3} fill={off ? c.ink : '#fff'} />
      {off ? null : [0, 1, 2, 3, 4, 5, 6, 7, 8].map((i) => <rect key={i} x={106 + (i % 3) * 64} y={124 + Math.floor(i / 3) * 70} width={44} height={44} rx={10} stroke={c.ink} strokeWidth={3} fill={i % 4 === 0 ? c.acc : c.soft} />)}
      <path d="M170 80 L210 80" {...ln()} strokeWidth={4} />
    </Frame>
    <W at={at(41)} x={810} y={1230} text="телефон" size={42} />
  </Sheet>;
};

/* 9. CLICK+HERO — кнопка «другой комнате», курсор кликает; человечек уносит телефон в комнату-рамку */
export const GClick: React.FC<SceneProps> = (p) => {
  const f = useCurrentFrame(); const at = useAt(p); const c = C();
  const clickF = at(46); const pressed = f >= clickF && f < clickF + 4; const on = f >= clickF;
  const cx = interpolate(f, [at(43), clickF - 2], [920, 600], clamp), cy = interpolate(f, [at(43), clickF - 2], [880, 600], clamp);
  const mx = interpolate(f, [at(42), clickF + 6], [220, 820], clamp);
  const inRoom = f >= clickF + 6;
  return <Sheet>
    <W at={at(42)} x={250} y={360} text="оставь" />
    <div style={{position: 'absolute', left: 540, top: 560, translate: '-50% -50%', scale: pressed ? '0.95' : '1', border: `3px solid ${c.ink}`, background: on ? c.ink : '#fff', color: on ? '#fff' : c.ink,
      padding: '18px 38px 22px', fontFamily: SANS, fontWeight: 700, fontSize: 64, letterSpacing: -2, whiteSpace: 'nowrap'}}>другой комнате</div>
    {/* комната-рамка с дверью */}
    <div style={{position: 'absolute', left: 690, top: 900, width: 270, height: 280, border: `3px solid ${c.ink}`, background: '#fff'}}>
      <div style={{position: 'absolute', left: -3, bottom: -3, width: 70, height: 130, borderTop: `3px solid ${c.ink}`, borderRight: `3px solid ${c.ink}`, background: '#fff'}} />
    </div>
    <svg width={1080} height={1920} style={{position: 'absolute', inset: 0}}><path d="M120 1180 L690 1180" stroke={c.ink} strokeWidth={4} strokeDasharray="14 14" /></svg>
    {inRoom ? <Pix name="sit" x={860} y={1112} cell={10} /> : <Pix name={Math.floor(f / 4) % 2 ? 'carry' : 'carry2'} x={mx} y={1110} cell={11} />}
    {f >= at(43) ? <Cursor x={cx} y={cy} press={pressed} /> : null}
  </Sheet>;
};

/* 10. KEY — «сила воли» тонким гротеском, на «не» зачёркивается; рядом грустный человечек */
export const GWill: React.FC<SceneProps> = (p) => {
  const f = useCurrentFrame(); const at = useAt(p); const c = C();
  const l = interpolate(f, [at(48), at(48) + 5], [0, 1], clamp);
  return <Sheet>
    <W at={0} x={540} y={520} text="секрет" size={44} color={c.muted} />
    <div style={{position: 'absolute', left: 540, top: 800, translate: '-50% -50%', fontFamily: SANS, fontWeight: 300, fontSize: 150, letterSpacing: -6, color: c.ink, whiteSpace: 'nowrap'}}>сила воли</div>
    <svg width={1080} height={1920} style={{position: 'absolute', inset: 0}}>
      <path d={`M110 830 L${110 + 860 * l} ${830 - 70 * l}`} stroke={c.ink} strokeWidth={9} strokeLinecap="round" />
    </svg>
    <Pix name="sit" x={790} y={1120} cell={12} at={at(49)} />
    <W at={at(49)} x={300} y={1120} text="не в ней" size={42} />
  </Sheet>;
};

/* 11. KEY+ASIDE — «система» проявляется из размытия (блок TxtSoftBlur), ремарка в скобках, человечек машет с края */
export const GFinal: React.FC<SceneProps> = (p) => {
  const f = useCurrentFrame(); const at = useAt(p); const c = C();
  const Soft = TEXT.TxtSoftBlur;
  const th = themeFrom(p.theme || {dark: false, bg: c.bg, ink: c.ink, accent: c.acc});
  const wx = interpolate(f, [at(58), at(58) + 5], [-60, 560], clamp);
  return <Sheet>
    <Sequence from={at(54)} layout="none">
      <div style={{position: 'absolute', left: 0, top: -120, width: 1080, height: 1920}}>
        <Soft data={parseData('TxtSoftBlur: текст: системе', 'системе')} theme={th} zoneH={1920} full dur={p.dur - at(54)} />
      </div>
    </Sequence>
    <W at={at(55)} x={230} y={520} text="которую" />
    <W at={at(56)} x={560} y={600} text="ты" />
    <W at={at(57)} x={830} y={520} text="создаёшь" />
    <W at={at(58)} x={540} y={1040} text="каждый день" serif italic size={64} />
    <Pix name="cal" x={780} y={1290} cell={10} at={at(58)} />
    {f >= at(58) ? <Pix name={f >= at(59) ? (Math.floor(f / 4) % 2 ? 'wave' : 'stand') : 'stand'} x={wx} y={1290} cell={11} /> : null}
  </Sheet>;
};

/* CLICK — кнопка «очевидной»: курсор появляется на «сделай», едет на «привычку», клик на «очевидной» */
export const GObvious: React.FC<SceneProps> = (p) => {
  const f = useCurrentFrame(); const at = useAt(p); const c = C();
  const clickF = at(26); const pressed = f >= clickF && f < clickF + 4; const on = f >= clickF;
  const cx = interpolate(f, [at(25), clickF - 1], [860, 600], clamp), cy = interpolate(f, [at(25), clickF - 1], [1260, 900], clamp);
  return <Sheet>
    <W at={0} x={540} y={420} text="2." size={52} color={c.muted} />
    <W at={at(23)} x={280} y={600} text="сделай" />
    <W at={at(24)} x={540} y={680} text="полезную" />
    <W at={at(25)} x={800} y={600} text="привычку" />
    <div style={{position: 'absolute', left: 540, top: 880, translate: '-50% -50%', scale: pressed ? '0.95' : '1', border: `4px solid ${c.ink}`, background: on ? c.ink : '#fff', color: on ? '#fff' : c.ink,
      padding: '22px 48px 28px', fontFamily: SANS, fontWeight: 700, fontSize: 96, letterSpacing: -3, whiteSpace: 'nowrap'}}>очевидной</div>
    {f >= at(23) ? <Cursor x={cx} y={cy} press={pressed} /> : null}
  </Sheet>;
};

/* CARD — «секрет / не / в / силе / воли» рассыпаются по листу, на «воли» тонкая линия зачёркивает «силе воли» */
export const GNotWill: React.FC<SceneProps> = (p) => {
  const f = useCurrentFrame(); const at = useAt(p); const c = C();
  const l = interpolate(f, [at(51) + 3, at(51) + 9], [0, 1], clamp);
  return <Sheet>
    <W at={at(47)} x={300} y={560} text="секрет" size={64} />
    <W at={at(48)} x={780} y={640} text="не" size={64} />
    <W at={at(49)} x={260} y={820} text="в" size={64} />
    <W at={at(50)} x={460} y={980} text="силе" size={150} />
    <W at={at(51)} x={760} y={1150} text="воли" size={150} />
    <svg width={1080} height={1920} style={{position: 'absolute', inset: 0}}>
      {l > 0 ? <path d={`M320 975 L${320 + 600 * l} ${975 + 185 * l}`} stroke={c.ink} strokeWidth={6} strokeLinecap="round" /> : null}
    </svg>
  </Sheet>;
};

export const GOALS: Record<string, React.FC<SceneProps>> = {GNotWill, GObvious, GHook, GStuck, GTwo, GBook, GCard, GKit, GType, GPhone, GClick, GWill, GFinal};
