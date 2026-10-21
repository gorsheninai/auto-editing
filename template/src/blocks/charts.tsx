import React from 'react';
import {AbsoluteFill, Easing, interpolate, spring, useCurrentFrame, useVideoConfig} from 'remotion';
import {BlockProps, SANS, SERIF, clamp, fmtNum, ramp} from './kit';

/* Графики (идеи: remotion-ui bar-chart-race / funnel / sparkline-row, onda stat-card, GitHub-активность), написаны для студии. */

const nums = (s: string) => (s.match(/-?\d[\d\s]*(?:[.,]\d+)?\s*(?:тыс|млн|млрд|k|к)?/gi) || []).map((x) => {
  let v = parseFloat(x.replace(/\s/g, '').replace(',', '.').replace(/[^\d.-]/g, '')); if (/тыс|k|к/i.test(x)) v *= 1e3; if (/млн/i.test(x)) v *= 1e6; if (/млрд/i.test(x)) v *= 1e9; return v; });
const Title: React.FC<{t: string; c: string; a: string; f: number}> = ({t, c, a, f}) => {
  if (!t) return null; const w = t.split(' ');
  return <div style={{fontFamily: SANS, fontWeight: 700, fontSize: 62, letterSpacing: -2, color: c, textAlign: 'center', opacity: ramp(f, 0, 12), padding: '0 60px', lineHeight: 1.05}}>
    {w.map((x, i) => i === w.length - 1 && w.length > 1 ? <span key={i} style={{fontFamily: SERIF, fontStyle: 'italic', fontWeight: 500, color: a}}>{x}</span> : <span key={i}>{x} </span>)}</div>;
};
const Col: React.FC<{p: BlockProps; children: React.ReactNode; gap?: number}> = ({p, children, gap = 44}) =>
  <AbsoluteFill style={{height: p.zoneH, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap}}><div style={{display: 'flex', flexDirection: 'column', alignItems: 'center', gap, zoom: p.full ? 1.12 : 1}}>{children}</div></AbsoluteFill>;

/* MBarRace — гонка столбиков: значения растут от → до, строки обгоняют друг друга. «MBarRace: ChatGPT — 10 → 800 | Gemini — 40 → 400 | годы: 2022 → 2025» */
export const MBarRace: React.FC<BlockProps> = (p) => {
  const f = useCurrentFrame(); const T = p.theme;
  const yrs = p.data.items.find((i) => /^год/i.test(i.label)); const yy = yrs ? nums(yrs.shown) : [2022, 2025];
  const rows = (p.data.items.filter((i) => i !== yrs).length ? p.data.items.filter((i) => i !== yrs).map((i) => { const n = nums(i.shown); return {l: i.label, a: n.length > 1 ? n[0] : 0, b: n.length > 1 ? n[1] : n[0] || 0, like: i.shown.split(/→|->/).pop() || ''}; })
    : [{l: 'Claude', a: 5, b: 520, like: '520'}, {l: 'ChatGPT', a: 100, b: 800, like: '800'}, {l: 'Gemini', a: 60, b: 400, like: '400'}, {l: 'Copilot', a: 80, b: 150, like: '150'}, {l: 'DeepSeek', a: 0, b: 300, like: '300'}]).slice(0, 6);
  const t = interpolate(f, [10, p.dur * 0.75], [0, 1], {...clamp, easing: Easing.inOut(Easing.cubic)});
  const cur = rows.map((r) => ({...r, v: r.a + (r.b - r.a) * t})); const max = Math.max(...cur.map((r) => r.v), 1);
  const order = [...cur].sort((x, y) => y.v - x.v); const H = 110, cols = [T.accent, T.accent2, '#3CC57B', '#F2B53B', '#2F9BEA', T.soft];
  const year = Math.round(yy[0] + ((yy[1] ?? yy[0]) - yy[0]) * t);
  return <Col p={p} gap={30}>
    <Title t={p.data.title} c={T.ink} a={T.accent} f={f} />
    <div style={{position: 'relative', width: 920, height: rows.length * (H + 18)}}>
      {cur.map((r, i) => { const rank = order.indexOf(r); const w = Math.max(0.04, r.v / max) * 640;
        return <div key={i} style={{position: 'absolute', left: 0, top: rank * (H + 18), height: H, display: 'flex', alignItems: 'center', gap: 18, width: 920, transition: 'none'}}>
          <div style={{width: 210, textAlign: 'right', fontFamily: SANS, fontWeight: 700, fontSize: 40, color: T.ink, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis'}}>{r.l}</div>
          <div style={{width: w, height: H - 20, borderRadius: 18, background: cols[i % cols.length]}} />
          <div style={{fontFamily: SANS, fontWeight: 800, fontSize: 40, color: T.ink, fontVariantNumeric: 'tabular-nums'}}>{fmtNum(r.v, r.like)}</div></div>; })}
      <div style={{position: 'absolute', right: 0, bottom: -110, fontFamily: SERIF, fontStyle: 'italic', fontWeight: 600, fontSize: 120, color: T.ink, opacity: 0.18}}>{year}</div>
    </div>
  </Col>;
};

/* MFunnel — воронка: ступени сужаются, считаются числа, справа конверсия. «MFunnel: увидели — 1000 | написали — 100 | купили — 10» */
export const MFunnel: React.FC<BlockProps> = (p) => {
  const f = useCurrentFrame(); const {fps} = useVideoConfig(); const T = p.theme;
  const st = (p.data.items.filter((i) => i.value != null).length ? p.data.items.filter((i) => i.value != null) : [{label: 'увидели', value: 10000, shown: '10 000'}, {label: 'написали', value: 400, shown: '400'}, {label: 'созвонились', value: 120, shown: '120'}, {label: 'купили', value: 30, shown: '30'}]).slice(0, 5);
  const gap = Math.max(14, Math.floor((p.dur * 0.6) / st.length)); const cols = [T.accent, '#9A86FF', T.accent2, '#F2B53B', '#3CC57B'];
  return <Col p={p} gap={34}>
    <Title t={p.data.title} c={T.ink} a={T.accent} f={f} />
    <div style={{display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12}}>
      {st.map((s, i) => { const at = 8 + i * gap; const k = spring({frame: f - at, fps, config: {damping: 14, stiffness: 160}}); const w = 900 - i * (420 / Math.max(1, st.length - 1));
        const conv = i > 0 ? Math.round(((s.value as number) / (st[i - 1].value as number)) * 1000) / 10 : null;
        return <React.Fragment key={i}>{conv != null ? <div style={{fontFamily: SANS, fontSize: 30, fontWeight: 700, color: T.muted, marginTop: -4, marginBottom: -4, opacity: ramp(f, at, at + 10)}}>↓ {String(conv).replace('.', ',')}%</div> : null}<div style={{position: 'relative', width: w, height: 128, scale: `${k} 1`, opacity: Math.min(1, k * 1.5), clipPath: 'polygon(0 0, 100% 0, 96% 100%, 4% 100%)', background: cols[i % cols.length], display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 18, color: '#fff', fontFamily: SANS}}>
          <span style={{fontWeight: 800, fontSize: 54, fontVariantNumeric: 'tabular-nums'}}>{fmtNum(interpolate(f, [at, at + 18], [0, s.value as number], clamp), s.shown)}</span>
          <span style={{fontWeight: 600, fontSize: 38, opacity: 0.9}}>{s.label}</span>
        </div></React.Fragment>; })}
    </div>
  </Col>;
};

/* MKpi — карточки показателей с мини-графиками. «MKpi: выручка — 1,2 млн | клиенты — 48 | конверсия — 3,5% | заголовок: октябрь» */
export const MKpi: React.FC<BlockProps> = (p) => {
  const f = useCurrentFrame(); const {fps} = useVideoConfig(); const T = p.theme;
  const ks = (p.data.items.filter((i) => i.value != null).length ? p.data.items.filter((i) => i.value != null) : [{label: 'выручка', value: 1200000, shown: '1,2 млн'}, {label: 'клиенты', value: 48, shown: '48'}, {label: 'конверсия', value: 3.5, shown: '3,5%'}, {label: 'средний чек', value: 25000, shown: '25 000 ₽'}]).slice(0, 4);
  const cols = [T.accent, T.accent2, '#3CC57B', '#2F9BEA'];
  return <Col p={p} gap={30}>
    <Title t={p.data.title || 'итоги месяца'} c={T.ink} a={T.accent} f={f} />
    <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 22, width: 920}}>
      {ks.map((k, i) => { const at = 8 + i * 7; const s = spring({frame: f - at, fps, config: {damping: 14}}); const pr = ramp(f, at + 4, at + 30);
        const pts = Array.from({length: 9}, (_, j) => 0.2 + 0.7 * Math.pow(j / 8, 1.6) + 0.12 * Math.sin(j * 1.7 + i)); const d = pts.map((y, j) => `${j ? 'L' : 'M'} ${j * 46} ${100 - y * 90}`).join(' ');
        return <div key={i} style={{borderRadius: 34, background: T.card, padding: 30, boxShadow: '0 10px 30px rgba(0,0,0,.07)', scale: String(0.9 + 0.1 * s), opacity: s, fontFamily: SANS}}>
          <div style={{fontSize: 32, color: T.muted, fontWeight: 600}}>{k.label}</div>
          <div style={{fontSize: 70, fontWeight: 800, color: T.ink, letterSpacing: -2, fontVariantNumeric: 'tabular-nums'}}>{fmtNum(interpolate(f, [at, at + 24], [0, k.value as number], {...clamp, easing: Easing.out(Easing.cubic)}), k.shown)}</div>
          <div style={{display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginTop: 8}}>
            <svg width={370} height={110} viewBox="-6 -6 382 116"><path d={d} stroke={cols[i]} strokeWidth={7} fill="none" strokeLinecap="round" pathLength={1} strokeDasharray={1} strokeDashoffset={1 - pr} /></svg></div>
          <div style={{fontSize: 28, fontWeight: 700, color: '#3CC57B', opacity: ramp(f, at + 24, at + 32)}}>↑ {12 + i * 7}%</div>
        </div>; })}
    </div>
  </Col>;
};

/* MHeatmap — сетка дней закрашивается одна за другой, как активность на GitHub. «MHeatmap: 30 | заголовок: 30 дней подряд» */
export const MHeatmap: React.FC<BlockProps> = (p) => {
  const f = useCurrentFrame(); const T = p.theme; const it = p.data.items.find((i) => i.value != null);
  const n = Math.max(1, Math.min(70, Math.round(it ? (it.value as number) : 30))); const cells = Math.ceil(n / 7) * 7 + 7;
  const filled = Math.floor(interpolate(f, [10, p.dur * 0.7], [0, n], clamp)); const S = Math.min(108, 860 / 7 - 14);
  const lv = (i: number) => [0.35, 0.6, 0.85, 1][(i * 7 + (i % 3)) % 4];
  return <Col p={p} gap={36}>
    <Title t={p.data.title || `${n} дней подряд`} c={T.ink} a={T.accent} f={f} />
    <div style={{display: 'grid', gridTemplateColumns: `repeat(7, ${S}px)`, gap: 14}}>
      {Array.from({length: cells}, (_, i) => { const on = i < filled; const just = i === filled - 1;
        return <div key={i} style={{width: S, height: S, borderRadius: 20, background: on ? T.accent : T.dark ? 'rgba(255,255,255,.08)' : 'rgba(28,27,34,.07)', opacity: on ? lv(i) : 1, scale: just ? '1.15' : '1', boxShadow: just ? `0 0 24px ${T.accent}` : 'none'}} />; })}
    </div>
    <div style={{fontFamily: SANS, fontWeight: 800, fontSize: 64, color: T.ink, fontVariantNumeric: 'tabular-nums'}}>{filled} <span style={{fontWeight: 600, fontSize: 40, color: T.muted}}>из {n}</span></div>
  </Col>;
};

/* MCompareBars — пары полос «было / стало» по метрикам. «MCompareBars: охваты — 2000 → 45000 | заявки — 3 → 40 | заголовок: до и после» */
export const MCompareBars: React.FC<BlockProps> = (p) => {
  const f = useCurrentFrame(); const T = p.theme;
  const rows = (p.data.items.length ? p.data.items.map((i) => { const n = nums(i.shown); return {l: i.label, a: n[0] || 0, b: n[1] ?? n[0] ?? 0, la: (i.shown.split(/→|->/)[0] || '').trim(), lb: (i.shown.split(/→|->/)[1] || '').trim()}; })
    : [{l: 'охваты', a: 2000, b: 45000, la: '2 000', lb: '45 000'}, {l: 'заявки', a: 3, b: 40, la: '3', lb: '40'}, {l: 'доход', a: 30000, b: 210000, la: '30 тыс', lb: '210 тыс'}]).slice(0, 4);
  return <Col p={p} gap={34}>
    <Title t={p.data.title || 'до и после'} c={T.ink} a={T.accent2} f={f} />
    <div style={{display: 'flex', flexDirection: 'column', gap: 34, width: 900, fontFamily: SANS}}>
      {rows.map((r, i) => { const at = 10 + i * 10; const k = interpolate(f, [at, at + 22], [0, 1], {...clamp, easing: Easing.out(Easing.cubic)}); const mx = Math.max(r.a, r.b, 1);
        return <div key={i}>
          <div style={{display: 'flex', justifyContent: 'space-between', fontSize: 38, fontWeight: 700, color: T.ink, marginBottom: 10}}><span>{r.l}</span><span style={{color: '#3CC57B', opacity: ramp(f, at + 20, at + 28)}}>×{(r.b / Math.max(r.a, 1e-9)).toFixed(r.b / Math.max(r.a, 1e-9) < 10 ? 1 : 0).replace('.', ',')}</span></div>
          {[[r.a, r.la, T.muted, 'было'], [r.b, r.lb, T.accent, 'стало']].map(([v, l, c, tag], j) =>
            <div key={j} style={{display: 'flex', alignItems: 'center', gap: 14, marginTop: 8}}>
              <span style={{width: 96, fontSize: 26, color: T.muted}}>{tag as string}</span>
              <div style={{height: 44, width: Math.max(10, ((v as number) / mx) * 600 * k), borderRadius: 14, background: c as string, opacity: j ? 1 : 0.45}} />
              <span style={{fontSize: 32, fontWeight: 800, color: T.ink, opacity: ramp(f, at + 10, at + 20)}}>{(l as string) || fmtNum(v as number, '')}</span></div>)}
        </div>; })}
    </div>
  </Col>;
};
