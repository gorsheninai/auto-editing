// Данные ролика с пульта (tools/pult_to_story.py пишет src/story.json)
export type Win = 'popout' | 'window' | 'circle' | 'strip';
export type Mode = 'A' | 'B' | 'C';
export type Kind = 'speaker' | 'l2d' | 'gen' | 'motion' | 'd3' | 'kinetic' | 'media';
export type Word = {w: string; s: number; e: number};
export type AnimParams = {
  style?: string;          // готовый стиль субтитров из blocks/subs.tsx (SubKaraoke…) — перекрывает остальные поля
  keywords?: string[];      // ключевые слова для SubMarker/SubStamp/SubStack (иначе выбираются сами)
  unit?: 'word' | 'char' | 'line' | 'block';
  enter?: 'fade' | 'slideUp' | 'slideDown' | 'slideLeft' | 'slideRight' | 'scale' | 'pop' | 'typewriter' | 'mask' | 'blur' | 'cut';
  duration_ms?: number; stagger_ms?: number; easing?: 'spring' | 'easeOut' | 'easeInOut' | 'linear';
  overshoot?: number; distance_px?: number; start_scale?: number; blur_px?: number;
  emphasis?: {type?: 'none' | 'color' | 'box' | 'underline' | 'scale'; color?: string; box_color?: string};
  box?: {use?: boolean; color?: string; radius_px?: number; padding_px?: number};
  position?: 'top' | 'center' | 'bottom'; case?: 'lower' | 'upper' | 'as_is'; words_per_screen?: number;
  color?: string; exit?: 'none' | 'fade' | 'cut' | 'slideUp' | 'scale'; exit_ms?: number;
};
export type Row = {
  s: number; e: number; text: string; mode: Mode; kind?: Kind; win?: Win; note?: string;
  media?: string;          // имя файла в public/media (вставка пользователя или pic_N.png)
  frame?: 'auto' | 'phone' | 'window' | 'painting' | 'product' | 'poster' | 'plain';
  scene?: string;          // код своей сцены из registry.tsx — перекрывает kind
  layer?: {bg?: string; pose?: string; props?: string[]}; // для l2d без своей сцены: файлы в public
  tr?: string;             // переход НА этот сегмент: TrWhip | TrZoom | TrFocus | TrGlitch | TrPage
  fx?: string;             // эффект на сегмент: FxVhs | FxConfetti
  ov?: {code: string; x?: number; y?: number; w?: number; h?: number; to?: [number, number]; text?: string; at?: number}[]; // пометки InkUnderline | InkCircle | InkArrow | PaperSticker
  marks?: number[];        // индексы слов (в words), на которых появляются пункты моушн-сцены
};
export type Story = {
  fps: number; duration: number;
  settings: {bg: 'светлая' | 'тёмная' | string; accent?: string; subWords?: number; subColor?: string; win?: Win;
    subAnim?: AnimParams | null; titleAnim?: AnimParams | null; backdrop?: string; punch?: boolean; progress?: boolean; avatar?: string; avatarCut?: string; speed?: number};
  words: Word[]; rows: Row[];
};
