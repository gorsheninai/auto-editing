import {Easing, interpolate, spring as rSpring} from 'remotion';
import {STY, TEMPO, tuneSpring} from './style';
export {R as rad, SH as shd, STY} from './style';

/* Общее для блоков библиотеки: тема, шрифты, разбор данных из раскадровки. */
export type Theme = {dark: boolean; bg: string; ink: string; muted: string; accent: string; accent2: string; soft: string; card: string; line: string};
export const LIGHT: Theme = {dark: false, bg: '#F4F1EA', ink: '#1C1B22', muted: '#6B6A75', accent: '#7B61FF', accent2: '#FF6A2B', soft: '#CFC6FF', card: '#FFFFFF', line: 'rgba(28,27,34,.14)'};
export const DARK: Theme = {dark: true, bg: '#111317', ink: '#F4F1EA', muted: '#9AA1B3', accent: '#9B87FF', accent2: '#FF8A55', soft: '#3A3360', card: '#1C1F27', line: 'rgba(255,255,255,.14)'};
/* Тема блока: база светлая/тёмная + цвета паспорта (если заданы) + то, что пришло из ролика */
export const themeFrom = (t: {dark: boolean; bg: string; ink: string; accent: string} & Partial<Theme>): Theme => {
  const c = STY.passport.colors || {};
  const base = t.dark ? DARK : LIGHT;
  const pick = (k: keyof Theme) => ((t as any)[k] ?? (c as any)[k] ?? (base as any)[k]);
  return {...base, bg: pick('bg'), ink: pick('ink'), muted: pick('muted'), accent: pick('accent'), accent2: pick('accent2'), soft: pick('soft'), card: pick('card'), line: pick('line'), dark: t.dark};
};

/* Шрифты берутся из паспорта через CSS-переменные (fontVars в style.ts) */
export const SANS = "var(--f-sans, 'InterTight'), sans-serif";
export const SERIF = "var(--f-serif, 'NotoDisplay'), serif";
export const HAND = "var(--f-hand, 'Caveat'), cursive";
/* Пружина с характером движения из паспорта */
export const spring = (o: Parameters<typeof rSpring>[0]) => rSpring({...o, config: tuneSpring(o.config as any)});
export const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;
export const easeOut = Easing.bezier(0.16, 1, 0.3, 1);
export const ramp = (f: number, a: number, b: number) => interpolate(f, [a, a + Math.max(1, (b - a) * TEMPO())], [0, 1], {...clamp, easing: easeOut});
export const pop = (f: number, fps: number, at = 0, damping = 12) => spring({frame: f - at, fps, config: {damping, stiffness: 170, mass: 0.7}});

/* Данные блока. Строка из раскадровки: «MBars: я — 3 | они — 30 | заголовок: клиенты в месяц».
   Пункты через | или ;, внутри «подпись — значение» (или «подпись: значение», «подпись 30%»).
   Служебные пункты: «заголовок: …», «итог: …». */
export type Item = {label: string; value: number | null; shown: string; raw: string};
export type BlockData = {code: string; title: string; total: string; items: Item[]; text: string};
const NUM = /(-?\d[\d\s]*(?:[.,]\d+)?)\s*(%|₽|\$|руб\.?|тыс\.?|млн|млрд|k|к|м|x|×|раз)?/i;
const parseNum = (s: string): {value: number | null; shown: string} => {
  const m = s.match(NUM); if (!m) return {value: null, shown: s.trim()};
  let v = parseFloat(m[1].replace(/\s/g, '').replace(',', '.'));
  const u = (m[2] || '').toLowerCase();
  if (/^(тыс|k|к)/.test(u)) v *= 1e3; if (/^(млн|м)$/.test(u)) v *= 1e6; if (/^млрд/.test(u)) v *= 1e9;
  return {value: v, shown: s.trim()};
};
export function parseData(note: string, fallbackText = ''): BlockData {
  /* данные блока — до «//»; после — пояснение для человека, в кадр не идёт.
     Старые описания без «//»: хвост-предложение после точки («… — система. Тёмная сцена: механизм…») тоже отбрасываем */
  note = note.split('//')[0].replace(/\.\s+[А-ЯЁA-Z][^|;]{25,}$/s, '');
  const m = note.match(/^\s*([A-Z][A-Za-z0-9]+)\s*:?\s*(.*)$/s);
  const code = m ? m[1] : ''; const body = m ? m[2] : note;
  const d: BlockData = {code, title: '', total: '', items: [], text: fallbackText};
  for (const raw0 of body.split(/\s*[|;]\s*/)) {
    const raw = raw0.trim(); if (!raw) continue;
    const head = raw.match(/^(заголовок|title|итог|текст|text)\s*:\s*(.+)$/i);
    if (head) { const k = head[1].toLowerCase(); if (k === 'итог') d.total = head[2]; else if (k === 'текст' || k === 'text') d.text = head[2]; else d.title = head[2]; continue; }
    const parts = raw.split(/\s+[—–-]\s+|\s*:\s+/);
    if (parts.length >= 2) { const n = parseNum(parts.slice(1).join(' — ')); d.items.push({label: parts[0], value: n.value, shown: n.shown, raw}); continue; }
    const tail = raw.match(/^(.*?)\s+(-?\d[\d\s.,]*\s*(?:%|₽|\$|тыс\.?|млн|млрд|k|к|x|×)?)$/i);
    if (tail) { const n = parseNum(tail[2]); d.items.push({label: tail[1], value: n.value, shown: n.shown, raw}); continue; }
    const n = parseNum(raw); d.items.push({label: raw, value: /^\s*-?\d/.test(raw) ? n.value : null, shown: raw, raw});
  }
  if (!d.text && !d.items.length) d.text = body.trim();
  return d;
}
/* Число для счётчика: 30000 → «30 000», с единицей из исходной строки */
export const fmtNum = (v: number, like: string) => {
  const unit = (like.match(/(%|₽|\$|руб\.?|тыс\.?|млн|млрд|k|к|x|×|раз)\s*$/i) || [''])[0];
  let shown = v; if (/^тыс|^k|^к/i.test(unit)) shown = v / 1e3; else if (/^млн/i.test(unit)) shown = v / 1e6; else if (/^млрд/i.test(unit)) shown = v / 1e9;
  const dec = /[.,]\d/.test(like) ? 1 : 0;
  const s = shown.toFixed(dec).replace('.', ',').replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
  return unit ? `${s}${/^[%×x]$/.test(unit) ? '' : ' '}${unit}` : s;
};

/* Общие пропсы блока-сцены */
export type BlockProps = {data: BlockData; theme: Theme; zoneH: number; full: boolean; dur: number; marks?: number[]; speaker?: {src: string; from: number}};
/* Кадры появления пунктов: по словам раскадровки (marks), иначе равномерно в первой половине сцены */
export const beats = (n: number, dur: number, marks?: number[], start = 10) =>
  Array.from({length: n}, (_, i) => (marks && marks[i] != null ? marks[i] : Math.round(start + i * Math.min(16, (dur * 0.55 - start) / Math.max(1, n)))));
