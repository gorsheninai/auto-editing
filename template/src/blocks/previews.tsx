import React from 'react';
import {AbsoluteFill, Composition, getInputProps} from 'remotion';
import {fontVars, setPassport, type Passport} from './style';
import {LIGHT, SANS, parseData, themeFrom, type Theme} from './kit';
import {SUBS, type SubCode, pickKeywords, toCaptions} from './subs';
import {SCENES} from './library';
import {useStoryFonts} from '../story/fonts';
import {TransitionSeries, linearTiming} from '@remotion/transitions';
import {BgGrain, FX, FxConfetti, FxVhs, OVERLAYS, Overlay, TRANSITIONS} from './text-fx';
import {KenBurns, ProgressBar, Punch, Shake} from './essentials';
import {Flash, FreezeAt} from './shotcraft';
import {FxGrade} from './kino';
import {Img, staticFile} from 'remotion';

/* Стенд превью: каждый блок — композиция P_<код> 1080×1920 (рендер со --scale=0.4 → 432×768 для пульта). */
const FPS = 30;
export const Backdrop: React.FC<{t: Theme}> = ({t}) => <AbsoluteFill style={{background: t.bg}}>
  <AbsoluteFill style={{backgroundImage: `radial-gradient(${t.dark ? 'rgba(255,255,255,.1)' : '#CFC6FF'} 2.4px, transparent 2.8px)`, backgroundSize: '26px 26px', opacity: 0.8}} /></AbsoluteFill>;

const MOTION = SCENES;
export const MOTION_DEMO: Record<string, {note: string; dur: number}> = {
  MBars: {note: 'MBars: я — 3 | они — 30 | заголовок: клиентов в месяц', dur: 110},
  MGrowth: {note: 'MGrowth: янв — 12 | фев — 18 | мар — 15 | апр — 31 | май — 46 | июн — 120 | заголовок: просмотры за полгода', dur: 110},
  MShare: {note: 'MShare: не доходят до конца — 80% | доходят — 20% | заголовок: кто дочитывает', dur: 110},
  MTop: {note: 'MTop: ChatGPT — 800 млн | Gemini — 400 млн | Claude — 100 млн | заголовок: пользователей в неделю', dur: 110},
  MTimeline: {note: 'MTimeline: 2019 — первый ролик | 2022 — 100 тысяч | 2024 — свой курс | сейчас — миллион', dur: 120},
  MGauge: {note: 'MGauge: уровень стресса — 87% | заголовок: в первый месяц', dur: 100},
  MVersus: {note: 'MVersus: фриланс — свобода, свой график, нет оклада | офис — оклад, стабильность, начальник', dur: 120},
  MChecklist: {note: 'MChecklist: найти свою тему | снять 30 роликов | не сдаться | заголовок: план', dur: 140},
  MHub: {note: 'MHub: клиенты | контент | деньги | команда | идеи | заголовок: ты', dur: 110},
  MFlow: {note: 'MFlow: бюджет — реклама | заголовок: куда утекают деньги', dur: 110},
  MSpeed: {note: 'MSpeed: текст: за 5 минут', dur: 90},
  TxtSoftBlur: {note: 'TxtSoftBlur: текст: это меняет всё', dur: 90},
  TxtCenterBuild: {note: 'TxtCenterBuild: текст: делай раньше, чем готов', dur: 100},
  TxtMarker: {note: 'TxtMarker: главное — | регулярность', dur: 90},
  TxtNumber: {note: 'TxtNumber: рублей в месяц — 300 000', dur: 90},
  TxtStrike: {note: 'TxtStrike: дорого | выгодно', dur: 100},
  MChat: {note: 'MChat: Как набрать первых 1000 подписчиков? | Снимай каждый день 30 дней подряд и отвечай на каждый комментарий.', dur: 150},
  MCounter: {note: 'MCounter: подписчиков — 10 000', dur: 110},
  MBeforeAfter: {note: 'MBeforeAfter: demo/g1.jpg | demo/g3.jpg', dur: 120},
  TxtFly: {note: 'TxtFly: идеи, охваты, клиенты, деньги, рост, контент, свобода, команда | заголовок: всё это — твоё', dur: 120},
  TxtSweep: {note: 'TxtSweep: главное — системность | системность', dur: 80},
  TxtUnderline: {note: 'TxtUnderline: делай раньше, чем готов | раньше', dur: 80},
  TxtMask: {note: 'TxtMask: СТИЛЬ | demo/g2.jpg', dur: 90},
  PhoneFrame: {note: 'PhoneFrame: центр', dur: 110},
  PhoneScroll: {note: 'PhoneScroll: Как я набрал первых клиентов | Отзыв: «Окупилось за неделю» | 5 ошибок новичков | Мой рабочий день | Сколько я заработал | Чек-лист для старта', dur: 120},
  PhoneChat: {note: 'PhoneChat: клиент: Здравствуйте! Сколько стоит монтаж? | я: 15 000 ₽ за 4 ролика | клиент: Беру! Куда перевести? | я: Отправил реквизиты 🙌 | заголовок: Анна', dur: 150},
  PhoneNotifs: {note: 'PhoneNotifs: Банк — Поступление +15 000 ₽ | Магазин — Новый заказ № 482 | Банк — Поступление +8 500 ₽ | Магазин — Новый заказ № 483 | Банк — Поступление +22 000 ₽', dur: 120},
  PhonePay: {note: 'PhonePay: 15 000 ₽ | от Анны С.', dur: 100},
  PhoneStats: {note: 'PhoneStats: просмотры — 1 200 000 | лайки — 84 000 | сохранения — 12 000 | репосты — 6 300', dur: 110},
  MBarRace: {note: 'MBarRace: ChatGPT — 100 → 800 | Claude — 5 → 520 | Gemini — 60 → 400 | DeepSeek — 0 → 300 | Copilot — 80 → 150 | годы: 2022 → 2025 | заголовок: пользователей, млн', dur: 150},
  MFunnel: {note: 'MFunnel: увидели — 10 000 | написали — 400 | созвонились — 120 | купили — 30 | заголовок: воронка продаж', dur: 120},
  MKpi: {note: 'MKpi: выручка — 1,2 млн | клиенты — 48 | конверсия — 3,5% | средний чек — 25 000 ₽ | заголовок: итоги октября', dur: 110},
  MHeatmap: {note: 'MHeatmap: 30 | заголовок: 30 дней подряд', dur: 120},
  MCompareBars: {note: 'MCompareBars: охваты — 2 000 → 45 000 | заявки — 3 → 40 | доход — 30 тыс → 210 тыс | заголовок: до и после', dur: 120},
  MTimeTravel: {note: 'MTimeTravel: 2019 — первый ролик | 2021 — 10 тысяч, первые заказы | 2023 — свой курс | сейчас — миллион, команда из 5 человек', dur: 150},
  MScrollBrake: {note: 'MScrollBrake: цель: Первый миллион просмотров | метка: вот он', dur: 130},
  MListReveal: {note: 'MListReveal: Идея | Сценарий | Съёмка | Монтаж | Публикация | Аналитика | заголовок: путь ролика', dur: 120},
  MCardStack: {note: 'MCardStack: Хук | Сценарий | Съёмка | Монтаж | Субтитры | Звук | Обложка | заголовок: 7 шагов ролика', dur: 140},
  MProductCard: {note: 'MProductCard: Курс по монтажу рилсов | цена: 9 900 ₽ → 4 900 ₽ | онлайн | текст: 12 уроков, шаблоны и разбор твоих роликов | кнопка: Купить', dur: 130},
  TxtRotate: {note: 'TxtRotate: это для | блогеров, экспертов, бизнеса', dur: 120},
  MGallery: {note: 'MGallery: demo/g1.jpg | demo/g2.jpg | demo/g3.jpg | demo/g4.jpg', dur: 110},
  TxtNumberTitle: {note: 'TxtNumberTitle: 1 | Выучи один денежный навык | demo/g2.jpg', dur: 90},
  MBurst: {note: 'MBurst: demo/g1.jpg | demo/g3.jpg | demo/g4.jpg | demo/g2.jpg | заголовок: 300 000 ₽ | текст: на счету | чб', dur: 72},
  CardWord: {note: 'CardWord: текст: поэтому | белая', dur: 60},
};

const SUB_TEXT = 'Большинство людей переплачивают за рекламу, потому что не знают одну простую вещь.';
const subWords = () => { let t = 0.25; return SUB_TEXT.split(' ').map((w) => { const d = 0.17 + w.length * 0.025; const o = {w, s: t, e: t + d}; t += d + (/[,.]$/.test(w) ? 0.28 : 0.04); return o; }); };
const SHORT = new Set(['в', 'с', 'и', 'а', 'на', 'за', 'из', 'у', 'со', 'не', 'к', 'о', 'от']);
const SubPreview: React.FC<{code: SubCode}> = ({code}) => {
  useStoryFonts();
  const ws = subWords(); const ends = new Set<number>(); let n = 0;
  ws.forEach((w, i) => { n++; const next = ws[i + 1]; const b = w.w.toLowerCase().replace(/[^\p{L}]/gu, ''); if (/[,.]$/.test(w.w) || !next || (n >= 2 && !SHORT.has(b))) { ends.add(i); n = 0; } });
  const caps = toCaptions(ws.map((w) => ({...w, w: w.w.replace(/[.]$/, '').toLowerCase()})), ends);
  return <AbsoluteFill><Backdrop t={LIGHT} />
    <div style={{position: 'absolute', left: 70, right: 70, top: 300, height: 560, borderRadius: 40, background: 'rgba(123,97,255,.10)', border: '3px dashed rgba(123,97,255,.35)', display: 'grid', placeItems: 'center', fontFamily: SANS, fontWeight: 600, fontSize: 40, color: 'rgba(28,27,34,.35)'}}>сцена</div>
    <div style={{position: 'absolute', left: 60, right: 60, top: 1150, translate: '0 -50%', textAlign: 'center', fontFamily: SANS, letterSpacing: -1}}>
      {SUBS[code].render({captions: caps, keywords: pickKeywords(ws), color: LIGHT.ink, accent: LIGHT.accent, onDark: false, fontSize: 74})}
    </div>
  </AbsoluteFill>;
};
const MotionPreview: React.FC<{code: string}> = ({code}) => {
  useStoryFonts();
  const C = MOTION[code]; const d = MOTION_DEMO[code];
  /* паспорт для проверки: --props='{"passport":{…}}' */
  const pp = (getInputProps() as {passport?: Passport}).passport;
  setPassport(pp);
  const c = pp?.colors || {}; const dark = !!c.bg && parseInt(c.bg.slice(1, 3), 16) + parseInt(c.bg.slice(3, 5), 16) + parseInt(c.bg.slice(5, 7), 16) < 300;
  const th = pp ? themeFrom({dark, bg: c.bg || LIGHT.bg, ink: c.ink || LIGHT.ink, accent: c.accent || LIGHT.accent}) : LIGHT;
  return <AbsoluteFill style={fontVars(pp)}><Backdrop t={th} /><C data={parseData(d.note)} theme={th} zoneH={1920} full dur={d.dur} /></AbsoluteFill>;
};

/* Макет сцены для переходов и эффектов */
const Mock: React.FC<{n: number}> = ({n}) => <AbsoluteFill style={{background: n ? '#FF6A2B' : '#7B61FF', display: 'grid', placeItems: 'center'}}>
  <div style={{fontFamily: SANS, fontWeight: 800, fontSize: 190, color: '#fff', letterSpacing: -6}}>{n ? 'после' : 'до'}</div></AbsoluteFill>;
const Card: React.FC = () => <AbsoluteFill style={{display: 'grid', placeItems: 'center'}}><div style={{width: 820, padding: 60, borderRadius: 44, background: '#fff', boxShadow: '0 20px 60px rgba(0,0,0,.1)', fontFamily: SANS, fontWeight: 800, fontSize: 96, letterSpacing: -3, color: '#1C1B22', textAlign: 'center', lineHeight: 1.05}}>подписка<br />за 0 ₽</div></AbsoluteFill>;
const TrPreview: React.FC<{code: string}> = ({code}) => { useStoryFonts(); const t = TRANSITIONS[code];
  return <TransitionSeries><TransitionSeries.Sequence durationInFrames={45 + t.len}><Mock n={0} /></TransitionSeries.Sequence>
    <TransitionSeries.Transition presentation={t.make()} timing={linearTiming({durationInFrames: t.len})} />
    <TransitionSeries.Sequence durationInFrames={45}><Mock n={1} /></TransitionSeries.Sequence></TransitionSeries>; };
/* Макет спикера для превью наездов и плашки с именем */
const Speaker: React.FC = () => <AbsoluteFill style={{background: 'radial-gradient(ellipse at 50% 30%, #3B3F52, #15171E 70%)'}}>
  <div style={{position: 'absolute', left: 540 - 175, top: 520, width: 350, height: 430, borderRadius: '50%', background: 'linear-gradient(#E9C3A8, #D6A98B)'}} />
  <div style={{position: 'absolute', left: 540 - 190, top: 470, width: 380, height: 200, borderRadius: '190px 190px 60px 60px', background: '#2B2118'}} />
  <div style={{position: 'absolute', left: 540 - 380, top: 960, width: 760, height: 1100, borderRadius: '320px 320px 0 0', background: 'linear-gradient(#7B61FF, #5A43D6)'}} />
</AbsoluteFill>;
const Shot: React.FC = () => <AbsoluteFill style={{display: 'grid', placeItems: 'center', background: '#F4F1EA'}}>
  <div style={{width: 860, borderRadius: 44, background: '#fff', boxShadow: '0 20px 60px rgba(0,0,0,.1)', padding: 54, fontFamily: SANS, color: '#1C1B22', display: 'flex', flexDirection: 'column', gap: 22}}>
    <div style={{fontWeight: 800, fontSize: 56, letterSpacing: -1.5}}>Заказ № 4815</div>
    <div style={{fontSize: 40, color: '#6B6A75'}}>Клиент: Анна Смирнова</div>
    <div style={{fontSize: 40, color: '#6B6A75'}}>Телефон: +7 912 345-67-89</div>
    <div style={{fontWeight: 800, fontSize: 72, color: '#7B61FF', letterSpacing: -2}}>15 000 ₽</div>
  </div></AbsoluteFill>;
const OV_DEMO: Record<string, object> = {Spotlight: {x: 306, y: 1078, w: 420}, ScanFocus: {x: 306, y: 1078, w: 330, h: 112, text: 'итоговая сумма'}, Callout: {x: 306, y: 1078, w: 330, h: 112, text: 'вот сумма'}, BlurBox: {x: 418, y: 985, w: 540, h: 66, at: 20}, Notify: {text: 'Телеграм — Новый заказ на 15 000 ₽'}, NameTag: {text: 'Иван Петров — маркетолог'}, InkUnderline: {x: 540, y: 1075, w: 560}, InkCircle: {x: 540, y: 960, w: 900, h: 420}, InkArrow: {x: 240, y: 1450, to: [430, 1100]}, PaperSticker: {x: 760, y: 700, text: 'без скрытых!'}};
const OvPreview: React.FC<{code: string}> = ({code}) => { useStoryFonts();
  const bg = code === 'NameTag' ? <Speaker /> : ['Callout', 'BlurBox', 'Spotlight', 'ScanFocus'].includes(code) ? <Shot /> : <><Backdrop t={LIGHT} /><Card /></>;
  return <AbsoluteFill>{bg}<Overlay ov={{code, at: 8, ...OV_DEMO[code]}} theme={LIGHT} /></AbsoluteFill>; };
const FxPreview: React.FC<{code: string}> = ({code}) => { useStoryFonts();
  if (code === 'FxFlash') return <Flash at={14}><Speaker /></Flash>;
  if (code === 'FxFreeze') return <FreezeAt at={30} text="вот этот момент" theme={LIGHT}><Shake at={0} power={0.4}><Speaker /></Shake></FreezeAt>;
  if (code === 'FxPunch') return <Punch at={[14, 44, 74]}><Speaker /></Punch>;
  if (code === 'FxShake') return <Shake at={12}><AbsoluteFill><Backdrop t={LIGHT} /><Card /></AbsoluteFill></Shake>;
  if (code === 'Progress') return <AbsoluteFill><Speaker /><ProgressBar total={90} theme={LIGHT} /></AbsoluteFill>;
  if (code === 'KenBurns') return <AbsoluteFill style={{overflow: 'hidden'}}><KenBurns seed="g2" dur={90}><Img src={staticFile('demo/g2.jpg')} style={{width: '100%', height: '100%', objectFit: 'cover'}} /></KenBurns></AbsoluteFill>;
  if (code === 'BgGrain') return <AbsoluteFill><BgGrain theme={LIGHT} /><Card /></AbsoluteFill>;
  if (code === 'FxVhs') return <FxVhs><AbsoluteFill><Backdrop t={LIGHT} /><Card /></AbsoluteFill></FxVhs>;
  return <AbsoluteFill><Backdrop t={LIGHT} /><Card /><FxConfetti theme={LIGHT} /></AbsoluteFill>; };

export const Previews: React.FC = () => <>
  {(Object.keys(SUBS) as SubCode[]).map((c) => <Composition key={c} id={`P-${c}`} component={() => <SubPreview code={c} />} durationInFrames={6 * FPS} fps={FPS} width={1080} height={1920} />)}
  {Object.keys(MOTION).map((c) => <Composition key={c} id={`P-${c}`} component={() => <MotionPreview code={c} />} durationInFrames={MOTION_DEMO[c].dur} fps={FPS} width={1080} height={1920} />)}
  {Object.keys(TRANSITIONS).map((c) => <Composition key={c} id={`P-${c}`} component={() => <TrPreview code={c} />} durationInFrames={90} fps={FPS} width={1080} height={1920} />)}
  {Object.keys(OVERLAYS).map((c) => <Composition key={c} id={`P-${c}`} component={() => <OvPreview code={c} />} durationInFrames={90} fps={FPS} width={1080} height={1920} />)}
  <Composition id="P-FxGrade" component={() => <AbsoluteFill><AbsoluteFill style={{opacity: 1}}><FxGrade mode="чб"><Img src={staticFile('demo/g1.jpg')} style={{width: '100%', height: '100%', objectFit: 'cover'}} /></FxGrade></AbsoluteFill></AbsoluteFill>} durationInFrames={60} fps={FPS} width={1080} height={1920} />
  {Object.keys(FX).map((c) => <Composition key={c} id={`P-${c}`} component={() => <FxPreview code={c} />} durationInFrames={90} fps={FPS} width={1080} height={1920} />)}
</>;
