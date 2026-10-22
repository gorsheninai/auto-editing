import type React from 'react';
/* Стилевой паспорт шаблона: цвета, шрифты, форма, движение, фактура.
   Его читают все блоки — код блока один, вид меняется от шаблона.
   Паспорт приходит из пульта (templates.rules.passport → projects.passport → story.json settings.passport). */
export type Passport = {
  colors?: {bg?: string; ink?: string; muted?: string; accent?: string; accent2?: string; card?: string; soft?: string; line?: string};
  fonts?: {sans?: string; serif?: string; hand?: string};
  radius?: number;                       // множитель скруглений: 0.3 острые … 1 средние … 1.6 круглые
  motion?: 'soft' | 'spring' | 'snappy'; // мягко / пружинисто / резко
  texture?: 'clean' | 'dots' | 'grain' | 'paper';
  shadow?: boolean;
};

/* Шрифты студии (public/fonts, все с кириллицей, лицензия OFL). id → семейство и файлы [файл, вес, стиль?, stretch?] */
export const FONT_LIB: Record<string, {family: string; kind: 'sans' | 'serif' | 'hand' | 'special'; files: [string, string, string?, string?][]}> = {
  'inter-tight': {family: 'InterTight', kind: 'sans', files: [['inter-tight-cyrillic-700-normal', '700'], ['inter-tight-latin-700-normal', '700'], ['inter-tight-cyrillic-600-normal', '600'], ['inter-tight-latin-600-normal', '600']]},
  manrope: {family: 'Manrope', kind: 'sans', files: [['manrope-cyrillic-600-normal', '600'], ['manrope-latin-600-normal', '600'], ['manrope-cyrillic-800-normal', '800'], ['manrope-latin-800-normal', '800']]},
  montserrat: {family: 'Montserrat', kind: 'sans', files: [['montserrat-cyrillic-600-normal', '600'], ['montserrat-latin-600-normal', '600'], ['montserrat-cyrillic-800-normal', '800'], ['montserrat-latin-800-normal', '800']]},
  rubik: {family: 'Rubik', kind: 'sans', files: [['rubik-cyrillic-500-normal', '500'], ['rubik-latin-500-normal', '500'], ['rubik-cyrillic-700-normal', '700'], ['rubik-latin-700-normal', '700']]},
  golos: {family: 'Golos Text', kind: 'sans', files: [['golos-text-cyrillic-600-normal', '600'], ['golos-text-latin-600-normal', '600'], ['golos-text-cyrillic-800-normal', '800'], ['golos-text-latin-800-normal', '800']]},
  unbounded: {family: 'Unbounded', kind: 'sans', files: [['unbounded-cyrillic-600-normal', '600'], ['unbounded-latin-600-normal', '600'], ['unbounded-cyrillic-800-normal', '800'], ['unbounded-latin-800-normal', '800']]},
  oswald: {family: 'Oswald', kind: 'sans', files: [['oswald-cyrillic-600-normal', '600'], ['oswald-latin-600-normal', '600']]},
  comfortaa: {family: 'Comfortaa', kind: 'sans', files: [['comfortaa-cyrillic-700-normal', '700'], ['comfortaa-latin-700-normal', '700']]},
  'russo-one': {family: 'Russo One', kind: 'special', files: [['russo-one-cyrillic-400-normal', '400'], ['russo-one-latin-400-normal', '400']]},
  'noto-display': {family: 'NotoDisplay', kind: 'serif', files: [['noto-serif-display-cyrillic-wdth-italic', '100 900', 'italic', '62.5% 100%'], ['noto-serif-display-latin-wdth-italic', '100 900', 'italic', '62.5% 100%']]},
  playfair: {family: 'Playfair Display', kind: 'serif', files: [['playfair-display-cyrillic-700-normal', '700'], ['playfair-display-latin-700-normal', '700'], ['playfair-display-cyrillic-700-italic', '700', 'italic'], ['playfair-display-latin-700-italic', '700', 'italic'], ['playfair-display-cyrillic-900-normal', '900'], ['playfair-display-latin-900-normal', '900']]},
  lora: {family: 'Lora', kind: 'serif', files: [['lora-cyrillic-600-normal', '600'], ['lora-latin-600-normal', '600']]},
  'pt-serif': {family: 'PT Serif', kind: 'serif', files: [['pt-serif-cyrillic-700-normal', '700'], ['pt-serif-latin-700-normal', '700']]},
  caveat: {family: 'Caveat', kind: 'hand', files: [['caveat-cyrillic-700-normal', '700'], ['caveat-latin-700-normal', '700']]},
  'bad-script': {family: 'Bad Script', kind: 'hand', files: [['bad-script-cyrillic-400-normal', '400'], ['bad-script-latin-400-normal', '400']]},
  'marck-script': {family: 'Marck Script', kind: 'hand', files: [['marck-script-cyrillic-400-normal', '400'], ['marck-script-latin-400-normal', '400']]},
  neucha: {family: 'Neucha', kind: 'hand', files: [['neucha-cyrillic-400-normal', '400'], ['neucha-latin-400-normal', '400']]},
  pixelify: {family: 'Pixelify Sans', kind: 'special', files: [['pixelify-sans-cyrillic-700-normal', '700'], ['pixelify-sans-latin-700-normal', '700'], ['pixelify-sans-cyrillic-400-normal', '400'], ['pixelify-sans-latin-400-normal', '400']]},
  'press-start': {family: 'Press Start 2P', kind: 'special', files: [['press-start-2p-cyrillic-400-normal', '400'], ['press-start-2p-latin-400-normal', '400']]},
};
const fam = (id: string | undefined, def: string) => `'${(id && FONT_LIB[id]?.family) || FONT_LIB[def].family}'`;

/* Текущий паспорт. Ставится один раз при загрузке композиции (setPassport) — одинаково для всех кадров. */
export const STY = {radius: 1, motion: 'spring' as NonNullable<Passport['motion']>, shadow: true, texture: 'dots' as NonNullable<Passport['texture']>, passport: {} as Passport};
export const setPassport = (p?: Passport | null) => {
  const q = p || {};
  STY.passport = q; STY.radius = q.radius ?? 1; STY.motion = q.motion || 'spring'; STY.shadow = q.shadow ?? true; STY.texture = q.texture || 'dots';
};
/* CSS-переменные шрифтов — их читают SANS/SERIF/HAND из kit.ts */
export const fontVars = (p?: Passport | null): React.CSSProperties => ({
  ['--f-sans' as string]: fam(p?.fonts?.sans, 'inter-tight'),
  ['--f-serif' as string]: fam(p?.fonts?.serif, 'noto-display'),
  ['--f-hand' as string]: fam(p?.fonts?.hand, 'caveat'),
} as React.CSSProperties);
/* Скругление и тень по паспорту */
export const R = (n: number) => Math.round(n * STY.radius);
export const SH = (s: string) => (STY.shadow ? s : 'none');
/* Движение: множитель длительности и настройка пружины */
export const TEMPO = () => (STY.motion === 'soft' ? 1.35 : STY.motion === 'snappy' ? 0.72 : 1);
export const tuneSpring = (c: {damping?: number; stiffness?: number; mass?: number} = {}) => {
  const d = c.damping ?? 10, s = c.stiffness ?? 100, m = c.mass ?? 1;
  if (STY.motion === 'soft') return {...c, damping: d * 1.9, stiffness: s * 0.55, mass: m * 1.1};
  if (STY.motion === 'snappy') return {...c, damping: d * 1.5, stiffness: s * 1.8, mass: m * 0.8};
  return c;
};
