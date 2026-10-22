import React from 'react';
import type {Row, Word} from './types';
import {SCENES} from '../blocks/library';
import {parseData, themeFrom} from '../blocks/kit';
import {BZIK} from './bzik';
import {BZIK2} from './bzik2';

/* Свои сцены ролика (моушн, 3D, 2D с сюжетом). Ключ — row.scene из story.json.
   Сцена рисуется внутри зоны: в B — высота ZONES[win].h, в C — весь кадр 1080×1920.
   from — глобальный кадр начала сегмента, dur — длина в кадрах, t0 — секунда начала.
   Пример:
     import {MPath} from '../motion';
     export const REG = { path: ({from}) => <MPath from={from} /> };
   Строки motion/d3 без своей сцены получают кинетический текст и попадают в предупреждения pult_to_story.py. */
export type SceneProps = {from: number; dur: number; t0: number; row: Row; words: Word[]; zoneH: number; full: boolean; theme?: {dark: boolean; bg: string; ink: string; accent: string}; allWords?: Word[]; speaker?: {src: string; from: number}};
/* Сцены библиотеки блоков (blocks/library.ts): данные — из описания сегмента после кода */
const lib = Object.fromEntries(Object.entries(SCENES).map(([code, C]) => [code, ((p: SceneProps) => {
  const marks = p.row.marks && p.allWords ? p.row.marks.map((i) => Math.round((((p.allWords as Word[])[i]?.s ?? p.t0) - p.t0) * 30)) : undefined;
  return <C data={parseData(p.row.note || code, p.row.text)} theme={themeFrom(p.theme || {dark: false, bg: '#F4F1EA', ink: '#1C1B22', accent: '#7B61FF'})} zoneH={p.zoneH} full={p.full} dur={p.dur} marks={marks} speaker={p.speaker} />;
}) as React.FC<SceneProps>]));
/* Свои сцены ролика добавляются сюда и перекрывают библиотечные с тем же кодом */
export const REG: Record<string, React.FC<SceneProps>> = {...lib, ...BZIK, ...BZIK2};
