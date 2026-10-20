import React from 'react';
import {AbsoluteFill, Img, interpolate, useCurrentFrame, Easing} from 'remotion';
import {C, S, SANS, Split, clamp, ease, pop, serifIt, wf} from './kit';

type P = {from: number; dur: number};
const draw = Easing.bezier(0.33, 0, 0.2, 1);

/** two-line headline: italic + grotesk, appears at `at` */
const Head: React.FC<{at: number; it: string; bold: string; top?: number}> = ({at, it, bold, top = 70}) => {
  const fr = useCurrentFrame();
  const o = interpolate(fr, [at, at + 8], [0, 1], clamp);
  const y = interpolate(fr, [at, at + 14], [24, 0], {...clamp, easing: ease});
  return (
    <div style={{position: 'absolute', top, left: 40, right: 40, textAlign: 'center', opacity: o, translate: `0px ${y}px`}}>
      <div style={{...serifIt, fontSize: 96, color: C.ink, lineHeight: 1}}>{it}</div>
      <div style={{fontFamily: SANS, fontWeight: 700, fontSize: 84, letterSpacing: -2.5, color: C.ink, lineHeight: 1.05}}>{bold}</div>
    </div>
  );
};

/** round node with a sticker inside and a label under it */
const Node: React.FC<{at: number; x: number; y: number; r?: number; src: string; label?: string; num?: string; active?: boolean; labelPos?: 'below' | 'above' | 'right' | 'left'}> = ({at, x, y, r = 92, src, label, num, labelPos = 'below'}) => {
  const fr = useCurrentFrame();
  if (fr < at - 1) return (
    <div style={{position: 'absolute', left: x - r, top: y - r, width: r * 2, height: r * 2, borderRadius: '50%', border: `4px dashed ${C.lav}`}} />
  );
  const s = pop(fr, at);
  const side = labelPos === 'right' || labelPos === 'left';
  const ly = labelPos === 'below' ? y + r + 16 : labelPos === 'above' ? y - r - 80 : y - 32;
  const lx = labelPos === 'right' ? x + r + 24 : labelPos === 'left' ? x - r - 24 - 320 : x - 160;
  return (
    <>
      <div style={{position: 'absolute', left: x - r, top: y - r, width: r * 2, height: r * 2, borderRadius: '50%', background: '#fff',
        boxShadow: `0 0 0 6px ${C.violet}, 0 18px 40px rgba(123,97,255,0.25)`, scale: String(s), display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
        <Img src={S(src)} style={{width: r * 1.35, height: r * 1.35, objectFit: 'contain'}} />
        {num && <div style={{position: 'absolute', top: -14, left: -14, width: 52, height: 52, borderRadius: '50%', background: C.orange, color: '#fff', fontFamily: SANS, fontWeight: 700, fontSize: 30, display: 'flex', alignItems: 'center', justifyContent: 'center'}}>{num}</div>}
      </div>
      {label && (
        <div style={{position: 'absolute', left: lx, width: 320, top: ly, textAlign: side ? (labelPos === 'right' ? 'left' : 'right') : 'center', fontFamily: SANS, fontWeight: 700, fontSize: 50, letterSpacing: -1.5, color: C.ink,
          opacity: interpolate(fr, [at + 3, at + 9], [0, 1], clamp), translate: `0px ${interpolate(fr, [at + 3, at + 12], [14, 0], {...clamp, easing: ease})}px`}}>{label}</div>
      )}
    </>
  );
};

/** svg path that draws itself between `a` and `b` frames */
const Line: React.FC<{d: string; a: number; b: number; color?: string; w?: number; len?: number; dash?: boolean}> = ({d, a, b, color = C.violet, w = 10, len = 2000, dash}) => {
  const fr = useCurrentFrame();
  const p = interpolate(fr, [a, b], [0, 1], {...clamp, easing: draw});
  return (
    <svg width={1080} height={1130} style={{position: 'absolute', left: 0, top: 0, overflow: 'visible'}}>
      {dash && <path d={d} stroke={C.lav} strokeWidth={w} fill="none" strokeLinecap="round" strokeDasharray="4 22" />}
      <path d={d} stroke={color} strokeWidth={w} fill="none" strokeLinecap="round" strokeLinejoin="round" strokeDasharray={len} strokeDashoffset={len * (1 - p)} />
    </svg>
  );
};

// =========================================================================
// 1 — "10 лет назад путь был простым: образование, стажировка, развитие навыков и рост зарплаты"
export const MPath: React.FC<P> = ({from}) => {
  const fr = useCurrentFrame();
  const t = (w: string, o = 0) => wf(w, o) - from;
  const nodes: [string, string, string, number, number][] = [
    ['образование', 'items/cap.png', 'образование', 230, 420],
    ['стажировка', 'items/badge.png', 'стажировка', 850, 420],
    ['развитие', 'items/wrench.png', 'навыки', 850, 760],
    ['зарплаты', 'items/coins.png', 'зарплата', 230, 760],
  ];
  const at = nodes.map(([w]) => t(w));
  const d = 'M 230 420 L 850 420 C 1020 420 1020 760 850 760 L 230 760';
  return (
    <Split from={from}>
      <Head at={0} it="10 лет назад" bold="путь был простым" top={60} />
      <Line d={d} a={at[0]} b={at[3]} len={1700} w={12} dash />
      {nodes.map(([, src, label, x, y], i) => (
        <Node key={label} at={at[i]} x={x} y={y} r={115} src={src} label={label} num={String(i + 1)} labelPos="below" />
      ))}
      {fr >= at[3] + 8 && (
        <div style={{position: 'absolute', left: 410, top: 700, scale: String(pop(fr, at[3] + 8)), background: C.orange, color: '#fff', borderRadius: 999,
          padding: '10px 30px', fontFamily: SANS, fontWeight: 700, fontSize: 54, letterSpacing: -1.5, boxShadow: '0 14px 30px rgba(255,106,43,0.35)'}}>↑ рост</div>
      )}
    </Split>
  );
};

// =========================================================================
// 2 — "Обучиться один раз уже недостаточно: бизнесу нужен быстрый и дешёвый результат,
//      а нейросети выполняют многие задачи в разы быстрее человека"
const Stamp: React.FC<{at: number; x: number; y: number; text: string; icon: string; color: string; rot: number}> = ({at, x, y, text, icon, color, rot}) => {
  const fr = useCurrentFrame();
  if (fr < at) return null;
  const s = interpolate(fr, [at, at + 5], [2.2, 1], {...clamp, easing: Easing.out(Easing.back(2))});
  return (
    <div style={{position: 'absolute', left: x, top: y, translate: '-50% -50%', scale: String(s), rotate: `${rot}deg`, display: 'flex', alignItems: 'center', gap: 14,
      background: color, color: '#fff', padding: '14px 34px 14px 18px', borderRadius: 26, boxShadow: '0 18px 40px rgba(28,27,34,0.2)'}}>
      <Img src={S(icon)} style={{width: 120, height: 120, objectFit: 'contain'}} />
      <span style={{fontFamily: SANS, fontWeight: 700, fontSize: 96, letterSpacing: -2}}>{text}</span>
    </div>
  );
};
const Lane: React.FC<{y: number; label: string; face: React.ReactNode; a: number; b: number; to: number; color: string; tasks: number}> = ({y, label, face, a, b, to, color, tasks}) => {
  const fr = useCurrentFrame();
  const p = interpolate(fr, [a, b], [0, to], {...clamp, easing: Easing.out(Easing.quad)});
  const n = Math.max(1, Math.round(interpolate(fr, [a, b], [0, tasks], clamp)));
  return (
    <div style={{position: 'absolute', left: 50, right: 50, top: y, height: 190, opacity: interpolate(fr, [a - 8, a], [0, 1], clamp)}}>
      <div style={{position: 'absolute', left: 0, top: 20, width: 150, height: 150, borderRadius: '50%', overflow: 'hidden', background: '#fff', boxShadow: `0 0 0 5px ${color}`}}>{face}</div>
      <div style={{position: 'absolute', left: 180, top: 0, fontFamily: SANS, fontWeight: 700, fontSize: 52, color: C.ink, letterSpacing: -1}}>{label}</div>
      <div style={{position: 'absolute', left: 180, right: 170, top: 80, height: 70, borderRadius: 35, background: 'rgba(207,198,255,0.45)'}}>
        <div style={{width: `${p * 100}%`, height: '100%', borderRadius: 35, background: color}} />
      </div>
      <div style={{position: 'absolute', right: 0, top: 70, width: 160, textAlign: 'right', fontFamily: SANS, fontWeight: 700, fontSize: 84, letterSpacing: -2, color}}>×{n}</div>
    </div>
  );
};
export const MRace: React.FC<P> = ({from}) => {
  const fr = useCurrentFrame();
  const t = (w: string, o = 0) => wf(w, o) - from;
  const race = t('нейросети', 1);
  const strike = interpolate(fr, [t('недостаточно'), t('недостаточно') + 8], [0, 1], {...clamp, easing: draw});
  const part1 = interpolate(fr, [race - 6, race], [1, 0], clamp);
  const face = <Img src={S('poses/thumbs.png')} style={{position: 'absolute', width: 410, left: -130, top: -8}} />;
  const robot = <Img src={S('items/robot.png')} style={{position: 'absolute', width: 130, left: 10, top: 10}} />;
  return (
    <Split from={from}>
      {/* part 1: learned once -> not enough -> fast & cheap */}
      <AbsoluteFill style={{opacity: part1}}>
        <div style={{position: 'absolute', left: 90, right: 90, top: 110, height: 300, background: '#fff', borderRadius: 34, boxShadow: '0 18px 50px rgba(28,27,34,0.12)',
          display: 'flex', alignItems: 'center', gap: 26, padding: '0 40px', scale: String(pop(fr, 0)), rotate: `${strike * -3}deg`, filter: `grayscale(${strike})`}}>
          <Img src={S('items/diploma.png')} style={{width: 220, height: 220, objectFit: 'contain'}} />
          <div>
            <div style={{...serifIt, fontSize: 84, color: C.ink, lineHeight: 1}}>обучиться</div>
            <div style={{fontFamily: SANS, fontWeight: 700, fontSize: 86, color: C.ink, letterSpacing: -2, lineHeight: 1.05}}>один раз</div>
          </div>
          <svg width={900} height={300} style={{position: 'absolute', left: 0, top: 0}}>
            <line x1={40} y1={250} x2={40 + 820 * strike} y2={50} stroke={C.orange} strokeWidth={14} strokeLinecap="round" />
          </svg>
        </div>
        <Stamp at={t('быстрый')} x={370} y={570} text="быстро" icon="items/stopwatch.png" color={C.violet} rot={-5} />
        <Stamp at={t('дешёвый')} x={700} y={770} text="дёшево" icon="items/tag.png" color={C.orange} rot={4} />
      </AbsoluteFill>
      {/* part 2: race human vs AI */}
      {fr >= race - 6 && (
        <AbsoluteFill style={{opacity: interpolate(fr, [race - 6, race], [0, 1], clamp)}}>
          <div style={{position: 'absolute', top: 60, width: '100%', textAlign: 'center'}}>
            <div style={{...serifIt, fontSize: 92, color: C.ink, lineHeight: 1}}>задачи</div><div style={{fontFamily: SANS, fontWeight: 700, fontSize: 76, letterSpacing: -2.5, color: C.ink}}>за то же время</div>
          </div>
          <Lane y={300} label="человек" face={face} a={race + 2} b={race + 70} to={0.14} color={C.green} tasks={1} />
          <Lane y={560} label="нейросеть" face={robot} a={race + 2} b={race + 22} to={1} color={C.violet} tasks={10} />
          {fr >= t('быстрее') && (
            <div style={{position: 'absolute', top: 780, width: '100%', textAlign: 'center', scale: String(pop(fr, t('быстрее')))}}>
              <span style={{...serifIt, fontSize: 110, color: C.ink}}>в разы <span style={{borderBottom: `6px solid ${C.orange}`}}>быстрее</span></span>
            </div>
          )}
        </AbsoluteFill>
      )}
    </Split>
  );
};

// =========================================================================
// 3 — "Учить управлять всем процессом: ставить задачи, выбирать инструменты, подключать ИИ и контролировать результат"
export const MCycle: React.FC<P> = ({from}) => {
  const fr = useCurrentFrame();
  const t = (w: string) => wf(w) - from;
  const cx = 540, cy = 610, R = 300;
  const steps: [string, string, string, string][] = [
    ['ставить', 'items/checklist.png', 'задачи', '1'],
    ['выбирать', 'items/toolbox.png', 'инструменты', '2'],
    ['подключать', 'items/robot.png', 'ИИ', '3'],
    ['контролировать', 'items/target.png', 'результат', '4'],
  ];
  const angs = [-90, 0, 90, 180].map((a) => (a * Math.PI) / 180);
  const pos = angs.map((a) => [cx + Math.cos(a) * R, cy + Math.sin(a) * R]);
  const at = steps.map(([w]) => t(w));
  const arc = (i: number) => {
    const [x1, y1] = pos[i], [x2, y2] = pos[(i + 1) % 4];
    return `M ${x1} ${y1} A ${R} ${R} 0 0 1 ${x2} ${y2}`;
  };
  const done = at[3] + 10;
  const orbit = fr > done ? ((fr - done) / 40) * Math.PI * 2 - Math.PI / 2 : -Math.PI / 2;
  return (
    <Split from={from}>
      <Head at={0} it="учить управлять" bold="всем процессом" top={10} />
      <svg width={1080} height={1130} style={{position: 'absolute', left: 0, top: 0}}>
        <circle cx={cx} cy={cy} r={R} stroke={C.lav} strokeWidth={8} fill="none" strokeDasharray="4 22" strokeLinecap="round" />
      </svg>
      {[0, 1, 2, 3].map((i) => (
        <Line key={i} d={arc(i)} a={at[i] + 2} b={(i < 3 ? at[i + 1] : done) - 1} len={R * Math.PI * 0.5 + 10} />
      ))}
      {/* centre */}
      <div style={{position: 'absolute', left: cx - 165, top: cy - 165, width: 330, height: 330, borderRadius: '50%', background: C.violet,
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', scale: String(pop(fr, 2)), boxShadow: '0 24px 60px rgba(123,97,255,0.35)'}}>
        <div style={{fontFamily: SANS, fontWeight: 700, fontSize: 92, color: '#fff', letterSpacing: -3, lineHeight: 0.9}}>ты</div>
        <div style={{...serifIt, fontSize: 56, color: '#fff', lineHeight: 1}}>управляешь</div>
      </div>
      {fr > done && (
        <div style={{position: 'absolute', left: cx + Math.cos(orbit) * R - 16, top: cy + Math.sin(orbit) * R - 16, width: 32, height: 32, borderRadius: '50%', background: C.orange, boxShadow: `0 0 24px ${C.orange}`}} />
      )}
      {steps.map(([, src, label, num], i) => (
        <Node key={label} at={at[i]} x={pos[i][0]} y={pos[i][1]} r={100} src={src} num={num} label={label}
          labelPos={(['right', 'below', 'left', 'below'] as const)[i]} />
      ))}
    </Split>
  );
};
