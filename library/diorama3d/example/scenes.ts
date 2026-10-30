import React from 'react';
import {wf, wfPrev} from './kit';
import {S00, S01, S02, S03, S04, S05, S06, S07} from './scenes/A';
import {S08, S09, S10, S11, S12, S13, S14} from './scenes/B';
import {S15, S16, S17, S18, S19, S20, S21} from './scenes/C';

type C = React.FC<{from: number; dur: number}>;
type SC = {C: C; from: number; dur: number};
export const END = Math.round((59.81 + 0.5) * 30);
const B: [C, number][] = [
  [S00, 0], [S01, wf('день')], [S02, wf('ни', 0)], [S03, wf('врачи')], [S04, wf('неделя')], [S05, wfPrev('новостях')],
  [S06, wf('кто-то')], [S07, wf('месяц')], [S08, wf('учёные')], [S09, wf('люди', 1)], [S10, wf('год')], [S11, wf('каждого')],
  [S12, wf('пять')], [S13, wf('зато')], [S14, wf('двадцать')], [S15, wfPrev('заводах')], [S16, wf('пенсию')], [S17, wf('пятьдесят', 0)],
  [S18, wf('города')], [S19, wf('восемьдесят')], [S20, wf('последний', 1)], [S21, wf('прощай')],
];
export const SCENES: SC[] = B.map(([C, from], i) => ({C, from, dur: (B[i + 1]?.[1] ?? END) - from}));
