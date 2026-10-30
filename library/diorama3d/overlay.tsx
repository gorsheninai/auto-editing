// Наложения поверх 3D: заголовок хука и перекидное табло времени (CSS 3D).
import React from 'react';
import {AbsoluteFill, Easing, interpolate, useCurrentFrame} from 'remotion';
import {SANS, serifIt, wf} from '../kit';
import {cl, out} from './stage';

export const Title: React.FC<{end: number}> = ({end}) => {
  const f = useCurrentFrame();
  const a = interpolate(f, [0, 12, end - 8, end], [0, 1, 1, 0], {...cl, easing: out});
  const y = interpolate(f, [0, 14], [40, 0], {...cl, easing: out});
  const line = interpolate(f, [8, 26], [0, 1], {...cl, easing: out});
  return (
    <AbsoluteFill style={{pointerEvents: 'none'}}>
      <div style={{position: 'absolute', top: 210, left: 0, right: 0, textAlign: 'center', opacity: a, translate: `0 ${y}px`}}>
        <div style={{fontFamily: SANS, fontWeight: 700, fontSize: 132, letterSpacing: -5, lineHeight: 0.95, color: '#1C1B22'}}>Мир</div>
        <div style={{...serifIt, fontSize: 150, lineHeight: 0.95, color: '#1C1B22', marginTop: -6}}>без детей</div>
        <div style={{width: 360 * line, height: 4, background: '#C8372D', margin: '18px auto 0', borderRadius: 2}} />
        <div style={{fontFamily: SANS, fontWeight: 600, fontSize: 38, color: '#3A3740', marginTop: 16, letterSpacing: -0.5}}>80 лет за одну минуту</div>
      </div>
    </AbsoluteFill>
  );
};

const STEPS = (): [number, string][] => [
  [wf('день'), 'ДЕНЬ 1'], [wf('неделя'), 'НЕДЕЛЯ'], [wf('месяц'), 'МЕСЯЦ'], [wf('год'), '1 ГОД'], [wf('пять'), '5 ЛЕТ'],
  [wf('двадцать'), '20 ЛЕТ'], [wf('пятьдесят'), '50 ЛЕТ'], [wf('восемьдесят'), '80 ЛЕТ'],
];

const Card: React.FC<{text: string; rot: number; dark: boolean}> = ({text, rot, dark}) => (
  <div style={{
    position: 'absolute', inset: 0, borderRadius: 22, background: dark ? '#F1ECE3' : '#1E1D22',
    color: dark ? '#1E1D22' : '#F4EEE4', display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontFamily: SANS, fontWeight: 700, fontSize: 78, letterSpacing: -2, backfaceVisibility: 'hidden',
    transformOrigin: '50% 50%', rotate: `x ${rot}deg`, boxShadow: '0 18px 40px rgba(0,0,0,0.28)',
  }}>
    {text}
    <div style={{position: 'absolute', left: 0, right: 0, top: '50%', height: 3, background: dark ? 'rgba(0,0,0,0.12)' : 'rgba(0,0,0,0.55)'}} />
  </div>
);

/** Табло: на каждой отметке карточка перекидывается вокруг горизонтальной оси. */
export const Board: React.FC<{hideAt: number}> = ({hideAt}) => {
  const f = useCurrentFrame();
  const S = STEPS();
  if (f < S[0][0] - 2 || f > hideAt + 12) return null;
  let i = 0;
  while (i < S.length - 1 && f >= S[i + 1][0]) i++;
  const [at, text] = S[i];
  const prev = i > 0 ? S[i - 1][1] : '';
  const p = interpolate(f, [at, at + 9], [0, 1], {...cl, easing: Easing.bezier(0.5, 0, 0.3, 1.3)});
  const show = interpolate(f, [S[0][0] - 2, S[0][0] + 8, hideAt, hideAt + 12], [0, 1, 1, 0], cl);
  const dark = f > wf('пятьдесят') - 2;
  return (
    <AbsoluteFill style={{pointerEvents: 'none'}}>
      <div style={{position: 'absolute', top: 150, left: 0, right: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', opacity: show,
        translate: `0 ${interpolate(show, [0, 1], [-30, 0])}px`}}>
        <div style={{fontFamily: SANS, fontWeight: 600, fontSize: 26, letterSpacing: 6, color: dark ? 'rgba(255,255,255,0.85)' : 'rgba(28,27,34,0.75)', marginBottom: 14}}>
          БЕЗ НОВЫХ РОЖДЕНИЙ
        </div>
        <div style={{position: 'relative', width: 400, height: 132, perspective: 900}}>
          {prev && p < 0.5 && <Card text={prev} rot={-90 * Math.min(1, p * 2)} dark={dark} />}
          <Card text={text} rot={interpolate(p, [0.5, 1], [90, 0], cl)} dark={dark} />
        </div>
      </div>
    </AbsoluteFill>
  );
};
