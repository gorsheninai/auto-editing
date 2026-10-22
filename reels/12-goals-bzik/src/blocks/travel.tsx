import React from 'react';
import {AbsoluteFill, Easing, Img, interpolate, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {BlockProps, SANS, SERIF, clamp, ramp, spring, rad, shd} from './kit';

/* Пять приёмов из video-shotcraft (Apache-2.0; на сайте getshotpack.com — timeline-travel, scroll-brake-moves,
   list-reveal, card-stack, product-card-progressive-assemble), переписаны под вертикаль, кириллицу и данные раскадровки. */

const raw = (p: BlockProps) => p.data.items.map((i) => i.raw);
const media = (s: string) => staticFile(s.includes('/') ? s : `media/${s}`);

/* ===== MTimeTravel — камера разгоняется вдоль оси времени, у каждой отметки выпрыгивает карточка, в конце резкий стоп и наезд.
   «MTimeTravel: 2019 — первый ролик | 2021 — 10 тысяч | 2023 — свой курс | сейчас — миллион» */
export const MTimeTravel: React.FC<BlockProps> = (p) => {
  const f = useCurrentFrame(); const {fps} = useVideoConfig(); const T = p.theme;
  const pts = (p.data.items.length ? p.data.items : [{label: '2019', shown: 'первый ролик'}, {label: '2021', shown: '10 тысяч подписчиков'}, {label: '2023', shown: 'свой курс'}, {label: 'сейчас', shown: 'миллион'}] as never[])
    .map((i: {label: string; shown: string}) => { const [title, ...rest] = (i.shown || '').split(/\s*,\s*/); return {y: i.label, t: title, d: rest.join(', ')}; }).slice(0, 6);
  const N = pts.length, STEP = 640, cy = p.zoneH / 2;
  const t0 = 10, t1 = Math.round(p.dur * 0.72);
  const u = interpolate(f, [t0, t1], [0, 1], clamp);
  const ease = u < 0.85 ? Easing.in(Easing.poly(2.2))(u / 0.85) * 0.92 : 0.92 + Easing.out(Easing.cubic)((u - 0.85) / 0.15) * 0.08;
  const camX = ease * (N - 1) * STEP; const vel = Math.abs(interpolate(f + 1, [t0, t1], [0, 1], clamp) - u) * (N - 1) * STEP;
  const zoom = interpolate(f, [t1, t1 + 14], [1, 1.22], {...clamp, easing: Easing.out(Easing.cubic)});
  return <AbsoluteFill style={{height: p.zoneH, overflow: 'hidden'}}>
    <div style={{position: 'absolute', top: cy + 140, left: 540 - camX * 0.35 - 200, fontFamily: SERIF, fontStyle: 'italic', fontWeight: 600, fontSize: 300, color: T.ink, opacity: 0.04, whiteSpace: 'nowrap'}}>{pts.map((x) => x.y).join('   ')}</div>
    <AbsoluteFill style={{height: p.zoneH, scale: String(zoom), transformOrigin: `540px ${cy}px`}}>
      <div style={{position: 'absolute', left: 540 - camX, top: cy, width: (N - 1) * STEP, height: 0, filter: vel > 6 ? `blur(${Math.min(10, vel / 8)}px)` : undefined}}>
        <div style={{position: 'absolute', left: -400, right: -400, top: -3, height: 6, background: T.line}} />
        <div style={{position: 'absolute', left: 0, width: camX, top: -3, height: 6, background: T.accent}} />
        {pts.map((x, i) => { const reach = camX >= i * STEP - 40; const at = reach ? Math.round(t0 + (i / Math.max(1, N - 1)) * (t1 - t0) * 0.95) : 9999;
          const k = spring({frame: f - at, fps, config: {damping: 10, stiffness: 180}}); const last = i === N - 1;
          return <div key={i} style={{position: 'absolute', left: i * STEP, top: 0}}>
            <div style={{position: 'absolute', left: -22, top: -22, width: 44, height: 44, borderRadius: '50%', background: reach ? T.accent : T.card, border: `8px solid ${T.accent}`, boxShadow: reach ? `0 0 30px ${T.accent}` : 'none'}} />
            <div style={{position: 'absolute', left: -150, top: 40, width: 300, textAlign: 'center', fontFamily: SERIF, fontStyle: 'italic', fontWeight: 600, fontSize: 64, color: last ? T.accent : T.ink}}>{x.y}</div>
            <div style={{position: 'absolute', left: -2, top: -170 * k, width: 4, height: 150 * k, background: T.line}} />
            <div style={{position: 'absolute', left: -230, top: -170 - 260, width: 460, padding: '30px 34px', borderRadius: rad(36), background: last ? T.accent : T.card, color: last ? '#fff' : T.ink,
              boxShadow: shd('0 20px 50px rgba(0,0,0,.12)'), fontFamily: SANS, scale: String(k), transformOrigin: '50% 100%', opacity: Math.min(1, k * 1.5)}}>
              <div style={{fontWeight: 800, fontSize: 50, letterSpacing: -1.5, lineHeight: 1.05}}>{x.t}</div>
              {x.d ? <div style={{fontSize: 32, marginTop: 10, opacity: 0.75}}>{x.d}</div> : null}</div>
          </div>; })}
      </div>
    </AbsoluteFill>
    {p.data.title ? <div style={{position: 'absolute', top: p.zoneH * 0.08, width: '100%', textAlign: 'center', fontFamily: SANS, fontWeight: 700, fontSize: 60, color: T.ink, letterSpacing: -2, opacity: ramp(f, 0, 10)}}>{p.data.title}</div> : null}
  </AbsoluteFill>;
};

/* ===== MScrollBrake — длинный список проносится, резко тормозит с отскоком на цели, уголки-прицел защёлкиваются.
   «MScrollBrake: пункт | пункт | … | цель: Первый миллион | метка: вот он» */
export const MScrollBrake: React.FC<BlockProps> = (p) => {
  const f = useCurrentFrame(); const {fps} = useVideoConfig(); const T = p.theme;
  const target = p.data.items.find((i) => /^цель/i.test(i.label))?.shown || 'Первый миллион просмотров';
  const tag = p.data.items.find((i) => /^метка/i.test(i.label))?.shown || 'вот он';
  let list = p.data.items.filter((i) => !/^(цель|метка)/i.test(i.label)).map((i) => i.raw);
  if (list.length < 6) list = [...list, 'Первый ролик', '100 подписчиков', 'Первый комментарий', 'Купил микрофон', 'Ролик на 10 тысяч', 'Сменил формат', 'Первая реклама', 'Начал монтировать сам', '1000 подписчиков', 'Коллаб с блогером', 'Первый заказ'];
  const rows = [...list.slice(0, 14), target, ...['Курс', 'Команда', 'Планы на год']]; const ti = rows.indexOf(target);
  const RH = 150, cy = p.zoneH / 2;
  const B = Math.round(p.dur * 0.5);
  const s = interpolate(f, [8, B - 8], [0, 1], {...clamp, easing: Easing.in(Easing.sin)}); const over = f < B - 8 ? 0 : interpolate(f, [B - 8, B, B + 10], [0, 1, 0], clamp);
  const y = s * ti * RH + over * 34; const vel = f < B - 8 ? ti * RH * (interpolate(f + 1, [8, B - 8], [0, 1], {...clamp, easing: Easing.in(Easing.sin)}) - s) : 0;
  const lock = spring({frame: f - B, fps, config: {damping: 12, stiffness: 220}}); const locked = f >= B;
  const W = 900, X = 90;
  return <AbsoluteFill style={{height: p.zoneH, overflow: 'hidden', maskImage: 'linear-gradient(transparent, #000 15%, #000 85%, transparent)', WebkitMaskImage: 'linear-gradient(transparent, #000 15%, #000 85%, transparent)'}}>
    <div style={{position: 'absolute', left: X, top: cy - RH / 2 - y, width: W, filter: vel > 8 ? `blur(${Math.min(14, vel / 6)}px)` : undefined}}>
      {rows.map((r, i) => { const hit = i === ti && locked;
        return <div key={i} style={{height: RH - 18, marginBottom: 18, borderRadius: rad(30), background: hit ? T.card : T.dark ? 'rgba(255,255,255,.06)' : '#FFFFFF', display: 'flex', alignItems: 'center', gap: 26, padding: '0 34px', fontFamily: SANS,
          opacity: locked && i !== ti ? 0.35 : 1, boxShadow: hit ? `0 0 0 6px ${T.accent}, 0 24px 60px rgba(0,0,0,.18)` : '0 4px 14px rgba(0,0,0,.05)', scale: hit ? String(1 + 0.03 * lock) : '1'}}>
          <span style={{fontFamily: SERIF, fontStyle: 'italic', fontSize: 46, color: hit ? T.accent : T.muted, width: 70}}>{i + 1}</span>
          <span style={{flex: 1, fontWeight: 700, fontSize: 46, color: T.ink, letterSpacing: -1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis'}}>{r}</span></div>; })}
    </div>
    {locked ? <svg width={1080} height={p.zoneH} style={{position: 'absolute', inset: 0}}>
      {[[X - 16, cy - RH / 2 - 16, 1, 1], [X + W + 16, cy - RH / 2 - 16, -1, 1], [X - 16, cy + RH / 2 - 2, 1, -1], [X + W + 16, cy + RH / 2 - 2, -1, -1]].map(([x, yy, sx, sy], i) => {
        const d = (1 - lock) * 160; return <path key={i} transform={`translate(${-sx * d} ${-sy * d})`} d={`M ${x} ${yy + sy * 50} L ${x} ${yy} L ${x + sx * 50} ${yy}`} stroke={T.accent2} strokeWidth={10} fill="none" strokeLinecap="round" />; })}
    </svg> : null}
    {locked ? <div style={{position: 'absolute', right: 60, top: cy - RH / 2 - 76, padding: '10px 24px', borderRadius: rad(999), background: T.accent2, color: '#fff', fontFamily: SANS, fontWeight: 800, fontSize: 36, scale: String(0.6 + 0.4 * lock), opacity: lock}}>{tag}</div> : null}
  </AbsoluteFill>;
};

/* ===== MListReveal — пункты находят место по одному (из размытия, снизу), весь список медленно дрейфует вверх.
   «MListReveal: пункт | пункт | … | заголовок: …» */
export const MListReveal: React.FC<BlockProps> = (p) => {
  const f = useCurrentFrame(); const T = p.theme;
  const items = (raw(p).length ? raw(p) : ['Идея', 'Сценарий', 'Съёмка', 'Монтаж', 'Публикация', 'Аналитика']).slice(0, 7);
  const drift = interpolate(f, [0, p.dur], [0, -96]); const gap = Math.max(6, Math.min(10, Math.floor((p.dur * 0.55) / items.length)));
  const titleAt = Math.round(items.length * gap * 0.5);
  return <AbsoluteFill style={{height: p.zoneH, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 40}}><div style={{display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 40, translate: `0 ${drift}px`}}>
    {p.data.title ? <div style={{fontFamily: SANS, fontWeight: 800, fontSize: 84, letterSpacing: -3, color: T.ink, textAlign: 'center', lineHeight: 1, padding: '0 60px', clipPath: `inset(0 0 ${(1 - ramp(f, titleAt, titleAt + 14)) * 100}% 0)`, translate: `0 ${(1 - ramp(f, titleAt, titleAt + 14)) * 40}px`}}>{p.data.title}</div> : null}
    <div style={{display: 'flex', flexDirection: 'column', gap: 18, width: 820}}>
      {items.map((it, i) => { const at = 6 + i * gap; const k = interpolate(f, [at, at + 24], [0, 1], {...clamp, easing: Easing.out(Easing.back(1.15))}); const first = i === 0;
        return <div key={i} style={{height: 118, borderRadius: rad(26), display: 'flex', alignItems: 'center', gap: 26, padding: '0 34px', fontFamily: SANS, background: first ? T.ink : T.card, color: first ? T.bg : T.ink,
          boxShadow: first ? '0 18px 40px rgba(0,0,0,.22)' : '0 4px 14px rgba(0,0,0,.05)', opacity: Math.min(1, k * 1.4), scale: String(0.82 + 0.18 * k), translate: `0 ${(1 - k) * 44}px`, filter: k < 1 ? `blur(${(1 - Math.min(1, k)) * 8}px)` : undefined}}>
          <span style={{width: 50, height: 50, borderRadius: rad(14), background: first ? T.accent : T.soft, display: 'grid', placeItems: 'center', fontWeight: 800, fontSize: 28, color: first ? '#fff' : T.ink, opacity: ramp(f, at + 2, at + 12)}}>{i + 1}</span>
          <span style={{flex: 1, fontWeight: 700, fontSize: 48, letterSpacing: -1}}>{it}</span>
          {first ? <span style={{padding: '6px 16px', borderRadius: rad(999), background: T.accent2, color: '#fff', fontWeight: 700, fontSize: 26, opacity: ramp(f, at + 4, at + 14)}}>сейчас</span> : null}</div>; })}
    </div></div>
  </AbsoluteFill>;
};

/* ===== MCardStack — карточки падают в стопку, стопка раскрывается веером, центральная выдвигается с подсветкой.
   «MCardStack: карточка | карточка | … | заголовок: …» (центральная — средняя по счёту) */
export const MCardStack: React.FC<BlockProps> = (p) => {
  const f = useCurrentFrame(); const {fps} = useVideoConfig(); const T = p.theme;
  let names = raw(p); if (names.length < 3) names = ['Хук', 'Сценарий', 'Съёмка', 'Монтаж', 'Субтитры', 'Звук', 'Обложка'];
  names = names.slice(0, 7); const n = names.length; const mid = Math.floor(n / 2);
  const cols = [T.accent, T.accent2, '#3CC57B', '#F2B53B', '#2F9BEA', '#E0559B', T.soft];
  const inGap = Math.max(4, Math.floor((p.dur * 0.35) / n)); const fanAt = 8 + n * inGap + 6;
  const fan = spring({frame: f - fanAt, fps, config: {damping: 20, stiffness: 120}}); const pull = spring({frame: f - fanAt - 18, fps, config: {damping: 14}});
  const cy = p.zoneH / 2 + 40; const CW = 330, CH = 460;
  return <AbsoluteFill style={{height: p.zoneH, overflow: 'hidden'}}>
    {names.map((nm, i) => { const at = 8 + i * inGap; const k = spring({frame: f - at, fps, config: {damping: 13, stiffness: 170}}); const o = i - mid; const hero = i === mid;
      const rot = o * 7 * fan, dx = o * 118 * fan, dy = Math.abs(o) * 26 * fan - (hero ? 90 * pull : 0);
      return <div key={i} style={{position: 'absolute', left: 540 - CW / 2 + dx, top: cy - CH / 2 + dy + (1 - k) * 1100, width: CW, height: CH, rotate: `${rot}deg`, transformOrigin: '50% 130%',
        borderRadius: rad(34), background: T.card, overflow: 'hidden', boxShadow: hero && pull > 0.1 ? `0 0 0 8px ${T.accent}, 0 30px 70px rgba(0,0,0,.25)` : '0 18px 40px rgba(0,0,0,.18)', zIndex: hero && pull > 0.1 ? 20 : i, fontFamily: SANS}}>
        <div style={{height: '58%', background: `linear-gradient(140deg, ${cols[i % cols.length]}, ${cols[(i + 2) % cols.length]})`, position: 'relative', overflow: 'hidden'}}>
          {hero && pull > 0.1 ? <div style={{position: 'absolute', top: 0, bottom: 0, width: 120, left: interpolate(pull, [0, 1], [-150, 380]), background: 'linear-gradient(90deg, transparent, rgba(255,255,255,.6), transparent)', rotate: '15deg'}} /> : null}
          <div style={{position: 'absolute', left: 24, bottom: 18, fontSize: 90, fontWeight: 800, color: 'rgba(255,255,255,.85)', fontFamily: SERIF, fontStyle: 'italic'}}>{i + 1}</div></div>
        <div style={{padding: '22px 26px'}}><div style={{fontWeight: 800, fontSize: 42, color: T.ink, letterSpacing: -1, lineHeight: 1.05}}>{nm}</div><div style={{marginTop: 10, height: 14, width: '70%', borderRadius: rad(7), background: T.line}} /></div>
      </div>; })}
    {p.data.title ? <div style={{position: 'absolute', top: p.zoneH * 0.1, width: '100%', textAlign: 'center', fontFamily: SANS, fontWeight: 800, fontSize: 76, letterSpacing: -2.5, color: T.ink, opacity: ramp(f, fanAt + 14, fanAt + 26), translate: `0 ${(1 - ramp(f, fanAt + 14, fanAt + 26)) * 30}px`}}>{p.data.title}</div> : null}
  </AbsoluteFill>;
};

/* ===== MProductCard — карточка товара собирается по полям, как автозаполнение: фото, название, плашка, цена (старая зачёркивается, новая выпрыгивает), текст с маркером, кнопка.
   «MProductCard: Курс по монтажу | цена: 9 900 ₽ → 4 900 ₽ | онлайн | текст: 12 уроков и обратная связь | кнопка: Купить | pic_3» */
export const MProductCard: React.FC<BlockProps> = (p) => {
  const f = useCurrentFrame(); const {fps} = useVideoConfig(); const T = p.theme;
  const get = (k: RegExp) => p.data.items.find((i) => k.test(i.label))?.shown;
  const plain = p.data.items.filter((i) => i.label === i.shown || !/^(цена|кнопка|текст|фото)/i.test(i.label)).map((i) => i.raw);
  const file = raw(p).find((x) => /\.\w{2,4}$|^pic_/i.test(x));
  const title = plain.find((x) => x !== file && !/→/.test(x)) || 'Курс по монтажу рилсов';
  const pill = plain.filter((x) => x !== file && x !== title && !/→|\d/.test(x))[0] || 'онлайн';
  const [oldP, newP] = (get(/^цена/i) || plain.find((x) => /→/.test(x)) || '9 900 ₽ → 4 900 ₽').split(/\s*(?:→|->)\s*/);
  const text = p.data.text || get(/^текст/i) || '12 уроков, шаблоны и разбор твоих роликов';
  const btn = get(/^кнопка/i) || 'Купить';
  const S = [6, 20, 32, 44, 64, 80, 96]; // фото, название, плашка, цена, новая цена, текст, кнопка
  const sp = (i: number) => spring({frame: f - S[i], fps, config: {damping: 14, stiffness: 170}});
  const strike = ramp(f, S[4] - 6, S[4]); const push = interpolate(f, [0, p.dur], [1, 1.06]);
  const slotY = [0, 560, 690, 790, 790, 900, 1080]; const cur = S.findIndex((s, i) => f < s && (i === 0 || f >= S[i - 1])); const ci = cur < 0 ? 6 : Math.max(0, cur);
  const cursorY = ci === 0 ? slotY[0] : interpolate(f, [S[ci - 1], S[ci]], [slotY[ci - 1], slotY[ci]], {...clamp, easing: Easing.inOut(Easing.cubic)});
  const W = 860, sc = Math.min(1, (p.zoneH - 120) / 1240);
  const show = (i: number) => ({opacity: Math.min(1, sp(i) * 1.4), translate: `0 ${(1 - sp(i)) * 26}px`});
  return <AbsoluteFill style={{height: p.zoneH, display: 'grid', placeItems: 'center'}}>
    <div style={{position: 'relative', width: W, borderRadius: rad(48), background: T.card, padding: 40, boxShadow: shd('0 30px 80px rgba(0,0,0,.14)'), scale: String(sc * push), fontFamily: SANS}}>
      <div style={{height: 480, borderRadius: rad(32), overflow: 'hidden', background: T.line, ...show(0)}}>
        {file ? <Img src={media(file)} style={{width: '100%', height: '100%', objectFit: 'cover'}} /> : <div style={{width: '100%', height: '100%', background: `linear-gradient(140deg, ${T.soft}, ${T.accent})`, display: 'grid', placeItems: 'center', fontFamily: SERIF, fontStyle: 'italic', fontSize: 140, color: 'rgba(255,255,255,.9)'}}>{title[0]}</div>}</div>
      <div style={{marginTop: 34, fontWeight: 800, fontSize: 66, letterSpacing: -2, color: T.ink, lineHeight: 1.05, ...show(1)}}>{title}</div>
      <div style={{marginTop: 18, display: 'inline-block', padding: '8px 22px', borderRadius: rad(999), background: T.soft, color: T.ink, fontWeight: 700, fontSize: 32, ...show(2)}}>{pill}</div>
      <div style={{marginTop: 26, display: 'flex', alignItems: 'baseline', gap: 26, height: 100}}>
        <span style={{position: 'relative', fontWeight: 800, fontSize: f >= S[4] ? 50 : 76, color: f >= S[4] ? T.muted : T.ink, ...show(3)}}>{oldP}
          <i style={{position: 'absolute', left: 0, top: '52%', height: 6, width: `${strike * 100}%`, background: T.accent2, display: 'block'}} /></span>
        {f >= S[4] ? <span style={{fontWeight: 900, fontSize: 92, color: T.accent, letterSpacing: -3, scale: String(1.18 - 0.18 * sp(4)), display: 'inline-block'}}>{newP || ''}</span> : null}</div>
      <div style={{marginTop: 18, fontSize: 38, lineHeight: 1.3, color: T.ink, ...show(5)}}><span style={{background: `linear-gradient(${T.accent}33, ${T.accent}33) no-repeat 0 85% / ${ramp(f, S[5] + 6, S[5] + 12) * 100}% 40%`}}>{text}</span></div>
      <div style={{marginTop: 34, height: 120, borderRadius: rad(30), background: T.accent, color: '#fff', display: 'grid', placeItems: 'center', fontWeight: 800, fontSize: 48, ...show(6), scale: String(0.9 + 0.1 * sp(6))}}>{btn}</div>
      {f < S[6] + 6 ? <div style={{position: 'absolute', left: 28, right: 28, top: 28 + cursorY, height: ci === 0 ? 500 : 110, borderRadius: rad(26), border: `5px solid ${T.accent}`, opacity: 1 - ramp(f, S[6], S[6] + 6)}}>
        <span style={{position: 'absolute', right: 16, top: -24, padding: '4px 14px', borderRadius: rad(999), background: T.accent, color: '#fff', fontSize: 22, fontWeight: 800}}>ЗАПОЛНЯЮ</span></div> : null}
    </div>
  </AbsoluteFill>;
};
