import type {Story} from './types';
/* Светлота цвета 0…1 — чтобы понять, тёмный ли фон паспорта */
const lum = (hex: string) => { const m = hex.replace('#', '').match(/^([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})/i); if (!m) return 1; const [r, g, b] = m.slice(1).map((x) => parseInt(x, 16) / 255); return 0.2126 * r + 0.7152 * g + 0.0722 * b; };
export const theme = (st: Story) => {
  const c = st.settings.passport?.colors || {};
  const dark = c.bg ? lum(c.bg) < 0.45 : /тём|dark/i.test(st.settings.bg || '');
  return {
    dark,
    bg: c.bg || (dark ? '#111317' : '#F4F1EA'),
    dot: c.soft || (dark ? 'rgba(255,255,255,0.10)' : '#CFC6FF'),
    ink: c.ink || (dark ? '#F4F1EA' : '#1C1B22'),
    muted: c.muted || (dark ? '#9AA1B3' : '#5A6072'),
    accent: c.accent || st.settings.accent || '#7B61FF',
    plate: dark ? 'rgba(17,19,23,0.9)' : 'rgba(244,241,234,0.94)',
  };
};
