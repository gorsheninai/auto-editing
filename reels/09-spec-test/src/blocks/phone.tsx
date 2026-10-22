import React from 'react';
import {AbsoluteFill, Easing, Img, OffthreadVideo, interpolate, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {BlockProps, SANS, Theme, clamp, fmtNum, ramp, spring, rad, shd} from './kit';

/* Телефоны: нейтральный смартфон без логотипов, внутри — свой скриншот/видео или интерфейс, нарисованный по данным.
   Идеи: snapcn phone-frame / screen-recording / follower-rush, Shotpack mobile, video-shotcraft scroll-brake. */

const SW = 520, SH = 1100; // экран телефона (в C), рамка добавляет 22 с каждой стороны
const media = (s: string) => staticFile(s.includes('/') ? s : `media/${s}`);
const isVid = (s: string) => /\.(mp4|webm|mov)$/i.test(s);
const arr = (p: BlockProps) => p.data.items.map((i) => i.raw);

/* Корпус: рамка, «островок», строка статуса. scale подгоняет телефон под зону (B меньше, C больше) */
export const Phone: React.FC<{p: BlockProps; dark?: boolean; children: React.ReactNode; tilt?: boolean; screenBg?: string}> = ({p, dark, children, tilt = true, screenBg}) => {
  const f = useCurrentFrame(); const {fps} = useVideoConfig();
  const k = spring({frame: f, fps, config: {damping: 15, stiffness: 120}});
  const sc = Math.min(1, (p.zoneH - (p.full ? 300 : 80)) / (SH + 44)) * (p.full ? 1.05 : 1);
  const ink = dark ? '#fff' : '#111';
  return <AbsoluteFill style={{height: p.zoneH, display: 'grid', placeItems: 'center'}}>
    <div style={{width: SW + 44, height: SH + 44, borderRadius: rad(96), background: '#0E0F12', padding: 22, boxShadow: shd('0 40px 100px rgba(0,0,0,.28), inset 0 0 0 3px #2A2C33'),
      scale: String(sc * (0.9 + 0.1 * k)), opacity: k, translate: `0 ${(1 - k) * 120}px`, rotate: tilt ? `${(1 - k) * -6}deg` : '0deg'}}>
      <div style={{position: 'relative', width: SW, height: SH, borderRadius: rad(76), overflow: 'hidden', background: screenBg || (dark ? '#0B0C10' : '#F5F5F7'), fontFamily: SANS}}>
        {children}
        <div style={{position: 'absolute', left: 0, right: 0, top: 0, height: 84, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 46px', color: ink, fontWeight: 700, fontSize: 30, pointerEvents: 'none'}}>
          <span>9:41</span><span style={{letterSpacing: 2, fontSize: 24}}>▮▮▮ ◔</span></div>
        <div style={{position: 'absolute', left: SW / 2 - 70, top: 22, width: 140, height: 40, borderRadius: rad(20), background: '#000'}} />
      </div>
    </div>
  </AbsoluteFill>;
};

/* PhoneFrame — свой скриншот или видео в телефоне, камера наезжает на нужную часть. «PhoneFrame: pic_3 | низ» */
export const PhoneFrame: React.FC<BlockProps> = (p) => {
  const f = useCurrentFrame(); const a = arr(p); const file = a.find((x) => /\.\w{2,4}$|^pic_/i.test(x));
  const focus = (a.find((x) => /верх|центр|низ/i.test(x)) || 'центр').toLowerCase();
  const fy = focus.includes('верх') ? 0.2 : focus.includes('низ') ? 0.8 : 0.5;
  const z = interpolate(f, [p.dur * 0.35, p.dur * 0.7], [1, 1.45], {...clamp, easing: Easing.inOut(Easing.cubic)});
  const content = file ? (isVid(file) ? <OffthreadVideo src={media(file)} muted style={{width: '100%', height: '100%', objectFit: 'cover'}} /> : <Img src={media(file)} style={{width: '100%', height: '100%', objectFit: 'cover'}} />)
    : <FakeFeed theme={p.theme} f={f} />;
  return <AbsoluteFill style={{height: p.zoneH, scale: String(z), transformOrigin: `50% ${(fy * 0.8 + 0.1) * 100}%`}}><Phone p={p}>{content}</Phone></AbsoluteFill>;
};
const FakeFeed: React.FC<{theme: Theme; f: number}> = ({theme, f}) => <div style={{padding: '110px 28px 0', display: 'flex', flexDirection: 'column', gap: 22}}>
  {[0, 1, 2, 3].map((i) => <div key={i} style={{borderRadius: rad(30), background: '#fff', padding: 24, boxShadow: shd('0 4px 14px rgba(0,0,0,.06)'), opacity: ramp(f, 6 + i * 5, 14 + i * 5)}}>
    <div style={{display: 'flex', gap: 14, alignItems: 'center'}}><i style={{width: 54, height: 54, borderRadius: '50%', background: i % 2 ? theme.accent2 : theme.accent, display: 'block'}} /><div style={{height: 18, width: 180, borderRadius: rad(9), background: '#DADCE3'}} /></div>
    <div style={{height: 160, marginTop: 18, borderRadius: rad(20), background: `linear-gradient(135deg, ${theme.soft}, ${i % 2 ? '#FFD9C2' : '#E7E1FF'})`}} /></div>)}
</div>;

/* PhoneScroll — лента или длинный скриншот прокручивается и притормаживает. «PhoneScroll: long.png» или пункты ленты */
export const PhoneScroll: React.FC<BlockProps> = (p) => {
  const f = useCurrentFrame(); const T = p.theme; const a = arr(p); const file = a.find((x) => /\.\w{2,4}$/.test(x));
  const posts = a.filter((x) => x !== file); const list = posts.length ? posts : ['Как я набрал первых клиентов', 'Отзыв: «Окупилось за неделю»', '5 ошибок новичков', 'Мой рабочий день', 'Сколько я заработал за месяц', 'Чек-лист для старта'];
  const brake = Math.round(p.dur * 0.6);
  const y = interpolate(f, [6, brake, brake + 16, p.dur], [0, 1, 1.04, 1.04], {...clamp, easing: Easing.out(Easing.cubic)});
  const hl = Math.min(list.length - 1, 3);
  return <Phone p={p}>
    {file ? <Img src={media(file)} style={{width: '100%', translate: `0 ${-y * 70}%`}} />
      : <div style={{padding: '110px 26px 0', display: 'flex', flexDirection: 'column', gap: 20, translate: `0 ${-y * (list.length * 300 - 900)}px`}}>
        {list.map((t, i) => <div key={i} style={{borderRadius: rad(30), background: '#fff', padding: 24, boxShadow: i === hl && f > brake ? `0 0 0 6px ${T.accent}` : '0 4px 14px rgba(0,0,0,.06)'}}>
          <div style={{height: 170, borderRadius: rad(20), background: `linear-gradient(135deg, ${i % 2 ? '#FFD9C2' : T.soft}, ${i % 3 ? '#E7E1FF' : '#FFF1C7'})`}} />
          <div style={{marginTop: 16, fontWeight: 700, fontSize: 32, color: '#111', lineHeight: 1.15}}>{t}</div>
          <div style={{marginTop: 8, fontSize: 24, color: '#8A8D96'}}>♥ {120 + i * 37}  ·  💬 {8 + i * 3}</div></div>)}
      </div>}
  </Phone>;
};

/* PhoneChat — переписка: «печатает…», сообщения по очереди. «PhoneChat: я: Сколько стоит? | клиент: 15 000 ₽ | заголовок: Анна» */
export const PhoneChat: React.FC<BlockProps> = (p) => {
  const f = useCurrentFrame(); const {fps} = useVideoConfig(); const T = p.theme;
  const msgs = (p.data.items.length ? p.data.items.map((i) => i.raw) : ['клиент: Здравствуйте! Сколько стоит монтаж?', 'я: 15 000 ₽ за 4 ролика', 'клиент: Беру! Куда перевести?', 'я: Отправил реквизиты 🙌'])
    .map((m) => { const mm = m.match(/^\s*(я|мне|клиент|он|она|[^:]{1,14}):\s*(.+)$/i); return mm ? {me: /^(я|мне)$/i.test(mm[1].trim()), t: mm[2]} : {me: false, t: m}; }).slice(0, 6);
  const name = p.data.title || 'Анна';
  const gap = Math.max(18, Math.floor((p.dur - 20) / msgs.length)); const at = msgs.map((_, i) => 12 + i * gap);
  return <Phone p={p} screenBg="#EEF0F5">
    <div style={{position: 'absolute', left: 0, right: 0, top: 84, height: 100, display: 'flex', alignItems: 'center', gap: 16, padding: '0 30px', background: '#fff', borderBottom: '1px solid #E2E4EA'}}>
      <i style={{width: 64, height: 64, borderRadius: '50%', background: T.accent2, display: 'grid', placeItems: 'center', color: '#fff', fontStyle: 'normal', fontWeight: 800, fontSize: 30}}>{name[0]}</i>
      <div><div style={{fontWeight: 700, fontSize: 32, color: '#111'}}>{name}</div><div style={{fontSize: 22, color: T.accent}}>{msgs.some((m, i) => !m.me && f > at[i] - 14 && f < at[i]) ? 'печатает…' : 'в сети'}</div></div></div>
    <div style={{position: 'absolute', left: 0, right: 0, top: 200, bottom: 0, padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 16}}>
      {msgs.map((m, i) => { const k = spring({frame: f - at[i], fps, config: {damping: 14, stiffness: 200}}); if (f < at[i] - 14) return null;
        if (f < at[i]) return m.me ? null : <div key={i} style={{alignSelf: 'flex-start', padding: '18px 22px', borderRadius: rad(26), background: '#fff', display: 'flex', gap: 8}}>{[0, 1, 2].map((d) => <i key={d} style={{width: 12, height: 12, borderRadius: '50%', background: '#9A9DA6', display: 'block', opacity: 0.4 + 0.6 * Math.abs(Math.sin((f + d * 5) / 5))}} />)}</div>;
        return <div key={i} style={{alignSelf: m.me ? 'flex-end' : 'flex-start', maxWidth: '78%', padding: '18px 24px', borderRadius: m.me ? '28px 28px 8px 28px' : '28px 28px 28px 8px', background: m.me ? T.accent : '#fff', color: m.me ? '#fff' : '#111',
          fontSize: 32, lineHeight: 1.25, scale: String(0.6 + 0.4 * k), opacity: k, transformOrigin: m.me ? '100% 100%' : '0 100%', boxShadow: shd('0 2px 6px rgba(0,0,0,.06)')}}>{m.t}</div>; })}
    </div>
  </Phone>;
};

/* PhoneNotifs — экран блокировки, уведомления сыпятся стопкой. «PhoneNotifs: Банк — +15 000 ₽ | Магазин — Новый заказ» */
export const PhoneNotifs: React.FC<BlockProps> = (p) => {
  const f = useCurrentFrame(); const {fps} = useVideoConfig(); const T = p.theme;
  const list = (p.data.items.length ? p.data.items.map((i) => i.raw) : ['Банк — Поступление +15 000 ₽', 'Магазин — Новый заказ № 482', 'Банк — Поступление +8 500 ₽', 'Магазин — Новый заказ № 483', 'Банк — Поступление +22 000 ₽'])
    .map((s) => { const [a, ...b] = s.split(/\s+[—–-]\s+/); return {app: a, t: b.join(' — ') || a}; }).slice(0, 6);
  const gap = Math.max(10, Math.floor((p.dur - 16) / list.length));
  return <Phone p={p} dark screenBg={`linear-gradient(160deg, #2A2350, #0E0F18 60%, ${T.accent}55)`}>
    <div style={{position: 'absolute', top: 150, width: '100%', textAlign: 'center', color: '#fff'}}><div style={{fontSize: 30, opacity: 0.8}}>среда, 22 октября</div><div style={{fontSize: 150, fontWeight: 600, letterSpacing: -4, lineHeight: 1.05}}>9:41</div></div>
    <div style={{position: 'absolute', left: 22, right: 22, top: 430, display: 'flex', flexDirection: 'column-reverse', gap: 14}}>
      {list.map((n, i) => { const at = 10 + i * gap; const k = spring({frame: f - at, fps, config: {damping: 15, stiffness: 190}}); if (f < at) return null;
        return <div key={i} style={{padding: '20px 22px', borderRadius: rad(30), background: 'rgba(255,255,255,.18)', backdropFilter: 'blur(20px)', display: 'flex', gap: 16, alignItems: 'center', color: '#fff', translate: `0 ${(1 - k) * -80}px`, opacity: k, scale: String(0.92 + 0.08 * k)}}>
          <i style={{width: 64, height: 64, borderRadius: rad(16), background: /банк|bank|₽|\+/i.test(n.app + n.t) ? '#3CC57B' : T.accent, display: 'grid', placeItems: 'center', fontStyle: 'normal', fontWeight: 800, fontSize: 30, flex: 'none'}}>{n.app[0]}</i>
          <div style={{flex: 1, minWidth: 0}}><div style={{display: 'flex', justifyContent: 'space-between', fontWeight: 700, fontSize: 26}}><span>{n.app}</span><span style={{opacity: 0.7, fontWeight: 500}}>сейчас</span></div><div style={{fontSize: 29, lineHeight: 1.2}}>{n.t}</div></div></div>; })}
    </div>
  </Phone>;
};

/* PhonePay — поступление: загрузка, сумма считается, зелёная галочка. «PhonePay: 15 000 ₽ | от Анны С.» */
export const PhonePay: React.FC<BlockProps> = (p) => {
  const f = useCurrentFrame(); const {fps} = useVideoConfig(); const T = p.theme;
  const rawAmt = arr(p).find((x) => /\d/.test(x)) || '15 000 ₽';
  const v = parseFloat(rawAmt.replace(/[^\d,.]/g, '').replace(',', '.')) * (/млн/i.test(rawAmt) ? 1e6 : /тыс|к\b/i.test(rawAmt) ? 1e3 : 1); const like = rawAmt;
  const from = arr(p).find((x) => !/\d/.test(x)) || 'от Анны С.';
  const done = Math.round(p.dur * 0.45); const k = spring({frame: f - done, fps, config: {damping: 11, stiffness: 160}});
  const amt = interpolate(f, [8, done], [0, v], {...clamp, easing: Easing.out(Easing.cubic)});
  return <Phone p={p}>
    <div style={{position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', paddingTop: 230, gap: 26, textAlign: 'center'}}>
      <div style={{width: 220, height: 220, borderRadius: '50%', display: 'grid', placeItems: 'center', background: f >= done ? '#3CC57B' : '#E6E8EE', scale: String(f >= done ? 0.85 + 0.15 * k : 1), transition: 'none'}}>
        {f < done ? <div style={{width: 120, height: 120, borderRadius: '50%', border: '12px solid #C9CCD6', borderTopColor: T.accent, rotate: `${f * 14}deg`}} />
          : <svg width={120} height={120} viewBox="0 0 24 24"><path d="M5 12.5l4.5 4.5L19 7.5" stroke="#fff" strokeWidth={2.8} fill="none" strokeLinecap="round" strokeLinejoin="round" pathLength={1} strokeDasharray={1} strokeDashoffset={1 - Math.min(1, k * 1.3)} /></svg>}</div>
      <div style={{fontSize: 36, color: '#6B6E78', fontWeight: 600}}>{f >= done ? 'Поступление' : 'Обработка…'}</div>
      <div style={{fontSize: 96, fontWeight: 800, color: '#111', letterSpacing: -3, fontVariantNumeric: 'tabular-nums'}}>+{fmtNum(amt, like)}</div>
      <div style={{fontSize: 32, color: '#8A8D96', opacity: ramp(f, done, done + 10)}}>{from}</div>
    </div>
  </Phone>;
};

/* PhoneStats — статистика ролика: просмотры, лайки, сохранения растут, внизу график. «PhoneStats: просмотры — 1 200 000 | лайки — 84 000 | сохранения — 12 000» */
export const PhoneStats: React.FC<BlockProps> = (p) => {
  const f = useCurrentFrame(); const T = p.theme;
  const items = (p.data.items.filter((i) => i.value != null).length ? p.data.items.filter((i) => i.value != null) : [{label: 'просмотры', value: 1200000, shown: '1 200 000'}, {label: 'лайки', value: 84000, shown: '84 000'}, {label: 'сохранения', value: 12000, shown: '12 000'}, {label: 'репосты', value: 6300, shown: '6 300'}]).slice(0, 4);
  const end = Math.round(p.dur * 0.6); const t = (x: number) => interpolate(f, [8, end], [0, x], {...clamp, easing: Easing.out(Easing.cubic)});
  const pts = Array.from({length: 12}, (_, i) => Math.pow(i / 11, 2.2)); const prog = ramp(f, 8, end);
  const d = pts.map((y, i) => `${i ? 'L' : 'M'} ${i * 40} ${200 - y * 180}`).join(' ');
  return <Phone p={p}>
    <div style={{padding: '120px 30px 0'}}>
      <div style={{fontWeight: 800, fontSize: 44, color: '#111', letterSpacing: -1}}>{p.data.title || 'Статистика ролика'}</div>
      <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginTop: 26}}>
        {items.map((it, i) => <div key={i} style={{borderRadius: rad(26), background: '#fff', padding: '22px 22px', boxShadow: shd('0 4px 14px rgba(0,0,0,.05)')}}>
          <div style={{fontSize: 24, color: '#8A8D96'}}>{it.label}</div>
          <div style={{fontSize: String(Math.round(it.value as number)).length > 6 ? 34 : 44, fontWeight: 800, color: i === 0 ? T.accent : '#111', letterSpacing: -1, whiteSpace: 'nowrap', fontVariantNumeric: 'tabular-nums'}}>{fmtNum(t(it.value as number), it.shown)}</div></div>)}
      </div>
      <div style={{marginTop: 26, borderRadius: rad(26), background: '#fff', padding: 22}}>
        <div style={{fontSize: 24, color: '#8A8D96', marginBottom: 8}}>просмотры по дням</div>
        <svg width={440} height={210} viewBox="-4 -4 448 214"><path d={`${d} L 440 200 L 0 200 Z`} fill={T.accent} opacity={0.12} style={{clipPath: `inset(0 ${(1 - prog) * 100}% 0 0)`}} />
          <path d={d} stroke={T.accent} strokeWidth={7} fill="none" strokeLinecap="round" pathLength={1} strokeDasharray={1} strokeDashoffset={1 - prog} /></svg>
      </div>
    </div>
  </Phone>;
};
