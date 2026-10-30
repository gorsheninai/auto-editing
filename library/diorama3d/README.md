# diorama3d — ролик целиком в 3D: город-диорама и анимированные человечки

Из ролика 14 «Мир без детей» (только голос, без аватара). Всё движение — от `useCurrentFrame()`.

## Как подключить
1. Шаблон → `reels/NN-name`, ссылка на `template/node_modules`.
2. `bash tools/fetch_models.sh reels/NN-name` — модели в `public/models` (в git не хранятся).
3. Скопировать: `library/diorama3d/*.ts(x)` и `fx.json` → `src/v3d/`, `scenes/*` → `src/scenes/`, `example/*` → `src/`.
   Импорты `../kit` — это `template/src/kit.tsx` (wf, SANS, WORDS, useFonts); `src/words.json` — тайминги слов.
4. Звук: `sfx_example.py` — пример тихих SFX синтезом под слова + сведение с голосом в −14 LUFS (`public/mix.wav`).
5. Стоп-кадры одним бандлом: `node tools/stills.mjs work/st 48 117 …` (из папки ролика), затем `ffmpeg … tile`.
6. Рендер: `tools/render.sh reels/NN-name out/x.mp4 --3d` (swangle). 1809 кадров ≈ 60 мин на 2 ядрах.

## Техника (важно)
- `Canvas3D` (stage.tsx): `frameloop="never"` + `FrameDriver` — один `advance()` на кадр Remotion. Без этого rAF крутит
  перерисовки в каждой вкладке и рендер в 4–5 раз медленнее.
- `Person`: манекен Xbot, клип через `mixer.update(0)` с заданным `action.time`, позы костями поверх
  (bend, headYaw, headPitch, shrug, pointR/L, pray, sit, kneel, bigHead, raw). Перед update буферы PropertyMixer
  портятся NaN — иначе ручные повороты копятся из кадра в кадр (люди «складываются»). Оси откалиброваны.
- Вертикальный кадр узкий: при fov 35–46 ширина видимого ≈ 0,3–0,45 × расстояние. Людей ставить в глубину, не в ряд.
- Тилт-шифт — CSS backdrop-filter поверх канваса (~1 с/кадр на swangle): только на общих планах города.
- `fx.json`: выключатели теней/сглаживания/тилт-шифта для замеров скорости.

## Блоки
- `City` — подставка-диорама 7×7 клеток KayKit: площадь 3×3, кольцевая дорога, 24 дома, деревья по краю; desat/dark/grass.
- `Person`, `Robot`, `Board` (перекидное табло времени, CSS 3D), `Title` (заголовок хука), `Captions` (2 слова).
- `things.tsx` — предметы кодом: Crib, Mobile, Globe (метки гаснут), TV + NewsScreenTex, Seat, PregTest, TestField
  (инстансинг), Microscope, DNA (рассыпается), Candle, Pedestal, Stroller, Shutter, Teddy, Blocks, Ball, Sign (canvas-надпись),
  SchoolDesk, Conveyor, Bed, Jar (монеты падают), Cake, Armchair, Clock, Cart, Ivy (плющ растёт), Cloud.
- `world.tsx` — `ageAt(t)`/`lightAt(t)`: мир стареет и темнеет по секунде ролика; `Room` — комната-разрез; `useCanvasTex`.
