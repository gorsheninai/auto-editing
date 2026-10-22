import React from 'react';
import {AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig} from 'remotion';
import {evolvePath} from '@remotion/paths';
import {BlockProps, SANS, SERIF, beats, clamp, fmtNum, pop, ramp, rad} from './kit';

/* Моушн-сцены с цифрами. Написаны для студии (идеи — remocn, remotion-scenes), вертикаль 1080 × zoneH. */

const Title: React.FC<{text: string; at?: number; color: string; accent: string; size?: number}> = ({text, at = 0, color, accent, size = 64}) => {
  const f = useCurrentFrame(); const k = ramp(f, at, at + 14);
  if (!text) return null;
  const words = text.split(' ');
  return <div style={{fontFamily: SANS, fontWeight: 700, fontSize: size, lineHeight: 1.05, letterSpacing: -2, color, textAlign: 'center', opacity: k, translate: `0 ${(1 - k) * 30}px`, padding: '0 70px', textWrap: 'balance' as never}}>
    {words.map((w, i) => i === words.length - 1 && words.length > 1 ? <span key={i} style={{fontFamily: SERIF, fontStyle: 'italic', fontWeight: 500, color: accent}}>{w}</span> : <span key={i}>{w} </span>)}
  </div>;
};
const Count: React.FC<{v: number; like: string; at: number; len?: number}> = ({v, like, at, len = 22}) => {
  const f = useCurrentFrame();
  const x = interpolate(f, [at, at + len], [0, v], {...clamp, easing: (t) => 1 - Math.pow(1 - t, 3)});
  return <>{fmtNum(x, like)}</>;
};
/* В режиме C (весь кадр) сцена крупнее: zoom 1.3, в B — как есть под зону над окном спикера */
const Zone: React.FC<{h: number; children: React.ReactNode; gap?: number; top?: number; full?: boolean}> = ({h, children, gap = 40, top = 0, full}) =>
  <AbsoluteFill style={{height: h, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap, paddingTop: top}}>
    <div style={{display: 'flex', flexDirection: 'column', alignItems: 'center', gap, zoom: full ? 1.15 : 1}}>{children}</div></AbsoluteFill>;
const ensure = (p: BlockProps, demo: [string, string][]) => p.data.items.length ? p.data.items : demo.map(([label, shown]) => ({label, shown, raw: shown, value: parseFloat(shown.replace(/\s/g, '').replace(',', '.'))}));

/* MBars — столбики пружинят снизу, над ними счётчики, самый большой — акцентом */
export const MBars: React.FC<BlockProps> = (p) => {
  const f = useCurrentFrame(); const {fps} = useVideoConfig(); const T = p.theme;
  const items = ensure(p, [['я', '3'], ['они', '30']]).slice(0, 5);
  const max = Math.max(...items.map((i) => i.value || 0), 1);
  const at = beats(items.length, p.dur, p.marks, 14);
  const H = Math.min(p.zoneH * (p.full ? 0.36 : 0.42), 640); const W = Math.min(220, 820 / items.length - 30);
  return <Zone full={p.full} h={p.zoneH} gap={50}>
    <Title text={p.data.title} color={T.ink} accent={T.accent} />
    <div style={{display: 'flex', alignItems: 'flex-end', gap: 36, height: H + 190}}>
      {items.map((it, i) => {
        const k = pop(f, fps, at[i], 13); const h = Math.max(8, (it.value || 0) / max * H) * k;
        const big = (it.value || 0) === max;
        return <div key={i} style={{display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14}}>
          <div style={{fontFamily: SANS, fontWeight: 800, fontSize: 58, color: big ? T.accent : T.ink, opacity: Math.min(1, k * 2), letterSpacing: -2}}><Count v={it.value || 0} like={it.shown} at={at[i]} /></div>
          <div style={{width: W, height: h, borderRadius: rad(26), background: big ? T.accent : i % 2 ? T.soft : T.accent2, boxShadow: big ? `0 20px 50px ${T.accent}55` : 'none'}} />
          <div style={{fontFamily: SANS, fontWeight: 600, fontSize: 40, color: T.muted, opacity: ramp(f, at[i], at[i] + 10), maxWidth: W + 30, textAlign: 'center', lineHeight: 1.05}}>{it.label}</div>
        </div>;
      })}
    </div>
  </Zone>;
};

/* MGrowth — линия графика рисуется, впереди бежит точка, в конце плашка с итогом */
export const MGrowth: React.FC<BlockProps> = (p) => {
  const f = useCurrentFrame(); const T = p.theme;
  let vals = p.data.items.filter((i) => i.value != null).map((i) => i.value as number);
  if (vals.length < 2) vals = [2, 3, 2.6, 4.2, 4, 6.4, 9];
  const down = vals[vals.length - 1] < vals[0];
  const W = p.full ? 720 : 900, H = Math.min(p.zoneH * (p.full ? 0.32 : 0.46), 600), min = Math.min(...vals), max = Math.max(...vals);
  const pts = vals.map((v, i) => [i / (vals.length - 1) * W, H - (v - min) / (max - min || 1) * H * 0.86 - H * 0.07]);
  const d = pts.map(([x, y], i) => i ? `C ${pts[i - 1][0] + W / (vals.length - 1) / 2} ${pts[i - 1][1]} ${x - W / (vals.length - 1) / 2} ${y} ${x} ${y}` : `M ${x} ${y}`).join(' ');
  const prog = ramp(f, 10, Math.max(30, p.dur * 0.6));
  const ev = evolvePath(prog, d);
  const idx = prog * (pts.length - 1), a = Math.floor(idx), b = Math.min(pts.length - 1, a + 1), t = idx - a;
  const head = [pts[a][0] + (pts[b][0] - pts[a][0]) * t, pts[a][1] + (pts[b][1] - pts[a][1]) * t];
  const col = down ? T.accent2 : T.accent;
  const last = p.data.items[p.data.items.length - 1];
  const endK = ramp(f, p.dur * 0.6, p.dur * 0.6 + 12);
  return <Zone full={p.full} h={p.zoneH} gap={40}>
    <Title text={p.data.title} color={T.ink} accent={col} />
    <svg width={W + 80} height={H + 150} viewBox={`-40 -130 ${W + 80} ${H + 150}`} style={{overflow: 'visible'}}>
      {[0.25, 0.5, 0.75, 1].map((g) => <line key={g} x1={0} x2={W} y1={H * g} y2={H * g} stroke={T.line} strokeWidth={3} strokeDasharray="10 14" />)}
      <path d={`${d} L ${W} ${H} L 0 ${H} Z`} fill={col} opacity={0.13} style={{clipPath: `inset(0 ${(1 - prog) * 100}% 0 0)`}} />
      <path d={d} fill="none" stroke={col} strokeWidth={14} strokeLinecap="round" strokeDasharray={ev.strokeDasharray} strokeDashoffset={ev.strokeDashoffset} />
      <circle cx={head[0]} cy={head[1]} r={22} fill={T.card} stroke={col} strokeWidth={10} />
      <g transform={`translate(${head[0]} ${head[1] - 70}) scale(${endK})`} opacity={endK}>
        <rect x={-120} y={-52} width={240} height={88} rx={44} fill={col} />
        <text x={0} y={8} textAnchor="middle" style={{fontFamily: SANS}} fontWeight={800} fontSize={46} fill="#fff">{last && last.value != null ? last.shown : down ? '↓' : '↑ рост'}</text>
      </g>
    </svg>
  </Zone>;
};

/* MShare — кольцевая диаграмма раскрывается по долям, в центре считает первую долю, ниже легенда */
export const MShare: React.FC<BlockProps> = (p) => {
  const f = useCurrentFrame(); const T = p.theme;
  const items = ensure(p, [['ничего не делают', '80%'], ['делают', '20%']]).slice(0, 4);
  const sum = items.reduce((s, i) => s + (i.value || 0), 0) || 1;
  const cols = [T.accent, T.accent2, T.soft, T.muted];
  const R = Math.min(300, p.zoneH * 0.24), SW = R * 0.42, C = 2 * Math.PI * R;
  let acc = 0;
  const at = beats(items.length, p.dur, p.marks, 10);
  return <Zone full={p.full} h={p.zoneH} gap={44}>
    <Title text={p.data.title} color={T.ink} accent={T.accent} />
    <div style={{position: 'relative', width: (R + SW) * 2, height: (R + SW) * 2}}>
      <svg width={(R + SW) * 2} height={(R + SW) * 2} style={{rotate: '-90deg'}}>
        <circle cx={R + SW} cy={R + SW} r={R} fill="none" stroke={T.line} strokeWidth={SW} />
        {items.map((it, i) => {
          const part = (it.value || 0) / sum; const k = ramp(f, at[i], at[i] + 20); const off = acc; acc += part;
          return <circle key={i} cx={R + SW} cy={R + SW} r={R} fill="none" stroke={cols[i]} strokeWidth={SW * (i === 0 ? 1.12 : 1)} strokeDasharray={`${Math.max(0, part * C * k - 6)} ${C}`} strokeDashoffset={-off * C} />;
        })}
      </svg>
      <div style={{position: 'absolute', inset: 0, display: 'grid', placeItems: 'center', fontFamily: SANS, fontWeight: 800, fontSize: R * 0.5, color: T.ink, letterSpacing: -4}}>
        <Count v={(items[0].value || 0) / sum * 100} like="%" at={at[0]} len={20} />
      </div>
    </div>
    <div style={{display: 'flex', flexDirection: 'column', gap: 12, alignItems: 'flex-start'}}>
      {items.map((it, i) => <div key={i} style={{display: 'flex', alignItems: 'center', gap: 18, fontFamily: SANS, fontWeight: 600, fontSize: 42, color: T.ink, opacity: ramp(f, at[i] + 6, at[i] + 16)}}>
        <i style={{width: 30, height: 30, borderRadius: rad(8), background: cols[i], display: 'block'}} />{it.label}<span style={{color: T.muted}}>{it.shown !== it.label ? it.shown : ''}</span></div>)}
    </div>
  </Zone>;
};

/* MTop — топ строками: место, подпись, значение; первая строка крупнее и акцентом */
export const MTop: React.FC<BlockProps> = (p) => {
  const f = useCurrentFrame(); const {fps} = useVideoConfig(); const T = p.theme;
  const items = ensure(p, [['ChatGPT', '800 млн'], ['Gemini', '400 млн'], ['Claude', '100 млн']]).slice(0, 5);
  const at = beats(items.length, p.dur, p.marks, 12).reverse();
  const rowH = Math.min(150, (p.zoneH * 0.62) / items.length);
  return <Zone full={p.full} h={p.zoneH} gap={36}>
    <Title text={p.data.title} color={T.ink} accent={T.accent} />
    <div style={{display: 'flex', flexDirection: 'column', gap: 18, width: 860}}>
      {items.map((it, i) => {
        const k = pop(f, fps, at[i], 14); const first = i === 0;
        return <div key={i} style={{height: rowH, display: 'flex', alignItems: 'center', gap: 26, padding: '0 34px', borderRadius: rad(30), background: first ? T.accent : T.card, color: first ? '#fff' : T.ink,
          boxShadow: first ? `0 18px 44px ${T.accent}55` : `0 6px 20px rgba(0,0,0,.06)`, opacity: Math.min(1, k * 1.5), translate: `${(1 - k) * 160}px 0`, scale: first ? '1.03' : '1'}}>
          <span style={{fontFamily: SERIF, fontStyle: 'italic', fontWeight: 600, fontSize: rowH * 0.55, width: rowH * 0.6, opacity: first ? 1 : 0.5}}>{i + 1}</span>
          <span style={{flex: 1, fontFamily: SANS, fontWeight: 700, fontSize: rowH * 0.36, letterSpacing: -1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis'}}>{it.label}</span>
          {it.value != null ? <span style={{fontFamily: SANS, fontWeight: 800, fontSize: rowH * 0.34}}><Count v={it.value} like={it.shown} at={at[i]} /></span> : null}
        </div>;
      })}
    </div>
  </Zone>;
};

/* MTimeline — вертикальная ось рисуется сверху вниз, точки-годы загораются по очереди */
export const MTimeline: React.FC<BlockProps> = (p) => {
  const f = useCurrentFrame(); const {fps} = useVideoConfig(); const T = p.theme;
  const items = ensure(p, [['2019', 'начал снимать'], ['2023', '100 тысяч'], ['сейчас', 'миллион']]).slice(0, 5);
  const at = beats(items.length, p.dur, p.marks, 12);
  const gap = Math.min(230, (p.zoneH * 0.66) / items.length); const L = gap * (items.length - 1);
  const draw = interpolate(f, [at[0], at[items.length - 1] + 6], [0, 1], clamp);
  return <Zone full={p.full} h={p.zoneH} gap={40}>
    <Title text={p.data.title} color={T.ink} accent={T.accent} />
    <div style={{position: 'relative', width: 860, height: L + 80}}>
      <div style={{position: 'absolute', left: 300, top: 40, width: 10, height: L, borderRadius: rad(5), background: T.line}} />
      <div style={{position: 'absolute', left: 300, top: 40, width: 10, height: L * draw, borderRadius: rad(5), background: T.accent}} />
      {items.map((it, i) => {
        const k = pop(f, fps, at[i], 11); const now = i === items.length - 1;
        return <div key={i} style={{position: 'absolute', left: 0, top: 40 + i * gap - 40, height: 80, width: 860, display: 'flex', alignItems: 'center'}}>
          <div style={{width: 260, textAlign: 'right', fontFamily: SERIF, fontStyle: 'italic', fontWeight: 600, fontSize: 64, color: now ? T.accent : T.ink, opacity: Math.min(1, k * 1.4)}}>{it.label}</div>
          <div style={{width: 46, height: 46, margin: '0 37px 0 20px', borderRadius: '50%', background: now ? T.accent : T.card, border: `9px solid ${T.accent}`, scale: String(k), flex: 'none'}} />
          <div style={{flex: 1, fontFamily: SANS, fontWeight: 700, fontSize: 46, color: T.ink, lineHeight: 1.05, letterSpacing: -1, opacity: ramp(f, at[i] + 4, at[i] + 14), translate: `${(1 - ramp(f, at[i] + 4, at[i] + 14)) * 40}px 0`}}>{it.shown !== it.label ? it.shown : ''}</div>
        </div>;
      })}
    </div>
  </Zone>;
};

/* MGauge — полукруглая шкала из трёх зон, стрелка с перелётом едет к значению (0–100) */
export const MGauge: React.FC<BlockProps> = (p) => {
  const f = useCurrentFrame(); const {fps} = useVideoConfig(); const T = p.theme;
  const it = p.data.items[0]; const v = Math.max(0, Math.min(100, it && it.value != null ? it.value : 82));
  const R = 360, cx = 450, cy = 420;
  const k = pop(f, fps, 14, 9); const ang = -180 + v / 100 * 180 * k;
  const arc = (a0: number, a1: number) => { const p0 = [cx + R * Math.cos(a0 * Math.PI / 180), cy + R * Math.sin(a0 * Math.PI / 180)], p1 = [cx + R * Math.cos(a1 * Math.PI / 180), cy + R * Math.sin(a1 * Math.PI / 180)]; return `M ${p0[0]} ${p0[1]} A ${R} ${R} 0 0 1 ${p1[0]} ${p1[1]}`; };
  const app = ramp(f, 0, 12);
  return <Zone full={p.full} h={p.zoneH} gap={20}>
    <Title text={p.data.title} color={T.ink} accent={T.accent2} />
    <svg width={900} height={520} style={{opacity: app}}>
      <path d={arc(-180, -122)} stroke="#4CC38A" strokeWidth={70} fill="none" />
      <path d={arc(-118, -62)} stroke="#F2B53B" strokeWidth={70} fill="none" />
      <path d={arc(-58, 0)} stroke={T.accent2} strokeWidth={70} fill="none" />
      <g transform={`rotate(${ang} ${cx} ${cy})`}><path d={`M ${cx} ${cy - 18} L ${cx + R - 40} ${cy} L ${cx} ${cy + 18} Z`} fill={T.ink} /></g>
      <circle cx={cx} cy={cy} r={40} fill={T.ink} /><circle cx={cx} cy={cy} r={16} fill={T.bg} />
    </svg>
    <div style={{fontFamily: SANS, fontWeight: 800, fontSize: 110, color: T.ink, letterSpacing: -4, marginTop: -40}}><Count v={v} like={it && /%/.test(it.shown) ? '%' : ''} at={14} len={26} /></div>
    {it && it.label !== it.shown ? <div style={{fontFamily: SANS, fontWeight: 600, fontSize: 44, color: T.muted, opacity: ramp(f, 30, 42)}}>{it.label}</div> : null}
  </Zone>;
};

/* MVersus — две колонки, пункты появляются попеременно слева и справа.
   Данные: «MVersus: фриланс — свобода, свой график | офис — стабильность, зарплата» */
export const MVersus: React.FC<BlockProps> = (p) => {
  const f = useCurrentFrame(); const {fps} = useVideoConfig(); const T = p.theme;
  const cols = (p.data.items.length >= 2 ? p.data.items.slice(0, 2) : [{label: 'фриланс', shown: 'свобода, свой график, нет оклада'}, {label: 'офис', shown: 'стабильность, оклад, начальник'}] as never[])
    .map((it: {label: string; shown: string}) => ({head: it.label, rows: it.shown.split(/\s*,\s*/).filter(Boolean).slice(0, 4)}));
  const n = Math.max(cols[0].rows.length, cols[1].rows.length);
  const at = beats(n * 2, p.dur, p.marks, 18);
  const colors = [T.accent, T.accent2];
  return <Zone full={p.full} h={p.zoneH} gap={30}>
    <Title text={p.data.title} color={T.ink} accent={T.accent} size={58} />
    <div style={{display: 'flex', gap: 26, alignItems: 'flex-start', position: 'relative'}}>
      <div style={{position: 'absolute', left: '50%', top: 60, translate: '-50% -50%', zIndex: 2, width: 110, height: 110, borderRadius: '50%', background: T.ink, color: T.bg, border: `6px solid ${T.bg}`, display: 'grid', placeItems: 'center', fontFamily: SERIF, fontStyle: 'italic', fontWeight: 700, fontSize: 52, lineHeight: 1, paddingBottom: 8, scale: String(pop(f, fps, 10, 9))}}>vs</div>
      {cols.map((c, ci) => {
        const hk = pop(f, fps, 4 + ci * 5, 13);
        return <div key={ci} style={{width: 420, display: 'flex', flexDirection: 'column', gap: 16}}>
          <div style={{height: 120, borderRadius: rad(30), background: colors[ci], color: '#fff', display: 'grid', placeItems: 'center', fontFamily: SANS, fontWeight: 800, fontSize: 54, letterSpacing: -1.5, scale: String(hk)}}>{c.head}</div>
          {c.rows.map((r, ri) => { const k = pop(f, fps, at[ri * 2 + ci], 14); return <div key={ri} style={{minHeight: 104, borderRadius: rad(24), background: T.card, border: `4px solid ${colors[ci]}33`, display: 'flex', alignItems: 'center', gap: 14, padding: '14px 24px',
            fontFamily: SANS, fontWeight: 600, fontSize: 38, lineHeight: 1.1, color: T.ink, opacity: Math.min(1, k * 1.5), translate: `${(1 - k) * (ci ? 90 : -90)}px 0`}}>
            <span style={{color: colors[ci], fontWeight: 800, fontSize: 44}}>•</span>{r}</div>; })}
        </div>;
      })}
    </div>
  </Zone>;
};
