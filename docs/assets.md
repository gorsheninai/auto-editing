# Ассеты

Читать, когда в раскадровке есть коды ассетов или работаешь с вкладкой «Ассеты».

## Ассеты
Коллекция assets на пульте: {code (имя для раскадровки), name, section overlay|broll|photo|graphic|sound|font|lut, group, when, tags, license, source, drive — ссылка на Диск, fileId — файл на пульте (читать через Artifact read с path=fileId), fileKind, fileName, size}. Оригиналы — Диск «Библиотека ассетов» (https://drive.google.com/drive/folders/1msXBtJaeY4AnzL5Y7bN6KQ2es2lCPpbm, подпапки 01 Видео-оверлеи … 07 Цвет и LUT). Звук пульт не хранит — только на Диске. Вкладка «Ассеты» сама подтягивает новые файлы из подпапок Диска (коннектор Google Drive в пульте): карточка с driveId, оригинал до 20 МБ — в fileId, превью-клип 432×768 webm — в previewId; убранные с пульта карточки помечаются hidden:true. В git медиа не класть. Код ассета в описании сегмента → скачать файл в public/media/ ролика и вставить по смыслу.
Блоки библиотеки имеют поле group (подгруппа внутри kind); стили субтитров Sub… — в textanims с полем group.
