---
name: collage-reel
description: "Собрать вертикальный рилс в стиле «бумажный сюр» (3D-герой-наклейка, коллаж, буквы-вырезки, эффект экрана) в Remotion из папки с героем, предметами, фонами и озвучкой."
---

# Коллажный рилс «бумажный сюр»

Пользователь присылает папку (ссылкой на Google Диск или вложением) с героем, предметами, фонами и озвучкой. На выходе — готовый MP4 1080×1920, 30 fps, длиной с озвучку плюс 1 секунда. Монтаж собирается кодом в Remotion. Ничего не генерируется в сторонних сервисах, если пользователь сам не попросил.

## Что лежит в папке (договорённость с пользователем)

```
папка/
  персонаж/   позы героя на белом фоне: 01_…png, H01.png … (имя = поза)
  предметы/   P01.png … — предметы на белом фоне, квадрат
  фоны/       B01… — готовые сцены 9:16; B04 — фактура бумаги; B05 — рваные цветные полосы на белом
  озвучка.mp3 (любое имя, ElevenLabs и т.п.)
  текст.txt   (необязательно — если нет, расшифровать самому)
```

Если чего-то нет: без B04 — бумагу рисовать шумом, без B05 — переход кляксой/листом, без предметов — рисовать плоские предметы SVG в коде. Если ассетов нет совсем, сначала выдать пользователю промпты (раздел «Промпты для генерации») и ждать.

## Стиль (держать во всех роликах)

- **Суть:** тактильный 3D-герой и 3D-предметы живут в плоском мире бумаги, печати и маркера. Каждая фраза показана действием или превращением, а не просто картинкой.
- **Палитра (ризограф):** бумага `#F1E9DA`, тушь `#151515`, томатный `#FF4B1F`, кобальт `#2448FF`, лайм `#DFFF3A`, розовый `#FF8CC6`. Фон сцены — один плашечный цвет поверх бумаги B04 (multiply 0.55) + пятна крупного растра в углах.
- **Цвет по смыслу:** томатный — тревога/угроза; кобальт — рутина/прошлое; лайм — машины/кнопки/выгода; розовый — человек/голова/вдохновение; кремовый — факты/итог; тёмно-синий — ночь.
- **Наклейки:** герой и предметы вырезаны с белой бумажной каймой 12–14 px и жёсткой тенью `drop-shadow(10px 14px 0 rgba(20,10,30,.28))`, слегка «дышат» (поворот ±1° раз в 4 кадра).
- **Движение:** всё на двойках (12 fps внутри 30 fps), появление с отскоком, падение с приземлением и сплющиванием, сплющивание на ударных словах, тряска для тревоги.
- **Контуры кипят:** рисованные элементы и рукописные слова через SVG displacement, сид меняется раз в 3 кадра.
- **Текст в два слоя:**
  1. Рукописные слова Neucha появляются по одному в такт голосу — 1–3 строки на сцену, только ключевые слова.
  2. Ключевые цифры/слова — буквы-вырезки (ransom): каждая буква на своей бумажке своим шрифтом (Rubik Mono One, Russo One, PT Serif Italic, Oswald, Neucha). Пример: «40%», «×10», «−50%», «УЖЕ СЕЙЧАС», «1 РАЗ» (с красным зачёркиванием маркером).
- **Субтитры:** полоска кремовой бумаги внизу (top 1560), Neucha 46, по 3–4 слова, чуть повёрнута, тень.
- **Эффект экрана (поверх всего, слабо):** RGB-сдвиг ±2 px, сетка 5 px soft-light 0.35, зерно overlay 0.2.
- **Переходы — чередовать, почти без голых склеек:** рваные полосы бумаги (TearWipe), клякса-ирис из точки (часто из головы героя), въезжающий цветной лист (SlideIn), предмет вырастает на весь кадр.
- **Голова героя — главный инструмент метафор:** открывается крышкой (старое вылетает, новое влетает), светится лампой (идея/учёба), становится фотоаппаратом, через неё влёт в сцену.

## Порядок работы

Завести задачи (TaskCreate) и идти по ним:

1. **Забрать файлы.** Google Диск: `search_files` с `parentId = '<id>'` (и по подпапкам), потом `download_file_content` на каждый файл — результат сохраняется в tool-results/*.txt (JSON с base64 `content`), декодировать Python'ом в рабочую папку. Прямой curl к Диску заблокирован.
2. **Посмотреть всё глазами:** контактные листы (PIL) по позам, предметам, фонам. Отметить неудачные ассеты.
3. **Расшифровать озвучку с таймингами слов** (даже если текст прислан — нужны тайминги):
   ```bash
   pip install -q sherpa-onnx --break-system-packages
   curl -sSL -o giga.tar.bz2 https://github.com/k2-fsa/sherpa-onnx/releases/download/asr-models/sherpa-onnx-nemo-ctc-giga-am-russian-2024-10-24.tar.bz2 && tar xjf giga.tar.bz2
   ffmpeg -i voice.mp3 -ac 1 -ar 16000 voice.wav
   ffmpeg -i voice.mp3 -af silencedetect=n=-40dB:d=0.25 -f null -   # паузы = границы фраз
   ```
   Распознавать кусками по паузам (<20 с), `OfflineRecognizer.from_nemo_ctc(...)`, токены с `▁` = начало слова, `result.timestamps` + смещение куска. Сохранить `src/timing.json`: `[{s,e,words:[{w,s,e}]}]` по фразам. Числа приходят словами («сорок процентов») — исправлять в субтитрах словарём FIX и показывать цифрами.
4. **Проверить факты в тексте** (статистика, прогнозы, цитаты) веб-поиском. Если не сходится — собрать как есть, но в конце сказать пользователю и предложить формулировку.
5. **Вырезать ассеты нейросетью** (не порогом белого — съедает белую голову героя):
   ```bash
   pip install -q "rembg[cpu]" --break-system-packages   # модель isnet-general-use качается с GitHub
   ```
   Для каждого PNG: `remove(im, session=new_session('isnet-general-use'))`, маска alpha>110, убрать мелкие компоненты, fill_holes, подложить белое, `binary_dilation` на 12–14 px → белая кайма, обрезать по bbox → `public/a/st/<имя>.png` (позы героя переименовать в понятные: h_front, h_palm, h_shock …). Фоны → `public/a/bg/*.jpg` 1080×1920 cover. B05 → отдельные полосы по компонентам связности → `public/a/strip/s0..png`. Проверить вырез контактным листом на цветном фоне.
6. **Раскадровка текстом** — по фразам: фон/цвет, поза героя, предметы, действие-превращение, рукописные слова, ransom, переход, звук. Каждой фразе — своя метафора действием. Показать пользователю, если он просил «сначала текстом»; иначе сразу собирать.
7. **Звук.** Синтезировать ffmpeg-ом (remotion.media недоступен): pop, click, boom, whoosh, rustle, tear, ching, bell, ratchet, boing, sparkle, glitch, whistle + лёгкая подложка-pluck на −20 дБ (громкость 0.28). Рецепты ниже.
8. **Собрать в Remotion** (проект: `npx create-video@latest --yes --blank --no-tailwind reel`, `npx remotion add @remotion/media`, `npm i @fontsource/neucha @fontsource/rubik-mono-one @fontsource/russo-one @fontsource/pt-serif @fontsource/oswald`). Google Fonts по сети не грузятся — только @fontsource. Код основы — `kit.tsx` ниже; сцены — массив SHOTS.
9. **Проверить кадры:** `npx tsc --noEmit`, затем 15–20 стоп-кадров `npx remotion still ... --scale=0.35` в контактный лист. Смотреть: появились ли рукописные слова (частая ошибка — неверный shotFrom), не перекрывают ли друг друга текст/герой/субтитры, нет ли пустых кадров.
10. **Рендер:** браузер `--browser-executable=$(ls -d /opt/pw-browsers/chromium_headless_shell-*/*/)headless_shell`, `--concurrency=$(nproc)` (не больше ядер!), `--crf=18`, в фоне (≈8 мин на 45 с при 2 ядрах). Потом пережать `ffmpeg -c:v libx264 -crf 21 -preset slow -c:a aac -b:a 192k -movflags +faststart`, проверить длительность и громкость (volumedetect), контактный лист 1 кадр/с.
11. **Отдать** SendUserFile (display render) + коротко: что в каких сценах, что синтезировано, что проверить на слух, факт-чек.

## Каталог приёмов (метафоры действием)

- Статистика «N% исчезнут» → ряд маленьких героев, доля лопается конфетти.
- «Работа за десятерых» → за героем веером цветные силуэты-копии (Silhouette, mask-image), вокруг ладони вращаются предметы.
- «Уже сейчас / срочно» → трясущийся будильник + рисованные линии вибрации.
- Список услуг/продуктов → ладонь героя (поза «ладонь»), предметы сменяют друг друга на словах (out предыдущего = at следующего).
- «Раньше нанимали X, Y, Z» → герои выезжают по очереди с подписями маркером.
- «Машина делает быстрее/дешевле» → мясорубка: сырьё падает в воронку, выползает плёнка, ценник ransom.
- Карьерная лестница → ступени-прямоугольники с обводкой, герой прыгает дугами (Hopper), на ступенях предметы.
- «Требования меняются» → бумажная карточка-чеклист, пункты зачёркиваются и переписываются.
- «Учиться/идея» → голова-лампа + тёплое свечение (screen).
- «Пересмотреть привычное» → голова-крышка: старые предметы вылетают, новые влетают (Fly).
- «Новые инструменты» → бег по трассе, предметы летят из точки горизонта на камеру.
- «Снова новичок / рост» → герой уменьшается (Scale), рядом прорастает росток.
- Финал → герой выглядывает из-за края кадра после конца голоса.

## kit.tsx (основа — копировать, менять только пути и FIX)

```tsx
import React from "react";
import { AbsoluteFill, continueRender, delayRender, Easing, Img, interpolate, random, staticFile, useCurrentFrame } from "remotion";
import "@fontsource/neucha/400.css";
import "@fontsource/rubik-mono-one/400.css";
import "@fontsource/russo-one/400.css";
import "@fontsource/pt-serif/700-italic.css";
import "@fontsource/oswald/700.css";
import timing from "../timing.json";

export const FPS = 30;
export const HAND = "Neucha";
type Word = { w: string; s: number; e: number };
type Phrase = { s: number; e: number; words: Word[] };
const PH = timing as Phrase[];
export const T = (p: number, w = 0) => PH[p].words[w].s; // старт слова w фразы p, сек
export const PS = (p: number) => PH[p].s;
export const f = (sec: number) => Math.round(sec * FPS);
export const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
export const C = { paper: "#F1E9DA", ink: "#151515", tomato: "#FF4B1F", cobalt: "#2448FF", lime: "#DFFF3A", pink: "#FF8CC6", navy: "#141A4A" };
export const useStep = (n = 2) => Math.floor(useCurrentFrame() / n) * n; // анимация на двойках

export const FontGate: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [h] = React.useState(() => delayRender("fonts"));
  React.useEffect(() => {
    Promise.all([`80px ${HAND}`, "80px 'Rubik Mono One'", "80px 'Russo One'", "italic 700 80px 'PT Serif'", "700 80px Oswald"].map((x) => document.fonts.load(x, "ПРОГНОЗ 40%"))).then(() => continueRender(h));
  }, [h]);
  return <>{children}</>;
};

export const Defs: React.FC = () => (
  <svg width={0} height={0} style={{ position: "absolute" }}>
    <defs>
      {[0, 1, 2].map((i) => (
        <filter key={i} id={`boil${i}`}>
          <feTurbulence type="fractalNoise" baseFrequency="0.035" numOctaves={2} seed={i * 7 + 3} result="t" />
          <feDisplacementMap in="SourceGraphic" in2="t" scale={5} xChannelSelector="R" yChannelSelector="G" />
        </filter>
      ))}
      <filter id="rgb2" x="0" y="0" width="100%" height="100%" colorInterpolationFilters="sRGB">
        <feColorMatrix in="SourceGraphic" type="matrix" values="1 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 1 0" result="r" />
        <feOffset in="r" dx="-2" result="r2" />
        <feColorMatrix in="SourceGraphic" type="matrix" values="0 0 0 0 0 0 1 0 0 0 0 0 0 0 0 0 0 0 1 0" result="g" />
        <feColorMatrix in="SourceGraphic" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 1 0 0 0 0 0 1 0" result="b" />
        <feOffset in="b" dx="2" result="b2" />
        <feBlend mode="screen" in="r2" in2="g" result="rg" />
        <feBlend mode="screen" in="rg" in2="b2" />
      </filter>
    </defs>
  </svg>
);
export const useBoil = () => `url(#boil${Math.floor(useCurrentFrame() / 3) % 3})`;

export const Sheet: React.FC<{ color: string; dots?: string; children?: React.ReactNode }> = ({ color, dots, children }) => (
  <AbsoluteFill style={{ backgroundColor: color, overflow: "hidden" }}>
    <Img src={staticFile("a/bg/B04.jpg")} style={{ position: "absolute", inset: 0, width: 1080, height: 1920, mixBlendMode: "multiply", opacity: 0.55 }} />
    {dots ? <AbsoluteFill style={{ backgroundImage: `radial-gradient(${dots} 34%, transparent 36%)`, backgroundSize: "26px 26px", WebkitMaskImage: "radial-gradient(circle at 80% 18%, black 0 22%, transparent 45%), radial-gradient(circle at 12% 88%, black 0 18%, transparent 40%)", opacity: 0.55 }} /> : null}
    {children}
  </AbsoluteFill>
);

export const Scenery: React.FC<{ src: string; children?: React.ReactNode; zoom?: [number, number]; dur: number }> = ({ src, children, zoom = [1.04, 1.12], dur }) => {
  const frame = useStep(2);
  return (
    <AbsoluteFill style={{ overflow: "hidden", backgroundColor: C.paper }}>
      <Img src={staticFile(`a/bg/${src}.jpg`)} style={{ position: "absolute", width: 1080, height: 1920, scale: String(interpolate(frame, [0, dur], zoom, clamp)) }} />
      {children}
    </AbsoluteFill>
  );
};

export const Sticker: React.FC<{ name: string; at?: number; out?: number; x: number; y: number; h: number; rot?: number; flip?: boolean; from?: "pop" | "drop" | "left" | "right" | "bottom" | "none"; squashAt?: number[]; shake?: number; wobble?: boolean; style?: React.CSSProperties }> = ({ name, at = 0, out, x, y, h, rot = 0, flip, from = "pop", squashAt = [], shake = 0, wobble = true, style }) => {
  const frame = useStep(2);
  if (frame < at) return null;
  if (out !== undefined && frame >= out + 6) return null;
  const d = frame - at;
  const inP = interpolate(d, [0, 8], [0, 1], { ...clamp, easing: Easing.out(Easing.back(2.4)) });
  let tx = 0, ty = 0, sc = 1, sx = 1, sy = 1;
  if (from === "pop") sc = inP;
  if (from === "drop") ty = interpolate(d, [0, 7], [-1400, 0], { ...clamp, easing: Easing.in(Easing.quad) });
  if (from === "left") tx = interpolate(inP, [0, 1], [-1100, 0]);
  if (from === "right") tx = interpolate(inP, [0, 1], [1100, 0]);
  if (from === "bottom") ty = interpolate(inP, [0, 1], [1300, 0]);
  if (from === "drop") { const l = d - 7; if (l >= 0 && l < 10) { sy = interpolate(l, [0, 2, 6, 10], [1, 0.72, 1.08, 1], clamp); sx = 2 - sy; } }
  for (const t of squashAt) { const l = frame - t; if (l >= 0 && l < 10) { const q = interpolate(l, [0, 2, 6, 10], [1, 0.8, 1.06, 1], clamp); sy *= q; sx *= 2 - q; } }
  if (out !== undefined && frame >= out) sc *= interpolate(frame - out, [0, 2, 6], [1, 1.15, 0], clamp);
  const wob = wobble ? (random(`${name}-${Math.floor(frame / 4)}`) - 0.5) * 2.2 : 0;
  const sh = shake ? [(random(`sx${frame}`) - 0.5) * shake, (random(`sy${frame}`) - 0.5) * shake] : [0, 0];
  return (
    <Img src={staticFile(`a/st/${name}.png`)} style={{ position: "absolute", height: h, left: x, top: y - h, translate: "-50% 0px", transform: `translate(${tx + sh[0]}px, ${ty + sh[1]}px) rotate(${rot + wob}deg) scale(${sc * sx * (flip ? -1 : 1)}, ${sc * sy})`, transformOrigin: "50% 100%", filter: "drop-shadow(10px 14px 0 rgba(20,10,30,.28))", ...style }} />
  );
};

export const Silhouette: React.FC<{ name: string; color: string; x: number; y: number; h: number; w: number; rot: number; opacity?: number }> = ({ name, color, x, y, h, w, rot, opacity = 1 }) => (
  <div style={{ position: "absolute", left: x - w / 2, top: y - h, width: w, height: h, backgroundColor: color, WebkitMaskImage: `url(${staticFile(`a/st/${name}.png`)})`, WebkitMaskSize: "contain", WebkitMaskRepeat: "no-repeat", WebkitMaskPosition: "center bottom", rotate: `${rot}deg`, transformOrigin: "50% 100%", opacity, mixBlendMode: "multiply" }} />
);

export type Item = { t: number; text: string };
/** shotFrom = глобальный кадр начала сцены (внутри сцены: -L(0)) */
export const HandWords: React.FC<{ lines: Item[][]; shotFrom: number; color?: string; size?: number; top: number; rotate?: number; left?: number; width?: number; align?: "center" | "left" }> = ({ lines, shotFrom, color = C.ink, size = 110, top, rotate = -4, left = 60, width = 960, align = "center" }) => {
  const frame = useCurrentFrame();
  const boil = useBoil();
  return (
    <div style={{ position: "absolute", top, left, width, textAlign: align, fontFamily: HAND, fontSize: size, lineHeight: 1.0, rotate: `${rotate}deg`, color, filter: boil }}>
      {lines.map((line, li) => (
        <div key={li}>
          {line.map((it, wi) => {
            const d = frame - (f(it.t) - shotFrom);
            if (d < 0) return null;
            const s = interpolate(d, [0, 4], [0.3, 1], { ...clamp, easing: Easing.out(Easing.back(2.5)) });
            return <span key={wi} style={{ display: "inline-block", scale: String(s), marginRight: size * 0.22, rotate: `${(random(it.text + wi) - 0.5) * 8}deg` }}>{it.text}</span>;
          })}
        </div>
      ))}
    </div>
  );
};

const FONTS = ["'Rubik Mono One'", "'Russo One'", "'PT Serif'", "Oswald", HAND];
const PAPERS = [C.paper, C.ink, C.lime, "#ffffff", C.pink, C.cobalt, C.tomato];
export const Ransom: React.FC<{ text: string; at: number; x: number; y: number; size?: number; rot?: number; seed?: string; strike?: number }> = ({ text, at, x, y, size = 150, rot = -3, seed = "r", strike }) => {
  const frame = useStep(2);
  const boil = useBoil(); // хук до раннего return!
  if (frame < at) return null;
  return (
    <div style={{ position: "absolute", left: x, top: y, translate: "-50% 0", rotate: `${rot}deg`, display: "flex", alignItems: "center", gap: size * 0.04, whiteSpace: "nowrap" }}>
      {[...text].map((ch, i) => {
        if (ch === " ") return <span key={i} style={{ width: size * 0.3 }} />;
        const r = (k: string) => random(`${seed}-${text}-${i}-${k}`);
        const d = frame - at - i * 2;
        if (d < 0) return <span key={i} style={{ width: size * 0.7 }} />;
        const bg = PAPERS[Math.floor(r("bg") * PAPERS.length)];
        const dark = bg === C.ink || bg === C.cobalt || bg === C.tomato;
        const font = FONTS[Math.floor(r("f") * FONTS.length)];
        return (
          <span key={i} style={{ display: "inline-block", background: bg, color: dark ? (r("fg") > 0.5 ? "#fff" : C.lime) : C.ink, fontFamily: font, fontStyle: font.includes("Serif") ? "italic" : "normal", fontWeight: 700, fontSize: size * (0.75 + r("sz") * 0.4), lineHeight: 1, padding: `${size * 0.08}px ${size * 0.1}px ${size * 0.1}px`, rotate: `${(r("rot") - 0.5) * 16}deg`, translate: `0 ${(r("y") - 0.5) * size * 0.2}px`, scale: String(interpolate(d, [0, 4], [1.8, 1], clamp)), boxShadow: "5px 7px 0 rgba(20,10,30,.3)", clipPath: `polygon(${r("a") * 6}% 0, 100% ${r("b") * 8}%, ${100 - r("c") * 6}% 100%, 0 ${100 - r("d") * 8}%)` }}>{ch}</span>
        );
      })}
      {strike !== undefined && frame >= strike ? <div style={{ position: "absolute", left: -20, top: "48%", height: size * 0.16, width: `${interpolate(frame - strike, [0, 6], [0, 112], clamp)}%`, background: C.tomato, borderRadius: 20, rotate: "-6deg", filter: boil }} /> : null}
    </div>
  );
};

// Субтитры: фразы из timing.json режутся на куски по ≤4 слова; FIX — исправления распознавания для этого ролика
const FIX: Record<string, string> = { /* "сорок процентов": "40%", "из за": "из-за" … */ };
type Chunk = { s: number; e: number; text: string };
const CHUNKS: Chunk[] = (() => {
  const out: Chunk[] = [];
  PH.forEach((p, pi) => {
    const groups = Math.ceil(p.words.length / 4);
    const per = Math.ceil(p.words.length / groups);
    for (let g = 0; g < groups; g++) {
      const ws = p.words.slice(g * per, (g + 1) * per);
      if (!ws.length) continue;
      const next = p.words[(g + 1) * per];
      out.push({ s: ws[0].s, e: next ? next.s : Math.min(p.e + 0.3, PH[pi + 1]?.s ?? p.e + 1.2), text: ws.map((w) => w.w).join(" ") });
    }
  });
  return out;
})();
const fixText = (s: string) => { let o = s; for (const [k, v] of Object.entries(FIX)) o = o.replace(k, v); return o.charAt(0).toUpperCase() + o.slice(1); };
export const Subs: React.FC = () => {
  const frame = useCurrentFrame();
  const c = CHUNKS.find((ch) => frame / FPS >= ch.s && frame / FPS < ch.e);
  if (!c) return null;
  return (
    <div style={{ position: "absolute", top: 1560, left: 0, right: 0, display: "flex", justifyContent: "center" }}>
      <div style={{ fontFamily: HAND, fontSize: 46, color: C.ink, background: C.paper, padding: "8px 26px 10px", rotate: `${(random(c.text) - 0.5) * 3}deg`, boxShadow: "6px 8px 0 rgba(20,10,30,.28)", clipPath: "polygon(1% 4%, 99% 0, 100% 92%, 0 100%)", maxWidth: 940, textAlign: "center" }}>{fixText(c.text)}</div>
    </div>
  );
};

export const ScreenFx: React.FC = () => {
  const frame = useCurrentFrame();
  return (
    <>
      <AbsoluteFill style={{ pointerEvents: "none", opacity: 0.35, mixBlendMode: "soft-light", backgroundImage: "repeating-linear-gradient(0deg, rgba(0,0,0,.4) 0 1px, transparent 1px 5px), repeating-linear-gradient(90deg, rgba(0,0,0,.4) 0 1px, transparent 1px 5px)" }} />
      <AbsoluteFill style={{ mixBlendMode: "overlay", opacity: 0.2, pointerEvents: "none" }}>
        <svg width="100%" height="100%"><filter id={`g${frame % 4}`}><feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves={2} seed={frame % 4} /><feColorMatrix type="saturate" values="0" /></filter><rect width="100%" height="100%" filter={`url(#g${frame % 4})`} /></svg>
      </AbsoluteFill>
    </>
  );
};

/** рваные полосы через склейку; at = глобальный кадр склейки */
export const TearWipe: React.FC<{ at: number; dir?: 1 | -1 }> = ({ at, dir = 1 }) => {
  const d = useStep(2) - at;
  if (d < -8 || d > 10) return null;
  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      {[0, 1, 4, 5, 2, 3].map((s, i) => (
        <Img key={i} src={staticFile(`a/strip/s${s}.png`)} style={{ position: "absolute", width: 1700, height: 420, objectFit: "fill", left: -310 + interpolate(d + 8 - i, [0, 8, 16], [-1600, 0, 1700], clamp) * dir, top: -60 + i * 330, rotate: `${i % 2 ? 4 : -5}deg` }} />
      ))}
    </AbsoluteFill>
  );
};

/** клякса-ирис, раскрывающая сцену (оборачивать входящую сцену) */
export const Iris: React.FC<{ children: React.ReactNode; x?: number; y?: number; len?: number }> = ({ children, x = 540, y = 900, len = 9 }) => {
  const frame = useStep(2);
  if (frame >= len) return <>{children}</>;
  const r = interpolate(frame, [0, len], [0, 1500], { ...clamp, easing: Easing.in(Easing.quad) });
  const pts = Array.from({ length: 24 }, (_, i) => { const a = (i / 24) * Math.PI * 2; const rr = r * (0.85 + random(`iris${i}${Math.floor(frame / 2)}`) * 0.3); return `${x + Math.cos(a) * rr}px ${y + Math.sin(a) * rr}px`; }).join(",");
  return <AbsoluteFill style={{ clipPath: `polygon(${pts})` }}>{children}</AbsoluteFill>;
};

/** въезжающий цветной лист */
export const SlideIn: React.FC<{ children: React.ReactNode; dir?: 1 | -1 }> = ({ children, dir = 1 }) => {
  const frame = useStep(2);
  return <AbsoluteFill style={{ translate: `${interpolate(frame, [0, 6], [1080 * dir, 0], { ...clamp, easing: Easing.out(Easing.cubic) })}px 0px`, rotate: `${interpolate(frame, [0, 6], [4 * dir, 0], clamp)}deg` }}>{children}</AbsoluteFill>;
};
```

### Каркас ролика

```tsx
type Shot = { name: string; a: number; b: number; el: (L: (s: number) => number, dur: number) => React.ReactNode };
// a/b — секунды (через T/PS), L(sec) → локальный кадр сцены, рукописным словам передавать shotFrom={-L(0)}
const SHOTS: Shot[] = [
  { name: "01", a: 0, b: T(0, 15), el: (L) => (
    <Sheet color={C.tomato} dots="rgba(120,10,0,.5)">
      <Ransom text="40%" at={L(T(0, 0))} x={540} y={170} size={230} />
      <Sticker name="P14" at={L(T(0, 9))} x={860} y={1530} h={520} from="right" />
      <HandWords lines={[[{ t: T(0, 11), text: "2030" }]]} shotFrom={-L(0)} top={500} size={110} />
    </Sheet>) },
  // …
];
// В корне: <FontGate><Defs/><AbsoluteFill style={{filter:"url(#rgb2)"}}> {SHOTS → <Sequence from durationInFrames>} {TearWipe на склейках} <Subs/> </AbsoluteFill> <ScreenFx/> затемнение последних 10 кадров, <Audio voice/>, <Audio music volume=0.28/>, sfx в <Sequence layout="none"> </FontGate>
```

Вспомогательные приёмы из прошлого ролика писать по месту: Hopper (прыжки дугой между ключами), Fly (предмет летит из точки в точку с ростом/уменьшением и вращением), Orbit (предметы по эллипсу вокруг ладони), Scale (уменьшение героя от точки ног), PoseCycle (смена поз каждые 4 кадра), рисованные SVG (навес, стакан с паром, ступени, линии вибрации) — всегда с `filter: useBoil()` и обводкой `#151515` 6–8 px.

### Раскладка кадра 1080×1920

- Рукописные слова: top 120–520. Ransom: y 170–430. Герой: ноги на y 1450–1560, рост 600–1000. Субтитры: top 1560 — ниже ничего важного.
- В сцене одно главное действие; не больше 2 текстовых блоков одновременно.

## Звуки (ffmpeg, кладутся в public/sfx)

```bash
F="ffmpeg -v error -y"
$F -f lavfi -i "aevalsrc='0.8*sin(2*PI*(900-1400*t)*t)*exp(-t*28)':d=0.15:s=44100" pop.wav
$F -f lavfi -i "aevalsrc='0.9*sin(2*PI*2400*t)*exp(-t*300)+0.5*(random(0)-0.5)*exp(-t*400)':d=0.05:s=44100" click.wav
$F -f lavfi -i "aevalsrc='0.9*sin(2*PI*(70-30*t)*t)*exp(-t*3)+0.3*(random(0)-0.5)*exp(-t*12)':d=1.4:s=44100" -af lowpass=f=400 boom.wav
$F -f lavfi -i "anoisesrc=d=0.5:c=pink:a=0.6" -af "highpass=f=300,lowpass=f=3000,afade=t=in:d=0.25:curve=exp,afade=t=out:st=0.25:d=0.25" whoosh.wav
$F -f lavfi -i "anoisesrc=d=0.35:c=white:a=0.7" -af "highpass=f=1200,lowpass=f=7000,afade=t=in:d=0.04,afade=t=out:st=0.12:d=0.23,volume=0.8" rustle.wav
$F -f lavfi -i "aevalsrc='(random(0)-0.5)*(0.6+0.4*gt(random(1),0.85))*exp(-t*5)':d=0.5:s=44100" -af "highpass=f=600,lowpass=f=6000,acrusher=bits=8:samples=2" tear.wav
$F -f lavfi -i "aevalsrc='0.4*(sin(2*PI*2093*t)+sin(2*PI*2637*t))*exp(-t*4)+0.3*sin(2*PI*1046*t)*exp(-t*6)':d=0.9:s=44100" ching.wav
$F -f lavfi -i "aevalsrc='0.35*sin(2*PI*2200*t)*gt(sin(2*PI*28*t),0)*min(1,t*20)':d=1.4:s=44100" -af "afade=t=out:st=1.1:d=0.3" bell.wav
$F -f lavfi -i "aevalsrc='0.5*sin(2*PI*1500*t)*exp(-mod(t,0.09)*120)':d=1.2:s=44100" ratchet.wav
$F -f lavfi -i "aevalsrc='0.7*sin(2*PI*(300+900*t)*t)*exp(-t*9)':d=0.3:s=44100" boing.wav
$F -f lavfi -i "aevalsrc='0.5*(random(0)-0.5)*gt(sin(2*PI*22*t),0)+0.3*sin(2*PI*180*t)*gt(sin(2*PI*9*t),0.3)':d=0.45:s=44100" -af "acrusher=bits=4:samples=12,afade=t=out:st=0.3:d=0.15" glitch.wav
# подложка-pluck 47 с (Am–C–D–G), громкость в ролике 0.28
$F -f lavfi -i "aevalsrc='0.22*sin(2*PI*if(lt(mod(t,4.8),1.2),440,if(lt(mod(t,4.8),2.4),523.25,if(lt(mod(t,4.8),3.6),587.33,392)))*t)*exp(-mod(t,0.3)*9)*(0.6+0.4*lt(mod(t,0.6),0.3))+0.18*sin(2*PI*if(lt(mod(t,4.8),2.4),110,98)*t)*exp(-mod(t,0.6)*5)+0.05*(random(0)-0.5)*exp(-mod(t+0.15,0.3)*40)':d=47:s=44100" -af "lowpass=f=3500,aecho=0.8:0.5:300:0.2,afade=t=in:d=0.5,afade=t=out:st=45:d=2,volume=0.9" ../music.wav
```

Звук на каждое событие: появление — pop, падение — boom, склейка рваной бумагой — tear за 0.2 с до склейки, текст-ransom — pop/boom, деньги — ching, механизм — ratchet, прыжок/растяжение — boing, бег/полёт — whoosh.

## Промпты для генерации (если ассетов нет)

Первое сообщение в генератор картинок (с приложенной анфас-позой героя):

```
I'm making an animated reel. Remember these rules for every image I ask for in this chat.
CHARACTER (attached image): keep the head, face, outfit and gloves identical to the attached image. Full body, isolated on pure white background, vertical 2:3, no text.
OBJECT STYLE: tactile 3D object with matte vinyl-clay material, chunky rounded shapes, bold hand-drawn black ink outline around the silhouette, subtle risograph print grain and halftone dots on the shading, flat bold colors: tomato red, cobalt blue, acid lime, pink, cream paper, black. Surreal mixed-media collage look, like a cut-out sticker, soft shadow, isolated on pure white background, square 1:1, no text, no letters, no logos.
BACKGROUND STYLE: flat 2D risograph illustration, bold simple shapes, hand-drawn black ink outlines, limited palette, visible halftone dots and paper grain, slight color misregistration, vertical 9:16, no people, no text.
I will send short commands like "H01: ..." — generate exactly one image per command. Reply only with the image.
```

Дальше по одной строке: `H01 character pose: …`, `P01 object: …`, `B01 background: …`. Обязательно: B04 (фактура кремовой бумаги) и B05 (рваные полосы cream/tomato/cobalt/lime на белом). Позы, которые почти всегда нужны: анфас, ладонь под предмет, указывает в сторону, шок, фейспалм, идея (палец вверх), выглядывает из-за края, бежит, голова-лампа, голова-крышка, триумф, сидит с телефоном.

## Частые ошибки

- Рукописные слова не видны → передан `shotFrom={0}` вместо `-L(0)`.
- Хук (`useBoil`) после раннего `return null` → ломает порядок хуков.
- `--concurrency` больше числа ядер → рендер падает сразу.
- Обычный Chromium не стартует → нужен `chromium_headless_shell`.
- Вырез по порогу белого съедает белые детали героя → только rembg.
- Google Fonts и remotion.media по сети недоступны → @fontsource и синтез звуков.