import React from 'react';
import {AbsoluteFill, Img, interpolate, spring, staticFile, useCurrentFrame} from 'remotion';
import {
  Avatar, Bg, C, CRT, Flash, FPS, PIX, Panel, Pickup, PixText, SANS, SERIF, Shake, Split, TOP_H, serifIt,
  clamp, f, pop, stepF, wf,
} from './kit';

const S = (p: string) => staticFile(p);

// ---------------- A: hook ----------------
export const S1Hook: React.FC = () => {
  const fr = useCurrentFrame();
  const n = Math.round(interpolate(fr, [2, 34], [0, 20000000], {...clamp, easing: (t) => 1 - Math.pow(1 - t, 3)}));
  const s = pop(fr, 0);
  return (
    <AbsoluteFill>
      <Avatar from={0} />
      <AbsoluteFill style={{background: 'linear-gradient(0deg, rgba(14,36,34,0.85) 0%, rgba(14,36,34,0.55) 30%, transparent 55%)'}} />
      <div style={{position: 'absolute', top: 980, width: '100%', textAlign: 'center', scale: String(s)}}>
        <div style={{fontFamily: SANS, fontWeight: 700, fontSize: 132, color: '#fff', letterSpacing: -3, textShadow: '0 0 30px rgba(255,255,255,0.35), 0 6px 30px rgba(0,0,0,0.5)'}}>
          {n.toLocaleString('ru-RU').replace(/,/g, ' ').replace(/ /g, ' ')}
        </div>
        <div style={{...serifIt, fontSize: 108, color: '#fff', marginTop: -18, textShadow: '0 0 28px rgba(255,255,255,0.4)', display: 'inline-block', position: 'relative'}}>
          рилсов каждый день
          <div style={{position: 'absolute', left: 6, bottom: 8, height: 4, width: `${interpolate(fr, [10, 30], [0, 100], clamp)}%`, background: C.orange, borderRadius: 2}} />
        </div>
      </div>
    </AbsoluteFill>
  );
};

// ---------------- C: loading world ----------------
const rnd = (i: number) => {
  const x = Math.sin(i * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
};
export const S2Loading: React.FC<{dur: number}> = ({dur}) => {
  const fr = useCurrentFrame();
  const p = interpolate(stepF(fr, 3), [0, dur - 6], [0, 1], clamp);
  return (
    <AbsoluteFill>
      <Bg src="img/BG1.jpg" dur={dur} zoom={[1.15, 1.25]} panX={[80, -80]} />
      {Array.from({length: 16}).map((_, i) => {
        const w = 110 + rnd(i) * 170;
        const speed = 18 + rnd(i + 9) * 26;
        const y = 2100 - (stepF(fr, 2) + rnd(i + 3) * 60) * speed + rnd(i + 5) * 600;
        return <Img key={i} src={S('items/I1_1.png')} style={{position: 'absolute', left: rnd(i + 1) * 1000 - 40, top: y, width: w, rotate: `${(rnd(i + 7) - 0.5) * 30}deg`, opacity: 0.95}} />;
      })}
      <CRT />
      <Panel dark style={{left: 90, top: 200, width: 900, padding: '26px 30px'}}>
        <div style={{display: 'flex', justifyContent: 'space-between', fontSize: 46, fontWeight: 700}}>
          <span>ЗАГРУЗКА…</span><span style={{color: C.orange}}>{Math.round(p * 100)}%</span>
        </div>
        <div style={{display: 'flex', gap: 8, marginTop: 18}}>
          {Array.from({length: 20}).map((_, i) => (
            <div key={i} style={{flex: 1, height: 38, background: i / 20 < p ? C.orange : 'rgba(243,239,231,0.15)', borderRadius: 3}} />
          ))}
        </div>
        <div style={{fontSize: 30, marginTop: 16, opacity: 0.8}}>НОВЫХ РИЛСОВ СЕГОДНЯ: {Math.round(p * 20000000).toLocaleString('ru-RU').replace(/,/g, ' ')}</div>
      </Panel>
    </AbsoluteFill>
  );
};

// ---------------- B: studio for everyone ----------------
export const S3Studio: React.FC<{from: number; dur: number}> = ({from, dur}) => {
  const fr = useCurrentFrame();
  const sf = stepF(fr, 3);
  const x = interpolate(sf, [0, 24], [-300, 540], {...clamp, easing: (t) => 1 - Math.pow(1 - t, 2)});
  const bobY = Math.abs(Math.sin(sf / 3)) * (sf < 24 ? 14 : 0);
  return (
    <Split from={from} dur={dur} label="ЛОКАЦИЯ: СТУДИЯ">
      <Bg src="img/BG2.jpg" dur={dur} zoom={[1.0, 1.08]} posY="60%" />
      <Img src={S('poses/stand.png')} style={{position: 'absolute', height: 860, left: x - 190, top: TOP_H - 860 - 20 - bobY}} />
      <Pickup src="items/I1_6.png" at={wf('уровне') - from} x={200} y={520} w={250} />
      <Pickup src="items/I1_7.png" at={wf('продакшенов') - from} x={880} y={500} w={270} spin />
      <Pickup src="items/I5_1.png" at={wf('каждый', 1) - from} x={540} y={250} w={200} />
    </Split>
  );
};

// ---------------- B: VS ----------------
const HpBar: React.FC<{name: string; pct: number; right?: boolean}> = ({name, pct, right}) => (
  <div style={{position: 'absolute', top: 120, [right ? 'right' : 'left']: 36, width: 440, fontFamily: PIX}}>
    <div style={{fontSize: 34, fontWeight: 700, color: C.cream, textShadow: `3px 3px 0 ${C.ink}`, textAlign: right ? 'right' : 'left'}}>{name}</div>
    <div style={{height: 34, border: `5px solid ${C.cream}`, background: C.ink, marginTop: 6, display: 'flex', justifyContent: right ? 'flex-end' : 'flex-start'}}>
      <div style={{width: `${pct}%`, background: right ? C.teal : C.orange}} />
    </div>
  </div>
);
export const S4Versus: React.FC<{from: number; dur: number}> = ({from, dur}) => {
  const fr = useCurrentFrame();
  const vsAt = wf('спорили') - from - 4;
  const chg = wf('уже') - from;
  const vs = pop(fr, vsAt);
  const sf = stepF(fr, 3);
  const aiHp = interpolate(fr, [wf('заменит') - from, wf('монтажёров') - from + 10], [100, 62], clamp);
  return (
    <Split from={from} dur={dur}>
      <Shake at={vsAt}>
        <Bg src="img/BG4.jpg" dur={dur} zoom={[1.05, 1.12]} posY="40%" />
        <Img src={S('poses/victory.png')} style={{position: 'absolute', height: 760, left: -40, top: TOP_H - 760 + Math.sin(sf / 5) * 6}} />
        <Img src={S('items/I3_1.png')} style={{position: 'absolute', width: 420, left: 610, top: 470 + Math.sin(sf / 4) * 14, scaleX: '-1'} as React.CSSProperties} />
        {fr >= vsAt && (
          <div style={{position: 'absolute', left: 540, top: 470, translate: '-50% -50%', scale: String(vs)}}>
            <Img src={S('items/I5_3.png')} style={{width: 420, position: 'absolute', left: -210, top: -230}} />
            <PixText size={190} color={C.orange} style={{position: 'relative', textAlign: 'center', width: 400, left: -200, top: -130}}>VS</PixText>
          </div>
        )}
        <HpBar name="ИГРОК 1" pct={100} />
        <HpBar name="ИИ-МОНТАЖЁР" pct={aiHp} right />
        {fr >= chg && (
          <Panel dark style={{left: 140, top: 820, width: 800, padding: '18px 0', textAlign: 'center', fontSize: 52, fontWeight: 700, scale: String(pop(fr, chg))}}>
            ПРАВИЛА ИЗМЕНИЛИСЬ
          </Panel>
        )}
      </Shake>
      <Flash at={vsAt} />
    </Split>
  );
};

// ---------------- C: new item ----------------
export const S5Item: React.FC<{from: number; dur: number}> = ({from, dur}) => {
  const fr = useCurrentFrame();
  const panel = pop(fr, 2);
  const t30 = wf('30') - from;
  const glow = 0.55 + Math.sin(fr / 4) * 0.15;
  return (
    <AbsoluteFill>
      <Bg src="img/BG1.jpg" dur={dur} zoom={[1.2, 1.3]} panX={[-90, 40]} />
      <div style={{position: 'absolute', left: 290, top: 0, width: 500, height: 1920, background: `linear-gradient(90deg, transparent, rgba(243,239,231,${glow}) 50%, transparent)`, filter: 'blur(18px)'}} />
      <Img src={S('poses/laptop.png')} style={{position: 'absolute', width: 1080, left: 0, bottom: 0}} />
      <CRT />
      <Panel dark style={{left: 90, top: 190, width: 900, padding: '24px 30px', scale: String(panel)}}>
        <div style={{fontSize: 44, color: C.orange, fontWeight: 700}}>★ НОВЫЙ ПРЕДМЕТ!</div>
        <div style={{display: 'flex', alignItems: 'center', gap: 24, marginTop: 12}}>
          <Img src={S('items/I3_3.png')} style={{width: 150}} />
          <div style={{fontSize: 52, fontWeight: 700, lineHeight: 1.1}}>Claude Code<br />+ Remotion</div>
        </div>
      </Panel>
      {fr >= t30 && (
        <div style={{position: 'absolute', left: 540, top: 720, translate: '-50% 0', display: 'flex', alignItems: 'center', gap: 20, scale: String(pop(fr, t30))}}>
          <Img src={S('items/I6_3.png')} style={{width: 190}} />
          <PixText size={120} color={C.orange}>30 МИН</PixText>
        </div>
      )}
    </AbsoluteFill>
  );
};

// ---------------- B: prompt -> inventory ----------------
const PROMPT = 'Собери ролик из моих съёмок: нарежь, добавь субтитры, анимацию, графику и звук';
export const S6Inventory: React.FC<{from: number; dur: number}> = ({from, dur}) => {
  const fr = useCurrentFrame();
  const chars = Math.floor(interpolate(fr, [4, wf('собирает') - from], [0, PROMPT.length], clamp));
  const slots: [string, string][] = [
    ['items/I2_8.png', 'описываешь'], ['items/I2_3.png', 'собирает'], ['items/I2_2.png', 'съёмок'], ['items/I2_1.png', 'нарезает'],
    ['items/I2_5.png', 'субтитры'], ['items/I2_4.png', 'анимацию'], ['items/I3_9.png', 'графику'], ['items/I2_7.png', 'звук'],
  ];
  return (
    <Split from={from} dur={dur} label="ИНВЕНТАРЬ">
      <Bg src="img/BG3.jpg" dur={dur} zoom={[1.05, 1.1]} dim={0.25} />
      <div style={{position: 'absolute', left: 50, top: 130, width: 980, height: 330, background: C.cream, borderRadius: 22, border: `6px solid ${C.deep}`, boxShadow: '0 16px 0 rgba(0,0,0,0.35)', padding: '22px 32px', boxSizing: 'border-box'}}>
        <div style={{fontFamily: PIX, fontSize: 30, color: C.teal, fontWeight: 700}}>&gt; CLAUDE CODE</div>
        <div style={{fontFamily: SANS, fontWeight: 600, fontSize: 44, color: C.ink, marginTop: 10, lineHeight: 1.25}}>
          {PROMPT.slice(0, chars)}
          <span style={{opacity: Math.floor(fr / 8) % 2 ? 1 : 0, color: C.orange}}>▌</span>
        </div>
      </div>
      {slots.map(([src, w], i) => {
        const col = i % 4, row = Math.floor(i / 4);
        const x = 75 + col * 240, y = 520 + row * 260;
        const at = wf(w) - from;
        return (
          <React.Fragment key={i}>
            <div style={{position: 'absolute', left: x, top: y, width: 210, height: 210, background: 'rgba(14,36,34,0.82)', border: `5px solid ${fr >= at ? C.orange : C.cream}`, borderRadius: 16}} />
            <Pickup src={src} at={at} x={x + 105} y={y + 105} w={180} bob={5} />
          </React.Fragment>
        );
      })}
    </Split>
  );
};

// ---------------- B: manual grind ----------------
export const S7Grind: React.FC<{from: number; dur: number}> = ({from, dur}) => {
  const fr = useCurrentFrame();
  const sf = stepF(fr, 3);
  const pile: [string, number, number, number, number][] = [
    ['items/I2_2.png', 180, 640, 260, -20], ['items/I2_3.png', 860, 650, 260, 15], ['items/I2_4.png', 300, 380, 200, 25],
    ['items/I2_2.png', 760, 360, 220, -30], ['items/I2_3.png', 130, 900, 220, 10], ['items/I2_1.png', 930, 920, 200, -15],
  ];
  return (
    <Split from={from} dur={dur} label="РЕЖИМ: ВРУЧНУЮ">
      <Bg src="img/BG2.jpg" dur={dur} zoom={[1.1, 1.15]} dim={0.5} posY="60%" />
      {pile.map(([src, x, y, w, r], i) => (
        <Img key={i} src={S(src)} style={{position: 'absolute', left: x - w / 2, top: y - w / 2 + (fr < i * 3 ? -400 : 0), width: w, rotate: `${r}deg`, opacity: 0.95}} />
      ))}
      <Img src={S('sprites/sleep.png')} style={{position: 'absolute', height: 470, left: 540 - 180, top: TOP_H - 500 + Math.sin(sf / 6) * 4}} />
      <Img src={S('items/I4_2.png')} style={{position: 'absolute', width: 230, left: 820, top: 150, rotate: `${Math.sin(fr * 1.7) * 9}deg`}} />
    </Split>
  );
};

// ---------------- C: level up ----------------
export const S8LevelUp: React.FC<{dur: number}> = ({dur}) => {
  const fr = useCurrentFrame();
  const s = pop(fr, 0);
  const strike = interpolate(fr, [8, 14], [0, 100], clamp);
  return (
    <AbsoluteFill>
      <Shake at={0} amp={10}>
        <Bg src="img/BG4.jpg" dur={dur} zoom={[1.25, 1.4]} />
        <AbsoluteFill style={{background: `radial-gradient(circle at 50% 55%, rgba(232,98,44,0.55), transparent 55%)`}} />
        <Img src={S('items/I4_3.png')} style={{position: 'absolute', width: 520, left: 280, top: 900, scale: String(s)}} />
        <Img src={S('sprites/jump.png')} style={{position: 'absolute', height: 380, left: 420, top: 560 - Math.abs(Math.sin(stepF(fr, 2) / 4)) * 80}} />
        <CRT />
        <div style={{position: 'absolute', top: 220, width: '100%', textAlign: 'center', scale: String(s)}}>
          <PixText size={124} color={C.orange}>УРОВЕНЬ<br />ПОВЫШЕН!</PixText>
        </div>
        <Panel dark style={{left: 140, top: 1560, width: 800, padding: '16px 0', textAlign: 'center', fontSize: 44, fontWeight: 700}}>
          СЛОЖНОСТЬ: <span style={{position: 'relative', opacity: 0.6}}>ВЫСОКАЯ<span style={{position: 'absolute', left: 0, top: '50%', height: 6, width: `${strike}%`, background: C.orange}} /></span>
          <span style={{color: C.orange, opacity: strike / 100}}> → НИЗКАЯ</span>
        </Panel>
      </Shake>
      <Flash at={0} color={C.orange} />
    </AbsoluteFill>
  );
};

// ---------------- B: production vs viewer time ----------------
export const S9Chart: React.FC<{from: number; dur: number}> = ({from, dur}) => {
  const fr = useCurrentFrame();
  const g = interpolate(fr, [wf('производство') - from, wf('ускорилось') - from + 12], [0.35, 1.15], {...clamp, easing: (t) => 1 - Math.pow(1 - t, 3)});
  const zero = wf('не', 1) - from;
  const lbl = (t: string, x: number) => <div style={{position: 'absolute', left: x, top: 210, width: 460, textAlign: 'center', fontFamily: PIX, fontWeight: 700, fontSize: 44, color: C.ink}}>{t}</div>;
  return (
    <Split from={from} dur={dur}>
      <Bg src="img/BG5.jpg" dur={dur} zoom={[1, 1.03]} />
      {lbl('ПРОИЗВОДСТВО', 40)}
      {lbl('ВРЕМЯ ЗРИТЕЛЯ', 580)}
      <div style={{position: 'absolute', left: 540, top: 280, width: 4, height: 760, background: `repeating-linear-gradient(${C.deep} 0 16px, transparent 16px 30px)`}} />
      <Img src={S('items/I6_1.png')} style={{position: 'absolute', width: 400, left: 70, top: 380, scale: String(g), transformOrigin: '50% 100%'}} />
      <Img src={S('items/I4_1.png')} style={{position: 'absolute', width: 300, left: 660, top: 380, rotate: `${Math.floor(fr / 20) % 2 ? 180 : 0}deg`}} />
      <div style={{position: 'absolute', left: 580, top: 760, width: 460, textAlign: 'center', fontFamily: SANS, fontWeight: 700, fontSize: 120, letterSpacing: -3, color: C.deep}}>24 ч</div>
      {fr >= zero && (
        <div style={{position: 'absolute', left: 580, top: 900, width: 460, textAlign: 'center', scale: String(pop(fr, zero))}}>
          <PixText size={64} color={C.orange}>+0 ЧАСОВ</PixText>
        </div>
      )}
    </Split>
  );
};

// ---------------- C: rare items ----------------
export const S10Rare: React.FC<{from: number; dur: number}> = ({from, dur}) => {
  const fr = useCurrentFrame();
  const items: [string, string, string, number, number][] = [
    ['items/I4_5.png', 'идеи', 'ИДЕЯ', 230, 520], ['items/I4_6.png', 'вкус', 'ВКУС', 540, 360], ['items/I4_7.png', 'реализация', 'РЕАЛИЗАЦИЯ', 850, 520],
  ];
  return (
    <AbsoluteFill>
      <Bg src="img/BG1.jpg" dur={dur} zoom={[1.3, 1.38]} panX={[60, -20]} />
      <Img src={S('poses/think.png')} style={{position: 'absolute', width: 1080, left: 0, bottom: 0}} />
      <CRT />
      <div style={{position: 'absolute', top: 120, width: '100%', textAlign: 'center'}}>
        <PixText size={56} color={C.cream}>РЕДКИЕ ПРЕДМЕТЫ</PixText>
      </div>
      {items.map(([src, w, label, x, y], i) => {
        const at = wf(w) - from;
        if (fr < at) return null;
        return (
          <React.Fragment key={i}>
            <div style={{position: 'absolute', left: x - 140, top: y - 140, width: 280, height: 280, borderRadius: '50%', background: 'radial-gradient(circle, rgba(232,98,44,0.6), transparent 70%)', scale: String(pop(fr, at))}} />
            <Pickup src={src} at={at} x={x} y={y} w={230} />
            <div style={{position: 'absolute', left: x - 160, top: y + 120, width: 320, textAlign: 'center', scale: String(pop(fr, at + 3))}}>
              <PixText size={40} color={C.orange}>{label}</PixText>
            </div>
          </React.Fragment>
        );
      })}
    </AbsoluteFill>
  );
};

// ---------------- B: clone feed ----------------
export const S11Clones: React.FC<{from: number; dur: number}> = ({from, dur}) => {
  const fr = useCurrentFrame();
  const swipe = wf('пролистывать') - from;
  const base = stepF(fr, 2) * 3;
  const fast = interpolate(fr, [swipe, swipe + 12], [0, 900], {...clamp, easing: (t) => t * t});
  const off = (base + fast) % 380;
  const xAt = wf('надоедят') - from;
  return (
    <Split from={from} dur={dur} label="ЛЕНТА">
      <Bg src="img/BG3.jpg" dur={dur} dim={0.35} />
      {Array.from({length: 5}).map((_, r) =>
        Array.from({length: 4}).map((__, c) => (
          <div key={`${r}-${c}`} style={{position: 'absolute', left: 50 + c * 250, top: r * 380 - off - 120, width: 220, height: 350, borderRadius: 26, background: 'rgba(20,20,20,0.85)', border: `5px solid #6b6b6b`, overflow: 'hidden'}}>
            <Img src={S('poses/clone.png')} style={{height: 320, position: 'absolute', left: 50, top: 22}} />
          </div>
        )),
      )}
      <Pickup src="items/I5_2.png" at={xAt} x={540} y={520} w={340} bob={4} />
      <Pickup src="items/I4_9.png" at={wf('однотипные') - from} x={900} y={820 - Math.max(0, fr - swipe) * 18} w={230} bob={0} />
    </Split>
  );
};

// ---------------- C: character select ----------------
export const S12Select: React.FC<{from: number; dur: number}> = ({from, dur}) => {
  const fr = useCurrentFrame();
  const pick = wf('свой') - from;
  const xs = [140, 340, 540, 740, 940];
  const order = [0, 1, 3, 4, 1, 3, 2];
  const stepLen = Math.max(4, Math.floor((pick - 6) / order.length));
  const idx = fr >= pick ? 2 : order[Math.min(order.length - 1, Math.floor(fr / stepLen))];
  const chosen = fr >= pick;
  const glow = chosen ? pop(fr, pick) : 0;
  return (
    <AbsoluteFill>
      <Bg src="img/BG3.jpg" dur={dur} zoom={[1.3, 1.35]} dim={0.3} />
      <div style={{position: 'absolute', top: 170, width: '100%', textAlign: 'center'}}>
        <PixText size={76} color={C.cream}>ВЫБЕРИ ПЕРСОНАЖА</PixText>
      </div>
      {xs.map((x, i) => {
        const me = i === 2;
        const h = me ? 760 : 560;
        const baseY = 1330;
        return (
          <React.Fragment key={i}>
            <div style={{position: 'absolute', left: x - 110, top: baseY - 30, width: 220, height: 70, borderRadius: '50%', background: me && chosen ? C.orange : '#3a4a48', boxShadow: me && chosen ? `0 0 ${60 * glow}px ${C.orange}` : 'none', border: `4px solid ${C.cream}55`}} />
            <Img src={S(me ? 'poses/stand.png' : 'poses/clone.png')} style={{position: 'absolute', height: h, left: x - (me ? 155 : 110), top: baseY - h, filter: me && !chosen ? 'grayscale(1) brightness(0.8)' : 'none', opacity: me ? 1 : 0.75, scale: me && chosen ? String(1 + glow * 0.06) : '1', transformOrigin: '50% 100%'}} />
          </React.Fragment>
        );
      })}
      <div style={{position: 'absolute', left: xs[idx] - 40, top: (idx === 2 ? 470 : 660) + Math.sin(fr / 3) * 10}}>
        <PixText size={90} color={C.orange}>▼</PixText>
      </div>
      {chosen && (
        <Panel dark style={{left: 190, top: 1410, width: 700, padding: '14px 0', textAlign: 'center', fontSize: 56, fontWeight: 700, scale: String(glow)}}>
          ВЫБРАН: <span style={{color: C.orange}}>СВОЙ СТИЛЬ</span>
        </Panel>
      )}
      <CRT />
      <Flash at={pick} color={C.cream} />
    </AbsoluteFill>
  );
};

// ---------------- B: manual / booklet ----------------
export const S13Booklet: React.FC<{from: number; dur: number}> = ({from, dur}) => {
  const fr = useCurrentFrame();
  const s = spring({frame: fr, fps: FPS, config: {damping: 13}});
  return (
    <Split from={from} dur={dur} label="ИНСТРУКЦИЯ">
      <Bg src="img/BG5.jpg" dur={dur} zoom={[1, 1.03]} />
      <Img src={S('poses/booklet.png')} style={{position: 'absolute', height: 1000, left: 330, top: 110, translate: `${interpolate(s, [0, 1], [500, 0])}px 0px`}} />
      <Pickup src="items/I3_3.png" at={wf('claude code', 1) - from} x={210} y={420} w={260} />
      <Pickup src="items/I2_3.png" at={wf('remotion', 1) - from} x={210} y={760} w={260} />
    </Split>
  );
};

// ---------------- A: CTA ----------------
export const S14Cta: React.FC<{from: number}> = ({from}) => {
  const fr = useCurrentFrame();
  const k = wf('монтаж', 1) - from;
  const blink = Math.floor(fr / 7) % 2;
  return (
    <AbsoluteFill>
      <Avatar from={from} />
      <AbsoluteFill style={{background: 'linear-gradient(180deg, rgba(14,36,34,0.8) 0%, transparent 42%)'}} />
      <div style={{position: 'absolute', top: 150, width: '100%', textAlign: 'center'}}>
        <div style={{opacity: fr < k ? (blink ? 1 : 0.35) : 0}}>
          <PixText size={64} color={C.cream}>НАЖМИ START</PixText>
        </div>
        {fr >= k && (
          <div style={{scale: String(pop(fr, k)), marginTop: -70}}>
            <div style={{...serifIt, fontSize: 96, color: '#fff', textShadow: '0 0 26px rgba(255,255,255,0.4)'}}>пиши в комментарии</div>
            <div style={{display: 'inline-block', marginTop: 16, background: C.orange, border: `8px solid ${C.cream}`, boxShadow: `0 0 0 8px ${C.deep}, 0 18px 0 8px rgba(0,0,0,0.35)`, borderRadius: 20, padding: '10px 46px'}}>
              <PixText size={120} color={C.cream}>МОНТАЖ</PixText>
            </div>
          </div>
        )}
      </div>
      {fr >= k && <Img src={S('sprites/point.png')} style={{position: 'absolute', height: 300, left: 40, top: 560, scale: String(pop(fr, k + 4))}} />}
    </AbsoluteFill>
  );
};
