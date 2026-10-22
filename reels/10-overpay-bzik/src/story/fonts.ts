import {continueRender, delayRender, staticFile} from 'remotion';
import {FONT_LIB} from '../blocks/style';
// Шрифты студии (public/fonts) — вся библиотека из blocks/style.ts, паспорт выбирает нужные через CSS-переменные.
let started = false;
export const useStoryFonts = () => {
  if (started) return; started = true;
  const h = delayRender('story-fonts');
  const all = Object.values(FONT_LIB).flatMap((f) => f.files.map(([file, weight, style, stretch]) => ({fam: f.family, file, weight, style: style || 'normal', stretch})));
  Promise.all(all.map(({fam, file, weight, style, stretch}) =>
    new FontFace(fam, `url(${staticFile(`fonts/${file}.woff2`)})`, stretch ? {weight, style, stretch} : {weight, style})
      .load().then((l) => document.fonts.add(l)).catch(() => null)))
    .then(() => continueRender(h));
};
