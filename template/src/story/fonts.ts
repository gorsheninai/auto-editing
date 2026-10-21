import {continueRender, delayRender, staticFile} from 'remotion';
// Шрифты студии (public/fonts). Без зависимости от kit.tsx/words.json.
const FILES: [string, string, string, string, string?][] = [
  ['InterTight', 'inter-tight-cyrillic-700-normal', '700', 'normal'],
  ['InterTight', 'inter-tight-latin-700-normal', '700', 'normal'],
  ['InterTight', 'inter-tight-cyrillic-600-normal', '600', 'normal'],
  ['InterTight', 'inter-tight-latin-600-normal', '600', 'normal'],
  ['NotoDisplay', 'noto-serif-display-cyrillic-wdth-italic', '100 900', 'italic', '62.5% 100%'],
  ['Caveat', 'caveat-cyrillic-700-normal', '700', 'normal'],
  ['Pixelify Sans', 'pixelify-sans-cyrillic-700-normal', '700', 'normal'],
  ['Pixelify Sans', 'pixelify-sans-latin-700-normal', '700', 'normal'],
  ['Caveat', 'caveat-latin-700-normal', '700', 'normal'],
  ['NotoDisplay', 'noto-serif-display-latin-wdth-italic', '100 900', 'italic', '62.5% 100%'],
];
let started = false;
export const useStoryFonts = () => {
  if (started) return; started = true;
  const h = delayRender('story-fonts');
  Promise.all(FILES.map(([fam, file, weight, style, stretch]) =>
    new FontFace(fam, `url(${staticFile(`fonts/${file}.woff2`)})`, stretch ? {weight, style, stretch} : {weight, style})
      .load().then((l) => document.fonts.add(l)).catch(() => null)))
    .then(() => continueRender(h));
};
