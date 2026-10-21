import React from 'react';
import {CaptionActivePop} from '../remocn/caption-active-pop';
import {CaptionWordPop} from '../remocn/caption-word-pop';
import {CaptionHighlightBox} from '../remocn/caption-highlight-box';
import {CaptionKaraoke} from '../remocn/caption-karaoke';
import {CaptionMarker} from '../remocn/caption-marker';
import {CaptionStamp} from '../remocn/caption-stamp';
import {CaptionStack} from '../remocn/caption-stack';
import {CaptionDrop} from '../remocn/caption-drop';
import type {Caption} from '../remocn/caption-core';

/* Стили субтитров из remocn. На пульте — пункты «Анимации субтитров» с id = код (SubKaraoke…),
   в story.json — settings.subAnim = {style: 'SubKaraoke'}. */
export type SubCode = 'SubPop' | 'SubWord' | 'SubBox' | 'SubKaraoke' | 'SubMarker' | 'SubStamp' | 'SubStack' | 'SubDrop';
export type SubLook = {captions: Caption[]; keywords: string[]; color: string; accent: string; onDark: boolean; fontSize?: number};

export const SUBS: Record<SubCode, {name: string; summary: string; render: (l: SubLook) => React.ReactNode}> = {
  SubPop: {name: 'Подпрыгивает слово', summary: 'Произносимое слово окрашивается в акцентный цвет и чуть подпрыгивает',
    render: (l) => <CaptionActivePop captions={l.captions} color={l.color} activeColor={l.accent} fontSize={l.fontSize ?? 64} shadow={l.onDark} />},
  SubWord: {name: 'Одно крупное слово', summary: 'На экране одно крупное слово, каждое выпрыгивает в момент произнесения',
    render: (l) => <CaptionWordPop captions={l.captions} color={l.color} fontSize={(l.fontSize ?? 64) * 1.6} shadow={l.onDark} />},
  SubBox: {name: 'Плашка за словом', summary: 'Цветная плашка переезжает за произносимым словом',
    render: (l) => <CaptionHighlightBox captions={l.captions} color={l.color} activeColor={l.onDark ? '#111' : '#fff'} boxColor={l.accent} fontSize={l.fontSize ?? 64} shadow={false} />},
  SubKaraoke: {name: 'Караоке', summary: 'Слово заливается цветом слева направо в темпе речи',
    render: (l) => <CaptionKaraoke captions={l.captions} color={l.onDark ? 'rgba(255,255,255,.55)' : 'rgba(28,27,34,.35)'} activeColor={l.onDark ? '#fff' : l.accent} fontSize={l.fontSize ?? 64} shadow={l.onDark} />},
  SubMarker: {name: 'Маркер на ключевых словах', summary: 'Ключевые слова подчёркиваются маркером в момент произнесения',
    render: (l) => <CaptionMarker captions={l.captions} keywords={l.keywords} color={l.color} markerColor={l.accent} markerTextColor="#fff" fontSize={l.fontSize ?? 64} shadow={l.onDark} />},
  SubStamp: {name: 'Печать на ключевых словах', summary: 'Ключевые слова падают как резиновая печать',
    render: (l) => <CaptionStamp captions={l.captions} keywords={l.keywords} color={l.color} stampColor={l.accent} fontSize={l.fontSize ?? 64} shadow={l.onDark} />},
  SubStack: {name: 'Ключевое слово крупно', summary: 'Пара слов в строке, ключевое слово отдельной крупной строкой',
    render: (l) => <CaptionStack captions={l.captions} keywords={l.keywords} color={l.color} emphasisColor={l.accent} fontSize={l.fontSize ?? 64} shadow={l.onDark} />},
  SubDrop: {name: 'Слова падают', summary: 'Слова падают сверху и подпрыгивают при приземлении',
    render: (l) => <CaptionDrop captions={l.captions} color={l.color} fontSize={l.fontSize ?? 64} shadow={l.onDark} />},
};
export const isSubCode = (s: unknown): s is SubCode => typeof s === 'string' && s in SUBS;

/* Слова пульта {w,s,e} + границы наших кусков → Caption[] для remocn */
const STOP = new Set(['и','а','в','на','с','по','к','о','у','за','из','от','не','но','что','это','как','то','же','ли','бы','я','ты','мы','вы','он','она','они','его','её','их','для','до','так','уже','ещё','или','если','чтобы','когда','тоже','там','тут','вот','все','всё','очень','просто']);
const bare = (w: string) => w.toLowerCase().replace(/[^\p{L}\d]/gu, '');
export function toCaptions(words: {w: string; s: number; e: number}[], chunkEnds: Set<number>): Caption[] {
  return words.map((w, i) => ({text: w.w, startMs: Math.round(w.s * 1000), endMs: Math.round(w.e * 1000), timestampMs: null, confidence: 1, pageBreakAfter: chunkEnds.has(i)}));
}
/* Ключевые слова: в каждой фразе самое длинное значимое слово (от 5 букв) или то, что задано вручную */
export function pickKeywords(words: {w: string}[], manual?: string[]): string[] {
  if (manual && manual.length) return manual;
  const out: string[] = []; let best = '';
  words.forEach((w) => {
    const b = bare(w.w);
    if (!STOP.has(b) && b.length >= 5 && b.length > best.length) best = b;
    if (/[.!?…:]$/.test(w.w)) { if (best) out.push(best); best = ''; }
  });
  if (best) out.push(best);
  return out;
}
