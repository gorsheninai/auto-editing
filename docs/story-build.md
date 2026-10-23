# Материалы и сборка по раскадровке

Читать, когда собираешь ролик по раскадровке пульта.

## Материалы на Диске
Промпт для ChatGPT заканчивается блоком СОХРАНЕНИЕ: ChatGPT кладёт картинки в «Ролики/<дата> <название>/» с подпапками 01_персонаж, 02_предметы, 03_люди, 04_фоны, 05_смысловые, 06_мои_вставки (запасной вариант — ZIP с той же структурой). Для монтажа всю папку ролика скачать в reels/NN/public/media/ как есть — pult_to_story.py ищет файлы по имени во всех подпапках.

## Сборка по раскадровке (композиция Story)
1. Проект пульта → `ArtifactData get projects/<id>` с out_dir=work/db, `ArtifactData list textanims` с out_dir=work/db. Смотреть `python3 tools/pult_brief.py work/db/projects/<id>.json` (одно поле целиком — `--full поле`), JSON целиком не читать.
2. `python3 tools/pult_to_story.py project.json reels/NN-name --anims textanims.json` → src/story.json и src/words.json, плюс список сегментов, которым нужна своя сцена.
3. Код в template/src/story/: windows.tsx (окна спикера popout/window/circle/strip), textanim.tsx (AnimText по params), inserts.tsx (KineticText; PicInsert с рамками phone/window/painting/product/poster/plain — выбор по note; LayerScene; Placeholder), registry.tsx (свои сцены: row.scene → компонент), StoryMain.tsx.
4. Готовые блоки библиотеки (template/src/blocks, список — library/CATALOG.md «Библиотека блоков», коды — blocks/codes.json) подключены сами: код в начале описания сегмента → scene, Tr… → tr, Fx… → fx, Ink…/PaperSticker → ov, стиль субтитров Sub… → settings.subAnim.style, подложка «живой градиент» → backdrop BgGrain. Свои сцены motion/d3 и 2D с сюжетом пишутся в registry.tsx и указываются в story.json полем scene; без сцены motion/d3 показывают кинетический текст, l2d без layer — заглушку (в финал не должна попасть).
5. Проверка стоп-кадрами, затем `COMP=Story tools/render.sh reels/NN-name out.mp4 [--3d]`.
