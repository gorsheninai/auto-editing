# Reels Studio (auto-editing)

Здесь собрано всё, из чего монтируются рилсы: шаблон, библиотека сцен, скрипты и все ролики. Правила работы записаны в скиллах `reel-montage-popout` (монтаж) и `gpt-image-batch-prompts` (промпты для картинок).

## Где что лежит

```
brief.md               бриф: заполняется под каждый ролик
library/CATALOG.md     каталог моушн-блоков, 3D-сцен и стилей
library/motion.tsx     код моушн-блоков
library/three3d.tsx    код 3D-предметов и сцен
template/              заготовка Remotion: окно спикера, субтитры, переходы, звуки, шрифты
tools/cut_pauses.py    вырезает паузы, ускоряет, выравнивает громкость до −14 LUFS, сохраняет segs.json
tools/align.py         расставляет тайминги слов по тексту и segs.json (без распознавания речи)
tools/matte/           вырезает спикера из фона в прозрачный webm
tools/render.sh        рендер (с ключом --3d для сцен с 3D)
reels/NN-name/         каждый ролик: код, текст, тайминги
docs/                  подробные правила по задачам (какой файл когда читать — в CLAUDE.md)
pult/src/              исходник пульта по разделам; tools/build_pult.py собирает из них pult/pult.html
```

Тяжёлые файлы (видео аватара, сгенерированные картинки, готовые mp4) в репозиторий не кладутся. Они лежат на Google Диске, в папке ролика.

## Новый ролик

1. Скопировать `template` в `reels/NN-name`, затем выполнить `npm ci`. После рендера — `python3 tools/reel_slim.py reels/NN-name`: в git остаются только свои файлы ролика.
2. Нарезать картинки с Диска и положить их в `public/` (items, poses, hands, ppl, img).
3. Обработать видео:
   - `python3 tools/cut_pauses.py src.mp4 public/avatar.mp4`;
   - `python3 tools/align.py script.txt segs.json src/words.json`;
   - вырезать спикера по `tools/matte`.
4. Собрать сцены в `Scenes.tsx`: границы (`BOUNDS`), режимы (`MODES`), сцены (`SCENES`). Готовые блоки брать из `library`.
5. Проверить по стоп-кадрам, затем запустить `tools/render.sh reels/NN-name out.mp4 [--3d]`.
6. Новые удачные блоки перенести в `library` и добавить в `CATALOG.md`.

## Версии
remotion 4.0.300, @remotion/three 4.0.300, three 0.169.0, @react-three/fiber 8.17.10, @react-three/drei 9.114.0, react 18.3.1.
