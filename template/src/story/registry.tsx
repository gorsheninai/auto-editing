import React from 'react';
import type {Row, Word} from './types';

/* Свои сцены ролика (моушн, 3D, 2D с сюжетом). Ключ — row.scene из story.json.
   Сцена рисуется внутри зоны: в B — высота ZONES[win].h, в C — весь кадр 1080×1920.
   from — глобальный кадр начала сегмента, dur — длина в кадрах, t0 — секунда начала.
   Пример:
     import {MPath} from '../motion';
     export const REG = { path: ({from}) => <MPath from={from} /> };
   Строки motion/d3 без своей сцены получают кинетический текст и попадают в предупреждения pult_to_story.py. */
export type SceneProps = {from: number; dur: number; t0: number; row: Row; words: Word[]; zoneH: number; full: boolean};
export const REG: Record<string, React.FC<SceneProps>> = {};
