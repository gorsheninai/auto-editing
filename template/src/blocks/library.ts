import type React from 'react';
import type {BlockProps} from './kit';
import {MBars, MGauge, MGrowth, MShare, MTimeline, MTop, MVersus} from './motion-data';
import {MChecklist, MFlow, MGallery, MHub, MSpeed} from './motion-fx';
import {TEXT} from './text-fx';
import {PhoneChat, PhoneFrame, PhoneNotifs, PhonePay, PhoneScroll, PhoneStats} from './phone';
import {MBarRace, MCompareBars, MFunnel, MHeatmap, MKpi} from './charts';
import {MCardStack, MListReveal, MProductCard, MScrollBrake, MTimeTravel} from './travel';
import {MChat, TxtRotate} from './essentials';
import {MBeforeAfter, MCounter, TxtFly, TxtMask, TxtSweep, TxtUnderline} from './shotcraft';

/* Сцены библиотеки по коду: моушн (M…) и текст на весь экран (Txt…). В раскадровке код пишется
   в начале описания сегмента: «MBars: я — 3 | они — 30». Список кодов по группам — codes.json. */
export const SCENES: Record<string, React.FC<BlockProps>> = {MBars, MGrowth, MShare, MTop, MTimeline, MGauge, MVersus, MChecklist, MHub, MFlow, MSpeed, MGallery, MChat, MCounter, MBeforeAfter, PhoneFrame, PhoneScroll, PhoneChat, PhoneNotifs, PhonePay, PhoneStats, MBarRace, MFunnel, MKpi, MHeatmap, MCompareBars, MTimeTravel, MScrollBrake, MListReveal, MCardStack, MProductCard, ...TEXT, TxtRotate, TxtFly, TxtSweep, TxtUnderline, TxtMask};
