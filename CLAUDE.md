# auto-editing — студия монтажа рилсов

Перед работой прочитай README.md (структура и порядок нового ролика), brief.md (параметры и значения по умолчанию) и library/CATALOG.md (готовые сцены).
Правила монтажа — в скилле reel-montage-popout, промпты для картинок — в скилле gpt-image-batch-prompts.
Новый ролик кладётся в reels/NN-name/. Видео и картинки в git не коммитить — они лежат на Google Диске.
После ролика: удачные новые блоки перенести в library/ и CATALOG.md, закоммитить и запушить в main.
Перед тратой кредитов в генеративных сервисах — спрашивать пользователя. 3D-модели не генерировать, собирать в коде.

## Пульт монтажа
Интерфейс: https://claude.ai/artifact/5hvEdgNfsfN5esbxToxz9r (исходник — pult/pult.html, публиковать через Artifact с url).
Данные пульта (ArtifactData): projects (брифы роликов; поля script — текст, storyboard — раскадровка текстом, gptPrompt — один запрос для ChatGPT, refs — референсы (id ассетов пульта, читать через Artifact read с path=id), styleAnalysis — стиль ролика; avatar — видео аватара {id ассета или null, name, size}; drive — папка Диска с картинками; timing — хронометраж; segs — речевые куски исходника [нач, кон] в секундах (те же правила, что tools/cut_pauses.py); words — тайминги слов после вырезки и ускорения; sbRows — раскадровка таблицей [{text,s,e,mode A/B/C,block — код блока | layer | speaker | new, note}]; target — целевые доли {a,b,c} в %; разбор и промпт пульт делает сам через Claude, в чате их можно доработать и записать обратно через update), templates, blocks, presets. Когда пользователь пишет «проект на пульте … id: X» — прочитай projects/X и работай по нему; по ходу обновляй поле status (draft → story → images → edit → done).
Новые блоки после ролика: превью-клип (432×768, без звука) загрузить в assets пульта и добавить документ в blocks.
