import type {Story} from './types';
export const theme = (st: Story) => {
  const dark = /тём|dark/i.test(st.settings.bg || '');
  return {
    dark,
    bg: dark ? '#111317' : '#F4F1EA',
    dot: dark ? 'rgba(255,255,255,0.10)' : '#CFC6FF',
    ink: dark ? '#F4F1EA' : '#1C1B22',
    muted: dark ? '#9AA1B3' : '#5A6072',
    accent: st.settings.accent || '#7B61FF',
    plate: dark ? 'rgba(17,19,23,0.9)' : 'rgba(244,241,234,0.94)',
  };
};
