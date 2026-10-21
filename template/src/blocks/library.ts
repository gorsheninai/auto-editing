import type React from 'react';
import type {BlockProps} from './kit';
import {MBars, MGauge, MGrowth, MShare, MTimeline, MTop, MVersus} from './motion-data';
import {MBauhaus, MBurst, MChecklist, MFlow, MGallery, MGooey, MHub, MInk, MSpeed} from './motion-fx';
import {TEXT} from './text-fx';
import {MChat, TxtRotate} from './essentials';

/* Сцены библиотеки по коду: моушн (M…) и текст на весь экран (Txt…). В раскадровке код пишется
   в начале описания сегмента: «MBars: я — 3 | они — 30». Список кодов по группам — codes.json. */
export const SCENES: Record<string, React.FC<BlockProps>> = {MBars, MGrowth, MShare, MTop, MTimeline, MGauge, MVersus, MChecklist, MHub, MFlow, MInk, MBurst, MSpeed, MGooey, MBauhaus, MGallery, MChat, ...TEXT, TxtRotate};
