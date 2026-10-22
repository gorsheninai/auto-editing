import React from 'react';
import {AbsoluteFill, Img, interpolate, useCurrentFrame} from 'remotion';
import {S3Orbit, S3Coaster, S3Jobs, S3Rocket, S3Laptop} from './three3d';
import {MPath, MRace, MCycle} from './motion';
import {
  Avatar, Bg, C, Grain, Pill, Pop, S, SANS, Shake, Split, TOP_H, Title, clamp, ease, pop, serifIt, wf, wfPrev,
} from './kit';

type P = {from: number; dur: number};

// 1 — A: hook
export const SHook: React.FC<P> = ({from}) => {
  const fr = useCurrentFrame();
  return (
    <AbsoluteFill>
      <Avatar from={from} />
      <AbsoluteFill style={{background: 'linear-gradient(0deg, rgba(28,27,34,0.75) 0%, rgba(28,27,34,0.35) 30%, transparent 55%)'}} />
      <Title top={1060} a="Профессии" b="меняются быстрее всего" color="#fff" sizeA={104} sizeB={78} />
      <div style={{opacity: interpolate(fr, [0, 6], [0, 1], clamp)}} />
    </AbsoluteFill>
  );
};

// 2 — C: "ещё никогда так быстро не менялись" — objects orbit fast
export const SOrbit: React.FC<P> = ({dur}) => {
  const fr = useCurrentFrame();
  const items = ['cap', 'briefcase', 'wrench', 'robot', 'laptop', 'diploma'];
  const spd = interpolate(fr, [0, dur], [0.04, 0.16], clamp);
  let ang = 0;
  for (let i = 0; i < fr; i++) ang += interpolate(i, [0, dur], [0.04, 0.16], clamp);
  return (
    <AbsoluteFill>
      <Bg src="img/BG1.jpg" dur={dur} zoom={[1.05, 1.2]} />
      {items.map((it, i) => {
        const a = ang + (i / items.length) * Math.PI * 2;
        const r = 430;
        return <Img key={it} src={S(`items/${it}.png`)} style={{position: 'absolute', width: 230, left: 540 + Math.cos(a) * r - 115, top: 900 + Math.sin(a) * r * 0.95 - 115, rotate: `${a * 20}deg`, filter: `blur(${spd > 0.1 ? 1.5 : 0}px)`}} />;
      })}
      <div style={{position: 'absolute', left: 170, top: 760, width: 740, height: 300, borderRadius: 150, background: 'rgba(244,241,234,0.85)', filter: 'blur(18px)'}} />
      <Title top={790} a="ещё никогда" b="так быстро" sizeA={96} sizeB={130} />
      <Grain />
    </AbsoluteFill>
  );
};

// 3 — B: stairs path
const STEPS = [[208, 840], [527, 646], [749, 438], [916, 230]] as const;
export const SStairs: React.FC<P> = ({from, dur}) => {
  const fr = useCurrentFrame();
  const marks = [wf('образование'), wf('стажировка'), wf('развитие'), wf('рост')].map((x) => x - from);
  let stage = 0;
  marks.forEach((m, i) => { if (fr >= m) stage = i; });
  const prev = Math.max(0, stage - 1);
  const k = pop(fr, marks[stage]);
  const x = interpolate(k, [0, 1], [STEPS[prev][0], STEPS[stage][0]]);
  const y = interpolate(k, [0, 1], [STEPS[prev][1], STEPS[stage][1]]) - Math.sin(Math.min(1, k) * Math.PI) * 60;
  const icons = ['cap', 'badge', 'wrench', 'coins'];
  return (
    <Split from={from}>
      <Bg src="img/BG5.jpg" dur={dur} zoom={[1, 1.04]} pos="50% 75%" />
      {icons.map((ic, i) => <Pop key={ic} src={`items/${ic}.png`} at={marks[i]} x={STEPS[i][0] - 120} y={STEPS[i][1] - 230} w={170} from="down" />)}
      <Img src={S('poses/step.png')} style={{position: 'absolute', height: 360, left: x - 110, top: y - 350}} />
      <Pop src="items/chart.png" at={marks[3] + 6} x={190} y={300} w={240} />
    </Split>
  );
};

// 4 — C: roller coaster
export const SCoaster: React.FC<P> = ({dur}) => {
  const fr = useCurrentFrame();
  return (
    <AbsoluteFill>
      <Shake at={4} amp={10} len={16}>
        <Bg src="img/S1.jpg" dur={dur} zoom={[1.0, 1.22]} pan={[0, -30]} />
        {['cap', 'badge', 'coins'].map((it, i) => (
          <Img key={it} src={S(`items/${it}.png`)} style={{position: 'absolute', width: 150,
            left: 300 + i * 220 + fr * (i - 1) * 4, top: 1300 - fr * (9 + i * 3), rotate: `${fr * (6 + i * 4)}deg`, opacity: interpolate(fr, [0, 6], [0, 1], clamp)}} />
        ))}
      </Shake>
      <Grain />
    </AbsoluteFill>
  );
};

// 5 — B: desk — human vs robot speed
export const SDesk: React.FC<P> = ({from, dur}) => {
  const fr = useCurrentFrame();
  const fast = wf('быстрее') - from;
  const tagAt = wf('дешёвый') - from;
  return (
    <Split from={from}>
      <Bg src="img/BG2.jpg" dur={dur} zoom={[1.05, 1.1]} filter="saturate(0.85) sepia(0.15)" />
      <AbsoluteFill style={{background: 'rgba(207,198,255,0.12)'}} />
      <Img src={S('hands/laptop.png')} style={{position: 'absolute', width: 520, left: 20, top: 560 + Math.sin(fr / 2) * 3}} />
      <Pop src="items/arms.png" at={wf('нейросети', 1) - from} x={800} y={700} w={380} float={4} />
      <Pop src="items/stopwatch.png" at={4} x={820} y={260} w={220} rot={0} />
      {fr >= tagAt && (
        <Img src={S('items/tag.png')} style={{position: 'absolute', width: 170, left: 470, top: interpolate(pop(fr, tagAt), [0, 1], [-200, 250]), rotate: '-14deg'}} />
      )}
      {Array.from({length: 6}).map((_, i) => (
        <Pop key={i} src="items/check.png" at={fast + i * 3} x={640 + (i % 3) * 150} y={950 - Math.floor(i / 3) * 140 - 380} w={110} float={3} />
      ))}
      <Pill at={tagAt + 4} x={555} y={470} bg={C.orange}>дёшево и быстро</Pill>
    </Split>
  );
};

// 6a — B: "за первые девять месяцев 2026 года… в США"
export const SYear: React.FC<P> = ({from, dur}) => {
  const fr = useCurrentFrame();
  const y = Math.round(interpolate(fr, [0, 16], [2016, 2026], {...clamp, easing: ease}));
  return (
    <Split from={from}>
      <Bg src="img/BG1.jpg" dur={dur} zoom={[1.1, 1.2]} pan={[0, -30]} />
      <div style={{position: 'absolute', top: 250, width: '100%', textAlign: 'center'}}>
        <div style={{...serifIt, fontSize: 96, color: C.ink}}>первые 9 месяцев</div>
        <div style={{fontFamily: SANS, fontWeight: 700, fontSize: 260, letterSpacing: -10, color: C.ink, lineHeight: 1}}>{y}</div>
      </div>
      <Pop src="items/stopwatch.png" at={4} x={170} y={720} w={190} />
      <Pop src="items/briefcase.png" at={wf("работодатели") - from} x={910} y={720} w={190} />
      <Pill at={wf('сша') - from} x={540} y={760} bg={C.violet} size={44}>США</Pill>
    </Split>
  );
};

// 6 — C: 120 000 jobs
export const SJobs: React.FC<P> = ({from, dur}) => {
  const fr = useCurrentFrame();
  const at = wf('120') - from;
  const n = Math.round(interpolate(fr, [at, at + 30], [0, 120000], {...clamp, easing: ease}));
  return (
    <AbsoluteFill>
      <Bg src="img/S2.jpg" dur={dur} zoom={[1.15, 1.0]} />
      <AbsoluteFill style={{background: 'linear-gradient(180deg, rgba(244,241,234,0.92) 0%, rgba(244,241,234,0.6) 32%, transparent 50%)'}} />
      <div style={{position: 'absolute', top: 150, width: '100%', textAlign: 'center'}}>
        <div style={{fontFamily: SANS, fontWeight: 700, fontSize: 170, letterSpacing: -6, color: C.ink, lineHeight: 1}}>
          {fr >= at ? n.toLocaleString('ru-RU').replace(/ |,/g, ' ') : ''}
        </div>
        {fr >= at && <div style={{...serifIt, fontSize: 92, color: C.ink, opacity: interpolate(fr, [at + 10, at + 20], [0, 1], clamp)}}>рабочих мест из-за ИИ</div>}
      </div>
      <div style={{position: 'absolute', top: 470, left: 90, right: 90, display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 14}}>
        {Array.from({length: 16}).map((_, i) => {
          const off = at + 12 + i * 2;
          const o = interpolate(fr, [off, off + 6], [1, 0.15], clamp);
          return <Img key={i} src={S(`ppl/p${i}.png`)} style={{width: 92, opacity: o, filter: fr > off ? 'grayscale(1)' : 'none', scale: String(pop(fr, 2 + i))}} />;
        })}
      </div>
      <Grain />
    </AbsoluteFill>
  );
};

// 7 — B: phone — profession update
export const SPhone: React.FC<P> = ({from, dur}) => {
  const fr = useCurrentFrame();
  const changed = wf('изменилась') - from;
  const p = interpolate(fr, [6, changed - 4], [0, 99], clamp);
  const hy = interpolate(pop(fr, 0), [0, 1], [500, 0]);
  return (
    <Split from={from}>
      <Bg src="img/BG3.jpg" dur={dur} zoom={[1.05, 1.12]} />
      <div style={{position: 'absolute', left: 230, top: 120 + hy, width: 640, scale: '1.45', transformOrigin: '50% 0%'}}>
        <Img src={S('hands/phone.png')} style={{width: 640}} />
        {/* screen content — positioned over the phone screen */}
        <div style={{position: 'absolute', left: 118, top: 40, width: 196, height: 400, borderRadius: 26, background: '#fff', overflow: 'hidden', padding: 18, boxSizing: 'border-box', fontFamily: SANS}}>
          {fr < changed ? (
            <>
              <div style={{fontSize: 22, fontWeight: 700, color: C.ink}}>Профессия</div>
              <div style={{fontSize: 16, color: '#777', marginTop: 4}}>установка…</div>
              <div style={{height: 14, background: '#eee', borderRadius: 8, marginTop: 120}}>
                <div style={{height: 14, width: `${p}%`, background: C.violet, borderRadius: 8}} />
              </div>
              <div style={{fontSize: 30, fontWeight: 700, color: C.ink, marginTop: 10}}>{Math.round(p)}%</div>
            </>
          ) : (
            <div style={{scale: String(pop(fr, changed))}}>
              <div style={{fontSize: 40, marginTop: 30}}>⚠️</div>
              <div style={{fontSize: 22, fontWeight: 700, color: C.ink, marginTop: 10, lineHeight: 1.15}}>Доступна новая версия</div>
              <div style={{marginTop: 70, background: C.orange, color: '#fff', fontSize: 20, fontWeight: 700, borderRadius: 999, padding: '10px 0', textAlign: 'center'}}>Обновить</div>
            </div>
          )}
        </div>
      </div>
    </Split>
  );
};

// 8 — C: pencil rocket
export const SRocket: React.FC<P> = ({dur}) => {
  const fr = useCurrentFrame();
  return (
    <AbsoluteFill>
      <Bg src="img/S3.jpg" dur={dur} zoom={[1.18, 1.05]} pan={[-40, 40]} panY={[60, -60]} />
      {['book', 'cap', 'diploma', 'rocket'].map((it, i) => (
        <Img key={it} src={S(`items/${it}.png`)} style={{position: 'absolute', width: 130 + i * 20,
          left: [80, 820, 150, 760][i] - fr * 2, top: [300, 520, 1500, 1350][i] + fr * (i % 2 ? 7 : -6), rotate: `${fr * 3 * (i % 2 ? 1 : -1)}deg`, opacity: 0.95}} />
      ))}
      <Grain />
    </AbsoluteFill>
  );
};

// 9 — B: conductor — manage the process
export const SConduct: React.FC<P> = ({from, dur}) => {
  const fr = useCurrentFrame();
  const it: [string, string, string, number, number][] = [
    ['checklist', 'ставить', 'задачи', 190, 300], ['toolbox', 'выбирать', 'инструменты', 420, 180],
    ['robot', 'подключать', 'ИИ', 660, 180], ['target', 'контролировать', 'результат', 890, 300],
  ];
  return (
    <Split from={from}>
      <Bg src="img/BG1.jpg" dur={dur} zoom={[1.1, 1.18]} />
      <Img src={S('poses/conduct.png')} style={{position: 'absolute', height: 560, left: 540 - 200, top: TOP_H - 600 + Math.sin(fr / 6) * 6}} />
      {it.map(([src, w, label, x, y]) => (
        <React.Fragment key={src}>
          <Pop src={`items/${src}.png`} at={wf(w) - from} x={x} y={y} w={200} />
          <Pill at={wf(w) - from + 4} x={x} y={y + 130} size={30}>{label}</Pill>
        </React.Fragment>
      ))}
    </Split>
  );
};

// 10 — B: puzzle — at the intersection
export const SPuzzle: React.FC<P> = ({from, dur}) => {
  const fr = useCurrentFrame();
  const join = wf('стыке') - from;
  const k = interpolate(fr, [join - 14, join], [1, 0], {...clamp, easing: ease});
  return (
    <Split from={from}>
      <Bg src="img/BG1.jpg" dur={dur} zoom={[1.2, 1.1]} pan={[40, -20]} />
      <Pop src="items/rocket.png" at={wf('осваивать') - from} x={180} y={260} w={200} />
      <Pop src="items/book.png" at={wf('новое') - from} x={900} y={260} w={200} />
      <div style={{position: 'absolute', left: 240, top: 520, width: 600, height: 480}}>
        <Img src={S('items/puzzle.png')} style={{position: 'absolute', width: 600, clipPath: 'inset(0 50% 0 0)', translate: `${-k * 220}px 0px`}} />
        <Img src={S('items/puzzle.png')} style={{position: 'absolute', width: 600, clipPath: 'inset(0 0 0 50%)', translate: `${k * 220}px 0px`}} />
      </div>
      {fr >= join && <Pop src="items/sparkle.png" at={join} x={540} y={520} w={180} />}
      <Img src={S('poses/balance.png')} style={{position: 'absolute', height: 400, left: 540 - 170, top: 180 + Math.sin(fr / 8) * 5, rotate: `${Math.sin(fr / 10) * 4}deg`}} />
    </Split>
  );
};

// 11 — B: mechanical work -> ideas -> good vs bad
export const SJudge: React.FC<P> = ({from, dur}) => {
  const fr = useCurrentFrame();
  const idea = wf('придумывать') - from;
  const judge = wf('отличать') - from;
  return (
    <Split from={from}>
      <Bg src="img/BG4.jpg" dur={dur} zoom={[1.05, 1.12]} filter={fr >= idea ? 'brightness(1.05)' : 'brightness(0.8)'} />
      {fr < judge && (
        <>
          <Img src={S('items/conveyor.png')} style={{position: 'absolute', width: 900, left: 90, top: 720}} />
          {Array.from({length: 5}).map((_, i) => (
            <Img key={i} src={S('items/box.png')} style={{position: 'absolute', width: 150, top: 610, left: ((fr * 6 + i * 220) % 1100) - 150}} />
          ))}
          <Pop src="items/bulb.png" at={idea} x={540} y={330} w={300} />
        </>
      )}
      {fr >= judge && (
        <AbsoluteFill style={{background: 'rgba(244,241,234,0.85)', opacity: interpolate(fr, [judge, judge + 5], [0, 1], clamp)}}>
          <Pop src="items/artgood.png" at={judge} x={300} y={420} w={330} float={4} />
          <Pop src="items/artbad.png" at={judge + 3} x={790} y={420} w={330} float={4} rot={-6} />
          <Pop src="items/check.png" at={wf('хорошую') - from} x={380} y={650} w={170} />
          <Pop src="items/cross.png" at={wf('плохой') - from} x={870} y={650} w={170} />
          <Img src={S('poses/magnify.png')} style={{position: 'absolute', height: 420, left: 420, top: 560 + interpolate(pop(fr, judge), [0, 1], [400, 0])}} />
        </AbsoluteFill>
      )}
    </Split>
  );
};

// 12 — C: laptop timeline — "this reel was edited by AI"
const SCREEN = {x: 258, y: 308, w: 418, h: 187}; // preview window in S4 (source px)
export const SLaptop: React.FC<P> = ({dur}) => {
  const fr = useCurrentFrame();
  const z = interpolate(fr, [0, 30], [2.1, 1], {...clamp, easing: ease});
  const sc = 1920 / 1536; // image fit by height
  const ox = (1080 - 1024 * sc) / 2;
  const thumbs = ['img/S1.jpg', 'img/S3.jpg', 'img/S2.jpg', 'img/BG5.jpg'];
  const cur = thumbs[Math.floor(fr / 9) % thumbs.length];
  const ph = interpolate(fr, [0, dur], [0, 1], clamp);
  return (
    <AbsoluteFill style={{background: C.cream}}>
      <AbsoluteFill style={{scale: String(z), transformOrigin: `${ox + (SCREEN.x + SCREEN.w / 2) * sc}px ${(SCREEN.y + SCREEN.h / 2) * sc}px`}}>
        <Img src={S('img/S4.jpg')} style={{position: 'absolute', height: 1920, left: ox}} />
        <Img src={S(cur)} style={{position: 'absolute', left: ox + SCREEN.x * sc, top: SCREEN.y * sc, width: SCREEN.w * sc, height: SCREEN.h * sc, objectFit: 'cover', borderRadius: 6}} />
        <div style={{position: 'absolute', left: ox + (258 + ph * 380) * sc, top: 530 * sc, width: 4, height: 120 * sc, background: C.orange}} />
      </AbsoluteFill>
      <div style={{position: 'absolute', left: 60, right: 60, top: 40, height: 260, borderRadius: 60, background: 'rgba(244,241,234,0.88)', filter: 'blur(14px)'}} />
      <Title at={12} top={70} a="весь этот рилс" b="смонтирован нейросетью" sizeA={72} sizeB={80} />
      <Grain />
    </AbsoluteFill>
  );
};

// 13 — A: CTA
export const SCta: React.FC<P> = ({from}) => {
  const fr = useCurrentFrame();
  const k = wf('монтаж', 0) - from;
  return (
    <AbsoluteFill>
      <Avatar from={from} />
      <AbsoluteFill style={{background: 'linear-gradient(0deg, rgba(28,27,34,0.8) 0%, rgba(28,27,34,0.35) 35%, transparent 60%)'}} />
      <div style={{position: 'absolute', top: 980, width: '100%', textAlign: 'center'}}>
        <div style={{...serifIt, fontSize: 92, color: '#fff'}}>пиши в комментариях</div>
        {fr >= k - 2 && (
          <div style={{display: 'inline-block', marginTop: 14, scale: String(pop(fr, k - 2)), background: C.orange, borderRadius: 999, padding: '10px 54px', fontFamily: SANS, fontWeight: 700, fontSize: 112, letterSpacing: -3, color: '#fff', boxShadow: '0 16px 40px rgba(0,0,0,0.3)'}}>МОНТАЖ</div>
        )}
      </div>
    </AbsoluteFill>
  );
};

export const BOUNDS = () => [
  0, wf('ещё'), wf('10'), wf('но'), wf('обучиться'), wf('за', 2), wf('объявили'), wfPrev('вот'), wf('поэтому'), wf('учить'), wf('быстро', 1), wf('выполнять'), wf('кстати'), wf('пиши'),
];
export const MODES = ['A', 'C', 'B', 'C', 'B', 'B', 'C', 'B', 'C', 'B', 'B', 'B', 'C', 'A'] as const;
export const SCENES = [SHook, S3Orbit, MPath, S3Coaster, MRace, SYear, S3Jobs, SPhone, S3Rocket, MCycle, SPuzzle, SJudge, S3Laptop, SCta];
