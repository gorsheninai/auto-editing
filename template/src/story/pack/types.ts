/* Стилевой пакет: стиль референса в коде (docs/style-pack.md).
   Пакет собирается в чате по референсу, хранится на пульте (templates/<id>.stylePack) и ставится в ролик
   командой tools/reel_prep.py (этап pack): его файлы ложатся в src/story/pack/, главный — pack.tsx.
   pack.tsx экспортирует PACK_SLOTS: любые из слотов ниже. Пустой слот — работает стандартный блок шаблона.
   Файлы types.ts и index.tsx пакет не перезаписывает. */
import type React from 'react';
import type {Row, Story, Word} from '../types';

export type Theme = {bg: string; ink: string; accent: string; dot: string; plate: string; dark: boolean} & Record<string, unknown>;
/* слово с кадром появления относительно начала сегмента */
export type WordF = Word & {i: number; f: number};

export type CaptionsProps = {
  text: string;            // текст куска субтитров (уже по правилам регистра шаблона)
  words: WordF[];          // слова куска: f — кадр слова относительно начала куска
  chunk: number;           // номер куска
  local: number;           // кадр от начала куска (0 — кусок появился)
  len: number;             // длина куска в кадрах
  row: Row;                // сегмент раскадровки под субтитром
  y: number;               // место субтитров по умолчанию (px от верха, центр строки)
  strong?: boolean;        // в куске ударное слово (приёмы KEY/NUM/WORD — subStyle.keyIdx)
  theme: Theme; fps: number;
};
export type TitleProps = {words: WordF[]; row: Row; dur: number; zoneH: number; full: boolean; theme: Theme; fps: number};
export type HookProps = {top?: string; big: string[]; words: WordF[]; row: Row; dur: number; theme: Theme; fps: number};
export type CameraProps = {row: Row; index: number; dur: number; lead: number; words: WordF[]; theme: Theme; fps: number; children: React.ReactNode};
export type CutProps = {offset: number; index: number; from: Row; to: Row; theme: Theme; fps: number}; // offset: кадр относительно склейки (−len…+len)
export type OverlayProps = {frame: number; total: number; row: Row; theme: Theme; fps: number};
export type SceneProps = {from: number; dur: number; t0: number; row: Row; words: Word[]; zoneH: number; full: boolean; theme: Theme; allWords: Word[]; speaker: {src: string; from: number}};

export type PackSlots = {
  Captions?: React.FC<CaptionsProps>;   // субтитры целиком
  Title?: React.FC<TitleProps>;         // крупный текст во вставке без своей сцены (вместо KineticText)
  Hook?: React.FC<HookProps>;           // заголовок-хук (row.hook)
  Camera?: React.FC<CameraProps>;       // обёртка каждого сегмента: наезды, тряска, кадрирование, грейд
  Cut?: React.FC<CutProps>;             // эффект на каждой склейке (вспышка, смаз, сдвиг)
  cutLen?: number;                      // сколько кадров по обе стороны склейки рисуется Cut (по умолчанию 4)
  Overlay?: React.FC<OverlayProps>;     // слой поверх видео и под субтитрами: зерно, виньетка, рамка, грейд
  Top?: React.FC<OverlayProps>;         // слой поверх всего, включая субтитры
  scenes?: Record<string, React.FC<SceneProps>>; // свои сцены пакета: коды для row.scene (лучше с префиксом Pk)
};
export type Pack = PackSlots & {
  name: string; version: number;
  settings: Partial<Story['settings']>; // поверх settings ролика: punch, wipe, subPos, passport, musicVolume…
};
