# Материалы и сборка по раскадровке

Читать, когда собираешь ролик по раскадровке пульта.

## Материалы на Диске
Промпт для ChatGPT заканчивается блоком СОХРАНЕНИЕ: ChatGPT кладёт картинки в «Ролики/<дата> <название>/» с подпапками 01_персонаж, 02_предметы, 03_люди, 04_фоны, 05_смысловые, 06_мои_вставки (запасной вариант — ZIP с той же структурой). Диск чат сам не открывает: пульт → «Материалы» → «Собрать пакет для монтажа» забирает всю папку и кладёт её на пульт JSON-частями до 19 МБ (поле проекта mediaPack: parts — id частей, files, skipped). Файлы больше 10 МБ Диск не отдаёт — они в skipped, пользователь присылает их в чат (--media).

## Подготовка — одной командой (tools/reel_prep.py)
1. `ArtifactData get projects/<id>` с out_dir=work/db (и `list textanims` с out_dir=work/db/textanims, если выбраны анимации текста).
2. `Artifact read` с path=<id> и out_dir=work/files — для видео аватара (avatar.id) и каждой части пакета (mediaPack.parts). По одному вызову на файл, ничего не декодировать.
3. `python3 tools/reel_prep.py work/db/projects/<id>.json reels/NN-name --files work/files [--anims work/db/textanims]` — запускать в фоне и ждать окончания, не проверяя по ходу.
   Делает: папку из шаблона (пакеты — ссылка на template/node_modules), раскладку материалов, вырезку фона у 01_/02_/03_, pult_to_story, видео спикера (паузы ровно по segs пульта и ускорение; со spec — spec_build), вырезку спикера, если есть окно «Вырезка» или BgSwap, лист work/prep_sheet.jpg и отчёт: какие сцены писать, каких файлов нет, что проверить.
   Упал — исправить причину и запустить ту же команду: сделанные этапы пропускаются. Переделать этап: `--redo этап`. Видео аватара не на пульте: `--avatar файл`; материалы прислали в чат: `--media папка`; без вырезки спикера: `--no-matte`; прилип фон над головой: `--redo matte --plate-fix`.
   Вручную (cut_pauses, align, matte, rembg, pult_to_story по отдельности) — только если скрипт не справился с конкретным этапом.
4. Лист work/prep_sheet.jpg посмотреть один раз: прозрачность — пурпур, кадры вырезки спикера в конце. Листы из нескольких картинок, которые нашёл скрипт, разрезать.

## Сборка по раскадровке (композиция Story)
5. Код в template/src/story/: windows.tsx (окна спикера popout/window/circle/strip), textanim.tsx (AnimText по params), inserts.tsx (KineticText; PicInsert с рамками phone/window/painting/product/poster/plain — выбор по note; LayerScene; Placeholder), registry.tsx (свои сцены: row.scene → компонент), StoryMain.tsx.
6. Готовые блоки библиотеки (template/src/blocks, список — library/CATALOG.md «Библиотека блоков», коды — blocks/codes.json) подключены сами: код в начале описания сегмента → scene, Tr… → tr, Fx… → fx, Ink…/PaperSticker → ov, стиль субтитров Sub… → settings.subAnim.style, подложка «живой градиент» → backdrop BgGrain. Свои сцены motion/d3 и 2D с сюжетом пишутся в registry.tsx и указываются в story.json полем scene; без сцены motion/d3 показывают кинетический текст, l2d без layer — заглушку (в финал не должна попасть).
7. Проверка стоп-кадрами, затем `COMP=Story tools/render.sh reels/NN-name out.mp4 [--3d]`.
